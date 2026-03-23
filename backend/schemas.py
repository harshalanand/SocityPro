from pydantic import BaseModel, field_validator
from typing import Optional, List, Any
from datetime import datetime
from models import UserRole, ResidentType, ComplaintStatus, TransactionType, PaymentStatus, NotificationChannel


# ─── Auth ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str

class OTPRequest(BaseModel):
    mobile: str

class OTPVerify(BaseModel):
    mobile: str
    otp: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ─── Society ──────────────────────────────────────────────────────────────────

class SocietyCreate(BaseModel):
    name: str
    code: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    country: str = "India"
    registration_no: Optional[str] = None
    total_units: int = 0

class SocietyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    registration_no: Optional[str] = None
    total_units: Optional[int] = None
    is_active: Optional[bool] = None
    settings: Optional[dict] = None

class SocietyResponse(BaseModel):
    id: int
    name: str
    code: str
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    total_units: int
    is_active: bool
    created_at: datetime
    class Config: from_attributes = True


# ─── Tower / Flat ─────────────────────────────────────────────────────────────

class TowerCreate(BaseModel):
    name: str
    total_floors: int = 0

class FlatCreate(BaseModel):
    tower_id: int
    floor_no: int
    flat_no: str
    flat_type: Optional[str] = None
    area_sqft: Optional[float] = None
    maintenance_rate: Optional[float] = None

class FlatResponse(BaseModel):
    id: int
    flat_no: str
    floor_no: int
    flat_type: Optional[str]
    area_sqft: Optional[float]
    maintenance_rate: Optional[float]
    is_occupied: bool
    class Config: from_attributes = True


# ─── User ─────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    full_name: str
    email: str
    mobile: str
    password: str
    role: UserRole = UserRole.RESIDENT
    society_id: Optional[int] = None
    flat_id: Optional[int] = None
    resident_type: Optional[ResidentType] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    role: Optional[UserRole] = None
    flat_id: Optional[int] = None
    resident_type: Optional[ResidentType] = None
    is_active: Optional[bool] = None
    is_approved: Optional[bool] = None

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    mobile: str
    role: UserRole
    resident_type: Optional[ResidentType]
    is_active: bool
    is_approved: bool
    society_id: Optional[int]
    flat_id: Optional[int]
    created_at: datetime
    class Config: from_attributes = True


# ─── Transaction ──────────────────────────────────────────────────────────────

class TransactionCreate(BaseModel):
    transaction_type: TransactionType
    category: str
    subcategory: Optional[str] = None
    amount: float
    description: Optional[str] = None
    reference_no: Optional[str] = None
    payment_mode: Optional[str] = None
    transaction_date: Optional[datetime] = None
    bill_id: Optional[int] = None

class TransactionResponse(BaseModel):
    id: int
    transaction_type: TransactionType
    category: str
    amount: float
    description: Optional[str]
    reference_no: Optional[str]
    payment_mode: Optional[str]
    transaction_date: datetime
    is_verified: bool
    created_at: datetime
    class Config: from_attributes = True


# ─── Bill ─────────────────────────────────────────────────────────────────────

class BillCreate(BaseModel):
    flat_id: int
    bill_month: int
    bill_year: int
    base_amount: float
    penalty_amount: float = 0
    discount_amount: float = 0
    due_date: Optional[datetime] = None
    notes: Optional[str] = None

class BillPayment(BaseModel):
    paid_amount: float
    payment_mode: str
    reference_no: Optional[str] = None

class BillResponse(BaseModel):
    id: int
    flat_id: int
    bill_no: Optional[str]
    bill_month: int
    bill_year: int
    base_amount: float
    penalty_amount: float
    total_amount: float
    status: PaymentStatus
    paid_amount: float
    paid_date: Optional[datetime]
    due_date: Optional[datetime]
    created_at: datetime
    class Config: from_attributes = True


# ─── Complaint ────────────────────────────────────────────────────────────────

class ComplaintCreate(BaseModel):
    category: str
    title: str
    description: Optional[str] = None
    priority: str = "medium"

class ComplaintUpdate(BaseModel):
    status: Optional[ComplaintStatus] = None
    assigned_to_id: Optional[int] = None
    resolution_notes: Optional[str] = None
    priority: Optional[str] = None

class ComplaintResponse(BaseModel):
    id: int
    category: str
    title: str
    description: Optional[str]
    status: ComplaintStatus
    priority: str
    created_at: datetime
    class Config: from_attributes = True


# ─── Visitor ──────────────────────────────────────────────────────────────────

class VisitorCreate(BaseModel):
    visitor_name: str
    visitor_mobile: Optional[str] = None
    purpose: Optional[str] = None
    vehicle_no: Optional[str] = None
    flat_id: Optional[int] = None
    is_delivery: bool = False

class VisitorResponse(BaseModel):
    id: int
    visitor_name: str
    visitor_mobile: Optional[str]
    purpose: Optional[str]
    status: str
    otp_code: Optional[str]
    check_in_time: Optional[datetime]
    check_out_time: Optional[datetime]
    created_at: datetime
    class Config: from_attributes = True


# ─── Announcement ─────────────────────────────────────────────────────────────

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    category: str = "general"
    is_pinned: bool = False
    expiry_date: Optional[datetime] = None
    target_roles: List[str] = ["all"]

class AnnouncementResponse(BaseModel):
    id: int
    title: str
    content: str
    category: str
    is_pinned: bool
    publish_date: datetime
    created_at: datetime
    class Config: from_attributes = True


# ─── Asset ────────────────────────────────────────────────────────────────────

class AssetCreate(BaseModel):
    name: str
    category: Optional[str] = None
    asset_code: Optional[str] = None
    purchase_date: Optional[datetime] = None
    purchase_value: Optional[float] = None
    warranty_expiry: Optional[datetime] = None
    next_service_date: Optional[datetime] = None
    vendor_id: Optional[int] = None

class AssetMaintenanceLogCreate(BaseModel):
    service_date: datetime
    description: Optional[str] = None
    cost: float = 0
    performed_by: Optional[str] = None
    next_service_date: Optional[datetime] = None


# ─── Vendor ───────────────────────────────────────────────────────────────────

class VendorCreate(BaseModel):
    name: str
    category: Optional[str] = None
    contact_person: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    gst_no: Optional[str] = None
    contract_start: Optional[datetime] = None
    contract_end: Optional[datetime] = None
    contract_value: Optional[float] = None

class VendorResponse(BaseModel):
    id: int
    name: str
    category: Optional[str]
    contact_person: Optional[str]
    mobile: Optional[str]
    email: Optional[str]
    is_active: bool
    class Config: from_attributes = True


# ─── Budget ───────────────────────────────────────────────────────────────────

class BudgetCreate(BaseModel):
    financial_year: str
    category: str
    planned_amount: float
    notes: Optional[str] = None

class BudgetResponse(BaseModel):
    id: int
    financial_year: str
    category: str
    planned_amount: float
    actual_amount: float
    class Config: from_attributes = True


# ─── Poll ─────────────────────────────────────────────────────────────────────

class PollCreate(BaseModel):
    title: str
    description: Optional[str] = None
    options: List[str]
    end_date: Optional[datetime] = None

class PollVoteCreate(BaseModel):
    option_index: int


# ─── App Settings ─────────────────────────────────────────────────────────────

class SettingUpdate(BaseModel):
    key: str
    value: str
    category: Optional[str] = None
    is_secret: bool = False
    description: Optional[str] = None

class DBConfigUpdate(BaseModel):
    db_type: str  # sqlite or mssql
    sqlite_path: Optional[str] = None
    mssql_server: Optional[str] = None
    mssql_database: Optional[str] = None
    mssql_username: Optional[str] = None
    mssql_password: Optional[str] = None
    mssql_driver: Optional[str] = None


# ─── Dashboard ────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_collection: float
    total_expenses: float
    pending_dues: float
    total_flats: int
    occupied_flats: int
    active_complaints: int
    pending_approvals: int
    reserve_fund: float
