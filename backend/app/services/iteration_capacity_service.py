"""
Iteration Capacity calculation service.
"""
from datetime import date, timedelta
from decimal import Decimal
from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.models.pi import PI, Iteration
from app.models.team import Team, TeamMember, TeamStatus
from app.models.holiday import Holiday, MemberLeave
from app.models.capacity import TeamIterationCapacity
from app.models.global_settings import GlobalSettings
from app.models.team_planning import TeamPlanning
from app.services.global_settings_service import GlobalSettingsService
from app.schemas.iteration_capacity import (
    IterationCapacityResponse,
    TeamIterationCapacityResponse,
    CapacitySummaryResponse,
    AnnualCapacitySummaryResponse,
    AnnualPISummary,
    AnnualTeamSummary
)


class CalendarService:
    """Calendar utility functions."""

    @staticmethod
    def count_working_days(start_date: date, end_date: date, holidays: List[date] = None) -> int:
        """Count working days (Mon-Fri) between dates, excluding holidays."""
        holidays = holidays or []
        working_days = 0
        current = start_date

        while current <= end_date:
            # Monday = 0, Sunday = 6
            if current.weekday() < 5 and current not in holidays:
                working_days += 1
            current += timedelta(days=1)

        return working_days

    @staticmethod
    def get_team_country_id(db: Session, team_id: str) -> Optional[str]:
        """Get the country_id for a team based on its site."""
        from app.models.organization import Site
        team = db.query(Team).filter(Team.id == team_id).first()
        if not team or not team.site_id:
            return None
        site = db.query(Site).filter(Site.id == team.site_id).first()
        return site.country_id if site else None

    @staticmethod
    def get_holidays_for_iteration(
        db: Session, 
        team_id: str, 
        country_id: Optional[str],
        start_date: date, 
        end_date: date
    ) -> List[date]:
        """Get unique holiday dates for a team's country within a date range."""
        holiday_query = db.query(Holiday).filter(
            Holiday.date >= start_date,
            Holiday.date <= end_date
        )
        
        if country_id:
            holiday_query = holiday_query.filter(
                or_(
                    Holiday.team_id == team_id,
                    Holiday.country_id == country_id
                )
            )
        else:
            holiday_query = holiday_query.filter(Holiday.team_id == team_id)
        
        holidays = holiday_query.all()
        return list(set([h.date for h in holidays]))


class IterationCapacityService:
    """Service for iteration capacity calculations."""

    @staticmethod
    def is_member_active_in_pi(db: Session, member: TeamMember, pi: PI) -> bool:
        """
        Check if a team member is active for the given PI based on PI boundaries.
        
        A member is active for a PI if:
        - effective_from_pi_id is NULL OR the PI's sequence >= member's effective_from PI sequence
        - AND left_after_pi_id is NULL OR the PI's sequence <= member's left_after PI sequence
        """
        # If no effective_from, member is active from the beginning
        if not member.effective_from_pi_id:
            effective_from_ok = True
        else:
            effective_from_pi = db.query(PI).filter(
                func.lower(PI.id) == func.lower(member.effective_from_pi_id)
            ).first()
            if not effective_from_pi:
                effective_from_ok = True  # If PI not found, assume active
            else:
                effective_from_ok = pi.sequence >= effective_from_pi.sequence
        
        # If no left_after, member is still active
        if not member.left_after_pi_id:
            left_after_ok = True
        else:
            left_after_pi = db.query(PI).filter(
                func.lower(PI.id) == func.lower(member.left_after_pi_id)
            ).first()
            if not left_after_pi:
                left_after_ok = True  # If PI not found, assume active
            else:
                left_after_ok = pi.sequence <= left_after_pi.sequence
        
        return effective_from_ok and left_after_ok

    @staticmethod
    def calculate_team_iteration_capacity_by_role(
        db: Session,
        team_id: str,
        iteration: Iteration,
        pi: PI,
        global_settings: GlobalSettings
    ) -> Dict[str, float]:
        """
        Calculate team capacity for a single iteration, split by role.
        
        Returns:
            Dict with keys: 'total', 'dev', 'pd', 'qa'
        """
        from app.models.team import Team
        from app.models.organization import Site
        
        team = db.query(Team).filter(Team.id == team_id).first()
        if not team:
            return {'total': 0.0, 'dev': 0.0, 'pd': 0.0, 'qa': 0.0}
        
        # Get team's site country_id for filtering holidays
        team_country_id = None
        if team.site_id:
            site = db.query(Site).filter(Site.id == team.site_id).first()
            if site:
                team_country_id = site.country_id
        
        # Get active team members (status ACTIVE)
        members = db.query(TeamMember).filter(
            TeamMember.team_id == team_id,
            TeamMember.status == TeamStatus.ACTIVE
        ).all()
        
        # Filter members by PI boundaries
        active_members = [
            m for m in members 
            if IterationCapacityService.is_member_active_in_pi(db, m, pi)
        ]
        
        if not active_members:
            return {'total': 0.0, 'dev': 0.0, 'pd': 0.0, 'qa': 0.0}
        
        # Get holidays in iteration period
        holiday_query = db.query(Holiday).filter(
            Holiday.date >= iteration.start_date,
            Holiday.date <= iteration.end_date
        )
        
        if team_country_id:
            holiday_query = holiday_query.filter(
                or_(
                    Holiday.team_id == team_id,
                    Holiday.country_id == team_country_id
                )
            )
        else:
            holiday_query = holiday_query.filter(Holiday.team_id == team_id)
        
        holidays = holiday_query.all()
        holiday_dates = list(set([h.date for h in holidays]))
        half_day_holidays = list(set([h.date for h in holidays if h.is_half_day]))
        
        # Calculate base working days
        base_working_days = CalendarService.count_working_days(
            iteration.start_date,
            iteration.end_date,
            holiday_dates
        )
        base_working_days += len(half_day_holidays) * 0.5
        
        # Calculate capacity by role
        role_capacities = {'Developer': 0.0, 'PD': 0.0, 'QA': 0.0}
        
        for member in active_members:
            # Get member leaves
            leaves = db.query(MemberLeave).filter(
                MemberLeave.member_id == member.id,
                MemberLeave.start_date <= iteration.end_date,
                MemberLeave.end_date >= iteration.start_date
            ).all()
            
            # Calculate leave days
            leave_days = 0.0
            for leave in leaves:
                leave_start = max(leave.start_date, iteration.start_date)
                leave_end = min(leave.end_date, iteration.end_date)
                days = CalendarService.count_working_days(leave_start, leave_end, holiday_dates)
                if leave.is_half_day:
                    days *= 0.5
                leave_days += days
            
            # Calculate member capacity (same formula as existing)
            train_allocation = member.train_allocation_percent / 100
            allocated_days = base_working_days * train_allocation
            available_days = max(0, allocated_days - leave_days)
            
            train_productivity = global_settings.global_productivity_percentage / 100
            individual_productivity = (
                member.individual_productivity / 100
                if member.individual_productivity is not None 
                else 1.0
            )
            
            member_capacity = available_days * train_productivity * individual_productivity
            
            # Add to role bucket
            role = member.role if member.role in ['Developer', 'PD', 'QA'] else 'Developer'
            role_capacities[role] += member_capacity
        
        total = sum(role_capacities.values())
        
        return {
            'total': round(total, 2),
            'dev': round(role_capacities['Developer'], 2),
            'pd': round(role_capacities['PD'], 2),
            'qa': round(role_capacities['QA'], 2)
        }

    @staticmethod
    def calculate_team_iteration_capacity(
        db: Session,
        team_id: str,
        iteration: Iteration,
        global_settings: GlobalSettings
    ) -> float:
        """
        Calculate team capacity for a single iteration.

        Formula:
        For each active member:
            iteration_working_days = working_days_in_iteration - holidays
            member_available_days = iteration_working_days - member_leaves
            member_capacity = member_available_days × (allocation% / 100) × (productivity% / 100)

        Team Capacity = Σ member_capacity
        """
        # Get team to find its site and country
        from app.models.team import Team
        from app.models.organization import Site
        
        team = db.query(Team).filter(Team.id == team_id).first()
        if not team:
            return 0.0
        
        # Get the team's site country_id for filtering holidays
        team_country_id = None
        if team.site_id:
            site = db.query(Site).filter(Site.id == team.site_id).first()
            if site:
                team_country_id = site.country_id
        
        # Get active team members
        members = db.query(TeamMember).filter(
            TeamMember.team_id == team_id,
            TeamMember.status == TeamStatus.ACTIVE
        ).all()

        if not members:
            return 0.0

        # Get holidays in iteration period filtered by team's country
        # Include: team-specific holidays OR country-specific holidays for team's country
        holiday_query = db.query(Holiday).filter(
            Holiday.date >= iteration.start_date,
            Holiday.date <= iteration.end_date
        )
        
        if team_country_id:
            # Filter by team's country OR team-specific holidays
            holiday_query = holiday_query.filter(
                or_(
                    Holiday.team_id == team_id,
                    Holiday.country_id == team_country_id
                )
            )
        else:
            # No country info, only use team-specific holidays
            holiday_query = holiday_query.filter(Holiday.team_id == team_id)
        
        holidays = holiday_query.all()
        
        # Get unique holiday dates (avoid counting same date twice)
        holiday_dates = list(set([h.date for h in holidays]))
        half_day_holidays = list(set([h.date for h in holidays if h.is_half_day]))

        # Calculate base working days in iteration
        base_working_days = CalendarService.count_working_days(
            iteration.start_date,
            iteration.end_date,
            holiday_dates
        )

        # Add back half days (they count as 0.5)
        base_working_days += len(half_day_holidays) * 0.5

        total_capacity = 0.0

        for member in members:
            # Get member leaves in iteration
            leaves = db.query(MemberLeave).filter(
                MemberLeave.member_id == member.id,
                MemberLeave.start_date <= iteration.end_date,
                MemberLeave.end_date >= iteration.start_date
            ).all()

            # Calculate leave days within iteration
            leave_days = 0.0
            for leave in leaves:
                leave_start = max(leave.start_date, iteration.start_date)
                leave_end = min(leave.end_date, iteration.end_date)
                days = CalendarService.count_working_days(leave_start, leave_end, holiday_dates)
                if leave.is_half_day:
                    days *= 0.5
                leave_days += days

            # Calculate member capacity
            # CORRECTED FORMULA (2026-01-27):
            # Step 1: Apply train allocation FIRST
            train_allocation = member.train_allocation_percent / 100  # Member's allocation to this train
            allocated_days = base_working_days * train_allocation
            
            # Step 2: Deduct leave AFTER train allocation
            # (Leave is taken from member's allocated time to this train)
            available_days = max(0, allocated_days - leave_days)
            
            # Step 3: Apply productivity
            train_productivity = global_settings.global_productivity_percentage / 100  # Train-level from Settings
            individual_productivity = (
                member.individual_productivity / 100
                if member.individual_productivity is not None 
                else 1.0  # Default 100% if not set
            )

            member_capacity = available_days * train_productivity * individual_productivity
            total_capacity += member_capacity

        return round(total_capacity, 2)

    @staticmethod
    def calculate_and_store_team_capacity(
        db: Session,
        team_id: str,
        pi_id: Optional[str] = None
    ) -> List[TeamIterationCapacity]:
        """Calculate and store capacity for all iterations."""
        current_year = date.today().year
        global_settings = GlobalSettingsService.get_or_create(db, current_year)

        # Get iterations
        query = db.query(Iteration)
        if pi_id:
            query = query.filter(Iteration.pi_id == pi_id)
        else:
            query = query.join(PI).filter(PI.year == current_year)

        iterations = query.all()
        capacities = []

        for iteration in iterations:
            capacity_value = IterationCapacityService.calculate_team_iteration_capacity(
                db, team_id, iteration, global_settings
            )

            # Upsert capacity record
            existing = db.query(TeamIterationCapacity).filter(
                TeamIterationCapacity.team_id == team_id,
                TeamIterationCapacity.iteration_id == iteration.id
            ).first()

            if existing:
                existing.calculated_capacity = Decimal(str(capacity_value))
                capacities.append(existing)
            else:
                new_capacity = TeamIterationCapacity(
                    team_id=team_id,
                    iteration_id=iteration.id,
                    calculated_capacity=Decimal(str(capacity_value))
                )
                db.add(new_capacity)
                capacities.append(new_capacity)

        db.commit()
        for cap in capacities:
            db.refresh(cap)

        return capacities

    @staticmethod
    def get_team_iteration_capacity(
        db: Session,
        team_id: str,
        pi_id: str
    ) -> Optional[TeamIterationCapacityResponse]:
        """Get team capacity for all iterations in a PI using existing CapacityCalculator."""
        from app.services.capacity_calculator import CapacityCalculator
        from uuid import UUID
        
        team = db.query(Team).filter(Team.id == team_id).first()
        if not team:
            return None

        pi = db.query(PI).filter(PI.id == pi_id).first()
        if not pi:
            return None

        # Use existing CapacityCalculator for authoritative capacity figures
        capacity_summary = CapacityCalculator.calculate_team_capacity_summary(db, team, pi_id)
        
        # Get iterations for this PI
        iterations = db.query(Iteration).filter(Iteration.pi_id == pi_id).order_by(Iteration.sequence).all()
        
        # Get PI-boundary filtered member count
        all_members = db.query(TeamMember).filter(
            TeamMember.team_id == team_id,
            TeamMember.status == TeamStatus.ACTIVE
        ).all()
        
        active_members = [
            m for m in all_members
            if IterationCapacityService.is_member_active_in_pi(db, m, pi)
        ]
        member_count = len(active_members)
        
        # Calculate FTE (sum of train allocations / 100)
        fte = sum(m.train_allocation_percent for m in active_members) / 100.0 if active_members else 0.0

        # Extract total capacity from authoritative source
        total_capacity = capacity_summary['total_capacity_days']
        
        # Extract role breakdown from authoritative source
        total_dev = 0.0
        total_pd = 0.0
        total_qa = 0.0
        for role in capacity_summary['role_breakdown']:
            if role['role'] == 'developer':
                total_dev = role['effective_days']
            elif role['role'] == 'pd':
                total_pd = role['effective_days']
            elif role['role'] == 'qa':
                total_qa = role['effective_days']
        
        # Build iteration capacities with role splits
        iteration_capacities = []
        total_allocated = 0.0
        global_settings = GlobalSettingsService.get_or_create(db, pi.year)

        for iteration in iterations:
            # Calculate role-based capacity for this iteration
            role_caps = IterationCapacityService.calculate_team_iteration_capacity_by_role(
                db, team_id, iteration, pi, global_settings
            )
            
            cap = db.query(TeamIterationCapacity).filter(
                TeamIterationCapacity.team_id == team_id,
                TeamIterationCapacity.iteration_id == iteration.id
            ).first()

            if cap:
                final_cap = cap.final_capacity
                allocated = float(cap.allocated)
            else:
                final_cap = role_caps['total']
                allocated = 0.0

            available = final_cap - allocated
            utilization = (allocated / final_cap * 100) if final_cap > 0 else 0

            iteration_capacities.append(IterationCapacityResponse(
                iteration_id=iteration.id,
                iteration_name=iteration.name,
                iteration_sequence=iteration.sequence,
                start_week=iteration.start_week,
                end_week=iteration.end_week,
                is_ip=iteration.is_ip_iteration,
                calculated_capacity=float(cap.calculated_capacity) if cap else final_cap,
                manual_override=float(cap.manual_override) if cap and cap.manual_override else None,
                override_reason=cap.override_reason if cap else None,
                final_capacity=final_cap,
                allocated=allocated,
                available=available,
                utilization=round(utilization, 1),
                dev_capacity=role_caps['dev'],
                pd_capacity=role_caps['pd'],
                qa_capacity=role_caps['qa']
            ))

            total_allocated += allocated

        # Calculate feature capacity and planned effort
        feature_capacity_pct = global_settings.feature_capacity_percentage / 100.0
        pi_feature_capacity = total_capacity * feature_capacity_pct
        
        # Get planned effort from team_planning
        planned_effort = db.query(
            func.sum(
                TeamPlanning.dev_effort + 
                TeamPlanning.pd_effort + 
                TeamPlanning.qa_effort
            )
        ).filter(
            func.lower(TeamPlanning.team_id) == func.lower(team_id),
            func.lower(TeamPlanning.pi_id) == func.lower(pi_id),
            TeamPlanning.is_descoped == False
        ).scalar() or 0.0
        
        # Calculate utilisation: planned effort / feature capacity
        pi_utilization = (float(planned_effort) / pi_feature_capacity * 100) if pi_feature_capacity > 0 else 0.0

        return TeamIterationCapacityResponse(
            team_id=team.id,
            team_name=team.name,
            team_code=team.short_code,
            member_count=member_count,
            fte=round(fte, 1),
            iterations=iteration_capacities,
            pi_total_capacity=round(total_capacity, 2),
            pi_feature_capacity=round(pi_feature_capacity, 2),
            pi_planned_effort=round(float(planned_effort), 2),
            pi_total_allocated=round(total_allocated, 2),
            pi_utilization=round(pi_utilization, 1),
            dev_capacity=round(total_dev, 2),
            pd_capacity=round(total_pd, 2),
            qa_capacity=round(total_qa, 2)
        )

    @staticmethod
    def get_capacity_summary(
        db: Session,
        pi_id: str,
        team_ids: Optional[List[str]] = None
    ) -> Optional[CapacitySummaryResponse]:
        """Get capacity summary for all teams or filtered teams."""
        # Get PI
        pi = db.query(PI).filter(PI.id == pi_id).first()
        if not pi:
            return None

        # Get teams - filter by team_ids if provided
        teams_query = db.query(Team).filter(Team.status == TeamStatus.ACTIVE)
        
        if team_ids and len(team_ids) > 0:
            # Filter to specific teams using case-insensitive comparison
            teams_query = teams_query.filter(
                func.lower(Team.id).in_([func.lower(tid) for tid in team_ids])
            )
        
        teams = teams_query.all()

        team_capacities = []
        total_capacity = 0.0
        total_feature_capacity = 0.0
        total_planned_effort = 0.0
        total_allocated = 0.0

        for team in teams:
            team_cap = IterationCapacityService.get_team_iteration_capacity(db, team.id, pi.id)
            if team_cap:
                team_capacities.append(team_cap)
                total_capacity += team_cap.pi_total_capacity
                total_feature_capacity += team_cap.pi_feature_capacity
                total_planned_effort += team_cap.pi_planned_effort
                total_allocated += team_cap.pi_total_allocated

        # Calculate overall utilisation: total planned / total feature capacity
        overall_utilization = (total_planned_effort / total_feature_capacity * 100) if total_feature_capacity > 0 else 0.0

        return CapacitySummaryResponse(
            pi_id=pi.id,
            pi_name=pi.name,
            teams=team_capacities,
            total_capacity=round(total_capacity, 2),
            total_feature_capacity=round(total_feature_capacity, 2),
            total_planned_effort=round(total_planned_effort, 2),
            total_allocated=round(total_allocated, 2),
            overall_utilization=round(overall_utilization, 1)
        )

    @staticmethod
    def get_annual_capacity_summary(
        db: Session,
        year: int,
        team_ids: Optional[List[str]] = None
    ) -> Optional[AnnualCapacitySummaryResponse]:
        """Get capacity summary for all PIs in a year."""
        # Get all PIs for the year
        pis = db.query(PI).filter(PI.year == year).order_by(PI.sequence).all()
        
        if not pis:
            return None
        
        pi_summaries = []
        
        for pi in pis:
            # Get teams - filter by team_ids if provided
            teams_query = db.query(Team).filter(Team.status == TeamStatus.ACTIVE)
            
            if team_ids and len(team_ids) > 0:
                teams_query = teams_query.filter(
                    func.lower(Team.id).in_([func.lower(tid) for tid in team_ids])
                )
            
            teams = teams_query.all()
            
            team_summaries = []
            total_capacity = 0.0
            total_feature_capacity = 0.0
            total_planned_effort = 0.0
            
            global_settings = GlobalSettingsService.get_or_create(db, year)
            feature_capacity_pct = global_settings.feature_capacity_percentage / 100.0
            
            for team in teams:
                # Get PI-boundary filtered members
                all_members = db.query(TeamMember).filter(
                    TeamMember.team_id == team.id,
                    TeamMember.status == TeamStatus.ACTIVE
                ).all()
                
                active_members = [
                    m for m in all_members
                    if IterationCapacityService.is_member_active_in_pi(db, m, pi)
                ]
                
                if not active_members:
                    continue
                
                member_count = len(active_members)
                fte = sum(m.train_allocation_percent for m in active_members) / 100.0
                
                # Calculate capacity for all iterations in this PI
                iterations = db.query(Iteration).filter(Iteration.pi_id == pi.id).all()
                
                team_total_capacity = 0.0
                team_dev = 0.0
                team_pd = 0.0
                team_qa = 0.0
                
                for iteration in iterations:
                    role_caps = IterationCapacityService.calculate_team_iteration_capacity_by_role(
                        db, team.id, iteration, pi, global_settings
                    )
                    team_total_capacity += role_caps['total']
                    team_dev += role_caps['dev']
                    team_pd += role_caps['pd']
                    team_qa += role_caps['qa']
                
                team_feature_capacity = team_total_capacity * feature_capacity_pct
                
                # Get planned effort
                planned_effort = db.query(
                    func.sum(
                        TeamPlanning.dev_effort + 
                        TeamPlanning.pd_effort + 
                        TeamPlanning.qa_effort
                    )
                ).filter(
                    func.lower(TeamPlanning.team_id) == func.lower(team.id),
                    func.lower(TeamPlanning.pi_id) == func.lower(pi.id),
                    TeamPlanning.is_descoped == False
                ).scalar() or 0.0
                
                utilisation_pct = (float(planned_effort) / team_feature_capacity * 100) if team_feature_capacity > 0 else 0.0
                
                team_summaries.append(AnnualTeamSummary(
                    team_id=team.id,
                    team_name=team.name,
                    team_code=team.short_code,
                    fte=round(fte, 1),
                    member_count=member_count,
                    total_capacity=round(team_total_capacity, 2),
                    feature_capacity=round(team_feature_capacity, 2),
                    planned_effort=round(float(planned_effort), 2),
                    utilisation_pct=round(utilisation_pct, 1),
                    dev_capacity=round(team_dev, 2),
                    pd_capacity=round(team_pd, 2),
                    qa_capacity=round(team_qa, 2)
                ))
                
                total_capacity += team_total_capacity
                total_feature_capacity += team_feature_capacity
                total_planned_effort += float(planned_effort)
            
            total_utilisation = (total_planned_effort / total_feature_capacity * 100) if total_feature_capacity > 0 else 0.0
            
            pi_summaries.append(AnnualPISummary(
                pi_id=pi.id,
                pi_name=pi.name,
                start_date=pi.start_date.isoformat(),
                end_date=pi.end_date.isoformat(),
                teams=team_summaries,
                totals={
                    'total_capacity': round(total_capacity, 2),
                    'feature_capacity': round(total_feature_capacity, 2),
                    'planned_effort': round(total_planned_effort, 2),
                    'utilisation_pct': round(total_utilisation, 1)
                }
            ))
        
        return AnnualCapacitySummaryResponse(
            year=year,
            pis=pi_summaries
        )

    @staticmethod
    def override_capacity(
        db: Session,
        team_id: str,
        iteration_id: str,
        manual_override: float,
        override_reason: str
    ) -> Optional[TeamIterationCapacity]:
        """Override calculated capacity with manual value."""
        cap = db.query(TeamIterationCapacity).filter(
            TeamIterationCapacity.team_id == team_id,
            TeamIterationCapacity.iteration_id == iteration_id
        ).first()

        if not cap:
            # Create new record
            cap = TeamIterationCapacity(
                team_id=team_id,
                iteration_id=iteration_id,
                calculated_capacity=Decimal("0"),
                manual_override=Decimal(str(manual_override)),
                override_reason=override_reason
            )
            db.add(cap)
        else:
            cap.manual_override = Decimal(str(manual_override))
            cap.override_reason = override_reason

        db.commit()
        db.refresh(cap)
        return cap

    @staticmethod
    def reset_override(
        db: Session,
        team_id: str,
        iteration_id: str
    ) -> bool:
        """Reset capacity to calculated value."""
        cap = db.query(TeamIterationCapacity).filter(
            TeamIterationCapacity.team_id == team_id,
            TeamIterationCapacity.iteration_id == iteration_id
        ).first()

        if not cap:
            return False

        cap.manual_override = None
        cap.override_reason = None
        db.commit()
        return True
