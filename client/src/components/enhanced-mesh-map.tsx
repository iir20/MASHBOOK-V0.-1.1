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
  Bluetooth,
  Radio,
  Zap,
  Users,
  MapPin,
  Eye,
  Settings,
  Maximize,
  Minimize,
  RefreshCw,
  Signal,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Compass,
  Target
} from 'lucide-react';

interface MeshNode {
  id: string;
  userId: number;
  position: { x: number; y: number };
  signalStrength: number;
  distance: number;
  connectionType: 'bluetooth' | 'webrtc' | 'wifi';
  isActive: boolean;
  lastSeen: Date;
  user?: User;
  connections: string[];
  throughput: number;
  latency: number;
}

interface EnhancedMeshMapProps {
  currentUser: User | null;
  availableUsers: User[];
  onUserSelect: (user: User) => void;
  isOffline: boolean;
  wsState: {
    isConnected: boolean;
    connectionQuality: string;
  };
}

export function EnhancedMeshMap({ 
  currentUser, 
  availableUsers, 
  onUserSelect, 
  isOffline,
  wsState 
}: EnhancedMeshMapProps) {
  const [meshNodes, setMeshNodes] = useState<MeshNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<MeshNode | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [showConnections, setShowConnections] = useState(true);
  const [showSignalPulses, setShowSignalPulses] = useState(true);
  const [mapMode, setMapMode] = useState<'network' | 'geographic' | 'constellation'>('network');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const { toast } = useToast();

  // Generate realistic mesh network data
  useEffect(() => {
    if (!currentUser) return;

    const generateMeshNodes = () => {
      const nodes: MeshNode[] = [];
      const centerX = 400;
      const centerY = 300;

      // Add current user as central node
      nodes.push({
        id: `node-${currentUser.id}`,
        userId: currentUser.id,
        position: { x: centerX, y: centerY },
        signalStrength: 100,
        distance: 0,
        connectionType: 'webrtc',
        isActive: true,
        lastSeen: new Date(),
        user: currentUser,
        connections: [],
        throughput: 0,
        latency: 0
      });

      // Add other users as mesh nodes
      availableUsers.forEach((user, index) => {
        if (user.id === currentUser.id) return;

        const angle = (index / availableUsers.length) * 2 * Math.PI;
        const distance = 50 + Math.random() * 200;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        
        const connectionTypes: MeshNode['connectionType'][] = ['bluetooth', 'webrtc', 'wifi'];
        const connectionType = connectionTypes[Math.floor(Math.random() * connectionTypes.length)];
        
        const node: MeshNode = {
          id: `node-${user.id}`,
          userId: user.id,
          position: { x, y },
          signalStrength: 30 + Math.random() * 70,
          distance: Math.floor(distance / 10),
          connectionType,
          isActive: user.isOnline || Math.random() > 0.3,
          lastSeen: new Date(Date.now() - Math.random() * 3600000),
          user,
          connections: [],
          throughput: Math.random() * 1000,
          latency: Math.random() * 100
        };

        nodes.push(node);
      });

      // Generate connections between nodes
      nodes.forEach(node => {
        if (node.userId === currentUser.id) {
          // Central node connects to nearby nodes
          nodes.forEach(otherNode => {
            if (otherNode.id !== node.id && otherNode.isActive) {
              const distance = Math.sqrt(
                Math.pow(node.position.x - otherNode.position.x, 2) +
                Math.pow(node.position.y - otherNode.position.y, 2)
              );
              if (distance < 150 || Math.random() > 0.7) {
                node.connections.push(otherNode.id);
              }
            }
          });
        } else {
          // Other nodes connect to some nearby nodes
          nodes.forEach(otherNode => {
            if (otherNode.id !== node.id && otherNode.isActive && Math.random() > 0.8) {
              const distance = Math.sqrt(
                Math.pow(node.position.x - otherNode.position.x, 2) +
                Math.pow(node.position.y - otherNode.position.y, 2)
              );
              if (distance < 100) {
                node.connections.push(otherNode.id);
              }
            }
          });
        }
      });

      setMeshNodes(nodes);
    };

    generateMeshNodes();
    
    // Update nodes periodically
    const interval = setInterval(() => {
      setMeshNodes(prev => prev.map(node => ({
        ...node,
        signalStrength: Math.max(10, node.signalStrength + (Math.random() - 0.5) * 10),
        throughput: Math.max(0, node.throughput + (Math.random() - 0.5) * 100),
        latency: Math.max(1, node.latency + (Math.random() - 0.5) * 20),
        isActive: node.userId === currentUser.id ? true : (node.isActive ? Math.random() > 0.05 : Math.random() > 0.9)
      })));
    }, 2000);

    return () => clearInterval(interval);
  }, [currentUser, availableUsers]);

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background grid
      ctx.strokeStyle = 'rgba(100, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw connections
      if (showConnections) {
        meshNodes.forEach(node => {
          node.connections.forEach(connectionId => {
            const targetNode = meshNodes.find(n => n.id === connectionId);
            if (targetNode && node.isActive && targetNode.isActive) {
              const opacity = Math.min(node.signalStrength, targetNode.signalStrength) / 100;
              
              // Animated connection line
              ctx.strokeStyle = `rgba(100, 255, 255, ${opacity * 0.8})`;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(node.position.x, node.position.y);
              ctx.lineTo(targetNode.position.x, targetNode.position.y);
              ctx.stroke();

              // Signal pulse animation
              if (showSignalPulses) {
                const pulseProgress = (time * animationSpeed) % 100 / 100;
                const pulseX = node.position.x + (targetNode.position.x - node.position.x) * pulseProgress;
                const pulseY = node.position.y + (targetNode.position.y - node.position.y) * pulseProgress;
                
                ctx.fillStyle = `rgba(100, 255, 255, ${1 - pulseProgress})`;
                ctx.beginPath();
                ctx.arc(pulseX, pulseY, 3, 0, 2 * Math.PI);
                ctx.fill();
              }
            }
          });
        });
      }

      // Draw nodes
      meshNodes.forEach(node => {
        const { x, y } = node.position;
        const isSelected = selectedNode?.id === node.id;
        const isCentralNode = node.userId === currentUser?.id;
        
        // Node glow effect
        if (node.isActive) {
          const glowRadius = isCentralNode ? 30 : 20;
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
          gradient.addColorStop(0, `rgba(100, 255, 255, ${node.signalStrength / 200})`);
          gradient.addColorStop(1, 'rgba(100, 255, 255, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, glowRadius, 0, 2 * Math.PI);
          ctx.fill();
        }

        // Node circle
        const nodeRadius = isCentralNode ? 12 : 8;
        ctx.fillStyle = node.isActive ? 
          (isCentralNode ? '#00ffff' : '#64ffda') : 
          '#666666';
        ctx.beginPath();
        ctx.arc(x, y, nodeRadius, 0, 2 * Math.PI);
        ctx.fill();

        // Selection ring
        if (isSelected) {
          ctx.strokeStyle = '#ffff00';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, y, nodeRadius + 5, 0, 2 * Math.PI);
          ctx.stroke();
        }

        // Signal strength indicator
        if (node.isActive) {
          const barHeight = node.signalStrength / 5;
          ctx.fillStyle = node.signalStrength > 70 ? '#00ff00' : 
                         node.signalStrength > 40 ? '#ffff00' : '#ff4444';
          ctx.fillRect(x - 2, y - nodeRadius - barHeight - 5, 4, barHeight);
        }

        // Connection type indicator
        const typeColor = {
          bluetooth: '#4285f4',
          webrtc: '#34a853',
          wifi: '#fbbc04'
        }[node.connectionType];
        
        ctx.fillStyle = typeColor;
        ctx.beginPath();
        ctx.arc(x + nodeRadius - 3, y - nodeRadius + 3, 3, 0, 2 * Math.PI);
        ctx.fill();
      });

      time += 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [meshNodes, selectedNode, showConnections, showSignalPulses, animationSpeed, currentUser]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find clicked node
    const clickedNode = meshNodes.find(node => {
      const distance = Math.sqrt(
        Math.pow(x - node.position.x, 2) + Math.pow(y - node.position.y, 2)
      );
      return distance <= (node.userId === currentUser?.id ? 12 : 8);
    });

    if (clickedNode) {
      setSelectedNode(clickedNode);
      if (clickedNode.user && clickedNode.userId !== currentUser?.id) {
        onUserSelect(clickedNode.user);
      }
    } else {
      setSelectedNode(null);
    }
  };

  const getSignalIcon = (strength: number) => {
    if (strength > 70) return SignalHigh;
    if (strength > 40) return SignalMedium;
    return SignalLow;
  };

  const refreshMeshData = () => {
    toast({
      title: "Mesh Updated",
      description: "Network topology refreshed successfully.",
    });
    
    // Force re-render of mesh data
    setMeshNodes(prev => [...prev]);
  };

  return (
    <div className={`h-full space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-6' : ''}`}>
      <AnimatedBackground />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <NeonText className="text-2xl font-bold">Mesh Network Map</NeonText>
          <p className="text-muted-foreground">
            Real-time visualization of peer-to-peer connections
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant={wsState.isConnected ? "default" : "destructive"}>
            {meshNodes.filter(n => n.isActive).length} active nodes
          </Badge>
          
          <Button
            variant="outline"
            size="icon"
            onClick={refreshMeshData}
            className="animate-spin-slow"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100%-100px)]">
        {/* Map Canvas */}
        <div className="lg:col-span-3">
          <FuturisticCard className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Network Topology
                </CardTitle>
                
                {/* Map Controls */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant={mapMode === 'network' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMapMode('network')}
                  >
                    Network
                  </Button>
                  <Button
                    variant={mapMode === 'geographic' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMapMode('geographic')}
                  >
                    Geographic
                  </Button>
                  <Button
                    variant={mapMode === 'constellation' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMapMode('constellation')}
                  >
                    Constellation
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                onClick={handleCanvasClick}
                className="w-full h-full cursor-crosshair border rounded-lg bg-gradient-to-br from-gray-900/20 to-blue-900/20"
              />
            </CardContent>
          </FuturisticCard>
        </div>

        {/* Network Info Panel */}
        <div className="space-y-4">
          {/* Network Stats */}
          <FuturisticCard>
            <CardHeader>
              <CardTitle className="text-lg">Network Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Nodes</span>
                <Badge>{meshNodes.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Connections</span>
                <Badge variant="default">
                  {meshNodes.reduce((sum, node) => sum + node.connections.length, 0)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg Signal</span>
                <Badge variant="secondary">
                  {Math.round(meshNodes.reduce((sum, node) => sum + node.signalStrength, 0) / meshNodes.length)}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Network Health</span>
                <Badge variant={wsState.connectionQuality === 'good' ? 'default' : 'destructive'}>
                  {wsState.connectionQuality}
                </Badge>
              </div>
            </CardContent>
          </FuturisticCard>

          {/* Map Controls */}
          <FuturisticCard>
            <CardHeader>
              <CardTitle className="text-lg">Map Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Animation Speed</label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={animationSpeed}
                  onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Show Connections</span>
                  <input
                    type="checkbox"
                    checked={showConnections}
                    onChange={(e) => setShowConnections(e.target.checked)}
                    className="rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Signal Pulses</span>
                  <input
                    type="checkbox"
                    checked={showSignalPulses}
                    onChange={(e) => setShowSignalPulses(e.target.checked)}
                    className="rounded"
                  />
                </div>
              </div>
            </CardContent>
          </FuturisticCard>

          {/* Selected Node Info */}
          {selectedNode && (
            <FuturisticCard>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedNode.user?.avatar} />
                    <AvatarFallback>{selectedNode.user?.alias?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  Node Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{selectedNode.user?.alias || 'Unknown'}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedNode.user?.meshCallsign}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Signal Strength</span>
                    <div className="flex items-center space-x-1">
                      {React.createElement(getSignalIcon(selectedNode.signalStrength), { className: "h-4 w-4" })}
                      <span>{Math.round(selectedNode.signalStrength)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Distance</span>
                    <span>{selectedNode.distance}m</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Connection</span>
                    <Badge variant="outline" className="capitalize">
                      {selectedNode.connectionType}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Throughput</span>
                    <span>{Math.round(selectedNode.throughput)} KB/s</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Latency</span>
                    <span>{Math.round(selectedNode.latency)}ms</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Connections</span>
                    <span>{selectedNode.connections.length}</span>
                  </div>
                </div>
                
                {selectedNode.user && selectedNode.userId !== currentUser?.id && (
                  <GlowButton 
                    onClick={() => onUserSelect(selectedNode.user!)}
                    className="w-full mt-4"
                  >
                    Connect to Node
                  </GlowButton>
                )}
              </CardContent>
            </FuturisticCard>
          )}

          {/* Connection Types Legend */}
          <FuturisticCard>
            <CardHeader>
              <CardTitle className="text-lg">Connection Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm">Bluetooth</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm">WebRTC</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm">Wi-Fi Direct</span>
              </div>
            </CardContent>
          </FuturisticCard>
        </div>
      </div>
    </div>
  );
}