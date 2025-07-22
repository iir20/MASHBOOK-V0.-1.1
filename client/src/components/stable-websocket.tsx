import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseStableWebSocketOptions {
  userId: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  reconnectAttempts: number;
  lastError: string | null;
}

export function useStableWebSocket({
  userId,
  reconnectInterval = 3000,
  maxReconnectAttempts = 10,
  heartbeatInterval = 30000
}: UseStableWebSocketOptions) {
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    connectionQuality: 'disconnected',
    reconnectAttempts: 0,
    lastError: null
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<WebSocketMessage[]>([]);
  const { toast } = useToast();

  // Clear all timeouts
  const clearTimeouts = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Send heartbeat ping
  const sendHeartbeat = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'ping',
        timestamp: Date.now(),
        userId
      }));
    }
  }, [userId]);

  // Process queued messages
  const processMessageQueue = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && messageQueueRef.current.length > 0) {
      messageQueueRef.current.forEach(message => {
        wsRef.current?.send(JSON.stringify(message));
      });
      messageQueueRef.current = [];
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || state.isConnecting) {
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, lastError: null }));

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws?userId=${encodeURIComponent(userId)}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          connectionQuality: 'excellent',
          reconnectAttempts: 0,
          lastError: null
        }));

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(sendHeartbeat, heartbeatInterval);
        
        // Process any queued messages
        processMessageQueue();

        // Send join room message
        ws.send(JSON.stringify({
          type: 'join-room',
          userId,
          timestamp: Date.now()
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Handle pong response for connection quality
          if (message.type === 'pong') {
            const latency = Date.now() - message.timestamp;
            const quality = latency < 100 ? 'excellent' : 
                          latency < 300 ? 'good' : 
                          latency < 1000 ? 'poor' : 'disconnected';
            
            setState(prev => ({ ...prev, connectionQuality: quality }));
          }
          
          // Dispatch custom event for other components to listen
          window.dispatchEvent(new CustomEvent('phantom-ws-message', { detail: message }));
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          connectionQuality: 'disconnected'
        }));

        clearTimeouts();

        // Only attempt reconnect if it wasn't a clean close and we haven't exceeded max attempts
        if (event.code !== 1000 && state.reconnectAttempts < maxReconnectAttempts) {
          const nextAttempt = state.reconnectAttempts + 1;
          const delay = Math.min(reconnectInterval * Math.pow(1.5, nextAttempt - 1), 30000);
          
          setState(prev => ({ ...prev, reconnectAttempts: nextAttempt }));
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (state.reconnectAttempts >= maxReconnectAttempts) {
          toast({
            title: "Connection Failed",
            description: "Unable to maintain connection to the network. Please refresh the page.",
            variant: "destructive",
          });
        }
      };

      ws.onerror = (error) => {
        setState(prev => ({
          ...prev,
          lastError: 'WebSocket connection error',
          isConnecting: false
        }));
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        lastError: 'Failed to create WebSocket connection'
      }));
      console.error('Failed to create WebSocket:', error);
    }
  }, [userId, state.isConnecting, state.reconnectAttempts, maxReconnectAttempts, reconnectInterval, heartbeatInterval, sendHeartbeat, processMessageQueue, toast]);

  // Send message with queueing
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      // Queue message for when connection is restored
      messageQueueRef.current.push(message);
      
      // Attempt to reconnect if not connected
      if (!state.isConnected && !state.isConnecting) {
        connect();
      }
    }
  }, [state.isConnected, state.isConnecting, connect]);

  // Initialize connection
  useEffect(() => {
    connect();
    
    return () => {
      clearTimeouts();
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
        wsRef.current = null;
      }
    };
  }, [userId]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setState(prev => ({ ...prev, reconnectAttempts: 0 }));
    connect();
  }, [connect]);

  return {
    ...state,
    sendMessage,
    reconnect
  };
}

// Connection status indicator component
export function ConnectionStatus({ 
  isConnected, 
  connectionQuality, 
  reconnectAttempts,
  onReconnect 
}: {
  isConnected: boolean;
  connectionQuality: string;
  reconnectAttempts: number;
  onReconnect: () => void;
}) {
  const getStatusColor = () => {
    if (!isConnected) return 'bg-red-500';
    switch (connectionQuality) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-yellow-500';
      case 'poor': return 'bg-orange-500';
      default: return 'bg-red-500';
    }
  };

  const getStatusText = () => {
    if (!isConnected) return reconnectAttempts > 0 ? `Reconnecting (${reconnectAttempts})` : 'Disconnected';
    return `Connected (${connectionQuality})`;
  };

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${isConnected ? 'animate-pulse' : ''}`}></div>
      <span className="text-gray-300">{getStatusText()}</span>
      {!isConnected && (
        <button 
          onClick={onReconnect}
          className="text-xs text-emerald-400 hover:text-emerald-300 underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}