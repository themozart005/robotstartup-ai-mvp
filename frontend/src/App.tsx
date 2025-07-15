// frontend/src/App.tsx
// This is the main component that holds our entire app together
// Think of it as the "main menu" that decides what screen to show

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Import our page components
import HomePage from './pages/HomePage';
import GameLobby from './pages/GameLobby';
import GameBoard from './pages/GameBoard';
import ProgressDashboard from './pages/ProgressDashboard';
import HelpCenter from './pages/HelpCenter';

// Import our global state management
import { useGameStore } from './store/GameStore';
import { useProgressStore } from './store/progressStore';

// Import our services
import { socketService } from './services/socketService';

// Import global styles
import './styles/globals.css';

// Main App component - this is like the foundation of a house
function App() {
  // Get global state from our stores
  const { isConnected, currentGame } = useGameStore();
  const { initializeProgress } = useProgressStore();

  // Set up our app when it first loads
  useEffect(() => {
    // Initialize progress tracking
    initializeProgress();

    // Connect to our game server
    socketService.connect();

    // Cleanup when app is closed
    return () => {
      socketService.disconnect();
    };
  }, [initializeProgress]);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        {/* Background Animation - makes the app feel alive */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        {/* Connection Status Indicator */}
        <ConnectionStatus isConnected={isConnected} />

        {/* Main App Content */}
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            <Routes>
              {/* Home page - where students first land */}
              <Route 
                path="/" 
                element={
                  <PageTransition>
                    <HomePage />
                  </PageTransition>
                } 
              />
              
              {/* Game lobby - where players wait and choose options */}
              <Route 
                path="/lobby" 
                element={
                  <PageTransition>
                    <GameLobby />
                  </PageTransition>
                } 
              />
              
              {/* Main game board - where the actual game happens */}
              <Route 
                path="/game/:gameId" 
                element={
                  <PageTransition>
                    <GameBoard />
                  </PageTransition>
                } 
              />
              
              {/* Progress dashboard - shows learning analytics */}
              <Route 
                path="/progress" 
                element={
                  <PageTransition>
                    <ProgressDashboard />
                  </PageTransition>
                } 
              />
              
              {/* Help center - tutorials and explanations */}
              <Route 
                path="/help" 
                element={
                  <PageTransition>
                    <HelpCenter />
                  </PageTransition>
                } 
              />
              
              {/* Redirect any unknown paths to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </div>

        {/* Toast notifications for user feedback */}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              color: '#1f2937',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

// Component that shows if we're connected to the game server
const ConnectionStatus: React.FC<{ isConnected: boolean }> = ({ isConnected }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 right-4 z-50"
    >
      <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium backdrop-blur-md border ${
        isConnected 
          ? 'bg-green-500/20 border-green-500/30 text-green-100' 
          : 'bg-red-500/20 border-red-500/30 text-red-100'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-400' : 'bg-red-400'
        } ${isConnected ? 'animate-pulse' : ''}`} />
        {isConnected ? 'Connected' : 'Connecting...'}
      </div>
    </motion.div>
  );
};

// Wrapper component that adds smooth transitions between pages
const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};

export default App;

/**
 * EXPLANATION FOR BEGINNERS:
 * 
 * This App.tsx file is like the "control center" of our entire app. Here's what it does:
 * 
 * 1. ROUTING: It decides which page to show based on the URL
 *    - "/" shows the home page
 *    - "/game/123" shows the game board for game #123
 *    - "/progress" shows learning progress
 * 
 * 2. GLOBAL SETUP: It initializes things that the whole app needs
 *    - Connects to the game server
 *    - Sets up progress tracking
 *    - Handles cleanup when the app closes
 * 
 * 3. VISUAL EFFECTS: It adds nice animations and backgrounds
 *    - Smooth transitions between pages
 *    - Animated background blobs
 *    - Connection status indicator
 * 
 * 4. USER FEEDBACK: It shows notifications (toasts) to users
 *    - Success messages when something works
 *    - Error messages when something goes wrong
 * 
 * Think of it like the main entrance to a big building - it welcomes visitors,
 * shows them where to go, and makes sure everything is running smoothly.
 */