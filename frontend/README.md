# SAFe Train Manager - Frontend

React + TypeScript + Ant Design frontend for the SAFe Train Manager application.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Ant Design** - UI components
- **React Router** - Routing
- **Axios** - HTTP client

## Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The app will be available at http://localhost:5173

### 3. Build for Production

```bash
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── components/        # Shared components
│   │   ├── Layout/
│   │   ├── SidePanel/
│   │   └── StatusBadge/
│   ├── pages/             # Page components
│   │   └── Setup/
│   │       └── ProductsTab/
│   ├── services/          # API services
│   ├── types/             # TypeScript types
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Features Implemented

### Products Management (Setup > Products)
- View all products in card grid
- Add new product via side panel form
- Edit existing product
- Delete product with confirmation
- Status badges (Active/Inactive)
- Form validation
- Loading and empty states

## API Integration

The frontend connects to the backend API at `/api`. In development, Vite proxies requests to `http://localhost:8000`.

## Running with Backend

1. Start the backend:
   ```bash
   cd backend
   uvicorn app.main:app --reload --port 8000
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open http://localhost:5173
