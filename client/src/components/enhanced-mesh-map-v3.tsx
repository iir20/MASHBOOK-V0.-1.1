import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@shared/schema';
import { FuturisticCard, GlowButton, NeonText } from './modern-futuristic-theme';
import { ThreeDMeshVisualization } from './three-d-mesh-visualization';

import {
  Network, Users, Eye, MessageSquare, Signal, Bluetooth, Globe,
  Wifi, Radio, Radar, Zap, Activity, Star, Shield, Target,
  Search, Filter, MapPin, Layers, RotateCcw, Play, Pause, Box
} from 'lucide-react';

interface MeshNode {
  id: string;
  userId: number;
  alias: string;
  avatar: string;
  position: { x: number; y: number; z?: number };
  connections: string[];
  signalStrength: number;
  status: 'online' | 'connecting' | 'offline';
  connectionType: 'webrtc' | 'websocket' | 'bluetooth' | 'mesh';
  latency: number;
  reputation: number;
  distance: number;
  lastSeen: Date;
  capabilities: string[];
}

interface NetworkStats {
  totalNodes: number;
  activeConnections: number;
  averageLatency: number;
  meshCoverage: number;
  dataTransferred: number;
}

interface EnhancedMeshMapV3Props {
  currentUser: User | null;
  availableUsers: User[];
  isOffline: boolean;
  onUserSelect: (user: User) => void;
  wsState: {
    isConnected: boolean;
    sendMessage: (message: any) => void;
  };
}

export function EnhancedMeshMapV3({ 
  currentUser, 
  availableUsers, 
  isOffline, 
  onUserSelect,
  wsState 
}: EnhancedMeshMapV3Props) {
  const [meshNodes, setMeshNodes] = useState<MeshNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'2d' | '3d' | 'radar'>('2d');
  const [isAnimated, setIsAnimated] = useState(true);
  const [filter, setFilter] = useState<'all' | 'connected' | 'nearby'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    totalNodes: 0,
    activeConnections: 0,
    averageLatency: 0,
    meshCoverage: 0,
    dataTransferred: 0
  });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const radarAngleRef = useRef(0);
  
  const { toast } = useToast();

  // Generate mesh nodes from available users
  useEffect(() => {
    const nodes: MeshNode[] = availableUsers.map((user, index) => {
      const angle = (index / availableUsers.length) * 2 * Math.PI;
      const radius = 150 + Math.random() * 100;
      
      return {
        id: `node-${user.id}`,
        userId: user.id,
        alias: user.alias,
        avatar: user.avatar,
        position: {
          x: 300 + Math.cos(angle) * radius,
          y: 300 + Math.sin(angle) * radius,
          z: Math.random() * 100
        },
        connections: availableUsers
          .filter(u => u.id !== user.id && Math.random() > 0.6)
          .slice(0, 3)
          .map(u => `node-${u.id}`),
        signalStrength: Math.floor(Math.random() * 100),
        status: Math.random() > 0.7 ? 'offline' : Math.random() > 0.3 ? 'online' : 'connecting',
        connectionType: ['webrtc', 'websocket', 'bluetooth', 'mesh'][Math.floor(Math.random() * 4)] as any,
        latency: Math.floor(Math.random() * 200) + 10,
        reputation: Math.floor(Math.random() * 100),
        distance: Math.floor(Math.random() * 1000) + 50,
        lastSeen: new Date(Date.now() - Math.random() * 3600000),
        capabilities: ['relay', 'encryption', 'storage'].filter(() => Math.random() > 0.5)
      };
    });
    
    setMeshNodes(nodes);
    
    // Update network stats
    const activeNodes = nodes.filter(n => n.status === 'online');
    const totalConnections = nodes.reduce((sum, n) => sum + n.connections.length, 0);
    const avgLatency = activeNodes.reduce((sum, n) => sum + n.latency, 0) / activeNodes.length || 0;
    
    setNetworkStats({
      totalNodes: nodes.length,
      activeConnections: totalConnections,
      averageLatency: Math.floor(avgLatency),
      meshCoverage: Math.floor((activeNodes.length / nodes.length) * 100),
      dataTransferred: Math.floor(Math.random() * 1000) + 500
    });
  }, [availableUsers]);

  // Canvas drawing functions
  const drawNode = useCallback((ctx: CanvasRenderingContext2D, node: MeshNode, isSelected: boolean) => {
    const { x, y } = node.position;
    
    // Node glow effect
    if (node.status === 'online') {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 30);
      gradient.addColorStop(0, getStatusColor(node.status, 0.8));
      gradient.addColorStop(1, getStatusColor(node.status, 0));
      ctx.fillStyle = gradient;
      ctx.fillRect(x - 30, y - 30, 60, 60);
    }
    
    // Node circle
    ctx.beginPath();
    ctx.arc(x, y, isSelected ? 20 : 15, 0, 2 * Math.PI);
    ctx.fillStyle = getStatusColor(node.status, 0.8);
    ctx.fill();
    ctx.strokeStyle = isSelected ? '#ffffff' : getStatusColor(node.status, 1);
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.stroke();
    
    // Signal strength indicator
    const signalBars = Math.floor(node.signalStrength / 25);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i < signalBars ? getStatusColor(node.status, 0.8) : 'rgba(255,255,255,0.2)';
      ctx.fillRect(x + 20 + i * 3, y - 10 + i * 2, 2, 8 - i * 2);
    }
    
    // Node label
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(node.alias, x, y + 35);
    
    // Connection type icon
    ctx.fillStyle = getConnectionTypeColor(node.connectionType);
    ctx.font = '8px monospace';
    ctx.fillText(getConnectionTypeIcon(node.connectionType), x, y - 25);
  }, []);

  const drawConnection = useCallback((ctx: CanvasRenderingContext2D, from: MeshNode, to: MeshNode) => {
    const fromPos = from.position;
    const toPos = to.position;
    
    // Animated connection line
    ctx.beginPath();
    ctx.moveTo(fromPos.x, fromPos.y);
    ctx.lineTo(toPos.x, toPos.y);
    
    const gradient = ctx.createLinearGradient(fromPos.x, fromPos.y, toPos.x, toPos.y);
    gradient.addColorStop(0, getStatusColor(from.status, 0.6));
    gradient.addColorStop(0.5, '#4ade80');
    gradient.addColorStop(1, getStatusColor(to.status, 0.6));
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Data flow animation
    if (isAnimated && from.status === 'online' && to.status === 'online') {
      const time = Date.now() * 0.005;
      const progress = (Math.sin(time) + 1) / 2;
      const flowX = fromPos.x + (toPos.x - fromPos.x) * progress;
      const flowY = fromPos.y + (toPos.y - fromPos.y) * progress;
      
      ctx.beginPath();
      ctx.arc(flowX, flowY, 3, 0, 2 * Math.PI);
      ctx.fillStyle = '#00ffff';
      ctx.fill();
    }
  }, [isAnimated]);

  const drawRadarView = useCallback((ctx: CanvasRenderingContext2D) => {
    const centerX = 300;
    const centerY = 300;
    const maxRadius = 250;
    
    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, 600, 600);
    
    // Radar circles
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (maxRadius / 5) * i, 0, 2 * Math.PI);
      ctx.strokeStyle = `rgba(0, 255, 255, ${0.3 - i * 0.05})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    // Radar sweep
    const sweepAngle = radarAngleRef.current;
    const gradient = ctx.createConicGradient(sweepAngle, centerX, centerY);
    gradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
    gradient.addColorStop(0.1, 'rgba(0, 255, 255, 0.8)');
    gradient.addColorStop(0.2, 'rgba(0, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 600);
    
    // Plot nodes on radar
    meshNodes.forEach(node => {
      const distance = Math.sqrt(
        Math.pow(node.position.x - centerX, 2) + 
        Math.pow(node.position.y - centerY, 2)
      );
      const angle = Math.atan2(node.position.y - centerY, node.position.x - centerX);
      const radarRadius = (distance / maxRadius) * maxRadius;
      
      if (radarRadius <= maxRadius) {
        const x = centerX + Math.cos(angle) * radarRadius;
        const y = centerY + Math.sin(angle) * radarRadius;
        
        ctx.beginPath();
        ctx.arc(x, y, node.status === 'online' ? 5 : 3, 0, 2 * Math.PI);
        ctx.fillStyle = getStatusColor(node.status, 1);
        ctx.fill();
        
        // Pulse effect for online nodes
        if (node.status === 'online') {
          const pulseRadius = 5 + Math.sin(Date.now() * 0.01) * 3;
          ctx.beginPath();
          ctx.arc(x, y, pulseRadius, 0, 2 * Math.PI);
          ctx.strokeStyle = getStatusColor(node.status, 0.5);
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    });
    
    radarAngleRef.current += 0.05;
  }, [meshNodes]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = 'rgba(0, 10, 20, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (viewMode === 'radar') {
      drawRadarView(ctx);
    } else {
      // Draw connections first
      meshNodes.forEach(node => {
        node.connections.forEach(connectionId => {
          const connectedNode = meshNodes.find(n => n.id === connectionId);
          if (connectedNode) {
            drawConnection(ctx, node, connectedNode);
          }
        });
      });
      
      // Draw nodes on top
      meshNodes.forEach(node => {
        const isSelected = selectedNode === node.id;
        drawNode(ctx, node, isSelected);
      });
    }
    
    if (isAnimated) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [meshNodes, selectedNode, viewMode, isAnimated, drawRadarView, drawConnection, drawNode]);

  // Start animation
  useEffect(() => {
    if (isAnimated) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      animate(); // Draw once
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, isAnimated]);

  // Handle canvas click
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // Find clicked node
    const clickedNode = meshNodes.find(node => {
      const distance = Math.sqrt(
        Math.pow(clickX - node.position.x, 2) + 
        Math.pow(clickY - node.position.y, 2)
      );
      return distance <= 20;
    });
    
    if (clickedNode) {
      setSelectedNode(clickedNode.id);
      const user = availableUsers.find(u => u.id === clickedNode.userId);
      if (user) {
        onUserSelect(user);
        toast({
          title: "Node Selected",
          description: `Connected to ${clickedNode.alias}`
        });
      }
    } else {
      setSelectedNode(null);
    }
  }, [meshNodes, availableUsers, onUserSelect, toast]);

  const getStatusColor = (status: string, alpha: number = 1) => {
    switch (status) {
      case 'online': return `rgba(74, 222, 128, ${alpha})`;
      case 'connecting': return `rgba(251, 191, 36, ${alpha})`;
      case 'offline': return `rgba(156, 163, 175, ${alpha})`;
      default: return `rgba(156, 163, 175, ${alpha})`;
    }
  };

  const getConnectionTypeColor = (type: string) => {
    switch (type) {
      case 'webrtc': return '#3b82f6';
      case 'websocket': return '#10b981';
      case 'bluetooth': return '#8b5cf6';
      case 'mesh': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getConnectionTypeIcon = (type: string) => {
    switch (type) {
      case 'webrtc': return '⚡';
      case 'websocket': return '🌐';
      case 'bluetooth': return '📡';
      case 'mesh': return '🕸️';
      default: return '?';
    }
  };

  const filteredNodes = meshNodes.filter(node => {
    const matchesFilter = filter === 'all' || 
                         (filter === 'connected' && node.status === 'online') ||
                         (filter === 'nearby' && node.distance < 500);
    const matchesSearch = node.alias.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const selectedNodeData = selectedNode ? meshNodes.find(n => n.id === selectedNode) : null;

  return (
    <div className="space-y-4">
      {/* Network Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <FuturisticCard className="p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-400" />
            <div>
              <div className="text-2xl font-bold">{networkStats.totalNodes}</div>
              <div className="text-xs text-muted-foreground">Total Nodes</div>
            </div>
          </div>
        </FuturisticCard>
        
        <FuturisticCard className="p-4">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-green-400" />
            <div>
              <div className="text-2xl font-bold">{networkStats.activeConnections}</div>
              <div className="text-xs text-muted-foreground">Active Links</div>
            </div>
          </div>
        </FuturisticCard>
        
        <FuturisticCard className="p-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-400" />
            <div>
              <div className="text-2xl font-bold">{networkStats.averageLatency}ms</div>
              <div className="text-xs text-muted-foreground">Avg Latency</div>
            </div>
          </div>
        </FuturisticCard>
        
        <FuturisticCard className="p-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-400" />
            <div>
              <div className="text-2xl font-bold">{networkStats.meshCoverage}%</div>
              <div className="text-xs text-muted-foreground">Coverage</div>
            </div>
          </div>
        </FuturisticCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Map */}
        <div className="lg:col-span-2">
          <FuturisticCard>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="flex items-center gap-2">
                <Radar className="h-5 w-5 text-blue-400" />
                <NeonText>Mesh Network Map</NeonText>
              </CardTitle>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === '2d' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('2d')}
                >
                  <Layers className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === '3d' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('3d')}
                >
                  <Box className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'radar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('radar')}
                >
                  <Radar className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAnimated(!isAnimated)}
                >
                  {isAnimated ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              {viewMode === '3d' ? (
                <ThreeDMeshVisualization
                  currentUser={currentUser}
                  availableUsers={availableUsers}
                  isOffline={isOffline}
                  onNodeSelect={onUserSelect}
                />
              ) : (
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={400}
                  className="w-full bg-black/20 rounded-lg border border-blue-500/30 cursor-pointer"
                  onClick={handleCanvasClick}
                />
              )}
            </CardContent>
          </FuturisticCard>
        </div>

        {/* Control Panel */}
        <div className="space-y-4">
          {/* Filters */}
          <FuturisticCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Search nodes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8"
                />
              </div>
              
              <div className="flex gap-1">
                <Button
                  variant={filter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('all')}
                  className="flex-1"
                >
                  All
                </Button>
                <Button
                  variant={filter === 'connected' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('connected')}
                  className="flex-1"
                >
                  Online
                </Button>
                <Button
                  variant={filter === 'nearby' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('nearby')}
                  className="flex-1"
                >
                  Nearby
                </Button>
              </div>
            </CardContent>
          </FuturisticCard>

          {/* Selected Node Info */}
          {selectedNodeData && (
            <FuturisticCard>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Node Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedNodeData.avatar} />
                    <AvatarFallback>
                      {selectedNodeData.alias.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{selectedNodeData.alias}</div>
                    <Badge variant="outline" className={getStatusColor(selectedNodeData.status).replace('1)', '0.8)')}>
                      {selectedNodeData.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Signal:</span>
                    <span>{selectedNodeData.signalStrength}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Latency:</span>
                    <span>{selectedNodeData.latency}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Distance:</span>
                    <span>{selectedNodeData.distance}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reputation:</span>
                    <span>{selectedNodeData.reputation}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <Badge variant="outline" className="text-xs">
                      {selectedNodeData.connectionType}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <GlowButton size="sm" className="flex-1">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Chat
                  </GlowButton>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </FuturisticCard>
          )}

          {/* Node List */}
          <FuturisticCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Nodes ({filteredNodes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {filteredNodes.map(node => (
                  <div
                    key={node.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                      selectedNode === node.id 
                        ? 'bg-blue-500/20 border border-blue-500/30' 
                        : 'hover:bg-muted/20'
                    }`}
                    onClick={() => setSelectedNode(node.id)}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={node.avatar} />
                      <AvatarFallback className="text-xs">
                        {node.alias.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{node.alias}</div>
                      <div className="text-xs text-muted-foreground">
                        {node.latency}ms • {node.distance}m
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getStatusColor(node.status).replace('1)', '0.8)')}`}
                    >
                      {node.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </FuturisticCard>
        </div>
      </div>
    </div>
  );
}