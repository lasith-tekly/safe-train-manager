from typing import Optional, Tuple, List
from uuid import UUID
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.budget import BudgetVersion, BudgetLine, BudgetStatus
from app.schemas.budget import (
    BudgetVersionCreate,
    BudgetVersionUpdate,
    BudgetVersionResponse,
    BudgetLineResponse
)


class BudgetService:
    """Service layer for Budget business logic."""

    DEFAULT_BUDGET_LINES = [
        {"name": "Product Evolution", "display_order": 1},
        {"name": "Maintenance", "display_order": 2},
        {"name": "Implementation", "display_order": 3},
        {"name": "Bespoke", "display_order": 4},
    ]

    @staticmethod
    def get_versions(
        db: Session,
        product_id: UUID,
        year: Optional[int] = None
    ) -> Tuple[List[BudgetVersionResponse], int]:
        """Get all budget versions for a product."""
        query = db.query(BudgetVersion).filter(
            BudgetVersion.product_id == str(product_id)
        )

        if year:
            query = query.filter(BudgetVersion.year == year)

        query = query.order_by(BudgetVersion.year.desc(), BudgetVersion.created_at.desc())
        
        versions = query.all()
        result = [BudgetService.build_version_response(db, v) for v in versions]
        
        return result, len(result)

    @staticmethod
    def get_version_by_id(db: Session, version_id: UUID) -> Optional[BudgetVersion]:
        """Get budget version by ID."""
        return db.query(BudgetVersion).filter(BudgetVersion.id == str(version_id)).first()

    @staticmethod
    def get_version_by_name(
        db: Session,
        product_id: UUID,
        year: int,
        name: str
    ) -> Optional[BudgetVersion]:
        """Get budget version by name (unique per product+year)."""
        return db.query(BudgetVersion).filter(
            and_(
                BudgetVersion.product_id == str(product_id),
                BudgetVersion.year == year,
                BudgetVersion.name == name
            )
        ).first()

    @staticmethod
    def get_active_version(
        db: Session,
        product_id: UUID,
        year: int
    ) -> Optional[BudgetVersion]:
        """Get the active budget version for a product and year."""
        return db.query(BudgetVersion).filter(
            and_(
                BudgetVersion.product_id == str(product_id),
                BudgetVersion.year == year,
                BudgetVersion.status == BudgetStatus.ACTIVE
            )
        ).first()

    @staticmethod
    def create_version(db: Session, data: BudgetVersionCreate) -> BudgetVersion:
        """Create a new budget version with lines."""
        version = BudgetVersion(
            product_id=str(data.product_id),
            year=data.year,
            name=data.name,
            notes=data.notes,
            status=BudgetStatus(data.status)
        )
        db.add(version)
        db.flush()

        # Add budget lines
        for line_data in data.budget_lines:
            line = BudgetLine(
                version_id=version.id,
                name=line_data.name,
                allocated_amount=line_data.allocated_amount,
                display_order=line_data.display_order
            )
            db.add(line)

        db.commit()
        db.refresh(version)
        return version

    @staticmethod
    def update_version(
        db: Session,
        version_id: UUID,
        data: BudgetVersionUpdate
    ) -> BudgetVersion:
        """Update an existing budget version."""
        version = db.query(BudgetVersion).filter(BudgetVersion.id == str(version_id)).first()

        # Update basic fields
        if data.name is not None:
            version.name = data.name
        if data.notes is not None:
            version.notes = data.notes
        if data.status is not None:
            version.status = BudgetStatus(data.status)

        # Update budget lines if provided
        if data.budget_lines is not None:
            # Delete existing lines
            db.query(BudgetLine).filter(BudgetLine.version_id == str(version_id)).delete()
            
            # Add new lines
            for line_data in data.budget_lines:
                line = BudgetLine(
                    version_id=version_id,
                    name=line_data.name,
                    allocated_amount=line_data.allocated_amount,
                    display_order=line_data.display_order
                )
                db.add(line)

        db.commit()
        db.refresh(version)
        return version

    @staticmethod
    def copy_version(db: Session, source: BudgetVersion) -> BudgetVersion:
        """Create a copy of a budget version."""
        # Generate unique name
        base_name = f"Copy of {source.name}"
        name = base_name
        counter = 1
        while BudgetService.get_version_by_name(db, source.product_id, source.year, name):
            counter += 1
            name = f"{base_name} ({counter})"

        # Create new version
        new_version = BudgetVersion(
            product_id=str(source.product_id) if hasattr(source.product_id, 'hex') else source.product_id,
            year=source.year,
            name=name,
            notes=source.notes,
            status=BudgetStatus.DRAFT
        )
        db.add(new_version)
        db.flush()

        # Copy budget lines
        for source_line in source.budget_lines:
            line = BudgetLine(
                version_id=new_version.id,
                name=source_line.name,
                allocated_amount=source_line.allocated_amount,
                display_order=source_line.display_order
            )
            db.add(line)

        db.commit()
        db.refresh(new_version)
        return new_version

    @staticmethod
    def activate_version(db: Session, version_id: UUID) -> BudgetVersion:
        """Activate a budget version."""
        version = db.query(BudgetVersion).filter(BudgetVersion.id == str(version_id)).first()
        version.status = BudgetStatus.ACTIVE
        db.commit()
        db.refresh(version)
        return version

    @staticmethod
    def lock_version(db: Session, version_id: UUID) -> BudgetVersion:
        """Lock a budget version."""
        version = db.query(BudgetVersion).filter(BudgetVersion.id == str(version_id)).first()
        version.status = BudgetStatus.LOCKED
        db.commit()
        db.refresh(version)
        return version

    @staticmethod
    def deactivate_current_active(db: Session, product_id: UUID, year: int) -> None:
        """Deactivate the current active version (set to archived)."""
        active = BudgetService.get_active_version(db, product_id, year)
        if active:
            active.status = BudgetStatus.ARCHIVED
            db.commit()

    @staticmethod
    def delete_version(db: Session, version_id: UUID) -> None:
        """Delete a budget version."""
        version = db.query(BudgetVersion).filter(BudgetVersion.id == str(version_id)).first()
        db.delete(version)
        db.commit()

    @staticmethod
    def get_line_consumption(db: Session, line_id: UUID) -> Decimal:
        """Calculate consumption for a budget line from features."""
        # TODO: Implement when Feature model exists
        return Decimal("0")

    @staticmethod
    def build_version_response(db: Session, version: BudgetVersion) -> BudgetVersionResponse:
        """Build a complete version response with calculated fields."""
        budget_lines = []
        total_consumed = Decimal("0")

        for line in version.budget_lines:
            consumed = BudgetService.get_line_consumption(db, line.id)
            remaining = line.allocated_amount - consumed
            percentage = float(consumed / line.allocated_amount * 100) if line.allocated_amount > 0 else 0.0

            budget_lines.append(BudgetLineResponse(
                id=line.id,
                name=line.name,
                allocated_amount=line.allocated_amount,
                display_order=line.display_order,
                consumed_amount=consumed,
                remaining_amount=remaining,
                consumption_percentage=round(percentage, 1)
            ))
            total_consumed += consumed

        total_budget = sum(line.allocated_amount for line in version.budget_lines)
        total_remaining = total_budget - total_consumed

        return BudgetVersionResponse(
            id=version.id,
            product_id=version.product_id,
            year=version.year,
            name=version.name,
            notes=version.notes,
            status=version.status.value,
            total_budget=total_budget,
            total_consumed=total_consumed,
            total_remaining=total_remaining,
            budget_lines=budget_lines,
            created_at=version.created_at,
            updated_at=version.updated_at
        )
