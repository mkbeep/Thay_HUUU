/**
 * useWebSocket Hook
 * React hook để sử dụng WebSocket
 */

import { useEffect, useState } from 'react';
import { socketService } from '../services/socketService';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = socketService.connect();

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Set initial state
    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  return {
    isConnected,
    socket: socketService.getSocket(),
    on: socketService.on.bind(socketService),
    off: socketService.off.bind(socketService),
    emit: socketService.emit.bind(socketService),
  };
}
