"""
Holiday and MemberLeave service layer.
"""
from datetime import date, timedelta
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.holiday import Holiday, MemberLeave, LeaveType
from app.schemas.holiday import (
    HolidayCreate, HolidayUpdate, HolidayResponse,
    HolidayImportRequest,
    MemberLeaveCreate, MemberLeaveResponse
)


# Holiday presets by country (supports both 2-letter and 3-letter codes)
_UK_HOLIDAYS = [
    {"name": "New Year's Day", "month": 1, "day": 1},
    {"name": "Good Friday", "month": 4, "day": 18},
    {"name": "Easter Monday", "month": 4, "day": 21},
    {"name": "Early May Bank Holiday", "month": 5, "day": 5},
    {"name": "Spring Bank Holiday", "month": 5, "day": 26},
    {"name": "Summer Bank Holiday", "month": 8, "day": 25},
    {"name": "Christmas Day", "month": 12, "day": 25},
    {"name": "Boxing Day", "month": 12, "day": 26},
]

_INDIA_HOLIDAYS = [
    {"name": "Republic Day", "month": 1, "day": 26},
    {"name": "Holi", "month": 3, "day": 14},
    {"name": "Good Friday", "month": 4, "day": 18},
    {"name": "Independence Day", "month": 8, "day": 15},
    {"name": "Gandhi Jayanti", "month": 10, "day": 2},
    {"name": "Diwali", "month": 11, "day": 1},
    {"name": "Christmas Day", "month": 12, "day": 25},
]

_COLOMBIA_HOLIDAYS = [
    {"name": "Año Nuevo", "month": 1, "day": 1},
    {"name": "Día de los Reyes Magos", "month": 1, "day": 6},
    {"name": "Día de San José", "month": 3, "day": 19},
    {"name": "Jueves Santo", "month": 4, "day": 17},
    {"name": "Viernes Santo", "month": 4, "day": 18},
    {"name": "Día del Trabajo", "month": 5, "day": 1},
    {"name": "Día de la Independencia", "month": 7, "day": 20},
    {"name": "Batalla de Boyacá", "month": 8, "day": 7},
    {"name": "Navidad", "month": 12, "day": 25},
]

_SRI_LANKA_HOLIDAYS = [
    {"name": "Tamil Thai Pongal Day", "month": 1, "day": 14},
    {"name": "Independence Day", "month": 2, "day": 4},
    {"name": "Sinhala & Tamil New Year Eve", "month": 4, "day": 13},
    {"name": "Sinhala & Tamil New Year", "month": 4, "day": 14},
    {"name": "May Day", "month": 5, "day": 1},
    {"name": "Vesak Full Moon Poya", "month": 5, "day": 12},
    {"name": "Christmas Day", "month": 12, "day": 25},
]

HOLIDAY_PRESETS = {
    # 2-letter codes
    "US": [
        {"name": "New Year's Day", "month": 1, "day": 1},
        {"name": "Martin Luther King Jr. Day", "month": 1, "day": 20},
        {"name": "Presidents' Day", "month": 2, "day": 17},
        {"name": "Memorial Day", "month": 5, "day": 26},
        {"name": "Independence Day", "month": 7, "day": 4},
        {"name": "Labor Day", "month": 9, "day": 1},
        {"name": "Thanksgiving", "month": 11, "day": 27},
        {"name": "Christmas Day", "month": 12, "day": 25},
    ],
    "UK": _UK_HOLIDAYS,
    "GB": _UK_HOLIDAYS,
    "IN": _INDIA_HOLIDAYS,
    "AU": [
        {"name": "New Year's Day", "month": 1, "day": 1},
        {"name": "Australia Day", "month": 1, "day": 26},
        {"name": "Good Friday", "month": 4, "day": 18},
        {"name": "Easter Monday", "month": 4, "day": 21},
        {"name": "Anzac Day", "month": 4, "day": 25},
        {"name": "Queen's Birthday", "month": 6, "day": 9},
        {"name": "Christmas Day", "month": 12, "day": 25},
        {"name": "Boxing Day", "month": 12, "day": 26},
    ],
    "CA": [
        {"name": "New Year's Day", "month": 1, "day": 1},
        {"name": "Good Friday", "month": 4, "day": 18},
        {"name": "Victoria Day", "month": 5, "day": 19},
        {"name": "Canada Day", "month": 7, "day": 1},
        {"name": "Labour Day", "month": 9, "day": 1},
        {"name": "Thanksgiving", "month": 10, "day": 13},
        {"name": "Christmas Day", "month": 12, "day": 25},
    ],
    "DE": [
        {"name": "New Year's Day", "month": 1, "day": 1},
        {"name": "Good Friday", "month": 4, "day": 18},
        {"name": "Easter Monday", "month": 4, "day": 21},
        {"name": "Labour Day", "month": 5, "day": 1},
        {"name": "German Unity Day", "month": 10, "day": 3},
        {"name": "Christmas Day", "month": 12, "day": 25},
        {"name": "Boxing Day", "month": 12, "day": 26},
    ],
    # 3-letter codes (ISO 3166-1 alpha-3)
    "IND": _INDIA_HOLIDAYS,
    "GBR": _UK_HOLIDAYS,
    "COL": _COLOMBIA_HOLIDAYS,
    "LKA": _SRI_LANKA_HOLIDAYS,
    "USA": [
        {"name": "New Year's Day", "month": 1, "day": 1},
        {"name": "Martin Luther King Jr. Day", "month": 1, "day": 20},
        {"name": "Presidents' Day", "month": 2, "day": 17},
        {"name": "Memorial Day", "month": 5, "day": 26},
        {"name": "Independence Day", "month": 7, "day": 4},
        {"name": "Labor Day", "month": 9, "day": 1},
        {"name": "Thanksgiving", "month": 11, "day": 27},
        {"name": "Christmas Day", "month": 12, "day": 25},
    ],
    "AUS": [
        {"name": "New Year's Day", "month": 1, "day": 1},
        {"name": "Australia Day", "month": 1, "day": 26},
        {"name": "Good Friday", "month": 4, "day": 18},
        {"name": "Easter Monday", "month": 4, "day": 21},
        {"name": "Anzac Day", "month": 4, "day": 25},
        {"name": "Queen's Birthday", "month": 6, "day": 9},
        {"name": "Christmas Day", "month": 12, "day": 25},
        {"name": "Boxing Day", "month": 12, "day": 26},
    ],
    "CAN": [
        {"name": "New Year's Day", "month": 1, "day": 1},
        {"name": "Good Friday", "month": 4, "day": 18},
        {"name": "Victoria Day", "month": 5, "day": 19},
        {"name": "Canada Day", "month": 7, "day": 1},
        {"name": "Labour Day", "month": 9, "day": 1},
        {"name": "Thanksgiving", "month": 10, "day": 13},
        {"name": "Christmas Day", "month": 12, "day": 25},
    ],
    "DEU": [
        {"name": "New Year's Day", "month": 1, "day": 1},
        {"name": "Good Friday", "month": 4, "day": 18},
        {"name": "Easter Monday", "month": 4, "day": 21},
        {"name": "Labour Day", "month": 5, "day": 1},
        {"name": "German Unity Day", "month": 10, "day": 3},
        {"name": "Christmas Day", "month": 12, "day": 25},
        {"name": "Boxing Day", "month": 12, "day": 26},
    ],
}


class HolidayService:
    """Service for Holiday operations."""

    @staticmethod
    def get_all(
        db: Session,
        year: int,
        country_id: Optional[str] = None,
        team_id: Optional[str] = None
    ) -> Tuple[List[Holiday], int]:
        """Get all holidays for a year, optionally filtered by country."""
        query = db.query(Holiday).filter(Holiday.year == year)
        
        # Filter by country if provided
        if country_id:
            query = query.filter(Holiday.country_id == country_id)
        
        if team_id:
            # Get global holidays + team-specific
            query = query.filter(
                or_(Holiday.team_id == None, Holiday.team_id == team_id)
            )
        else:
            # Get only global holidays (not team-specific)
            query = query.filter(Holiday.team_id == None)
        
        query = query.order_by(Holiday.date)
        holidays = query.all()
        
        return holidays, len(holidays)

    @staticmethod
    def get_by_id(db: Session, holiday_id: str) -> Optional[Holiday]:
        """Get holiday by ID."""
        return db.query(Holiday).filter(Holiday.id == holiday_id).first()

    @staticmethod
    def create(db: Session, data: HolidayCreate) -> Holiday:
        """Create a new holiday."""
        holiday = Holiday(
            name=data.name,
            date=data.date,
            year=data.date.year,
            is_half_day=data.is_half_day,
            is_recurring=data.is_recurring if hasattr(data, 'is_recurring') else False,
            team_id=data.team_id if hasattr(data, 'team_id') else None,
            country_id=str(data.country_id) if hasattr(data, 'country_id') and data.country_id else None,
            country_code=data.country_code if hasattr(data, 'country_code') else None
        )
        
        db.add(holiday)
        db.commit()
        db.refresh(holiday)
        return holiday

    @staticmethod
    def update(db: Session, holiday_id: str, data: HolidayUpdate) -> Optional[Holiday]:
        """Update a holiday."""
        holiday = db.query(Holiday).filter(Holiday.id == holiday_id).first()
        if not holiday:
            return None
        
        if data.name is not None:
            holiday.name = data.name
        if data.date is not None:
            holiday.date = data.date
            holiday.year = data.date.year
        if data.is_half_day is not None:
            holiday.is_half_day = data.is_half_day
        if data.is_recurring is not None:
            holiday.is_recurring = data.is_recurring
        
        db.commit()
        db.refresh(holiday)
        return holiday

    @staticmethod
    def delete(db: Session, holiday_id: str) -> bool:
        """Delete a holiday."""
        holiday = db.query(Holiday).filter(Holiday.id == holiday_id).first()
        if not holiday:
            return False
        
        db.delete(holiday)
        db.commit()
        return True

    @staticmethod
    def import_from_preset(
        db: Session,
        data: HolidayImportRequest
    ) -> List[Holiday]:
        """Import holidays from a country preset."""
        preset = HOLIDAY_PRESETS.get(data.country_code.upper())
        if not preset:
            return []
        
        # Get country_id from the request or look it up
        country_id = data.country_id
        if not country_id:
            # Try to find country by code
            from app.models.organization import Country
            country = db.query(Country).filter(Country.code == data.country_code.upper()).first()
            if country:
                country_id = country.id
        
        # Delete existing if replace
        if data.replace_existing:
            delete_query = db.query(Holiday).filter(
                Holiday.year == data.year,
                Holiday.team_id == None
            )
            if country_id:
                delete_query = delete_query.filter(Holiday.country_id == country_id)
            else:
                delete_query = delete_query.filter(Holiday.country_code == data.country_code.upper())
            delete_query.delete()
        
        holidays = []
        for h in preset:
            holiday_date = date(data.year, h["month"], h["day"])
            
            # Check if already exists for this country
            existing_query = db.query(Holiday).filter(
                Holiday.date == holiday_date,
                Holiday.team_id == None
            )
            if country_id:
                existing_query = existing_query.filter(Holiday.country_id == country_id)
            else:
                existing_query = existing_query.filter(Holiday.country_code == data.country_code.upper())
            
            existing = existing_query.first()
            
            if not existing:
                holiday = Holiday(
                    name=h["name"],
                    date=holiday_date,
                    year=data.year,
                    is_half_day=False,
                    is_recurring=True,
                    country_id=country_id,
                    country_code=data.country_code.upper()
                )
                db.add(holiday)
                holidays.append(holiday)
        
        db.commit()
        for h in holidays:
            db.refresh(h)
        
        return holidays

    @staticmethod
    def get_presets() -> List[str]:
        """Get available country presets."""
        return list(HOLIDAY_PRESETS.keys())

    @staticmethod
    def get_template(country_code: str, year: int) -> Optional[dict]:
        """Get holiday template for a country and year."""
        preset = HOLIDAY_PRESETS.get(country_code.upper())
        if not preset:
            return None
        
        country_names = {
            "US": "United States",
            "UK": "United Kingdom",
            "IN": "India",
            "AU": "Australia",
            "CA": "Canada",
            "DE": "Germany",
            "GB": "United Kingdom",
            "IND": "India",
            "COL": "Colombia",
            "LKA": "Sri Lanka",
        }
        
        holidays = []
        for h in preset:
            holiday_date = date(year, h["month"], h["day"])
            holidays.append({
                "date": holiday_date.isoformat(),
                "name": h["name"],
                "is_half_day": False
            })
        
        return {
            "country_code": country_code.upper(),
            "country_name": country_names.get(country_code.upper(), country_code),
            "year": year,
            "holidays": holidays
        }

    @staticmethod
    def get_holidays_in_range(
        db: Session,
        start_date: date,
        end_date: date,
        team_id: Optional[str] = None
    ) -> List[Holiday]:
        """Get holidays within a date range."""
        query = db.query(Holiday).filter(
            Holiday.date >= start_date,
            Holiday.date <= end_date
        )
        
        if team_id:
            query = query.filter(
                or_(Holiday.team_id == None, Holiday.team_id == team_id)
            )
        else:
            query = query.filter(Holiday.team_id == None)
        
        return query.order_by(Holiday.date).all()

    @staticmethod
    def build_holiday_response(holiday: Holiday) -> HolidayResponse:
        """Build holiday response."""
        return HolidayResponse(
            id=holiday.id,
            name=holiday.name,
            date=holiday.date,
            year=holiday.year,
            is_half_day=holiday.is_half_day,
            is_recurring=holiday.is_recurring,
            team_id=holiday.team_id,
            country_id=holiday.country_id,
            country_code=holiday.country_code,
            created_at=holiday.created_at
        )


class MemberLeaveService:
    """Service for MemberLeave operations."""

    @staticmethod
    def get_all(
        db: Session,
        member_id: str,
        year: Optional[int] = None
    ) -> List[MemberLeave]:
        """Get all leaves for a member."""
        query = db.query(MemberLeave).filter(MemberLeave.member_id == member_id)
        
        if year:
            start_of_year = date(year, 1, 1)
            end_of_year = date(year, 12, 31)
            query = query.filter(
                MemberLeave.start_date <= end_of_year,
                MemberLeave.end_date >= start_of_year
            )
        
        return query.order_by(MemberLeave.start_date).all()

    @staticmethod
    def get_by_id(db: Session, leave_id: str) -> Optional[MemberLeave]:
        """Get leave by ID."""
        return db.query(MemberLeave).filter(MemberLeave.id == leave_id).first()

    @staticmethod
    def create(db: Session, member_id: str, data: MemberLeaveCreate) -> MemberLeave:
        """Create a new leave."""
        leave = MemberLeave(
            member_id=member_id,
            start_date=data.start_date,
            end_date=data.end_date,
            leave_type=LeaveType(data.leave_type),
            is_half_day=data.is_half_day,
            notes=data.notes
        )
        
        db.add(leave)
        db.commit()
        db.refresh(leave)
        return leave

    @staticmethod
    def update(db: Session, leave_id: str, data: MemberLeaveCreate) -> Optional[MemberLeave]:
        """Update a leave."""
        leave = db.query(MemberLeave).filter(MemberLeave.id == leave_id).first()
        if not leave:
            return None
        
        leave.start_date = data.start_date
        leave.end_date = data.end_date
        leave.leave_type = LeaveType(data.leave_type)
        leave.is_half_day = data.is_half_day
        leave.notes = data.notes
        
        db.commit()
        db.refresh(leave)
        return leave

    @staticmethod
    def delete(db: Session, leave_id: str) -> bool:
        """Delete a leave."""
        leave = db.query(MemberLeave).filter(MemberLeave.id == leave_id).first()
        if not leave:
            return False
        
        db.delete(leave)
        db.commit()
        return True

    @staticmethod
    def count_leave_days(leave: MemberLeave, holidays: List[date] = None) -> int:
        """Count working days in a leave period."""
        holidays = holidays or []
        days = 0
        current = leave.start_date
        
        while current <= leave.end_date:
            # Skip weekends
            if current.weekday() < 5 and current not in holidays:
                days += 1
            current += timedelta(days=1)
        
        if leave.is_half_day:
            days = max(0.5, days * 0.5)
        
        return int(days)

    @staticmethod
    def build_leave_response(leave: MemberLeave, holidays: List[date] = None) -> MemberLeaveResponse:
        """Build leave response."""
        return MemberLeaveResponse(
            id=leave.id,
            member_id=leave.member_id,
            start_date=leave.start_date,
            end_date=leave.end_date,
            leave_type=leave.leave_type.value,
            is_half_day=leave.is_half_day,
            notes=leave.notes,
            days=MemberLeaveService.count_leave_days(leave, holidays),
            created_at=leave.created_at
        )
