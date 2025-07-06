# RoboStartup AI MVP

An educational board game platform teaching entrepreneurship and robotics concepts.

## Quick Start

### Development Mode

1. **Start Backend:**
```bash
cd backend
npm install
npm run dev
```

2. **Start Frontend:**
```bash
cd frontend
npm install
npm run dev
```

3. **Access the Game:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Environment Setup

1. Copy `backend/.env.example` to `backend/.env`
2. Add your OpenAI API key to the `.env` file
3. Optionally create `frontend/.env` with `VITE_API_URL=http://localhost:5000`

## Testing

1. Open http://localhost:3000
2. Create a new game
3. Test all game phases
4. Try AI tutoring features

## Project Structure

```
robostartup-ai-mvp/
├── backend/          # Node.js API server
├── frontend/         # React application
└── README.md         # This file
```