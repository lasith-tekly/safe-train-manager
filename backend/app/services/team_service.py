import datetime
from typing import Optional, Tuple, List
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.models.team import Team, TeamCapacity, TeamStatus, TeamMember, MemberRole, MemberPIAllocation
from app.models.product import Product
from app.models.pi import PI, Iteration
from app.models.capacity_allocation import CapacityAllocationCategory
from app.models.holiday import MemberLeave
from app.models.member_iteration_productivity import MemberIterationProductivity
from app.services.capacity_calculator import CapacityCalculator
from app.schemas.team import (
    TeamCreate,
    TeamUpdate,
    TeamResponse,
    TeamCapacityUpdate,
    TeamCapacityResponse,
    QuarterCapacity,
    ProductSummary
)
from app.schemas.team_capacity_detail import (
    TeamPICapacityDetail,
    CapacitySummary,
    RoleCapacityDetail,
    AllocationSummary,
    AllocationByRole,
    IterationCapacityDetail,
    IterationAllocationDetail,
    MemberCapacityDetail,
    MemberIterationCapacity
)


class TeamService:
    """Service layer for Team business logic."""

    @staticmethod
    def get_all(
        db: Session,
        status: Optional[str] = None,
        search: Optional[str] = None,
        year: Optional[int] = None,
        pi_id: Optional[str] = None,
        train_id: Optional[str] = None
    ) -> Tuple[List[TeamResponse], int]:
        """Get all teams with optional filtering."""
        query = db.query(Team)

        if train_id is not None:
            query = query.filter(Team.train_id == train_id)

        if status and status != 'all':
            query = query.filter(Team.status == status)

        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Team.name.ilike(search_term),
                    Team.short_code.ilike(search_term)
                )
            )

        total = query.count()
        teams = query.order_by(Team.name).all()

        result = [TeamService.build_team_response(db, t, year, pi_id) for t in teams]
        return result, total

    @staticmethod
    def get_by_id(db: Session, team_id: UUID) -> Optional[Team]:
        """Get team by ID."""
        # Convert UUID to string for SQLite compatibility
        team_id_str = str(team_id)
        return db.query(Team).filter(Team.id == team_id_str).first()

    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[Team]:
        """Get team by name (case-insensitive)."""
        return db.query(Team).filter(
            func.lower(Team.name) == func.lower(name)
        ).first()

    @staticmethod
    def get_by_short_code(db: Session, short_code: str) -> Optional[Team]:
        """Get team by short code (case-insensitive)."""
        return db.query(Team).filter(
            func.lower(Team.short_code) == func.lower(short_code)
        ).first()

    @staticmethod
    def create(db: Session, data: TeamCreate, train_id: Optional[str] = None) -> Team:
        """Create a new team."""
        team = Team(
            name=data.name.strip(),
            short_code=data.short_code.upper().strip(),
            description=data.description,
            site_id=str(data.site_id) if data.site_id else None,
            status=TeamStatus(data.status),
            train_id=train_id
        )
        db.add(team)
        db.flush()

        # Assign product if provided
        if data.product_id:
            product = db.query(Product).filter(Product.id == str(data.product_id)).first()
            if product:
                team.products.append(product)

        # Create capacity if provided
        if data.capacity:
            capacity = TeamCapacity(
                team_id=team.id,
                year=data.capacity.year,
                q1_capacity=data.capacity.q1_capacity,
                q2_capacity=data.capacity.q2_capacity,
                q3_capacity=data.capacity.q3_capacity,
                q4_capacity=data.capacity.q4_capacity
            )
            db.add(capacity)

        db.commit()
        db.refresh(team)
        return team

    @staticmethod
    def update(db: Session, team_id: UUID, data: TeamUpdate) -> Team:
        """Update an existing team."""
        team_id_str = str(team_id)
        team = db.query(Team).filter(Team.id == team_id_str).first()

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is None:
                continue
            if field == 'product_id':
                # Handle product assignment separately
                team.products.clear()
                if value:
                    product = db.query(Product).filter(Product.id == str(value)).first()
                    if product:
                        team.products.append(product)
                continue
            if field == 'site_id':
                value = str(value) if value else None
            if field == 'short_code':
                value = value.upper().strip()
            if field == 'status':
                value = TeamStatus(value)
            if field == 'name':
                value = value.strip()
            setattr(team, field, value)

        db.commit()
        db.refresh(team)
        return team

    @staticmethod
    def delete(db: Session, team_id: UUID) -> None:
        """Delete a team."""
        team_id_str = str(team_id)
        team = db.query(Team).filter(Team.id == team_id_str).first()
        db.delete(team)
        db.commit()

    @staticmethod
    def can_delete(db: Session, team_id: UUID) -> Tuple[bool, str]:
        """Check if team can be deleted."""
        from app.models.team import TeamMember
        from app.models.team_planning import POPlanVersion, TeamPlanning
        from app.models.roadmap_v4 import JiraRecord, FeatureTeam

        team_id_str = str(team_id)

        # Check for team members
        member_count = db.query(TeamMember).filter(TeamMember.team_id == team_id_str).count()
        if member_count > 0:
            return False, f"Team has {member_count} member(s). Please remove all team members before deleting the team."

        # Check for roadmap features assigned to team
        feature_count = db.query(FeatureTeam).filter(FeatureTeam.team_id == team_id_str).count()
        if feature_count > 0:
            return False, f"Team is assigned to {feature_count} roadmap feature(s). Please unassign features before deleting the team."

        # Check for JIRA records
        jira_count = db.query(JiraRecord).filter(JiraRecord.team_id == team_id_str).count()
        if jira_count > 0:
            return False, f"Team has {jira_count} JIRA record(s). Please reassign or delete JIRA records before deleting the team."

        # Check for planning versions
        plan_count = db.query(POPlanVersion).filter(POPlanVersion.team_id == team_id_str).count()
        if plan_count > 0:
            return False, f"Team has {plan_count} planning version(s). Planning data will be lost. Please archive or delete planning versions before deleting the team."

        # Check for team planning items
        planning_item_count = db.query(TeamPlanning).filter(TeamPlanning.team_id == team_id_str).count()
        if planning_item_count > 0:
            return False, f"Team has {planning_item_count} planning item(s). Please delete planning items before deleting the team."

        return True, ""

    @staticmethod
    def get_capacity(db: Session, team_id: UUID, year: int) -> Optional[TeamCapacity]:
        """Get team capacity for a year."""
        team_id_str = str(team_id)
        return db.query(TeamCapacity).filter(
            TeamCapacity.team_id == team_id_str,
            TeamCapacity.year == year
        ).first()

    @staticmethod
    def update_capacity(
        db: Session,
        team_id: UUID,
        year: int,
        data: TeamCapacityUpdate
    ) -> TeamCapacity:
        """Update or create team capacity for a year."""
        team_id_str = str(team_id)
        capacity = TeamService.get_capacity(db, team_id, year)

        if not capacity:
            # Create new capacity record
            capacity = TeamCapacity(
                team_id=team_id_str,
                year=year,
                q1_capacity=data.q1_capacity or 0,
                q2_capacity=data.q2_capacity or 0,
                q3_capacity=data.q3_capacity or 0,
                q4_capacity=data.q4_capacity or 0
            )
            db.add(capacity)
        else:
            # Update existing
            if data.q1_capacity is not None:
                capacity.q1_capacity = data.q1_capacity
            if data.q2_capacity is not None:
                capacity.q2_capacity = data.q2_capacity
            if data.q3_capacity is not None:
                capacity.q3_capacity = data.q3_capacity
            if data.q4_capacity is not None:
                capacity.q4_capacity = data.q4_capacity

        db.commit()
        db.refresh(capacity)
        return capacity

    @staticmethod
    def get_quarter_allocated(db: Session, team_id: UUID, year: int, quarter: int) -> int:
        """Get allocated capacity for a quarter from features."""
        # TODO: Implement when Feature model exists
        return 0

    @staticmethod
    def build_quarter_capacity(
        db: Session,
        team_id: UUID,
        year: int,
        quarter: int,
        total: int
    ) -> QuarterCapacity:
        """Build quarter capacity with utilization."""
        allocated = TeamService.get_quarter_allocated(db, team_id, year, quarter)
        available = max(0, total - allocated)
        utilization = (allocated / total * 100) if total > 0 else 0.0

        return QuarterCapacity(
            total=total,
            allocated=allocated,
            available=available,
            utilization=round(utilization, 1)
        )

    @staticmethod
    def build_capacity_response(
        db: Session,
        team_id: UUID,
        capacity: Optional[TeamCapacity],
        year: int
    ) -> TeamCapacityResponse:
        """Build capacity response with calculated fields."""
        if not capacity:
            return TeamCapacityResponse(
                year=year,
                q1=QuarterCapacity(),
                q2=QuarterCapacity(),
                q3=QuarterCapacity(),
                q4=QuarterCapacity()
            )

        return TeamCapacityResponse(
            year=year,
            q1=TeamService.build_quarter_capacity(db, team_id, year, 1, capacity.q1_capacity),
            q2=TeamService.build_quarter_capacity(db, team_id, year, 2, capacity.q2_capacity),
            q3=TeamService.build_quarter_capacity(db, team_id, year, 3, capacity.q3_capacity),
            q4=TeamService.build_quarter_capacity(db, team_id, year, 4, capacity.q4_capacity)
        )

    @staticmethod
    def build_team_response(
        db: Session,
        team: Team,
        year: Optional[int] = None,
        pi_id: Optional[str] = None
    ) -> TeamResponse:
        """Build team response with capacity."""
        current_year = year or datetime.datetime.now().year

        capacity = TeamService.get_capacity(db, team.id, current_year)
        capacity_response = TeamService.build_capacity_response(db, team.id, capacity, current_year) if capacity else None

        # Build product summaries
        products = [
            ProductSummary(
                id=p.id,
                name=p.name,
                short_code=p.short_code
            ) for p in team.products
        ]

        # Find SM and PO names from PI allocations (current PI) or team members
        scrum_master_name = None
        product_owner_name = None
        
        # First try to get from current PI allocations (PI where today falls within date range)
        from app.models.pi import PI
        from datetime import date
        today = date.today()
        current_pi = db.query(PI).filter(PI.start_date <= today, PI.end_date >= today).first()
        # Fall back to first PI if no current PI found
        if not current_pi:
            current_pi = db.query(PI).order_by(PI.start_date).first()
        
        if current_pi and team.members:
            for member in team.members:
                if member.status == TeamStatus.ACTIVE:
                    pi_allocation = db.query(MemberPIAllocation).filter(
                        MemberPIAllocation.member_id == member.id,
                        MemberPIAllocation.pi_id == current_pi.id
                    ).first()
                    
                    if pi_allocation:
                        if pi_allocation.is_scrum_master and not scrum_master_name:
                            scrum_master_name = member.name
                        if pi_allocation.is_product_owner and not product_owner_name:
                            product_owner_name = member.name
                    else:
                        # Fall back to team member flags
                        if member.is_scrum_master and not scrum_master_name:
                            scrum_master_name = member.name
                        if member.is_product_owner and not product_owner_name:
                            product_owner_name = member.name

        # Calculate member_count with PI-boundary filtering if pi_id provided
        member_count = 0
        if pi_id:
            # Apply same PI-boundary logic as team_member_service.py
            filter_pi = db.query(PI).filter(func.lower(PI.id) == func.lower(pi_id)).first()
            if filter_pi and team.members:
                # Get all PIs for start_date lookup
                all_pis = db.query(PI).order_by(PI.start_date).all()
                pi_start_dates = {str(p.id).lower(): p.start_date for p in all_pis}
                current_pi_start = pi_start_dates.get(pi_id.lower())
                
                if current_pi_start:
                    for member in team.members:
                        is_active = True
                        
                        # Check effective_from boundary
                        if member.effective_from_pi_id:
                            from_start = pi_start_dates.get(str(member.effective_from_pi_id).lower())
                            if from_start and from_start > current_pi_start:
                                is_active = False
                        
                        # Check left_after boundary
                        if is_active and member.left_after_pi_id:
                            left_start = pi_start_dates.get(str(member.left_after_pi_id).lower())
                            if left_start and left_start < current_pi_start:
                                is_active = False
                        
                        if is_active:
                            member_count += 1
        else:
            # No PI filter - use raw count
            member_count = len(team.members) if team.members else 0

        return TeamResponse(
            id=team.id,
            name=team.name,
            short_code=team.short_code,
            description=team.description,
            site_id=team.site_id,
            status=team.status.value if isinstance(team.status, TeamStatus) else team.status,
            member_count=member_count,
            scrum_master_name=scrum_master_name,
            product_owner_name=product_owner_name,
            products=products,
            capacity=capacity_response,
            created_at=team.created_at,
            updated_at=team.updated_at
        )

    @staticmethod
    def get_pi_capacity_detail(db: Session, team_id: UUID, pi_id: UUID) -> TeamPICapacityDetail:
        """Get comprehensive capacity detail for a team in a specific PI."""
        team_id_str = str(team_id)
        pi_id_str = str(pi_id)
        
        # Get team
        team = db.query(Team).filter(Team.id == team_id_str).first()
        if not team:
            raise ValueError(f"Team not found: {team_id}")
        
        # Get PI with iterations
        pi = db.query(PI).filter(PI.id == pi_id_str).first()
        if not pi:
            raise ValueError(f"PI not found: {pi_id}")
        
        # Get active team members FOR THIS PI (PI-scoped filtering)
        members = CapacityCalculator.get_active_members_for_pi(
            db, team_id_str, pi_id_str
        )
        
        # Get iterations for this PI
        iterations = db.query(Iteration).filter(
            Iteration.pi_id == pi_id_str
        ).order_by(Iteration.sequence).all()
        
        # Get allocation categories for the PI year (use PI.year field, not start_date.year)
        pi_year = pi.year if pi.year else (pi.start_date.year if pi.start_date else datetime.datetime.now().year)
        allocation_categories = db.query(CapacityAllocationCategory).filter(
            CapacityAllocationCategory.year == pi_year,
            CapacityAllocationCategory.is_active == True
        ).order_by(CapacityAllocationCategory.sort_order).all()
        
        # Get global settings (needed for train productivity calculation)
        from app.models.global_settings import GlobalSettings
        global_settings = db.query(GlobalSettings).filter(GlobalSettings.year == pi_year).first()
        if not global_settings:
            # Create default settings if not found
            from app.services.global_settings_service import GlobalSettingsService
            global_settings = GlobalSettingsService.get_or_create(db, pi_year)
        
        # If no allocation categories exist, create from global settings
        if not allocation_categories:
            if global_settings:
                # Create synthetic allocation category objects
                class SyntheticCategory:
                    def __init__(self, name, code, percentage, color, sort_order):
                        self.name = name
                        self.code = code
                        self.default_percentage = percentage
                        self.color = color
                        self.sort_order = sort_order
                
                allocation_categories = [
                    SyntheticCategory("Feature Capacity", "feature_capacity", global_settings.feature_capacity_percentage, "#52c41a", 1),
                    SyntheticCategory("IT Excellence", "it_excellence", global_settings.it_excellence_percentage, "#1890ff", 2),
                    SyntheticCategory("Component Work", "component_work", global_settings.component_work_percentage, "#faad14", 3),
                ]
        
        # Get team's country for holiday filtering
        from app.services.iteration_capacity_service import CalendarService
        team_country_id = CalendarService.get_team_country_id(db, team_id_str)
        
        # Calculate total working days in PI with proper holiday filtering
        # Separate sprint iterations from IP iteration
        total_pi_days = 0
        sprint_working_days = 0
        ip_working_days = 0
        iteration_working_days = {}  # Store per-iteration working days
        ip_iteration_id = None
        
        for iteration in iterations:
            if iteration.start_date and iteration.end_date:
                # Get holidays for this iteration filtered by team's country
                holiday_dates = CalendarService.get_holidays_for_iteration(
                    db, team_id_str, team_country_id, iteration.start_date, iteration.end_date
                )
                working_days = CalendarService.count_working_days(
                    iteration.start_date, iteration.end_date, holiday_dates
                )
                iteration_working_days[iteration.id] = working_days
                total_pi_days += working_days
                
                # Check if this is IP iteration
                if iteration.is_ip_iteration:
                    ip_working_days += working_days
                    ip_iteration_id = iteration.id
                else:
                    sprint_working_days += working_days
        
        # Calculate member capacities - CORRECTED LOGIC
        # Key principle: Calculate per-iteration, then aggregate
        # Sprint iterations: apply productivity
        # IP iteration: NO productivity when apply_productivity_to_ip = False
        
        member_capacities = []
        role_counts = {'developer': 0, 'ba': 0, 'qa': 0}
        
        # Aggregates for sprint iterations (with productivity)
        sprint_totals = {'developer': 0.0, 'ba': 0.0, 'qa': 0.0, 'total': 0.0}
        # Aggregates for IP iteration (raw or with productivity based on setting)
        ip_totals = {'developer': 0.0, 'ba': 0.0, 'qa': 0.0, 'total': 0.0}
        
        # Global settings for IP week handling
        pi_planning_days = global_settings.pi_planning_days
        apply_productivity_to_ip = global_settings.apply_productivity_to_ip
        base_productivity = global_settings.global_productivity_percentage / 100.0
        
        for member in members:
            # Get PI-specific allocation if exists
            pi_allocation = db.query(MemberPIAllocation).filter(
                MemberPIAllocation.member_id == member.id,
                MemberPIAllocation.pi_id == pi_id_str
            ).first()
            
            train_alloc_pct = pi_allocation.train_allocation_percent if pi_allocation else member.train_allocation_percent
            
            # NEW: Get agile role allocation (percentage of time spent on SM/PO duties - DEDUCTED from capacity)
            agile_role_pct = (pi_allocation.agile_role_allocation_percent / 100.0) if pi_allocation else 0.0
            available_capacity_pct = 1.0 - agile_role_pct  # Remaining capacity after agile role deduction
            
            # Get IP week deduction for this member
            ip_week_deduction = pi_allocation.ip_week_deduction if pi_allocation and pi_allocation.ip_week_deduction else 0
            
            # Get iteration-level productivity overrides for this member
            iter_productivity_records = db.query(MemberIterationProductivity).filter(
                MemberIterationProductivity.member_id == member.id,
                MemberIterationProductivity.iteration_id.in_([it.id for it in iterations])
            ).all()
            iter_productivity_map = {r.iteration_id: r.productivity_percent / 100.0 for r in iter_productivity_records}
            
            # Get member leaves per iteration with deduplication
            member_leaves_by_iter = {}
            iteration_leaves = db.query(MemberLeave).filter(
                MemberLeave.member_id == member.id,
                MemberLeave.iteration_id.in_([it.id for it in iterations])
            ).all()
            
            # Deduplicate leave records by iteration_id and leave_days
            # This prevents duplicate entries from inflating leave totals
            seen_leaves = {}
            for leave in iteration_leaves:
                key = (leave.iteration_id, leave.leave_days, leave.leave_type)
                if key not in seen_leaves:
                    seen_leaves[key] = leave
            
            # Sum deduplicated leave days per iteration
            for leave in seen_leaves.values():
                if leave.iteration_id not in member_leaves_by_iter:
                    member_leaves_by_iter[leave.iteration_id] = 0
                member_leaves_by_iter[leave.iteration_id] += leave.leave_days or 0
            
            # Map role to simplified categories
            role_key = 'developer'
            role_display = 'developer'
            if member.role == MemberRole.QA:
                role_key = 'qa'
                role_display = 'qa'
            elif member.role == MemberRole.PD:
                role_key = 'ba'
                role_display = 'pd'
            
            role_counts[role_key] += 1
            
            # Calculate iteration-level capacity for this member
            member_iteration_caps = []
            member_sprint_total = 0.0
            member_ip_total = 0.0
            member_total_leave = 0.0
            
            for iteration in iterations:
                if iteration.start_date and iteration.end_date:
                    # Use pre-calculated working days with holidays
                    iter_working_days = iteration_working_days.get(iteration.id, 0)
                    iter_leave_days = member_leaves_by_iter.get(iteration.id, 0)
                    member_total_leave += iter_leave_days
                    
                    # CORRECTED FORMULA (2026-01-27):
                    # Step 1: Apply train allocation FIRST
                    allocated_days = iter_working_days * (train_alloc_pct / 100.0)
                    # Step 2: Deduct leave AFTER train allocation
                    # (Leave is taken from member's allocated time to this train)
                    net_days = max(0, allocated_days - iter_leave_days)
                    
                    # Check if this is IP iteration
                    is_ip_iter = iteration.is_ip_iteration
                    
                    # Get iteration-specific productivity (falls back to global)
                    iter_productivity = iter_productivity_map.get(iteration.id, base_productivity)
                    
                    if is_ip_iter:
                        # Use ip_week_deduction if set, otherwise fall back to global pi_planning_days
                        effective_ip_deduction = ip_week_deduction if ip_week_deduction else pi_planning_days
                        
                        if apply_productivity_to_ip:
                            # IP WITH productivity
                            iter_member_days = net_days * available_capacity_pct * iter_productivity
                            # Deduct IP planning/deduction days (with productivity)
                            planning_deduction = effective_ip_deduction * available_capacity_pct * iter_productivity
                        else:
                            # IP WITHOUT productivity - net days × available capacity
                            iter_member_days = net_days * available_capacity_pct
                            # Deduct raw IP planning/deduction days
                            planning_deduction = effective_ip_deduction * available_capacity_pct
                        
                        # Apply the deduction (only once, not double)
                        iter_member_days = max(0, iter_member_days - planning_deduction)
                        member_ip_total += iter_member_days
                        ip_totals[role_key] += iter_member_days
                        ip_totals['total'] += iter_member_days
                    else:
                        # Sprint iteration - Step 3: Apply available capacity × productivity
                        iter_member_days = net_days * available_capacity_pct * iter_productivity
                        member_sprint_total += iter_member_days
                        sprint_totals[role_key] += iter_member_days
                        sprint_totals['total'] += iter_member_days
                    
                    member_iteration_caps.append(MemberIterationCapacity(
                        iteration_id=iteration.id,
                        iteration_name=iteration.name,
                        capacity_days=round(iter_member_days, 1)
                    ))
            
            member_capacities.append(MemberCapacityDetail(
                member_id=member.id,
                member_name=member.name,
                role=role_display,
                is_scrum_master=pi_allocation.is_scrum_master if pi_allocation else member.is_scrum_master,
                is_product_owner=pi_allocation.is_product_owner if pi_allocation else member.is_product_owner,
                transversal_role=pi_allocation.transversal_role if pi_allocation else member.transversal_role,
                availability_pct=float(train_alloc_pct),
                total_days=round(member_sprint_total + member_ip_total, 1),
                leave_days=float(member_total_leave),
                iteration_capacities=member_iteration_caps
            ))
        
        # Build summary using aggregated sprint and IP totals
        # PI Capacity = sprint iterations only (already calculated with productivity)
        pi_capacity = sprint_totals['total']
        pi_dev_days = sprint_totals['developer']
        pi_pd_days = sprint_totals['ba']
        pi_qa_days = sprint_totals['qa']
        
        # IP Available = IP totals (already has PI planning and IP week deductions applied per member)
        ip_available = ip_totals['total']
        ip_dev_available = ip_totals['developer']
        ip_pd_available = ip_totals['ba']
        ip_qa_available = ip_totals['qa']
        
        # Team Total = PI Capacity + IP Available
        total_capacity = pi_capacity + ip_available
        total_dev_days = pi_dev_days + ip_dev_available
        total_pd_days = pi_pd_days + ip_pd_available
        total_qa_days = pi_qa_days + ip_qa_available
        
        member_count = len(members)
        
        summary = CapacitySummary(
            # Team Total (PI + IP available)
            total_effort_days=round(total_capacity, 1),
            total_dev_days=round(total_dev_days, 1),
            total_pd_days=round(total_pd_days, 1),
            total_qa_days=round(total_qa_days, 1),
            # IP Week (available after all deductions)
            ip_capacity=round(ip_available, 1),  # Show available, not raw
            ip_dev_days=round(ip_dev_available, 1),
            ip_pd_days=round(ip_pd_available, 1),
            ip_qa_days=round(ip_qa_available, 1),
            ip_available=round(ip_available, 1),
            pi_planning_days=pi_planning_days,
            # PI capacity (iterations only)
            pi_capacity=round(pi_capacity, 1),
            pi_dev_days=round(pi_dev_days, 1),
            pi_pd_days=round(pi_pd_days, 1),
            pi_qa_days=round(pi_qa_days, 1),
            # Counts
            total_members=member_count,
            dev_count=role_counts['developer'],
            pd_count=role_counts['ba'],
            qa_count=role_counts['qa']
        )
        
        # Build capacity by role (sprint + IP)
        capacity_by_role = [
            RoleCapacityDetail(role='developer', headcount=role_counts['developer'], effort_days=round(total_dev_days, 1)),
            RoleCapacityDetail(role='pd', headcount=role_counts['ba'], effort_days=round(total_pd_days, 1)),
            RoleCapacityDetail(role='qa', headcount=role_counts['qa'], effort_days=round(total_qa_days, 1)),
        ]
        
        # Build allocation summary and by-role breakdown
        # Allocations apply only to PI capacity (iterations, not IP week)
        allocation_summary = []
        allocation_by_role = []
        
        for cat in allocation_categories:
            pct = cat.default_percentage / 100.0
            total_cat_days = pi_capacity * pct
            dev_cat_days = pi_dev_days * pct
            pd_cat_days = pi_pd_days * pct
            qa_cat_days = pi_qa_days * pct
            
            allocation_summary.append(AllocationSummary(
                category=cat.name,
                code=cat.code,
                percentage=float(cat.default_percentage),
                total_days=round(total_cat_days, 1),
                color=cat.color
            ))
            
            allocation_by_role.append(AllocationByRole(
                category=cat.name,
                code=cat.code,
                dev_days=round(dev_cat_days, 1),
                pd_days=round(pd_cat_days, 1),
                qa_days=round(qa_cat_days, 1),
                total_days=round(total_cat_days, 1)
            ))
        
        # Build iteration details by summing member capacities per iteration
        iteration_details = []
        for iteration in iterations:
            if not iteration.start_date or not iteration.end_date:
                continue
            
            # Use pre-calculated working days with holidays
            working_days = iteration_working_days.get(iteration.id, 0)
            
            # Sum member capacities for this iteration
            iter_total = 0.0
            iter_dev = 0.0
            iter_pd = 0.0
            iter_qa = 0.0
            
            for member_cap in member_capacities:
                for iter_cap in member_cap.iteration_capacities:
                    if iter_cap.iteration_id == iteration.id:
                        iter_total += iter_cap.capacity_days
                        if member_cap.role == 'developer':
                            iter_dev += iter_cap.capacity_days
                        elif member_cap.role == 'pd':
                            iter_pd += iter_cap.capacity_days
                        elif member_cap.role == 'qa':
                            iter_qa += iter_cap.capacity_days
            
            is_ip_iteration = iteration.is_ip_iteration
            
            # Calculate iteration-level allocations (only for non-IP iterations)
            iter_allocations = []
            if not is_ip_iteration:
                for cat in allocation_categories:
                    iter_cat_days = iter_total * (cat.default_percentage / 100.0)
                    iter_allocations.append(IterationAllocationDetail(
                        category=cat.name,
                        code=cat.code,
                        percentage=float(cat.default_percentage),
                        total_days=round(iter_cat_days, 1),
                        color=cat.color
                    ))
            
            iteration_details.append(IterationCapacityDetail(
                iteration_id=iteration.id,
                iteration_name=iteration.name,
                iteration_number=iteration.sequence,
                start_date=iteration.start_date if isinstance(iteration.start_date, datetime.date) else iteration.start_date.date(),
                end_date=iteration.end_date if isinstance(iteration.end_date, datetime.date) else iteration.end_date.date(),
                working_days=working_days,
                total_capacity=round(iter_total, 1),
                dev_capacity=round(iter_dev, 1),
                pd_capacity=round(iter_pd, 1),
                qa_capacity=round(iter_qa, 1),
                allocations=iter_allocations
            ))
        
        return TeamPICapacityDetail(
            team_id=team.id,
            team_name=team.name,
            team_code=team.short_code,
            pi_id=pi.id,
            pi_name=pi.name,
            summary=summary,
            capacity_by_role=capacity_by_role,
            allocation_summary=allocation_summary,
            allocation_by_role=allocation_by_role,
            iterations=iteration_details,
            members=member_capacities
        )
