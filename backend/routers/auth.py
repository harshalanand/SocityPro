from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from models import User, UserRole, AuditLog
from schemas import LoginRequest, OTPRequest, OTPVerify, TokenResponse, UserCreate
from auth import (
    hash_password, verify_password, create_access_token,
    generate_otp, get_totp_secret, get_current_user
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

# In-memory OTP store (use Redis in production)
otp_store: dict = {}


@router.post("/register", response_model=dict)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(400, "Email already registered")
    if db.query(User).filter(User.mobile == payload.mobile).first():
        raise HTTPException(400, "Mobile already registered")

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        mobile=payload.mobile,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        society_id=payload.society_id,
        flat_id=payload.flat_id,
        resident_type=payload.resident_type,
        is_approved=payload.role == UserRole.SUPERADMIN,  # Auto-approve superadmin
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "Registration successful. Awaiting admin approval.", "user_id": user.id}


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")
    if not user.is_active:
        raise HTTPException(403, "Account is deactivated")
    if not user.is_approved:
        raise HTTPException(403, "Account pending admin approval")

    user.last_login = datetime.utcnow()
    db.commit()

    token = create_access_token({"sub": str(user.id), "role": user.role, "society_id": user.society_id})
    return TokenResponse(
        access_token=token,
        user={
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "society_id": user.society_id,
            "flat_id": user.flat_id,
        }
    )


@router.post("/send-otp")
def send_otp(payload: OTPRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.mobile == payload.mobile).first()
    if not user:
        raise HTTPException(404, "Mobile not registered")
    otp = generate_otp()
    otp_store[payload.mobile] = {"otp": otp, "expires": datetime.utcnow().timestamp() + 300}
    # In production: send via SMS/WhatsApp
    print(f"[DEV] OTP for {payload.mobile}: {otp}")
    return {"message": "OTP sent successfully"}


@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(payload: OTPVerify, db: Session = Depends(get_db)):
    stored = otp_store.get(payload.mobile)
    if not stored or stored["otp"] != payload.otp:
        raise HTTPException(400, "Invalid OTP")
    if datetime.utcnow().timestamp() > stored["expires"]:
        raise HTTPException(400, "OTP expired")

    user = db.query(User).filter(User.mobile == payload.mobile).first()
    del otp_store[payload.mobile]

    token = create_access_token({"sub": str(user.id), "role": user.role, "society_id": user.society_id})
    return TokenResponse(
        access_token=token,
        user={"id": user.id, "full_name": user.full_name, "email": user.email, "role": user.role}
    )


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "mobile": current_user.mobile,
        "role": current_user.role,
        "society_id": current_user.society_id,
        "flat_id": current_user.flat_id,
        "resident_type": current_user.resident_type,
        "is_approved": current_user.is_approved,
    }


@router.post("/change-password")
def change_password(
    old_password: str, new_password: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(old_password, current_user.hashed_password):
        raise HTTPException(400, "Old password is incorrect")
    current_user.hashed_password = hash_password(new_password)
    db.commit()
    return {"message": "Password changed successfully"}
