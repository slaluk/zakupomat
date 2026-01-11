from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from database import Base


class Household(Base):
    __tablename__ = "households"

    id = Column(Integer, primary_key=True, autoincrement=True)
    access_key_hash = Column(String(128), unique=True, nullable=False)
    name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    products = relationship("Product", back_populates="household", cascade="all, delete-orphan")
    shopping_items = relationship("ShoppingItem", back_populates="household", cascade="all, delete-orphan")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, autoincrement=True)
    household_id = Column(Integer, ForeignKey("households.id"), nullable=False)
    name = Column(String(200), nullable=False)
    sort_order = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    household = relationship("Household", back_populates="products")
    shopping_items = relationship("ShoppingItem", back_populates="product")


class ShoppingItem(Base):
    __tablename__ = "shopping_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    household_id = Column(Integer, ForeignKey("households.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    custom_name = Column(String(200), nullable=True)
    quantity = Column(String(100), nullable=True)
    note = Column(Text, nullable=True)
    is_checked = Column(Boolean, default=False)
    sort_order = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    household = relationship("Household", back_populates="shopping_items")
    product = relationship("Product", back_populates="shopping_items")
