/**
 * WebSocket Service for React Native App
 * Quản lý real-time connection với Socket.IO
 */

import { io, Socket } from 'socket.io-client';
import { getApiBaseUrl } from '../utils/apiBaseUrl';

const getSocketUrl = () => {
  const apiUrl = getApiBaseUrl();
  return apiUrl.replace(/\/api\/v1\/?$/, '');
};

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private tableSessionId: string | null = null;
  private tableRoomRefCount = 0;

  connect(tableSessionId?: string): Socket {
    if (tableSessionId) {
      this.tableSessionId = tableSessionId;
    }

    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.socket && !this.socket.connected) {
      return this.socket;
    }

    const socketUrl = getSocketUrl();
    console.log('🔌 Connecting to WebSocket:', socketUrl);

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

    this.socket.off('connect');
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket?.id);
      this.reconnectAttempts = 0;

      if (this.tableSessionId && this.tableRoomRefCount > 0) {
        this.socket?.emit('join:table', this.tableSessionId);
        console.log('🪑 Re-joined table room:', this.tableSessionId);
      }
    });

    this.socket.off('disconnect');
    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
    });

    this.socket.off('connect_error');
    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.log('⚠️ Max reconnection attempts reached. Use HTTP polling fallback.');
      }
    });

    this.socket.off('reconnect');
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 WebSocket reconnected after ${attemptNumber} attempts`);
      if (this.tableSessionId && this.tableRoomRefCount > 0) {
        this.socket?.emit('join:table', this.tableSessionId);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.tableSessionId = null;
      this.tableRoomRefCount = 0;
      console.log('🔌 WebSocket disconnected manually');
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  on(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }

  emit(event: string, data?: any): void {
    this.socket?.emit(event, data);
  }

  joinTable(tableSessionId: string): void {
    this.tableSessionId = tableSessionId;
    this.tableRoomRefCount += 1;

    const doJoin = () => {
      if (this.socket?.connected && this.tableSessionId) {
        this.socket.emit('join:table', this.tableSessionId);
        console.log('🪑 Joined table room:', this.tableSessionId);
      }
    };

    if (!this.socket) {
      this.connect(tableSessionId);
    }
    doJoin();

    if (this.socket && !this.socket.connected) {
      this.socket.once('connect', doJoin);
    }
  }

  leaveTable(): void {
    if (this.tableRoomRefCount > 0) {
      this.tableRoomRefCount -= 1;
    }
    if (this.tableRoomRefCount > 0) return;

    if (this.tableSessionId && this.socket?.connected) {
      this.socket.emit('leave:table', this.tableSessionId);
      console.log('🚪 Left table room:', this.tableSessionId);
    }
    this.tableSessionId = null;
  }
}

export const socketService = new SocketService();
