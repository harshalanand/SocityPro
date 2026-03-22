from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from database import get_db
from models import Society, User, UserRole, Tower, Flat, Transaction, Bill, Complaint, PaymentStatus
from schemas import SocietyCreate, SocietyUpdate, SocietyResponse, TowerCreate, FlatCreate
from auth import get_current_user, require_superadmin, require_admin_or_above

router = APIRouter(prefix="/societies", tags=["Societies"])


# ─── Society CRUD (SuperAdmin only for create/delete) ─────────────────────────

@router.get("/", response_model=List[dict])
def list_societies(
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Society)
    if current_user.role != UserRole.SUPERADMIN:
        # Non-superadmin can only see their own society
        q = q.filter(Society.id == current_user.society_id)
    if is_active is not None:
        q = q.filter(Society.is_active == is_active)
    societies = q.all()
    result = []
    for s in societies:
        total_users = db.query(func.count(User.id)).filter(User.society_id == s.id).scalar()
        result.append({
            "id": s.id, "name": s.name, "code": s.code, "city": s.city,
            "state": s.state, "total_units": s.total_units, "is_active": s.is_active,
            "total_users": total_users, "created_at": s.created_at
        })
    return result


@router.post("/", response_model=SocietyResponse)
def create_society(
    payload: SocietyCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_superadmin)
):
    if db.query(Society).filter(Society.code == payload.code).first():
        raise HTTPException(400, f"Society code '{payload.code}' already exists")
    society = Society(**payload.model_dump())
    db.add(society)
    db.commit()
    db.refresh(society)
    return society


@router.get("/{society_id}", response_model=dict)
def get_society(
    society_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.SUPERADMIN and current_user.society_id != society_id:
        raise HTTPException(403, "Access denied")
    society = db.query(Society).filter(Society.id == society_id).first()
    if not society:
        raise HTTPException(404, "Society not found")
    return {
        "id": society.id, "name": society.name, "code": society.code,
        "address": society.address, "city": society.city, "state": society.state,
        "pincode": society.pincode, "registration_no": society.registration_no,
        "total_units": society.total_units, "is_active": society.is_active,
        "settings": society.settings, "created_at": society.created_at
    }


@router.put("/{society_id}", response_model=SocietyResponse)
def update_society(
    society_id: int,
    payload: SocietyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above)
):
    if current_user.role != UserRole.SUPERADMIN and current_user.society_id != society_id:
        raise HTTPException(403, "Access denied")
    society = db.query(Society).filter(Society.id == society_id).first()
    if not society:
        raise HTTPException(404, "Society not found")
    for field, val in payload.model_dump(exclude_none=True).items():
        setattr(society, field, val)
    db.commit()
    db.refresh(society)
    return society


@router.delete("/{society_id}")
def delete_society(
    society_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_superadmin)
):
    society = db.query(Society).filter(Society.id == society_id).first()
    if not society:
        raise HTTPException(404, "Society not found")
    db.delete(society)
    db.commit()
    return {"message": "Society deleted"}


# ─── Dashboard ────────────────────────────────────────────────────────────────

@router.get("/{society_id}/dashboard")
def get_dashboard(
    society_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.SUPERADMIN and current_user.society_id != society_id:
        raise HTTPException(403, "Access denied")

    from models import TransactionType, AuditLog
    from datetime import datetime, timedelta

    now = datetime.utcnow()
    year_start = datetime(now.year, 1, 1)

    total_income = db.query(func.sum(Transaction.amount)).filter(
        Transaction.society_id == society_id,
        Transaction.transaction_type == TransactionType.INCOME
    ).scalar() or 0

    total_expense = db.query(func.sum(Transaction.amount)).filter(
        Transaction.society_id == society_id,
        Transaction.transaction_type == TransactionType.EXPENSE
    ).scalar() or 0

    pending_dues = db.query(func.sum(Bill.total_amount - Bill.paid_amount)).filter(
        Bill.society_id == society_id,
        Bill.status.in_([PaymentStatus.PENDING, PaymentStatus.OVERDUE])
    ).scalar() or 0

    total_flats = db.query(func.count(Flat.id)).join(Tower).filter(Tower.society_id == society_id).scalar() or 0
    occupied_flats = db.query(func.count(Flat.id)).join(Tower).filter(
        Tower.society_id == society_id, Flat.is_occupied == True
    ).scalar() or 0

    active_complaints = db.query(func.count(Complaint.id)).filter(
        Complaint.society_id == society_id,
        Complaint.status.in_(["open", "in_progress"])
    ).scalar() or 0

    pending_approvals = db.query(func.count(User.id)).filter(
        User.society_id == society_id,
        User.is_approved == False
    ).scalar() or 0

    # Monthly breakdown (last 6 months)
    monthly_data = []
    for i in range(5, -1, -1):
        m = now.month - i
        y = now.year
        while m <= 0:
            m += 12; y -= 1
        income = db.query(func.sum(Transaction.amount)).filter(
            Transaction.society_id == society_id,
            Transaction.transaction_type == TransactionType.INCOME,
            func.strftime('%Y-%m', Transaction.transaction_date) == f"{y:04d}-{m:02d}"
        ).scalar() or 0
        expense = db.query(func.sum(Transaction.amount)).filter(
            Transaction.society_id == society_id,
            Transaction.transaction_type == TransactionType.EXPENSE,
            func.strftime('%Y-%m', Transaction.transaction_date) == f"{y:04d}-{m:02d}"
        ).scalar() or 0
        monthly_data.append({"month": f"{y}-{m:02d}", "income": income, "expense": expense})

    # Category-wise expense
    from sqlalchemy import text
    expense_categories = db.query(
        Transaction.category, func.sum(Transaction.amount).label("total")
    ).filter(
        Transaction.society_id == society_id,
        Transaction.transaction_type == TransactionType.EXPENSE
    ).group_by(Transaction.category).all()

    return {
        "total_collection": total_income,
        "total_expenses": total_expense,
        "pending_dues": pending_dues,
        "reserve_fund": total_income - total_expense,
        "total_flats": total_flats,
        "occupied_flats": occupied_flats,
        "active_complaints": active_complaints,
        "pending_approvals": pending_approvals,
        "monthly_data": monthly_data,
        "expense_categories": [{"category": r[0], "amount": r[1]} for r in expense_categories],
    }


# ─── Towers ───────────────────────────────────────────────────────────────────

@router.get("/{society_id}/towers")
def list_towers(society_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPERADMIN and current_user.society_id != society_id:
        raise HTTPException(403, "Access denied")
    towers = db.query(Tower).filter(Tower.society_id == society_id).all()
    return [{"id": t.id, "name": t.name, "total_floors": t.total_floors,
             "flat_count": len(t.flats)} for t in towers]


@router.post("/{society_id}/towers")
def create_tower(
    society_id: int, payload: TowerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above)
):
    tower = Tower(society_id=society_id, **payload.model_dump())
    db.add(tower)
    db.commit()
    db.refresh(tower)
    return tower


@router.get("/{society_id}/flats")
def list_flats(
    society_id: int,
    tower_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Flat).join(Tower).filter(Tower.society_id == society_id)
    if tower_id:
        q = q.filter(Flat.tower_id == tower_id)
    flats = q.all()
    return [{"id": f.id, "flat_no": f.flat_no, "floor_no": f.floor_no,
             "flat_type": f.flat_type, "area_sqft": f.area_sqft,
             "maintenance_rate": f.maintenance_rate, "is_occupied": f.is_occupied,
             "tower_id": f.tower_id} for f in flats]


@router.post("/{society_id}/flats")
def create_flat(
    society_id: int, payload: FlatCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_above)
):
    flat = Flat(**payload.model_dump())
    db.add(flat)
    db.commit()
    db.refresh(flat)
    return flat
