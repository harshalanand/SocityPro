from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt  # PyJWT

from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import random, string

from config import settings
from database import get_db
from models import User, UserRole

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


# ─── Dependencies ─────────────────────────────────────────────────────────────

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    payload = decode_token(credentials.credentials)
    user_id: int = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user

def require_role(*roles: UserRole):
    def checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(status_code=403, detail=f"Role '{current_user.role}' not authorized")
        return current_user
    return checker

def require_superadmin(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPERADMIN:
        raise HTTPException(status_code=403, detail="SuperAdmin access required")
    return current_user

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPERADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# alias used in some routers
require_admin_or_above = require_admin

def require_society_access(society_id: int, current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.SUPERADMIN:
        return current_user
    if current_user.society_id != society_id:
        raise HTTPException(status_code=403, detail="Access denied for this society")
    return current_user

# ─── TOTP stubs (pyotp removed for Python 3.13 compatibility) ────────────────
def get_totp_secret() -> str:
    import secrets, base64
    return base64.b32encode(secrets.token_bytes(20)).decode()

def verify_totp(secret: str, token: str) -> bool:
    # Full TOTP verification requires pyotp — install separately if needed
    return False
