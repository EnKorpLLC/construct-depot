import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';

interface WebSocketMessage {
  type: string;
  data: any;
}

interface ConnectionState {
  isConnected: boolean;
  lastConnected: Date | null;
  reconnectAttempts: number;
  error: Error | null;
}

class WebSocketService extends EventEmitter {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private connectionState: ConnectionState = {
    isConnected: false,
    lastConnected: null,
    reconnectAttempts: 0,
    error: null
  };
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private reconnectBackoff = 1.5;

  constructor() {
    super();
    this.initialize();
  }

  private initialize() {
    const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001';
    
    this.socket = io(WEBSOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.connectionState = {
        isConnected: true,
        lastConnected: new Date(),
        reconnectAttempts: 0,
        error: null
      };
      this.emit('connection_state_change', this.connectionState);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.connectionState.isConnected = false;
      this.emit('connection_state_change', this.connectionState);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.connectionState.error = error;
      this.connectionState.reconnectAttempts++;
      this.emit('connection_state_change', this.connectionState);

      if (this.connectionState.reconnectAttempts >= this.maxReconnectAttempts) {
        this.handleMaxReconnectAttempts();
      }
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`WebSocket reconnection attempt ${attemptNumber}`);
      const delay = Math.min(
        this.reconnectDelay * Math.pow(this.reconnectBackoff, attemptNumber - 1),
        5000
      );
      this.socket!.io.reconnectionDelay(delay);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
      this.connectionState.reconnectAttempts = 0;
      this.connectionState.lastConnected = new Date();
      this.emit('connection_state_change', this.connectionState);
    });

    this.socket.on('message', (message: WebSocketMessage) => {
      this.handleMessage(message);
    });
  }

  private handleMaxReconnectAttempts() {
    console.error('Max reconnection attempts reached');
    this.emit('max_reconnect_attempts', this.connectionState);
    this.disconnect();
  }

  private handleMessage(message: WebSocketMessage) {
    const { type, data } = message;
    const listeners = this.listeners.get(type);
    
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in message listener for type ${type}:`, error);
        }
      });
    }
  }

  public getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  public subscribe(type: string, callback: (data: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    
    this.listeners.get(type)?.add(callback);
    
    return () => {
      this.unsubscribe(type, callback);
    };
  }

  public unsubscribe(type: string, callback: (data: any) => void) {
    this.listeners.get(type)?.delete(callback);
    if (this.listeners.get(type)?.size === 0) {
      this.listeners.delete(type);
    }
  }

  public send(type: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit('message', { type, data });
      return true;
    }
    return false;
  }

  public async reconnect(): Promise<boolean> {
    if (!this.socket || this.connectionState.reconnectAttempts >= this.maxReconnectAttempts) {
      this.initialize();
    }
    
    return new Promise((resolve) => {
      if (this.socket?.connected) {
        resolve(true);
        return;
      }

      const timeout = setTimeout(() => resolve(false), 5000);
      
      const onConnect = () => {
        clearTimeout(timeout);
        this.socket?.off('connect', onConnect);
        resolve(true);
      };

      this.socket?.once('connect', onConnect);
      this.socket?.connect();
    });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionState.isConnected = false;
      this.emit('connection_state_change', this.connectionState);
    }
  }
}

export const webSocketService = new WebSocketService();
export default webSocketService; 