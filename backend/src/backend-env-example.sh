# backend/.env.example
# Copy this file to .env and fill in your actual values

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# OpenAI Configuration (Required for AI features)
OPENAI_API_KEY=your_openai_api_key_here

# MongoDB Configuration (Optional - uses in-memory storage if not provided)
MONGODB_URI=mongodb://localhost:27017/robostartup-ai
MONGODB_DB_NAME=robostartup-ai

# Session Configuration
SESSION_SECRET=your_super_secret_session_key_here

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Game Configuration
DEFAULT_STARTING_CASH=500000
DEFAULT_MAX_ROUNDS=10
MAX_PLAYERS_PER_GAME=4

# AI Configuration
AI_RESPONSE_TIMEOUT=30000
AI_MAX_RETRIES=3

# Real-time Features
WEBSOCKET_PING_TIMEOUT=60000
WEBSOCKET_PING_INTERVAL=25000