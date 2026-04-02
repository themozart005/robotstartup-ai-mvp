// frontend/src/App.tsx
// Updated with shared Navbar component

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Import page components
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SubscriptionPage from './pages/SubscriptionPage';
import PricingPage from './pages/PricingPage';
import AccountPage from './pages/AccountPage';
import GameLobby from './pages/GameLobby';
import GameBoard from './pages/GameBoard';
import ProgressDashboard from './pages/ProgressDashboard';
import HelpCenter from './pages/HelpCenter';

// Import shared components
import ProtectedRoute from './components/auth/ProtectedRoute';
import Navbar from './components/Navbar';  // ← NEW

// Import stores
import { useGameStore } from './store/GameStore';
import { useProgressStore } from './store/ProgressStore';
import { useAuthStore } from './store/AuthStore';

// Import services
import { socketService } from './services/SocketService';

// Import global styles
import './styles/globals.css';

function App() {
  const { isConnected, currentGame } = useGameStore();
  const { initializeProgress } = useProgressStore();
  const { checkAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    checkAuth();
    initializeProgress();
    socketService.connect();
    return () => { socketService.disconnect(); };
  }, [initializeProgress, checkAuth]);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">

        {/* Background Animation */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        {/* ── Shared Navbar — shows on every page except /game/:id ── */}
        <Navbar />

        {/* Connection Status */}
        {isAuthenticated && <ConnectionStatus isConnected={isConnected} />}

        {/* Main App Content — pt-16 adds space so content clears the navbar */}
        <div className="relative z-10 pt-16">
          <AnimatePresence mode="wait">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
              <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
              <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
              <Route path="/help" element={<PageTransition><HelpCenter /></PageTransition>} />

              {/* Protected Routes */}
              <Route path="/subscription" element={
                <ProtectedRoute><PageTransition><SubscriptionPage /></PageTransition></ProtectedRoute>
              } />

              <Route path="/pricing" element={
                <ProtectedRoute><PageTransition><PricingPage /></PageTransition></ProtectedRoute>
              } />

              <Route path="/account" element={
                <ProtectedRoute><PageTransition><AccountPage /></PageTransition></ProtectedRoute>
              } />

              <Route path="/lobby" element={
                <ProtectedRoute><PageTransition><GameLobby /></PageTransition></ProtectedRoute>
              } />

              <Route path="/game/:gameId" element={
                <ProtectedRoute><PageTransition><GameBoard /></PageTransition></ProtectedRoute>
              } />

              <Route path="/progress" element={
                <ProtectedRoute><PageTransition><ProgressDashboard /></PageTransition></ProtectedRoute>
              } />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </div>

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background:    'rgba(255, 255, 255, 0.95)',
              backdropFilter:'blur(10px)',
              border:        '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius:  '12px',
              color:         '#1f2937',
              fontSize:      '14px',
              fontWeight:    '500',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#ffffff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#ffffff' } },
          }}
        />
      </div>
    </Router>
  );
}

const ConnectionStatus: React.FC<{ isConnected: boolean }> = ({ isConnected }) => (
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
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
      {isConnected ? 'Connected' : 'Connecting...'}
    </div>
  </motion.div>
);

const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
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

export default App;
