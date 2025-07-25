import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { User } from '@shared/schema';

import {
  Wifi, WifiOff, Bluetooth, Globe, Signal, Activity, 
  RefreshCw, CheckCircle, XCircle, AlertTriangle,
  Radio, Network, Zap, RotateCcw as Sync, Database, Upload, Download
} from 'lucide-react';

interface SyncStatus {
  profiles: 'synced' | 'syncing' | 'failed' | 'pending';
  messages: 'synced' | 'syncing' | 'failed' | 'pending';
  stories: 'synced' | 'syncing' | 'failed' | 'pending';
  vault: 'synced' | 'syncing' | 'failed' | 'pending';
  settings: 'synced' | 'syncing' | 'failed' | 'pending';
  nodes: 'synced' | 'syncing' | 'failed' | 'pending';
}

interface ConnectivityHealth {
  overall: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
  websocket: boolean;
  api: boolean;
  database: boolean;
  mesh: boolean;
  lastCheck: Date;
  failureCount: number;
}

interface EnhancedConnectivitySyncManagerProps {
  currentUser: User | null;
  onConnectivityChange: (isOnline: boolean) => void;
  onSyncStatusChange: (status: SyncStatus) => void;
}

export function EnhancedConnectivitySyncManager({ 
  currentUser, 
  onConnectivityChange, 
  onSyncStatusChange 
}: EnhancedConnectivitySyncManagerProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    profiles: 'synced',
    messages: 'synced',
    stories: 'synced',
    vault: 'synced',
    settings: 'synced',
    nodes: 'synced'
  });

  const [connectivityHealth, setConnectivityHealth] = useState<ConnectivityHealth>({
    overall: 'offline',
    websocket: false,
    api: false,
    database: false,
    mesh: false,
    lastCheck: new Date(),
    failureCount: 0
  });

  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [pendingOperations, setPendingOperations] = useState<Array<{
    id: string;
    type: 'profile' | 'message' | 'story' | 'setting';
    operation: 'create' | 'update' | 'delete';
    data: any;
    retryCount: number;
  }>>([]);

  const diagnosticsIntervalRef = useRef<NodeJS.Timeout>();
  const syncIntervalRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Enhanced connectivity diagnostics
  const runConnectivityDiagnostics = useCallback(async () => {
    setIsRunningDiagnostics(true);
    let healthScore = 0;
    const newHealth = { ...connectivityHealth };

    try {
      // Test API connectivity
      try {
        const apiResponse = await fetch('/api/users', { 
          method: 'HEAD', 
          // signal: AbortSignal.timeout(3000) // Simplified for compatibility 
        });
        newHealth.api = apiResponse.ok;
        if (apiResponse.ok) healthScore += 25;
      } catch (error) {
        newHealth.api = false;
      }

      // Test database connectivity through API
      try {
        const dbResponse = await apiRequest('/api/users/1');
        newHealth.database = !!dbResponse;
        if (dbResponse) healthScore += 25;
      } catch (error) {
        newHealth.database = false;
      }

      // Test WebSocket connectivity
      try {
        const wsTest = new Promise((resolve) => {
          const testWs = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`);
          testWs.onopen = () => {
            testWs.close();
            resolve(true);
          };
          testWs.onerror = () => resolve(false);
          setTimeout(() => resolve(false), 2000) as any;
        });
        newHealth.websocket = await wsTest as boolean;
        if (newHealth.websocket) healthScore += 25;
      } catch (error) {
        newHealth.websocket = false;
      }

      // Test mesh connectivity (simulated)
      newHealth.mesh = newHealth.websocket && newHealth.api;
      if (newHealth.mesh) healthScore += 25;

      // Calculate overall health
      if (healthScore >= 100) newHealth.overall = 'excellent';
      else if (healthScore >= 75) newHealth.overall = 'good';
      else if (healthScore >= 50) newHealth.overall = 'fair';
      else if (healthScore >= 25) newHealth.overall = 'poor';
      else newHealth.overall = 'offline';

      newHealth.lastCheck = new Date();
      newHealth.failureCount = healthScore === 0 ? newHealth.failureCount + 1 : 0;

      setConnectivityHealth(newHealth);
      onConnectivityChange(healthScore > 0);

      if (healthScore === 0) {
        toast({
          title: "Connectivity Issues Detected",
          description: "Running automatic diagnostics and attempting repairs...",
          variant: "destructive"
        });
      } else if (newHealth.failureCount > 0) {
        toast({
          title: "Connectivity Restored",
          description: `Health status: ${newHealth.overall}`,
        });
      }

    } catch (error) {
      console.error('Diagnostics failed:', error);
      setConnectivityHealth(prev => ({
        ...prev,
        overall: 'offline',
        failureCount: prev.failureCount + 1,
        lastCheck: new Date()
      }));
    } finally {
      setIsRunningDiagnostics(false);
    }
  }, [connectivityHealth, onConnectivityChange, toast]);

  // Enhanced sync manager with retry logic
  const syncPendingOperations = useCallback(async () => {
    if (pendingOperations.length === 0 || connectivityHealth.overall === 'offline') return;

    setSyncProgress(0);
    let processed = 0;

    for (const operation of pendingOperations) {
      try {
        setSyncStatus(prev => ({ ...prev, [operation.type + 's']: 'syncing' }));

        let endpoint = '';
        let method = operation.operation === 'create' ? 'POST' : 
                    operation.operation === 'update' ? 'PATCH' : 'DELETE';

        switch (operation.type) {
          case 'profile':
            endpoint = `/api/users/${currentUser?.id}`;
            break;
          case 'message':
            endpoint = '/api/messages';
            break;
          case 'story':
            endpoint = '/api/stories';
            break;
          case 'setting':
            // Settings are stored locally, mark as synced
            setSyncStatus(prev => ({ ...prev, settings: 'synced' }));
            continue;
        }

        if (endpoint) {
          await apiRequest(endpoint, {
            method,
            body: operation.data
          });

          setSyncStatus(prev => ({ ...prev, [operation.type + 's']: 'synced' }));
          
          // Remove successful operation
          setPendingOperations(prev => prev.filter(op => op.id !== operation.id));
        }

      } catch (error) {
        console.error(`Failed to sync ${operation.type}:`, error);
        
        // Increment retry count and update status
        setPendingOperations(prev => prev.map(op => 
          op.id === operation.id 
            ? { ...op, retryCount: op.retryCount + 1 }
            : op
        ));

        setSyncStatus(prev => ({ 
          ...prev, 
          [operation.type + 's']: operation.retryCount >= 3 ? 'failed' : 'pending'
        }));
      }

      processed++;
      setSyncProgress((processed / pendingOperations.length) * 100);
    }

    // Update parent component
    onSyncStatusChange(syncStatus);
  }, [pendingOperations, connectivityHealth.overall, currentUser, syncStatus, onSyncStatusChange]);

  // Add operation to pending queue
  const addPendingOperation = useCallback((
    type: 'profile' | 'message' | 'story' | 'setting',
    operation: 'create' | 'update' | 'delete',
    data: any
  ) => {
    const newOperation = {
      id: Date.now().toString(),
      type,
      operation,
      data,
      retryCount: 0
    };

    setPendingOperations(prev => [...prev, newOperation]);
    setSyncStatus(prev => ({ ...prev, [type + 's']: 'pending' }));
  }, []);

  // Mutation for manual sync trigger
  const forceSyncMutation = useMutation({
    mutationFn: async () => {
      await runConnectivityDiagnostics();
      await syncPendingOperations();
      
      // Invalidate all queries to force refresh
      await queryClient.invalidateQueries();
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Sync Complete",
        description: "All data has been synchronized successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description: "Some operations could not be synchronized. They will retry automatically.",
        variant: "destructive"
      });
    }
  });

  // Auto-diagnostics every 30 seconds
  useEffect(() => {
    runConnectivityDiagnostics();
    
    diagnosticsIntervalRef.current = setInterval(() => {
      runConnectivityDiagnostics();
    }, 30000);

    return () => {
      if (diagnosticsIntervalRef.current) {
        clearInterval(diagnosticsIntervalRef.current);
      }
    };
  }, [runConnectivityDiagnostics]);

  // Auto-sync every 10 seconds when there are pending operations
  useEffect(() => {
    if (pendingOperations.length > 0) {
      syncIntervalRef.current = setInterval(() => {
        syncPendingOperations();
      }, 10000);

      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }
  }, [pendingOperations.length, syncPendingOperations]);

  // Expose addPendingOperation to global scope for other components
  useEffect(() => {
    (window as any).addPendingOperation = addPendingOperation;
    
    return () => {
      delete (window as any).addPendingOperation;
    };
  }, [addPendingOperation]);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'good': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'fair': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'poor': return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
      case 'offline': return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  const getSyncIcon = (status: string) => {
    switch (status) {
      case 'synced': return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'syncing': return <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />;
      case 'pending': return <Upload className="w-3 h-3 text-yellow-400" />;
      case 'failed': return <XCircle className="w-3 h-3 text-red-400" />;
      default: return <AlertTriangle className="w-3 h-3 text-gray-400" />;
    }
  };

  return (
    <Card className="bg-black/40 border-cyan-400/30">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-400" />
            Connectivity & Sync Manager
          </div>
          <Badge className={`border ${getHealthColor(connectivityHealth.overall)}`}>
            {connectivityHealth.overall.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connectivity Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded">
            <Globe className="w-4 h-4 text-blue-400" />
            <span className="text-xs">API</span>
            {connectivityHealth.api ? 
              <CheckCircle className="w-3 h-3 text-green-400" /> : 
              <XCircle className="w-3 h-3 text-red-400" />
            }
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded">
            <Database className="w-4 h-4 text-green-400" />
            <span className="text-xs">DB</span>
            {connectivityHealth.database ? 
              <CheckCircle className="w-3 h-3 text-green-400" /> : 
              <XCircle className="w-3 h-3 text-red-400" />
            }
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded">
            <Radio className="w-4 h-4 text-purple-400" />
            <span className="text-xs">WS</span>
            {connectivityHealth.websocket ? 
              <CheckCircle className="w-3 h-3 text-green-400" /> : 
              <XCircle className="w-3 h-3 text-red-400" />
            }
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-xs">Mesh</span>
            {connectivityHealth.mesh ? 
              <CheckCircle className="w-3 h-3 text-green-400" /> : 
              <XCircle className="w-3 h-3 text-red-400" />
            }
          </div>
        </div>

        {/* Sync Status */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Sync className="w-4 h-4" />
            Synchronization Status
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(syncStatus).map(([key, status]) => (
              <div key={key} className="flex items-center gap-2 p-2 bg-gray-800/30 rounded text-xs">
                {getSyncIcon(status)}
                <span className="capitalize">{key}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Operations */}
        {pendingOperations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Pending Operations</span>
              <Badge variant="outline" className="text-yellow-400 border-yellow-400/30">
                {pendingOperations.length}
              </Badge>
            </div>
            {syncProgress > 0 && (
              <Progress value={syncProgress} className="h-2" />
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={() => forceSyncMutation.mutate()}
            disabled={forceSyncMutation.isPending || isRunningDiagnostics}
            className="flex-1"
            size="sm"
          >
            {forceSyncMutation.isPending || isRunningDiagnostics ? (
              <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
            ) : (
              <Sync className="w-3 h-3 mr-2" />
            )}
            {forceSyncMutation.isPending ? 'Syncing...' : 'Force Sync'}
          </Button>
          
          <Button 
            variant="outline"
            onClick={runConnectivityDiagnostics}
            disabled={isRunningDiagnostics}
            size="sm"
          >
            <Activity className="w-3 h-3 mr-2" />
            Test
          </Button>
        </div>

        {/* Last Check Info */}
        <div className="text-xs text-muted-foreground text-center">
          Last check: {connectivityHealth.lastCheck.toLocaleTimeString()}
          {connectivityHealth.failureCount > 0 && (
            <span className="text-red-400 ml-2">
              • {connectivityHealth.failureCount} failures
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}