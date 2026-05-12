/**
 * WebSocket Service for React Native App
 * Quản lý real-time connection với Socket.IO
 */

import { io, Socket } from 'socket.io-client';
import { getApiBaseUrl } from '../utils/apiBaseUrl';

// Lấy base URL và loại bỏ /api/v1
const getSocketUrl = () => {
  const apiUrl = getApiBaseUrl();
  // Remove /api/v1 suffix
  return apiUrl.replace(/\/api\/v1\/?$/, '');
};

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private tableSessionId: string | null = null;

  connect(tableSessionId?: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    const socketUrl = getSocketUrl();
    console.log('🔌 Connecting to WebSocket:', socketUrl);

    this.tableSessionId = tableSessionId || this.tableSessionId;

    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventHandlers();

    return this.socket;
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
      
      // Join table room if we have a table session ID
      if (this.tableSessionId) {
        this.socket?.emit('join:table', this.tableSessionId);
        console.log('🪑 Joined table room:', this.tableSessionId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.log('⚠️ Max reconnection attempts reached. Falling back to polling.');
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 WebSocket reconnected after ${attemptNumber} attempts`);
      
      // Rejoin table room after reconnection
      if (this.tableSessionId) {
        this.socket?.emit('join:table', this.tableSessionId);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.tableSessionId = null;
      console.log('🔌 WebSocket disconnected manually');
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Event listeners
  on(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }

  emit(event: string, data?: any): void {
    this.socket?.emit(event, data);
  }

  // Join table room
  joinTable(tableSessionId: string): void {
    this.tableSessionId = tableSessionId;
    if (this.socket?.connected) {
      this.socket.emit('join:table', tableSessionId);
      console.log('🪑 Joined table room:', tableSessionId);
    }
  }

  // Leave table room
  leaveTable(): void {
    if (this.tableSessionId && this.socket?.connected) {
      this.socket.emit('leave:table', this.tableSessionId);
      console.log('🚪 Left table room:', this.tableSessionId);
    }
    this.tableSessionId = null;
  }
}

export const socketService = new SocketService();
