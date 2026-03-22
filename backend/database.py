from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import get_database_url, settings
import os

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

def create_db_engine():
    db_url = get_database_url()
    if settings.DB_TYPE == "sqlite":
        engine = create_engine(
            db_url,
            connect_args={"check_same_thread": False},
            echo=settings.DEBUG
        )
        # Enable WAL mode for better concurrency
        @event.listens_for(engine, "connect")
        def set_sqlite_pragma(dbapi_conn, _):
            cursor = dbapi_conn.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()
    else:
        engine = create_engine(db_url, echo=settings.DEBUG, pool_pre_ping=True)
    return engine

engine = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def recreate_engine():
    """Called after DB settings change"""
    global engine, SessionLocal
    engine = create_db_engine()
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
