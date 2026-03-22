from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import os, time

from config import settings
from database import engine, Base
import models  # noqa - ensure all models are registered

# Import all routers
from routers.auth import router as auth_router
from routers.societies import router as societies_router
from routers.billing import router as billing_router
from routers.core import (
    users_router, complaints_router, visitors_router,
    announcements_router, assets_router, vendors_router,
    budget_router, polls_router, audit_router
)
from routers.settings import router as settings_router
from routers.reports import router as reports_router

# ─── Create tables on startup ─────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

# ─── Create upload directory ──────────────────────────────────────────────────
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="SocietyPro API",
    description="Full-stack Society Management System",
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production: specify frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Request timing middleware ────────────────────────────────────────────────
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    response.headers["X-Process-Time"] = str(round(time.time() - start, 4))
    return response

# ─── Static files ─────────────────────────────────────────────────────────────
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# ─── Register routers ─────────────────────────────────────────────────────────
app.include_router(auth_router, prefix="/api")
app.include_router(societies_router, prefix="/api")
app.include_router(billing_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(complaints_router, prefix="/api")
app.include_router(visitors_router, prefix="/api")
app.include_router(announcements_router, prefix="/api")
app.include_router(assets_router, prefix="/api")
app.include_router(vendors_router, prefix="/api")
app.include_router(budget_router, prefix="/api")
app.include_router(polls_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
app.include_router(settings_router, prefix="/api")
app.include_router(reports_router, prefix="/api")


# ─── Health check ─────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "db_type": settings.DB_TYPE
    }


# ─── Seed superadmin on first run ─────────────────────────────────────────────
@app.on_event("startup")
def seed_superadmin():
    from database import SessionLocal
    from models import User, UserRole
    from auth import hash_password

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.role == UserRole.SUPERADMIN).first()
        if not existing:
            superadmin = User(
                full_name="Super Admin",
                email="admin@societypro.com",
                mobile="9999999999",
                hashed_password=hash_password("Admin@123"),
                role=UserRole.SUPERADMIN,
                is_active=True,
                is_approved=True,
            )
            db.add(superadmin)
            db.commit()
            print("✅ SuperAdmin created: admin@societypro.com / Admin@123")
        else:
            print(f"✅ SuperAdmin exists: {existing.email}")
    except Exception as e:
        print(f"⚠️ Seed error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
