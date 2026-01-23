from typing import Dict, List, Optional
from sqlalchemy.orm import Session

from app.models.team import Team, TeamMember, MemberQuarterlyAvailability, MemberPIAllocation
from app.models.pi import PI
from app.services.global_settings_service import GlobalSettingsService


class CapacityCalculator:
    """Service for calculating team and member capacity."""
    
    # Default working days per quarter (approximate, excluding weekends)
    DEFAULT_WORKING_DAYS = {1: 63, 2: 63, 3: 65, 4: 62}
    
    @staticmethod
    def calculate_member_quarterly_capacity(
        db: Session,
        member: TeamMember,
        year: int,
        quarter: int
    ) -> Dict:
        """Calculate effective capacity for a single member for a quarter."""
        
        # Get global settings
        global_settings = GlobalSettingsService.get_or_create(db, year)
        global_productivity = global_settings.global_productivity_percentage
        
        # Get member's availability for this quarter
        availability = db.query(MemberQuarterlyAvailability).filter(
            MemberQuarterlyAvailability.member_id == member.id,
            MemberQuarterlyAvailability.year == year,
            MemberQuarterlyAvailability.quarter == quarter
        ).first()
        
        if availability:
            working_days = availability.working_days
            holidays = availability.holidays
            leaves = availability.leaves
        else:
            # Use defaults if no availability configured
            working_days = CapacityCalculator.DEFAULT_WORKING_DAYS.get(quarter, 63)
            holidays = 0
            leaves = 0
        
        available_days = max(0, working_days - holidays - leaves)
        
        # Determine productivity percentage (individual override or global)
        productivity = (
            member.individual_productivity 
            if member.individual_productivity is not None 
            else global_productivity
        )
        
        # Calculate effective capacity
        effective_days = (
            available_days 
            * (member.allocation_percentage / 100) 
            * (productivity / 100)
        )
        
        return {
            'member_id': member.id,
            'member_name': member.name,
            'year': year,
            'quarter': quarter,
            'working_days': working_days,
            'holidays': holidays,
            'leaves': leaves,
            'available_days': available_days,
            'allocation_percentage': member.allocation_percentage,
            'productivity_percentage': productivity,
            'effective_days': round(effective_days, 2)
        }
    
    @staticmethod
    def calculate_team_quarterly_capacity(
        db: Session,
        team: Team,
        year: int,
        quarter: int
    ) -> Dict:
        """Calculate total team capacity for a quarter."""
        
        total_effective_days = 0
        member_capacities = []
        
        # Only include active members
        active_members = [m for m in team.members if m.status.value == 'active']
        
        for member in active_members:
            member_cap = CapacityCalculator.calculate_member_quarterly_capacity(
                db, member, year, quarter
            )
            member_capacities.append(member_cap)
            total_effective_days += member_cap['effective_days']
        
        # Convert to effort days using velocity factor
        velocity_factor = float(team.velocity_factor) if team.velocity_factor else 1.0
        total_story_points = total_effective_days * velocity_factor
        
        return {
            'quarter': quarter,
            'total_capacity_days': round(total_effective_days, 2),
            'total_capacity_points': round(total_story_points, 2),
            'member_count': len(active_members),
            'member_capacities': member_capacities,
            'allocated': 0,  # TODO: Calculate from features
            'available': round(total_story_points, 2),
            'utilization_percentage': 0
        }
    
    @staticmethod
    def calculate_team_yearly_capacity(
        db: Session,
        team: Team,
        year: int
    ) -> Dict:
        """Calculate team capacity for all quarters in a year."""
        
        quarters = []
        for q in range(1, 5):
            quarter_cap = CapacityCalculator.calculate_team_quarterly_capacity(
                db, team, year, q
            )
            quarters.append(quarter_cap)
        
        total_members = len(team.members) if team.members else 0
        active_members = len([m for m in team.members if m.status.value == 'active']) if team.members else 0
        
        return {
            'year': year,
            'quarters': quarters,
            'total_members': total_members,
            'active_members': active_members
        }
    
    @staticmethod
    def get_default_working_days(quarter: int) -> int:
        """Get default working days for a quarter."""
        return CapacityCalculator.DEFAULT_WORKING_DAYS.get(quarter, 63)

    @staticmethod
    def get_effective_allocation_for_pi(
        db: Session,
        member: TeamMember,
        pi_id: str
    ) -> tuple:
        """Get effective train allocation and individual productivity for a member in a PI.
        
        Returns (train_allocation_percent, individual_productivity_percent)
        Uses PI-specific values if available, otherwise falls back to member defaults.
        
        Note: Train-level productivity (global_productivity_percentage) is applied separately
        in the capacity calculation formula.
        """
        allocation = db.query(MemberPIAllocation).filter(
            MemberPIAllocation.member_id == member.id,
            MemberPIAllocation.pi_id == pi_id
        ).first()
        
        if allocation:
            train_alloc = allocation.train_allocation_percent
            # Individual productivity: PI-specific override, or member default, or 100%
            individual_prod = (
                allocation.productivity_percent 
                if allocation.productivity_percent is not None 
                else (member.individual_productivity if member.individual_productivity is not None else 100)
            )
        else:
            train_alloc = member.train_allocation_percent
            individual_prod = member.individual_productivity if member.individual_productivity is not None else 100
        
        return (train_alloc, individual_prod)

    @staticmethod
    def calculate_team_capacity_summary(
        db: Session,
        team: Team,
        pi_id: Optional[str] = None
    ) -> Dict:
        """Calculate team capacity summary with role breakdown.
        
        Returns capacity broken down by role (Dev, BA, QA, etc.) and 
        allocation categories from settings.
        
        Uses TeamService.get_pi_capacity_detail for accurate calculation.
        """
        from app.models.capacity_allocation import CapacityAllocationCategory
        from app.models.pi import PI
        from app.services.team_service import TeamService
        from datetime import datetime
        from uuid import UUID
        
        current_year = datetime.now().year
        
        # Get active members count
        active_members = [m for m in team.members if m.status.value == 'active']
        
        # Get PI - use provided or get first of year
        pi = None
        if pi_id:
            pi = db.query(PI).filter(PI.id == pi_id).first()
        else:
            pi = db.query(PI).filter(PI.year == current_year).order_by(PI.sequence).first()
        
        if not pi or not active_members:
            # Return empty capacity if no PI or no members
            return {
                'team_id': team.id,
                'team_name': team.name,
                'pi_id': pi_id,
                'pi_name': pi.name if pi else None,
                'total_members': len(team.members) if team.members else 0,
                'active_members': len(active_members),
                'total_capacity_days': 0.0,
                'role_breakdown': [],
                'allocation_breakdown': []
            }
        
        # Use TeamService for accurate calculation
        try:
            detail = TeamService.get_pi_capacity_detail(db, UUID(team.id), UUID(pi.id))
            
            # Build role breakdown from detail
            role_breakdown = [
                {
                    'role': 'developer',
                    'member_count': detail.summary.dev_count,
                    'total_days': 0.0,
                    'effective_days': detail.summary.total_dev_days
                },
                {
                    'role': 'pd',
                    'member_count': detail.summary.pd_count,
                    'total_days': 0.0,
                    'effective_days': detail.summary.total_pd_days
                },
                {
                    'role': 'qa',
                    'member_count': detail.summary.qa_count,
                    'total_days': 0.0,
                    'effective_days': detail.summary.total_qa_days
                }
            ]
            
            # Build allocation breakdown
            allocation_breakdown = []
            for alloc in detail.allocation_summary:
                allocation_breakdown.append({
                    'category': alloc.category,
                    'percentage': alloc.percentage,
                    'days': alloc.total_days,
                    'color': alloc.color
                })
            
            return {
                'team_id': team.id,
                'team_name': team.name,
                'pi_id': str(pi.id),
                'pi_name': pi.name,
                'total_members': len(team.members) if team.members else 0,
                'active_members': len(active_members),
                'total_capacity_days': detail.summary.total_effort_days,
                'role_breakdown': role_breakdown,
                'allocation_breakdown': allocation_breakdown
            }
        except Exception as e:
            # Fallback to 0 if calculation fails
            return {
                'team_id': team.id,
                'team_name': team.name,
                'pi_id': pi_id,
                'pi_name': pi.name if pi else None,
                'total_members': len(team.members) if team.members else 0,
                'active_members': len(active_members),
                'total_capacity_days': 0.0,
                'role_breakdown': [],
                'allocation_breakdown': []
            }
