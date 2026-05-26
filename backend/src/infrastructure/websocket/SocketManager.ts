/**
 * WebSocket Manager
 * Quản lý real-time communication với Socket.IO
 */

import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { getCorsOriginCallback } from '../config/corsOrigins';

export class SocketManager {
  private io: Server;
  private static instance: SocketManager;

  private constructor(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: getCorsOriginCallback(),
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

      socket.on('join:admin', () => {
        socket.join('admin');
        console.log(`👤 Admin joined: ${socket.id}`);
      });

      socket.on('join:kitchen', () => {
        socket.join('kitchen');
        console.log(`👨‍🍳 Kitchen joined: ${socket.id}`);
      });

      socket.on('join:table', (tableSessionId: string) => {
        socket.join(`table:${tableSessionId}`);
        console.log(`🪑 Customer joined table room: ${tableSessionId} (${socket.id})`);
      });

      socket.on('leave:table', (tableSessionId: string) => {
        socket.leave(`table:${tableSessionId}`);
        console.log(`🚪 Customer left table room: ${tableSessionId} (${socket.id})`);
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
      });
    });
  }

  public emitToAdmin(event: string, data: any): void {
    this.io.to('admin').emit(event, data);
  }

  public emitToKitchen(event: string, data: any): void {
    this.io.to('kitchen').emit(event, data);
  }

  public emitToTable(tableSessionId: string, event: string, data: any): void {
    this.io.to(`table:${tableSessionId}`).emit(event, data);
  }

  public notifyOrderCreated(order: any): void {
    this.emitToAdmin('order:created', order);
    this.emitToKitchen('order:created', order);
    if (order.table_session_id) {
      this.emitToTable(order.table_session_id, 'order:created', order);
    }
  }

  public notifyOrderUpdated(order: any): void {
    this.emitToAdmin('order:updated', order);
    this.emitToKitchen('order:updated', order);
    if (order.table_session_id) {
      this.emitToTable(order.table_session_id, 'order:updated', order);
    }
  }

  public notifyReportsUpdated(payload: any): void {
    this.emitToAdmin('report:updated', payload);
  }

  public notifyOrderStatusChanged(orderId: string, status: string, order: any): void {
    const payload = { orderId, status, order };
    this.emitToAdmin('order:status_changed', payload);
    this.emitToKitchen('order:status_changed', payload);
    if (order.table_session_id) {
      this.emitToTable(order.table_session_id, 'order:status_changed', payload);
    }
  }

  public notifyOrderItemStatusUpdated(
    itemId: string,
    status: string,
    item: Record<string, unknown>
  ): void {
    const payload = { itemId, status, item };
    this.emitToAdmin('order:item_status_updated', payload);
    this.emitToKitchen('order:item_status_updated', payload);
    const sessionId = item.table_session_id as string | undefined;
    if (sessionId) {
      this.emitToTable(sessionId, 'order:item_status_updated', payload);
    }
  }

  public notifyOrderItemPaymentUpdated(itemId: string, item: Record<string, unknown>): void {
    const payload = { itemId, item };
    this.emitToAdmin('order:item_payment_updated', payload);
    const sessionId = item.table_session_id as string | undefined;
    if (sessionId) {
      this.emitToTable(sessionId, 'order:item_payment_updated', payload);
    }
  }

  public notifyPaymentRequested(order: any): void {
    const payload = {
      orderId: order.id,
      order,
      table_session_id: order.table_session_id,
      payment_method: order.payment_method,
      total_amount: order.total_amount,
    };
    this.emitToAdmin('payment:requested', payload);
    if (order.table_session_id) {
      this.emitToTable(order.table_session_id, 'payment:requested', payload);
    }
  }

  public notifyPaymentConfirmed(order: any): void {
    const payload = {
      orderId: order.id,
      order,
      table_session_id: order.table_session_id,
      total_amount: order.total_amount,
    };
    this.emitToAdmin('payment:confirmed', payload);
    if (order.table_session_id) {
      this.emitToTable(order.table_session_id, 'payment:confirmed', payload);
    }
  }

  public notifyNewNotification(notification: any): void {
    this.emitToAdmin('notification:new', notification);
  }

  public notifySupportRequestCreated(request: Record<string, unknown>): void {
    this.emitToAdmin('support:request_created', request);
  }

  public notifySupportRequestUpdated(request: Record<string, unknown>): void {
    this.emitToAdmin('support:request_updated', request);
  }

  /** Admin nhận table:updated — không broadcast toàn hệ thống */
  public notifyTableUpdated(tableId: string, payload?: Record<string, unknown>): void {
    const data = { tableId, ...payload };
    this.emitToAdmin('table:updated', data);
  }

  /** Chỉ admin — thay đổi trạng thái bàn (cleanup, thanh toán xong, …) */
  public notifyTableStatusChanged(tableId: string, status: string): void {
    this.emitToAdmin('table:status_changed', { tableId, status });
  }

  public notifyTableDocumentChanged(tableId: string): void {
    this.emitToAdmin('table:document_changed', { tableId });
  }

  public notifySessionClosingSoon(
    tableSessionId: string,
    tableId: string,
    payload: Record<string, unknown>
  ): void {
    const data = { tableId, sessionId: tableSessionId, ...payload };
    this.emitToTable(tableSessionId, 'session:closing_soon', data);
    this.emitToAdmin('session:closing_soon', data);
  }

  /** Admin — bàn sắp trống (đếm ngược auto-close) */
  public notifySessionAutoClosing(
    tableSessionId: string,
    tableId: string,
    payload: Record<string, unknown>
  ): void {
    const data = { tableId, sessionId: tableSessionId, ...payload };
    this.emitToAdmin('session:auto_closing', data);
  }

  public notifyBillCreated(bill: Record<string, unknown>): void {
    const payload = { billId: bill.id, bill };
    this.emitToAdmin('bill:created', payload);
    const sessionId = bill.session_id as string | undefined;
    if (sessionId) {
      this.emitToTable(sessionId, 'bill:created', payload);
    }
  }

  public notifyBillConfirmed(bill: Record<string, unknown>): void {
    const payload = { billId: bill.id, bill };
    this.emitToAdmin('bill:confirmed', payload);
    const sessionId = bill.session_id as string | undefined;
    if (sessionId) {
      this.emitToTable(sessionId, 'bill:confirmed', payload);
    }
  }

  public getIO(): Server {
    return this.io;
  }
}
