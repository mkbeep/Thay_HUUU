/**
 * WebSocket Service
 * Single shared Socket.IO connection for the admin app.
 */

import { io, Socket } from 'socket.io-client';

const getSocketUrl = () => {
  const explicit = (import.meta.env.VITE_SOCKET_URL || '').trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  return apiUrl.replace(/\/api\/v1\/?$/, '');
};

const SOCKET_URL = getSocketUrl();

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token?: string): Socket {
    const authToken =
      token || localStorage.getItem('token') || localStorage.getItem('access_token') || undefined;

    if (!authToken) {
      this.disconnect();
      throw new Error('Missing auth token for WebSocket connection');
    }

    if (this.socket) {
      this.socket.auth = { token: authToken };
      if (this.socket.connected) {
        this.joinAdminRoom();
      } else if (this.socket.disconnected) {
        this.socket.connect();
      }
      return this.socket;
    }

    console.log('Connecting to WebSocket:', SOCKET_URL);

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: { token: authToken },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventHandlers();
    (window as any).socket = this.socket;

    return this.socket;
  }

  private joinAdminRoom(): void {
    if (!this.socket?.connected) return;
    this.socket.emit('join:admin');
    console.log('Joined admin room');
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
      this.joinAdminRoom();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.log('Max reconnection attempts reached. Falling back to polling.');
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
      this.joinAdminRoom();
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('WebSocket disconnected manually');
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
}

export const socketService = new SocketService();
