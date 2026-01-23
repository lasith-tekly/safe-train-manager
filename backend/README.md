# SAFe Train Manager - Backend API

FastAPI backend for the SAFe Train Manager application.

## Tech Stack

- **Python 3.11+**
- **FastAPI** - Web framework
- **SQLAlchemy** - ORM
- **Pydantic** - Data validation
- **SQLite** (dev) / **PostgreSQL** (prod)

## Setup

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### 4. Run Development Server

```bash
uvicorn app.main:app --reload --port 8000
```

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products |
| GET | `/api/products/{id}` | Get single product |
| POST | `/api/products` | Create product |
| PUT | `/api/products/{id}` | Update product |
| DELETE | `/api/products/{id}` | Delete product |

### Query Parameters

- `status` - Filter by status (active/inactive)
- `search` - Search by name or short code

## Running Tests

```bash
pytest tests/ -v
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py           # FastAPI app
│   ├── config.py         # Configuration
│   ├── database.py       # DB connection
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic schemas
│   ├── routes/           # API routes
│   └── services/         # Business logic
├── tests/
├── requirements.txt
└── README.md
```
