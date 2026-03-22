from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text,
    ForeignKey, Enum, JSON, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


# ─── Enums ────────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    SUPERADMIN = "superadmin"
    ADMIN = "admin"
    RESIDENT = "resident"
    STAFF = "staff"
    VENDOR = "vendor"

class ResidentType(str, enum.Enum):
    OWNER = "owner"
    TENANT = "tenant"

class ComplaintStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"

class TransactionType(str, enum.Enum):
    INCOME = "income"
    EXPENSE = "expense"

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    PARTIAL = "partial"

class NotificationChannel(str, enum.Enum):
    SMS = "sms"
    EMAIL = "email"
    WHATSAPP = "whatsapp"
    IN_APP = "in_app"

class VisitorStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CHECKED_IN = "checked_in"
    CHECKED_OUT = "checked_out"


# ─── Society ──────────────────────────────────────────────────────────────────

class Society(Base):
    __tablename__ = "societies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    code = Column(String(20), unique=True, nullable=False)  # e.g. SOC001
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    pincode = Column(String(10))
    country = Column(String(50), default="India")
    registration_no = Column(String(100))
    total_units = Column(Integer, default=0)
    logo_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    settings = Column(JSON, default={})  # society-level settings
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    towers = relationship("Tower", back_populates="society", cascade="all, delete")
    users = relationship("User", back_populates="society")
    transactions = relationship("Transaction", back_populates="society")
    bills = relationship("Bill", back_populates="society")
    complaints = relationship("Complaint", back_populates="society")
    announcements = relationship("Announcement", back_populates="society")
    assets = relationship("Asset", back_populates="society")
    vendors = relationship("Vendor", back_populates="society")
    budgets = relationship("Budget", back_populates="society")
    visitors = relationship("Visitor", back_populates="society")


# ─── Tower / Building ─────────────────────────────────────────────────────────

class Tower(Base):
    __tablename__ = "towers"

    id = Column(Integer, primary_key=True, index=True)
    society_id = Column(Integer, ForeignKey("societies.id"), nullable=False)
    name = Column(String(100), nullable=False)  # Tower A, Block B
    total_floors = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    society = relationship("Society", back_populates="towers")
    flats = relationship("Flat", back_populates="tower", cascade="all, delete")


# ─── Flat ─────────────────────────────────────────────────────────────────────

class Flat(Base):
    __tablename__ = "flats"

    id = Column(Integer, primary_key=True, index=True)
    tower_id = Column(Integer, ForeignKey("towers.id"), nullable=False)
    floor_no = Column(Integer, nullable=False)
    flat_no = Column(String(20), nullable=False)
    flat_type = Column(String(20))  # 1BHK, 2BHK, etc.
    area_sqft = Column(Float)
    maintenance_rate = Column(Float)  # Per sqft or fixed
    is_occupied = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tower = relationship("Tower", back_populates="flats")
    residents = relationship("User", back_populates="flat")
    bills = relationship("Bill", back_populates="flat")

    __table_args__ = (
        UniqueConstraint("tower_id", "flat_no", name="uq_tower_flat"),
        Index("ix_flats_tower_floor", "tower_id", "floor_no"),
    )


# ─── User ─────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    society_id = Column(Integer, ForeignKey("societies.id"), nullable=True)
    flat_id = Column(Integer, ForeignKey("flats.id"), nullable=True)
    full_name = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, nullable=False)
    mobile = Column(String(15), unique=True, nullable=False)
    hashed_password = Column(String(500))
    role = Column(Enum(UserRole), default=UserRole.RESIDENT)
    resident_type = Column(Enum(ResidentType), nullable=True)
    is_active = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=False)
    avatar_url = Column(String(500))
    otp_secret = Column(String(50))
    last_login = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    society = relationship("Society", back_populates="users")
    flat = relationship("Flat", back_populates="residents")
    audit_logs = relationship("AuditLog", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    complaints = relationship("Complaint", back_populates="created_by")

    __table_args__ = (
        Index("ix_users_society", "society_id"),
        Index("ix_users_role", "role"),
    )


# ─── Transaction ──────────────────────────────────────────────────────────────

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    society_id = Column(Integer, ForeignKey("societies.id"), nullable=False)
    bill_id = Column(Integer, ForeignKey("bills.id"), nullable=True)
    transaction_type = Column(Enum(TransactionType), nullable=False)
    category = Column(String(100), nullable=False)  # maintenance, electricity, etc.
    subcategory = Column(String(100))
    amount = Column(Float, nullable=False)
    description = Column(Text)
    reference_no = Column(String(100))
    payment_mode = Column(String(50))  # cash, upi, neft, cheque
    invoice_url = Column(String(500))
    transaction_date = Column(DateTime(timezone=True), server_default=func.now())
    created_by_id = Column(Integer, ForeignKey("users.id"))
    is_verified = Column(Boolean, default=False)
    verified_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    society = relationship("Society", back_populates="transactions")
    bill = relationship("Bill", back_populates="transactions")

    __table_args__ = (
        Index("ix_transactions_society_date", "society_id", "transaction_date"),
        Index("ix_transactions_type", "transaction_type"),
    )


# ─── Bill ─────────────────────────────────────────────────────────────────────

class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    society_id = Column(Integer, ForeignKey("societies.id"), nullable=False)
    flat_id = Column(Integer, ForeignKey("flats.id"), nullable=False)
    bill_no = Column(String(50), unique=True)
    bill_month = Column(Integer, nullable=False)  # 1-12
    bill_year = Column(Integer, nullable=False)
    base_amount = Column(Float, nullable=False)
    penalty_amount = Column(Float, default=0)
    discount_amount = Column(Float, default=0)
    total_amount = Column(Float, nullable=False)
    due_date = Column(DateTime(timezone=True))
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    paid_amount = Column(Float, default=0)
    paid_date = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    society = relationship("Society", back_populates="bills")
    flat = relationship("Flat", back_populates="bills")
    transactions = relationship("Transaction", back_populates="bill")

    __table_args__ = (
        UniqueConstraint("flat_id", "bill_month", "bill_year", name="uq_bill_flat_month"),
        Index("ix_bills_society_status", "society_id", "status"),
    )


# ─── Complaint ────────────────────────────────────────────────────────────────

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    society_id = Column(Integer, ForeignKey("societies.id"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    category = Column(String(100))
    title = Column(String(300), nullable=False)
    description = Column(Text)
    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.OPEN)
    priority = Column(String(20), default="medium")  # low, medium, high
    image_url = Column(String(500))
    sla_hours = Column(Integer, default=48)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolution_notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    society = relationship("Society", back_populates="complaints")
    created_by = relationship("User", foreign_keys=[created_by_id], back_populates="complaints")


# ─── Visitor ──────────────────────────────────────────────────────────────────

class Visitor(Base):
    __tablename__ = "visitors"

    id = Column(Integer, primary_key=True, index=True)
    society_id = Column(Integer, ForeignKey("societies.id"), nullable=False)
    flat_id = Column(Integer, ForeignKey("flats.id"), nullable=True)
    visitor_name = Column(String(200), nullable=False)
    visitor_mobile = Column(String(15))
    purpose = Column(String(200))
    vehicle_no = Column(String(20))
    otp_code = Column(String(10))
    qr_code = Column(Text)
    status = Column(Enum(VisitorStatus), default=VisitorStatus.PENDING)
    check_in_time = Column(DateTime(timezone=True), nullable=True)
    check_out_time = Column(DateTime(timezone=True), nullable=True)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_delivery = Column(Boolean, default=False)
    photo_url = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    society = relationship("Society", back_populates="visitors")


# ─── Announcement ─────────────────────────────────────────────────────────────

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    society_id = Column(Integer, ForeignKey("societies.id"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(300), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(50), default="general")  # general, event, notice, emergency
    is_pinned = Column(Boolean, default=False)
    document_url = Column(String(500))
    publish_date = Column(DateTime(timezone=True), server_default=func.now())
    expiry_date = Column(DateTime(timezone=True), nullable=True)
    target_roles = Column(JSON, default=["all"])
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    society = relationship("Society", back_populates="announcements")


# ─── Asset ────────────────────────────────────────────────────────────────────

class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    society_id = Column(Integer, ForeignKey("societies.id"), nullable=False)
    name = Column(String(200), nullable=False)
    category = Column(String(100))  # lift, generator, pump, etc.
    asset_code = Column(String(50))
    purchase_date = Column(DateTime(timezone=True))
    purchase_value = Column(Float)
    current_value = Column(Float)
    warranty_expiry = Column(DateTime(timezone=True))
    last_service_date = Column(DateTime(timezone=True))
    next_service_date = Column(DateTime(timezone=True))
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=True)
    status = Column(String(50), default="active")
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    society = relationship("Society", back_populates="assets")
    maintenance_logs = relationship("AssetMaintenanceLog", back_populates="asset", cascade="all, delete")


class AssetMaintenanceLog(Base):
    __tablename__ = "asset_maintenance_logs"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    service_date = Column(DateTime(timezone=True), nullable=False)
    description = Column(Text)
    cost = Column(Float, default=0)
    performed_by = Column(String(200))
    next_service_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    asset = relationship("Asset", back_populates="maintenance_logs")


# ─── Vendor ───────────────────────────────────────────────────────────────────

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    society_id = Column(Integer, ForeignKey("societies.id"), nullable=False)
    name = Column(String(200), nullable=False)
    category = Column(String(100))
    contact_person = Column(String(200))
    mobile = Column(String(15))
    email = Column(String(200))
    address = Column(Text)
    gst_no = Column(String(20))
    pan_no = Column(String(20))
    contract_start = Column(DateTime(timezone=True))
    contract_end = Column(DateTime(timezone=True))
    contract_value = Column(Float)
    rating = Column(Float, default=0)
    is_active = Column(Boolean, default=True)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    society = relationship("Society", back_populates="vendors")


# ─── Budget ───────────────────────────────────────────────────────────────────

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    society_id = Column(Integer, ForeignKey("societies.id"), nullable=False)
    financial_year = Column(String(10), nullable=False)  # 2024-25
    category = Column(String(100), nullable=False)
    planned_amount = Column(Float, nullable=False)
    actual_amount = Column(Float, default=0)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    society = relationship("Society", back_populates="budgets")


# ─── Notification ─────────────────────────────────────────────────────────────

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    society_id = Column(Integer, ForeignKey("societies.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String(300), nullable=False)
    message = Column(Text, nullable=False)
    channel = Column(Enum(NotificationChannel), nullable=False)
    status = Column(String(20), default="pending")  # pending, sent, failed
    reference_type = Column(String(50))  # bill, complaint, announcement
    reference_id = Column(Integer)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="notifications")

    __table_args__ = (
        Index("ix_notifications_user", "user_id"),
        Index("ix_notifications_status", "status"),
    )


# ─── Audit Log ────────────────────────────────────────────────────────────────

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    society_id = Column(Integer, ForeignKey("societies.id"), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50))
    entity_id = Column(Integer)
    old_values = Column(JSON)
    new_values = Column(JSON)
    ip_address = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="audit_logs")

    __table_args__ = (
        Index("ix_audit_logs_society_date", "society_id", "created_at"),
    )


# ─── Poll / Voting ────────────────────────────────────────────────────────────

class Poll(Base):
    __tablename__ = "polls"

    id = Column(Integer, primary_key=True, index=True)
    society_id = Column(Integer, ForeignKey("societies.id"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(Text)
    options = Column(JSON, nullable=False)  # list of option strings
    is_active = Column(Boolean, default=True)
    end_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    votes = relationship("PollVote", back_populates="poll", cascade="all, delete")


class PollVote(Base):
    __tablename__ = "poll_votes"

    id = Column(Integer, primary_key=True, index=True)
    poll_id = Column(Integer, ForeignKey("polls.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    option_index = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    poll = relationship("Poll", back_populates="votes")

    __table_args__ = (
        UniqueConstraint("poll_id", "user_id", name="uq_poll_user_vote"),
    )


# ─── Document ─────────────────────────────────────────────────────────────────

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    society_id = Column(Integer, ForeignKey("societies.id"), nullable=False)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(300), nullable=False)
    category = Column(String(100))  # bylaw, minutes, report, contract
    file_url = Column(String(500), nullable=False)
    file_type = Column(String(50))
    file_size_kb = Column(Integer)
    access_roles = Column(JSON, default=["all"])
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ─── App Settings ─────────────────────────────────────────────────────────────

class AppSetting(Base):
    __tablename__ = "app_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text)
    category = Column(String(50))  # db, email, sms, whatsapp, general
    is_secret = Column(Boolean, default=False)
    description = Column(String(500))
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    updated_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
