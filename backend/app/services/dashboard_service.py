from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.models.product import Product, ProductStatus
from app.models.budget import BudgetVersion, BudgetLine, BudgetStatus
from app.models.team import Team, TeamCapacity, TeamStatus, TeamMember, MemberRole, MemberPIAllocation
from app.models.global_settings import GlobalSettings
from app.models.holiday import MemberLeave
from app.models.feature import Feature, FeatureStatus
from app.models.pi import PI, Iteration, PIStatus
from app.models.capacity import TeamIterationCapacity
from app.models.capacity_allocation import CapacityAllocationCategory
from app.models.organization import Country, Site
from app.schemas.dashboard import (
    DashboardSummary,
    DashboardMetrics,
    BudgetHealthItem,
    CapacityHeatmapItem,
    FeatureStats,
    QuarterCapacity,
    # Capacity Dashboard schemas
    PIInfo,
    CapacitySummary,
    CapacitySummaryResponse,
    ProductCapacity,
    ProductCapacityResponse,
    SiteCapacity,
    CountryCapacity,
    SiteCapacityResponse,
    IterationCapacity,
    ProductSummaryRef,
    SiteSummaryRef,
    TeamCapacityDetail,
    TeamCapacityResponse,
    AllocationCategory,
    AllocationCapacityResponse
)


class DashboardService:
    """Service layer for Dashboard aggregations."""

    @staticmethod
    def get_health_status(utilization: float) -> str:
        """Determine health status based on utilization percentage."""
        if utilization >= 90:
            return 'critical'
        elif utilization >= 80:
            return 'warning'
        return 'healthy'

    @staticmethod
    def get_summary(db: Session, year: Optional[int] = None) -> DashboardSummary:
        """Get complete dashboard summary."""
        if not year:
            year = datetime.now().year

        return DashboardSummary(
            metrics=DashboardService.get_metrics(db, year),
            budget_health=DashboardService.get_budget_health(db, year),
            capacity_heatmap=DashboardService.get_capacity_heatmap(db, year),
            feature_stats=DashboardService.get_feature_stats(db, year)
        )

    @staticmethod
    def get_metrics(db: Session, year: Optional[int] = None) -> DashboardMetrics:
        """Get key dashboard metrics."""
        if not year:
            year = datetime.now().year

        # Total budget from active budget versions
        total_budget = db.query(func.sum(BudgetLine.amount)).join(
            BudgetVersion, BudgetLine.budget_version_id == BudgetVersion.id
        ).filter(
            BudgetVersion.status == BudgetStatus.ACTIVE,
            BudgetVersion.year == year
        ).scalar() or Decimal('0')

        # Budget consumed from features
        budget_consumed = db.query(func.sum(Feature.cost)).filter(
            Feature.year == year
        ).scalar() or Decimal('0')

        # Total features for the year
        total_features = db.query(func.count(Feature.id)).filter(
            Feature.year == year
        ).scalar() or 0

        # Active teams
        active_teams = db.query(func.count(Team.id)).filter(
            Team.status == TeamStatus.ACTIVE
        ).scalar() or 0

        return DashboardMetrics(
            total_budget=float(total_budget),
            budget_consumed=float(budget_consumed),
            total_features=total_features,
            active_teams=active_teams
        )

    @staticmethod
    def get_budget_health(db: Session, year: Optional[int] = None) -> List[BudgetHealthItem]:
        """Get budget health for each product."""
        if not year:
            year = datetime.now().year

        products = db.query(Product).filter(
            Product.status == ProductStatus.ACTIVE
        ).all()

        result = []
        for product in products:
            # Get active budget version for this product and year
            budget_version = db.query(BudgetVersion).filter(
                BudgetVersion.product_id == product.id,
                BudgetVersion.year == year,
                BudgetVersion.status == BudgetStatus.ACTIVE
            ).first()

            if not budget_version:
                continue

            # Total budget for this product
            total_budget = db.query(func.sum(BudgetLine.amount)).filter(
                BudgetLine.budget_version_id == budget_version.id
            ).scalar() or Decimal('0')

            # Consumed budget from features
            consumed_budget = db.query(func.sum(Feature.cost)).filter(
                Feature.product_id == product.id,
                Feature.year == year
            ).scalar() or Decimal('0')

            total = float(total_budget)
            consumed = float(consumed_budget)
            utilization = (consumed / total * 100) if total > 0 else 0.0

            result.append(BudgetHealthItem(
                product_id=product.id,
                product_name=product.name,
                product_code=product.short_code,
                total_budget=total,
                consumed_budget=consumed,
                utilization=round(utilization, 1),
                status=DashboardService.get_health_status(utilization)
            ))

        # Sort by utilization descending
        result.sort(key=lambda x: x.utilization, reverse=True)
        return result

    @staticmethod
    def get_capacity_heatmap(db: Session, year: Optional[int] = None) -> List[CapacityHeatmapItem]:
        """Get team capacity heatmap data."""
        if not year:
            year = datetime.now().year

        teams = db.query(Team).filter(
            Team.status == TeamStatus.ACTIVE
        ).order_by(Team.name).all()

        result = []
        for team in teams:
            # Get capacity for this team and year
            capacity = db.query(TeamCapacity).filter(
                TeamCapacity.team_id == team.id,
                TeamCapacity.year == year
            ).first()

            quarters = {}
            for q in [1, 2, 3, 4]:
                q_key = f'q{q}'
                
                # Get total capacity
                if capacity:
                    total = getattr(capacity, f'q{q}_capacity', 0)
                else:
                    total = 0

                # Get allocated (sum of effort days for features assigned to this team in this quarter)
                allocated = db.query(func.sum(Feature.story_points)).filter(
                    Feature.team_id == team.id,
                    Feature.year == year,
                    Feature.quarter == q
                ).scalar() or 0

                utilization = (allocated / total * 100) if total > 0 else 0.0

                quarters[q_key] = QuarterCapacity(
                    total=total,
                    allocated=allocated,
                    utilization=round(utilization, 1),
                    status=DashboardService.get_health_status(utilization) if total > 0 else 'none'
                )

            result.append(CapacityHeatmapItem(
                team_id=team.id,
                team_name=team.name,
                team_code=team.short_code,
                quarters=quarters
            ))

        return result

    @staticmethod
    def get_feature_stats(db: Session, year: Optional[int] = None) -> FeatureStats:
        """Get feature status statistics."""
        if not year:
            year = datetime.now().year

        not_started = db.query(func.count(Feature.id)).filter(
            Feature.year == year,
            Feature.internal_status == FeatureStatus.NOT_STARTED
        ).scalar() or 0

        in_progress = db.query(func.count(Feature.id)).filter(
            Feature.year == year,
            Feature.internal_status == FeatureStatus.IN_PROGRESS
        ).scalar() or 0

        completed = db.query(func.count(Feature.id)).filter(
            Feature.year == year,
            Feature.internal_status == FeatureStatus.COMPLETED
        ).scalar() or 0

        return FeatureStats(
            not_started=not_started,
            in_progress=in_progress,
            completed=completed,
            total=not_started + in_progress + completed
        )

    # ============================================
    # Train Capacity Dashboard Methods
    # ============================================

    @staticmethod
    def _calculate_member_pi_capacity(db: Session, member: TeamMember, pi: PI) -> float:
        """Calculate a member's capacity for a PI based on iterations and availability."""
        # Get PI-specific allocation if exists
        pi_allocation = db.query(MemberPIAllocation).filter(
            MemberPIAllocation.member_id == member.id,
            MemberPIAllocation.pi_id == pi.id
        ).first()
        
        train_alloc_pct = pi_allocation.train_allocation_percent if pi_allocation else member.train_allocation_percent
        
        # Calculate total working days in PI
        total_days = 0
        for iteration in pi.iterations:
            if iteration.start_date and iteration.end_date:
                iter_days = (iteration.end_date - iteration.start_date).days + 1
                working_days = int(iter_days * 5 / 7)  # Rough working days
                total_days += working_days
        
        # Apply train allocation percentage
        return total_days * (train_alloc_pct / 100.0)

    @staticmethod
    def get_capacity_summary(db: Session, pi_id: str) -> CapacitySummaryResponse:
        """Get overall capacity summary for a PI."""
        pi = db.query(PI).options(
            joinedload(PI.iterations)
        ).filter(PI.id == pi_id).first()
        
        if not pi:
            raise ValueError(f"PI not found: {pi_id}")
        
        if not pi.iterations:
            return CapacitySummaryResponse(
                pi=PIInfo(
                    id=pi.id,
                    name=pi.name,
                    start_date=pi.start_date.isoformat(),
                    end_date=pi.end_date.isoformat(),
                    status=pi.status.value,
                    iteration_count=0
                ),
                summary=CapacitySummary(
                    total_capacity=0,
                    allocated=0,
                    available=0,
                    utilization_percent=0,
                    team_count=0,
                    member_count=0
                )
            )
        
        # Get all active teams with members
        teams = db.query(Team).filter(Team.status == TeamStatus.ACTIVE).all()
        
        total_capacity = 0.0
        team_count = 0
        member_count = 0
        
        for team in teams:
            # Get active members
            members = db.query(TeamMember).filter(
                TeamMember.team_id == team.id,
                TeamMember.status == TeamStatus.ACTIVE
            ).all()
            
            if not members:
                continue
            
            team_count += 1
            member_count += len(members)
            
            # Calculate capacity for each member
            for member in members:
                total_capacity += DashboardService._calculate_member_pi_capacity(db, member, pi)
        
        # For now, allocated is 0 (would come from feature assignments)
        allocated = 0.0
        available = total_capacity - allocated
        utilization = (allocated / total_capacity * 100) if total_capacity > 0 else 0
        
        return CapacitySummaryResponse(
            pi=PIInfo(
                id=pi.id,
                name=pi.name,
                start_date=pi.start_date.isoformat(),
                end_date=pi.end_date.isoformat(),
                status=pi.status.value,
                iteration_count=len(pi.iterations)
            ),
            summary=CapacitySummary(
                total_capacity=round(total_capacity, 1),
                allocated=round(allocated, 1),
                available=round(available, 1),
                utilization_percent=round(utilization, 1),
                team_count=team_count,
                member_count=member_count
            )
        )

    @staticmethod
    def get_capacity_by_product(db: Session, pi_id: str) -> ProductCapacityResponse:
        """Get capacity breakdown by product for a PI."""
        pi = db.query(PI).options(joinedload(PI.iterations)).filter(PI.id == pi_id).first()
        if not pi:
            raise ValueError(f"PI not found: {pi_id}")
        
        if not pi.iterations:
            return ProductCapacityResponse(products=[])
        
        # Get products with their teams' capacity
        products = db.query(Product).filter(Product.status == ProductStatus.ACTIVE).all()
        
        result = []
        for product in products:
            # Get active teams associated with this product
            active_teams = [t for t in product.teams if t.status == TeamStatus.ACTIVE]
            
            if not active_teams:
                continue
            
            # Calculate capacity from team members
            total_capacity = 0.0
            team_count = 0
            
            for team in active_teams:
                members = db.query(TeamMember).filter(
                    TeamMember.team_id == team.id,
                    TeamMember.status == TeamStatus.ACTIVE
                ).all()
                
                if members:
                    team_count += 1
                    for member in members:
                        total_capacity += DashboardService._calculate_member_pi_capacity(db, member, pi)
            
            if total_capacity > 0:
                allocated = 0.0  # Would come from feature assignments
                available = total_capacity - allocated
                utilization = (allocated / total_capacity * 100) if total_capacity > 0 else 0
                
                result.append(ProductCapacity(
                    id=product.id,
                    name=product.name,
                    short_code=product.short_code,
                    team_count=team_count,
                    total_capacity=round(total_capacity, 1),
                    allocated=round(allocated, 1),
                    available=round(available, 1),
                    utilization_percent=round(utilization, 1)
                ))
        
        # Sort by total capacity descending
        result.sort(key=lambda x: x.total_capacity, reverse=True)
        return ProductCapacityResponse(products=result)

    @staticmethod
    def get_capacity_by_site(db: Session, pi_id: str) -> SiteCapacityResponse:
        """Get capacity breakdown by site/country for a PI."""
        pi = db.query(PI).options(joinedload(PI.iterations)).filter(PI.id == pi_id).first()
        if not pi:
            raise ValueError(f"PI not found: {pi_id}")
        
        if not pi.iterations:
            return SiteCapacityResponse(countries=[])
        
        # Get all countries with sites
        countries = db.query(Country).filter(Country.is_active == True).all()
        
        result = []
        for country in countries:
            sites_data = []
            country_totals = {'total': 0.0, 'allocated': 0.0, 'teams': 0, 'members': 0}
            
            for site in country.sites:
                if not site.is_active:
                    continue
                
                # Get teams at this site
                teams = db.query(Team).filter(
                    Team.site_id == site.id,
                    Team.status == TeamStatus.ACTIVE
                ).all()
                
                if not teams:
                    continue
                
                # Calculate capacity from team members
                site_capacity = 0.0
                site_team_count = 0
                site_member_count = 0
                
                for team in teams:
                    members = db.query(TeamMember).filter(
                        TeamMember.team_id == team.id,
                        TeamMember.status == TeamStatus.ACTIVE
                    ).all()
                    
                    if members:
                        site_team_count += 1
                        site_member_count += len(members)
                        for member in members:
                            site_capacity += DashboardService._calculate_member_pi_capacity(db, member, pi)
                
                if site_capacity > 0:
                    allocated = 0.0
                    available = site_capacity - allocated
                    utilization = 0.0
                    
                    sites_data.append(SiteCapacity(
                        id=site.id,
                        code=site.code,
                        name=site.name,
                        team_count=site_team_count,
                        member_count=site_member_count,
                        total_capacity=round(site_capacity, 1),
                        allocated=round(allocated, 1),
                        available=round(available, 1),
                        utilization_percent=round(utilization, 1)
                    ))
                    
                    country_totals['total'] += site_capacity
                    country_totals['teams'] += site_team_count
                    country_totals['members'] += site_member_count
            
            if sites_data:
                country_util = (country_totals['allocated'] / country_totals['total'] * 100) if country_totals['total'] > 0 else 0
                result.append(CountryCapacity(
                    id=country.id,
                    code=country.code,
                    name=country.name,
                    sites=sites_data,
                    totals=CapacitySummary(
                        total_capacity=round(country_totals['total'], 1),
                        allocated=round(country_totals['allocated'], 1),
                        available=round(country_totals['total'] - country_totals['allocated'], 1),
                        utilization_percent=round(country_util, 1),
                        team_count=country_totals['teams'],
                        member_count=country_totals['members']
                    )
                ))
        
        # Sort by total capacity descending
        result.sort(key=lambda x: x.totals.total_capacity, reverse=True)
        return SiteCapacityResponse(countries=result)

    @staticmethod
    def get_capacity_by_team(
        db: Session, 
        pi_id: str, 
        product_id: Optional[str] = None,
        site_id: Optional[str] = None
    ) -> TeamCapacityResponse:
        """Get capacity breakdown by team for a PI with optional filters."""
        pi = db.query(PI).options(joinedload(PI.iterations)).filter(PI.id == pi_id).first()
        if not pi:
            raise ValueError(f"PI not found: {pi_id}")
        
        iterations = sorted(pi.iterations, key=lambda x: x.sequence)
        
        if not iterations:
            return TeamCapacityResponse(teams=[])
        
        # Build team query with filters
        team_query = db.query(Team).filter(Team.status == TeamStatus.ACTIVE)
        
        if product_id:
            team_query = team_query.filter(Team.products.any(Product.id == product_id))
        
        if site_id:
            team_query = team_query.filter(Team.site_id == site_id)
        
        teams = team_query.all()
        
        result = []
        for team in teams:
            # Get active members
            members = db.query(TeamMember).filter(
                TeamMember.team_id == team.id,
                TeamMember.status == TeamStatus.ACTIVE
            ).all()
            
            if not members:
                continue
            
            # Calculate iteration capacities from members
            iteration_list = []
            total_cap = 0.0
            
            for iteration in iterations:
                if not iteration.start_date or not iteration.end_date:
                    continue
                    
                iter_days = (iteration.end_date - iteration.start_date).days + 1
                working_days = int(iter_days * 5 / 7)
                
                iter_capacity = 0.0
                for member in members:
                    # Get PI-specific allocation if exists
                    pi_allocation = db.query(MemberPIAllocation).filter(
                        MemberPIAllocation.member_id == member.id,
                        MemberPIAllocation.pi_id == pi.id
                    ).first()
                    train_alloc_pct = pi_allocation.train_allocation_percent if pi_allocation else member.train_allocation_percent
                    iter_capacity += working_days * (train_alloc_pct / 100.0)
                
                allocated = 0.0
                available = iter_capacity - allocated
                utilization = 0.0
                
                iteration_list.append(IterationCapacity(
                    id=iteration.id,
                    name=iteration.name,
                    sequence=iteration.sequence,
                    is_ip_iteration=iteration.is_ip_iteration,
                    capacity=round(iter_capacity, 1),
                    allocated=round(allocated, 1),
                    available=round(available, 1),
                    utilization_percent=round(utilization, 1)
                ))
                
                total_cap += iter_capacity
            
            # Get product and site info
            product_ref = None
            if team.products:
                p = team.products[0]
                product_ref = ProductSummaryRef(id=p.id, name=p.name)
            
            site_ref = None
            if team.site:
                site_ref = SiteSummaryRef(
                    id=team.site.id,
                    name=team.site.name,
                    country_code=team.site.country.code if team.site.country else ""
                )
            
            total_alloc = 0.0
            total_avail = total_cap - total_alloc
            total_util = 0.0
            
            result.append(TeamCapacityDetail(
                id=team.id,
                name=team.name,
                short_code=team.short_code,
                product=product_ref,
                site=site_ref,
                member_count=len(members),
                total_capacity=round(total_cap, 1),
                allocated=round(total_alloc, 1),
                available=round(total_avail, 1),
                utilization_percent=round(total_util, 1),
                iterations=iteration_list
            ))
        
        # Sort by total capacity descending
        result.sort(key=lambda x: x.total_capacity, reverse=True)
        return TeamCapacityResponse(teams=result)

    @staticmethod
    def get_capacity_by_allocation(db: Session, pi_id: str) -> AllocationCapacityResponse:
        """Get capacity breakdown by allocation category for a PI."""
        pi = db.query(PI).options(joinedload(PI.iterations)).filter(PI.id == pi_id).first()
        if not pi:
            raise ValueError(f"PI not found: {pi_id}")
        
        if not pi.iterations:
            return AllocationCapacityResponse(categories=[], total_capacity=0)
        
        # Calculate total capacity from team members
        teams = db.query(Team).filter(Team.status == TeamStatus.ACTIVE).all()
        total_capacity = 0.0
        
        for team in teams:
            members = db.query(TeamMember).filter(
                TeamMember.team_id == team.id,
                TeamMember.status == TeamStatus.ACTIVE
            ).all()
            
            for member in members:
                total_capacity += DashboardService._calculate_member_pi_capacity(db, member, pi)
        
        # Get allocation categories for the PI year
        categories = db.query(CapacityAllocationCategory).filter(
            CapacityAllocationCategory.year == pi.year,
            CapacityAllocationCategory.is_active == True
        ).order_by(CapacityAllocationCategory.sort_order).all()
        
        result = []
        for cat in categories:
            capacity = (total_capacity * cat.default_percentage / 100) if total_capacity > 0 else 0
            result.append(AllocationCategory(
                id=cat.id,
                name=cat.name,
                code=cat.code,
                color=cat.color or "#1890ff",
                percentage=cat.default_percentage,
                capacity=round(capacity, 1)
            ))
        
        return AllocationCapacityResponse(
            categories=result,
            total_capacity=round(total_capacity, 1)
        )

    # ============================================
    # Train Dashboard Methods
    # ============================================

    @staticmethod
    def get_train_overview(db: Session, pi_id: str) -> 'TrainDashboardOverview':
        """Get complete train dashboard overview for a PI."""
        from app.schemas.dashboard import (
            TrainDashboardOverview, TrainSummary, TeamCapacityRow, 
            IterationCapacityValue, PIInfo
        )
        from app.services.iteration_capacity_service import CalendarService
        
        # Get PI with iterations
        pi = db.query(PI).options(joinedload(PI.iterations)).filter(PI.id == pi_id).first()
        if not pi:
            raise ValueError(f"PI not found: {pi_id}")
        
        iterations = sorted(pi.iterations, key=lambda x: x.sequence) if pi.iterations else []
        
        # Get global settings for productivity and PI planning
        global_settings = db.query(GlobalSettings).filter(GlobalSettings.year == pi.year).first()
        train_productivity = (global_settings.global_productivity_percentage / 100.0) if global_settings else 0.8
        pi_planning_days = global_settings.pi_planning_days if global_settings else 2
        apply_productivity_to_ip = global_settings.apply_productivity_to_ip if global_settings else False
        
        # Get allocation categories
        allocation_categories = db.query(CapacityAllocationCategory).filter(
            CapacityAllocationCategory.year == pi.year,
            CapacityAllocationCategory.is_active == True
        ).order_by(CapacityAllocationCategory.sort_order).all()
        
        # Get all active teams
        teams = db.query(Team).filter(Team.status == TeamStatus.ACTIVE).all()
        
        team_rows = []
        total_members = 0
        total_fte = 0.0
        total_capacity = 0.0
        total_allocations: Dict[str, float] = {cat.code: 0.0 for cat in allocation_categories}
        
        # Initialize totals for iterations
        iteration_totals: Dict[str, float] = {it.id: 0.0 for it in iterations}
        
        for team in teams:
            # Get active members
            members = db.query(TeamMember).filter(
                TeamMember.team_id == team.id,
                TeamMember.status == TeamStatus.ACTIVE
            ).all()
            
            if not members:
                continue
            
            member_count = len(members)
            total_members += member_count
            
            # Get team's country for holiday filtering
            team_country_id = CalendarService.get_team_country_id(db, team.id)
            
            # Calculate FTE (sum of train allocation percentages / 100)
            team_fte = 0.0
            for member in members:
                pi_allocation = db.query(MemberPIAllocation).filter(
                    MemberPIAllocation.member_id == member.id,
                    MemberPIAllocation.pi_id == pi_id
                ).first()
                train_alloc = (pi_allocation.train_allocation_percent if pi_allocation else member.train_allocation_percent) / 100.0
                team_fte += train_alloc
            
            total_fte += team_fte
            
            # Calculate iteration capacities
            iter_values = []
            team_productive_capacity = 0.0
            
            for iteration in iterations:
                if not iteration.start_date or not iteration.end_date:
                    iter_values.append(IterationCapacityValue(
                        iteration_id=iteration.id,
                        iteration_name=iteration.name,
                        sequence=iteration.sequence,
                        is_ip=iteration.is_ip_iteration,
                        capacity=0.0
                    ))
                    continue
                
                # Use CalendarService for proper working days calculation with holidays
                holiday_dates = CalendarService.get_holidays_for_iteration(
                    db, team.id, team_country_id, iteration.start_date, iteration.end_date
                )
                working_days = CalendarService.count_working_days(
                    iteration.start_date, iteration.end_date, holiday_dates
                )
                
                iter_capacity = 0.0
                ip_planning_deduction = 0.0
                
                for member in members:
                    pi_allocation = db.query(MemberPIAllocation).filter(
                        MemberPIAllocation.member_id == member.id,
                        MemberPIAllocation.pi_id == pi_id
                    ).first()
                    train_alloc = (pi_allocation.train_allocation_percent if pi_allocation else member.train_allocation_percent) / 100.0
                    
                    # Get leave days for this iteration
                    leave_records = db.query(MemberLeave).filter(
                        MemberLeave.member_id == member.id,
                        MemberLeave.iteration_id == iteration.id
                    ).all()
                    leave_days = sum(l.leave_days for l in leave_records)
                    
                    available_days = max(0, working_days - leave_days)
                    member_capacity = available_days * train_alloc * train_productivity
                    iter_capacity += member_capacity
                    
                    # For IP iteration, calculate PI planning deduction per member
                    if iteration.is_ip_iteration:
                        if apply_productivity_to_ip:
                            # Deduct PI planning days adjusted by productivity
                            individual_prod = (
                                (pi_allocation.productivity_percent / 100.0) if pi_allocation and pi_allocation.productivity_percent 
                                else (member.individual_productivity / 100.0 if member.individual_productivity else 1.0)
                            )
                            ip_planning_deduction += pi_planning_days * train_productivity * train_alloc * individual_prod
                        else:
                            # Deduct raw PI planning days per member (but apply train allocation)
                            ip_planning_deduction += pi_planning_days * train_alloc
                
                # Apply IP planning deduction for IP iteration
                if iteration.is_ip_iteration:
                    iter_capacity = max(0, iter_capacity - ip_planning_deduction)
                
                iter_values.append(IterationCapacityValue(
                    iteration_id=iteration.id,
                    iteration_name=iteration.name,
                    sequence=iteration.sequence,
                    is_ip=iteration.is_ip_iteration,
                    capacity=round(iter_capacity, 1)
                ))
                
                team_productive_capacity += iter_capacity
                iteration_totals[iteration.id] += iter_capacity
            
            total_capacity += team_productive_capacity
            
            # Calculate allocations based on productive capacity
            team_allocations: Dict[str, float] = {}
            for cat in allocation_categories:
                alloc_value = team_productive_capacity * (cat.default_percentage / 100.0)
                team_allocations[cat.code] = round(alloc_value, 1)
                total_allocations[cat.code] += alloc_value
            
            team_rows.append(TeamCapacityRow(
                team_id=team.id,
                team_name=team.name,
                short_code=team.short_code,
                member_count=member_count,
                fte=round(team_fte, 1),
                iterations=iter_values,
                productive_capacity=round(team_productive_capacity, 1),
                allocations=team_allocations
            ))
        
        # Sort teams by productive capacity descending
        team_rows.sort(key=lambda x: x.productive_capacity, reverse=True)
        
        # Build totals row
        totals_iterations = [
            IterationCapacityValue(
                iteration_id=it.id,
                iteration_name=it.name,
                sequence=it.sequence,
                is_ip=it.is_ip_iteration,
                capacity=round(iteration_totals[it.id], 1)
            ) for it in iterations
        ]
        
        totals_row = TeamCapacityRow(
            team_id="totals",
            team_name="TOTAL",
            short_code="",
            member_count=total_members,
            fte=round(total_fte, 1),
            iterations=totals_iterations,
            productive_capacity=round(total_capacity, 1),
            allocations={k: round(v, 1) for k, v in total_allocations.items()}
        )
        
        # Calculate utilization (allocated / total capacity)
        # For now, utilization is based on allocation categories summing to 100%
        overall_utilization = 100.0 if total_capacity > 0 else 0.0
        
        return TrainDashboardOverview(
            pi=PIInfo(
                id=pi.id,
                name=pi.name,
                start_date=pi.start_date.isoformat() if pi.start_date else "",
                end_date=pi.end_date.isoformat() if pi.end_date else "",
                status=pi.status.value,
                iteration_count=len(iterations)
            ),
            summary=TrainSummary(
                active_teams=len(team_rows),
                total_members=total_members,
                total_fte=round(total_fte, 1),
                total_capacity=round(total_capacity, 1),
                overall_utilization=round(overall_utilization, 1)
            ),
            teams=team_rows,
            totals=totals_row
        )

    @staticmethod
    def get_team_detail_expanded(db: Session, team_id: str, pi_id: str) -> 'TeamDetailExpanded':
        """Get detailed team capacity breakdown for expanded view."""
        from app.schemas.dashboard import (
            TeamDetailExpanded, SectionData, CategoryRow, RoleBreakdown,
            IterationRoleBreakdown, AllocationCategoryRow
        )
        
        # Get team
        team = db.query(Team).filter(Team.id == team_id).first()
        if not team:
            raise ValueError(f"Team not found: {team_id}")
        
        # Get PI with iterations
        pi = db.query(PI).options(joinedload(PI.iterations)).filter(PI.id == pi_id).first()
        if not pi:
            raise ValueError(f"PI not found: {pi_id}")
        
        iterations = sorted(pi.iterations, key=lambda x: x.sequence) if pi.iterations else []
        regular_iterations = [it for it in iterations if not it.is_ip_iteration]
        ip_iteration = next((it for it in iterations if it.is_ip_iteration), None)
        
        # Get global settings
        global_settings = db.query(GlobalSettings).filter(GlobalSettings.year == pi.year).first()
        train_productivity = (global_settings.global_productivity_percentage / 100.0) if global_settings else 0.8
        pi_planning_days = global_settings.pi_planning_days if global_settings else 2
        apply_productivity_to_ip = global_settings.apply_productivity_to_ip if global_settings else False
        
        # Get team members
        members = db.query(TeamMember).filter(
            TeamMember.team_id == team_id,
            TeamMember.status == TeamStatus.ACTIVE
        ).all()
        
        # Get allocation categories
        allocation_categories = db.query(CapacityAllocationCategory).filter(
            CapacityAllocationCategory.year == pi.year,
            CapacityAllocationCategory.is_active == True
        ).order_by(CapacityAllocationCategory.sort_order).all()
        
        def create_role_breakdown(dev=0.0, pd=0.0, qa=0.0, sre=0.0) -> RoleBreakdown:
            return RoleBreakdown(dev=dev, pd=pd, qa=qa, sre=sre, total=dev+pd+qa+sre)
        
        def create_iteration_breakdown(iteration, breakdown: RoleBreakdown) -> IterationRoleBreakdown:
            return IterationRoleBreakdown(
                iteration_id=iteration.id,
                iteration_name=iteration.name,
                sequence=iteration.sequence,
                is_ip=iteration.is_ip_iteration,
                breakdown=breakdown
            )
        
        # Calculate FTE by role per iteration
        def get_fte_by_role(iteration) -> RoleBreakdown:
            dev, pd, qa, sre = 0.0, 0.0, 0.0, 0.0
            for member in members:
                pi_allocation = db.query(MemberPIAllocation).filter(
                    MemberPIAllocation.member_id == member.id,
                    MemberPIAllocation.pi_id == pi_id
                ).first()
                train_alloc = (pi_allocation.train_allocation_percent if pi_allocation else member.train_allocation_percent) / 100.0
                
                role = member.role.value if member.role else 'developer'
                if role == 'developer':
                    dev += train_alloc
                elif role == 'pd':
                    pd += train_alloc
                elif role == 'qa':
                    qa += train_alloc
                else:
                    sre += train_alloc
            return create_role_breakdown(dev, pd, qa, sre)
        
        # Calculate leave by role per iteration
        def get_leave_by_role(iteration, leave_type: str = None) -> RoleBreakdown:
            dev, pd, qa, sre = 0.0, 0.0, 0.0, 0.0
            for member in members:
                query = db.query(MemberLeave).filter(
                    MemberLeave.member_id == member.id,
                    MemberLeave.iteration_id == iteration.id
                )
                if leave_type:
                    query = query.filter(MemberLeave.leave_type == leave_type)
                
                leave_days = sum(l.leave_days for l in query.all())
                
                role = member.role.value if member.role else 'developer'
                if role == 'developer':
                    dev += leave_days
                elif role == 'pd':
                    pd += leave_days
                elif role == 'qa':
                    qa += leave_days
                else:
                    sre += leave_days
            return create_role_breakdown(dev, pd, qa, sre)
        
        # Build People section
        people_rows = []
        fte_iterations = []
        total_fte = create_role_breakdown()
        
        for iteration in iterations:
            fte = get_fte_by_role(iteration)
            fte_iterations.append(create_iteration_breakdown(iteration, fte))
            total_fte = create_role_breakdown(
                total_fte.dev + fte.dev, total_fte.pd + fte.pd, 
                total_fte.qa + fte.qa, total_fte.sre + fte.sre
            )
        
        # Average FTE (same across iterations)
        avg_fte = get_fte_by_role(iterations[0]) if iterations else create_role_breakdown()
        
        people_rows.append(CategoryRow(
            item="Headcount (FTE)",
            unit="FTE",
            iterations=fte_iterations,
            sum_value=avg_fte,
            ip_value=avg_fte if ip_iteration else None
        ))
        
        people_section = SectionData(
            rows=people_rows,
            total=CategoryRow(
                item="Total",
                unit="FTE",
                iterations=fte_iterations,
                sum_value=avg_fte,
                ip_value=avg_fte if ip_iteration else None
            )
        )
        
        # Build Unavailable section
        unavailable_rows = []
        
        # Days off (vacation + sick)
        days_off_iterations = []
        days_off_sum = create_role_breakdown()
        for iteration in iterations:
            leave = get_leave_by_role(iteration, 'vacation')
            sick = get_leave_by_role(iteration, 'sick')
            combined = create_role_breakdown(
                leave.dev + sick.dev, leave.pd + sick.pd,
                leave.qa + sick.qa, leave.sre + sick.sre
            )
            days_off_iterations.append(create_iteration_breakdown(iteration, combined))
            days_off_sum = create_role_breakdown(
                days_off_sum.dev + combined.dev, days_off_sum.pd + combined.pd,
                days_off_sum.qa + combined.qa, days_off_sum.sre + combined.sre
            )
        
        unavailable_rows.append(CategoryRow(
            item="Days off",
            unit="days",
            iterations=days_off_iterations,
            sum_value=days_off_sum,
            ip_value=next((i.breakdown for i in days_off_iterations if i.is_ip), None)
        ))
        
        # Training
        training_iterations = []
        training_sum = create_role_breakdown()
        for iteration in iterations:
            training = get_leave_by_role(iteration, 'training')
            training_iterations.append(create_iteration_breakdown(iteration, training))
            training_sum = create_role_breakdown(
                training_sum.dev + training.dev, training_sum.pd + training.pd,
                training_sum.qa + training.qa, training_sum.sre + training.sre
            )
        
        unavailable_rows.append(CategoryRow(
            item="Official trainings/events",
            unit="days",
            iterations=training_iterations,
            sum_value=training_sum,
            ip_value=next((i.breakdown for i in training_iterations if i.is_ip), None)
        ))
        
        # Other
        other_iterations = []
        other_sum = create_role_breakdown()
        for iteration in iterations:
            other = get_leave_by_role(iteration, 'other')
            other_iterations.append(create_iteration_breakdown(iteration, other))
            other_sum = create_role_breakdown(
                other_sum.dev + other.dev, other_sum.pd + other.pd,
                other_sum.qa + other.qa, other_sum.sre + other.sre
            )
        
        unavailable_rows.append(CategoryRow(
            item="Other",
            unit="days",
            iterations=other_iterations,
            sum_value=other_sum,
            ip_value=next((i.breakdown for i in other_iterations if i.is_ip), None)
        ))
        
        # Total unavailable
        total_unavailable_sum = create_role_breakdown(
            days_off_sum.dev + training_sum.dev + other_sum.dev,
            days_off_sum.pd + training_sum.pd + other_sum.pd,
            days_off_sum.qa + training_sum.qa + other_sum.qa,
            days_off_sum.sre + training_sum.sre + other_sum.sre
        )
        
        unavailable_section = SectionData(
            rows=unavailable_rows,
            total=CategoryRow(
                item="Total",
                unit="days",
                iterations=[],  # Would need to sum per iteration
                sum_value=total_unavailable_sum,
                ip_value=None
            )
        )
        
        # Calculate theoretical capacity per iteration
        def get_theoretical_capacity(iteration) -> RoleBreakdown:
            if not iteration.start_date or not iteration.end_date:
                return create_role_breakdown()
            
            iter_days = (iteration.end_date - iteration.start_date).days + 1
            working_days = int(iter_days * 5 / 7)
            
            dev, pd, qa, sre = 0.0, 0.0, 0.0, 0.0
            for member in members:
                pi_allocation = db.query(MemberPIAllocation).filter(
                    MemberPIAllocation.member_id == member.id,
                    MemberPIAllocation.pi_id == pi_id
                ).first()
                train_alloc = (pi_allocation.train_allocation_percent if pi_allocation else member.train_allocation_percent) / 100.0
                
                role = member.role.value if member.role else 'developer'
                capacity = working_days * train_alloc
                
                if role == 'developer':
                    dev += capacity
                elif role == 'pd':
                    pd += capacity
                elif role == 'qa':
                    qa += capacity
                else:
                    sre += capacity
            return create_role_breakdown(dev, pd, qa, sre)
        
        theoretical_iterations = []
        theoretical_sum = create_role_breakdown()
        for iteration in iterations:
            cap = get_theoretical_capacity(iteration)
            theoretical_iterations.append(create_iteration_breakdown(iteration, cap))
            theoretical_sum = create_role_breakdown(
                theoretical_sum.dev + cap.dev, theoretical_sum.pd + cap.pd,
                theoretical_sum.qa + cap.qa, theoretical_sum.sre + cap.sre
            )
        
        theoretical_capacity = CategoryRow(
            item="Theoretical Capacity",
            unit="days",
            iterations=theoretical_iterations,
            sum_value=theoretical_sum,
            ip_value=next((i.breakdown for i in theoretical_iterations if i.is_ip), None)
        )
        
        # Team Life section (placeholder - would need additional data)
        team_life_section = SectionData(
            rows=[
                CategoryRow(item="Onboarding/Trainings", unit="days", iterations=[], sum_value=create_role_breakdown(), ip_value=None),
                CategoryRow(item="Others", unit="days", iterations=[], sum_value=create_role_breakdown(), ip_value=None),
                CategoryRow(item="Agility", unit="days", iterations=[], sum_value=create_role_breakdown(), ip_value=None),
            ],
            total=CategoryRow(item="Total", unit="days", iterations=[], sum_value=create_role_breakdown(), ip_value=None)
        )
        
        # Net capacity = Theoretical - Unavailable - Team Life
        net_sum = create_role_breakdown(
            theoretical_sum.dev - total_unavailable_sum.dev,
            theoretical_sum.pd - total_unavailable_sum.pd,
            theoretical_sum.qa - total_unavailable_sum.qa,
            theoretical_sum.sre - total_unavailable_sum.sre
        )
        
        net_capacity = CategoryRow(
            item="Net Capacity",
            unit="days",
            iterations=[],
            sum_value=net_sum,
            ip_value=None
        )
        
        # Productive capacity = Net × Productivity ratio
        productive_sum = create_role_breakdown(
            net_sum.dev * train_productivity,
            net_sum.pd * train_productivity,
            net_sum.qa * train_productivity,
            net_sum.sre * train_productivity
        )
        
        productive_capacity = CategoryRow(
            item="Productive Capacity",
            unit="days",
            iterations=[],
            sum_value=productive_sum,
            ip_value=None
        )
        
        # Capacity allocation
        allocation_rows = []
        for cat in allocation_categories:
            pct = cat.default_percentage / 100.0
            alloc_sum = create_role_breakdown(
                productive_sum.dev * pct,
                productive_sum.pd * pct,
                productive_sum.qa * pct,
                productive_sum.sre * pct
            )
            allocation_rows.append(AllocationCategoryRow(
                name=cat.name,
                percentage=cat.default_percentage,
                iterations=[],
                sum_value=alloc_sum,
                ip_value=None
            ))
        
        return TeamDetailExpanded(
            team_id=team.id,
            team_name=team.name,
            short_code=team.short_code,
            pi_id=pi.id,
            pi_name=pi.name,
            productive_ratio=train_productivity * 100,
            people=people_section,
            unavailable=unavailable_section,
            theoretical_capacity=theoretical_capacity,
            team_life=team_life_section,
            net_capacity=net_capacity,
            productive_capacity=productive_capacity,
            capacity_allocation=allocation_rows
        )
