// frontend/src/services/SocketManager.ts
// This breaks the circular dependency by providing a bridge between SocketService and GameStore

import { socketService } from './SocketService';
import type { GameState, Player, AITutoringResponse } from '../store/GameStore';

// Store reference that will be set by GameStore
let gameStoreRef: any = null;

// Register the store (called by GameStore on initialization)
export const registerGameStore = (store: any) => {
  gameStoreRef = store;
  console.log('✅ SocketManager: GameStore registered');
};

// Socket event handlers that update the store
export const socketHandlers = {
  onGameUpdated: (gameState: GameState) => {
    if (gameStoreRef) {
      gameStoreRef.setCurrentGame(gameState);
    }
  },
  
  onGameJoined: (data: any) => {
    if (gameStoreRef) {
      gameStoreRef.setCurrentGame(data.gameState);
      gameStoreRef.setCurrentPlayer(data.playerId);
      gameStoreRef.setLoading(false);
    }
  },
  
  onError: (error: any) => {
    if (gameStoreRef) {
      gameStoreRef.setLoading(false);
      gameStoreRef.setProcessingMove(false);
    }
  },
  
  onPlayerAction: (data: any) => {
    if (gameStoreRef) {
      gameStoreRef.setProcessingMove(false);
      gameStoreRef.setPendingMove(null);
      if (data.gameState) {
        gameStoreRef.setCurrentGame(data.gameState);
      }
    }
  },
  
  onDisconnect: () => {
    if (gameStoreRef) {
      gameStoreRef.setConnectionStatus(false);
    }
  },
  
  onConnect: () => {
    if (gameStoreRef) {
      gameStoreRef.setConnectionStatus(true);
    }
  }
};

// Initialize socket handlers (called after store is registered)
export const initializeSocket = () => {
  console.log('🔧 SocketManager: Initializing socket handlers');
  socketService.initializeSocketHandlers(socketHandlers);
  
  // Connect to socket
  socketService.connect().catch(error => {
    console.error('❌ SocketManager: Connection failed:', error);
  });
};

// Export socket methods for GameStore to use
export const socketMethods = {
  joinGame: (gameId: string, playerName: string) => {
    return socketService.joinGame(gameId, playerName);
  },
  
  makeMove: (gameId: string, move: any) => {
    return socketService.makeMove(gameId, move);
  },
  
  requestHelp: (gameId: string, concept: string, context: any) => {
    return socketService.requestHelp(concept, context);
  },
  
  disconnect: () => {
    return socketService.disconnect();
  },
  
  isConnected: () => {
    return socketService.isConnected();
  }
};