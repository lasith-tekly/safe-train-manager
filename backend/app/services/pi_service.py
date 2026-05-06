"""
PI and Iteration service layer.
"""
from datetime import date, timedelta
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.pi import PI, Iteration, PIStatus
from app.models.global_settings import GlobalSettings
from app.schemas.pi import (
    PICreate, PIUpdate, IterationCreate, IterationUpdate, PIGenerateRequest, 
    PIResponse, IterationResponse, CascadePreviewResponse, IterationChangePreview,
    PIChangePreview, CascadeApplyRequest
)


# Day name to weekday mapping (Monday=0, Sunday=6)
DAY_TO_WEEKDAY = {
    "mon": 0, "tue": 1, "wed": 2, "thu": 3, "fri": 4, "sat": 5, "sun": 6
}
WEEKDAY_TO_DAY = {v: k for k, v in DAY_TO_WEEKDAY.items()}


def get_working_days_set(working_days_str: str) -> set:
    """Convert working days string to set of weekday numbers."""
    days = [d.strip().lower() for d in working_days_str.split(",") if d.strip()]
    return {DAY_TO_WEEKDAY[d] for d in days if d in DAY_TO_WEEKDAY}


def count_working_days(start_date: date, end_date: date, working_days: set) -> int:
    """Count working days between two dates (inclusive)."""
    count = 0
    current = start_date
    while current <= end_date:
        if current.weekday() in working_days:
            count += 1
        current += timedelta(days=1)
    return count


def add_working_days(start_date: date, num_days: int, working_days: set) -> date:
    """Add a number of working days to a date."""
    if num_days <= 0:
        return start_date
    
    current = start_date
    days_added = 0
    
    # First, move to a working day if not already on one
    while current.weekday() not in working_days:
        current += timedelta(days=1)
    
    # Now add the required working days
    while days_added < num_days - 1:  # -1 because start day counts as day 1
        current += timedelta(days=1)
        if current.weekday() in working_days:
            days_added += 1
    
    return current


def get_iteration_end_date(start_date: date, duration_weeks: int, working_days: set) -> date:
    """Calculate iteration end date based on working days per week.
    
    The end date will be the last working day of the iteration period.
    For example, a 2-week iteration starting Monday will end on Friday of the 2nd week.
    """
    working_days_per_week = len(working_days)
    total_working_days = duration_weeks * working_days_per_week
    return add_working_days(start_date, total_working_days, working_days)


def get_previous_working_day(d: date, working_days: set) -> date:
    """Get the previous working day on or before the given date."""
    while d.weekday() not in working_days:
        d -= timedelta(days=1)
    return d


def get_next_working_day(d: date, working_days: set) -> date:
    """Get the next working day on or after the given date."""
    while d.weekday() not in working_days:
        d += timedelta(days=1)
    return d


def get_working_days_for_year(db: Session, year: int) -> set:
    """Get working days set for a given year from Global Settings."""
    settings = db.query(GlobalSettings).filter(GlobalSettings.year == year).first()
    working_days_str = settings.working_days if settings else "mon,tue,wed,thu,fri"
    return get_working_days_set(working_days_str)


class PIService:
    """Service for PI and Iteration operations."""

    @staticmethod
    def get_all(
        db: Session,
        year: Optional[int] = None,
        status: Optional[str] = None
    ) -> Tuple[List[PI], int]:
        """Get all PIs (optionally filtered by year)."""
        query = db.query(PI)

        if year is not None:
            query = query.filter(PI.year == year)

        if status:
            query = query.filter(PI.status == status)

        query = query.order_by(PI.start_date)
        pis = query.all()

        return pis, len(pis)

    @staticmethod
    def get_by_id(db: Session, pi_id: str) -> Optional[PI]:
        """Get PI by ID."""
        return db.query(PI).filter(PI.id == pi_id).first()

    @staticmethod
    def create(db: Session, data: PICreate) -> PI:
        """Create a new PI with iterations."""
        pi = PI(
            name=data.name,
            year=data.year,
            sequence=data.sequence,
            start_date=data.start_date,
            end_date=data.end_date,
            status=PIStatus(data.status)
        )
        
        # Add iterations
        for iter_data in data.iterations:
            iteration = Iteration(
                name=iter_data.name,
                sequence=iter_data.sequence,
                start_date=iter_data.start_date,
                end_date=iter_data.end_date,
                duration_weeks=iter_data.duration_weeks,
                is_ip_iteration=iter_data.is_ip_iteration
            )
            pi.iterations.append(iteration)
        
        db.add(pi)
        db.commit()
        db.refresh(pi)
        return pi

    @staticmethod
    def update(db: Session, pi_id: str, data: PIUpdate) -> Optional[PI]:
        """Update a PI."""
        pi = db.query(PI).filter(PI.id == pi_id).first()
        if not pi:
            return None
        
        if data.name is not None:
            pi.name = data.name
        if data.start_date is not None:
            pi.start_date = data.start_date
        if data.end_date is not None:
            pi.end_date = data.end_date
        if data.status is not None:
            pi.status = PIStatus(data.status)
        
        db.commit()
        db.refresh(pi)
        return pi

    @staticmethod
    def delete(db: Session, pi_id: str) -> bool:
        """Delete a PI and all its iterations."""
        pi = db.query(PI).filter(PI.id == pi_id).first()
        if not pi:
            return False
        
        db.delete(pi)
        db.commit()
        return True

    @staticmethod
    def generate_from_template(
        db: Session,
        data: PIGenerateRequest
    ) -> List[PI]:
        """Generate PIs from a template, respecting working days configuration."""
        # Get global settings for working days
        settings = db.query(GlobalSettings).filter(GlobalSettings.year == data.year).first()
        working_days_str = settings.working_days if settings else "mon,tue,wed,thu,fri"
        working_days = get_working_days_set(working_days_str)
        
        pis = []
        current_start = data.start_date
        
        # Ensure start date is a working day
        while current_start.weekday() not in working_days:
            current_start += timedelta(days=1)
        
        for pi_seq in range(1, data.pi_count + 1):
            # Determine PI name based on template
            if data.template == "quarterly":
                quarter = ((pi_seq - 1) % 4) + 1
                pi_name = f"PI {data.year}-Q{quarter}"
            else:
                pi_name = f"PI {data.year}.{pi_seq}"
            
            pi = PI(
                name=pi_name,
                year=data.year,
                sequence=pi_seq,
                start_date=current_start,
                end_date=current_start,  # Will be updated after iterations
                status=PIStatus.PLANNING
            )
            
            # Generate iterations
            iter_start = current_start
            total_iters = data.iterations_per_pi + (1 if data.include_ip else 0)
            for iter_seq in range(1, total_iters + 1):
                is_ip = data.include_ip and iter_seq == total_iters
                
                # Calculate iteration end based on working days
                iter_end = get_iteration_end_date(iter_start, data.iteration_weeks, working_days)
                
                iteration = Iteration(
                    name="IP" if is_ip else f"Iteration {iter_seq}",
                    sequence=iter_seq,
                    start_date=iter_start,
                    end_date=iter_end,
                    duration_weeks=data.iteration_weeks,
                    is_ip_iteration=is_ip
                )
                pi.iterations.append(iteration)
                
                # Next iteration starts on the next working day after this one ends
                iter_start = iter_end + timedelta(days=1)
                while iter_start.weekday() not in working_days:
                    iter_start += timedelta(days=1)
            
            # Update PI end date to match last iteration
            pi.end_date = pi.iterations[-1].end_date
            
            pis.append(pi)
            
            # Next PI starts on the next working day after this one ends
            current_start = pi.end_date + timedelta(days=1)
            while current_start.weekday() not in working_days:
                current_start += timedelta(days=1)
        
        # Save to database
        for pi in pis:
            db.add(pi)
        db.commit()
        
        # Refresh all
        for pi in pis:
            db.refresh(pi)
        
        return pis

    @staticmethod
    def check_overlap(db: Session, year: int, start_date: date, end_date: date, exclude_id: Optional[str] = None) -> bool:
        """Check if dates overlap with existing PIs."""
        query = db.query(PI).filter(
            PI.year == year,
            PI.start_date <= end_date,
            PI.end_date >= start_date
        )
        
        if exclude_id:
            query = query.filter(PI.id != exclude_id)
        
        return query.first() is not None

    @staticmethod
    def recalculate_pi_dates(db: Session, pi_id: str, cascade_to_following: bool = True) -> Optional[PI]:
        """Recalculate PI dates based on its iterations and optionally cascade to following PIs."""
        pi = db.query(PI).filter(PI.id == pi_id).first()
        if not pi or not pi.iterations:
            return pi
        
        # Get working days for this year
        working_days = get_working_days_for_year(db, pi.year)
        
        # Store old end date to detect changes
        old_end_date = pi.end_date
        
        # Find min start and max end from iterations
        iterations = sorted(pi.iterations, key=lambda x: x.start_date)
        pi.start_date = iterations[0].start_date
        pi.end_date = iterations[-1].end_date
        
        # Cascade to following PIs if end date changed
        if cascade_to_following and pi.end_date != old_end_date:
            following_pis = db.query(PI).filter(
                PI.year == pi.year,
                PI.sequence > pi.sequence
            ).order_by(PI.sequence).all()
            
            if following_pis:
                # Next PI starts on the next working day after current PI ends
                next_start = pi.end_date + timedelta(days=1)
                next_start = get_next_working_day(next_start, working_days)
                
                for following_pi in following_pis:
                    # Set new start date (must be a working day)
                    following_pi.start_date = next_start
                    
                    # Recalculate all iterations from new start, respecting working days
                    iter_start = next_start
                    for iter in sorted(following_pi.iterations, key=lambda x: x.sequence):
                        iter.start_date = iter_start
                        iter.end_date = get_iteration_end_date(iter_start, iter.duration_weeks, working_days)
                        # Next iteration starts on the next working day after this one ends
                        iter_start = iter.end_date + timedelta(days=1)
                        iter_start = get_next_working_day(iter_start, working_days)
                    
                    # Update PI end date based on last iteration
                    if following_pi.iterations:
                        last_iter = sorted(following_pi.iterations, key=lambda x: x.sequence)[-1]
                        following_pi.end_date = last_iter.end_date
                    
                    # Next PI starts on the next working day after this one ends
                    next_start = following_pi.end_date + timedelta(days=1)
                    next_start = get_next_working_day(next_start, working_days)
        
        db.commit()
        db.refresh(pi)
        return pi

    @staticmethod
    def resequence_iterations(db: Session, pi_id: str) -> Optional[PI]:
        """Resequence iterations by start date."""
        pi = db.query(PI).filter(PI.id == pi_id).first()
        if not pi:
            return None
        
        iterations = sorted(pi.iterations, key=lambda x: x.start_date)
        for idx, iteration in enumerate(iterations, 1):
            iteration.sequence = idx
        
        db.commit()
        db.refresh(pi)
        return pi

    @staticmethod
    def commit_pi(db: Session, pi_id: str) -> Optional[PI]:
        """Commit a draft PI to lock it."""
        pi = db.query(PI).filter(PI.id == pi_id).first()
        if not pi:
            return None
        
        if pi.status != PIStatus.DRAFT:
            raise ValueError(f"Can only commit PIs in draft status. Current status: {pi.status.value}")
        
        if not pi.iterations:
            raise ValueError("Cannot commit PI without iterations")
        
        pi.status = PIStatus.COMMITTED
        db.commit()
        db.refresh(pi)
        return pi

    @staticmethod
    def uncommit_pi(db: Session, pi_id: str) -> Optional[PI]:
        """Revert a committed PI back to draft."""
        pi = db.query(PI).filter(PI.id == pi_id).first()
        if not pi:
            return None
        
        if pi.status != PIStatus.COMMITTED:
            raise ValueError(f"Can only uncommit PIs in committed status. Current status: {pi.status.value}")
        
        pi.status = PIStatus.DRAFT
        db.commit()
        db.refresh(pi)
        return pi

    @staticmethod
    def commit_year(db: Session, year: int) -> List[PI]:
        """Commit all draft PIs for a year."""
        pis = db.query(PI).filter(
            PI.year == year,
            PI.status == PIStatus.DRAFT
        ).all()
        
        if not pis:
            raise ValueError(f"No draft PIs found for year {year}")
        
        # Validate all PIs have iterations
        for pi in pis:
            if not pi.iterations:
                raise ValueError(f"PI {pi.name} has no iterations")
        
        for pi in pis:
            pi.status = PIStatus.COMMITTED
        
        db.commit()
        
        # Return all PIs for the year
        return db.query(PI).filter(PI.year == year).order_by(PI.sequence).all()

    @staticmethod
    def uncommit_year(db: Session, year: int) -> List[PI]:
        """Uncommit all committed PIs for a year back to draft."""
        pis = db.query(PI).filter(
            PI.year == year,
            PI.status == PIStatus.COMMITTED
        ).all()
        
        if not pis:
            raise ValueError(f"No committed PIs found for year {year}")
        
        for pi in pis:
            pi.status = PIStatus.DRAFT
        
        db.commit()
        
        # Return all PIs for the year
        return db.query(PI).filter(PI.year == year).order_by(PI.sequence).all()

    @staticmethod
    def get_cascade_preview(
        db: Session, 
        iteration_id: str, 
        new_duration_weeks: int
    ) -> Optional[CascadePreviewResponse]:
        """Preview cascade impact of changing iteration duration."""
        iteration = db.query(Iteration).filter(Iteration.id == iteration_id).first()
        if not iteration:
            return None
        
        pi = iteration.pi
        old_duration = iteration.duration_weeks
        shift_days = (new_duration_weeks - old_duration) * 7
        
        if shift_days == 0:
            return CascadePreviewResponse(
                source_iteration_id=iteration.id,
                source_iteration_name=iteration.name,
                old_duration_weeks=old_duration,
                new_duration_weeks=new_duration_weeks,
                shift_days=0,
                affected_iterations=[],
                affected_pis=[],
                warnings=[]
            )
        
        # Find affected iterations within the same PI
        affected_iterations = []
        following_iterations = [
            i for i in pi.iterations 
            if i.sequence > iteration.sequence
        ]
        
        for iter in sorted(following_iterations, key=lambda x: x.sequence):
            affected_iterations.append(IterationChangePreview(
                iteration_id=iter.id,
                iteration_name=iter.name,
                old_start_date=iter.start_date,
                old_end_date=iter.end_date,
                new_start_date=iter.start_date + timedelta(days=shift_days),
                new_end_date=iter.end_date + timedelta(days=shift_days),
                shift_days=shift_days
            ))
        
        # Calculate new PI end date
        new_pi_end = pi.end_date + timedelta(days=shift_days)
        
        # Find following PIs in the same year
        affected_pis = []
        following_pis = db.query(PI).filter(
            PI.year == pi.year,
            PI.sequence > pi.sequence
        ).order_by(PI.sequence).all()
        
        for following_pi in following_pis:
            affected_pis.append(PIChangePreview(
                pi_id=following_pi.id,
                pi_name=following_pi.name,
                old_start_date=following_pi.start_date,
                old_end_date=following_pi.end_date,
                new_start_date=following_pi.start_date + timedelta(days=shift_days),
                new_end_date=following_pi.end_date + timedelta(days=shift_days),
                shift_days=shift_days
            ))
        
        # Generate warnings
        warnings = []
        if shift_days > 0:
            warnings.append(f"This will extend PI {pi.name} by {shift_days} days")
        else:
            warnings.append(f"This will shorten PI {pi.name} by {abs(shift_days)} days")
        
        if following_pis and shift_days != 0:
            warnings.append(f"{len(following_pis)} following PI(s) may need to be shifted")
        
        # Check for year boundary
        if new_pi_end.year != pi.end_date.year:
            warnings.append(f"PI end date will cross into year {new_pi_end.year}")
        
        return CascadePreviewResponse(
            source_iteration_id=iteration.id,
            source_iteration_name=iteration.name,
            old_duration_weeks=old_duration,
            new_duration_weeks=new_duration_weeks,
            shift_days=shift_days,
            affected_iterations=affected_iterations,
            affected_pis=affected_pis,
            warnings=warnings
        )

    @staticmethod
    def apply_cascade(db: Session, data: CascadeApplyRequest) -> Optional[PI]:
        """Apply cascade changes to iteration and optionally following PIs."""
        iteration = db.query(Iteration).filter(Iteration.id == data.iteration_id).first()
        if not iteration:
            return None
        
        pi = iteration.pi
        old_duration = iteration.duration_weeks
        shift_days = (data.new_duration_weeks - old_duration) * 7
        
        if shift_days == 0:
            return pi
        
        # Get working days for this PI's year
        working_days = get_working_days_for_year(db, pi.year)
        
        # Update the source iteration
        iteration.duration_weeks = data.new_duration_weeks
        iteration.end_date = get_iteration_end_date(iteration.start_date, data.new_duration_weeks, working_days)
        
        # Cascade to following iterations within the PI (including IP)
        if data.cascade_to_following_iterations:
            following_iterations = [
                i for i in pi.iterations 
                if i.sequence > iteration.sequence
            ]
            for iter in following_iterations:
                iter.start_date = iter.start_date + timedelta(days=shift_days)
                iter.end_date = iter.end_date + timedelta(days=shift_days)
        
        # Update PI end date based on the last iteration's end date
        all_iterations = sorted(pi.iterations, key=lambda x: x.sequence)
        if all_iterations:
            last_iteration = all_iterations[-1]
            # Recalculate based on last iteration (which could be IP)
            pi.end_date = last_iteration.end_date
        else:
            pi.end_date = pi.end_date + timedelta(days=shift_days)
        
        # Cascade to following PIs if requested
        if data.cascade_to_following_pis:
            # Get all following PIs in the year, or specific ones if provided
            if data.pi_ids_to_cascade:
                following_pis = [
                    db.query(PI).filter(PI.id == pi_id).first() 
                    for pi_id in data.pi_ids_to_cascade
                ]
                following_pis = [p for p in following_pis if p is not None]
            else:
                # If no specific PIs selected, cascade to all following PIs
                following_pis = db.query(PI).filter(
                    PI.year == pi.year,
                    PI.sequence > pi.sequence
                ).order_by(PI.sequence).all()
            
            # Calculate the new start date for following PIs based on current PI's new end date
            next_start = pi.end_date + timedelta(days=1)
            next_start = get_next_working_day(next_start, working_days)
            
            for following_pi in following_pis:
                # Calculate the duration of this PI
                pi_duration = (following_pi.end_date - following_pi.start_date).days
                
                # Set new start and end dates
                following_pi.start_date = next_start
                following_pi.end_date = next_start + timedelta(days=pi_duration)
                
                # Shift all iterations in that PI to align with new PI start, respecting working days
                iter_start = next_start
                for iter in sorted(following_pi.iterations, key=lambda x: x.sequence):
                    iter.start_date = iter_start
                    iter.end_date = get_iteration_end_date(iter_start, iter.duration_weeks, working_days)
                    # Next iteration starts on the next working day after this one ends
                    iter_start = iter.end_date + timedelta(days=1)
                    iter_start = get_next_working_day(iter_start, working_days)
                
                # Update PI end date based on last iteration
                if following_pi.iterations:
                    last_iter = sorted(following_pi.iterations, key=lambda x: x.sequence)[-1]
                    following_pi.end_date = last_iter.end_date
                
                # Next PI starts on the next working day after this one ends
                next_start = following_pi.end_date + timedelta(days=1)
                next_start = get_next_working_day(next_start, working_days)
        
        db.commit()
        db.refresh(pi)
        return pi

    @staticmethod
    def build_pi_response(pi: PI) -> PIResponse:
        """Build PI response with computed properties."""
        iterations = [
            IterationResponse(
                id=iter.id,
                pi_id=iter.pi_id,
                name=iter.name,
                sequence=iter.sequence,
                start_date=iter.start_date,
                end_date=iter.end_date,
                duration_weeks=iter.duration_weeks,
                is_ip_iteration=iter.is_ip_iteration,
                start_week=iter.start_week,
                end_week=iter.end_week,
                created_at=iter.created_at
            )
            for iter in pi.iterations
        ]
        
        return PIResponse(
            id=pi.id,
            name=pi.name,
            year=pi.year,
            sequence=pi.sequence,
            start_date=pi.start_date,
            end_date=pi.end_date,
            status=pi.status.value,
            start_week=pi.start_week,
            end_week=pi.end_week,
            duration_weeks=pi.duration_weeks,
            iterations=iterations,
            created_at=pi.created_at,
            updated_at=pi.updated_at
        )

    @staticmethod
    def realign_to_working_days(db: Session, year: int) -> List[PI]:
        """Realign all PIs and iterations for a year to respect working days.
        
        This fixes existing PIs that may have dates on non-working days.
        """
        # Get working days for this year
        working_days = get_working_days_for_year(db, year)
        
        # Get all PIs for the year, ordered by sequence
        pis = db.query(PI).filter(PI.year == year).order_by(PI.sequence).all()
        
        if not pis:
            return []
        
        # Start from the first PI's start date, adjusted to working day
        current_start = get_next_working_day(pis[0].start_date, working_days)
        
        for pi in pis:
            # Update PI start date
            pi.start_date = current_start
            
            # Realign all iterations within this PI
            iter_start = current_start
            for iteration in sorted(pi.iterations, key=lambda x: x.sequence):
                iteration.start_date = iter_start
                iteration.end_date = get_iteration_end_date(iter_start, iteration.duration_weeks, working_days)
                
                # Next iteration starts on the next working day
                iter_start = iteration.end_date + timedelta(days=1)
                iter_start = get_next_working_day(iter_start, working_days)
            
            # Update PI end date based on last iteration
            if pi.iterations:
                last_iter = sorted(pi.iterations, key=lambda x: x.sequence)[-1]
                pi.end_date = last_iter.end_date
            
            # Next PI starts on the next working day after this one ends
            current_start = pi.end_date + timedelta(days=1)
            current_start = get_next_working_day(current_start, working_days)
        
        db.commit()
        
        # Refresh and return
        for pi in pis:
            db.refresh(pi)
        
        return pis


class IterationService:
    """Service for Iteration operations."""

    @staticmethod
    def get_by_id(db: Session, iteration_id: str) -> Optional[Iteration]:
        """Get iteration by ID."""
        return db.query(Iteration).filter(Iteration.id == iteration_id).first()

    @staticmethod
    def add_to_pi(db: Session, pi_id: str, data: IterationCreate) -> Optional[Iteration]:
        """Add an iteration to a PI, shifting following iterations if needed."""
        pi = db.query(PI).filter(PI.id == pi_id).first()
        if not pi:
            return None
        
        # Get working days for this PI's year
        working_days = get_working_days_for_year(db, pi.year)
        
        # Ensure start/end dates are working days
        adjusted_start = get_next_working_day(data.start_date, working_days)
        adjusted_end = get_iteration_end_date(adjusted_start, data.duration_weeks, working_days)
        
        # Find iterations that need to be shifted (those with sequence >= new iteration's sequence)
        following_iterations = [
            i for i in pi.iterations 
            if i.sequence >= data.sequence
        ]
        
        # First, increment sequences of following iterations to avoid unique constraint
        for iter in sorted(following_iterations, key=lambda x: -x.sequence):  # Reverse order
            iter.sequence = iter.sequence + 1
        
        # Flush to apply sequence changes before inserting new iteration
        db.flush()
        
        # Shift following iterations' dates forward, respecting working days
        if following_iterations:
            # Next iteration starts after the new iteration ends
            next_start = adjusted_end + timedelta(days=1)
            next_start = get_next_working_day(next_start, working_days)
            
            for iter in sorted(following_iterations, key=lambda x: x.sequence):
                iter.start_date = next_start
                iter.end_date = get_iteration_end_date(next_start, iter.duration_weeks, working_days)
                # Next iteration starts after this one
                next_start = iter.end_date + timedelta(days=1)
                next_start = get_next_working_day(next_start, working_days)
        
        # Create the new iteration with adjusted dates
        iteration = Iteration(
            pi_id=pi_id,
            name=data.name,
            sequence=data.sequence,
            start_date=adjusted_start,
            end_date=adjusted_end,
            duration_weeks=data.duration_weeks,
            is_ip_iteration=data.is_ip_iteration
        )
        
        db.add(iteration)
        db.commit()
        db.refresh(iteration)
        return iteration

    @staticmethod
    def update(db: Session, iteration_id: str, data: IterationUpdate) -> Optional[Iteration]:
        """Update an iteration with partial data."""
        iteration = db.query(Iteration).filter(Iteration.id == iteration_id).first()
        if not iteration:
            return None
        
        # Get working days for this iteration's PI year
        pi = db.query(PI).filter(PI.id == iteration.pi_id).first()
        working_days = get_working_days_for_year(db, pi.year) if pi else get_working_days_set("mon,tue,wed,thu,fri")
        
        if data.name is not None:
            iteration.name = data.name
        if data.sequence is not None:
            iteration.sequence = data.sequence
        if data.start_date is not None:
            # Ensure start date is a working day
            iteration.start_date = get_next_working_day(data.start_date, working_days)
        if data.end_date is not None:
            # Ensure end date is a working day
            iteration.end_date = get_next_working_day(data.end_date, working_days)
        if data.duration_weeks is not None:
            iteration.duration_weeks = data.duration_weeks
            # Auto-calculate end_date if duration changed and start_date exists
            if data.end_date is None and iteration.start_date:
                iteration.end_date = get_iteration_end_date(iteration.start_date, data.duration_weeks, working_days)
        if data.is_ip_iteration is not None:
            iteration.is_ip_iteration = data.is_ip_iteration
        
        db.commit()
        db.refresh(iteration)
        return iteration

    @staticmethod
    def delete(db: Session, iteration_id: str) -> bool:
        """Delete an iteration."""
        iteration = db.query(Iteration).filter(Iteration.id == iteration_id).first()
        if not iteration:
            return False
        
        db.delete(iteration)
        db.commit()
        return True

    @staticmethod
    def build_iteration_response(iteration: Iteration) -> IterationResponse:
        """Build iteration response with computed properties."""
        return IterationResponse(
            id=iteration.id,
            pi_id=iteration.pi_id,
            name=iteration.name,
            sequence=iteration.sequence,
            start_date=iteration.start_date,
            end_date=iteration.end_date,
            duration_weeks=iteration.duration_weeks,
            is_ip_iteration=iteration.is_ip_iteration,
            start_week=iteration.start_week,
            end_week=iteration.end_week,
            created_at=iteration.created_at
        )
