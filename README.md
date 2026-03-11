# Automatic Facial Recognition System

A full-stack web application with a React frontend and Python Flask backend, connected via a REST API with SQLite database integration.

## Project Structure

```
├── backend/                 # Python Flask API
│   ├── app/
│   │   ├── __init__.py     # Flask app factory
│   │   ├── models.py       # SQLAlchemy database models
│   │   └── routes.py       # API endpoints
│   ├── config.py           # Configuration settings
│   ├── requirements.txt    # Python dependencies
│   └── run.py              # Application entry point
├── frontend/               # React application
│   ├── src/
│   │   ├── services/
│   │   │   └── api.js      # API service for backend communication
│   │   ├── App.jsx         # Main application component
│   │   └── App.css         # Application styles
│   ├── package.json        # Node.js dependencies
│   └── vite.config.js      # Vite configuration with API proxy
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 18+
- npm

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the Flask server:
   ```bash
   python run.py
   ```

The backend API will be available at `http://localhost:5000`.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/users` | Get all users |


## Technologies Used

- **Frontend**: React 19, Vite
- **Backend**: Python, Flask 3.0
- **Database**: SQLAlchemy ORM
- **API**: RESTful API with Flask-CORS for cross-origin support