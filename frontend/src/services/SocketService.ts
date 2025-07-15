// frontend/src/services/socketService.ts
// DEPLOYMENT-READY VERSION - Works both locally and externally

import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    // Initialize when needed
  }

  /**
   * Get the correct API URL based on environment
   */
  private getApiUrl(): string {
    // Production environment (deployed)
    if (import.meta.env.PROD || import.meta.env.NODE_ENV === 'production') {
      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) {
        console.warn('⚠️ VITE_API_URL not set in production, falling back to localhost');
        return 'http://localhost:5000';
      }
      console.log('🌐 Using production API URL:', apiUrl);
      return apiUrl;
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
      timeout: isProduction ? 15000 : 10000, // Longer timeout for production
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: isProduction ? 10 : 5,
      reconnectionDelay: isProduction ? 2000 : 1000,
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

        console.log('📡 Socket created successfully:', typeof this.socket);

        // Set connection timeout (longer for production)
        const timeoutMs = import.meta.env.PROD ? 20000 : 15000;
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
          
          // Set up all event listeners
          this.setupEventListeners();
          
          // Notify game store
          this.notifyConnectionStatus(true);
          
          resolve();
        });

        // Handle connection errors
        this.socket.once('connect_error', (error) => {
          console.error('❌ Connection error to', apiUrl, ':', error.message);
          console.error('🔧 Check if backend is running and CORS is configured');
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

    // Turn management
    this.socket.on('turn-start', (data) => {
      const { playerId, phase } = data;
      console.log('🎯 Turn started for player:', playerId, 'Phase:', phase);
      
      // Check if it's our turn via game store
      this.checkIfMyTurn(playerId);
    });

    // Move handling - FIXED event names to match backend
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

    // Join game responses - FIXED event names
    this.socket.on('join-game-success', (data) => {
      console.log('🎮 Join success:', data);
      
      if (data.gameState && data.playerId) {
        this.updateGameStore('setCurrentGame', data.gameState);
        this.updateGameStore('setCurrentPlayer', data.playerId);
        this.updateGameStore('setLoading', false);
        toast.success('Successfully joined game!');
      }
    });

    this.socket.on('join-game-error', (data) => {
      console.error('❌ Join failed:', data.message);
      this.updateGameStore('setLoading', false);
      toast.error(data.message || 'Failed to join game');
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

    this.socket.on('server-message', (data) => {
      const { message, type } = data;
      console.log('📢 Server message:', message);
      
      switch (type) {
        case 'info':
          toast.success(message);
          break;
        case 'warning':
          toast.error(message);
          break;
        default:
          toast(message);
      }
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
   * Check if it's our turn
   */
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

  /**
   * Check game winner and show appropriate message
   */
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

  /**
   * Join a game session - FIXED with better error handling
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

    console.log('🎮 Joining game:', gameId, 'as', playerName);
    
    this.socket.emit('join-game', {
      gameId,
      playerName: playerName.trim(),
      playerType
    });
  }

  /**
   * Make a move in the game - FIXED with better validation
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
   * Request help from the AI tutor
   */
  requestHelp(gameId: string, concept: string, context: any) {
    if (!this.socket?.connected) {
      console.error('Cannot request help - not connected to server');
      toast.error('Not connected to server');
      return;
    }

    console.log('🤖 Requesting AI help for concept:', concept);
    
    this.socket.emit('request-help', {
      gameId,
      concept,
      context
    });
  }

  /**
   * Leave the current game
   */
  leaveGame(gameId: string) {
    if (!this.socket?.connected) {
      return;
    }

    console.log('👋 Leaving game:', gameId);
    
    this.socket.emit('leave-game', { gameId });
  }

  /**
   * Send a chat message
   */
  sendChatMessage(gameId: string, message: string) {
    if (!this.socket?.connected) {
      toast.error('Not connected to server');
      return;
    }

    if (!message.trim()) {
      return;
    }

    this.socket.emit('chat-message', {
      gameId,
      message: message.trim(),
      timestamp: new Date()
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
   * Emit a custom event
   */
  emit(eventName: string, data: any) {
    if (!this.socket?.connected) {
      console.warn('Cannot emit - not connected to server');
      return;
    }

    this.socket.emit(eventName, data);
  }

  /**
   * Listen for a custom event
   */
  on(eventName: string, callback: (...args: any[]) => void) {
    if (!this.socket) {
      console.warn('Cannot listen - socket not initialized');
      return;
    }

    this.socket.on(eventName, callback);
  }

  /**
   * Remove a listener for a custom event
   */
  off(eventName: string, callback?: (...args: any[]) => void) {
    if (!this.socket) {
      return;
    }

    if (callback) {
      this.socket.off(eventName, callback);
    } else {
      this.socket.off(eventName);
    }
  }

  /**
   * Force reconnection
   */
  async forceReconnect(): Promise<void> {
    console.log('🔄 Forcing reconnection...');
    
    // Disconnect if connected
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    // Reset state
    this.isConnecting = false;
    this.connectionPromise = null;
    this.reconnectAttempts = 0;
    
    // Reconnect
    return this.connect();
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
      isProduction: import.meta.env.PROD
    };
  }
}

// Create a single instance to use throughout the app
export const socketService = new SocketService();

/**
 * Auto-connect when the service is imported
 */
if (typeof window !== 'undefined') {
  // Only auto-connect in browser environment
  setTimeout(() => {
    socketService.connect().catch(error => {
      console.log('Initial connection failed - will retry when needed:', error.message);
    });
  }, 100);
}