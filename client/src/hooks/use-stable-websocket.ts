import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketOptions {
  url: string;
  protocols?: string | string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (event: MessageEvent) => void;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onReconnect?: () => void;
  onMaxReconnectAttemptsReached?: () => void;
}

interface WebSocketState {
  socket: WebSocket | null;
  isConnected: boolean;
  isConnecting: boolean;
  reconnectAttempts: number;
  lastError: Event | null;
}

export function useStableWebSocket(options: WebSocketOptions) {
  const {
    url,
    protocols,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onMessage,
    onOpen,
    onClose,
    onError,
    onReconnect,
    onMaxReconnectAttemptsReached,
  } = options;

  const [state, setState] = useState<WebSocketState>({
    socket: null,
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0,
    lastError: null,
  });

  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const shouldReconnectRef = useRef(true);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current || state.isConnecting) return;

    setState(prev => ({ ...prev, isConnecting: true }));

    try {
      const socket = new WebSocket(url, protocols);
      
      socket.onopen = (event) => {
        console.log('WebSocket connected');
        setState(prev => ({
          ...prev,
          socket,
          isConnected: true,
          isConnecting: false,
          reconnectAttempts: 0,
          lastError: null,
        }));
        onOpen?.(event);
      };

      socket.onmessage = (event) => {
        onMessage?.(event);
      };

      socket.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        setState(prev => ({
          ...prev,
          socket: null,
          isConnected: false,
          isConnecting: false,
        }));
        onClose?.(event);

        // Attempt to reconnect if it wasn't a clean close and we should reconnect
        if (shouldReconnectRef.current && event.code !== 1000 && mountedRef.current) {
          scheduleReconnect();
        }
      };

      socket.onerror = (event) => {
        console.error('WebSocket error:', event);
        setState(prev => ({
          ...prev,
          lastError: event,
          isConnecting: false,
        }));
        onError?.(event);
      };

      setState(prev => ({ ...prev, socket }));
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        lastError: error as Event,
      }));
      scheduleReconnect();
    }
  }, [url, protocols, onMessage, onOpen, onClose, onError, state.isConnecting]);

  const scheduleReconnect = useCallback(() => {
    if (!shouldReconnectRef.current || !mountedRef.current) return;

    setState(prev => {
      const newAttempts = prev.reconnectAttempts + 1;
      
      if (newAttempts > maxReconnectAttempts) {
        console.warn('Max reconnect attempts reached');
        onMaxReconnectAttemptsReached?.();
        return { ...prev, reconnectAttempts: newAttempts };
      }

      const delay = Math.min(reconnectInterval * Math.pow(1.5, newAttempts - 1), 30000);
      console.log(`Scheduling reconnect attempt ${newAttempts} in ${delay}ms`);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        if (shouldReconnectRef.current && mountedRef.current) {
          console.log(`Reconnect attempt ${newAttempts}`);
          onReconnect?.();
          connect();
        }
      }, delay);

      return { ...prev, reconnectAttempts: newAttempts };
    });
  }, [connect, reconnectInterval, maxReconnectAttempts, onReconnect, onMaxReconnectAttemptsReached]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (state.socket) {
      state.socket.close(1000, 'Manual disconnect');
    }

    setState(prev => ({
      ...prev,
      socket: null,
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0,
    }));
  }, [state.socket]);

  const sendMessage = useCallback((message: string | ArrayBuffer | Blob) => {
    if (state.socket && state.isConnected) {
      try {
        state.socket.send(message);
        return true;
      } catch (error) {
        console.error('Failed to send message:', error);
        return false;
      }
    }
    return false;
  }, [state.socket, state.isConnected]);

  const forceReconnect = useCallback(() => {
    setState(prev => ({ ...prev, reconnectAttempts: 0 }));
    disconnect();
    shouldReconnectRef.current = true;
    setTimeout(connect, 1000);
  }, [connect, disconnect]);

  useEffect(() => {
    mountedRef.current = true;
    shouldReconnectRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (state.socket) {
        state.socket.close(1000, 'Component unmounting');
      }
    };
  }, []);

  return {
    socket: state.socket,
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    reconnectAttempts: state.reconnectAttempts,
    lastError: state.lastError,
    sendMessage,
    disconnect,
    forceReconnect,
  };
}