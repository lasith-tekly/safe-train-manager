"""
Iteration Capacity calculation service.
"""
from datetime import date, timedelta
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.pi import PI, Iteration
from app.models.team import Team, TeamMember, TeamStatus
from app.models.holiday import Holiday, MemberLeave
from app.models.capacity import TeamIterationCapacity
from app.models.global_settings import GlobalSettings
from app.services.global_settings_service import GlobalSettingsService
from app.schemas.iteration_capacity import (
    IterationCapacityResponse,
    TeamIterationCapacityResponse,
    CapacitySummaryResponse
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
        """Get team capacity for all iterations in a PI."""
        team = db.query(Team).filter(Team.id == team_id).first()
        if not team:
            return None

        pi = db.query(PI).filter(PI.id == pi_id).first()
        if not pi:
            return None

        # Get or calculate capacities
        iterations = db.query(Iteration).filter(Iteration.pi_id == pi_id).order_by(Iteration.sequence).all()
        
        member_count = db.query(TeamMember).filter(
            TeamMember.team_id == team_id,
            TeamMember.status == TeamStatus.ACTIVE
        ).count()

        iteration_capacities = []
        total_capacity = 0.0
        total_allocated = 0.0

        for iteration in iterations:
            cap = db.query(TeamIterationCapacity).filter(
                TeamIterationCapacity.team_id == team_id,
                TeamIterationCapacity.iteration_id == iteration.id
            ).first()

            if cap:
                final_cap = cap.final_capacity
                allocated = float(cap.allocated)
            else:
                # Calculate on the fly if not stored
                global_settings = GlobalSettingsService.get_or_create(db, pi.year)
                final_cap = IterationCapacityService.calculate_team_iteration_capacity(
                    db, team_id, iteration, global_settings
                )
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
                utilization=round(utilization, 1)
            ))

            total_capacity += final_cap
            total_allocated += allocated

        pi_utilization = (total_allocated / total_capacity * 100) if total_capacity > 0 else 0

        return TeamIterationCapacityResponse(
            team_id=team.id,
            team_name=team.name,
            team_code=team.short_code,
            member_count=member_count,
            iterations=iteration_capacities,
            pi_total_capacity=round(total_capacity, 2),
            pi_total_allocated=round(total_allocated, 2),
            pi_utilization=round(pi_utilization, 1)
        )

    @staticmethod
    def get_capacity_summary(
        db: Session,
        year: int,
        pi_id: Optional[str] = None
    ) -> Optional[CapacitySummaryResponse]:
        """Get capacity summary for all teams."""
        # Get PI
        if pi_id:
            pi = db.query(PI).filter(PI.id == pi_id).first()
        else:
            # Get first active PI for the year
            pi = db.query(PI).filter(
                PI.year == year,
                PI.status == 'active'
            ).first()
            if not pi:
                # Get first PI for the year
                pi = db.query(PI).filter(PI.year == year).order_by(PI.sequence).first()

        if not pi:
            return None

        # Get all active teams
        teams = db.query(Team).filter(Team.status == TeamStatus.ACTIVE).all()

        team_capacities = []
        total_capacity = 0.0
        total_allocated = 0.0

        for team in teams:
            team_cap = IterationCapacityService.get_team_iteration_capacity(db, team.id, pi.id)
            if team_cap:
                team_capacities.append(team_cap)
                total_capacity += team_cap.pi_total_capacity
                total_allocated += team_cap.pi_total_allocated

        overall_utilization = (total_allocated / total_capacity * 100) if total_capacity > 0 else 0

        return CapacitySummaryResponse(
            pi_id=pi.id,
            pi_name=pi.name,
            teams=team_capacities,
            total_capacity=round(total_capacity, 2),
            total_allocated=round(total_allocated, 2),
            overall_utilization=round(overall_utilization, 1)
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
