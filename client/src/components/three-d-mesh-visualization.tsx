import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import type { User } from '@shared/schema';
import { FuturisticCard, GlowButton, NeonText } from './modern-futuristic-theme';

import {
  Maximize2, Minimize2, RotateCcw, Zap, Activity, Globe,
  Box, Layers, Eye, Settings, Play, Pause, Volume2, VolumeX
} from 'lucide-react';

interface Node3D {
  id: string;
  userId: number;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  connections: string[];
  status: 'online' | 'connecting' | 'offline';
  signalStrength: number;
  size: number;
  color: string;
  pulsePhase: number;
}

interface ThreeDMeshVisualizationProps {
  currentUser: User | null;
  availableUsers: User[];
  isOffline: boolean;
  onNodeSelect?: (userId: number) => void;
}

export function ThreeDMeshVisualization({ 
  currentUser, 
  availableUsers, 
  isOffline,
  onNodeSelect 
}: ThreeDMeshVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0, down: false });
  const cameraRef = useRef({ 
    x: 0, y: 0, z: -800, 
    rotX: 0, rotY: 0, 
    targetRotX: 0, targetRotY: 0 
  });
  
  const [nodes3D, setNodes3D] = useState<Node3D[]>([]);
  const [isAnimated, setIsAnimated] = useState(true);
  const [showConnections, setShowConnections] = useState(true);
  const [nodeSize, setNodeSize] = useState([15]);
  const [connectionOpacity, setConnectionOpacity] = useState([0.6]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Initialize 3D nodes
  useEffect(() => {
    const nodes: Node3D[] = availableUsers.map((user, index) => {
      const angle = (index / availableUsers.length) * 2 * Math.PI;
      const radius = 200;
      const height = (Math.random() - 0.5) * 300;
      
      return {
        id: `node3d-${user.id}`,
        userId: user.id,
        position: {
          x: Math.cos(angle) * radius + (Math.random() - 0.5) * 100,
          y: height,
          z: Math.sin(angle) * radius + (Math.random() - 0.5) * 100
        },
        velocity: {
          x: (Math.random() - 0.5) * 0.5,
          y: (Math.random() - 0.5) * 0.5,
          z: (Math.random() - 0.5) * 0.5
        },
        connections: availableUsers
          .filter(u => u.id !== user.id && Math.random() > 0.7)
          .slice(0, 3)
          .map(u => `node3d-${u.id}`),
        status: Math.random() > 0.7 ? 'offline' : Math.random() > 0.3 ? 'online' : 'connecting',
        signalStrength: Math.floor(Math.random() * 100),
        size: 15 + Math.random() * 10,
        color: getStatusColor(Math.random() > 0.7 ? 'offline' : Math.random() > 0.3 ? 'online' : 'connecting'),
        pulsePhase: Math.random() * Math.PI * 2
      };
    });
    
    setNodes3D(nodes);
  }, [availableUsers]);

  // 3D projection function
  const project3D = useCallback((x: number, y: number, z: number, camera: typeof cameraRef.current) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, scale: 1 };
    
    // Apply camera rotation
    const cosX = Math.cos(camera.rotX);
    const sinX = Math.sin(camera.rotX);
    const cosY = Math.cos(camera.rotY);
    const sinY = Math.sin(camera.rotY);
    
    // Rotate around Y axis (horizontal)
    let tempX = x * cosY - z * sinY;
    let tempZ = x * sinY + z * cosY;
    
    // Rotate around X axis (vertical)
    let finalX = tempX;
    let finalY = y * cosX - tempZ * sinX;
    let finalZ = y * sinX + tempZ * cosX;
    
    // Apply camera position
    finalX -= camera.x;
    finalY -= camera.y;
    finalZ -= camera.z;
    
    // Perspective projection
    const focalLength = 600;
    const scale = focalLength / (focalLength + finalZ);
    
    return {
      x: canvas.width / 2 + finalX * scale,
      y: canvas.height / 2 + finalY * scale,
      scale: Math.max(0.1, scale)
    };
  }, []);

  // Draw 3D node
  const drawNode3D = useCallback((ctx: CanvasRenderingContext2D, node: Node3D, camera: typeof cameraRef.current) => {
    const projected = project3D(node.position.x, node.position.y, node.position.z, camera);
    
    if (projected.scale <= 0.1) return;
    
    const size = node.size * projected.scale * nodeSize[0] / 15;
    const isSelected = selectedNodeId === node.id;
    
    // Node glow effect
    if (node.status === 'online') {
      const pulse = Math.sin(Date.now() * 0.003 + node.pulsePhase) * 0.3 + 0.7;
      const glowSize = size * 2 * pulse;
      
      const gradient = ctx.createRadialGradient(
        projected.x, projected.y, 0,
        projected.x, projected.y, glowSize
      );
      gradient.addColorStop(0, `${node.color}80`);
      gradient.addColorStop(1, `${node.color}00`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(projected.x, projected.y, glowSize, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Main node circle
    ctx.beginPath();
    ctx.arc(projected.x, projected.y, size, 0, 2 * Math.PI);
    ctx.fillStyle = node.color;
    ctx.fill();
    
    // Selection ring
    if (isSelected) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3 * projected.scale;
      ctx.stroke();
    }
    
    // Inner highlight
    const highlightGradient = ctx.createRadialGradient(
      projected.x - size * 0.3, projected.y - size * 0.3, 0,
      projected.x, projected.y, size
    );
    highlightGradient.addColorStop(0, '#ffffff60');
    highlightGradient.addColorStop(1, '#ffffff00');
    ctx.fillStyle = highlightGradient;
    ctx.fill();
    
    // Signal strength indicator
    if (projected.scale > 0.5) {
      const barCount = 4;
      const barWidth = 2 * projected.scale;
      const barSpacing = 3 * projected.scale;
      const maxHeight = 12 * projected.scale;
      const startX = projected.x + size + 5 * projected.scale;
      
      for (let i = 0; i < barCount; i++) {
        const barHeight = (maxHeight / barCount) * (i + 1);
        const filled = (node.signalStrength / 100) * barCount > i;
        
        ctx.fillStyle = filled ? node.color : `${node.color}30`;
        ctx.fillRect(
          startX + i * (barWidth + barSpacing),
          projected.y - barHeight / 2,
          barWidth,
          barHeight
        );
      }
    }
    
    // Node label (for larger nodes)
    if (projected.scale > 0.3 && size > 8) {
      const user = availableUsers.find(u => u.id === node.userId);
      if (user) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `${Math.max(10, 12 * projected.scale)}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(user.alias, projected.x, projected.y + size + 20 * projected.scale);
      }
    }
  }, [availableUsers, nodeSize, selectedNodeId, project3D]);

  // Draw 3D connection
  const drawConnection3D = useCallback((ctx: CanvasRenderingContext2D, from: Node3D, to: Node3D, camera: typeof cameraRef.current) => {
    const fromProj = project3D(from.position.x, from.position.y, from.position.z, camera);
    const toProj = project3D(to.position.x, to.position.y, to.position.z, camera);
    
    if (fromProj.scale <= 0.1 || toProj.scale <= 0.1) return;
    
    // Calculate line opacity based on distance and scale
    const avgScale = (fromProj.scale + toProj.scale) / 2;
    const opacity = Math.min(1, avgScale) * connectionOpacity[0];
    
    // Animated data flow
    const time = Date.now() * 0.002;
    const flowProgress = (Math.sin(time) + 1) / 2;
    const flowX = fromProj.x + (toProj.x - fromProj.x) * flowProgress;
    const flowY = fromProj.y + (toProj.y - fromProj.y) * flowProgress;
    
    // Main connection line
    ctx.beginPath();
    ctx.moveTo(fromProj.x, fromProj.y);
    ctx.lineTo(toProj.x, toProj.y);
    
    const gradient = ctx.createLinearGradient(fromProj.x, fromProj.y, toProj.x, toProj.y);
    gradient.addColorStop(0, `${from.color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(0.5, `#4ade80${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(1, `${to.color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`);
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2 * avgScale;
    ctx.stroke();
    
    // Data flow particle
    if (isAnimated && from.status === 'online' && to.status === 'online') {
      ctx.beginPath();
      ctx.arc(flowX, flowY, 3 * avgScale, 0, 2 * Math.PI);
      ctx.fillStyle = `#00ffff${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
      ctx.fill();
    }
  }, [project3D, connectionOpacity, isAnimated]);

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas with fade effect
    ctx.fillStyle = 'rgba(0, 5, 15, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update camera rotation smoothly
    const camera = cameraRef.current;
    camera.rotX += (camera.targetRotX - camera.rotX) * 0.1;
    camera.rotY += (camera.targetRotY - camera.rotY) * 0.1;
    
    // Update node positions with physics
    if (isAnimated) {
      setNodes3D(prevNodes => 
        prevNodes.map(node => {
          const newPos = {
            x: node.position.x + node.velocity.x,
            y: node.position.y + node.velocity.y,
            z: node.position.z + node.velocity.z
          };
          
          // Boundary constraints
          const boundary = 400;
          const damping = 0.99;
          
          let newVel = { ...node.velocity };
          
          if (Math.abs(newPos.x) > boundary) {
            newVel.x *= -0.8;
            newPos.x = Math.sign(newPos.x) * boundary;
          }
          if (Math.abs(newPos.y) > boundary) {
            newVel.y *= -0.8;
            newPos.y = Math.sign(newPos.y) * boundary;
          }
          if (Math.abs(newPos.z) > boundary) {
            newVel.z *= -0.8;
            newPos.z = Math.sign(newPos.z) * boundary;
          }
          
          // Apply damping
          newVel.x *= damping;
          newVel.y *= damping;
          newVel.z *= damping;
          
          // Add small random forces
          newVel.x += (Math.random() - 0.5) * 0.02;
          newVel.y += (Math.random() - 0.5) * 0.02;
          newVel.z += (Math.random() - 0.5) * 0.02;
          
          return {
            ...node,
            position: newPos,
            velocity: newVel
          };
        })
      );
    }
    
    // Sort nodes by z-depth for proper rendering
    const sortedNodes = [...nodes3D].sort((a, b) => {
      const aProj = project3D(a.position.x, a.position.y, a.position.z, camera);
      const bProj = project3D(b.position.x, b.position.y, b.position.z, camera);
      return bProj.scale - aProj.scale; // Draw distant nodes first
    });
    
    // Draw connections first
    if (showConnections) {
      sortedNodes.forEach(node => {
        node.connections.forEach(connectionId => {
          const connectedNode = nodes3D.find(n => n.id === connectionId);
          if (connectedNode) {
            drawConnection3D(ctx, node, connectedNode, camera);
          }
        });
      });
    }
    
    // Draw nodes on top
    sortedNodes.forEach(node => {
      drawNode3D(ctx, node, camera);
    });
    
    // Continue animation
    if (isAnimated) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [nodes3D, isAnimated, showConnections, drawNode3D, drawConnection3D, project3D]);

  // Mouse interaction handlers
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    mouseRef.current.down = true;
    mouseRef.current.x = event.clientX;
    mouseRef.current.y = event.clientY;
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!mouseRef.current.down) return;
    
    const deltaX = event.clientX - mouseRef.current.x;
    const deltaY = event.clientY - mouseRef.current.y;
    
    cameraRef.current.targetRotY += deltaX * 0.01;
    cameraRef.current.targetRotX += deltaY * 0.01;
    
    // Clamp vertical rotation
    cameraRef.current.targetRotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRef.current.targetRotX));
    
    mouseRef.current.x = event.clientX;
    mouseRef.current.y = event.clientY;
  }, []);

  const handleMouseUp = useCallback(() => {
    mouseRef.current.down = false;
  }, []);

  const handleWheel = useCallback((event: React.WheelEvent) => {
    event.preventDefault();
    cameraRef.current.z += event.deltaY * 2;
    cameraRef.current.z = Math.max(-2000, Math.min(-200, cameraRef.current.z));
  }, []);

  const handleNodeClick = useCallback((event: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // Find clicked node
    const camera = cameraRef.current;
    const clickedNode = nodes3D.find(node => {
      const projected = project3D(node.position.x, node.position.y, node.position.z, camera);
      const distance = Math.sqrt(
        Math.pow(clickX - projected.x, 2) + 
        Math.pow(clickY - projected.y, 2)
      );
      const size = node.size * projected.scale * nodeSize[0] / 15;
      return distance <= size && projected.scale > 0.1;
    });
    
    if (clickedNode) {
      setSelectedNodeId(clickedNode.id === selectedNodeId ? null : clickedNode.id);
      if (onNodeSelect) {
        onNodeSelect(clickedNode.userId);
      }
    }
  }, [nodes3D, project3D, nodeSize, selectedNodeId, onNodeSelect]);

  // Start animation
  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'online': return '#4ade80';
      case 'connecting': return '#fbbf24';
      case 'offline': return '#9ca3af';
      default: return '#9ca3af';
    }
  };

  const resetCamera = () => {
    cameraRef.current.targetRotX = 0;
    cameraRef.current.targetRotY = 0;
    cameraRef.current.z = -800;
  };

  return (
    <div className="space-y-4">
      <FuturisticCard>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Box className="h-5 w-5 text-purple-400" />
            <NeonText>3D Mesh Network</NeonText>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAnimated(!isAnimated)}
            >
              {isAnimated ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConnections(!showConnections)}
            >
              <Activity className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetCamera}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <canvas
            ref={canvasRef}
            width={800}
            height={isFullscreen ? 600 : 400}
            className={`w-full bg-black/20 rounded-lg border border-purple-500/30 cursor-grab ${
              mouseRef.current?.down ? 'cursor-grabbing' : ''
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onClick={handleNodeClick}
          />
          
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Node Size</label>
              <Slider
                value={nodeSize}
                onValueChange={setNodeSize}
                min={5}
                max={30}
                step={1}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Connection Opacity</label>
              <Slider
                value={connectionOpacity}
                onValueChange={setConnectionOpacity}
                min={0.1}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <div className="flex items-center gap-2">
                <Badge variant={isAnimated ? 'default' : 'secondary'}>
                  {isAnimated ? 'Animated' : 'Static'}
                </Badge>
                <Badge variant={showConnections ? 'default' : 'secondary'}>
                  {showConnections ? 'Connected' : 'Isolated'}
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Instructions */}
          <div className="mt-4 text-xs text-muted-foreground space-y-1">
            <p>• Drag to rotate the view • Scroll to zoom • Click nodes to select</p>
            <p>• Green: Online • Yellow: Connecting • Gray: Offline</p>
          </div>
        </CardContent>
      </FuturisticCard>
      
      {/* Selected Node Info */}
      {selectedNodeId && (
        <FuturisticCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Selected Node
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const selectedNode = nodes3D.find(n => n.id === selectedNodeId);
              const user = selectedNode ? availableUsers.find(u => u.id === selectedNode.userId) : null;
              
              if (!selectedNode || !user) return <p>Node not found</p>;
              
              return (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full" style={{ backgroundColor: selectedNode.color }}></div>
                    <div>
                      <div className="font-medium">{user.alias}</div>
                      <Badge variant="outline">{selectedNode.status}</Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Signal:</span>
                      <span className="ml-2">{selectedNode.signalStrength}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Connections:</span>
                      <span className="ml-2">{selectedNode.connections.length}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Position:</span>
                      <span className="ml-2 font-mono text-xs">
                        ({selectedNode.position.x.toFixed(0)}, {selectedNode.position.y.toFixed(0)}, {selectedNode.position.z.toFixed(0)})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </FuturisticCard>
      )}
    </div>
  );
}