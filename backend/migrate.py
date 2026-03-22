"""
migrate.py — SocietyPro data migration helper

Usage:
    # Initialise Alembic (first time):
    alembic init alembic
    # Then point alembic/env.py at models.Base and run:
    alembic revision --autogenerate -m "initial"
    alembic upgrade head

    # Migrate data from SQLite → MSSQL:
    python migrate.py --from sqlite --to mssql
"""

import argparse
import json
import sys
from datetime import datetime

from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker

from config import settings
from models import Base


# ──────────────────────────────────────────────────────────────────────────────
# Connection helpers
# ──────────────────────────────────────────────────────────────────────────────

def sqlite_engine():
    path = settings.sqlite_path or "./societypro.db"
    return create_engine(f"sqlite:///{path}", echo=False)


def mssql_engine():
    s = settings
    if not all([s.mssql_server, s.mssql_database, s.mssql_username, s.mssql_password]):
        print("ERROR: MSSQL credentials incomplete. Check config / .env.")
        sys.exit(1)
    url = (
        f"mssql+pyodbc://{s.mssql_username}:{s.mssql_password}"
        f"@{s.mssql_server}/{s.mssql_database}"
        "?driver=ODBC+Driver+17+for+SQL+Server&TrustServerCertificate=yes"
    )
    return create_engine(url, echo=False)


def engine_for(db_type: str):
    return sqlite_engine() if db_type == "sqlite" else mssql_engine()


# ──────────────────────────────────────────────────────────────────────────────
# Schema creation
# ──────────────────────────────────────────────────────────────────────────────

def create_schema(engine):
    """Create all tables on the target engine."""
    print(f"  Creating schema on {engine.url.drivername}…")
    Base.metadata.create_all(engine)
    print("  Schema created.")


# ──────────────────────────────────────────────────────────────────────────────
# Data migration
# ──────────────────────────────────────────────────────────────────────────────

TABLE_ORDER = [
    "societies", "towers", "flats",
    "users",
    "transactions", "bills",
    "complaints", "visitors", "announcements",
    "assets", "asset_maintenance_logs",
    "vendors", "budgets",
    "polls", "poll_votes",
    "documents", "notifications", "audit_logs", "app_settings",
]


def migrate_data(src_engine, dst_engine):
    inspector = inspect(src_engine)
    existing_tables = set(inspector.get_table_names())

    with src_engine.connect() as src_conn, dst_engine.connect() as dst_conn:
        for table in TABLE_ORDER:
            if table not in existing_tables:
                print(f"  Skipping {table} (not found in source)")
                continue

            rows = src_conn.execute(text(f"SELECT * FROM {table}")).mappings().all()
            if not rows:
                print(f"  {table}: (empty)")
                continue

            cols = list(rows[0].keys())
            placeholders = ", ".join([f":{c}" for c in cols])
            col_list = ", ".join(cols)

            # Dialect-aware INSERT
            if dst_engine.dialect.name == "mssql":
                # Enable identity insert for tables with auto-inc PKs
                try:
                    dst_conn.execute(text(f"SET IDENTITY_INSERT {table} ON"))
                except Exception:
                    pass

            insert_sql = text(
                f"INSERT INTO {table} ({col_list}) VALUES ({placeholders})"
            )

            batch = [dict(r) for r in rows]
            dst_conn.execute(insert_sql, batch)

            if dst_engine.dialect.name == "mssql":
                try:
                    dst_conn.execute(text(f"SET IDENTITY_INSERT {table} OFF"))
                except Exception:
                    pass

            print(f"  {table}: {len(batch)} rows migrated")

        dst_conn.commit()
    print("Migration complete.")


# ──────────────────────────────────────────────────────────────────────────────
# CLI
# ──────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="SocietyPro data migration")
    parser.add_argument("--from", dest="src", choices=["sqlite", "mssql"], required=True)
    parser.add_argument("--to",   dest="dst", choices=["sqlite", "mssql"], required=True)
    parser.add_argument("--schema-only", action="store_true",
                        help="Only create the schema, do not copy data")
    args = parser.parse_args()

    if args.src == args.dst:
        print("Source and destination are the same — nothing to do.")
        sys.exit(0)

    print(f"\nSocietyPro Migration  {args.src} → {args.dst}")
    print("=" * 50)

    src_eng = engine_for(args.src)
    dst_eng = engine_for(args.dst)

    print("\n[1/2] Creating schema on destination…")
    create_schema(dst_eng)

    if not args.schema_only:
        print("\n[2/2] Copying data…")
        migrate_data(src_eng, dst_eng)
    else:
        print("\n[2/2] Skipped (--schema-only)")

    print("\nDone. Update DB_TYPE in your .env and restart the app.")


if __name__ == "__main__":
    main()
