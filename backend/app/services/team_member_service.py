from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Session, joinedload

from app.models.team import TeamMember, MemberQuarterlyAvailability, TeamStatus, MemberRole, ComponentHat, SiteHoliday
from app.models.holiday import MemberLeave, LeaveType
from app.schemas.team_member import (
    TeamMemberCreate, TeamMemberUpdate, TeamMemberResponse,
    MemberAvailabilityCreate, MemberAvailabilityUpdate, MemberAvailabilityResponse,
    ComponentHatCreate, ComponentHatUpdate, ComponentHatResponse, ComponentHatListResponse,
    MemberLeaveCreate, MemberLeaveUpdate, MemberLeaveResponse, MemberLeaveListResponse,
    SiteHolidayCreate, SiteHolidayUpdate, SiteHolidayResponse, SiteHolidayListResponse,
    MemberPIAllocationCreate, MemberPIAllocationResponse
)
from app.services.global_settings_service import GlobalSettingsService


class TeamMemberService:
    """Service layer for Team Member operations."""
    
    @staticmethod
    def get_by_team(
        db: Session,
        team_id: str,
        status: Optional[str] = None
    ) -> List[TeamMemberResponse]:
        """Get all members of a team."""
        query = db.query(TeamMember).filter(TeamMember.team_id == team_id)
        
        if status:
            query = query.filter(TeamMember.status == status)
        
        members = query.order_by(TeamMember.name).all()
        return [TeamMemberService.build_member_response(db, m) for m in members]
    
    @staticmethod
    def get_by_id(db: Session, member_id: str) -> Optional[TeamMember]:
        """Get a team member by ID."""
        return db.query(TeamMember).filter(TeamMember.id == member_id).first()
    
    @staticmethod
    def create(db: Session, team_id: str, data: TeamMemberCreate) -> TeamMemberResponse:
        """Add a new member to a team."""
        member = TeamMember(
            team_id=team_id,
            site_id=data.site_id,
            name=data.name,
            email=data.email,
            role=MemberRole(data.role),
            specialization=data.specialization,
            train_allocation_percent=data.train_allocation_percent,
            allocation_percentage=data.allocation_percentage,
            hours_per_day=data.hours_per_day,
            individual_productivity=data.individual_productivity,
            start_date=data.start_date or datetime.utcnow(),
            end_date=data.end_date,
            status=TeamStatus.ACTIVE
        )
        db.add(member)
        db.commit()
        db.refresh(member)
        return TeamMemberService.build_member_response(db, member)
    
    @staticmethod
    def update(db: Session, member_id: str, data: TeamMemberUpdate) -> TeamMemberResponse:
        """Update a team member."""
        member = db.query(TeamMember).filter(TeamMember.id == member_id).first()
        
        update_data = data.model_dump(exclude_unset=True)
        
        # Handle component_hat_ids separately
        component_hat_ids = update_data.pop('component_hat_ids', None)
        
        for field, value in update_data.items():
            if value is None:
                continue
            if field == 'role':
                value = MemberRole(value)
            elif field == 'status':
                value = TeamStatus(value)
            setattr(member, field, value)
        
        # Update component hats if provided
        if component_hat_ids is not None:
            hats = db.query(ComponentHat).filter(ComponentHat.id.in_(component_hat_ids)).all()
            member.component_hats = hats
        
        db.commit()
        db.refresh(member)
        return TeamMemberService.build_member_response(db, member)
    
    @staticmethod
    def delete(db: Session, member_id: str) -> None:
        """Remove a member from a team, including all related records."""
        from app.models.holiday import MemberLeave
        from app.models.team import MemberPIAllocation
        
        member = db.query(TeamMember).filter(TeamMember.id == member_id).first()
        if member:
            # Delete related records first to avoid foreign key constraints
            db.query(MemberLeave).filter(MemberLeave.member_id == member_id).delete()
            db.query(MemberPIAllocation).filter(MemberPIAllocation.member_id == member_id).delete()
            db.query(MemberQuarterlyAvailability).filter(MemberQuarterlyAvailability.member_id == member_id).delete()
            
            db.delete(member)
            db.commit()
    
    @staticmethod
    def get_availability(
        db: Session,
        member_id: str,
        year: int
    ) -> List[MemberAvailabilityResponse]:
        """Get member's availability for all quarters in a year."""
        availabilities = db.query(MemberQuarterlyAvailability).filter(
            MemberQuarterlyAvailability.member_id == member_id,
            MemberQuarterlyAvailability.year == year
        ).order_by(MemberQuarterlyAvailability.quarter).all()
        
        return [TeamMemberService.build_availability_response(a) for a in availabilities]
    
    @staticmethod
    def update_availability(
        db: Session,
        member_id: str,
        year: int,
        quarter: int,
        data: MemberAvailabilityUpdate
    ) -> MemberAvailabilityResponse:
        """Update or create availability for a specific quarter."""
        availability = db.query(MemberQuarterlyAvailability).filter(
            MemberQuarterlyAvailability.member_id == member_id,
            MemberQuarterlyAvailability.year == year,
            MemberQuarterlyAvailability.quarter == quarter
        ).first()
        
        if not availability:
            # Create new
            availability = MemberQuarterlyAvailability(
                member_id=member_id,
                year=year,
                quarter=quarter,
                working_days=data.working_days or 0,
                holidays=data.holidays or 0,
                leaves=data.leaves or 0,
                notes=data.notes
            )
            db.add(availability)
        else:
            # Update existing
            update_data = data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                if value is not None:
                    setattr(availability, field, value)
        
        db.commit()
        db.refresh(availability)
        return TeamMemberService.build_availability_response(availability)
    
    @staticmethod
    def set_availability(
        db: Session,
        member_id: str,
        data: MemberAvailabilityCreate
    ) -> MemberAvailabilityResponse:
        """Set availability for a specific quarter (create or update)."""
        availability = db.query(MemberQuarterlyAvailability).filter(
            MemberQuarterlyAvailability.member_id == member_id,
            MemberQuarterlyAvailability.year == data.year,
            MemberQuarterlyAvailability.quarter == data.quarter
        ).first()
        
        if not availability:
            availability = MemberQuarterlyAvailability(
                member_id=member_id,
                year=data.year,
                quarter=data.quarter,
                working_days=data.working_days,
                holidays=data.holidays,
                leaves=data.leaves,
                notes=data.notes
            )
            db.add(availability)
        else:
            availability.working_days = data.working_days
            availability.holidays = data.holidays
            availability.leaves = data.leaves
            availability.notes = data.notes
        
        db.commit()
        db.refresh(availability)
        return TeamMemberService.build_availability_response(availability)
    
    @staticmethod
    def build_member_response(db: Session, member: TeamMember) -> TeamMemberResponse:
        """Build a complete member response with calculated fields."""
        # Get current year's global settings for effective productivity
        current_year = datetime.now().year
        global_settings = GlobalSettingsService.get_or_create(db, current_year)
        
        effective_productivity = (
            member.individual_productivity 
            if member.individual_productivity is not None 
            else global_settings.global_productivity_percentage
        )
        
        # Calculate effective capacity: train_allocation * productivity / 100
        effective_capacity = (member.train_allocation_percent * effective_productivity) / 100
        
        # Get site name if site is assigned
        site_name = member.site.name if member.site else None
        
        # Get availability records
        availabilities = db.query(MemberQuarterlyAvailability).filter(
            MemberQuarterlyAvailability.member_id == member.id
        ).order_by(
            MemberQuarterlyAvailability.year.desc(),
            MemberQuarterlyAvailability.quarter
        ).all()
        
        # Build component hat responses
        component_hats = [
            ComponentHatResponse(
                id=hat.id,
                name=hat.name,
                color=hat.color,
                description=hat.description
            ) for hat in member.component_hats
        ]
        
        return TeamMemberResponse(
            id=member.id,
            team_id=member.team_id,
            site_id=member.site_id,
            site_name=site_name,
            name=member.name,
            email=member.email,
            role=member.role.value,
            specialization=member.specialization,
            train_allocation_percent=member.train_allocation_percent,
            allocation_percentage=member.allocation_percentage,
            hours_per_day=member.hours_per_day,
            individual_productivity=member.individual_productivity,
            effective_productivity=effective_productivity,
            effective_capacity_percent=round(effective_capacity, 1),
            start_date=member.start_date,
            end_date=member.end_date,
            status=member.status.value,
            created_at=member.created_at,
            updated_at=member.updated_at,
            availability=[TeamMemberService.build_availability_response(a) for a in availabilities],
            component_hats=component_hats
        )
    
    @staticmethod
    def build_availability_response(availability: MemberQuarterlyAvailability) -> MemberAvailabilityResponse:
        """Build availability response with calculated available_days."""
        available_days = availability.working_days - availability.holidays - availability.leaves
        
        return MemberAvailabilityResponse(
            id=availability.id,
            member_id=availability.member_id,
            year=availability.year,
            quarter=availability.quarter,
            working_days=availability.working_days,
            holidays=availability.holidays,
            leaves=availability.leaves,
            available_days=max(0, available_days),
            notes=availability.notes,
            created_at=availability.created_at
        )


class ComponentHatService:
    """Service layer for Component Hat operations."""
    
    @staticmethod
    def get_all(db: Session) -> List[ComponentHatResponse]:
        """Get all component hats."""
        hats = db.query(ComponentHat).order_by(ComponentHat.name).all()
        return [ComponentHatService.build_response(h) for h in hats]
    
    @staticmethod
    def get_by_id(db: Session, hat_id: str) -> Optional[ComponentHat]:
        """Get component hat by ID."""
        return db.query(ComponentHat).filter(ComponentHat.id == hat_id).first()
    
    @staticmethod
    def create(db: Session, data: ComponentHatCreate) -> ComponentHatResponse:
        """Create a new component hat."""
        hat = ComponentHat(
            name=data.name,
            color=data.color,
            description=data.description
        )
        db.add(hat)
        db.commit()
        db.refresh(hat)
        return ComponentHatService.build_response(hat)
    
    @staticmethod
    def update(db: Session, hat_id: str, data: ComponentHatUpdate) -> Optional[ComponentHatResponse]:
        """Update a component hat."""
        hat = db.query(ComponentHat).filter(ComponentHat.id == hat_id).first()
        if not hat:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(hat, field, value)
        
        db.commit()
        db.refresh(hat)
        return ComponentHatService.build_response(hat)
    
    @staticmethod
    def delete(db: Session, hat_id: str) -> bool:
        """Delete a component hat."""
        hat = db.query(ComponentHat).filter(ComponentHat.id == hat_id).first()
        if not hat:
            return False
        db.delete(hat)
        db.commit()
        return True
    
    @staticmethod
    def build_response(hat: ComponentHat) -> ComponentHatResponse:
        """Build component hat response."""
        return ComponentHatResponse(
            id=hat.id,
            name=hat.name,
            color=hat.color,
            description=hat.description
        )


class MemberLeaveService:
    """Service layer for Member Leave operations (iteration-based)."""
    
    @staticmethod
    def get_by_iteration(db: Session, iteration_id: str) -> List[MemberLeaveResponse]:
        """Get all leave records for an iteration."""
        leaves = db.query(MemberLeave).filter(
            MemberLeave.iteration_id == iteration_id
        ).all()
        return [MemberLeaveService.build_response(db, l) for l in leaves]
    
    @staticmethod
    def get_by_team_iteration(db: Session, team_id: str, iteration_id: str) -> List[MemberLeaveResponse]:
        """Get leave records for a team in an iteration."""
        leaves = db.query(MemberLeave).join(TeamMember).filter(
            TeamMember.team_id == team_id,
            MemberLeave.iteration_id == iteration_id
        ).all()
        return [MemberLeaveService.build_response(db, l) for l in leaves]
    
    @staticmethod
    def get_by_member(db: Session, member_id: str, iteration_id: Optional[str] = None) -> List[MemberLeaveResponse]:
        """Get leave records for a member, optionally filtered by iteration."""
        query = db.query(MemberLeave).filter(MemberLeave.member_id == member_id)
        if iteration_id:
            query = query.filter(MemberLeave.iteration_id == iteration_id)
        leaves = query.all()
        return [MemberLeaveService.build_response(db, l) for l in leaves]
    
    @staticmethod
    def create(db: Session, data: MemberLeaveCreate) -> MemberLeaveResponse:
        """Create a leave record for a member in an iteration."""
        leave = MemberLeave(
            member_id=data.member_id,
            iteration_id=data.iteration_id,
            leave_days=float(data.leave_days),  # Store as float to support decimals (e.g., 2.5)
            leave_type=LeaveType(data.leave_type),
            notes=data.notes
        )
        db.add(leave)
        db.commit()
        db.refresh(leave)
        return MemberLeaveService.build_response(db, leave)
    
    @staticmethod
    def update(db: Session, leave_id: str, data: MemberLeaveUpdate) -> Optional[MemberLeaveResponse]:
        """Update a leave record."""
        leave = db.query(MemberLeave).filter(MemberLeave.id == leave_id).first()
        if not leave:
            return None
        
        if data.leave_days is not None:
            leave.leave_days = float(data.leave_days)
        if data.leave_type is not None:
            leave.leave_type = LeaveType(data.leave_type)
        if data.notes is not None:
            leave.notes = data.notes
        
        db.commit()
        db.refresh(leave)
        return MemberLeaveService.build_response(db, leave)
    
    @staticmethod
    def delete(db: Session, leave_id: str) -> bool:
        """Delete a leave record."""
        leave = db.query(MemberLeave).filter(MemberLeave.id == leave_id).first()
        if not leave:
            return False
        db.delete(leave)
        db.commit()
        return True
    
    @staticmethod
    def build_response(db: Session, leave: MemberLeave) -> MemberLeaveResponse:
        """Build leave response with member and iteration names."""
        member = db.query(TeamMember).filter(TeamMember.id == leave.member_id).first()
        member_name = member.name if member else "Unknown"
        
        # Get iteration name
        from app.models.pi import Iteration
        iteration = db.query(Iteration).filter(Iteration.id == leave.iteration_id).first()
        iteration_name = iteration.name if iteration else "Unknown"
        
        return MemberLeaveResponse(
            id=leave.id,
            member_id=leave.member_id,
            member_name=member_name,
            iteration_id=leave.iteration_id,
            iteration_name=iteration_name,
            leave_days=Decimal(leave.leave_days) if leave.leave_days else Decimal(0),
            leave_type=leave.leave_type.value,
            notes=leave.notes,
            created_at=leave.created_at,
            updated_at=leave.updated_at
        )


class SiteHolidayService:
    """Service layer for Site Holiday operations."""
    
    @staticmethod
    def get_by_site(db: Session, site_id: str, year: Optional[int] = None) -> List[SiteHolidayResponse]:
        """Get holidays for a site, optionally filtered by year."""
        query = db.query(SiteHoliday).filter(SiteHoliday.site_id == site_id)
        if year:
            query = query.filter(SiteHoliday.year == year)
        holidays = query.order_by(SiteHoliday.date).all()
        return [SiteHolidayService.build_response(db, h) for h in holidays]
    
    @staticmethod
    def create(db: Session, data: SiteHolidayCreate) -> SiteHolidayResponse:
        """Create a site holiday."""
        holiday = SiteHoliday(
            site_id=data.site_id,
            date=datetime.combine(data.date, datetime.min.time()),
            name=data.name,
            year=data.year
        )
        db.add(holiday)
        db.commit()
        db.refresh(holiday)
        return SiteHolidayService.build_response(db, holiday)
    
    @staticmethod
    def update(db: Session, holiday_id: str, data: SiteHolidayUpdate) -> Optional[SiteHolidayResponse]:
        """Update a site holiday."""
        holiday = db.query(SiteHoliday).filter(SiteHoliday.id == holiday_id).first()
        if not holiday:
            return None
        
        if data.date is not None:
            holiday.date = datetime.combine(data.date, datetime.min.time())
        if data.name is not None:
            holiday.name = data.name
        
        db.commit()
        db.refresh(holiday)
        return SiteHolidayService.build_response(db, holiday)
    
    @staticmethod
    def delete(db: Session, holiday_id: str) -> bool:
        """Delete a site holiday."""
        holiday = db.query(SiteHoliday).filter(SiteHoliday.id == holiday_id).first()
        if not holiday:
            return False
        db.delete(holiday)
        db.commit()
        return True
    
    @staticmethod
    def build_response(db: Session, holiday: SiteHoliday) -> SiteHolidayResponse:
        """Build site holiday response."""
        from app.models.organization import Site
        site = db.query(Site).filter(Site.id == holiday.site_id).first()
        site_name = site.name if site else "Unknown"
        
        return SiteHolidayResponse(
            id=holiday.id,
            site_id=holiday.site_id,
            site_name=site_name,
            date=holiday.date.date() if isinstance(holiday.date, datetime) else holiday.date,
            name=holiday.name,
            year=holiday.year,
            created_at=holiday.created_at
        )


class MemberPIAllocationService:
    """Service for managing PI-level member allocations."""

    @staticmethod
    def get_by_team_pi(db: Session, team_id: str, pi_id: str) -> List[MemberPIAllocationResponse]:
        """Get all PI allocations for a team in a specific PI."""
        from app.models.team import MemberPIAllocation, TeamMember
        from app.models.pi import PI
        from app.schemas.team_member import MemberPIAllocationResponse
        
        # Get team members
        members = db.query(TeamMember).filter(
            TeamMember.team_id == team_id,
            TeamMember.status == TeamStatus.ACTIVE
        ).all()
        
        pi = db.query(PI).filter(PI.id == pi_id).first()
        pi_name = pi.name if pi else "Unknown"
        
        # Get global settings for default productivity
        current_year = datetime.now().year
        global_settings = GlobalSettingsService.get_or_create(db, current_year)
        
        results = []
        for member in members:
            allocation = db.query(MemberPIAllocation).filter(
                MemberPIAllocation.member_id == member.id,
                MemberPIAllocation.pi_id == pi_id
            ).first()
            
            # Get component hats for member
            component_hat_names = [hat.name for hat in member.component_hats] if member.component_hats else []
            
            if allocation:
                # Calculate effective productivity considering iteration-level overrides
                from app.models.member_iteration_productivity import MemberIterationProductivity
                from app.models.pi import Iteration
                
                # Get iterations for this PI
                iterations = db.query(Iteration).filter(Iteration.pi_id == pi_id).all()
                
                # Get iteration productivity overrides for this member
                iter_productivity_records = db.query(MemberIterationProductivity).filter(
                    MemberIterationProductivity.member_id == member.id,
                    MemberIterationProductivity.iteration_id.in_([it.id for it in iterations])
                ).all()
                iter_productivity_map = {r.iteration_id: r.productivity_percent for r in iter_productivity_records}
                
                # Base productivity (PI-level or individual or global)
                base_productivity = (
                    allocation.productivity_percent 
                    if allocation.productivity_percent is not None 
                    else (member.individual_productivity or global_settings.global_productivity_percentage)
                )
                
                # Calculate weighted average productivity based on iteration working days
                if iter_productivity_map and iterations:
                    total_working_days = 0
                    weighted_productivity_sum = 0
                    
                    for iteration in iterations:
                        # Calculate working days for this iteration
                        if iteration.start_date and iteration.end_date:
                            from datetime import timedelta
                            working_days = 0
                            current = iteration.start_date
                            while current <= iteration.end_date:
                                if current.weekday() < 5:  # Mon-Fri
                                    working_days += 1
                                current += timedelta(days=1)
                            
                            # Use iteration-specific productivity if set, otherwise base
                            iter_prod = iter_productivity_map.get(iteration.id, base_productivity)
                            weighted_productivity_sum += working_days * iter_prod
                            total_working_days += working_days
                    
                    effective_productivity = round(weighted_productivity_sum / total_working_days) if total_working_days > 0 else base_productivity
                else:
                    effective_productivity = base_productivity
                
                # Parse specializations from JSON string
                import json
                specializations = json.loads(allocation.specializations) if allocation.specializations else []
                
                results.append(MemberPIAllocationResponse(
                    id=allocation.id,
                    member_id=member.id,
                    member_name=member.name,
                    member_role=member.role.value if member.role else "developer",
                    pi_id=pi_id,
                    pi_name=pi_name,
                    train_allocation_percent=allocation.train_allocation_percent,
                    productivity_percent=allocation.productivity_percent,
                    agile_role_allocation_percent=allocation.agile_role_allocation_percent,
                    effective_productivity=effective_productivity,
                    is_scrum_master=allocation.is_scrum_master,
                    is_product_owner=allocation.is_product_owner,
                    is_other_role=allocation.is_other_role,
                    transversal_role=allocation.transversal_role,
                    specializations=specializations,
                    component_hats=component_hat_names,
                    ip_week_deduction=allocation.ip_week_deduction or 0,
                    notes=allocation.notes,
                    created_at=allocation.created_at,
                    updated_at=allocation.updated_at
                ))
            else:
                # Return default values for members without PI-specific allocation
                effective_productivity = member.individual_productivity or global_settings.global_productivity_percentage
                results.append(MemberPIAllocationResponse(
                    id="",  # No allocation exists
                    member_id=member.id,
                    member_name=member.name,
                    member_role=member.role.value if member.role else "developer",
                    pi_id=pi_id,
                    pi_name=pi_name,
                    agile_role_allocation_percent=0,
                    train_allocation_percent=member.train_allocation_percent,
                    productivity_percent=None,
                    effective_productivity=effective_productivity,
                    is_scrum_master=member.is_scrum_master,
                    is_product_owner=member.is_product_owner,
                    is_other_role=False,
                    transversal_role=member.transversal_role,
                    specializations=[],
                    component_hats=component_hat_names,
                    ip_week_deduction=0,
                    notes=None,
                    created_at=datetime.now(),
                    updated_at=None
                ))
        
        return results

    @staticmethod
    def get_by_member(db: Session, member_id: str) -> List[MemberPIAllocationResponse]:
        """Get all PI allocations for a member."""
        from app.models.team import MemberPIAllocation, TeamMember
        from app.models.pi import PI
        from app.schemas.team_member import MemberPIAllocationResponse
        
        member = db.query(TeamMember).filter(TeamMember.id == member_id).first()
        if not member:
            return []
        
        allocations = db.query(MemberPIAllocation).filter(
            MemberPIAllocation.member_id == member_id
        ).all()
        
        current_year = datetime.now().year
        global_settings = GlobalSettingsService.get_or_create(db, current_year)
        
        results = []
        for allocation in allocations:
            pi = db.query(PI).filter(PI.id == allocation.pi_id).first()
            pi_name = pi.name if pi else "Unknown"
            
            effective_productivity = (
                allocation.productivity_percent 
                if allocation.productivity_percent is not None 
                else (member.individual_productivity or global_settings.global_productivity_percentage)
            )
            
            results.append(MemberPIAllocationResponse(
                id=allocation.id,
                member_id=member.id,
                member_name=member.name,
                pi_id=allocation.pi_id,
                pi_name=pi_name,
                train_allocation_percent=allocation.train_allocation_percent,
                productivity_percent=allocation.productivity_percent,
                effective_productivity=effective_productivity,
                notes=allocation.notes,
                created_at=allocation.created_at,
                updated_at=allocation.updated_at
            ))
        
        return results

    @staticmethod
    def create_or_update(db: Session, member_id: str, pi_id: str, data: MemberPIAllocationCreate) -> MemberPIAllocationResponse:
        """Create or update a PI allocation for a member."""
        from app.models.team import MemberPIAllocation, TeamMember
        from app.models.pi import PI
        from app.schemas.team_member import MemberPIAllocationResponse
        
        member = db.query(TeamMember).filter(TeamMember.id == member_id).first()
        if not member:
            raise ValueError("Member not found")
        
        pi = db.query(PI).filter(PI.id == pi_id).first()
        if not pi:
            raise ValueError("PI not found")
        
        # Check if allocation exists
        allocation = db.query(MemberPIAllocation).filter(
            MemberPIAllocation.member_id == member_id,
            MemberPIAllocation.pi_id == pi_id
        ).first()
        
        import json
        specializations_json = json.dumps(data.specializations) if data.specializations else None
        
        if allocation:
            # Update existing
            allocation.train_allocation_percent = data.train_allocation_percent
            allocation.productivity_percent = data.productivity_percent
            allocation.agile_role_allocation_percent = data.agile_role_allocation_percent if hasattr(data, 'agile_role_allocation_percent') else 0
            allocation.is_scrum_master = data.is_scrum_master
            allocation.is_product_owner = data.is_product_owner
            allocation.is_other_role = data.is_other_role if hasattr(data, 'is_other_role') else False
            allocation.transversal_role = data.transversal_role
            allocation.specializations = specializations_json
            allocation.ip_week_deduction = data.ip_week_deduction or 0
            allocation.notes = data.notes
        else:
            # Create new
            allocation = MemberPIAllocation(
                member_id=member_id,
                pi_id=pi_id,
                train_allocation_percent=data.train_allocation_percent,
                productivity_percent=data.productivity_percent,
                agile_role_allocation_percent=data.agile_role_allocation_percent if hasattr(data, 'agile_role_allocation_percent') else 0,
                is_scrum_master=data.is_scrum_master,
                is_product_owner=data.is_product_owner,
                is_other_role=data.is_other_role if hasattr(data, 'is_other_role') else False,
                transversal_role=data.transversal_role,
                specializations=specializations_json,
                ip_week_deduction=data.ip_week_deduction or 0,
                notes=data.notes
            )
            db.add(allocation)
        
        # Handle component hats assignment
        if data.component_hat_ids is not None:
            # Clear existing component hats
            member.component_hats.clear()
            
            # Add new component hats
            if data.component_hat_ids:
                component_hats = db.query(ComponentHat).filter(
                    ComponentHat.id.in_(data.component_hat_ids)
                ).all()
                member.component_hats.extend(component_hats)
        
        db.commit()
        db.refresh(allocation)
        
        current_year = datetime.now().year
        global_settings = GlobalSettingsService.get_or_create(db, current_year)
        effective_productivity = (
            allocation.productivity_percent 
            if allocation.productivity_percent is not None 
            else (member.individual_productivity or global_settings.global_productivity_percentage)
        )
        
        # Get component hats for member
        component_hat_names = [hat.name for hat in member.component_hats] if member.component_hats else []
        specializations = json.loads(allocation.specializations) if allocation.specializations else []
        
        return MemberPIAllocationResponse(
            id=allocation.id,
            member_id=member.id,
            member_name=member.name,
            member_role=member.role.value if member.role else "developer",
            pi_id=pi_id,
            pi_name=pi.name,
            train_allocation_percent=allocation.train_allocation_percent,
            productivity_percent=allocation.productivity_percent,
            agile_role_allocation_percent=allocation.agile_role_allocation_percent,
            effective_productivity=effective_productivity,
            is_scrum_master=allocation.is_scrum_master,
            is_product_owner=allocation.is_product_owner,
            is_other_role=allocation.is_other_role,
            transversal_role=allocation.transversal_role,
            specializations=specializations,
            component_hats=component_hat_names,
            ip_week_deduction=allocation.ip_week_deduction or 0,
            notes=allocation.notes,
            created_at=allocation.created_at,
            updated_at=allocation.updated_at
        )

    @staticmethod
    def delete(db: Session, allocation_id: str) -> bool:
        """Delete a PI allocation."""
        from app.models.team import MemberPIAllocation
        
        allocation = db.query(MemberPIAllocation).filter(
            MemberPIAllocation.id == allocation_id
        ).first()
        
        if not allocation:
            return False
        
        db.delete(allocation)
        db.commit()
        return True

    @staticmethod
    def get_effective_allocation(db: Session, member_id: str, pi_id: str) -> tuple:
        """Get effective train allocation and productivity for a member in a PI.
        
        Returns (train_allocation_percent, productivity_percent)
        Uses PI-specific values if available, otherwise falls back to member defaults.
        """
        from app.models.team import MemberPIAllocation, TeamMember
        
        member = db.query(TeamMember).filter(TeamMember.id == member_id).first()
        if not member:
            return (100, 70)  # Default values
        
        allocation = db.query(MemberPIAllocation).filter(
            MemberPIAllocation.member_id == member_id,
            MemberPIAllocation.pi_id == pi_id
        ).first()
        
        current_year = datetime.now().year
        global_settings = GlobalSettingsService.get_or_create(db, current_year)
        
        if allocation:
            train_alloc = allocation.train_allocation_percent
            productivity = (
                allocation.productivity_percent 
                if allocation.productivity_percent is not None 
                else (member.individual_productivity or global_settings.global_productivity_percentage)
            )
        else:
            train_alloc = member.train_allocation_percent
            productivity = member.individual_productivity or global_settings.global_productivity_percentage
        
        return (train_alloc, productivity)
