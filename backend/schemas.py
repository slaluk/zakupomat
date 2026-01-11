from pydantic import BaseModel
from datetime import datetime


# Auth
class LoginRequest(BaseModel):
    access_key: str


class LoginResponse(BaseModel):
    success: bool
    household_name: str | None = None


# Product
class ProductBase(BaseModel):
    name: str


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = None


class ProductResponse(ProductBase):
    id: int
    sort_order: int
    created_at: datetime

    class Config:
        from_attributes = True


class ProductReorderRequest(BaseModel):
    product_ids: list[int]


# Shopping Item
class ShoppingItemBase(BaseModel):
    quantity: str | None = None
    note: str | None = None


class ShoppingItemCreate(ShoppingItemBase):
    product_id: int | None = None
    custom_name: str | None = None


class ShoppingItemUpdate(ShoppingItemBase):
    pass


class ShoppingItemResponse(ShoppingItemBase):
    id: int
    product_id: int | None
    custom_name: str | None
    is_checked: bool
    sort_order: int | None
    created_at: datetime
    product_name: str | None = None
    product_sort_order: int | None = None

    class Config:
        from_attributes = True


class ShoppingItemCheckRequest(BaseModel):
    is_checked: bool


class ShoppingClearRequest(BaseModel):
    keep_unchecked: bool = False


class CustomItemReorderRequest(BaseModel):
    item_ids: list[int]


class AddCustomToProductsRequest(BaseModel):
    item_id: int
    sort_order: int | None = None
