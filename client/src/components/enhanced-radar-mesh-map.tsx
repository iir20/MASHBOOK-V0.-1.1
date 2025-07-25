import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
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
  Pause,
  Radar,
  Target,
  Waves,
  Crosshair
} from 'lucide-react';
import type { User } from '@shared/schema';

interface RadarNode {
  id: string;
  user: User;
  position: { x: number; y: number };
  angle: number;
  distance: number;
  signalStrength: number;
  lastDetected: number;
  isActive: boolean;
  connectionType: 'bluetooth' | 'wifi' | 'mesh' | 'direct';
  nodeType: 'peer' | 'relay' | 'gateway';
}

interface RadarBlip {
  id: string;
  x: number;
  y: number;
  opacity: number;
  detected: boolean;
  fadeTime: number;
}

interface EnhancedRadarMeshMapProps {
  currentUser: User | null;
  availableUsers: User[];
  onUserSelect?: (user: User) => void;
  isOffline?: boolean;
}

export function EnhancedRadarMeshMap({ 
  currentUser, 
  availableUsers, 
  onUserSelect,
  isOffline = false
}: EnhancedRadarMeshMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  // Radar scanning states
  const [isScanning, setIsScanning] = useState(true);
  const [radarAngle, setRadarAngle] = useState(0);
  const [detectedNodes, setDetectedNodes] = useState<RadarNode[]>([]);
  const [radarBlips, setRadarBlips] = useState<RadarBlip[]>([]);
  const [scanRadius, setScanRadius] = useState([250]);
  const [scanSpeed, setScanSpeed] = useState([2]);
  const [radarMode, setRadarMode] = useState<'sweep' | 'pulse' | 'sector'>('sweep');
  const [selectedNode, setSelectedNode] = useState<RadarNode | null>(null);
  const [radarRange, setRadarRange] = useState([400]);
  const [showConnections, setShowConnections] = useState(true);
  const [pulsePhase, setPulsePhase] = useState(0);

  // Generate radar nodes from available users
  useEffect(() => {
    if (!availableUsers.length) return;

    const centerX = 300;
    const centerY = 300;
    
    const nodes: RadarNode[] = availableUsers.slice(0, 20).map((user, index) => {
      const angle = (index * (360 / availableUsers.length)) * (Math.PI / 180);
      const distance = 80 + Math.random() * (radarRange[0] - 80);
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      
      return {
        id: user.id.toString(),
        user,
        position: { x, y },
        angle: angle * (180 / Math.PI),
        distance,
        signalStrength: 0.3 + Math.random() * 0.7,
        lastDetected: Date.now(),
        isActive: Math.random() > 0.2,
        connectionType: ['bluetooth', 'wifi', 'mesh', 'direct'][Math.floor(Math.random() * 4)] as any,
        nodeType: ['peer', 'relay', 'gateway'][Math.floor(Math.random() * 3)] as any
      };
    });

    setDetectedNodes(nodes);
  }, [availableUsers, radarRange]);

  // Radar scanning animation
  useEffect(() => {
    if (!isScanning) return;

    const animate = () => {
      setRadarAngle(prev => {
        switch (radarMode) {
          case 'sweep':
            return (prev + scanSpeed[0]) % 360;
          case 'pulse':
            setPulsePhase(p => (p + 0.1) % (Math.PI * 2));
            return prev;
          case 'sector':
            return (prev + scanSpeed[0] * 0.5) % 90;
          default:
            return prev;
        }
      });

      // Update radar blips
      setRadarBlips(prev => {
        const now = Date.now();
        return prev
          .map(blip => ({
            ...blip,
            opacity: Math.max(0, blip.opacity - 0.02),
            fadeTime: blip.fadeTime - 16
          }))
          .filter(blip => blip.opacity > 0);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isScanning, scanSpeed, radarMode]);

  // Detect nodes within radar sweep
  useEffect(() => {
    if (radarMode !== 'sweep') return;

    const sweepWidth = 15; // degrees
    const currentAngleRad = (radarAngle * Math.PI) / 180;
    
    detectedNodes.forEach(node => {
      const nodeAngleRad = (node.angle * Math.PI) / 180;
      const angleDiff = Math.abs(currentAngleRad - nodeAngleRad);
      const normalizedDiff = Math.min(angleDiff, 2 * Math.PI - angleDiff);
      
      if (normalizedDiff <= (sweepWidth * Math.PI) / 180) {
        // Create radar blip
        const newBlip: RadarBlip = {
          id: `${node.id}-${Date.now()}`,
          x: node.position.x,
          y: node.position.y,
          opacity: 1,
          detected: true,
          fadeTime: 3000
        };
        
        setRadarBlips(prev => [...prev.slice(-10), newBlip]);
      }
    });
  }, [radarAngle, detectedNodes, radarMode]);

  // Canvas drawing function
  const drawRadar = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = radarRange[0];

    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw radar grid circles
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      const radius = (maxRadius / 4) * i;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw radar grid lines
    for (let angle = 0; angle < 360; angle += 30) {
      const radians = (angle * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(radians) * maxRadius,
        centerY + Math.sin(radians) * maxRadius
      );
      ctx.stroke();
    }

    // Draw distance markers
    ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
    ctx.font = '10px monospace';
    for (let i = 1; i <= 4; i++) {
      const radius = (maxRadius / 4) * i;
      ctx.fillText(`${Math.round(radius)}m`, centerX + radius - 20, centerY - 5);
    }

    // Draw radar sweep or pulse
    if (radarMode === 'sweep') {
      const sweepAngleRad = (radarAngle * Math.PI) / 180;
      const sweepWidth = (15 * Math.PI) / 180;
      
      // Create sweep gradient
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
      gradient.addColorStop(0, 'rgba(0, 255, 0, 0.6)');
      gradient.addColorStop(0.7, 'rgba(0, 255, 0, 0.2)');
      gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, maxRadius, sweepAngleRad - sweepWidth, sweepAngleRad + sweepWidth);
      ctx.closePath();
      ctx.fill();
      
      // Draw sweep line
      ctx.strokeStyle = 'rgba(0, 255, 0, 1)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(sweepAngleRad) * maxRadius,
        centerY + Math.sin(sweepAngleRad) * maxRadius
      );
      ctx.stroke();
    } else if (radarMode === 'pulse') {
      const pulseRadius = (Math.sin(pulsePhase) * 0.5 + 0.5) * maxRadius;
      ctx.strokeStyle = `rgba(0, 255, 0, ${0.8 - (pulseRadius / maxRadius) * 0.8})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw radar blips
    radarBlips.forEach(blip => {
      ctx.fillStyle = `rgba(0, 255, 0, ${blip.opacity})`;
      ctx.beginPath();
      ctx.arc(blip.x, blip.y, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Add glow effect
      ctx.shadowColor = 'rgba(0, 255, 0, 0.8)';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw detected nodes
    detectedNodes.forEach(node => {
      const alpha = node.isActive ? node.signalStrength : 0.3;
      
      // Node color based on type
      let nodeColor = 'rgba(0, 255, 0, ' + alpha + ')';
      switch (node.connectionType) {
        case 'bluetooth':
          nodeColor = `rgba(0, 150, 255, ${alpha})`;
          break;
        case 'wifi':
          nodeColor = `rgba(255, 255, 0, ${alpha})`;
          break;
        case 'mesh':
          nodeColor = `rgba(255, 0, 255, ${alpha})`;
          break;
        case 'direct':
          nodeColor = `rgba(0, 255, 0, ${alpha})`;
          break;
      }

      // Draw node
      ctx.fillStyle = nodeColor;
      ctx.beginPath();
      const nodeSize = node.nodeType === 'gateway' ? 6 : node.nodeType === 'relay' ? 4 : 3;
      ctx.arc(node.position.x, node.position.y, nodeSize, 0, Math.PI * 2);
      ctx.fill();

      // Add node glow
      ctx.shadowColor = nodeColor;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw node info on hover/selection
      if (selectedNode?.id === node.id) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(node.position.x + 10, node.position.y - 30, 120, 60);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.font = '10px monospace';
        ctx.fillText(node.user.alias, node.position.x + 15, node.position.y - 15);
        ctx.fillText(`${Math.round(node.distance)}m`, node.position.x + 15, node.position.y - 5);
        ctx.fillText(`${Math.round(node.signalStrength * 100)}%`, node.position.x + 15, node.position.y + 5);
        ctx.fillText(node.connectionType, node.position.x + 15, node.position.y + 15);
      }
    });

    // Draw center point (current user)
    ctx.fillStyle = 'rgba(255, 0, 0, 1)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw crosshairs
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - 10, centerY);
    ctx.lineTo(centerX + 10, centerY);
    ctx.moveTo(centerX, centerY - 10);
    ctx.lineTo(centerX, centerY + 10);
    ctx.stroke();
  }, [radarAngle, radarBlips, detectedNodes, selectedNode, radarRange, radarMode, pulsePhase]);

  // Redraw canvas
  useEffect(() => {
    drawRadar();
  }, [drawRadar]);

  // Handle canvas click
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Find clicked node
    const clickedNode = detectedNodes.find(node => {
      const distance = Math.sqrt(
        Math.pow(clickX - node.position.x, 2) + 
        Math.pow(clickY - node.position.y, 2)
      );
      return distance <= 10;
    });

    if (clickedNode) {
      setSelectedNode(selectedNode?.id === clickedNode.id ? null : clickedNode);
      onUserSelect?.(clickedNode.user);
    } else {
      setSelectedNode(null);
    }
  }, [detectedNodes, selectedNode, onUserSelect]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex-1 flex gap-4 p-4">
        {/* Radar Display */}
        <div className="flex-1">
          <Card className="h-full bg-black/90 border-green-500/30">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-green-400">
                  <Radar className="w-5 h-5" />
                  Mesh Network Radar
                  {isScanning && (
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={isScanning ? "default" : "outline"}
                    onClick={() => setIsScanning(!isScanning)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isScanning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    {detectedNodes.length} Nodes
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={600}
                  className="w-full border border-green-500/30 cursor-crosshair"
                  onClick={handleCanvasClick}
                />
                <div className="absolute top-2 left-2 text-green-400 font-mono text-xs">
                  <div>Mode: {radarMode.toUpperCase()}</div>
                  <div>Range: {radarRange[0]}m</div>
                  <div>Sweep: {radarAngle.toFixed(1)}°</div>
                  <div>Nodes: {detectedNodes.filter(n => n.isActive).length}/{detectedNodes.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Control Panel */}
        <div className="w-80">
          <Card className="h-full bg-slate-900/90 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Radar Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Radar Mode */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Scanning Mode
                </label>
                <Tabs value={radarMode} onValueChange={(v) => setRadarMode(v as any)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="sweep">Sweep</TabsTrigger>
                    <TabsTrigger value="pulse">Pulse</TabsTrigger>
                    <TabsTrigger value="sector">Sector</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Scan Speed */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Scan Speed: {scanSpeed[0]}°/s
                </label>
                <Slider
                  value={scanSpeed}
                  onValueChange={setScanSpeed}
                  max={10}
                  min={0.5}
                  step={0.5}
                  className="w-full"
                />
              </div>

              {/* Radar Range */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Radar Range: {radarRange[0]}m
                </label>
                <Slider
                  value={radarRange}
                  onValueChange={setRadarRange}
                  max={500}
                  min={100}
                  step={25}
                  className="w-full"
                />
              </div>

              {/* Show Connections */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300">
                  Show Connections
                </label>
                <Switch
                  checked={showConnections}
                  onCheckedChange={setShowConnections}
                />
              </div>

              {/* Selected Node Info */}
              {selectedNode && (
                <div className="border border-slate-700 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-white">Node Details</h3>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selectedNode.user.avatar} />
                      <AvatarFallback>
                        {selectedNode.user.alias.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-white">{selectedNode.user.alias}</div>
                      <div className="text-sm text-slate-400">{selectedNode.nodeType}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-slate-400">Distance:</span>
                      <span className="text-white ml-1">{Math.round(selectedNode.distance)}m</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Signal:</span>
                      <span className="text-white ml-1">{Math.round(selectedNode.signalStrength * 100)}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Type:</span>
                      <span className="text-white ml-1">{selectedNode.connectionType}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Status:</span>
                      <Badge 
                        variant={selectedNode.isActive ? "default" : "secondary"}
                        className="ml-1"
                      >
                        {selectedNode.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => onUserSelect?.(selectedNode.user)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                </div>
              )}

              {/* Network Stats */}
              <div className="border border-slate-700 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-white">Network Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Active Nodes:</span>
                    <span className="text-green-400">
                      {detectedNodes.filter(n => n.isActive).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Average Signal:</span>
                    <span className="text-green-400">
                      {Math.round(detectedNodes.reduce((sum, n) => sum + n.signalStrength, 0) / detectedNodes.length * 100) || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Connections:</span>
                    <span className="text-green-400">
                      {detectedNodes.filter(n => n.connectionType === 'mesh').length}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}