import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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
  Antenna
} from 'lucide-react';
import type { User } from '@shared/schema';

interface MeshNode {
  id: string;
  user: User;
  position: { x: number; y: number };
  signalStrength: number;
  distance: number;
  connectionType: 'bluetooth' | 'wifi' | 'mesh';
  isRelay: boolean;
  hopCount: number;
  lastSeen: Date;
}

interface EnhancedMeshNetworkingProps {
  currentUser: User | null;
  availableUsers: User[];
  onUserSelect?: (user: User) => void;
}

export function EnhancedMeshNetworking({ 
  currentUser, 
  availableUsers, 
  onUserSelect 
}: EnhancedMeshNetworkingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [meshNodes, setMeshNodes] = useState<MeshNode[]>([]);
  const [networkStats, setNetworkStats] = useState({
    totalNodes: 0,
    activeConnections: 0,
    signalStrength: 85,
    meshRange: 2.5,
    dataTransfer: 0
  });
  const [isScanning, setIsScanning] = useState(false);
  const [selectedNode, setSelectedNode] = useState<MeshNode | null>(null);
  const animationRef = useRef<number>();

  // Generate mesh nodes from available users
  useEffect(() => {
    const nodes: MeshNode[] = availableUsers.map((user, index) => {
      const angle = (index / availableUsers.length) * 2 * Math.PI;
      const radius = 150 + Math.random() * 100;
      const x = 300 + Math.cos(angle) * radius;
      const y = 300 + Math.sin(angle) * radius;
      
      return {
        id: user.deviceId,
        user,
        position: { x, y },
        signalStrength: Math.floor(Math.random() * 40) + 60,
        distance: Math.random() * 5 + 0.5,
        connectionType: ['bluetooth', 'wifi', 'mesh'][Math.floor(Math.random() * 3)] as any,
        isRelay: Math.random() > 0.7,
        hopCount: Math.floor(Math.random() * 3) + 1,
        lastSeen: new Date(Date.now() - Math.random() * 300000)
      };
    });

    setMeshNodes(nodes);
    setNetworkStats(prev => ({
      ...prev,
      totalNodes: nodes.length,
      activeConnections: nodes.filter(n => n.signalStrength > 50).length
    }));
  }, [availableUsers]);

  // Animation loop for mesh network visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw connections between nodes
      meshNodes.forEach((node1, i) => {
        meshNodes.slice(i + 1).forEach(node2 => {
          const distance = Math.sqrt(
            Math.pow(node1.position.x - node2.position.x, 2) +
            Math.pow(node1.position.y - node2.position.y, 2)
          );

          if (distance < 200) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.3 - distance / 600})`;
            ctx.lineWidth = Math.max(1, 3 - distance / 100);
            ctx.moveTo(node1.position.x, node1.position.y);
            ctx.lineTo(node2.position.x, node2.position.y);
            ctx.stroke();

            // Animated data flow
            const progress = (Date.now() / 1000) % 1;
            const flowX = node1.position.x + (node2.position.x - node1.position.x) * progress;
            const flowY = node1.position.y + (node2.position.y - node1.position.y) * progress;
            
            ctx.beginPath();
            ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
            ctx.arc(flowX, flowY, 2, 0, 2 * Math.PI);
            ctx.fill();
          }
        });
      });

      // Draw nodes
      meshNodes.forEach(node => {
        // Node circle
        ctx.beginPath();
        ctx.fillStyle = node.signalStrength > 75 ? '#10b981' : 
                       node.signalStrength > 50 ? '#f59e0b' : '#ef4444';
        ctx.arc(node.position.x, node.position.y, 8, 0, 2 * Math.PI);
        ctx.fill();

        // Signal rings
        for (let i = 1; i <= 3; i++) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(59, 130, 246, ${0.3 / i})`;
          ctx.lineWidth = 1;
          ctx.arc(node.position.x, node.position.y, 8 + i * 10, 0, 2 * Math.PI);
          ctx.stroke();
        }

        // Relay indicator
        if (node.isRelay) {
          ctx.beginPath();
          ctx.fillStyle = '#8b5cf6';
          ctx.arc(node.position.x, node.position.y - 12, 3, 0, 2 * Math.PI);
          ctx.fill();
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [meshNodes]);

  const handleNodeClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const clickedNode = meshNodes.find(node => {
      const distance = Math.sqrt(
        Math.pow(node.position.x - x, 2) +
        Math.pow(node.position.y - y, 2)
      );
      return distance < 15;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode);
      if (onUserSelect) {
        onUserSelect(clickedNode.user);
      }
    }
  };

  const startNetworkScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      // Update network stats after scan
      setNetworkStats(prev => ({
        ...prev,
        signalStrength: Math.floor(Math.random() * 20) + 80,
        activeConnections: Math.floor(Math.random() * 5) + meshNodes.length - 2
      }));
    }, 3000);
  };

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'bluetooth': return <Bluetooth className="w-4 h-4 text-blue-500" />;
      case 'wifi': return <Wifi className="w-4 h-4 text-green-500" />;
      case 'mesh': return <Radio className="w-4 h-4 text-purple-500" />;
      default: return <Signal className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full h-full space-y-6 p-4">
      {/* Network Status Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Globe className="w-6 h-6 text-blue-500" />
              <span>Mesh Network Status</span>
            </div>
            <Button 
              onClick={startNetworkScan} 
              disabled={isScanning}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Scanning...' : 'Scan Network'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{networkStats.totalNodes}</div>
              <div className="text-sm text-muted-foreground">Total Nodes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{networkStats.activeConnections}</div>
              <div className="text-sm text-muted-foreground">Active Links</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{networkStats.signalStrength}%</div>
              <div className="text-sm text-muted-foreground">Signal Strength</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{networkStats.meshRange}km</div>
              <div className="text-sm text-muted-foreground">Max Range</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Network Visualization */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-green-500" />
              <span>Live Network Map</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={600}
                height={400}
                onClick={handleNodeClick}
                className="border border-border rounded-lg bg-gradient-to-br from-background to-muted cursor-pointer"
              />
              <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-lg p-2">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>Live Network</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Strong Signal</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  <span>Weak Signal</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span>Poor Signal</span>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span>Relay Node</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Node List & Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span>Connected Nodes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {meshNodes.map((node) => (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedNode?.id === node.id ? 'bg-accent border-accent-foreground' : 'hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={node.user.avatar} />
                        <AvatarFallback>
                          <UserIcon className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{node.user.alias}</p>
                          {getConnectionIcon(node.connectionType)}
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Signal className="w-3 h-3" />
                          <span>{node.signalStrength}%</span>
                          <MapPin className="w-3 h-3" />
                          <span>{node.distance.toFixed(1)}km</span>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="outline" className="text-xs">
                            {node.hopCount} hop{node.hopCount !== 1 ? 's' : ''}
                          </Badge>
                          {node.isRelay && (
                            <Badge variant="secondary" className="text-xs">
                              <Router className="w-3 h-3 mr-1" />
                              Relay
                            </Badge>
                          )}
                        </div>
                        
                        <Progress 
                          value={node.signalStrength} 
                          className="h-1 mt-2"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Selected Node Details */}
      {selectedNode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Antenna className="w-5 h-5 text-green-500" />
                <span>Node Details: {selectedNode.user.alias}</span>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
                <Button size="sm" variant="outline">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Data
                </Button>
                <Button size="sm" variant="outline">
                  <Eye className="w-4 h-4 mr-2" />
                  View Profile
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-sm text-muted-foreground">Connection Type</div>
                <div className="flex items-center space-x-2 mt-1">
                  {getConnectionIcon(selectedNode.connectionType)}
                  <span className="font-medium capitalize">{selectedNode.connectionType}</span>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground">Signal Strength</div>
                <div className="font-medium mt-1">{selectedNode.signalStrength}%</div>
                <Progress value={selectedNode.signalStrength} className="h-2 mt-1" />
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground">Distance</div>
                <div className="font-medium mt-1">{selectedNode.distance.toFixed(2)} km</div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground">Mesh Hops</div>
                <div className="font-medium mt-1">{selectedNode.hopCount}</div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground">Device ID</div>
                <div className="font-mono text-xs mt-1 truncate">
                  {selectedNode.user.deviceId.slice(0, 16)}...
                </div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground">Callsign</div>
                <div className="font-mono text-sm mt-1">{selectedNode.user.meshCallsign}</div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground">Security Level</div>
                <Badge variant="outline" className="mt-1">
                  Level {selectedNode.user.securityLevel}
                </Badge>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground">Last Seen</div>
                <div className="text-sm mt-1">
                  {Math.floor((Date.now() - selectedNode.lastSeen.getTime()) / 60000)}m ago
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}