from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime


# Auth
class LoginRequest(BaseModel):
    access_key: str


class LoginResponse(BaseModel):
    success: bool
    household_name: Optional[str] = None


# Product
class ProductBase(BaseModel):
    name: str


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None


class ProductResponse(ProductBase):
    id: int
    sort_order: int
    created_at: datetime

    class Config:
        from_attributes = True


class ProductReorderRequest(BaseModel):
    product_ids: List[int]


# Shopping Item
class ShoppingItemBase(BaseModel):
    quantity: Optional[str] = None
    note: Optional[str] = None


class ShoppingItemCreate(ShoppingItemBase):
    product_id: Optional[int] = None
    custom_name: Optional[str] = None


class ShoppingItemUpdate(ShoppingItemBase):
    pass


class ShoppingItemResponse(ShoppingItemBase):
    id: int
    product_id: Optional[int]
    custom_name: Optional[str]
    is_checked: bool
    sort_order: Optional[int]
    created_at: datetime
    product_name: Optional[str] = None
    product_sort_order: Optional[int] = None

    class Config:
        from_attributes = True


class ShoppingItemCheckRequest(BaseModel):
    is_checked: bool


class ShoppingClearRequest(BaseModel):
    keep_unchecked: bool = False


class CustomItemReorderRequest(BaseModel):
    item_ids: List[int]


class AddCustomToProductsRequest(BaseModel):
    item_id: int
    sort_order: Optional[int] = None
