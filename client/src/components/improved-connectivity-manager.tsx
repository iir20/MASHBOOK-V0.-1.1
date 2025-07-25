import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@shared/schema';

import {
  Wifi, WifiOff, Bluetooth, Globe, Signal, Activity, 
  RefreshCw, CheckCircle, XCircle, AlertTriangle,
  Radio, Network, Zap
} from 'lucide-react';

interface ConnectionStatus {
  websocket: 'connected' | 'connecting' | 'disconnected' | 'error';
  webrtc: 'available' | 'unavailable' | 'blocked';
  bluetooth: 'available' | 'unavailable' | 'blocked';
  internet: 'online' | 'offline' | 'slow';
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  latency: number;
  retryAttempts: number;
}

interface ConnectivityStats {
  messagesDelivered: number;
  connectionUptime: number;
  dataTransferred: number;
  peersConnected: number;
}

interface ImprovedConnectivityManagerProps {
  currentUser: User | null;
  isOffline: boolean;
  wsState: {
    isConnected: boolean;
    connectionQuality: string;
    sendMessage: (message: any) => void;
  };
  onConnectivityChange: (status: boolean) => void;
}

export function ImprovedConnectivityManager({ 
  currentUser, 
  isOffline, 
  wsState, 
  onConnectivityChange 
}: ImprovedConnectivityManagerProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    websocket: 'disconnected',
    webrtc: 'unavailable',
    bluetooth: 'unavailable',
    internet: 'offline',
    quality: 'poor',
    latency: 0,
    retryAttempts: 0
  });

  const [stats, setStats] = useState<ConnectivityStats>({
    messagesDelivered: 0,
    connectionUptime: 0,
    dataTransferred: 0,
    peersConnected: 0
  });

  const [isRetrying, setIsRetrying] = useState(false);
  const [autoRetry, setAutoRetry] = useState(true);
  
  const { toast } = useToast();

  // Check internet connectivity
  const checkInternetConnection = useCallback(async () => {
    try {
      const response = await fetch('/api/users', { 
        method: 'HEAD',
        cache: 'no-cache',
        // signal: AbortSignal.timeout(5000) // Simplified for compatibility
      });
      
      const isOnline = response.ok;
      setConnectionStatus(prev => ({
        ...prev,
        internet: isOnline ? 'online' : 'slow',
        quality: isOnline ? 'good' : 'fair'
      }));
      
      onConnectivityChange(isOnline);
      return isOnline;
    } catch (error) {
      setConnectionStatus(prev => ({
        ...prev,
        internet: 'offline',
        quality: 'poor'
      }));
      
      onConnectivityChange(false);
      return false;
    }
  }, [onConnectivityChange]);

  // Check WebRTC support
  const checkWebRTCSupport = useCallback(() => {
    try {
      const hasWebRTC = !!(window.RTCPeerConnection || window.webkitRTCPeerConnection);
      setConnectionStatus(prev => ({
        ...prev,
        webrtc: hasWebRTC ? 'available' : 'unavailable'
      }));
      return hasWebRTC;
    } catch (error) {
      setConnectionStatus(prev => ({
        ...prev,
        webrtc: 'blocked'
      }));
      return false;
    }
  }, []);

  // Check Bluetooth support
  const checkBluetoothSupport = useCallback(async () => {
    try {
      if (!navigator.bluetooth) {
        setConnectionStatus(prev => ({
          ...prev,
          bluetooth: 'unavailable'
        }));
        return false;
      }

      const isAvailable = await (navigator.bluetooth as any).getAvailability();
      setConnectionStatus(prev => ({
        ...prev,
        bluetooth: isAvailable ? 'available' : 'blocked'
      }));
      return isAvailable;
    } catch (error) {
      setConnectionStatus(prev => ({
        ...prev,
        bluetooth: 'unavailable'
      }));
      return false;
    }
  }, []);

  // Comprehensive connectivity test
  const runConnectivityDiagnostics = useCallback(async () => {
    setIsRetrying(true);
    
    try {
      // Run all checks in parallel
      const [internetOk, webrtcOk, bluetoothOk] = await Promise.all([
        checkInternetConnection(),
        Promise.resolve(checkWebRTCSupport()),
        checkBluetoothSupport()
      ]);

      // Test WebSocket connection
      if (internetOk && currentUser) {
        setConnectionStatus(prev => ({
          ...prev,
          websocket: wsState.isConnected ? 'connected' : 'connecting'
        }));
      }

      // Calculate overall quality
      const qualityScore = [internetOk, webrtcOk, bluetoothOk, wsState.isConnected]
        .filter(Boolean).length;
      
      const quality = qualityScore >= 3 ? 'excellent' : 
                     qualityScore >= 2 ? 'good' : 
                     qualityScore >= 1 ? 'fair' : 'poor';

      setConnectionStatus(prev => ({
        ...prev,
        quality,
        retryAttempts: prev.retryAttempts + 1
      }));

      if (internetOk) {
        toast({
          title: "Connectivity Restored",
          description: `Connection quality: ${quality}`,
        });
      }

    } catch (error) {
      console.error('Connectivity diagnostics failed:', error);
      toast({
        title: "Connectivity Check Failed",
        description: "Unable to complete diagnostics. Check your connection.",
        variant: "destructive"
      });
    } finally {
      setIsRetrying(false);
    }
  }, [currentUser, wsState.isConnected, checkInternetConnection, checkWebRTCSupport, checkBluetoothSupport, toast]);

  // Auto-retry logic
  useEffect(() => {
    if (!autoRetry || connectionStatus.internet === 'online') return;

    const retryInterval = setInterval(() => {
      if (connectionStatus.retryAttempts < 10) {
        runConnectivityDiagnostics();
      }
    }, 30000); // Retry every 30 seconds

    return () => clearInterval(retryInterval);
  }, [autoRetry, connectionStatus.internet, connectionStatus.retryAttempts, runConnectivityDiagnostics]);

  // Initial connectivity check
  useEffect(() => {
    runConnectivityDiagnostics();
  }, []);

  // Update WebSocket status
  useEffect(() => {
    setConnectionStatus(prev => ({
      ...prev,
      websocket: wsState.isConnected ? 'connected' : 'disconnected'
    }));
  }, [wsState.isConnected]);

  // Simulate stats updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (connectionStatus.internet === 'online' && wsState.isConnected) {
        setStats(prev => ({
          messagesDelivered: prev.messagesDelivered + Math.floor(Math.random() * 3),
          connectionUptime: prev.connectionUptime + 1,
          dataTransferred: prev.dataTransferred + Math.floor(Math.random() * 1024),
          peersConnected: Math.floor(Math.random() * 8) + 1
        }));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [connectionStatus.internet, wsState.isConnected]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'online':
      case 'available':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'connecting':
        return <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin" />;
      case 'disconnected':
      case 'offline':
      case 'unavailable':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-orange-400" />;
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-400 bg-green-400/10';
      case 'good': return 'text-blue-400 bg-blue-400/10';
      case 'fair': return 'text-yellow-400 bg-yellow-400/10';
      case 'poor': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status Overview */}
      <Card className="bg-black/40 border-cyan-400/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-cyan-400" />
              Connection Status
            </div>
            <Badge className={getQualityColor(connectionStatus.quality)}>
              {connectionStatus.quality.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Types */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
              <Globe className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm font-medium">Internet</p>
                <div className="flex items-center gap-2">
                  {getStatusIcon(connectionStatus.internet)}
                  <span className="text-xs">{connectionStatus.internet}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
              <Radio className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm font-medium">WebSocket</p>
                <div className="flex items-center gap-2">
                  {getStatusIcon(connectionStatus.websocket)}
                  <span className="text-xs">{connectionStatus.websocket}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
              <Zap className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-sm font-medium">WebRTC</p>
                <div className="flex items-center gap-2">
                  {getStatusIcon(connectionStatus.webrtc)}
                  <span className="text-xs">{connectionStatus.webrtc}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
              <Bluetooth className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm font-medium">Bluetooth</p>
                <div className="flex items-center gap-2">
                  {getStatusIcon(connectionStatus.bluetooth)}
                  <span className="text-xs">{connectionStatus.bluetooth}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Connection Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-cyan-400">{stats.messagesDelivered}</p>
              <p className="text-xs text-muted-foreground">Messages Delivered</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{Math.floor(stats.connectionUptime / 60)}m</p>
              <p className="text-xs text-muted-foreground">Uptime</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">{(stats.dataTransferred / 1024).toFixed(1)}KB</p>
              <p className="text-xs text-muted-foreground">Data Transferred</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">{stats.peersConnected}</p>
              <p className="text-xs text-muted-foreground">Peers Connected</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <Button 
              onClick={runConnectivityDiagnostics}
              disabled={isRetrying}
              className="flex-1"
            >
              {isRetrying ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Activity className="w-4 h-4 mr-2" />
              )}
              {isRetrying ? 'Testing...' : 'Test Connection'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setAutoRetry(!autoRetry)}
              className={autoRetry ? 'border-green-400/50 text-green-400' : 'border-gray-400/50'}
            >
              Auto-Retry {autoRetry ? 'ON' : 'OFF'}
            </Button>
          </div>

          {/* Retry Progress */}
          {connectionStatus.retryAttempts > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Retry Attempts</span>
                <span>{connectionStatus.retryAttempts}/10</span>
              </div>
              <Progress value={(connectionStatus.retryAttempts / 10) * 100} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}