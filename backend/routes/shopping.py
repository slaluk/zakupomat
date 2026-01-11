from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Household, Product, ShoppingItem
from schemas import (
    ShoppingItemCreate, ShoppingItemUpdate, ShoppingItemResponse,
    ShoppingItemCheckRequest, ShoppingClearRequest
)
from routes.auth import get_current_household
from routes.sse import notify_change

router = APIRouter(prefix="/shopping", tags=["shopping"])


def item_to_response(item: ShoppingItem) -> ShoppingItemResponse:
    return ShoppingItemResponse(
        id=item.id,
        product_id=item.product_id,
        custom_name=item.custom_name,
        quantity=item.quantity,
        note=item.note,
        is_checked=item.is_checked,
        sort_order=item.sort_order,
        created_at=item.created_at,
        product_name=item.product.name if item.product else None,
        product_sort_order=item.product.sort_order if item.product else None
    )


@router.get("", response_model=list[ShoppingItemResponse])
def get_shopping_list(
    household: Household = Depends(get_current_household),
    db: Session = Depends(get_db)
):
    items = db.query(ShoppingItem).filter(
        ShoppingItem.household_id == household.id
    ).all()

    return [item_to_response(item) for item in items]


@router.post("", response_model=ShoppingItemResponse)
async def add_to_shopping_list(
    item: ShoppingItemCreate,
    household: Household = Depends(get_current_household),
    db: Session = Depends(get_db)
):
    product_id = item.product_id
    products_updated = False

    # If custom_name provided, create new product in database
    if not product_id and item.custom_name:
        # Check if product with this name already exists
        existing_product = db.query(Product).filter(
            Product.household_id == household.id,
            Product.name == item.custom_name
        ).first()

        if existing_product:
            product_id = existing_product.id
        else:
            # Create new product at the end of the list
            max_order = db.query(func.max(Product.sort_order)).filter(
                Product.household_id == household.id
            ).scalar() or 0

            new_product = Product(
                household_id=household.id,
                name=item.custom_name,
                sort_order=max_order + 1
            )
            db.add(new_product)
            db.flush()
            product_id = new_product.id
            products_updated = True

    if not product_id:
        raise HTTPException(status_code=400, detail="Product ID or custom name required")

    # Verify product belongs to household
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.household_id == household.id
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Check if already on shopping list
    existing = db.query(ShoppingItem).filter(
        ShoppingItem.household_id == household.id,
        ShoppingItem.product_id == product_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Product already on shopping list")

    db_item = ShoppingItem(
        household_id=household.id,
        product_id=product_id,
        quantity=item.quantity,
        note=item.note
    )

    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    if products_updated:
        await notify_change(household.id, "products_updated")
    await notify_change(household.id, "shopping_updated")
    return item_to_response(db_item)


@router.put("/{item_id}", response_model=ShoppingItemResponse)
async def update_shopping_item(
    item_id: int,
    item: ShoppingItemUpdate,
    household: Household = Depends(get_current_household),
    db: Session = Depends(get_db)
):
    db_item = db.query(ShoppingItem).filter(
        ShoppingItem.id == item_id,
        ShoppingItem.household_id == household.id
    ).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")

    if item.quantity is not None:
        db_item.quantity = item.quantity
    if item.note is not None:
        db_item.note = item.note

    db.commit()
    db.refresh(db_item)

    await notify_change(household.id, "shopping_updated")
    return item_to_response(db_item)


@router.delete("/{item_id}")
async def remove_from_shopping_list(
    item_id: int,
    household: Household = Depends(get_current_household),
    db: Session = Depends(get_db)
):
    db_item = db.query(ShoppingItem).filter(
        ShoppingItem.id == item_id,
        ShoppingItem.household_id == household.id
    ).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")

    db.delete(db_item)
    db.commit()

    await notify_change(household.id, "shopping_updated")
    return {"success": True}


@router.put("/{item_id}/check", response_model=ShoppingItemResponse)
async def check_item(
    item_id: int,
    request: ShoppingItemCheckRequest,
    household: Household = Depends(get_current_household),
    db: Session = Depends(get_db)
):
    db_item = db.query(ShoppingItem).filter(
        ShoppingItem.id == item_id,
        ShoppingItem.household_id == household.id
    ).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")

    db_item.is_checked = request.is_checked
    db.commit()
    db.refresh(db_item)

    await notify_change(household.id, "shopping_updated")
    return item_to_response(db_item)


@router.post("/clear")
async def clear_shopping_list(
    request: ShoppingClearRequest,
    household: Household = Depends(get_current_household),
    db: Session = Depends(get_db)
):
    query = db.query(ShoppingItem).filter(ShoppingItem.household_id == household.id)

    if request.keep_unchecked:
        query = query.filter(ShoppingItem.is_checked == True)

    query.delete(synchronize_session=False)
    db.commit()

    await notify_change(household.id, "shopping_updated")
    return {"success": True}
