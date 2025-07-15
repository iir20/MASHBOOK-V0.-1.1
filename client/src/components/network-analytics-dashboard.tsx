import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Download, 
  Upload, 
  Zap,
  Signal,
  Shield,
  FileText,
  Users,
  Network,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useAdvancedMesh } from '@/hooks/use-advanced-mesh';

interface NetworkAnalyticsDashboardProps {
  nodeId: string;
}

export function NetworkAnalyticsDashboard({ nodeId }: NetworkAnalyticsDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'hour' | 'day' | 'week' | 'month'>('hour');
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  
  const {
    isConnected,
    connectionQuality,
    connectionMetrics,
    networkMetrics,
    networkAlerts,
    transferStatus,
    networkAnalytics,
    acknowledgeAlert,
    refetchNetworkMetrics,
    refetchAnalytics
  } = useAdvancedMesh(nodeId);
  
  // Real-time metrics update
  useEffect(() => {
    const interval = setInterval(() => {
      refetchNetworkMetrics();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [refetchNetworkMetrics]);
  
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'degraded': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };
  
  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'good': return <Activity className="w-4 h-4 text-blue-500" />;
      case 'degraded': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const toggleAlertExpansion = (alertId: string) => {
    setExpandedAlerts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alertId)) {
        newSet.delete(alertId);
      } else {
        newSet.add(alertId);
      }
      return newSet;
    });
  };
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const formatSpeed = (bytesPerSecond: number) => {
    return formatBytes(bytesPerSecond) + '/s';
  };
  
  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--cyber-cyan)]">Network Analytics</h1>
          <p className="text-gray-400 mt-1">Advanced mesh network monitoring and performance metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <Badge variant="outline" className={`${getHealthColor(connectionQuality)} border-current`}>
            {connectionQuality}
          </Badge>
        </div>
      </div>
      
      {/* Network Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-morphism">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Health</CardTitle>
            {getHealthIcon(networkMetrics?.currentStatus?.networkHealth || 'unknown')}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--cyber-cyan)]">
              {networkMetrics?.currentStatus?.networkHealth || 'Unknown'}
            </div>
            <p className="text-xs text-gray-400">
              {networkMetrics?.currentStatus?.activeNodes || 0} active nodes
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass-morphism">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Latency</CardTitle>
            <Signal className="w-4 h-4 text-[var(--cyber-yellow)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--cyber-yellow)]">
              {Math.round(networkMetrics?.currentStatus?.averageLatency || 0)}ms
            </div>
            <p className="text-xs text-gray-400">
              Connection quality: {connectionQuality}
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass-morphism">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Throughput</CardTitle>
            <Activity className="w-4 h-4 text-[var(--cyber-magenta)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--cyber-magenta)]">
              {formatSpeed(networkMetrics?.currentStatus?.bandwidth || 0)}
            </div>
            <p className="text-xs text-gray-400">
              {networkMetrics?.currentStatus?.messagesPerSecond || 0} msg/s
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass-morphism">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Packet Loss</CardTitle>
            <TrendingDown className="w-4 h-4 text-[var(--cyber-red)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--cyber-red)]">
              {(networkMetrics?.currentStatus?.packetLoss || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-400">
              Network reliability indicator
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Dashboard */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="nodes">Nodes</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Connection Quality */}
            <Card className="glass-morphism">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Network className="w-5 h-5" />
                  <span>Connection Quality</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Latency</span>
                    <span className="text-sm font-mono">{connectionMetrics.latency}ms</span>
                  </div>
                  <Progress 
                    value={Math.max(0, 100 - (connectionMetrics.latency / 10))} 
                    className="h-2"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Bandwidth</span>
                    <span className="text-sm font-mono">{formatSpeed(connectionMetrics.bandwidth)}</span>
                  </div>
                  <Progress 
                    value={Math.min(100, (connectionMetrics.bandwidth / 1000) * 100)} 
                    className="h-2"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Reliability</span>
                    <span className="text-sm font-mono">{(connectionMetrics.reliability * 100).toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={connectionMetrics.reliability * 100} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Network Statistics */}
            <Card className="glass-morphism">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Network Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--cyber-cyan)]">
                      {networkMetrics?.networkStats?.totalNodes || 0}
                    </div>
                    <div className="text-sm text-gray-400">Total Nodes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--cyber-green)]">
                      {networkMetrics?.networkStats?.activeRoutes || 0}
                    </div>
                    <div className="text-sm text-gray-400">Active Routes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--cyber-yellow)]">
                      {Math.round(networkMetrics?.networkStats?.averageLatency || 0)}ms
                    </div>
                    <div className="text-sm text-gray-400">Avg Latency</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--cyber-magenta)]">
                      {((networkMetrics?.networkStats?.networkReliability || 0) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-400">Reliability</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="transfers" className="space-y-4">
          <Card className="glass-morphism">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>File Transfers</span>
              </CardTitle>
              <CardDescription>
                Active file transfers and statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transferStatus?.activeTransfers?.length ? (
                <div className="space-y-4">
                  {transferStatus.activeTransfers.map((transfer) => (
                    <div key={transfer.transferId} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{transfer.fileName}</span>
                        <Badge variant="outline">{transfer.status}</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{transfer.progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={transfer.progress} className="h-2" />
                        <div className="flex justify-between text-sm text-gray-400">
                          <span>Speed: {formatSpeed(transfer.speed)}</span>
                          <span>ETA: {Math.round(transfer.eta)}s</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No active transfers
                </div>
              )}
              
              {/* Transfer Statistics */}
              {transferStatus?.statistics && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-medium mb-4">Transfer Statistics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-[var(--cyber-cyan)]">
                        {transferStatus.statistics.totalTransfers}
                      </div>
                      <div className="text-sm text-gray-400">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-[var(--cyber-green)]">
                        {transferStatus.statistics.completedTransfers}
                      </div>
                      <div className="text-sm text-gray-400">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-[var(--cyber-red)]">
                        {transferStatus.statistics.failedTransfers}
                      </div>
                      <div className="text-sm text-gray-400">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-[var(--cyber-yellow)]">
                        {formatBytes(transferStatus.statistics.totalBytesTransferred)}
                      </div>
                      <div className="text-sm text-gray-400">Total Data</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="alerts" className="space-y-4">
          <Card className="glass-morphism">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Network Alerts</span>
              </CardTitle>
              <CardDescription>
                System alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {networkAlerts.length ? (
                <div className="space-y-3">
                  {networkAlerts.map((alert) => (
                    <Alert key={alert.id} className="glass-morphism">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <Badge className={getSeverityColor(alert.severity)}>
                                {alert.severity}
                              </Badge>
                              <span className="text-sm text-gray-400">
                                {new Date(alert.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm">{alert.message}</p>
                            {alert.nodeId && (
                              <p className="text-xs text-gray-400 mt-1">
                                Node: {alert.nodeId}
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            {!alert.acknowledged && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => acknowledgeAlert(alert.id)}
                              >
                                Acknowledge
                              </Button>
                            )}
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No active alerts
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <Card className="glass-morphism">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Network Analytics</span>
              </CardTitle>
              <CardDescription>
                Historical performance data and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-400">
                Advanced analytics visualization coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}