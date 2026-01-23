# Safe Train Manager

A comprehensive team capacity management system for Agile/SAFe teams.

## Features

### Core Functionality
- Team capacity management and planning
- PI (Program Increment) configuration and tracking
- Member allocation and productivity tracking
- Holiday and leave management
- Budget and resource planning

### Recent Enhancements
- **Iteration-level productivity overrides** - Set custom productivity per member per iteration
- **IP week deduction** - Additional capacity deductions for PO/SM roles during IP planning
- **SM/PO visibility** - Teams table now shows Scrum Master and Product Owner names
- **Improved capacity calculations** - Fixed double deduction issues in IP week capacity

## Tech Stack

### Backend
- FastAPI (Python)
- SQLAlchemy ORM
- SQLite database
- Pydantic schemas

### Frontend
- React with TypeScript
- Vite build tool
- Ant Design UI components
- TailwindCSS for styling

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scriptsctivate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

## Database

The application uses SQLite for development. The database file is created automatically on first run.

## API Documentation

Once the backend is running, visit http://localhost:8000/docs for interactive API documentation.

## Contributing

1. Create a feature branch from `developer`
2. Make your changes
3. Test thoroughly
4. Submit a pull request to `developer`
5. After review, merge to `developer`
6. Deploy from `developer` to `main` for production

## Branch Structure

- `main`: Production-ready code
- `developer`: Integration and testing branch
- Feature branches: Created from `developer` for new features

## License

[Add your license here]
