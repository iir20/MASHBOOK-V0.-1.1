import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Zap, 
  Activity, 
  Signal, 
  Network,
  RefreshCw,
  MapPin,
  Radio
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { User } from '@shared/schema';

interface MeshNode {
  id: string;
  user: User;
  x: number;
  y: number;
  connections: string[];
  signalStrength: number;
  isActive: boolean;
}

interface MeshNetworkMapProps {
  currentUser: User;
  availableUsers: User[];
  wsState: {
    isConnected: boolean;
    connectionQuality: string;
  };
}

export function MeshNetworkMap({ currentUser, availableUsers, wsState }: MeshNetworkMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [meshNodes, setMeshNodes] = useState<MeshNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [animationFrame, setAnimationFrame] = useState(0);

  // Get all real users from database
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Generate mesh network layout
  useEffect(() => {
    if (!allUsers.length) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.3;

    const nodes: MeshNode[] = allUsers.map((user: User, index: number) => {
      const angle = (index / allUsers.length) * 2 * Math.PI;
      const nodeRadius = index === 0 ? 0 : radius; // Current user at center
      
      return {
        id: user.id.toString(),
        user,
        x: centerX + Math.cos(angle) * nodeRadius,
        y: centerY + Math.sin(angle) * nodeRadius,
        connections: [], // Will be populated based on proximity
        signalStrength: Math.floor(Math.random() * 40) + 60,
        isActive: user.isOnline || false
      };
    });

    // Generate connections based on proximity and signal strength
    nodes.forEach((node, i) => {
      nodes.forEach((otherNode, j) => {
        if (i !== j) {
          const distance = Math.sqrt(
            Math.pow(node.x - otherNode.x, 2) + Math.pow(node.y - otherNode.y, 2)
          );
          
          // Connect nodes that are close enough and have good signal
          if (distance < 150 && node.signalStrength > 50 && otherNode.signalStrength > 50) {
            node.connections.push(otherNode.id);
          }
        }
      });
    });

    setMeshNodes(nodes);
  }, [allUsers]);

  // Animation loop for dynamic effects
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationFrame(prev => prev + 1);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Draw the mesh network
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !meshNodes.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    meshNodes.forEach(node => {
      node.connections.forEach(connectionId => {
        const connectedNode = meshNodes.find(n => n.id === connectionId);
        if (connectedNode && node.isActive && connectedNode.isActive) {
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(connectedNode.x, connectedNode.y);
          
          // Animate connection strength
          const opacity = 0.3 + 0.2 * Math.sin(animationFrame * 0.1);
          ctx.strokeStyle = `rgba(52, 211, 153, ${opacity})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
    });

    // Draw nodes
    meshNodes.forEach(node => {
      const isCurrentUser = node.user.id === currentUser.id;
      const isSelected = node.id === selectedNode;
      
      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, isCurrentUser ? 20 : 15, 0, 2 * Math.PI);
      
      if (isCurrentUser) {
        ctx.fillStyle = '#10b981'; // Emerald for current user
      } else if (node.isActive) {
        ctx.fillStyle = '#06b6d4'; // Cyan for active users
      } else {
        ctx.fillStyle = '#6b7280'; // Gray for offline users
      }
      
      if (isSelected) {
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 10;
      } else {
        ctx.shadowBlur = 0;
      }
      
      ctx.fill();

      // Pulse effect for active nodes
      if (node.isActive) {
        const pulseRadius = (15 + 5 * Math.sin(animationFrame * 0.1));
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(52, 211, 153, ${0.3 + 0.2 * Math.sin(animationFrame * 0.1)})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // User label
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        node.user.alias.length > 8 ? node.user.alias.substring(0, 8) + '...' : node.user.alias,
        node.x,
        node.y - 25
      );

      // Signal strength indicator
      if (node.isActive) {
        const barHeight = 3;
        const barWidth = 2;
        const bars = 4;
        const activeBarCount = Math.ceil((node.signalStrength / 100) * bars);
        
        for (let i = 0; i < bars; i++) {
          ctx.fillStyle = i < activeBarCount ? '#10b981' : '#374151';
          ctx.fillRect(
            node.x - (bars * barWidth) / 2 + i * barWidth + i,
            node.y + 20,
            barWidth,
            barHeight * (i + 1)
          );
        }
      }
    });
  }, [meshNodes, animationFrame, selectedNode, currentUser.id]);

  // Handle canvas click
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find clicked node
    const clickedNode = meshNodes.find(node => {
      const distance = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2));
      return distance <= 20;
    });

    setSelectedNode(clickedNode ? clickedNode.id : null);
  };

  const selectedNodeData = selectedNode ? meshNodes.find(n => n.id === selectedNode) : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Network Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{allUsers.length}</p>
            <p className="text-sm text-gray-400">Total Users</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4 text-center">
            <Activity className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">
              {allUsers.filter((user: User) => user.isOnline).length}
            </p>
            <p className="text-sm text-gray-400">Online Now</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4 text-center">
            <Network className="h-8 w-8 text-cyan-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">
              {meshNodes.reduce((acc, node) => acc + node.connections.length, 0)}
            </p>
            <p className="text-sm text-gray-400">Connections</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4 text-center">
            <Signal className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">
              {Math.round(meshNodes.reduce((acc, node) => acc + node.signalStrength, 0) / meshNodes.length) || 0}%
            </p>
            <p className="text-sm text-gray-400">Avg Signal</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-gray-800/50 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-emerald-400 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Mesh Network Map
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant={wsState.isConnected ? "default" : "destructive"}>
                  {wsState.isConnected ? 'Connected' : 'Offline'}
                </Badge>
                <Button size="sm" variant="outline">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="w-full h-96 bg-gray-900/50 rounded-lg cursor-pointer"
                onClick={handleCanvasClick}
                style={{ width: '100%', height: '400px' }}
              />
              
              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-gray-800/80 rounded-lg p-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
                  <span className="text-xs text-white">You</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-cyan-500 rounded-full"></div>
                  <span className="text-xs text-white">Online Users</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                  <span className="text-xs text-white">Offline Users</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-0.5 bg-emerald-400"></div>
                  <span className="text-xs text-white">Connections</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Node Details */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-cyan-400 flex items-center">
              <Radio className="h-5 w-5 mr-2" />
              Node Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedNodeData ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-gray-900">
                      {selectedNodeData.user.alias.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white">{selectedNodeData.user.alias}</h3>
                  <p className="text-sm text-gray-400">{selectedNodeData.user.meshCallsign}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Status:</span>
                    <Badge variant={selectedNodeData.isActive ? "default" : "secondary"}>
                      {selectedNodeData.isActive ? 'Online' : 'Offline'}
                    </Badge>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-300">Signal Strength:</span>
                    <span className="text-white">{selectedNodeData.signalStrength}%</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-300">Connections:</span>
                    <span className="text-white">{selectedNodeData.connections.length}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-300">Security Level:</span>
                    <Badge variant="outline">L{selectedNodeData.user.securityLevel}</Badge>
                  </div>
                </div>

                {selectedNodeData.user.profile && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-1">Profile:</h4>
                    <p className="text-sm text-gray-400">{selectedNodeData.user.profile}</p>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Capabilities:</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedNodeData.user.nodeCapabilities.map((capability, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {capability}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Network className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">Click on a node to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Users List */}
      {allUsers.length > 0 && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-emerald-400 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Network Users ({allUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allUsers.map((user: User) => (
                <div
                  key={user.id}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedNode === user.id.toString()
                      ? 'border-emerald-500 bg-emerald-900/20'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  onClick={() => setSelectedNode(user.id.toString())}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-900">
                        {user.alias.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{user.alias}</p>
                      <p className="text-sm text-gray-400 truncate">{user.meshCallsign}</p>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-1">
                      <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                      <Badge variant="outline" className="text-xs">
                        L{user.securityLevel}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}