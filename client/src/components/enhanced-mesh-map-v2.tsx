import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@shared/schema';
import { FuturisticCard, GlowButton, NeonText, AnimatedBackground } from './modern-futuristic-theme';

import {
  Network,
  Wifi,
  Signal,
  Zap,
  Users,
  MapPin,
  Radar,
  Activity,
  Shield,
  Bluetooth,
  Radio,
  Globe,
  Eye,
  MessageSquare,
  UserPlus,
  RefreshCw
} from 'lucide-react';

interface MeshNode {
  id: string;
  userId: number;
  user: User;
  position: { x: number; y: number };
  signalStrength: number;
  distance: number;
  connectionType: 'direct' | 'relay' | 'mesh';
  isActive: boolean;
  lastSeen: Date;
  connections: string[];
  hops: number;
}

interface NetworkStats {
  totalNodes: number;
  activeConnections: number;
  averageHops: number;
  networkHealth: number;
  signalQuality: 'poor' | 'fair' | 'good' | 'excellent';
}

interface EnhancedMeshMapV2Props {
  currentUser: User | null;
  availableUsers: User[];
  onUserSelect: (user: User | null) => void;
  isOffline: boolean;
  wsState: {
    isConnected: boolean;
    sendMessage: (message: any) => void;
  };
}

export function EnhancedMeshMapV2({ 
  currentUser, 
  availableUsers, 
  onUserSelect, 
  isOffline, 
  wsState 
}: EnhancedMeshMapV2Props) {
  const [viewMode, setViewMode] = useState<'grid' | 'radar' | 'orbit'>('radar');
  const [selectedNode, setSelectedNode] = useState<MeshNode | null>(null);
  const [meshNodes, setMeshNodes] = useState<MeshNode[]>([]);
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    totalNodes: 0,
    activeConnections: 0,
    averageHops: 1.2,
    networkHealth: 85,
    signalQuality: 'good'
  });
  const [isScanning, setIsScanning] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const { toast } = useToast();

  // Generate realistic mesh nodes from available users
  useEffect(() => {
    const generateMeshNodes = () => {
      const nodes: MeshNode[] = availableUsers.map((user, index) => {
        const angle = (index / availableUsers.length) * 2 * Math.PI;
        const radius = 80 + Math.random() * 60;
        
        return {
          id: `node-${user.id}`,
          userId: user.id,
          user,
          position: {
            x: 150 + Math.cos(angle) * radius,
            y: 150 + Math.sin(angle) * radius
          },
          signalStrength: 60 + Math.random() * 40,
          distance: Math.random() * 500 + 50,
          connectionType: Math.random() > 0.7 ? 'direct' : 'mesh',
          isActive: user.isOnline,
          lastSeen: new Date(Date.now() - Math.random() * 3600000),
          connections: [],
          hops: Math.floor(Math.random() * 3) + 1
        };
      });
      
      // Generate connections between nearby nodes
      nodes.forEach((node, i) => {
        const connections: string[] = [];
        nodes.forEach((otherNode, j) => {
          if (i !== j && Math.random() > 0.6) {
            const distance = Math.sqrt(
              Math.pow(node.position.x - otherNode.position.x, 2) + 
              Math.pow(node.position.y - otherNode.position.y, 2)
            );
            if (distance < 120) {
              connections.push(otherNode.id);
            }
          }
        });
        node.connections = connections;
      });
      
      setMeshNodes(nodes);
      
      // Update network stats
      const activeNodes = nodes.filter(n => n.isActive);
      const totalConnections = nodes.reduce((sum, n) => sum + n.connections.length, 0);
      
      setNetworkStats({
        totalNodes: nodes.length,
        activeConnections: activeNodes.length,
        averageHops: nodes.reduce((sum, n) => sum + n.hops, 0) / nodes.length,
        networkHealth: Math.min(100, (activeNodes.length / nodes.length) * 100 + Math.random() * 10),
        signalQuality: activeNodes.length > 5 ? 'excellent' : activeNodes.length > 3 ? 'good' : 'fair'
      });
    };
    
    generateMeshNodes();
    
    // Update every 10 seconds
    const interval = setInterval(generateMeshNodes, 10000);
    return () => clearInterval(interval);
  }, [availableUsers]);

  // Canvas animation for radar mode
  useEffect(() => {
    if (viewMode !== 'radar' || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let angle = 0;
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.min(centerX, centerY) - 20;
      
      // Draw radar background
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
      ctx.lineWidth = 1;
      
      // Concentric circles
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (maxRadius / 4) * i, 0, 2 * Math.PI);
        ctx.stroke();
      }
      
      // Cross lines
      ctx.beginPath();
      ctx.moveTo(centerX - maxRadius, centerY);
      ctx.lineTo(centerX + maxRadius, centerY);
      ctx.moveTo(centerX, centerY - maxRadius);
      ctx.lineTo(centerX, centerY + maxRadius);
      ctx.stroke();
      
      // Radar sweep
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * maxRadius,
        centerY + Math.sin(angle) * maxRadius
      );
      ctx.stroke();
      
      // Radar sweep gradient
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
      gradient.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
      gradient.addColorStop(0.7, 'rgba(6, 182, 212, 0.2)');
      gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, maxRadius, angle - 0.5, angle + 0.1);
      ctx.closePath();
      ctx.fill();
      
      // Draw nodes
      meshNodes.forEach((node, index) => {
        const nodeAngle = (index / meshNodes.length) * 2 * Math.PI;
        const nodeRadius = (node.signalStrength / 100) * maxRadius * 0.8;
        const x = centerX + Math.cos(nodeAngle) * nodeRadius;
        const y = centerY + Math.sin(nodeAngle) * nodeRadius;
        
        // Node circle
        ctx.fillStyle = node.isActive ? 'rgba(34, 197, 94, 0.8)' : 'rgba(156, 163, 175, 0.8)';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        // Node pulse effect for active nodes
        if (node.isActive) {
          ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 8 + Math.sin(Date.now() * 0.005) * 3, 0, 2 * Math.PI);
          ctx.stroke();
        }
      });
      
      angle += 0.05;
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [viewMode, meshNodes]);

  // Handle node scanning
  const handleScan = () => {
    setIsScanning(true);
    toast({
      title: "Scanning Network",
      description: "Discovering nearby mesh nodes...",
    });
    
    setTimeout(() => {
      setIsScanning(false);
      toast({
        title: "Scan Complete",
        description: `Found ${meshNodes.length} mesh nodes in range.`,
      });
    }, 3000);
  };

  // Handle node connection
  const handleConnectToNode = (node: MeshNode) => {
    if (!wsState.isConnected) {
      toast({
        title: "Connection Failed",
        description: "You need to be online to connect to mesh nodes.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Connecting to Node",
      description: `Establishing connection to ${node.user.alias}...`,
    });
    
    // Simulate connection
    setTimeout(() => {
      toast({
        title: "Connected Successfully",
        description: `Now connected to ${node.user.alias} via ${node.connectionType} connection.`,
      });
      onUserSelect(node.user);
    }, 2000);
  };

  // Get signal quality color
  const getSignalColor = (strength: number) => {
    if (strength >= 80) return 'text-green-500';
    if (strength >= 60) return 'text-yellow-500';
    if (strength >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-full space-y-6">
      <AnimatedBackground>
        <div></div>
      </AnimatedBackground>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <NeonText className="text-2xl font-bold flex items-center gap-2">
            <Network className="h-6 w-6" />
            Mesh Network Map
          </NeonText>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <span>{networkStats.totalNodes} total nodes</span>
            <span>{networkStats.activeConnections} active</span>
            <Badge variant={networkStats.signalQuality === 'excellent' ? 'default' : 'secondary'}>
              {networkStats.signalQuality} signal
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border">
            <Button
              variant={viewMode === 'radar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('radar')}
            >
              <Radar className="h-4 w-4 mr-1" />
              Radar
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Network className="h-4 w-4 mr-1" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'orbit' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('orbit')}
            >
              <Globe className="h-4 w-4 mr-1" />
              Orbit
            </Button>
          </div>
          
          <GlowButton onClick={handleScan} disabled={isScanning} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning...' : 'Scan'}
          </GlowButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Network Visualization */}
        <div className="lg:col-span-2">
          <FuturisticCard className="h-[500px]">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Live Network View
                </span>
                <Badge variant={wsState.isConnected ? 'default' : 'destructive'}>
                  {wsState.isConnected ? 'Online' : 'Offline'}
                </Badge>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-0">
              {viewMode === 'radar' && (
                <div className="relative w-full h-[400px] flex items-center justify-center">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={400}
                    className="border border-cyan-400/30 rounded-full bg-black/20"
                  />
                  
                  {/* Central node (current user) */}
                  {currentUser && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <Avatar className="h-8 w-8 border-2 border-cyan-400">
                        <AvatarImage src={currentUser.avatar} />
                        <AvatarFallback>{currentUser.alias.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                </div>
              )}
              
              {viewMode === 'grid' && (
                <div className="p-6 h-[400px] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {meshNodes.map((node) => (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className="p-4 border border-muted rounded-lg hover:border-cyan-400/50 cursor-pointer transition-all duration-200 bg-muted/20"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={node.user.avatar} />
                              <AvatarFallback>{node.user.alias.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{node.user.alias}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Signal className={`h-4 w-4 ${getSignalColor(node.signalStrength)}`} />
                            <span className="text-xs">{Math.round(node.signalStrength)}%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{node.distance}m away</span>
                          <span>{node.hops} hop{node.hops !== 1 ? 's' : ''}</span>
                          <Badge variant={node.isActive ? 'default' : 'secondary'} className="text-xs">
                            {node.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {viewMode === 'orbit' && (
                <div className="relative w-full h-[400px] flex items-center justify-center bg-gradient-to-br from-purple-900/10 to-cyan-900/10">
                  <div className="relative w-80 h-80">
                    {/* Central hub */}
                    {currentUser && (
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                        <div className="relative">
                          <Avatar className="h-12 w-12 border-4 border-cyan-400 shadow-lg">
                            <AvatarImage src={currentUser.avatar} />
                            <AvatarFallback>{currentUser.alias.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="absolute inset-0 rounded-full border-4 border-cyan-400/30 animate-ping"></div>
                        </div>
                      </div>
                    )}
                    
                    {/* Orbiting nodes */}
                    {meshNodes.map((node, index) => {
                      const angle = (index / meshNodes.length) * 2 * Math.PI + (Date.now() * 0.0005);
                      const radius = 100 + (node.signalStrength / 100) * 40;
                      const x = Math.cos(angle) * radius;
                      const y = Math.sin(angle) * radius;
                      
                      return (
                        <div
                          key={node.id}
                          onClick={() => handleConnectToNode(node)}
                          className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-110"
                          style={{
                            left: `calc(50% + ${x}px)`,
                            top: `calc(50% + ${y}px)`,
                          }}
                        >
                          <div className="relative">
                            <Avatar className={`h-8 w-8 border-2 ${node.isActive ? 'border-green-400' : 'border-gray-400'}`}>
                              <AvatarImage src={node.user.avatar} />
                              <AvatarFallback className="text-xs">
                                {node.user.alias.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            
                            {node.isActive && (
                              <div className="absolute inset-0 rounded-full border-2 border-green-400/50 animate-pulse"></div>
                            )}
                            
                            {/* Connection line */}
                            <div
                              className="absolute top-1/2 left-1/2 h-px bg-gradient-to-r from-cyan-400/50 to-transparent origin-left"
                              style={{
                                width: `${radius}px`,
                                transform: `translate(-50%, -50%) rotate(${angle + Math.PI}rad)`,
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </FuturisticCard>
        </div>

        {/* Network Stats & Controls */}
        <div className="space-y-4">
          {/* Network Health */}
          <FuturisticCard>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Network Health
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Health</span>
                  <span className="font-medium">{Math.round(networkStats.networkHealth)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${networkStats.networkHealth}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xl font-bold text-cyan-400">{networkStats.totalNodes}</p>
                  <p className="text-xs text-muted-foreground">Total Nodes</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xl font-bold text-green-400">{networkStats.activeConnections}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Avg. Hops: <span className="font-medium">{networkStats.averageHops.toFixed(1)}</span>
                </p>
              </div>
            </CardContent>
          </FuturisticCard>

          {/* Selected Node Details */}
          {selectedNode && (
            <FuturisticCard>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Node Details
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedNode(null)}
                  >
                    ×
                  </Button>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedNode.user.avatar} />
                    <AvatarFallback>{selectedNode.user.alias.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedNode.user.alias}</p>
                    <p className="text-sm text-muted-foreground">{selectedNode.user.profile}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Signal Strength</span>
                    <span className={getSignalColor(selectedNode.signalStrength)}>
                      {Math.round(selectedNode.signalStrength)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Distance</span>
                    <span>{Math.round(selectedNode.distance)}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Connection Type</span>
                    <Badge variant="outline">{selectedNode.connectionType}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Hops</span>
                    <span>{selectedNode.hops}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Seen</span>
                    <span>{formatTimeAgo(selectedNode.lastSeen)}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <GlowButton
                    onClick={() => handleConnectToNode(selectedNode)}
                    disabled={!selectedNode.isActive}
                    className="flex-1"
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Message
                  </GlowButton>
                  <Button variant="outline" size="icon">
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </FuturisticCard>
          )}

          {/* Connection Stats */}
          <FuturisticCard>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Connection Stats
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  <span>Direct Connections</span>
                </div>
                <span className="font-medium">
                  {meshNodes.filter(n => n.connectionType === 'direct').length}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  <span>Mesh Relays</span>
                </div>
                <span className="font-medium">
                  {meshNodes.filter(n => n.connectionType === 'mesh').length}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Bluetooth className="h-4 w-4" />
                  <span>Bluetooth</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {Math.floor(Math.random() * 5) + 1} devices
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4" />
                  <span>WebRTC</span>
                </div>
                <Badge variant={wsState.isConnected ? 'default' : 'destructive'} className="text-xs">
                  {wsState.isConnected ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </FuturisticCard>
        </div>
      </div>
    </div>
  );
}