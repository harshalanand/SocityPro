"""
seed.py — Rich demo data for SocietyPro
Run: python seed.py
"""
from database import SessionLocal, engine, Base
from models import *
from auth import hash_password
from datetime import datetime, timedelta
import random

Base.metadata.create_all(bind=engine)
db = SessionLocal()

try:
    # Skip if already seeded
    if db.query(User).count() > 1:
        print("Already seeded.")
        db.close()
        exit()

    # ── Society ──────────────────────────────────────────────────────────────
    society = Society(
        name="Green Valley Residency",
        code="GVR001",
        address="Plot No 45, Whitefield Main Road",
        city="Bengaluru", state="Karnataka", pincode="560066",
        registration_no="KA/2018/SOC/1234",
        total_units=120, is_active=True,
    )
    db.add(society); db.flush()

    # ── Towers ───────────────────────────────────────────────────────────────
    towers = []
    for t_name, floors in [("Tower A", 10), ("Tower B", 10), ("Tower C", 8)]:
        t = Tower(society_id=society.id, name=t_name, total_floors=floors)
        db.add(t); db.flush()
        towers.append(t)

    # ── Flats ────────────────────────────────────────────────────────────────
    flats = []
    flat_types = ["2BHK", "3BHK", "2BHK", "1BHK", "3BHK"]
    for tower in towers:
        for floor in range(1, tower.total_floors + 1):
            for unit in range(1, 5):
                flat_no = f"{tower.name[-1]}-{floor}{unit:02d}"
                ftype = random.choice(flat_types)
                rate = {"1BHK": 2500, "2BHK": 3500, "3BHK": 5000}[ftype]
                f = Flat(
                    tower_id=tower.id, floor_no=floor, flat_no=flat_no,
                    flat_type=ftype, area_sqft=random.choice([650, 950, 1200, 1400]),
                    maintenance_rate=rate, is_occupied=True,
                )
                db.add(f); db.flush()
                flats.append(f)

    # ── SuperAdmin (already seeded at startup — skip if exists) ──────────────
    superadmin = db.query(User).filter(User.role == UserRole.SUPERADMIN).first()
    if not superadmin:
        superadmin = User(
            full_name="Super Admin", email="admin@societypro.com",
            mobile="9999999999",
            hashed_password=hash_password("Admin@123"),
            role=UserRole.SUPERADMIN, is_active=True, is_approved=True,
        )
        db.add(superadmin); db.flush()

    # ── Society Admin ─────────────────────────────────────────────────────────
    admin = User(
        society_id=society.id, full_name="Rajesh Kumar",
        email="rajesh@gvr.com", mobile="9876543210",
        hashed_password=hash_password("Admin@123"),
        role=UserRole.ADMIN, is_active=True, is_approved=True,
        emergency_contact_name="Sunita Kumar", emergency_contact_mobile="9876543211",
    )
    db.add(admin); db.flush()

    # ── Residents ─────────────────────────────────────────────────────────────
    resident_data = [
        ("Priya Sharma",      "priya@email.com",    "9865432109", ResidentType.OWNER),
        ("Amit Patel",        "amit@email.com",     "9854321098", ResidentType.TENANT),
        ("Sunita Reddy",      "sunita@email.com",   "9843210987", ResidentType.OWNER),
        ("Vikram Singh",      "vikram@email.com",   "9832109876", ResidentType.OWNER),
        ("Deepa Nair",        "deepa@email.com",    "9821098765", ResidentType.TENANT),
        ("Karthik Iyer",      "karthik@email.com",  "9810987654", ResidentType.OWNER),
        ("Meena Gupta",       "meena@email.com",    "9809876543", ResidentType.OWNER),
        ("Rahul Verma",       "rahul@email.com",    "9798765432", ResidentType.TENANT),
    ]
    residents = []
    for i, (name, email, mobile, rtype) in enumerate(resident_data):
        r = User(
            society_id=society.id, flat_id=flats[i].id,
            full_name=name, email=email, mobile=mobile,
            hashed_password=hash_password("Resident@123"),
            role=UserRole.RESIDENT, resident_type=rtype,
            is_active=True, is_approved=True,
            move_in_date=datetime(2022, random.randint(1, 12), 1),
        )
        db.add(r); db.flush()
        residents.append(r)

    # ── Staff ─────────────────────────────────────────────────────────────────
    staff_data = [
        ("Security Guard 1", "sec1@gvr.com", "9111111111"),
        ("Security Guard 2", "sec2@gvr.com", "9111111112"),
        ("Housekeeping 1",   "hk1@gvr.com",  "9111111113"),
    ]
    for name, email, mobile in staff_data:
        s = User(
            society_id=society.id, full_name=name, email=email, mobile=mobile,
            hashed_password=hash_password("Staff@123"),
            role=UserRole.STAFF, is_active=True, is_approved=True,
        )
        db.add(s)

    # ── Vendors ───────────────────────────────────────────────────────────────
    vendors_data = [
        ("SecureGuard Services", "Security",     "Ramesh Kumar", "9876500001", 4.5),
        ("CleanPro Solutions",   "Housekeeping", "Priya S",      "9876500002", 4.2),
        ("TechLift India",       "Elevator",     "Arun Mehta",   "9876500003", 4.8),
        ("AquaPure Systems",     "Water",        "Suresh Babu",  "9876500004", 4.0),
        ("PowerGrid AMC",        "Electrical",   "Mohan Das",    "9876500005", 4.3),
    ]
    for name, cat, contact, mobile, rating in vendors_data:
        v = Vendor(
            society_id=society.id, name=name, category=cat,
            contact_person=contact, mobile=mobile, rating=rating,
            is_active=True,
            contract_start=datetime(2024, 4, 1),
            contract_end=datetime(2025, 3, 31),
            contract_value=random.choice([180000, 240000, 360000, 120000]),
        )
        db.add(v)

    # ── Bills (last 3 months for first 8 flats) ───────────────────────────────
    today = datetime.now()
    statuses = [PaymentStatus.PAID, PaymentStatus.PAID, PaymentStatus.PENDING, PaymentStatus.OVERDUE, PaymentStatus.PARTIAL]
    for flat in flats[:8]:
        for months_ago in range(3):
            bill_date = today - timedelta(days=30 * months_ago)
            month, year = bill_date.month, bill_date.year
            status = PaymentStatus.PAID if months_ago > 0 else random.choice(statuses)
            amount = flat.maintenance_rate or 3500
            paid = amount if status == PaymentStatus.PAID else (amount / 2 if status == PaymentStatus.PARTIAL else 0)
            b = Bill(
                society_id=society.id, flat_id=flat.id,
                bill_no=f"BILL-{year}-{month:02d}-{flat.id:03d}",
                bill_month=month, bill_year=year,
                base_amount=amount, total_amount=amount,
                due_date=datetime(year, month, 10),
                status=status, paid_amount=paid,
                paid_date=datetime(year, month, random.randint(5, 9)) if status == PaymentStatus.PAID else None,
            )
            db.add(b)

    # ── Transactions ──────────────────────────────────────────────────────────
    txn_data = [
        (TransactionType.INCOME,  "maintenance",  35000, "Mar 2025 Maintenance Collection", "UPI"),
        (TransactionType.EXPENSE, "Security",     42000, "Security staff salary - Mar 2025", "NEFT"),
        (TransactionType.EXPENSE, "Electricity",  18500, "Common area electricity bill", "Online"),
        (TransactionType.INCOME,  "maintenance",  28000, "Feb 2025 Maintenance Collection", "NEFT"),
        (TransactionType.EXPENSE, "Housekeeping", 22000, "Housekeeping staff salary", "NEFT"),
        (TransactionType.EXPENSE, "Repairs",       8200, "Lift servicing", "Cash"),
        (TransactionType.INCOME,  "parking",       6000, "Parking fee collection", "Cash"),
        (TransactionType.EXPENSE, "Water",         4500, "Water tanker charges", "UPI"),
        (TransactionType.INCOME,  "club_house",    3000, "Club house booking", "UPI"),
        (TransactionType.EXPENSE, "Landscaping",   5500, "Garden maintenance", "Cash"),
    ]
    for i, (ttype, cat, amt, desc, mode) in enumerate(txn_data):
        t = Transaction(
            society_id=society.id, transaction_type=ttype,
            category=cat, amount=amt, description=desc, payment_mode=mode,
            transaction_date=today - timedelta(days=i * 3),
            created_by_id=admin.id, is_verified=True,
        )
        db.add(t)

    # ── Complaints ────────────────────────────────────────────────────────────
    complaints_data = [
        ("Water leakage in bathroom", "Plumbing",     "high",   ComplaintStatus.OPEN,        residents[0]),
        ("Lift not working",           "Electrical",   "high",   ComplaintStatus.IN_PROGRESS, residents[1]),
        ("Parking issue near gate",    "Security",     "medium", ComplaintStatus.RESOLVED,    residents[2]),
        ("Garbage not collected",      "Housekeeping", "low",    ComplaintStatus.OPEN,        residents[3]),
        ("Streetlight broken",         "Electrical",   "medium", ComplaintStatus.OPEN,        residents[4]),
        ("Noise complaint - B-302",    "General",      "medium", ComplaintStatus.CLOSED,      residents[5]),
    ]
    for title, cat, priority, status, reporter in complaints_data:
        c = Complaint(
            society_id=society.id, created_by_id=reporter.id,
            flat_id=reporter.flat_id, title=title, category=cat,
            priority=priority, status=status,
            assigned_to_id=admin.id if status != ComplaintStatus.OPEN else None,
            resolved_at=today if status == ComplaintStatus.RESOLVED else None,
        )
        db.add(c)

    # ── Visitors ──────────────────────────────────────────────────────────────
    visitor_data = [
        ("Delivery - Amazon",  "Delivery",      VisitorStatus.CHECKED_OUT, False),
        ("Suresh Patel",       "Meeting Priya", VisitorStatus.CHECKED_IN,  False),
        ("Plumber - Raju",     "Repair work",   VisitorStatus.PENDING,     False),
        ("Dr. Anand Kumar",    "Medical visit", VisitorStatus.CHECKED_OUT, False),
        ("Delivery - Swiggy",  "Food delivery", VisitorStatus.CHECKED_OUT, True),
    ]
    for name, purpose, status, is_delivery in visitor_data:
        v = Visitor(
            society_id=society.id, flat_id=flats[0].id,
            visitor_name=name, purpose=purpose, status=status,
            otp_code=str(random.randint(100000, 999999)),
            is_delivery=is_delivery,
            check_in_time=today - timedelta(hours=random.randint(1, 8)) if status != VisitorStatus.PENDING else None,
            check_out_time=today - timedelta(hours=random.randint(0, 2)) if status == VisitorStatus.CHECKED_OUT else None,
        )
        db.add(v)

    # ── Announcements ─────────────────────────────────────────────────────────
    ann_data = [
        ("Annual General Meeting",    "AGM scheduled for April 15 at 6:00 PM in the clubhouse.", "event",     True),
        ("Water Supply Interruption", "Water supply off on March 25, 10 AM – 2 PM for maintenance.", "notice", False),
        ("New Security Protocol",     "All visitors must show OTP. Pre-register guests.", "general",   False),
        ("Gym Renovation Complete",   "Gym has been renovated. New equipment installed.", "general",   False),
        ("Emergency: Power Outage",   "DG set maintenance on Sunday 8-10 AM. Power will be off.", "emergency", True),
    ]
    for title, content, cat, pinned in ann_data:
        a = Announcement(
            society_id=society.id, created_by_id=admin.id,
            title=title, content=content, category=cat, is_pinned=pinned,
        )
        db.add(a)

    # ── Assets ────────────────────────────────────────────────────────────────
    assets_data = [
        ("Elevator - Tower A", "Lift",      850000, "active",      30),
        ("DG Set - 200KVA",    "Generator", 650000, "active",      90),
        ("Submersible Pump",   "Water",      45000, "maintenance", 60),
        ("CCTV System",        "Security",   95000, "active",      180),
        ("Gym Equipment Set",  "Gym",       320000, "active",      90),
    ]
    for name, cat, value, status, days in assets_data:
        a = Asset(
            society_id=society.id, name=name, category=cat,
            purchase_value=value, current_value=value * 0.8,
            status=status,
            last_service_date=today - timedelta(days=days),
            next_service_date=today + timedelta(days=days),
            purchase_date=datetime(2020, 1, 1),
        )
        db.add(a)

    # ── Budget ────────────────────────────────────────────────────────────────
    budget_data = [
        ("Security",            420000, 408000),
        ("Housekeeping",        180000, 175000),
        ("Electricity",         240000, 228000),
        ("Repairs & Maintenance",120000, 168000),
        ("Landscaping",          60000,  45000),
        ("Admin & Misc",         80000,  72000),
    ]
    for cat, planned, actual in budget_data:
        b = Budget(
            society_id=society.id, financial_year="2024-25",
            category=cat, planned_amount=planned, actual_amount=actual,
        )
        db.add(b)

    # ── Polls ─────────────────────────────────────────────────────────────────
    poll1 = Poll(
        society_id=society.id, created_by_id=admin.id,
        title="Preferred time for water supply maintenance",
        options=["Morning 6-8 AM", "Afternoon 2-4 PM", "Evening 6-8 PM"],
        is_active=True, end_date=today + timedelta(days=7),
    )
    poll2 = Poll(
        society_id=society.id, created_by_id=admin.id,
        title="Should we install CCTV in parking area?",
        options=["Yes, strongly agree", "Yes, with conditions", "No, not required"],
        is_active=True, end_date=today + timedelta(days=14),
    )
    db.add(poll1); db.add(poll2); db.flush()

    for i, r in enumerate(residents[:5]):
        db.add(PollVote(poll_id=poll1.id, user_id=r.id, option_index=i % 3))
    for i, r in enumerate(residents[:6]):
        db.add(PollVote(poll_id=poll2.id, user_id=r.id, option_index=0 if i < 4 else i % 3))

    # ── App Settings ──────────────────────────────────────────────────────────
    settings_data = [
        ("app_name",               "SocietyPro",       "general",  False),
        ("currency",               "INR",               "general",  False),
        ("timezone",               "Asia/Kolkata",      "general",  False),
        ("date_format",            "DD/MM/YYYY",        "general",  False),
        ("maintenance_due_day",    "10",                "billing",  False),
        ("late_fee_percent",       "2",                 "billing",  False),
        ("penalty_grace_days",     "5",                 "billing",  False),
        ("auto_generate_bills",    "true",              "billing",  False),
        ("sms_enabled",            "false",             "notifications", False),
        ("email_enabled",          "false",             "notifications", False),
        ("whatsapp_enabled",       "false",             "notifications", False),
        ("db_type",                "sqlite",            "database", False),
        ("sqlite_path",            "./societypro.db",   "database", False),
        ("session_timeout_minutes","1440",              "security", False),
        ("require_otp_login",      "false",             "security", False),
        ("password_min_length",    "8",                 "security", False),
    ]
    for key, value, cat, secret in settings_data:
        db.add(AppSetting(key=key, value=value, category=cat, is_secret=secret))

    db.commit()
    print("✅ Seed complete!")
    print("   SuperAdmin : admin@societypro.com / Admin@123")
    print("   Admin      : rajesh@gvr.com / Admin@123")
    print("   Resident   : priya@email.com / Resident@123")
    print(f"   Society    : Green Valley Residency ({len(flats)} flats)")

except Exception as e:
    db.rollback()
    print(f"❌ Seed error: {e}")
    import traceback; traceback.print_exc()
finally:
    db.close()
