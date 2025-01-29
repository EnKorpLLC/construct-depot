import { useEffect, useCallback } from 'react';
import webSocketService from '@/lib/services/websocket/WebSocketService';

export function useWebSocket(type: string, callback: (data: any) => void) {
  const handleMessage = useCallback((data: any) => {
    callback(data);
  }, [callback]);

  useEffect(() => {
    // Subscribe to messages
    const unsubscribe = webSocketService.subscribe(type, handleMessage);

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [type, handleMessage]);

  const sendMessage = useCallback((data: any) => {
    webSocketService.send(type, data);
  }, [type]);

  return { sendMessage };
} 