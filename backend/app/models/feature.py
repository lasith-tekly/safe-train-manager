import uuid
import enum
from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, String, Text, DateTime, Integer, Numeric, ForeignKey
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.database import Base


class FeatureStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class Feature(Base):
    __tablename__ = "features"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    jira_key = Column(String(20), nullable=False, unique=True, index=True)
    jira_id = Column(String(50), nullable=False, unique=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    jira_status = Column(String(50), nullable=True)
    internal_status = Column(
        SQLEnum(FeatureStatus),
        nullable=False,
        default=FeatureStatus.NOT_STARTED,
        index=True
    )
    product_id = Column(String(36), ForeignKey("products.id"), nullable=True, index=True)
    budget_line_id = Column(String(36), ForeignKey("budget_lines.id"), nullable=True, index=True)
    team_id = Column(String(36), ForeignKey("teams.id"), nullable=True, index=True)
    quarter = Column(Integer, nullable=True)
    year = Column(Integer, nullable=True, index=True)
    story_points = Column(Integer, nullable=True, default=0)
    cost = Column(Numeric(10, 2), nullable=True, default=0)
    jira_url = Column(String(500), nullable=True)
    last_synced_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)

    # Relationships
    product = relationship("Product", backref="features")
    budget_line = relationship("BudgetLine", backref="features")
    team = relationship("Team", backref="features")

    def __repr__(self):
        return f"<Feature {self.jira_key}: {self.title[:50]}>"


class JiraConfig(Base):
    __tablename__ = "jira_configs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    jira_url = Column(String(200), nullable=False)
    username = Column(String(100), nullable=False)
    api_token = Column(String(500), nullable=False)
    project_keys = Column(Text, nullable=True)
    is_active = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<JiraConfig {self.jira_url}>"
