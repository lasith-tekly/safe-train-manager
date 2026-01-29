import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.database import Base


class ProductStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class Product(Base):
    __tablename__ = "products"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False, unique=True, index=True)
    short_code = Column(String(6), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    status = Column(
        SQLEnum(ProductStatus),
        nullable=False,
        default=ProductStatus.ACTIVE,
        index=True
    )
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)
    created_by = Column(String(36), nullable=True)

    # Relationships
    # budget_versions = relationship(  # Old budget relationship - commented out
    #     "BudgetVersion",
    #     back_populates="product",
    #     cascade="all, delete-orphan"
    # )
    # features = relationship("Feature", back_populates="product")
    # roadmaps = relationship("Roadmap", back_populates="product", cascade="all, delete-orphan")  # Old - removed for V4
    # V4 roadmap_features relationship is defined in roadmap_v4.py model

    def __repr__(self):
        return f"<Product {self.short_code}: {self.name}>"
