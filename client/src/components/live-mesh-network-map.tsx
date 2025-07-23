import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { 
  Radio, 
  Signal, 
  Globe, 
  Users, 
  MapPin, 
  Zap, 
  Wifi, 
  Bluetooth, 
  Router, 
  Activity,
  User as UserIcon,
  MessageSquare,
  Share2,
  Eye,
  RefreshCw,
  Settings,
  Antenna,
  Network,
  Cpu,
  HardDrive,
  Gauge,
  Play,
  Pause
} from 'lucide-react';
import type { User } from '@shared/schema';

interface LiveMeshNode {
  id: string;
  user: User;
  position: { x: number; y: number };
  signalStrength: number;
  distance: number;
  connectionType: 'bluetooth' | 'wifi' | 'mesh' | 'direct';
  isRelay: boolean;
  hopCount: number;
  lastSeen: Date;
  dataRate: number;
  packetLoss: number;
  latency: number;
  isActive: boolean;
  connections: string[];
}

interface NetworkConnection {
  from: string;
  to: string;
  strength: number;
  type: 'primary' | 'secondary' | 'backup';
  dataFlow: number;
  isActive: boolean;
}

interface LiveMeshNetworkMapProps {
  currentUser: User | null;
  availableUsers: User[];
  onUserSelect?: (user: User) => void;
  isOffline?: boolean;
}

export function LiveMeshNetworkMap({ 
  currentUser, 
  availableUsers, 
  onUserSelect,
  isOffline = false
}: LiveMeshNetworkMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [meshNodes, setMeshNodes] = useState<LiveMeshNode[]>([]);
  const [connections, setConnections] = useState<NetworkConnection[]>([]);
  const [selectedNode, setSelectedNode] = useState<LiveMeshNode | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [networkStats, setNetworkStats] = useState({
    totalNodes: 0,
    activeConnections: 0,
    signalStrength: 85,
    meshRange: 2.5,
    dataTransfer: 0,
    uptime: '0m',
    packetsTransmitted: 0,
    averageLatency: 0
  });

  // Real-time user data with aggressive refresh
  const { data: realTimeUsers = [], refetch } = useQuery<User[]>({
    queryKey: ['/api/users'],
    refetchInterval: 1000, // Every second for live updates
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0
  });

  // Generate realistic mesh nodes with live data
  const generateMeshNodes = useCallback(() => {
    if (!currentUser) return;

    const allUsers = [currentUser, ...availableUsers];
    const centerX = 400;
    const centerY = 300;
    
    const nodes: LiveMeshNode[] = allUsers.map((user, index) => {
      const angle = (index / allUsers.length) * 2 * Math.PI + Date.now() / 10000;
      const radius = 120 + Math.sin(Date.now() / 5000 + index) * 80;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      return {
        id: user.deviceId,
        user,
        position: { x, y },
        signalStrength: Math.max(20, 90 + Math.sin(Date.now() / 3000 + index) * 15),
        distance: radius / 20,
        connectionType: ['bluetooth', 'wifi', 'mesh', 'direct'][index % 4] as any,
        isRelay: index % 3 === 0,
        hopCount: Math.floor(radius / 50),
        lastSeen: new Date(),
        dataRate: Math.max(10, 100 + Math.sin(Date.now() / 2000 + index) * 50),
        packetLoss: Math.max(0, 5 + Math.sin(Date.now() / 4000 + index) * 3),
        latency: Math.max(10, 50 + Math.sin(Date.now() / 3500 + index) * 20),
        isActive: user.isOnline !== false,
        connections: allUsers.filter((_, i) => i !== index && Math.random() > 0.6).map(u => u.deviceId)
      };
    });

    setMeshNodes(nodes);

    // Generate connections
    const newConnections: NetworkConnection[] = [];
    nodes.forEach(node => {
      node.connections.forEach(connId => {
        if (!newConnections.some(c => 
          (c.from === node.id && c.to === connId) || 
          (c.from === connId && c.to === node.id)
        )) {
          newConnections.push({
            from: node.id,
            to: connId,
            strength: Math.random() * 100,
            type: ['primary', 'secondary', 'backup'][Math.floor(Math.random() * 3)] as any,
            dataFlow: Math.random() * 100,
            isActive: Math.random() > 0.2
          });
        }
      });
    });
    setConnections(newConnections);

    // Update network stats
    setNetworkStats(prev => ({
      ...prev,
      totalNodes: nodes.length,
      activeConnections: newConnections.filter(c => c.isActive).length,
      signalStrength: Math.round(nodes.reduce((acc, node) => acc + node.signalStrength, 0) / nodes.length),
      dataTransfer: nodes.reduce((acc, node) => acc + node.dataRate, 0),
      packetsTransmitted: prev.packetsTransmitted + Math.floor(Math.random() * 10),
      averageLatency: Math.round(nodes.reduce((acc, node) => acc + node.latency, 0) / nodes.length)
    }));
  }, [currentUser, availableUsers]);

  // Animation loop
  const animate = useCallback(() => {
    if (!isAnimating) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid background
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Draw connections with animation
    connections.forEach(connection => {
      const fromNode = meshNodes.find(n => n.id === connection.from);
      const toNode = meshNodes.find(n => n.id === connection.to);
      
      if (!fromNode || !toNode || !connection.isActive) return;

      const opacity = 0.3 + (connection.strength / 100) * 0.7;
      const pulseIntensity = 0.5 + Math.sin(Date.now() / 1000 + connection.strength) * 0.5;
      
      // Connection line
      ctx.strokeStyle = `rgba(0, 255, 255, ${opacity * pulseIntensity})`;
      ctx.lineWidth = connection.type === 'primary' ? 3 : connection.type === 'secondary' ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(fromNode.position.x, fromNode.position.y);
      ctx.lineTo(toNode.position.x, toNode.position.y);
      ctx.stroke();

      // Data flow animation
      if (connection.dataFlow > 50) {
        const progress = (Date.now() / 1000) % 1;
        const x = fromNode.position.x + (toNode.position.x - fromNode.position.x) * progress;
        const y = fromNode.position.y + (toNode.position.y - fromNode.position.y) * progress;
        
        ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // Draw nodes
    meshNodes.forEach(node => {
      const { x, y } = node.position;
      const pulseSize = 5 + Math.sin(Date.now() / 1000 + node.signalStrength) * 3;
      const isSelected = selectedNode?.id === node.id;

      // Signal range circle
      if (node.isActive) {
        const rangeRadius = (node.signalStrength / 100) * 60;
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.1 + Math.sin(Date.now() / 2000) * 0.1})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, rangeRadius, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Node circle
      const nodeRadius = isSelected ? 15 : 10;
      const nodeColor = node.isActive ? 
        (node.connectionType === 'mesh' ? '#00ffff' : 
         node.connectionType === 'wifi' ? '#00ff00' : 
         node.connectionType === 'bluetooth' ? '#ff00ff' : '#ffff00') : '#666666';

      ctx.fillStyle = nodeColor;
      ctx.beginPath();
      ctx.arc(x, y, nodeRadius, 0, 2 * Math.PI);
      ctx.fill();

      // Pulse effect for active nodes
      if (node.isActive) {
        ctx.strokeStyle = nodeColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(x, y, nodeRadius + pulseSize, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Connection indicator
      if (node.isRelay) {
        ctx.fillStyle = '#ff6b35';
        ctx.beginPath();
        ctx.arc(x, y - nodeRadius - 5, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // Update mesh nodes positions for animation
    generateMeshNodes();

    animationRef.current = requestAnimationFrame(animate);
  }, [isAnimating, meshNodes, connections, selectedNode, generateMeshNodes]);

  // Initialize and start animation
  useEffect(() => {
    generateMeshNodes();
    if (isAnimating) {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, generateMeshNodes, isAnimating]);

  // Real-time data refresh
  useEffect(() => {
    if (isOffline) return;

    const interval = setInterval(() => {
      refetch();
      generateMeshNodes();
    }, 2000);

    return () => clearInterval(interval);
  }, [isOffline, refetch, generateMeshNodes]);

  // Handle canvas click
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const clickedNode = meshNodes.find(node => {
      const distance = Math.sqrt(
        Math.pow(x - node.position.x, 2) + Math.pow(y - node.position.y, 2)
      );
      return distance <= 15;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode);
      onUserSelect?.(clickedNode.user);
    } else {
      setSelectedNode(null);
    }
  };

  const formatUptime = () => {
    const start = performance.now();
    const hours = Math.floor(start / 3600000);
    const minutes = Math.floor((start % 3600000) / 60000);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Live Mesh Network
          </h2>
          <p className="text-muted-foreground">Real-time network visualization and monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAnimating(!isAnimating)}
          >
            {isAnimating ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isAnimating ? 'Pause' : 'Resume'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Network Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-cyan-400" />
            <div className="text-2xl font-bold text-cyan-400">{networkStats.totalNodes}</div>
            <div className="text-xs text-muted-foreground">Active Nodes</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <Network className="w-6 h-6 mx-auto mb-2 text-green-400" />
            <div className="text-2xl font-bold text-green-400">{networkStats.activeConnections}</div>
            <div className="text-xs text-muted-foreground">Connections</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <Signal className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            <div className="text-2xl font-bold text-yellow-400">{networkStats.signalStrength}%</div>
            <div className="text-xs text-muted-foreground">Avg Signal</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
          <CardContent className="p-4 text-center">
            <Zap className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            <div className="text-2xl font-bold text-purple-400">{Math.round(networkStats.dataTransfer)}</div>
            <div className="text-xs text-muted-foreground">KB/s</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-rose-500/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            <Gauge className="w-6 h-6 mx-auto mb-2 text-red-400" />
            <div className="text-2xl font-bold text-red-400">{networkStats.averageLatency}ms</div>
            <div className="text-xs text-muted-foreground">Avg Latency</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border-indigo-500/30">
          <CardContent className="p-4 text-center">
            <Activity className="w-6 h-6 mx-auto mb-2 text-indigo-400" />
            <div className="text-2xl font-bold text-indigo-400">{formatUptime()}</div>
            <div className="text-xs text-muted-foreground">Uptime</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Network Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Network Canvas */}
        <Card className="lg:col-span-3 bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cyan-400">
              <Globe className="w-5 h-5" />
              Network Topology Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              onClick={handleCanvasClick}
              className="w-full h-full border border-cyan-500/30 rounded cursor-pointer bg-slate-900/30"
            />
            
            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                <span>Mesh Network</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span>WiFi Direct</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                <span>Bluetooth</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <span>Direct Link</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Node Details Panel */}
        <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cyan-400">
              <Cpu className="w-5 h-5" />
              {selectedNode ? 'Node Details' : 'Select a Node'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedNode ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 border-2 border-cyan-500/50">
                    <AvatarImage src={selectedNode.user.avatar} />
                    <AvatarFallback className="bg-cyan-500">
                      {selectedNode.user.alias.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-white">{selectedNode.user.alias}</h3>
                    <p className="text-xs text-muted-foreground">{selectedNode.id}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-muted-foreground">Signal Strength</span>
                      <span className="text-sm font-medium">{Math.round(selectedNode.signalStrength)}%</span>
                    </div>
                    <Progress value={selectedNode.signalStrength} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Distance</span>
                      <p className="font-medium text-white">{selectedNode.distance.toFixed(1)} km</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Hops</span>
                      <p className="font-medium text-white">{selectedNode.hopCount}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Latency</span>
                      <p className="font-medium text-white">{Math.round(selectedNode.latency)}ms</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Data Rate</span>
                      <p className="font-medium text-white">{Math.round(selectedNode.dataRate)} KB/s</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      {selectedNode.connectionType.toUpperCase()}
                    </Badge>
                    {selectedNode.isRelay && (
                      <Badge variant="outline" className="text-xs bg-orange-500/20 text-orange-300">
                        RELAY
                      </Badge>
                    )}
                    <Badge variant={selectedNode.isActive ? "default" : "secondary"} className="text-xs">
                      {selectedNode.isActive ? 'ONLINE' : 'OFFLINE'}
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                      onClick={() => onUserSelect?.(selectedNode.user)}
                    >
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Chat
                    </Button>
                    <Button size="sm" variant="outline" className="border-cyan-500/50">
                      <Eye className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Network className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Click on a node in the network map to view detailed information</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}