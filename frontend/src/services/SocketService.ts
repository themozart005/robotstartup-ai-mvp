// frontend/src/services/SocketService.ts
// PRODUCTION-READY VERSION - Simple and reliable for deployment

import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';

// Simple production detection
const isProduction = () => {
  return window.location.hostname !== 'localhost' && 
         window.location.hostname !== '127.0.0.1' &&
         !window.location.hostname.includes('localhost');
};

// Get API URL with hardcoded fallback for production
const getApiUrl = (): string => {
  if (isProduction()) {
    // REPLACE THIS WITH YOUR ACTUAL RAILWAY URL
    return 'https://levelup-robot-startup-deployment-production.up.railway.app';
  } else {
    // Development
    return 'http://localhost:5000';
  }
};

// Safe console logging
const safeLog = {
  log: (message: string, ...args: any[]) => {
    try {
      console.log(message, ...args);
    } catch (e) {
      // Silent fail
    }
  },
  warn: (message: string, ...args: any[]) => {
    try {
      console.warn(message, ...args);
    } catch (e) {
      // Silent fail
    }
  },
  error: (message: string, ...args: any[]) => {
    try {
      console.error(message, ...args);
    } catch (e) {
      // Silent fail
    }
  }
};

// Safe toast function
const safeToast = {
  success: (message: string, options?: any) => {
    try {
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
  [key: string]: any;
}

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;
  private joinAttempts = new Set<string>();
  private handlers: SocketHandlers = {};

  constructor() {
    // Initialize when needed
  }

  /**
   * REQUIRED METHOD: Initialize socket handlers (called by GameStore)
   */
  public initializeSocketHandlers(handlers: SocketHandlers): void {
    try {
      safeLog.log('🔧 Initializing socket handlers');
      this.handlers = { ...handlers };
      
      // If socket is already connected, set up the event listeners
      if (this.socket?.connected) {
        this.setupEventListeners();
      }
    } catch (error) {
      safeLog.error('❌ Error initializing socket handlers:', error);
    }
  }

  /**
   * Connect to the game server
   */
  async connect(): Promise<void> {
    try {
      if (this.connectionPromise) {
        return this.connectionPromise;
      }

      if (this.socket?.connected) {
        safeLog.log('Already connected to server');
        return Promise.resolve();
      }

      this.connectionPromise = this.createConnection();
      
      try {
        await this.connectionPromise;
      } finally {
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
        
        const apiUrl = getApiUrl();
        const isProd = isProduction();
        
        safeLog.log('🔄 Creating socket connection to:', apiUrl);
        safeLog.log('🌍 Environment:', isProd ? 'Production' : 'Development');

        // Create socket with production-ready settings
        this.socket = io(apiUrl, {
          transports: ['websocket', 'polling'],
          timeout: isProd ? 20000 : 10000,
          forceNew: false,
          reconnection: true,
          reconnectionAttempts: isProd ? 10 : 5,
          reconnectionDelay: isProd ? 2000 : 1000,
          reconnectionDelayMax: 5000,
          upgrade: true,
          rememberUpgrade: true,
          autoConnect: true
        });

        safeLog.log('📡 Socket created successfully');

        const timeoutMs = isProd ? 25000 : 15000;
        
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
          this.joinAttempts.clear();
          
          this.setupEventListeners();
          
          if (this.handlers.onConnect) {
            this.handlers.onConnect();
          }
          
          this.notifyConnectionStatus(true);
          
          resolve();
        });

        // Handle connection errors
        this.socket.once('connect_error', (error) => {
          safeLog.error('❌ Connection error to', apiUrl, ':', error.message);
          clearTimeout(connectionTimeout);
          this.isConnecting = false;
          
          if (this.handlers.onError) {
            this.handlers.onError(error);
          }
          
          this.notifyConnectionStatus(false);
          
          if (isProd) {
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
      this.joinAttempts.clear();
      
      if (this.handlers.onDisconnect) {
        this.handlers.onDisconnect();
      }
      
      if (reason === 'io server disconnect') {
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
      this.joinAttempts.clear();
      this.notifyConnectionStatus(true);
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

    // Join game responses
    this.socket.on('join-game-success', (data) => {
      safeLog.log('🎮 Join success:', data);
      
      if (data.gameState && data.playerId) {
        this.updateGameStore('setCurrentGame', data.gameState);
        this.updateGameStore('setCurrentPlayer', data.playerId);
        this.updateGameStore('setLoading', false);
        safeToast.success('Successfully joined game!');
        
        if (this.handlers.onGameJoined) {
          this.handlers.onGameJoined(data);
        }
      }
    });

    this.socket.on('join-game-error', (data) => {
      safeLog.error('❌ Join failed:', data.message);
      this.updateGameStore('setLoading', false);
      safeToast.error(data.message || 'Failed to join game');
      
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
      
      if (this.handlers.onPlayerAction) {
        this.handlers.onPlayerAction(data);
      }
    });

    this.socket.on('move-error', (data) => {
      safeLog.log('❌ Move failed:', data.message);
      this.updateGameStore('setProcessingMove', false);
      this.updateGameStore('setPendingMove', null);
      safeToast.error(data.message || 'Move failed');
      
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
   * Join a game session
   */
  joinGame(gameId: string, playerName: string, playerType: 'human' | 'ai' = 'human') {
    try {
      if (!this.socket?.connected) {
        safeLog.error('Cannot join game - not connected to server');
        safeToast.error('Not connected to server. Trying to reconnect...');
        
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

      const joinKey = `${gameId}-${playerName}`;
      if (this.joinAttempts.has(joinKey)) {
        safeLog.log('🚫 Duplicate join attempt prevented for:', joinKey);
        return;
      }

      safeLog.log('🎮 Joining game:', gameId, 'as', playerName);
      
      this.joinAttempts.add(joinKey);
      
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
   * Check if we're connected to the server
   */
  isConnected(): boolean {
    try {
      return this.socket?.connected || false;
    } catch (error) {
      return false;
    }
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
        apiUrl: getApiUrl(),
        environment: isProduction() ? 'production' : 'development',
        isProduction: isProduction(),
        joinAttempts: Array.from(this.joinAttempts),
        hasHandlers: Object.keys(this.handlers).length > 0
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
        hasHandlers: false
      };
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
export const socketService = new SocketService();

/**
 * Auto-connect when the service is imported
 */
if (typeof window !== 'undefined') {
  const delay = isProduction() ? 500 : 100;
  
  setTimeout(() => {
    socketService.connect().catch(error => {
      safeLog.log('Initial connection failed - will retry when needed:', error.message);
    });
  }, delay);
}

export default socketService;