from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
import random, string

from database import get_db
from models import (
    User, UserRole, Complaint, ComplaintStatus, Visitor, VisitorStatus,
    Announcement, Asset, AssetMaintenanceLog, Vendor, Poll, PollVote,
    Document, Budget, AuditLog, Notification, NotificationChannel
)
from schemas import (
    UserCreate, UserUpdate, UserResponse,
    ComplaintCreate, ComplaintUpdate,
    VisitorCreate, AnnouncementCreate,
    AssetCreate, AssetMaintenanceLogCreate,
    VendorCreate, PollCreate, PollVoteCreate,
    BudgetCreate
)
from auth import get_current_user, require_admin_or_above, require_superadmin

# ─── Users Router ─────────────────────────────────────────────────────────────
users_router = APIRouter(prefix="/users", tags=["Users"])

@users_router.get("/", response_model=List[dict])
def list_users(
    society_id: Optional[int] = None,
    role: Optional[str] = None,
    is_approved: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(User)
    if current_user.role != UserRole.SUPERADMIN:
        q = q.filter(User.society_id == current_user.society_id)
    elif society_id:
        q = q.filter(User.society_id == society_id)
    if role:
        q = q.filter(User.role == role)
    if is_approved is not None:
        q = q.filter(User.is_approved == is_approved)
    users = q.all()
    return [{"id": u.id, "full_name": u.full_name, "email": u.email,
             "mobile": u.mobile, "role": u.role, "flat_id": u.flat_id,
             "is_active": u.is_active, "is_approved": u.is_approved,
             "society_id": u.society_id, "created_at": u.created_at} for u in users]


@users_router.post("/")
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above)
):
    from auth import hash_password
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(400, "Email already exists")
    user = User(**payload.model_dump(exclude={"password"}),
                hashed_password=hash_password(payload.password), is_approved=True)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@users_router.put("/{user_id}")
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    for f, v in payload.model_dump(exclude_none=True).items():
        setattr(user, f, v)
    db.commit()
    return {"message": "Updated"}


@users_router.post("/{user_id}/approve")
def approve_user(
    user_id: int, db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.is_approved = True
    db.commit()
    return {"message": "User approved"}


# ─── Complaints Router ────────────────────────────────────────────────────────
complaints_router = APIRouter(prefix="/societies/{society_id}/complaints", tags=["Complaints"])

@complaints_router.get("/")
def list_complaints(
    society_id: int,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Complaint).filter(Complaint.society_id == society_id)
    if current_user.role == UserRole.RESIDENT:
        q = q.filter(Complaint.created_by_id == current_user.id)
    if status:
        q = q.filter(Complaint.status == status)
    complaints = q.order_by(Complaint.created_at.desc()).all()
    return [{"id": c.id, "category": c.category, "title": c.title,
             "status": c.status, "priority": c.priority,
             "created_at": c.created_at, "resolved_at": c.resolved_at} for c in complaints]


@complaints_router.post("/")
def create_complaint(
    society_id: int, payload: ComplaintCreate,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    complaint = Complaint(society_id=society_id, created_by_id=current_user.id, **payload.model_dump())
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint


@complaints_router.put("/{complaint_id}")
def update_complaint(
    society_id: int, complaint_id: int, payload: ComplaintUpdate,
    db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_above)
):
    c = db.query(Complaint).filter(Complaint.id == complaint_id, Complaint.society_id == society_id).first()
    if not c:
        raise HTTPException(404, "Complaint not found")
    for f, v in payload.model_dump(exclude_none=True).items():
        setattr(c, f, v)
    if payload.status == ComplaintStatus.RESOLVED:
        c.resolved_at = datetime.utcnow()
    db.commit()
    return {"message": "Updated"}


# ─── Visitors Router ──────────────────────────────────────────────────────────
visitors_router = APIRouter(prefix="/societies/{society_id}/visitors", tags=["Visitors"])

@visitors_router.get("/")
def list_visitors(
    society_id: int, status: Optional[str] = None,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    q = db.query(Visitor).filter(Visitor.society_id == society_id)
    if status:
        q = q.filter(Visitor.status == status)
    visitors = q.order_by(Visitor.created_at.desc()).limit(100).all()
    return [{"id": v.id, "visitor_name": v.visitor_name, "visitor_mobile": v.visitor_mobile,
             "purpose": v.purpose, "status": v.status, "otp_code": v.otp_code,
             "check_in_time": v.check_in_time, "check_out_time": v.check_out_time,
             "is_delivery": v.is_delivery, "created_at": v.created_at} for v in visitors]


@visitors_router.post("/")
def create_visitor(
    society_id: int, payload: VisitorCreate,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    otp = "".join(random.choices(string.digits, k=6))
    visitor = Visitor(
        society_id=society_id,
        **payload.model_dump(),
        otp_code=otp,
        status=VisitorStatus.PENDING
    )
    db.add(visitor)
    db.commit()
    db.refresh(visitor)
    return visitor


@visitors_router.post("/{visitor_id}/checkin")
def checkin_visitor(
    society_id: int, visitor_id: int, otp: str,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    v = db.query(Visitor).filter(Visitor.id == visitor_id, Visitor.society_id == society_id).first()
    if not v:
        raise HTTPException(404, "Visitor not found")
    if v.otp_code != otp:
        raise HTTPException(400, "Invalid OTP")
    v.status = VisitorStatus.CHECKED_IN
    v.check_in_time = datetime.utcnow()
    db.commit()
    return {"message": "Checked in"}


@visitors_router.post("/{visitor_id}/checkout")
def checkout_visitor(
    society_id: int, visitor_id: int,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    v = db.query(Visitor).filter(Visitor.id == visitor_id, Visitor.society_id == society_id).first()
    if not v:
        raise HTTPException(404, "Not found")
    v.status = VisitorStatus.CHECKED_OUT
    v.check_out_time = datetime.utcnow()
    db.commit()
    return {"message": "Checked out"}


# ─── Announcements Router ─────────────────────────────────────────────────────
announcements_router = APIRouter(prefix="/societies/{society_id}/announcements", tags=["Announcements"])

@announcements_router.get("/")
def list_announcements(
    society_id: int, category: Optional[str] = None,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    q = db.query(Announcement).filter(Announcement.society_id == society_id)
    if category:
        q = q.filter(Announcement.category == category)
    items = q.order_by(Announcement.is_pinned.desc(), Announcement.created_at.desc()).all()
    return [{"id": a.id, "title": a.title, "content": a.content,
             "category": a.category, "is_pinned": a.is_pinned,
             "publish_date": a.publish_date, "expiry_date": a.expiry_date} for a in items]


@announcements_router.post("/")
def create_announcement(
    society_id: int, payload: AnnouncementCreate,
    db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_above)
):
    ann = Announcement(society_id=society_id, created_by_id=current_user.id, **payload.model_dump())
    db.add(ann)
    db.commit()
    db.refresh(ann)
    return ann


@announcements_router.delete("/{ann_id}")
def delete_announcement(
    society_id: int, ann_id: int,
    db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_above)
):
    a = db.query(Announcement).filter(Announcement.id == ann_id, Announcement.society_id == society_id).first()
    if not a:
        raise HTTPException(404, "Not found")
    db.delete(a)
    db.commit()
    return {"message": "Deleted"}


# ─── Assets Router ────────────────────────────────────────────────────────────
assets_router = APIRouter(prefix="/societies/{society_id}/assets", tags=["Assets"])

@assets_router.get("/")
def list_assets(
    society_id: int, db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assets = db.query(Asset).filter(Asset.society_id == society_id).all()
    return [{"id": a.id, "name": a.name, "category": a.category, "status": a.status,
             "purchase_value": a.purchase_value, "last_service_date": a.last_service_date,
             "next_service_date": a.next_service_date} for a in assets]


@assets_router.post("/")
def create_asset(
    society_id: int, payload: AssetCreate,
    db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_above)
):
    asset = Asset(society_id=society_id, **payload.model_dump())
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


@assets_router.post("/{asset_id}/logs")
def add_maintenance_log(
    society_id: int, asset_id: int, payload: AssetMaintenanceLogCreate,
    db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_above)
):
    log = AssetMaintenanceLog(asset_id=asset_id, **payload.model_dump())
    db.add(log)
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if asset and payload.next_service_date:
        asset.next_service_date = payload.next_service_date
        asset.last_service_date = payload.service_date
    db.commit()
    return {"message": "Log added"}


# ─── Vendors Router ───────────────────────────────────────────────────────────
vendors_router = APIRouter(prefix="/societies/{society_id}/vendors", tags=["Vendors"])

@vendors_router.get("/")
def list_vendors(
    society_id: int, db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vendors = db.query(Vendor).filter(Vendor.society_id == society_id).all()
    return [{"id": v.id, "name": v.name, "category": v.category,
             "contact_person": v.contact_person, "mobile": v.mobile,
             "is_active": v.is_active, "rating": v.rating} for v in vendors]


@vendors_router.post("/")
def create_vendor(
    society_id: int, payload: VendorCreate,
    db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_above)
):
    vendor = Vendor(society_id=society_id, **payload.model_dump())
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return vendor


# ─── Budget Router ────────────────────────────────────────────────────────────
budget_router = APIRouter(prefix="/societies/{society_id}/budget", tags=["Budget"])

@budget_router.get("/")
def list_budgets(
    society_id: int, financial_year: Optional[str] = None,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    q = db.query(Budget).filter(Budget.society_id == society_id)
    if financial_year:
        q = q.filter(Budget.financial_year == financial_year)
    budgets = q.all()
    return [{"id": b.id, "financial_year": b.financial_year, "category": b.category,
             "planned_amount": b.planned_amount, "actual_amount": b.actual_amount,
             "variance": b.planned_amount - b.actual_amount} for b in budgets]


@budget_router.post("/")
def create_budget(
    society_id: int, payload: BudgetCreate,
    db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_above)
):
    budget = Budget(society_id=society_id, **payload.model_dump())
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


# ─── Polls Router ─────────────────────────────────────────────────────────────
polls_router = APIRouter(prefix="/societies/{society_id}/polls", tags=["Polls"])

@polls_router.get("/")
def list_polls(
    society_id: int, db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    polls = db.query(Poll).filter(Poll.society_id == society_id).all()
    result = []
    for p in polls:
        votes = db.query(func.count(PollVote.id)).filter(PollVote.poll_id == p.id).scalar()
        user_voted = db.query(PollVote).filter(
            PollVote.poll_id == p.id, PollVote.user_id == current_user.id
        ).first() is not None
        result.append({
            "id": p.id, "title": p.title, "options": p.options,
            "is_active": p.is_active, "end_date": p.end_date,
            "total_votes": votes, "user_voted": user_voted
        })
    return result


@polls_router.post("/")
def create_poll(
    society_id: int, payload: PollCreate,
    db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_above)
):
    poll = Poll(society_id=society_id, created_by_id=current_user.id, **payload.model_dump())
    db.add(poll)
    db.commit()
    db.refresh(poll)
    return poll


@polls_router.post("/{poll_id}/vote")
def vote_poll(
    society_id: int, poll_id: int, payload: PollVoteCreate,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    existing = db.query(PollVote).filter(
        PollVote.poll_id == poll_id, PollVote.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(400, "Already voted")
    vote = PollVote(poll_id=poll_id, user_id=current_user.id, option_index=payload.option_index)
    db.add(vote)
    db.commit()
    return {"message": "Vote recorded"}


# ─── Audit Logs ───────────────────────────────────────────────────────────────
audit_router = APIRouter(prefix="/societies/{society_id}/audit", tags=["Audit"])

@audit_router.get("/")
def get_audit_logs(
    society_id: int, page: int = 1, size: int = 50,
    db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_above)
):
    q = db.query(AuditLog).filter(AuditLog.society_id == society_id)
    total = q.count()
    logs = q.order_by(AuditLog.created_at.desc()).offset((page-1)*size).limit(size).all()
    return {"total": total, "items": [
        {"id": l.id, "action": l.action, "entity_type": l.entity_type,
         "entity_id": l.entity_id, "user_id": l.user_id,
         "new_values": l.new_values, "old_values": l.old_values,
         "created_at": l.created_at} for l in logs
    ]}
