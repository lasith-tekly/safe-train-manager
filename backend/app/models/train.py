import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text
from app.database import Base


class Train(Base):
    __tablename__ = "trains"

    id = Column(String(36), primary_key=True,
                default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False, unique=True)
    short_code = Column(String(10), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)
