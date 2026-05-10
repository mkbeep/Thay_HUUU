/**
 * WebSocket Manager
 * Quản lý real-time communication với Socket.IO
 */

import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { config } from '../config/env.config';

export class SocketManager {
  private io: Server;
  private static instance: SocketManager;

  private constructor(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: config.cors.origin,
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();
  }

  public static initialize(httpServer: HTTPServer): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager(httpServer);
      console.log('✅ WebSocket Server initialized');
    }
    return SocketManager.instance;
  }

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      throw new Error('SocketManager not initialized. Call initialize() first.');
    }
    return SocketManager.instance;
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // Join room based on user role
      socket.on('join:admin', () => {
        socket.join('admin');
        console.log(`👤 Admin joined: ${socket.id}`);
      });

      socket.on('join:kitchen', () => {
        socket.join('kitchen');
        console.log(`👨‍🍳 Kitchen joined: ${socket.id}`);
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
      });
    });
  }

  // Emit events to specific rooms
  public emitToAdmin(event: string, data: any): void {
    this.io.to('admin').emit(event, data);
  }

  public emitToKitchen(event: string, data: any): void {
    this.io.to('kitchen').emit(event, data);
  }

  public emitToAll(event: string, data: any): void {
    this.io.emit(event, data);
  }

  // Order events
  public notifyOrderCreated(order: any): void {
    this.emitToAdmin('order:created', order);
    this.emitToKitchen('order:created', order);
  }

  public notifyOrderUpdated(order: any): void {
    this.emitToAdmin('order:updated', order);
    this.emitToKitchen('order:updated', order);
  }

  public notifyOrderStatusChanged(orderId: string, status: string, order: any): void {
    this.emitToAdmin('order:status_changed', { orderId, status, order });
    this.emitToKitchen('order:status_changed', { orderId, status, order });
  }

  // Notification events
  public notifyNewNotification(notification: any): void {
    this.emitToAdmin('notification:new', notification);
  }

  public getIO(): Server {
    return this.io;
  }
}
