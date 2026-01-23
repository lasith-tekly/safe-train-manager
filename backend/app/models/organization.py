"""Organization models - Country and Site management."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Index, Numeric
from sqlalchemy.orm import relationship

from app.database import Base


class Country(Base):
    """Country - represents a geographic region for team organization."""
    __tablename__ = "countries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(3), unique=True, nullable=False, index=True)  # ISO 3166-1 alpha-3
    name = Column(String(100), nullable=False)
    timezone = Column(String(50), nullable=False, default="UTC")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)

    # Relationships
    sites = relationship(
        "Site",
        back_populates="country",
        cascade="all, delete-orphan",
        lazy="dynamic"
    )
    holidays = relationship(
        "Holiday",
        back_populates="country",
        lazy="dynamic"
    )

    __table_args__ = (
        Index('ix_countries_active', 'is_active'),
    )

    def __repr__(self):
        return f"<Country {self.code}: {self.name}>"


class Site(Base):
    """Site - represents a physical office location within a country."""
    __tablename__ = "sites"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(10), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    country_id = Column(String(36), ForeignKey("countries.id"), nullable=False, index=True)
    address = Column(Text, nullable=True)
    unit_cost_keur = Column(Numeric(10, 2), nullable=True, default=85.0)  # Site-specific unit cost in KEUR/year per FTE
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)

    # Relationships
    country = relationship("Country", back_populates="sites")
    teams = relationship(
        "Team",
        back_populates="site",
        lazy="dynamic"
    )

    __table_args__ = (
        Index('ix_sites_country_active', 'country_id', 'is_active'),
    )

    def __repr__(self):
        return f"<Site {self.code}: {self.name}>"
