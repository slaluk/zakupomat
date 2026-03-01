import hashlib
import secrets
import string
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from database import get_db
from models import Household, Product
from schemas import LoginRequest, LoginResponse, RegisterRequest, RegisterResponse
from default_products import DEFAULT_PRODUCTS

router = APIRouter(prefix="/auth", tags=["auth"])


def hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


def get_current_household(
    x_access_key: str = Header(..., alias="X-Access-Key"),
    db: Session = Depends(get_db)
) -> Household:
    key_hash = hash_key(x_access_key)
    household = db.query(Household).filter(Household.access_key_hash == key_hash).first()
    if not household:
        raise HTTPException(status_code=401, detail="Invalid access key")
    return household


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    key_hash = hash_key(request.access_key)
    household = db.query(Household).filter(Household.access_key_hash == key_hash).first()

    if not household:
        return LoginResponse(success=False)

    return LoginResponse(success=True, household_name=household.name)


def generate_key(length: int = 12) -> str:
    alphabet = string.ascii_lowercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


@router.post("/register", response_model=RegisterResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    name = request.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Nazwa rodziny nie może być pusta")

    access_key = generate_key()
    key_hash = hash_key(access_key)

    household = Household(
        access_key_hash=key_hash,
        name=name,
    )
    db.add(household)
    db.flush()

    for idx, product_name in enumerate(DEFAULT_PRODUCTS, start=1):
        product = Product(
            household_id=household.id,
            name=product_name,
            sort_order=idx,
        )
        db.add(product)

    db.commit()

    return RegisterResponse(access_key=access_key, household_name=name)
