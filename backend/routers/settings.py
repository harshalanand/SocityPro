from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db, recreate_engine
from models import AppSetting, User, UserRole
from schemas import SettingUpdate, DBConfigUpdate
from auth import get_current_user, require_superadmin, require_admin_or_above
from config import settings

router = APIRouter(prefix="/settings", tags=["Settings"])

# Default settings structure
DEFAULT_SETTINGS = [
    # General
    {"key": "app_name", "value": "SocietyPro", "category": "general", "description": "Application name"},
    {"key": "app_timezone", "value": "Asia/Kolkata", "category": "general", "description": "Default timezone"},
    {"key": "currency", "value": "INR", "category": "general", "description": "Currency symbol"},
    {"key": "date_format", "value": "DD/MM/YYYY", "category": "general", "description": "Date format"},
    # Billing
    {"key": "maintenance_due_day", "value": "10", "category": "billing", "description": "Day of month bills are due"},
    {"key": "late_fee_percent", "value": "2", "category": "billing", "description": "Late fee percentage per month"},
    {"key": "auto_generate_bills", "value": "true", "category": "billing", "description": "Auto-generate monthly bills"},
    {"key": "penalty_grace_days", "value": "5", "category": "billing", "description": "Grace days before penalty"},
    # Notifications
    {"key": "sms_enabled", "value": "false", "category": "notifications", "description": "Enable SMS notifications"},
    {"key": "email_enabled", "value": "false", "category": "notifications", "description": "Enable email notifications"},
    {"key": "whatsapp_enabled", "value": "false", "category": "notifications", "description": "Enable WhatsApp notifications"},
    {"key": "payment_reminder_days", "value": "3,7", "category": "notifications", "description": "Days before due to send reminders"},
    # SMS
    {"key": "sms_provider", "value": "twilio", "category": "sms", "description": "SMS provider (twilio/msg91)"},
    {"key": "twilio_account_sid", "value": "", "category": "sms", "is_secret": True, "description": "Twilio Account SID"},
    {"key": "twilio_auth_token", "value": "", "category": "sms", "is_secret": True, "description": "Twilio Auth Token"},
    {"key": "twilio_from_number", "value": "", "category": "sms", "description": "Twilio from number"},
    {"key": "msg91_auth_key", "value": "", "category": "sms", "is_secret": True, "description": "MSG91 Auth Key"},
    # Email
    {"key": "email_provider", "value": "smtp", "category": "email", "description": "Email provider (smtp/sendgrid)"},
    {"key": "sendgrid_api_key", "value": "", "category": "email", "is_secret": True, "description": "SendGrid API Key"},
    {"key": "smtp_host", "value": "", "category": "email", "description": "SMTP Host"},
    {"key": "smtp_port", "value": "587", "category": "email", "description": "SMTP Port"},
    {"key": "smtp_username", "value": "", "category": "email", "description": "SMTP Username"},
    {"key": "smtp_password", "value": "", "category": "email", "is_secret": True, "description": "SMTP Password"},
    {"key": "email_from", "value": "noreply@societypro.com", "category": "email", "description": "From email address"},
    # WhatsApp
    {"key": "whatsapp_provider", "value": "twilio", "category": "whatsapp", "description": "WhatsApp provider"},
    {"key": "whatsapp_from", "value": "", "category": "whatsapp", "description": "WhatsApp from number"},
    {"key": "wati_api_endpoint", "value": "", "category": "whatsapp", "description": "WATI API Endpoint"},
    {"key": "wati_access_token", "value": "", "category": "whatsapp", "is_secret": True, "description": "WATI Access Token"},
    # Database
    {"key": "db_type", "value": "sqlite", "category": "database", "description": "Database type (sqlite/mssql)"},
    {"key": "sqlite_path", "value": "./societypro.db", "category": "database", "description": "SQLite file path"},
    {"key": "mssql_server", "value": "", "category": "database", "description": "MSSQL server address"},
    {"key": "mssql_database", "value": "", "category": "database", "description": "MSSQL database name"},
    {"key": "mssql_username", "value": "", "category": "database", "description": "MSSQL username"},
    {"key": "mssql_password", "value": "", "category": "database", "is_secret": True, "description": "MSSQL password"},
    # Security
    {"key": "session_timeout_minutes", "value": "1440", "category": "security", "description": "Session timeout (minutes)"},
    {"key": "require_otp_login", "value": "false", "category": "security", "description": "Require OTP for login"},
    {"key": "password_min_length", "value": "8", "category": "security", "description": "Minimum password length"},
]


def init_default_settings(db: Session):
    """Initialize default settings if not exists"""
    for s in DEFAULT_SETTINGS:
        existing = db.query(AppSetting).filter(AppSetting.key == s["key"]).first()
        if not existing:
            setting = AppSetting(
                key=s["key"], value=s["value"],
                category=s["category"],
                is_secret=s.get("is_secret", False),
                description=s.get("description", "")
            )
            db.add(setting)
    db.commit()


@router.get("/")
def get_all_settings(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above)
):
    """Get all settings (admins and above). Secrets are masked."""
    init_default_settings(db)
    q = db.query(AppSetting)
    if category:
        q = q.filter(AppSetting.category == category)
    items = q.order_by(AppSetting.category, AppSetting.key).all()
    return [
        {
            "id": s.id, "key": s.key,
            "value": "***" if s.is_secret and s.value else s.value,
            "category": s.category, "is_secret": s.is_secret,
            "description": s.description
        }
        for s in items
    ]


@router.get("/categories")
def get_setting_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above)
):
    from sqlalchemy import distinct
    cats = db.query(distinct(AppSetting.category)).all()
    return [c[0] for c in cats]


@router.put("/")
def update_setting(
    payload: SettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin)
):
    setting = db.query(AppSetting).filter(AppSetting.key == payload.key).first()
    if not setting:
        setting = AppSetting(key=payload.key)
        db.add(setting)
    setting.value = payload.value
    if payload.category:
        setting.category = payload.category
    setting.is_secret = payload.is_secret
    setting.updated_by_id = current_user.id
    db.commit()
    return {"message": f"Setting '{payload.key}' updated"}


@router.put("/bulk")
def bulk_update_settings(
    payload: List[SettingUpdate],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin)
):
    for item in payload:
        setting = db.query(AppSetting).filter(AppSetting.key == item.key).first()
        if not setting:
            setting = AppSetting(key=item.key, category=item.category)
            db.add(setting)
        setting.value = item.value
        if item.category:
            setting.category = item.category
        setting.is_secret = item.is_secret
        setting.updated_by_id = current_user.id
    db.commit()
    return {"message": f"Updated {len(payload)} settings"}


@router.post("/database/test")
def test_db_connection(
    payload: DBConfigUpdate,
    current_user: User = Depends(require_superadmin)
):
    """Test database connection before switching"""
    try:
        if payload.db_type == "sqlite":
            from sqlalchemy import create_engine
            engine = create_engine(f"sqlite:///{payload.sqlite_path or './test.db'}")
            with engine.connect() as conn:
                from sqlalchemy import text
                conn.execute(text("SELECT 1"))
            return {"success": True, "message": "SQLite connection successful"}
        elif payload.db_type == "mssql":
            conn_str = (
                f"mssql+pyodbc://{payload.mssql_username}:{payload.mssql_password}"
                f"@{payload.mssql_server}/{payload.mssql_database}"
                f"?driver={payload.mssql_driver or 'ODBC Driver 17 for SQL Server'}"
            )
            from sqlalchemy import create_engine
            engine = create_engine(conn_str.replace(" ", "+"), connect_args={"timeout": 5})
            with engine.connect() as conn:
                from sqlalchemy import text
                conn.execute(text("SELECT 1"))
            return {"success": True, "message": "MSSQL connection successful"}
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.post("/database/switch")
def switch_database(
    payload: DBConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin)
):
    """Switch database configuration"""
    # Save to settings table
    updates = {"db_type": payload.db_type}
    if payload.db_type == "sqlite" and payload.sqlite_path:
        updates["sqlite_path"] = payload.sqlite_path
    elif payload.db_type == "mssql":
        updates.update({
            "mssql_server": payload.mssql_server or "",
            "mssql_database": payload.mssql_database or "",
            "mssql_username": payload.mssql_username or "",
            "mssql_password": payload.mssql_password or "",
        })

    for key, value in updates.items():
        setting = db.query(AppSetting).filter(AppSetting.key == key).first()
        if not setting:
            setting = AppSetting(key=key, category="database")
            db.add(setting)
        setting.value = value
    db.commit()

    # Update config and recreate engine
    settings.DB_TYPE = payload.db_type
    if payload.db_type == "sqlite":
        settings.SQLITE_PATH = payload.sqlite_path or settings.SQLITE_PATH
    elif payload.db_type == "mssql":
        settings.MSSQL_SERVER = payload.mssql_server
        settings.MSSQL_DATABASE = payload.mssql_database
        settings.MSSQL_USERNAME = payload.mssql_username
        settings.MSSQL_PASSWORD = payload.mssql_password

    recreate_engine()

    # Re-create tables on new DB
    from database import engine, Base
    import models  # noqa - ensure all models imported
    Base.metadata.create_all(bind=engine)

    return {"message": f"Database switched to {payload.db_type}. Tables created."}


@router.post("/notifications/test")
def test_notification(
    channel: str,  # sms, email, whatsapp
    recipient: str,
    message: str = "Test notification from SocietyPro",
    current_user: User = Depends(require_superadmin)
):
    """Send a test notification"""
    try:
        if channel == "sms":
            # Twilio SMS
            result = _send_sms_test(recipient, message)
        elif channel == "email":
            result = _send_email_test(recipient, message)
        elif channel == "whatsapp":
            result = _send_whatsapp_test(recipient, message)
        else:
            raise HTTPException(400, "Invalid channel")
        return {"success": True, "message": result}
    except Exception as e:
        return {"success": False, "message": str(e)}


def _send_sms_test(to: str, message: str) -> str:
    return f"[SIMULATED] SMS sent to {to}: {message}"

def _send_email_test(to: str, message: str) -> str:
    return f"[SIMULATED] Email sent to {to}: {message}"

def _send_whatsapp_test(to: str, message: str) -> str:
    return f"[SIMULATED] WhatsApp sent to {to}: {message}"
