from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Household, Product, ShoppingItem
from schemas import ProductCreate, ProductUpdate, ProductResponse, ProductReorderRequest
from routes.auth import get_current_household
from routes.sse import notify_change

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductResponse])
def get_products(
    household: Household = Depends(get_current_household),
    db: Session = Depends(get_db)
):
    products = db.query(Product).filter(
        Product.household_id == household.id
    ).order_by(Product.sort_order).all()
    return products


@router.post("", response_model=ProductResponse)
async def create_product(
    product: ProductCreate,
    household: Household = Depends(get_current_household),
    db: Session = Depends(get_db)
):
    existing = db.query(Product).filter(
        Product.household_id == household.id,
        Product.name == product.name
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Product already exists")

    max_order = db.query(func.max(Product.sort_order)).filter(
        Product.household_id == household.id
    ).scalar() or 0

    db_product = Product(
        household_id=household.id,
        name=product.name,
        sort_order=max_order + 1
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    await notify_change(household.id, "products_updated")
    return db_product


@router.put("/reorder", response_model=list[ProductResponse])
async def reorder_products(
    request: ProductReorderRequest,
    household: Household = Depends(get_current_household),
    db: Session = Depends(get_db)
):
    products = db.query(Product).filter(
        Product.household_id == household.id,
        Product.id.in_(request.product_ids)
    ).all()

    product_map = {p.id: p for p in products}

    for index, product_id in enumerate(request.product_ids):
        if product_id in product_map:
            product_map[product_id].sort_order = index + 1

    db.commit()

    updated = db.query(Product).filter(
        Product.household_id == household.id
    ).order_by(Product.sort_order).all()

    await notify_change(household.id, "products_updated")
    return updated


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product: ProductUpdate,
    household: Household = Depends(get_current_household),
    db: Session = Depends(get_db)
):
    db_product = db.query(Product).filter(
        Product.id == product_id,
        Product.household_id == household.id
    ).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.name is not None:
        existing = db.query(Product).filter(
            Product.household_id == household.id,
            Product.name == product.name,
            Product.id != product_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Product with this name already exists")
        db_product.name = product.name

    db.commit()
    db.refresh(db_product)

    await notify_change(household.id, "products_updated")
    return db_product


@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    household: Household = Depends(get_current_household),
    db: Session = Depends(get_db)
):
    db_product = db.query(Product).filter(
        Product.id == product_id,
        Product.household_id == household.id
    ).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    in_shopping = db.query(ShoppingItem).filter(
        ShoppingItem.product_id == product_id
    ).first()
    if in_shopping:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete product that is on shopping list"
        )

    db.delete(db_product)
    db.commit()

    await notify_change(household.id, "products_updated")
    return {"success": True}
