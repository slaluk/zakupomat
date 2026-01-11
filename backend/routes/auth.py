import hashlib
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from database import get_db
from models import Household
from schemas import LoginRequest, LoginResponse

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
