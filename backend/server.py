from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Query
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os, logging, uuid, secrets, bcrypt, jwt
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field
from typing import List, Optional

# ─── Config ───────────────────────────────────────────────

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_ALGORITHM = "HS256"

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ─── Password / JWT helpers ───────────────────────────────

def get_jwt_secret():
    return os.environ["JWT_SECRET"]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=15), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ─── Brute Force Protection ──────────────────────────────

async def check_brute_force(identifier: str):
    record = await db.login_attempts.find_one({"identifier": identifier})
    if record and record.get("attempts", 0) >= 5:
        locked_until = record.get("locked_until")
        if locked_until:
            # Handle both aware and naive datetimes from MongoDB
            now = datetime.now(timezone.utc)
            if locked_until.tzinfo is None:
                locked_until = locked_until.replace(tzinfo=timezone.utc)
            if now < locked_until:
                raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
        # If lock expired, clear and allow
        await db.login_attempts.delete_one({"identifier": identifier})

async def record_failed_attempt(identifier: str):
    record = await db.login_attempts.find_one({"identifier": identifier})
    if record:
        new_count = record.get("attempts", 0) + 1
        update = {"$set": {"attempts": new_count}}
        if new_count >= 5:
            update["$set"]["locked_until"] = datetime.now(timezone.utc) + timedelta(minutes=15)
        await db.login_attempts.update_one({"identifier": identifier}, update)
    else:
        await db.login_attempts.insert_one({"identifier": identifier, "attempts": 1})

async def clear_failed_attempts(identifier: str):
    await db.login_attempts.delete_one({"identifier": identifier})

# ─── Auth Models ──────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str

class LoginRequest(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# ─── Auth Endpoints ───────────────────────────────────────

@api_router.post("/auth/register")
async def register(req: RegisterRequest, response: Response, request: Request):
    email = req.email.strip().lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    doc = {
        "email": email,
        "password_hash": hash_password(req.password),
        "name": req.name.strip(),
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.users.insert_one(doc)
    user_id = str(result.inserted_id)

    # Seed default categories for new user
    count = await db.categories.count_documents({"user_id": user_id})
    if count == 0:
        for cat in DEFAULT_CATEGORIES:
            await db.categories.insert_one({**cat, "id": str(uuid.uuid4()), "user_id": user_id})

    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
    return {"_id": user_id, "email": email, "name": doc["name"], "role": "user"}

@api_router.post("/auth/login")
async def login(req: LoginRequest, response: Response, request: Request):
    email = req.email.strip().lower()
    identifier = email
    await check_brute_force(identifier)

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(req.password, user["password_hash"]):
        await record_failed_attempt(identifier)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    await clear_failed_attempts(identifier)
    user_id = str(user["_id"])
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
    return {"_id": user_id, "email": email, "name": user.get("name", ""), "role": user.get("role", "user")}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        new_access = create_access_token(str(user["_id"]), user["email"])
        response.set_cookie(key="access_token", value=new_access, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
        return {"ok": True}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@api_router.post("/auth/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    email = req.email.strip().lower()
    user = await db.users.find_one({"email": email})
    if not user:
        return {"ok": True, "message": "If that email exists, a reset link has been sent"}
    token = secrets.token_urlsafe(32)
    await db.password_reset_tokens.insert_one({
        "token": token,
        "user_id": str(user["_id"]),
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
        "used": False,
    })
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    logger.info(f"Password reset link: {frontend_url}/reset-password?token={token}")
    return {"ok": True, "message": "If that email exists, a reset link has been sent"}

@api_router.post("/auth/reset-password")
async def reset_password(req: ResetPasswordRequest):
    record = await db.password_reset_tokens.find_one({"token": req.token, "used": False})
    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    if datetime.now(timezone.utc) > record["expires_at"]:
        raise HTTPException(status_code=400, detail="Reset token has expired")
    await db.users.update_one(
        {"_id": ObjectId(record["user_id"])},
        {"$set": {"password_hash": hash_password(req.new_password)}}
    )
    await db.password_reset_tokens.update_one({"_id": record["_id"]}, {"$set": {"used": True}})
    return {"ok": True, "message": "Password has been reset"}

# ─── Data Models ──────────────────────────────────────────

class CategoryCreate(BaseModel):
    name: str
    icon: Optional[str] = None
    color: Optional[str] = None

class ExpenseCreate(BaseModel):
    title: str
    amount: float
    category: str
    date: str
    notes: Optional[str] = ""
    payment_method: Optional[str] = "cash"

class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    date: Optional[str] = None
    notes: Optional[str] = None
    payment_method: Optional[str] = None

class BudgetCreate(BaseModel):
    category: str
    amount: float
    month: str

class RecurringExpenseCreate(BaseModel):
    title: str
    amount: float
    category: str
    day_of_month: int = 1
    notes: Optional[str] = ""
    payment_method: Optional[str] = "cash"
    active: Optional[bool] = True

class RecurringExpenseUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    day_of_month: Optional[int] = None
    notes: Optional[str] = None
    payment_method: Optional[str] = None
    active: Optional[bool] = None

class LLMRequest(BaseModel):
    prompt: str
    model: Optional[str] = None

# ─── Categories (user-scoped) ────────────────────────────

@api_router.get("/categories")
async def list_categories(user: dict = Depends(get_current_user)):
    docs = await db.categories.find({"user_id": user["_id"]}, {"_id": 0}).to_list(100)
    return docs

@api_router.post("/categories")
async def create_category(data: CategoryCreate, user: dict = Depends(get_current_user)):
    doc = data.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["user_id"] = user["_id"]
    await db.categories.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, user: dict = Depends(get_current_user)):
    result = await db.categories.delete_one({"id": category_id, "user_id": user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"ok": True}

# ─── Expenses (user-scoped) ──────────────────────────────

@api_router.get("/expenses")
async def list_expenses(user: dict = Depends(get_current_user), limit: int = Query(500, le=1000)):
    docs = await db.expenses.find({"user_id": user["_id"]}, {"_id": 0}).sort("date", -1).to_list(limit)
    return docs

@api_router.post("/expenses")
async def create_expense(data: ExpenseCreate, user: dict = Depends(get_current_user)):
    doc = data.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["user_id"] = user["_id"]
    await db.expenses.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.put("/expenses/{expense_id}")
async def update_expense(expense_id: str, data: ExpenseUpdate, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.expenses.update_one({"id": expense_id, "user_id": user["_id"]}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    updated = await db.expenses.find_one({"id": expense_id}, {"_id": 0})
    return updated

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, user: dict = Depends(get_current_user)):
    result = await db.expenses.delete_one({"id": expense_id, "user_id": user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"ok": True}

# ─── Budgets (user-scoped) ───────────────────────────────

@api_router.get("/budgets")
async def list_budgets(user: dict = Depends(get_current_user), month: Optional[str] = None):
    query = {"user_id": user["_id"]}
    if month:
        query["month"] = month
    docs = await db.budgets.find(query, {"_id": 0}).to_list(200)
    return docs

@api_router.post("/budgets")
async def create_budget(data: BudgetCreate, user: dict = Depends(get_current_user)):
    doc = data.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["user_id"] = user["_id"]
    await db.budgets.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.delete("/budgets/{budget_id}")
async def delete_budget(budget_id: str, user: dict = Depends(get_current_user)):
    result = await db.budgets.delete_one({"id": budget_id, "user_id": user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Budget not found")
    return {"ok": True}

# ─── Recurring Expenses (user-scoped) ─────────────────────

@api_router.get("/recurring-expenses")
async def list_recurring_expenses(user: dict = Depends(get_current_user)):
    docs = await db.recurring_expenses.find({"user_id": user["_id"]}, {"_id": 0}).to_list(100)
    return docs

@api_router.post("/recurring-expenses")
async def create_recurring_expense(data: RecurringExpenseCreate, user: dict = Depends(get_current_user)):
    doc = data.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["user_id"] = user["_id"]
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["last_generated"] = None
    await db.recurring_expenses.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.put("/recurring-expenses/{recurring_id}")
async def update_recurring_expense(recurring_id: str, data: RecurringExpenseUpdate, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.recurring_expenses.update_one({"id": recurring_id, "user_id": user["_id"]}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Recurring expense not found")
    updated = await db.recurring_expenses.find_one({"id": recurring_id}, {"_id": 0})
    return updated

@api_router.delete("/recurring-expenses/{recurring_id}")
async def delete_recurring_expense(recurring_id: str, user: dict = Depends(get_current_user)):
    result = await db.recurring_expenses.delete_one({"id": recurring_id, "user_id": user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Recurring expense not found")
    return {"ok": True}

@api_router.post("/recurring-expenses/generate")
async def generate_recurring_expenses(user: dict = Depends(get_current_user)):
    """Generate expense entries for the current month from all active recurring expenses."""
    now = datetime.now(timezone.utc)
    current_month = now.strftime("%Y-%m")
    recurring = await db.recurring_expenses.find({"user_id": user["_id"], "active": True}, {"_id": 0}).to_list(100)
    created = []
    for rec in recurring:
        # Check if already generated for this month
        if rec.get("last_generated") == current_month:
            continue
        day = min(rec.get("day_of_month", 1), 28)  # Cap at 28 to avoid month-end issues
        expense_date = f"{current_month}-{day:02d}"
        expense_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user["_id"],
            "title": rec["title"],
            "amount": rec["amount"],
            "category": rec["category"],
            "date": expense_date,
            "notes": f"[Recurring] {rec.get('notes', '')}".strip(),
            "payment_method": rec.get("payment_method", "cash"),
            "recurring_id": rec["id"],
        }
        await db.expenses.insert_one(expense_doc)
        await db.recurring_expenses.update_one({"id": rec["id"]}, {"$set": {"last_generated": current_month}})
        created.append({k: v for k, v in expense_doc.items() if k != "_id"})
    return {"generated": len(created), "expenses": created}

# ─── AI / LLM ────────────────────────────────────────────

@api_router.post("/ai/invoke-llm")
async def invoke_llm(req: LLMRequest, user: dict = Depends(get_current_user)):
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="LLM API key not configured")
        session_id = str(uuid.uuid4())
        chat = LlmChat(api_key=api_key, session_id=session_id, system_message="You are a friendly, knowledgeable personal finance AI advisor helping users in Botswana manage their finances in Botswana Pula (BWP). Provide helpful, clear, and actionable responses. Always use BWP for monetary amounts. Use markdown formatting.")
        chat.with_model("openai", "gpt-4o")
        user_message = UserMessage(text=req.prompt)
        response = await chat.send_message(user_message)
        return {"result": response}
    except Exception as e:
        logger.error(f"LLM error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ─── Health ───────────────────────────────────────────────

@api_router.get("/")
async def root():
    return {"message": "EcoBudget API is running"}

# ─── Seed defaults ────────────────────────────────────────

DEFAULT_CATEGORIES = [
    {"name": "Food & Dining", "icon": "utensils", "color": "bg-emerald-500"},
    {"name": "Transportation", "icon": "car", "color": "bg-blue-500"},
    {"name": "Entertainment", "icon": "film", "color": "bg-purple-500"},
    {"name": "Shopping", "icon": "shopping-bag", "color": "bg-orange-500"},
    {"name": "Utilities", "icon": "zap", "color": "bg-cyan-500"},
    {"name": "Health", "icon": "heart", "color": "bg-pink-500"},
    {"name": "Housing", "icon": "home", "color": "bg-yellow-500"},
    {"name": "Education", "icon": "book", "color": "bg-red-500"},
]

@app.on_event("startup")
async def startup():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.login_attempts.create_index("identifier")

    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@ecobudget.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        result = await db.users.insert_one({
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        admin_id = str(result.inserted_id)
        # Seed default categories for admin
        for cat in DEFAULT_CATEGORIES:
            await db.categories.insert_one({**cat, "id": str(uuid.uuid4()), "user_id": admin_id})
        logger.info(f"Seeded admin user: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Updated admin password")

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
