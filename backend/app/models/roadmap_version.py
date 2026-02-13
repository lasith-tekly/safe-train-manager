"""
Roadmap Version Model

Manages versioning for strategic roadmap planning.
Supports DRAFT → PUBLISHED lifecycle with feature locking.
"""
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, CheckConstraint, Index
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime


class RoadmapVersion(Base):
    """
    Roadmap Version Model
    
    Tracks versions of roadmap plans for a product.
    - DRAFT versions are editable
    - PUBLISHED versions are locked (read-only)
    - Only one DRAFT version per product allowed
    """
    __tablename__ = "roadmap_versions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    version_name = Column(String(50), nullable=False)  # Date-based: "2026-02-05"
    status = Column(String(20), nullable=False, default="DRAFT")  # DRAFT or PUBLISHED
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    published_at = Column(DateTime, nullable=True)
    created_by = Column(String(100), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    product = relationship("Product", back_populates="roadmap_versions")
    features = relationship("RoadmapFeature", back_populates="roadmap_version", cascade="all, delete-orphan")
    jira_records = relationship("JiraRecord", back_populates="version", cascade="all, delete-orphan")

    # Constraints
    __table_args__ = (
        CheckConstraint("status IN ('DRAFT', 'PUBLISHED')", name="valid_version_status"),
        Index('ix_roadmap_versions_product_id', 'product_id'),
        Index('ix_roadmap_versions_status', 'status'),
        Index('ix_roadmap_versions_product_status', 'product_id', 'status'),
    )

    def __repr__(self):
        return f"<RoadmapVersion {self.version_name} ({self.status})>"
