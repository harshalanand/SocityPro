from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date
import calendar, random, string

from database import get_db
from models import Bill, Transaction, Flat, Tower, User, UserRole, PaymentStatus, TransactionType, AuditLog
from schemas import BillCreate, BillPayment, BillResponse, TransactionCreate, TransactionResponse
from auth import get_current_user, require_admin_or_above

router = APIRouter(prefix="/societies/{society_id}", tags=["Billing & Finance"])


def _check_access(society_id: int, current_user: User):
    if current_user.role != UserRole.SUPERADMIN and current_user.society_id != society_id:
        raise HTTPException(403, "Access denied")


def _generate_bill_no(db: Session, society_id: int) -> str:
    count = db.query(func.count(Bill.id)).filter(Bill.society_id == society_id).scalar() + 1
    return f"BILL-{society_id:03d}-{count:06d}"


# ─── Bills ────────────────────────────────────────────────────────────────────

@router.get("/bills")
def list_bills(
    society_id: int,
    flat_id: Optional[int] = None,
    status: Optional[str] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    _check_access(society_id, current_user)
    q = db.query(Bill).filter(Bill.society_id == society_id)
    if flat_id:
        q = q.filter(Bill.flat_id == flat_id)
    elif current_user.role == UserRole.RESIDENT and current_user.flat_id:
        q = q.filter(Bill.flat_id == current_user.flat_id)
    if status:
        q = q.filter(Bill.status == status)
    if month:
        q = q.filter(Bill.bill_month == month)
    if year:
        q = q.filter(Bill.bill_year == year)
    total = q.count()
    bills = q.order_by(Bill.created_at.desc()).offset((page-1)*size).limit(size).all()
    return {"total": total, "page": page, "items": [
        {"id": b.id, "bill_no": b.bill_no, "flat_id": b.flat_id,
         "bill_month": b.bill_month, "bill_year": b.bill_year,
         "base_amount": b.base_amount, "penalty_amount": b.penalty_amount,
         "total_amount": b.total_amount, "paid_amount": b.paid_amount,
         "status": b.status, "due_date": b.due_date, "paid_date": b.paid_date}
        for b in bills
    ]}


@router.post("/bills")
def create_bill(
    society_id: int,
    payload: BillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above)
):
    _check_access(society_id, current_user)
    existing = db.query(Bill).filter(
        Bill.flat_id == payload.flat_id,
        Bill.bill_month == payload.bill_month,
        Bill.bill_year == payload.bill_year
    ).first()
    if existing:
        raise HTTPException(400, "Bill already exists for this flat/month/year")

    total = payload.base_amount + payload.penalty_amount - payload.discount_amount
    bill = Bill(
        society_id=society_id,
        **payload.model_dump(),
        total_amount=total,
        bill_no=_generate_bill_no(db, society_id)
    )
    db.add(bill)
    db.commit()
    db.refresh(bill)
    return bill


@router.post("/bills/generate-bulk")
def generate_bulk_bills(
    society_id: int,
    month: int, year: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above)
):
    """Auto-generate bills for all flats in the society"""
    _check_access(society_id, current_user)
    flats = db.query(Flat).join(Tower).filter(Tower.society_id == society_id, Flat.is_occupied == True).all()
    created, skipped = 0, 0
    last_day = calendar.monthrange(year, month)[1]
    due_date = datetime(year, month, last_day)

    for flat in flats:
        existing = db.query(Bill).filter(
            Bill.flat_id == flat.id, Bill.bill_month == month, Bill.bill_year == year
        ).first()
        if existing:
            skipped += 1
            continue
        amount = flat.maintenance_rate or 0
        if flat.area_sqft and flat.maintenance_rate:
            amount = flat.area_sqft * flat.maintenance_rate
        bill = Bill(
            society_id=society_id, flat_id=flat.id,
            bill_month=month, bill_year=year,
            base_amount=amount, penalty_amount=0, discount_amount=0,
            total_amount=amount, due_date=due_date,
            bill_no=_generate_bill_no(db, society_id)
        )
        db.add(bill)
        created += 1
    db.commit()
    return {"message": f"Generated {created} bills, skipped {skipped} (already exist)"}


@router.post("/bills/{bill_id}/pay")
def record_payment(
    society_id: int, bill_id: int,
    payload: BillPayment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    _check_access(society_id, current_user)
    bill = db.query(Bill).filter(Bill.id == bill_id, Bill.society_id == society_id).first()
    if not bill:
        raise HTTPException(404, "Bill not found")
    if bill.status == PaymentStatus.PAID:
        raise HTTPException(400, "Bill already paid")

    bill.paid_amount += payload.paid_amount
    if bill.paid_amount >= bill.total_amount:
        bill.status = PaymentStatus.PAID
        bill.paid_date = datetime.utcnow()
    else:
        bill.status = PaymentStatus.PARTIAL
    db.commit()

    # Create transaction record
    txn = Transaction(
        society_id=society_id,
        bill_id=bill.id,
        transaction_type=TransactionType.INCOME,
        category="maintenance",
        amount=payload.paid_amount,
        payment_mode=payload.payment_mode,
        reference_no=payload.reference_no,
        description=f"Maintenance payment - Bill {bill.bill_no}",
        created_by_id=current_user.id
    )
    db.add(txn)
    db.commit()
    return {"message": "Payment recorded", "bill_status": bill.status}


# ─── Transactions ─────────────────────────────────────────────────────────────

@router.get("/transactions")
def list_transactions(
    society_id: int,
    transaction_type: Optional[str] = None,
    category: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    _check_access(society_id, current_user)
    q = db.query(Transaction).filter(Transaction.society_id == society_id)
    if transaction_type:
        q = q.filter(Transaction.transaction_type == transaction_type)
    if category:
        q = q.filter(Transaction.category == category)
    if from_date:
        q = q.filter(Transaction.transaction_date >= from_date)
    if to_date:
        q = q.filter(Transaction.transaction_date <= to_date)
    total = q.count()
    txns = q.order_by(Transaction.transaction_date.desc()).offset((page-1)*size).limit(size).all()
    return {"total": total, "page": page, "items": [
        {"id": t.id, "transaction_type": t.transaction_type, "category": t.category,
         "subcategory": t.subcategory, "amount": t.amount, "description": t.description,
         "reference_no": t.reference_no, "payment_mode": t.payment_mode,
         "transaction_date": t.transaction_date, "is_verified": t.is_verified,
         "invoice_url": t.invoice_url}
        for t in txns
    ]}


@router.post("/transactions")
def create_transaction(
    society_id: int,
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above)
):
    _check_access(society_id, current_user)
    txn = Transaction(
        society_id=society_id,
        **payload.model_dump(),
        created_by_id=current_user.id
    )
    if not txn.transaction_date:
        txn.transaction_date = datetime.utcnow()
    db.add(txn)

    # Audit log
    log = AuditLog(
        user_id=current_user.id, society_id=society_id,
        action="CREATE_TRANSACTION", entity_type="transaction",
        new_values={"amount": payload.amount, "category": payload.category, "type": payload.transaction_type}
    )
    db.add(log)
    db.commit()
    db.refresh(txn)
    return txn


@router.get("/transactions/summary")
def transaction_summary(
    society_id: int,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    _check_access(society_id, current_user)
    q_income = db.query(func.sum(Transaction.amount)).filter(
        Transaction.society_id == society_id,
        Transaction.transaction_type == TransactionType.INCOME
    )
    q_expense = db.query(func.sum(Transaction.amount)).filter(
        Transaction.society_id == society_id,
        Transaction.transaction_type == TransactionType.EXPENSE
    )
    if year:
        q_income = q_income.filter(func.strftime('%Y', Transaction.transaction_date) == str(year))
        q_expense = q_expense.filter(func.strftime('%Y', Transaction.transaction_date) == str(year))

    total_income = q_income.scalar() or 0
    total_expense = q_expense.scalar() or 0

    cat_expenses = db.query(
        Transaction.category, func.sum(Transaction.amount).label("total")
    ).filter(
        Transaction.society_id == society_id,
        Transaction.transaction_type == TransactionType.EXPENSE
    ).group_by(Transaction.category).all()

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "net": total_income - total_expense,
        "category_breakdown": [{"category": r[0], "amount": r[1]} for r in cat_expenses]
    }


@router.get("/defaulters")
def get_defaulters(
    society_id: int,
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above)
):
    _check_access(society_id, current_user)
    q = db.query(Bill, Flat, Tower).join(Flat, Bill.flat_id == Flat.id).join(Tower, Flat.tower_id == Tower.id).filter(
        Tower.society_id == society_id,
        Bill.status.in_([PaymentStatus.PENDING, PaymentStatus.OVERDUE])
    )
    if month:
        q = q.filter(Bill.bill_month == month)
    if year:
        q = q.filter(Bill.bill_year == year)
    rows = q.all()
    return [
        {"bill_id": b.id, "flat_no": f.flat_no, "tower": t.name,
         "bill_month": b.bill_month, "bill_year": b.bill_year,
         "total_amount": b.total_amount, "paid_amount": b.paid_amount,
         "due": b.total_amount - b.paid_amount, "status": b.status, "due_date": b.due_date}
        for b, f, t in rows
    ]
