"""
Budget Configuration Service
Handles business logic for budget management with versioning and transversal support.
"""
from typing import List, Optional, Dict, Tuple
from uuid import UUID
from datetime import date, datetime
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func

from app.models.budget_new import (
    FiscalYear, BudgetVersion, ProductBudget, BudgetLine, 
    BudgetLineProduct, BudgetCategory, BudgetAuditLog,
    AllocationType, EntityType, AuditAction
)
from app.schemas.budget_config import (
    FiscalYearCreate, BudgetVersionCreate, ProductBudgetCreate,
    BudgetLineCreate, BudgetCategoryCreate
)


class BudgetConfigService:
    """Service for budget configuration operations."""

    # ============= Fiscal Year Operations =============

    @staticmethod
    def get_fiscal_years(db: Session) -> List[FiscalYear]:
        """Get all fiscal years."""
        return db.query(FiscalYear).order_by(FiscalYear.year.desc()).all()

    @staticmethod
    def get_current_fiscal_year(db: Session) -> Optional[FiscalYear]:
        """Get the current fiscal year."""
        return db.query(FiscalYear).filter(FiscalYear.is_current == True).first()

    @staticmethod
    def create_fiscal_year(db: Session, data: FiscalYearCreate) -> FiscalYear:
        """Create a new fiscal year."""
        # If setting as current, unset other current fiscal years
        if data.is_current:
            db.query(FiscalYear).update({FiscalYear.is_current: False})
        
        fiscal_year = FiscalYear(**data.model_dump())
        db.add(fiscal_year)
        db.commit()
        db.refresh(fiscal_year)
        return fiscal_year

    @staticmethod
    def update_fiscal_year(db: Session, fiscal_year_id: UUID, is_current: bool) -> Optional[FiscalYear]:
        """Update fiscal year (mainly to set as current)."""
        fiscal_year = db.query(FiscalYear).filter(FiscalYear.id == str(fiscal_year_id)).first()
        if not fiscal_year:
            return None
        
        if is_current:
            # Unset other current fiscal years
            db.query(FiscalYear).update({FiscalYear.is_current: False})
        
        fiscal_year.is_current = is_current
        fiscal_year.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(fiscal_year)
        return fiscal_year

    # ============= Budget Version Operations =============

    @staticmethod
    def get_budget_versions(db: Session, fiscal_year_id: UUID) -> List[BudgetVersion]:
        """Get all budget versions for a fiscal year."""
        return db.query(BudgetVersion).filter(
            BudgetVersion.fiscal_year_id == str(fiscal_year_id)
        ).order_by(BudgetVersion.version_number.desc()).all()

    @staticmethod
    def get_active_budget_version(db: Session, fiscal_year_id: UUID) -> Optional[BudgetVersion]:
        """Get the active budget version for a fiscal year."""
        return db.query(BudgetVersion).filter(
            and_(
                BudgetVersion.fiscal_year_id == str(fiscal_year_id),
                BudgetVersion.is_active == True
            )
        ).first()

    @staticmethod
    def create_budget_version(
        db: Session, 
        data: BudgetVersionCreate, 
        user_id: UUID
    ) -> BudgetVersion:
        """Create a new budget version."""
        # Get next version number
        max_version = db.query(func.max(BudgetVersion.version_number)).filter(
            BudgetVersion.fiscal_year_id == str(data.fiscal_year_id)
        ).scalar() or 0
        
        # Deactivate previous active version
        db.query(BudgetVersion).filter(
            and_(
                BudgetVersion.fiscal_year_id == str(data.fiscal_year_id),
                BudgetVersion.is_active == True
            )
        ).update({BudgetVersion.is_active: False})
        
        # Create new version
        version = BudgetVersion(
            fiscal_year_id=str(data.fiscal_year_id),
            version_number=max_version + 1,
            effective_date=data.effective_date,
            notes=data.notes,
            is_active=True,
            created_by=str(user_id)
        )
        db.add(version)
        db.flush()
        
        # Copy from previous version if requested
        if data.copy_from_version_id:
            BudgetConfigService._copy_budget_data(
                db, 
                str(data.copy_from_version_id), 
                version.id,
                user_id
            )
        
        db.commit()
        db.refresh(version)
        return version

    @staticmethod
    def _copy_budget_data(
        db: Session, 
        from_version_id: str, 
        to_version_id: str,
        user_id: UUID
    ):
        """Copy budget data from one version to another."""
        from_version = db.query(BudgetVersion).filter(
            BudgetVersion.id == from_version_id
        ).first()
        
        if not from_version:
            return
        
        # Copy product budgets
        for old_pb in from_version.product_budgets:
            new_pb = ProductBudget(
                budget_version_id=to_version_id,
                product_id=old_pb.product_id,
                allocated_amount=old_pb.allocated_amount
            )
            db.add(new_pb)
            db.flush()
            
            # Copy budget lines
            for old_bl in old_pb.budget_lines:
                new_bl = BudgetLine(
                    product_budget_id=new_pb.id if not old_bl.is_transversal else None,
                    code=old_bl.code,
                    name=old_bl.name,
                    allocated_amount=old_bl.allocated_amount,
                    is_transversal=old_bl.is_transversal,
                    created_by=str(user_id)
                )
                db.add(new_bl)
                db.flush()
                
                # Copy categories
                for old_cat in old_bl.categories:
                    new_cat = BudgetCategory(
                        budget_line_id=new_bl.id,
                        name=old_cat.name,
                        allocated_amount=old_cat.allocated_amount,
                        created_by=str(user_id)
                    )
                    db.add(new_cat)
                
                # Copy transversal allocations
                if old_bl.is_transversal:
                    for old_alloc in old_bl.transversal_products:
                        new_alloc = BudgetLineProduct(
                            budget_line_id=new_bl.id,
                            product_budget_id=new_pb.id,
                            allocation_type=old_alloc.allocation_type,
                            allocation_value=old_alloc.allocation_value
                        )
                        db.add(new_alloc)

    @staticmethod
    def get_budget_version_detail(db: Session, version_id: UUID) -> Optional[BudgetVersion]:
        """Get budget version with full hierarchy."""
        return db.query(BudgetVersion).options(
            joinedload(BudgetVersion.product_budgets)
            .joinedload(ProductBudget.budget_lines)
            .joinedload(BudgetLine.categories)
        ).filter(BudgetVersion.id == str(version_id)).first()

    # ============= Product Budget Operations =============

    @staticmethod
    def get_product_budgets(
        db: Session, 
        fiscal_year_id: Optional[UUID] = None,
        version_id: Optional[UUID] = None
    ) -> List[ProductBudget]:
        """Get product budgets for a version."""
        if version_id:
            version = db.query(BudgetVersion).filter(BudgetVersion.id == str(version_id)).first()
        elif fiscal_year_id:
            version = BudgetConfigService.get_active_budget_version(db, fiscal_year_id)
        else:
            fiscal_year = BudgetConfigService.get_current_fiscal_year(db)
            version = BudgetConfigService.get_active_budget_version(db, UUID(fiscal_year.id)) if fiscal_year else None
        
        if not version:
            return []
        
        return db.query(ProductBudget).filter(
            ProductBudget.budget_version_id == version.id
        ).all()

    @staticmethod
    def create_or_update_product_budget(
        db: Session, 
        data: ProductBudgetCreate
    ) -> ProductBudget:
        """Create or update product budget."""
        existing = db.query(ProductBudget).filter(
            and_(
                ProductBudget.budget_version_id == str(data.budget_version_id),
                ProductBudget.product_id == str(data.product_id)
            )
        ).first()
        
        if existing:
            existing.allocated_amount = data.allocated_amount
            existing.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            return existing
        else:
            # Convert UUIDs to strings for SQLite compatibility
            product_budget = ProductBudget(
                budget_version_id=str(data.budget_version_id),
                product_id=str(data.product_id),
                allocated_amount=data.allocated_amount
            )
            db.add(product_budget)
            db.commit()
            db.refresh(product_budget)
            return product_budget

    @staticmethod
    def get_product_budget_detail(db: Session, product_budget_id: UUID) -> Optional[ProductBudget]:
        """Get product budget with budget lines."""
        return db.query(ProductBudget).options(
            joinedload(ProductBudget.budget_lines)
            .joinedload(BudgetLine.categories)
        ).filter(ProductBudget.id == str(product_budget_id)).first()

    # ============= Budget Line Operations =============

    @staticmethod
    def _get_or_create_product_budget(
        db: Session,
        budget_version_id: UUID,
        product_id: UUID
    ) -> ProductBudget:
        """Get existing ProductBudget or create a new one with 0 amount (will be calculated)."""
        existing = db.query(ProductBudget).filter(
            and_(
                ProductBudget.budget_version_id == str(budget_version_id),
                ProductBudget.product_id == str(product_id)
            )
        ).first()
        
        if existing:
            return existing
        
        # Auto-create ProductBudget with 0 amount (will be calculated from lines)
        product_budget = ProductBudget(
            budget_version_id=str(budget_version_id),
            product_id=str(product_id),
            allocated_amount=0  # Will be calculated from sum of budget lines
        )
        db.add(product_budget)
        db.flush()
        return product_budget

    @staticmethod
    def _update_budget_line_total(db: Session, budget_line_id: str) -> None:
        """Recalculate BudgetLine allocated_amount from sum of its categories."""
        total = db.query(func.sum(BudgetCategory.allocated_amount)).filter(
            BudgetCategory.budget_line_id == str(budget_line_id)
        ).scalar()

        # If no categories remain, default to 0
        total = total if total is not None else 0

        budget_line = db.query(BudgetLine).filter(
            BudgetLine.id == str(budget_line_id)
        ).first()

        if budget_line:
            budget_line.allocated_amount = total
            budget_line.updated_at = datetime.utcnow()
            # No commit here — caller will commit after cascading up

    @staticmethod
    def _update_product_budget_total(db: Session, product_budget_id: str) -> None:
        """Recalculate ProductBudget allocated_amount from sum of its budget lines."""
        # Query for sum, ensuring we handle the case where budget line was just deleted
        total = db.query(func.sum(BudgetLine.allocated_amount)).filter(
            BudgetLine.product_budget_id == str(product_budget_id)
        ).scalar()
        
        # If no lines exist, total will be None, so default to 0
        total = total if total is not None else 0
        
        product_budget = db.query(ProductBudget).filter(
            ProductBudget.id == str(product_budget_id)
        ).first()
        
        if product_budget:
            product_budget.allocated_amount = total
            product_budget.updated_at = datetime.utcnow()
            # No need to flush here, parent function will commit

    @staticmethod
    def create_budget_line(
        db: Session, 
        data: BudgetLineCreate, 
        user_id: UUID
    ) -> BudgetLine:
        """Create a budget line (transversal or non-transversal)."""
        product_budget_id = None
        
        # For non-transversal lines, auto-create ProductBudget if needed
        if not data.is_transversal and data.product_id:
            product_budget = BudgetConfigService._get_or_create_product_budget(
                db, data.budget_version_id, data.product_id
            )
            product_budget_id = product_budget.id
        
        budget_line = BudgetLine(
            budget_version_id=str(data.budget_version_id),
            product_id=str(data.product_id) if data.product_id else None,
            product_budget_id=product_budget_id,
            code=data.code.upper(),
            name=data.name,
            allocated_amount=data.allocated_amount,
            is_transversal=data.is_transversal,
            created_by=str(user_id)
        )
        db.add(budget_line)
        db.flush()
        
        # Add transversal product allocations
        if data.is_transversal and data.product_allocations:
            for alloc_data in data.product_allocations:
                allocation = BudgetLineProduct(
                    budget_line_id=budget_line.id,
                    product_budget_id=str(alloc_data.product_budget_id),
                    allocation_type=alloc_data.allocation_type,
                    allocation_value=alloc_data.allocation_value
                )
                db.add(allocation)
        
        # Update ProductBudget total (auto-calculate from lines)
        if product_budget_id:
            BudgetConfigService._update_product_budget_total(db, product_budget_id)
        
        # Log creation
        BudgetConfigService._log_audit(
            db, EntityType.BUDGET_LINE, budget_line.id, 
            AuditAction.CREATE, None, None, str(data.allocated_amount), user_id
        )
        
        db.commit()
        db.refresh(budget_line)
        return budget_line

    @staticmethod
    def update_budget_line(
        db: Session, 
        budget_line_id: UUID, 
        name: Optional[str], 
        allocated_amount: Optional[int],
        user_id: UUID
    ) -> Optional[BudgetLine]:
        """Update budget line."""
        budget_line = db.query(BudgetLine).filter(BudgetLine.id == str(budget_line_id)).first()
        if not budget_line:
            return None
        
        if name:
            old_name = budget_line.name
            budget_line.name = name
            BudgetConfigService._log_audit(
                db, EntityType.BUDGET_LINE, budget_line.id,
                AuditAction.UPDATE, "name", old_name, name, user_id
            )
        
        if allocated_amount is not None:
            old_amount = budget_line.allocated_amount
            budget_line.allocated_amount = allocated_amount
            BudgetConfigService._log_audit(
                db, EntityType.BUDGET_LINE, budget_line.id,
                AuditAction.UPDATE, "allocated_amount", str(old_amount), str(allocated_amount), user_id
            )
        
        budget_line.updated_at = datetime.utcnow()
        budget_line.updated_by = str(user_id)
        db.commit()
        db.refresh(budget_line)
        return budget_line

    @staticmethod
    def delete_budget_line(db: Session, budget_line_id: UUID, user_id: UUID) -> dict:
        """Delete budget line (cascades to categories).
        
        Returns:
            dict with keys: success (bool), error_code (str|None), 
                            message (str|None), features (list|None)
        """
        budget_line = db.query(BudgetLine).filter(BudgetLine.id == str(budget_line_id)).first()
        
        if not budget_line:
            return {"success": False, "error_code": "NOT_FOUND", 
                    "message": "Budget line not found", "features": None}

        # ── Pre-delete reference check ──────────────────────────────────────
        # Import here to avoid circular imports
        from app.models.feature_budget_allocation import FeatureBudgetLineAllocation
        from app.models.roadmap_v4 import RoadmapFeature

        references = (
            db.query(
                FeatureBudgetLineAllocation.id,
                RoadmapFeature.name.label("feature_name")
            )
            .join(
                RoadmapFeature,
                func.lower(FeatureBudgetLineAllocation.feature_id) == func.lower(RoadmapFeature.id)
            )
            .filter(
                func.lower(FeatureBudgetLineAllocation.budget_line_id) == func.lower(str(budget_line_id))
            )
            .all()
        )

        if references:
            feature_names = [r.feature_name for r in references]
            return {
                "success": False,
                "error_code": "HAS_REFERENCES",
                "message": (
                    f"Cannot delete budget line '{budget_line.name}' — "
                    f"it is allocated to {len(references)} feature(s) in Roadmap Planning. "
                    f"Please remove the budget line allocation from those features first."
                ),
                "features": feature_names
            }
        # ────────────────────────────────────────────────────────────────────

        # Store product_budget_id before deletion
        product_budget_id = budget_line.product_budget_id
        
        # Log audit
        BudgetConfigService._log_audit(
            db, EntityType.BUDGET_LINE, budget_line.id,
            AuditAction.DELETE, None, str(budget_line.allocated_amount), None, user_id
        )
        
        db.delete(budget_line)
        db.flush()  # Ensure delete is processed before recalculating total
        
        # Update ProductBudget total after deletion is flushed
        if product_budget_id:
            BudgetConfigService._update_product_budget_total(db, product_budget_id)
        
        db.commit()
        return {"success": True, "error_code": None, "message": None, "features": None}

    @staticmethod
    def delete_product_budget(db: Session, product_budget_id: UUID) -> bool:
        """Delete product budget and all associated budget lines."""
        product_budget = db.query(ProductBudget).filter(
            ProductBudget.id == str(product_budget_id)
        ).first()
        
        if not product_budget:
            return False
        
        # Delete will cascade to budget lines and categories due to foreign key constraints
        db.delete(product_budget)
        db.commit()
        return True

    # ============= Budget Category Operations =============

    @staticmethod
    def create_budget_category(
        db: Session, 
        data: BudgetCategoryCreate, 
        user_id: UUID
    ) -> BudgetCategory:
        """Create a budget category."""
        category = BudgetCategory(
            budget_line_id=str(data.budget_line_id),
            name=data.name,
            allocated_amount=data.allocated_amount,
            created_by=str(user_id)
        )
        db.add(category)
        db.flush()  # Generate ID before logging
        
        BudgetConfigService._log_audit(
            db, EntityType.CATEGORY, category.id,
            AuditAction.CREATE, None, None, str(data.allocated_amount), user_id
        )
        
        db.commit()
        db.refresh(category)
        return category

    @staticmethod
    def update_budget_category(
        db: Session, 
        category_id: UUID, 
        name: Optional[str], 
        allocated_amount: Optional[int],
        user_id: UUID
    ) -> Optional[BudgetCategory]:
        """Update budget category."""
        category = db.query(BudgetCategory).filter(BudgetCategory.id == str(category_id)).first()
        if not category:
            return None
        
        if name:
            old_name = category.name
            category.name = name
            BudgetConfigService._log_audit(
                db, EntityType.CATEGORY, category.id,
                AuditAction.UPDATE, "name", old_name, name, user_id
            )
        
        if allocated_amount is not None:
            old_amount = category.allocated_amount
            category.allocated_amount = allocated_amount
            BudgetConfigService._log_audit(
                db, EntityType.CATEGORY, category.id,
                AuditAction.UPDATE, "allocated_amount", str(old_amount), str(allocated_amount), user_id
            )
        
        category.updated_at = datetime.utcnow()
        category.updated_by = str(user_id)
        db.commit()
        db.refresh(category)
        return category

    @staticmethod
    def delete_budget_category(db: Session, category_id: UUID, user_id: UUID) -> bool:
        """Delete budget category and recalculate parent BudgetLine and ProductBudget totals."""
        category = db.query(BudgetCategory).filter(BudgetCategory.id == str(category_id)).first()
        if not category:
            return False
        
        # Store parent IDs before deletion
        budget_line_id = category.budget_line_id
        
        # TODO: Check if features are allocated to this category
        
        # Log audit before deletion
        BudgetConfigService._log_audit(
            db, EntityType.CATEGORY, category.id,
            AuditAction.DELETE, None, str(category.allocated_amount), None, user_id
        )
        
        db.delete(category)
        db.flush()  # Ensure delete is processed before recalculating
        
        # Cascade recalculation upward: Category → BudgetLine → ProductBudget
        if budget_line_id:
            # Step 1: Recalculate BudgetLine total from remaining categories
            BudgetConfigService._update_budget_line_total(db, budget_line_id)
            db.flush()
            
            # Step 2: Get the product_budget_id from the updated BudgetLine
            budget_line = db.query(BudgetLine).filter(
                BudgetLine.id == str(budget_line_id)
            ).first()
            if budget_line and budget_line.product_budget_id:
                # Step 3: Recalculate ProductBudget total from remaining lines
                BudgetConfigService._update_product_budget_total(
                    db, budget_line.product_budget_id
                )
        
        db.commit()
        return True

    # ============= Summary & Reporting =============

    @staticmethod
    def get_budget_summary(
        db: Session,
        fiscal_year_id: Optional[UUID] = None,
        version_id: Optional[UUID] = None
    ) -> Dict:
        """Get budget summary with totals and breakdown."""
        if version_id:
            version = db.query(BudgetVersion).filter(BudgetVersion.id == str(version_id)).first()
        elif fiscal_year_id:
            version = BudgetConfigService.get_active_budget_version(db, fiscal_year_id)
        else:
            fiscal_year = BudgetConfigService.get_current_fiscal_year(db)
            version = BudgetConfigService.get_active_budget_version(db, UUID(fiscal_year.id)) if fiscal_year else None
        
        if not version:
            return {}
        
        product_budgets = db.query(ProductBudget).filter(
            ProductBudget.budget_version_id == version.id
        ).all()
        
        total_budget = sum(pb.allocated_amount for pb in product_budgets)
        # TODO: Calculate consumed amounts from features
        total_consumed = 0
        
        return {
            "fiscal_year": version.fiscal_year,
            "version": version,
            "total_budget": total_budget,
            "total_consumed": total_consumed,
            "total_remaining": total_budget - total_consumed,
            "utilization_percentage": (total_consumed / total_budget * 100) if total_budget > 0 else 0,
            "products": product_budgets
        }

    # ============= Audit Operations =============

    @staticmethod
    def _log_audit(
        db: Session,
        entity_type: EntityType,
        entity_id: str,
        action: AuditAction,
        field_changed: Optional[str],
        old_value: Optional[str],
        new_value: Optional[str],
        user_id: UUID
    ):
        """Log audit entry."""
        audit_log = BudgetAuditLog(
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            field_changed=field_changed,
            old_value=old_value,
            new_value=new_value,
            changed_by=str(user_id)
        )
        db.add(audit_log)

    @staticmethod
    def get_audit_log(
        db: Session,
        entity_type: Optional[EntityType] = None,
        entity_id: Optional[UUID] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        changed_by: Optional[UUID] = None,
        page: int = 1,
        page_size: int = 50
    ) -> Tuple[List[BudgetAuditLog], int]:
        """Get audit log with filters and pagination."""
        query = db.query(BudgetAuditLog)
        
        if entity_type:
            query = query.filter(BudgetAuditLog.entity_type == entity_type)
        if entity_id:
            query = query.filter(BudgetAuditLog.entity_id == str(entity_id))
        if start_date:
            query = query.filter(BudgetAuditLog.changed_at >= start_date)
        if end_date:
            query = query.filter(BudgetAuditLog.changed_at <= end_date)
        if changed_by:
            query = query.filter(BudgetAuditLog.changed_by == str(changed_by))
        
        total = query.count()
        
        logs = query.order_by(BudgetAuditLog.changed_at.desc()).offset(
            (page - 1) * page_size
        ).limit(page_size).all()
        
        return logs, total
