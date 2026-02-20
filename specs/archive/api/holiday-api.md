# API Design: Holiday Management

## Document Info
- **Version**: 1.0
- **Status**: Draft - Pending Review
- **Created**: 2026-01-19
- **Based on**: `specs/requirements/holiday-management.md`

---

## 1. Endpoints

### 1.1 List Holidays
```
GET /api/holidays?country_id={uuid}&year={int}
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| country_id | UUID | Yes | Filter by country |
| year | int | Yes | Filter by year |

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "country_id": "uuid",
      "country_code": "GB",
      "year": 2026,
      "date": "2026-01-01",
      "name": "New Year's Day",
      "is_half_day": false,
      "is_recurring": true,
      "created_at": "2026-01-19T10:00:00Z"
    }
  ],
  "total": 8
}
```

### 1.2 Create Holiday
```
POST /api/holidays
```

**Request Body:**
```json
{
  "country_id": "uuid",
  "date": "2026-01-01",
  "name": "New Year's Day",
  "is_half_day": false
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "country_id": "uuid",
  "country_code": "GB",
  "year": 2026,
  "date": "2026-01-01",
  "name": "New Year's Day",
  "is_half_day": false,
  "is_recurring": false,
  "created_at": "2026-01-19T10:00:00Z"
}
```

### 1.3 Update Holiday
```
PUT /api/holidays/{holiday_id}
```

**Request Body:**
```json
{
  "date": "2026-01-02",
  "name": "New Year's Day (Observed)",
  "is_half_day": false
}
```

**Response:** `200 OK`

### 1.4 Delete Holiday
```
DELETE /api/holidays/{holiday_id}
```

**Response:** `204 No Content`

### 1.5 Get Holiday Templates
```
GET /api/holidays/templates/{country_code}?year={int}
```

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| country_code | string | ISO country code (GB, IND, COL, LKA) |

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| year | int | Yes | Year for holidays |

**Response:** `200 OK`
```json
{
  "country_code": "GB",
  "country_name": "United Kingdom",
  "year": 2026,
  "holidays": [
    { "date": "2026-01-01", "name": "New Year's Day", "is_half_day": false },
    { "date": "2026-04-03", "name": "Good Friday", "is_half_day": false },
    { "date": "2026-04-06", "name": "Easter Monday", "is_half_day": false },
    { "date": "2026-05-04", "name": "Early May Bank Holiday", "is_half_day": false },
    { "date": "2026-05-25", "name": "Spring Bank Holiday", "is_half_day": false },
    { "date": "2026-08-31", "name": "Summer Bank Holiday", "is_half_day": false },
    { "date": "2026-12-25", "name": "Christmas Day", "is_half_day": false },
    { "date": "2026-12-28", "name": "Boxing Day (substitute)", "is_half_day": false }
  ]
}
```

### 1.6 Bulk Import Holidays
```
POST /api/holidays/import
```

**Request Body:**
```json
{
  "country_id": "uuid",
  "year": 2026,
  "mode": "merge",
  "holidays": [
    { "date": "2026-01-01", "name": "New Year's Day", "is_half_day": false },
    { "date": "2026-04-03", "name": "Good Friday", "is_half_day": false }
  ]
}
```

**Response:** `200 OK`
```json
{
  "imported": 8,
  "skipped": 0,
  "message": "Successfully imported 8 holidays"
}
```

---

## 2. Pydantic Schemas

```python
# schemas/holiday.py

class HolidayBase(BaseModel):
    date: date
    name: str = Field(..., min_length=1, max_length=100)
    is_half_day: bool = False

class HolidayCreate(HolidayBase):
    country_id: UUID

class HolidayUpdate(BaseModel):
    date: Optional[date] = None
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    is_half_day: Optional[bool] = None

class HolidayResponse(HolidayBase):
    id: UUID
    country_id: UUID
    country_code: str
    year: int
    is_recurring: bool
    created_at: datetime

class HolidayListResponse(BaseModel):
    data: List[HolidayResponse]
    total: int

class HolidayTemplateItem(BaseModel):
    date: date
    name: str
    is_half_day: bool = False

class HolidayTemplate(BaseModel):
    country_code: str
    country_name: str
    year: int
    holidays: List[HolidayTemplateItem]

class HolidayImportRequest(BaseModel):
    country_id: UUID
    year: int
    mode: Literal['replace', 'merge']
    holidays: List[HolidayTemplateItem]

class HolidayImportResponse(BaseModel):
    imported: int
    skipped: int
    message: str
```

---

## 3. Database Model

```python
# models/holiday.py (update existing)

class Holiday(Base):
    __tablename__ = "holidays"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    country_id = Column(String(36), ForeignKey("countries.id"), nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    date = Column(Date, nullable=False)
    name = Column(String(100), nullable=False)
    is_half_day = Column(Boolean, nullable=False, default=False)
    is_recurring = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    country = relationship("Country", backref="holidays")

    __table_args__ = (
        UniqueConstraint('country_id', 'date', name='uq_country_holiday_date'),
        Index('ix_holiday_country_year', 'country_id', 'year'),
    )
```

---

## 4. Pre-defined Holiday Data

Store in `backend/app/data/holiday_templates.py`:

```python
HOLIDAY_TEMPLATES = {
    "GB": {
        2026: [
            ("2026-01-01", "New Year's Day"),
            ("2026-04-03", "Good Friday"),
            ("2026-04-06", "Easter Monday"),
            ("2026-05-04", "Early May Bank Holiday"),
            ("2026-05-25", "Spring Bank Holiday"),
            ("2026-08-31", "Summer Bank Holiday"),
            ("2026-12-25", "Christmas Day"),
            ("2026-12-28", "Boxing Day (substitute)"),
        ]
    },
    "IND": {
        2026: [
            ("2026-01-26", "Republic Day"),
            ("2026-03-14", "Holi"),
            ("2026-04-14", "Ambedkar Jayanti"),
            ("2026-08-15", "Independence Day"),
            ("2026-10-02", "Gandhi Jayanti"),
            ("2026-10-20", "Dussehra"),
            ("2026-11-09", "Diwali"),
            ("2026-12-25", "Christmas Day"),
        ]
    },
    "COL": {
        2026: [
            ("2026-01-01", "Año Nuevo"),
            ("2026-01-12", "Día de los Reyes Magos"),
            ("2026-03-23", "Día de San José"),
            ("2026-04-02", "Jueves Santo"),
            ("2026-04-03", "Viernes Santo"),
            ("2026-05-01", "Día del Trabajo"),
            ("2026-07-20", "Día de la Independencia"),
            ("2026-08-07", "Batalla de Boyacá"),
            ("2026-12-25", "Navidad"),
        ]
    },
    "LKA": {
        2026: [
            ("2026-01-14", "Tamil Thai Pongal Day"),
            ("2026-02-04", "Independence Day"),
            ("2026-03-29", "Maha Shivaratri"),
            ("2026-04-13", "Sinhala & Tamil New Year Eve"),
            ("2026-04-14", "Sinhala & Tamil New Year"),
            ("2026-05-01", "May Day"),
            ("2026-05-26", "Vesak Full Moon Poya"),
            ("2026-12-25", "Christmas Day"),
        ]
    }
}
```

---

## 5. Approval

| Role | Name | Status | Date |
|------|------|--------|------|
| Backend Architect | Cascade | ✅ Approved | 2026-01-19 |
| Frontend Architect | | Approved | 2026-01-19 |
