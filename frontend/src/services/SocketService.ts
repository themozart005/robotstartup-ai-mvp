// frontend/src/services/SocketService.ts
// PRODUCTION-READY VERSION - Fixed for Vercel + Railway deployment

import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;
  private joinAttempts = new Set<string>(); // Track join attempts to prevent duplicates

  constructor() {
    // Initialize when needed
  }

  /**
   * Get the correct API URL based on environment
   */
  private getApiUrl(): string {
    // Production environment (deployed)
    if (import.meta.env.PROD || import.meta.env.NODE_ENV === 'production') {
      // Try VITE_BACKEND_URL first, then VITE_API_URL
      const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL;
      if (!backendUrl) {
        console.warn('⚠️ VITE_BACKEND_URL not set in production, using fallback');
        // You'll need to replace this with your actual Railway URL
        return 'https://levelup-robot-startup-deployment-production.up.railway.app';
      }
      console.log('🌐 Using production API URL:', backendUrl);
      return backendUrl;
    }
    
    // Development environment (local)
    console.log('🛠️ Using development API URL: http://localhost:5000');
    return 'http://localhost:5000';
  }

  /**
   * Get optimized socket configuration based on environment
   */
  private getSocketConfig() {
    const isProduction = import.meta.env.PROD || import.meta.env.NODE_ENV === 'production';
    
    return {
      transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
      timeout: isProduction ? 20000 : 10000, // Longer timeout for production
      forceNew: false, // Changed from true to prevent unnecessary reconnections
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
  }

  /**
   * Connect to the game server with improved error handling
   */
  async connect(): Promise<void> {
    // If already connecting, return the existing promise
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // If already connected, resolve immediately
    if (this.socket?.connected) {
      console.log('Already connected to server');
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
  }

  private createConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting) {
        resolve();
        return;
      }

      this.isConnecting = true;
      
      const apiUrl = this.getApiUrl();
      const socketConfig = this.getSocketConfig();
      
      console.log('🔄 Creating socket connection to:', apiUrl);
      console.log('⚙️ Socket configuration:', socketConfig);

      try {
        // Create socket with environment-aware settings
        this.socket = io(apiUrl, socketConfig);

        console.log('📡 Socket created successfully');

        // Set connection timeout (longer for production)
        const timeoutMs = import.meta.env.PROD ? 25000 : 15000;
        const connectionTimeout = setTimeout(() => {
          if (this.isConnecting) {
            console.log('⏰ Connection timeout after', timeoutMs, 'ms');
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
          console.log('✅ Connected! Socket ID:', this.socket?.id);
          console.log('🌐 Connected to:', apiUrl);
          clearTimeout(connectionTimeout);
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.joinAttempts.clear(); // Clear join attempts on new connection
          
          // Set up all event listeners
          this.setupEventListeners();
          
          // Notify game store
          this.notifyConnectionStatus(true);
          
          resolve();
        });

        // Handle connection errors
        this.socket.once('connect_error', (error) => {
          console.error('❌ Connection error to', apiUrl, ':', error.message);
          clearTimeout(connectionTimeout);
          this.isConnecting = false;
          this.notifyConnectionStatus(false);
          
          // Provide helpful error message based on environment
          if (import.meta.env.PROD) {
            toast.error('Unable to connect to game server. Please check your internet connection.');
          } else {
            toast.error('Backend server not running. Start with: npm run dev');
          }
          
          reject(error);
        });

      } catch (error) {
        console.error('💥 Exception during socket creation:', error);
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
      useGameStore.getState().setConnectionStatus(connected);
    } catch (error) {
      console.error('Failed to notify connection status:', error);
    }
  }

  /**
   * Set up all the event listeners
   */
  private setupEventListeners() {
    if (!this.socket) return;

    console.log('🔧 Setting up socket event listeners');

    // Connection management events
    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected:', reason);
      this.notifyConnectionStatus(false);
      this.joinAttempts.clear(); // Clear join attempts on disconnect
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        toast.error('Server disconnected. Attempting to reconnect...');
        setTimeout(() => this.connect(), 2000);
      }
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}`);
      this.reconnectAttempts = attemptNumber;
      
      if (attemptNumber === 1) {
        toast.loading('Reconnecting to server...', { id: 'reconnect' });
      }
    });

    this.socket.on('reconnect', () => {
      console.log('✅ Successfully reconnected to server');
      toast.success('Reconnected to server!', { id: 'reconnect' });
      this.reconnectAttempts = 0;
      this.joinAttempts.clear(); // Clear join attempts on reconnect
      this.notifyConnectionStatus(true);
    });

    this.socket.on('reconnect_failed', () => {
      console.log('❌ Failed to reconnect to server');
      toast.error('Could not reconnect to server', { id: 'reconnect' });
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
      console.log('🎮 Game state updated:', gameState.id);
      this.updateGameStore('setCurrentGame', gameState);
    });

    // Player management
    this.socket.on('player-joined', (data) => {
      const { player, gameState } = data;
      console.log('👤 Player joined:', player.name);
      toast.success(`${player.name} joined the game!`);
      this.updateGameStore('setCurrentGame', gameState);
    });

    this.socket.on('player-left', (data) => {
      const { player, gameState } = data;
      console.log('👋 Player left:', player.name);
      toast.info(`${player.name} left the game`);
      this.updateGameStore('setCurrentGame', gameState);
    });

    // Join game responses - FIXED event names to match backend
    this.socket.on('join-success', (data) => {
      console.log('🎮 Join success:', data);
      
      if (data.gameState && data.playerId) {
        this.updateGameStore('setCurrentGame', data.gameState);
        this.updateGameStore('setCurrentPlayer', data.playerId);
        this.updateGameStore('setLoading', false);
        toast.success('Successfully joined game!');
      }
    });

    this.socket.on('join-error', (data) => {
      console.error('❌ Join failed:', data.message);
      this.updateGameStore('setLoading', false);
      toast.error(data.message || 'Failed to join game');
    });

    // Move handling
    this.socket.on('move-success', (data) => {
      console.log('✅ Move successful:', data);
      this.updateGameStore('setProcessingMove', false);
      this.updateGameStore('setPendingMove', null);
      
      if (data.gameState) {
        this.updateGameStore('setCurrentGame', data.gameState);
      }
      
      if (data.moveResult?.message) {
        toast.success(data.moveResult.message);
      }
    });

    this.socket.on('move-error', (data) => {
      console.log('❌ Move failed:', data.message);
      this.updateGameStore('setProcessingMove', false);
      this.updateGameStore('setPendingMove', null);
      toast.error(data.message || 'Move failed');
    });

    // AI interactions
    this.socket.on('ai-tutoring', (response) => {
      console.log('🤖 AI tutoring received:', response);
      this.updateGameStore('setAITutoring', response);
      toast.success('AI tutor explanation ready!');
    });

    this.socket.on('ai-event', (aiEvent) => {
      console.log('🤖 AI event received:', aiEvent);
      toast.success(`Market Update: ${aiEvent.title}`);
      
      if (aiEvent.impact?.significance === 'high') {
        this.showImportantEvent(aiEvent);
      }
    });

    // Game completion
    this.socket.on('game-finished', (data) => {
      const { winner, finalScores } = data;
      console.log('🏁 Game finished. Winner:', winner?.name);
      
      this.checkGameWinner(winner);
    });

    // Error handling
    this.socket.on('error', (data) => {
      console.error('🚨 Server error:', data.message);
      toast.error(data.message || 'Server error occurred');
    });

    // Connection confirmation
    this.socket.on('connected', (data) => {
      console.log('🔗 Server confirmed connection:', data);
    });
  }

  /**
   * Helper to update game store safely
   */
  private async updateGameStore(method: string, data: any) {
    try {
      const { useGameStore } = await import('../store/GameStore');
      const store = useGameStore.getState();
      
      if (typeof store[method as keyof typeof store] === 'function') {
        (store[method as keyof typeof store] as Function)(data);
      }
    } catch (error) {
      console.error(`Failed to update game store (${method}):`, error);
    }
  }

  /**
   * Join a game session - FIXED with duplicate prevention
   */
  joinGame(gameId: string, playerName: string, playerType: 'human' | 'ai' = 'human') {
    if (!this.socket?.connected) {
      console.error('Cannot join game - not connected to server');
      toast.error('Not connected to server. Trying to reconnect...');
      
      // Try to reconnect and then join
      this.connect().then(() => {
        if (this.socket?.connected) {
          this.joinGame(gameId, playerName, playerType);
        }
      }).catch(error => {
        console.error('Reconnection failed:', error);
        toast.error('Failed to connect to server');
      });
      return;
    }

    // CRITICAL FIX: Prevent duplicate join attempts
    const joinKey = `${gameId}-${playerName}`;
    if (this.joinAttempts.has(joinKey)) {
      console.log('🚫 Duplicate join attempt prevented for:', joinKey);
      return;
    }

    console.log('🎮 Joining game:', gameId, 'as', playerName);
    
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
  }

  /**
   * Make a move in the game
   */
  makeMove(gameId: string, move: any) {
    if (!this.socket?.connected) {
      console.error('Cannot make move - not connected to server');
      toast.error('Not connected to server');
      return;
    }

    if (!gameId || !move) {
      console.error('Invalid move data:', { gameId, move });
      toast.error('Invalid move data');
      return;
    }

    console.log('🎯 Making move:', move);
    
    this.socket.emit('player-move', {
      gameId,
      move
    });
  }

  /**
   * Check if we're connected to the server
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get our socket ID
   */
  getSocketId(): string | null {
    return this.socket?.id || null;
  }

  /**
   * Disconnect from the server
   */
  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting from server');
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnecting = false;
    this.connectionPromise = null;
    this.joinAttempts.clear();
    this.notifyConnectionStatus(false);
  }

  /**
   * Show important events with special UI
   */
  private showImportantEvent(event: any) {
    toast.success(
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
  }

  /**
   * Get connection status for debugging
   */
  getConnectionStatus() {
    return {
      connected: this.isConnected(),
      connecting: this.isConnecting,
      socketId: this.getSocketId(),
      reconnectAttempts: this.reconnectAttempts,
      apiUrl: this.getApiUrl(),
      environment: import.meta.env.MODE,
      isProduction: import.meta.env.PROD,
      joinAttempts: Array.from(this.joinAttempts)
    };
  }

  // Additional helper methods...
  private async checkIfMyTurn(activePlayerId: string) {
    try {
      const { useGameStore } = await import('../store/GameStore');
      const myPlayer = useGameStore.getState().getMyPlayer();
      
      if (myPlayer && activePlayerId === myPlayer.id) {
        toast.success("It's your turn! Make your move.");
      }
    } catch (error) {
      console.error('Failed to check turn status:', error);
    }
  }

  private async checkGameWinner(winner: any) {
    try {
      const { useGameStore } = await import('../store/GameStore');
      const myPlayer = useGameStore.getState().getMyPlayer();
      
      if (winner && myPlayer) {
        if (winner.id === myPlayer.id) {
          toast.success('🎉 Congratulations! You won the game!');
        } else {
          toast.success(`Game finished! ${winner.name} won this round.`);
        }
      }
    } catch (error) {
      console.error('Failed to check winner:', error);
    }
  }
}

// Create a single instance to use throughout the app
export const socketService = new SocketService();

/**
 * Auto-connect when the service is imported (with delay for production)
 */
if (typeof window !== 'undefined') {
  // Only auto-connect in browser environment
  const delay = import.meta.env.PROD ? 500 : 100; // Longer delay in production
  setTimeout(() => {
    socketService.connect().catch(error => {
      console.log('Initial connection failed - will retry when needed:', error.message);
    });
  }, delay);
}