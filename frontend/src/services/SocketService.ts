// frontend/src/services/SocketService.ts
// PRODUCTION-READY VERSION - Fixed with isConnected method added

import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';

// Safe environment variable getter that works in production builds
const getEnvVar = (key: string, fallback?: string): string | undefined => {
  try {
    // For Vite builds (checks for import.meta.env safely)
    if (typeof window !== 'undefined' && (window as any).import?.meta?.env) {
      return (window as any).import.meta.env[key] || fallback;
    }
    
    // Direct access for Vite (this is the main one that works)
    try {
      // @ts-ignore - Safe access to import.meta.env
      if (import.meta?.env) {
        // @ts-ignore
        return import.meta.env[key] || import.meta.env[`VITE_${key}`] || fallback;
      }
    } catch (e) {
      // Fallback if import.meta not available
    }
    
    // Fallback to process.env for other bundlers
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key] || process.env[`REACT_APP_${key}`] || process.env[`VITE_${key}`] || fallback;
    }
    
    return fallback;
  } catch (error) {
    return fallback;
  }
};

// Safe console logging to prevent minification issues
const safeLog = {
  log: (message: string, ...args: any[]) => {
    try {
      if (typeof console !== 'undefined' && console.log) {
        console.log(message, ...args);
      }
    } catch (e) {
      // Silent fail in production
    }
  },
  warn: (message: string, ...args: any[]) => {
    try {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn(message, ...args);
      }
    } catch (e) {
      // Silent fail in production
    }
  },
  error: (message: string, ...args: any[]) => {
    try {
      if (typeof console !== 'undefined' && console.error) {
        console.error(message, ...args);
      }
    } catch (e) {
      // Silent fail in production
    }
  }
};

// Safe toast function to prevent dependency issues
const safeToast = {
  success: (message: string, options?: any) => {
    try {
      // Dynamic import to prevent build issues
      import('react-hot-toast').then(({ default: toast }) => {
        toast.success(message, options);
      }).catch(() => {
        safeLog.log('✅', message);
      });
    } catch (error) {
      safeLog.log('✅', message);
    }
  },
  error: (message: string, options?: any) => {
    try {
      import('react-hot-toast').then(({ default: toast }) => {
        toast.error(message, options);
      }).catch(() => {
        safeLog.error('❌', message);
      });
    } catch (error) {
      safeLog.error('❌', message);
    }
  },
  info: (message: string, options?: any) => {
    try {
      import('react-hot-toast').then(({ default: toast }) => {
        toast(message, options);
      }).catch(() => {
        safeLog.log('ℹ️', message);
      });
    } catch (error) {
      safeLog.log('ℹ️', message);
    }
  },
  loading: (message: string, options?: any) => {
    try {
      import('react-hot-toast').then(({ default: toast }) => {
        toast.loading(message, options);
      }).catch(() => {
        safeLog.log('⏳', message);
      });
    } catch (error) {
      safeLog.log('⏳', message);
    }
  }
};

// Interface for socket handlers (required by GameStore)
interface SocketHandlers {
  onGameJoined?: (data: any) => void;
  onGameUpdated?: (data: any) => void;
  onPlayerAction?: (data: any) => void;
  onError?: (error: any) => void;
  onDisconnect?: () => void;
  onConnect?: () => void;
  [key: string]: any; // Allow additional handlers
}

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;
  private joinAttempts = new Set<string>(); // Track join attempts to prevent duplicates
  private handlers: SocketHandlers = {}; // Store handlers for GameStore

  constructor() {
    // Initialize when needed
  }

  /**
   * REQUIRED METHOD: Initialize socket handlers (called by GameStore)
   * This fixes the "socketService does not have required methods" error
   */
  public initializeSocketHandlers(handlers: SocketHandlers): void {
    try {
      safeLog.log('🔧 Initializing socket handlers');
      this.handlers = { ...handlers };
      
      // Validate required handlers
      const requiredHandlers = ['onGameJoined', 'onGameUpdated', 'onError'];
      const missingHandlers = requiredHandlers.filter(handler => !handlers[handler]);
      
      if (missingHandlers.length > 0) {
        safeLog.warn('⚠️ Missing socket handlers:', missingHandlers);
      }
      
      // If socket is already connected, set up the event listeners
      if (this.socket?.connected) {
        this.setupEventListeners();
      }
    } catch (error) {
      safeLog.error('❌ Error initializing socket handlers:', error);
    }
  }

  /**
   * Get the correct API URL based on environment
   */
  private getApiUrl(): string {
    try {
      // Simple hostname detection for production
      const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
      
      // If we're on Vercel (production), use Railway backend
      if (hostname.includes('vercel.app') || hostname.includes('netlify.app')) {
        const prodUrl = 'https://levelup-robot-startup-deployment-production.up.railway.app';
        safeLog.log('🌐 Production detected, using Railway backend:', prodUrl);
        return prodUrl;
      }
      
      // If we're on localhost, use local backend
      if (hostname.includes('localhost') || hostname.includes('127.0.0.1') || hostname === '') {
        const devUrl = 'http://localhost:5000';
        safeLog.log('🛠️ Development detected, using local backend:', devUrl);
        return devUrl;
      }
      
      // Fallback: try environment variables
      const envUrl = getEnvVar('VITE_BACKEND_URL') || 
                    getEnvVar('REACT_APP_BACKEND_URL');
      
      if (envUrl) {
        safeLog.log('🔧 Using environment URL:', envUrl);
        return envUrl;
      }
      
      // Final fallback - assume production
      const finalUrl = 'https://levelup-robot-startup-deployment-production.up.railway.app';
      safeLog.warn('⚠️ Could not detect environment, defaulting to production:', finalUrl);
      return finalUrl;
      
    } catch (error) {
      safeLog.error('❌ Error getting API URL:', error);
      return 'https://levelup-robot-startup-deployment-production.up.railway.app';
    }
  }

  /**
   * Get optimized socket configuration based on environment
   */
  private getSocketConfig() {
    try {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
      const isProduction = hostname.includes('vercel.app') || hostname.includes('netlify.app');
      
      const config = {
        transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
        timeout: isProduction ? 20000 : 10000, // Longer timeout for production
        forceNew: false, // Prevent unnecessary reconnections
        reconnection: true,
        reconnectionAttempts: isProduction ? 10 : 5,
        reconnectionDelay: isProduction ? 2000 : 1000,
        reconnectionDelayMax: 5000,
        // Additional production optimizations
        ...(isProduction && {
          upgrade: true,
          rememberUpgrade: true,
          autoConnect: true
        })
      };
      
      safeLog.log('⚙️ Socket config for', isProduction ? 'production' : 'development', ':', config);
      return config;
    } catch (error) {
      safeLog.error('❌ Error getting socket config:', error);
      return {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5
      };
    }
  }

  /**
   * Connect to the game server with improved error handling
   */
  async connect(): Promise<void> {
    try {
      // If already connecting, return the existing promise
      if (this.connectionPromise) {
        return this.connectionPromise;
      }

      // If already connected, resolve immediately
      if (this.socket?.connected) {
        safeLog.log('Already connected to server');
        return Promise.resolve();
      }

      // Create new connection promise
      this.connectionPromise = this.createConnection();
      
      try {
        await this.connectionPromise;
      } finally {
        // Clear the promise when done (success or failure)
        this.connectionPromise = null;
      }
    } catch (error) {
      safeLog.error('❌ Connection failed:', error);
      throw error;
    }
  }

  private createConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.isConnecting) {
          resolve();
          return;
        }

        this.isConnecting = true;
        
        const apiUrl = this.getApiUrl();
        const socketConfig = this.getSocketConfig();
        
        safeLog.log('🔄 Creating socket connection to:', apiUrl);
        safeLog.log('⚙️ Socket configuration:', socketConfig);

        // Create socket with environment-aware settings
        this.socket = io(apiUrl, socketConfig);

        safeLog.log('📡 Socket created successfully');

        // Set connection timeout
        const nodeEnv = getEnvVar('NODE_ENV');
        const isProduction = nodeEnv === 'production';
        const timeoutMs = isProduction ? 25000 : 15000;
        
        const connectionTimeout = setTimeout(() => {
          if (this.isConnecting) {
            safeLog.log('⏰ Connection timeout after', timeoutMs, 'ms');
            this.isConnecting = false;
            if (this.socket) {
              this.socket.disconnect();
              this.socket = null;
            }
            reject(new Error(`Connection timeout after ${timeoutMs}ms`));
          }
        }, timeoutMs);

        // Handle successful connection
        this.socket.once('connect', () => {
          safeLog.log('✅ Connected! Socket ID:', this.socket?.id);
          safeLog.log('🌐 Connected to:', apiUrl);
          clearTimeout(connectionTimeout);
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.joinAttempts.clear(); // Clear join attempts on new connection
          
          // Set up all event listeners
          this.setupEventListeners();
          
          // Notify handlers
          if (this.handlers.onConnect) {
            this.handlers.onConnect();
          }
          
          // Notify game store
          this.notifyConnectionStatus(true);
          
          resolve();
        });

        // Handle connection errors
        this.socket.once('connect_error', (error) => {
          safeLog.error('❌ Connection error to', apiUrl, ':', error.message);
          clearTimeout(connectionTimeout);
          this.isConnecting = false;
          
          // Notify handlers
          if (this.handlers.onError) {
            this.handlers.onError(error);
          }
          
          this.notifyConnectionStatus(false);
          
          // Provide helpful error message based on environment
          const nodeEnv = getEnvVar('NODE_ENV');
          const isProduction = nodeEnv === 'production';
          
          if (isProduction) {
            safeToast.error('Unable to connect to game server. Please check your internet connection.');
          } else {
            safeToast.error('Backend server not running. Start with: npm run dev');
          }
          
          reject(error);
        });

      } catch (error) {
        safeLog.error('💥 Exception during socket creation:', error);
        this.isConnecting = false;
        this.notifyConnectionStatus(false);
        reject(error);
      }
    });
  }

  /**
   * Notify game store of connection status
   */
  private async notifyConnectionStatus(connected: boolean) {
    try {
      const { useGameStore } = await import('../store/GameStore');
      const store = useGameStore.getState();
      if (store && typeof store.setConnectionStatus === 'function') {
        store.setConnectionStatus(connected);
      }
    } catch (error) {
      safeLog.error('Failed to notify connection status:', error);
    }
  }

  /**
   * Set up all the event listeners
   */
  private setupEventListeners() {
    if (!this.socket) return;

    safeLog.log('🔧 Setting up socket event listeners');

    // Connection management events
    this.socket.on('disconnect', (reason) => {
      safeLog.log('🔌 Disconnected:', reason);
      this.notifyConnectionStatus(false);
      this.joinAttempts.clear(); // Clear join attempts on disconnect
      
      // Notify handlers
      if (this.handlers.onDisconnect) {
        this.handlers.onDisconnect();
      }
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        safeToast.error('Server disconnected. Attempting to reconnect...');
        setTimeout(() => this.connect(), 2000);
      }
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      safeLog.log(`🔄 Reconnection attempt ${attemptNumber}`);
      this.reconnectAttempts = attemptNumber;
      
      if (attemptNumber === 1) {
        safeToast.loading('Reconnecting to server...', { id: 'reconnect' });
      }
    });

    this.socket.on('reconnect', () => {
      safeLog.log('✅ Successfully reconnected to server');
      safeToast.success('Reconnected to server!', { id: 'reconnect' });
      this.reconnectAttempts = 0;
      this.joinAttempts.clear(); // Clear join attempts on reconnect
      this.notifyConnectionStatus(true);
	  
	  // AUTO-REJOIN GAME AFTER RECONNECTION
	  this.rejoinCurrentGame();
    });

    this.socket.on('reconnect_failed', () => {
      safeLog.log('❌ Failed to reconnect to server');
      safeToast.error('Could not reconnect to server', { id: 'reconnect' });
      this.notifyConnectionStatus(false);
    });

    // Game-specific events
    this.setupGameEventListeners();
  }

  /**
   * Set up listeners for game-specific events
   */
  private setupGameEventListeners() {
    if (!this.socket) return;

    // Game state updates
    this.socket.on('game-updated', (gameState) => {
      safeLog.log('🎮 Game state updated:', gameState.id);
      this.updateGameStore('setCurrentGame', gameState);
      
      // Notify handlers
      if (this.handlers.onGameUpdated) {
        this.handlers.onGameUpdated(gameState);
      }
    });

    // Player management
    this.socket.on('player-joined', (data) => {
      const { player, gameState } = data;
      safeLog.log('👤 Player joined:', player.name);
      safeToast.success(`${player.name} joined the game!`);
      this.updateGameStore('setCurrentGame', gameState);
    });

    this.socket.on('player-left', (data) => {
      const { player, gameState } = data;
      safeLog.log('👋 Player left:', player.name);
      safeToast.info(`${player.name} left the game`);
      this.updateGameStore('setCurrentGame', gameState);
    });

    // Join game responses - FIXED event names to match backend
    this.socket.on('join-game-success', (data) => {
      safeLog.log('🎮 Join success:', data);
      
      if (data.gameState && data.playerId) {
        this.updateGameStore('setCurrentGame', data.gameState);
        this.updateGameStore('setCurrentPlayer', data.playerId);
        this.updateGameStore('setLoading', false);
        safeToast.success('Successfully joined game!');
        
        // Notify handlers
        if (this.handlers.onGameJoined) {
          this.handlers.onGameJoined(data);
        }
      }
    });

    this.socket.on('join-game-error', (data) => {
      safeLog.error('❌ Join failed:', data.message);
      this.updateGameStore('setLoading', false);
      safeToast.error(data.message || 'Failed to join game');
      
      // Notify handlers
      if (this.handlers.onError) {
        this.handlers.onError(new Error(data.message || 'Failed to join game'));
      }
    });

    // Move handling
    this.socket.on('move-success', (data) => {
      safeLog.log('✅ Move successful:', data);
      this.updateGameStore('setProcessingMove', false);
      this.updateGameStore('setPendingMove', null);
      
      if (data.gameState) {
        this.updateGameStore('setCurrentGame', data.gameState);
      }
      
      if (data.moveResult?.message) {
        safeToast.success(data.moveResult.message);
      }
      
      // Notify handlers
      if (this.handlers.onPlayerAction) {
        this.handlers.onPlayerAction(data);
      }
    });

    this.socket.on('move-error', (data) => {
      safeLog.log('❌ Move failed:', data.message);
      this.updateGameStore('setProcessingMove', false);
      this.updateGameStore('setPendingMove', null);
      safeToast.error(data.message || 'Move failed');
      
      // Notify handlers
      if (this.handlers.onError) {
        this.handlers.onError(new Error(data.message || 'Move failed'));
      }
    });

    // AI interactions
    this.socket.on('ai-tutoring', (response) => {
      safeLog.log('🤖 AI tutoring received:', response);
      this.updateGameStore('setAITutoring', response);
      safeToast.success('AI tutor explanation ready!');
    });

    this.socket.on('ai-event', (aiEvent) => {
      safeLog.log('🤖 AI event received:', aiEvent);
      safeToast.success(`Market Update: ${aiEvent.title}`);
      
      if (aiEvent.impact?.significance === 'high') {
        this.showImportantEvent(aiEvent);
      }
    });

    // Game completion
    this.socket.on('game-finished', (data) => {
      const { winner, finalScores } = data;
      safeLog.log('🏁 Game finished. Winner:', winner?.name);
      
      this.checkGameWinner(winner);
    });

    // Error handling
    this.socket.on('error', (data) => {
      safeLog.error('🚨 Server error:', data.message);
      safeToast.error(data.message || 'Server error occurred');
      
      // Notify handlers
      if (this.handlers.onError) {
        this.handlers.onError(new Error(data.message || 'Server error occurred'));
      }
    });

    // Connection confirmation
    this.socket.on('connected', (data) => {
      safeLog.log('🔗 Server confirmed connection:', data);
    });
  }

  /**
   * Helper to update game store safely
   */
  private async updateGameStore(method: string, data: any) {
    try {
      const { useGameStore } = await import('../store/GameStore');
      const store = useGameStore.getState();
      
      if (store && typeof store[method as keyof typeof store] === 'function') {
        (store[method as keyof typeof store] as Function)(data);
      }
    } catch (error) {
      safeLog.error(`Failed to update game store (${method}):`, error);
    }
  }

  /**
   * Join a game session - FIXED with duplicate prevention
   */
  joinGame(gameId: string, playerName: string, playerType: 'human' | 'ai' = 'human') {
    try {
      if (!this.socket?.connected) {
        safeLog.error('Cannot join game - not connected to server');
        safeToast.error('Not connected to server. Trying to reconnect...');
        
        // Try to reconnect and then join
        this.connect().then(() => {
          if (this.socket?.connected) {
            this.joinGame(gameId, playerName, playerType);
          }
        }).catch(error => {
          safeLog.error('Reconnection failed:', error);
          safeToast.error('Failed to connect to server');
        });
        return;
      }

      // CRITICAL FIX: Prevent duplicate join attempts
      const joinKey = `${gameId}-${playerName}`;
      if (this.joinAttempts.has(joinKey)) {
        safeLog.log('🚫 Duplicate join attempt prevented for:', joinKey);
        return;
      }

      safeLog.log('🎮 Joining game:', gameId, 'as', playerName);
      
      // Track this join attempt
      this.joinAttempts.add(joinKey);
      
      // Clear the join attempt after 5 seconds to allow retry if needed
      setTimeout(() => {
        this.joinAttempts.delete(joinKey);
      }, 5000);
      
      this.socket.emit('join-game', {
        gameId,
        playerName: playerName.trim(),
        playerType
      });
    } catch (error) {
      safeLog.error('❌ Error joining game:', error);
      safeToast.error('Failed to join game');
    }
  }

  /**
   * Make a move in the game
   */
  makeMove(gameId: string, move: any) {
    try {
      if (!this.socket?.connected) {
        safeLog.error('Cannot make move - not connected to server');
        safeToast.error('Not connected to server');
        return;
      }

      if (!gameId || !move) {
        safeLog.error('Invalid move data:', { gameId, move });
        safeToast.error('Invalid move data');
        return;
      }

      safeLog.log('🎯 Making move:', move);
      
      this.socket.emit('player-move', {
        gameId,
        move
      });
    } catch (error) {
      safeLog.error('❌ Error making move:', error);
      safeToast.error('Failed to make move');
    }
  }

  /**
   * Event listener management (Socket.IO style interface for GameStore compatibility)
   */
  on(event: string, callback: Function) {
    try {
      if (!this.socket) {
        safeLog.warn('⚠️ Cannot add listener - socket not connected');
        return;
      }
      
      safeLog.log(`📡 Adding listener for event: ${event}`);
      this.socket.on(event, callback);
    } catch (error) {
      safeLog.error('❌ Error adding event listener:', error);
    }
  }

  /**
   * Remove event listener (Socket.IO style interface)
   */
  off(event: string, callback?: Function) {
    try {
      if (!this.socket) {
        safeLog.warn('⚠️ Cannot remove listener - socket not connected');
        return;
      }
      
      safeLog.log(`📡 Removing listener for event: ${event}`);
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    } catch (error) {
      safeLog.error('❌ Error removing event listener:', error);
    }
  }

	/**
	* Request AI help with phase-specific context
	*/
  requestHelp(gameId: string, concept: string, context?: any) {
    try {
      if (!this.socket?.connected) {
        safeLog.error('Cannot request help - not connected to server');
        safeToast.error('Not connected to server');
        return;
      }

      safeLog.log('🤖 Requesting AI help for concept:', concept);
      safeLog.log('📋 With context:', {
        phase: context?.currentPhase,
        hasSpecificContext: !!context?.specificContext,
        cash: context?.playerCash,
        round: context?.round
	  });
	  
	  // Log specific phase details if available
	  if (context?.specificContext) {
        safeLog.log('🎯 Phase-specific data:', {
          phase: context.currentPhase,
          keys: Object.keys(context.specificContext),
          ...context.specificContext
        });
      }
	  
      this.socket.emit('request-help', {
        gameId,
        concept,
        context // Full context including specificContext
      });
    } catch (error) {
      safeLog.error('❌ Error requesting help:', error);
      safeToast.error('Failed to request help');
    }
  }

  /**
   * FIXED: Added missing isConnected method
   * Check if socket is currently connected
   */
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get our socket ID
   */
  getSocketId(): string | null {
    try {
      return this.socket?.id || null;
    } catch (error) {
      return null;
    }
  }
  
  /**
 * Rejoin current game after reconnection
 */
  private async rejoinCurrentGame() {
    try {
	  const { useGameStore } = await import('../store/GameStore');
	  const store = useGameStore.getState();
	  const currentGame = store.currentGame;
	
	  if (currentGame && currentGame.id) {
	    const playerName = localStorage.getItem('playerName') || 'Player';
	    safeLog.log('🔄 Auto-rejoining game after reconnection:', currentGame.id);
	  
	  // Clear the join attempt tracking to allow rejoin
	    const joinKey = `${currentGame.id}-${playerName}`;
	    this.joinAttempts.delete(joinKey);
	  
	  // Rejoin the game
	    this.joinGame(currentGame.id, playerName, 'human');
	  }
	} catch (error) {
	  safeLog.error('Failed to auto-rejoin game:', error);
	}
  }
  
  
  /**
 * Leave a game
 */
  leaveGame(gameId: string) {
	try {
	  if (!this.socket?.connected) {
		safeLog.warn('Cannot leave game - not connected to server');
		return;
	  }

	  safeLog.log('👋 Leaving game:', gameId);
		
	  this.socket.emit('leave-game', {
		  gameId
	  });
	} catch (error) {
	  safeLog.error('❌ Error leaving game:', error);
	}
  }



  /**
   * Disconnect from the server
   */
  disconnect() {
    try {
      if (this.socket) {
        safeLog.log('🔌 Disconnecting from server');
        this.socket.disconnect();
        this.socket = null;
      }
      
      this.isConnecting = false;
      this.connectionPromise = null;
      this.joinAttempts.clear();
      this.handlers = {};
      this.notifyConnectionStatus(false);
    } catch (error) {
      safeLog.error('❌ Error disconnecting:', error);
    }
  }

  /**
   * Show important events with special UI
   */
  private showImportantEvent(event: any) {
    try {
      safeToast.success(
        `🚨 Important: ${event.title}`,
        {
          duration: 8000,
          style: {
            background: '#fee2e2',
            color: '#991b1b',
            border: '2px solid #fca5a5',
            fontSize: '16px',
            fontWeight: 'bold'
          }
        }
      );
    } catch (error) {
      safeLog.log('🚨 Important event:', event.title);
    }
  }

  /**
   * Get connection status for debugging
   */
  getConnectionStatus() {
    try {
      return {
        connected: this.isConnected(),
        connecting: this.isConnecting,
        socketId: this.getSocketId(),
        reconnectAttempts: this.reconnectAttempts,
        apiUrl: this.getApiUrl(),
        environment: getEnvVar('NODE_ENV') || getEnvVar('MODE') || 'development',
        isProduction: getEnvVar('NODE_ENV') === 'production',
        joinAttempts: Array.from(this.joinAttempts),
        hasHandlers: Object.keys(this.handlers).length > 0,
        availableMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(this))
      };
    } catch (error) {
      safeLog.error('❌ Error getting connection status:', error);
      return {
        connected: false,
        connecting: false,
        socketId: null,
        reconnectAttempts: 0,
        apiUrl: 'unknown',
        environment: 'unknown',
        isProduction: false,
        joinAttempts: [],
        hasHandlers: false,
        availableMethods: []
      };
    }
  }

  /**
   * Debug method to verify available methods
   */
  verifyMethods() {
    const requiredMethods = ['initializeSocketHandlers', 'connect', 'joinGame', 'makeMove', 'isConnected'];
    const available: any = {};
    
    requiredMethods.forEach(method => {
      available[method] = typeof this[method as keyof this] === 'function';
    });
    
    safeLog.log('🔍 SocketService method verification:', available);
    return available;
  }

  // Additional helper methods...
  private async checkIfMyTurn(activePlayerId: string) {
    try {
      const { useGameStore } = await import('../store/GameStore');
      const store = useGameStore.getState();
      if (store && typeof store.getMyPlayer === 'function') {
        const myPlayer = store.getMyPlayer();
        
        if (myPlayer && activePlayerId === myPlayer.id) {
          safeToast.success("It's your turn! Make your move.");
        }
      }
    } catch (error) {
      safeLog.error('Failed to check turn status:', error);
    }
  }

  private async checkGameWinner(winner: any) {
    try {
      const { useGameStore } = await import('../store/GameStore');
      const store = useGameStore.getState();
      if (store && typeof store.getMyPlayer === 'function') {
        const myPlayer = store.getMyPlayer();
        
        if (winner && myPlayer) {
          if (winner.id === myPlayer.id) {
            safeToast.success('🎉 Congratulations! You won the game!');
          } else {
            safeToast.success(`Game finished! ${winner.name} won this round.`);
          }
        }
      }
    } catch (error) {
      safeLog.error('Failed to check winner:', error);
    }
  }
}

// Create a single instance to use throughout the app
const socketServiceInstance = new SocketService();

// Create a wrapper object with explicitly bound methods to prevent context loss in production
const socketService = {
  initializeSocketHandlers: (handlers: SocketHandlers) => {
    safeLog.log('🔧 initializeSocketHandlers called with:', Object.keys(handlers));
    return socketServiceInstance.initializeSocketHandlers.call(socketServiceInstance, handlers);
  },
  connect: () => socketServiceInstance.connect.call(socketServiceInstance),
  joinGame: (gameId: string, playerName: string, playerType?: 'human' | 'ai') => 
    socketServiceInstance.joinGame.call(socketServiceInstance, gameId, playerName, playerType),
  makeMove: (gameId: string, move: any) => 
    socketServiceInstance.makeMove.call(socketServiceInstance, gameId, move),
  isConnected: () => socketServiceInstance.isConnected.call(socketServiceInstance),
  getSocketId: () => socketServiceInstance.getSocketId.call(socketServiceInstance),
  disconnect: () => socketServiceInstance.disconnect.call(socketServiceInstance),
  getConnectionStatus: () => socketServiceInstance.getConnectionStatus.call(socketServiceInstance),
  verifyMethods: () => socketServiceInstance.verifyMethods.call(socketServiceInstance),
  on: (event: string, callback: Function) => 
    socketServiceInstance.on.call(socketServiceInstance, event, callback),
  off: (event: string, callback?: Function) => 
    socketServiceInstance.off.call(socketServiceInstance, event, callback),
  requestHelp: (gameId: string, concept: string, context?: any) =>
    socketServiceInstance.requestHelp.call(socketServiceInstance, gameId, concept, context),
  leaveGame: (gameId: string) => 
    socketServiceInstance.leaveGame.call(socketServiceInstance, gameId),
  // Debug method to check if all methods are working
  debugMethods: () => {
    const methods = {
      initializeSocketHandlers: typeof socketService.initializeSocketHandlers,
      connect: typeof socketService.connect,
      joinGame: typeof socketService.joinGame,
      makeMove: typeof socketService.makeMove,
      isConnected: typeof socketService.isConnected,
      on: typeof socketService.on,
      off: typeof socketService.off,
      requestHelp: typeof socketService.requestHelp,
	  leaveGame: typeof socketService.leaveGame
    };
    safeLog.log('🔍 SocketService method check:', methods);
    return methods;
  }
};

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).__SOCKET_SERVICE_DEBUG__ = socketService;
  (window as any).__SOCKET_INSTANCE__ = socketServiceInstance;
  
  safeLog.log('🔍 SocketService wrapper created. Available methods:', Object.keys(socketService));
  
  // Immediate method verification
  socketService.debugMethods();
}

export { socketService };

// Ensure the socketService is the default export as well
export default socketService;

/**
 * Auto-connect when the service is imported (with delay for production)
 */
if (typeof window !== 'undefined') {
  // Only auto-connect in browser environment
  const hostname = window.location.hostname;
  const isProduction = hostname.includes('vercel.app') || hostname.includes('netlify.app');
  const delay = isProduction ? 500 : 100; // Longer delay in production
  
  safeLog.log('🚀 Auto-connecting SocketService in', isProduction ? 'production' : 'development', 'with', delay + 'ms delay');
  
  setTimeout(() => {
    socketServiceInstance.connect().catch(error => {
      safeLog.log('Initial connection failed - will retry when needed:', error.message);
    });
  }, delay);
}