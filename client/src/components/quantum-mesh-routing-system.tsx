import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Zap,
  Network,
  Activity,
  Cpu,
  Radio,
  Wifi,
  Globe,
  AtomIcon,
  GitBranch,
  TrendingUp,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Layers,
  Target
} from 'lucide-react';

interface QuantumNode {
  id: string;
  position: { x: number; y: number; z: number };
  entanglements: string[];
  quantumState: 'superposition' | 'collapsed' | 'entangled';
  coherenceTime: number;
  fidelity: number;
  isActive: boolean;
}

interface QuantumRoute {
  id: string;
  nodes: string[];
  entanglementStrength: number;
  decoherenceRate: number;
  throughput: number;
  latency: number;
}

interface QuantumMeshRoutingSystemProps {
  currentUser: any;
  availableUsers: any[];
  isOffline: boolean;
}

export function QuantumMeshRoutingSystem({ currentUser, availableUsers, isOffline }: QuantumMeshRoutingSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  const [quantumNodes, setQuantumNodes] = useState<QuantumNode[]>([]);
  const [quantumRoutes, setQuantumRoutes] = useState<QuantumRoute[]>([]);
  const [isSimulating, setIsSimulating] = useState(true);
  const [selectedNode, setSelectedNode] = useState<QuantumNode | null>(null);
  const [networkMetrics, setNetworkMetrics] = useState({
    totalEntanglements: 0,
    coherenceIndex: 0,
    networkFidelity: 0,
    quantumThroughput: 0
  });
  
  // Quantum simulation parameters
  const [simulationParams, setSimulationParams] = useState({
    coherenceTime: 5000, // ms
    entanglementRange: 200, // pixels
    decoherenceRate: 0.001,
    quantumAdvantage: true
  });

  // Initialize quantum nodes based on available users
  useEffect(() => {
    const nodes = availableUsers.slice(0, 12).map((user, index) => ({
      id: `quantum-${user.id}`,
      position: {
        x: 300 + Math.cos(index * (Math.PI * 2) / 12) * 150,
        y: 300 + Math.sin(index * (Math.PI * 2) / 12) * 150,
        z: Math.random() * 100
      },
      entanglements: [] as string[],
      quantumState: 'superposition' as const,
      coherenceTime: simulationParams.coherenceTime,
      fidelity: 0.95 + Math.random() * 0.05,
      isActive: true
    }));

    // Create quantum entanglements
    nodes.forEach(node => {
      const nearbyNodes = nodes.filter(other => 
        other.id !== node.id && 
        calculateDistance(node.position, other.position) < simulationParams.entanglementRange
      );
      
      node.entanglements = nearbyNodes
        .slice(0, Math.floor(Math.random() * 3) + 1)
        .map(n => n.id) as string[];
    });

    setQuantumNodes(nodes);
    
    // Generate quantum routes
    const routes = generateQuantumRoutes(nodes);
    setQuantumRoutes(routes);
  }, [availableUsers, simulationParams.entanglementRange]);

  // Calculate distance between two 3D points
  const calculateDistance = (pos1: { x: number; y: number; z: number }, pos2: { x: number; y: number; z: number }) => {
    return Math.sqrt(
      Math.pow(pos1.x - pos2.x, 2) + 
      Math.pow(pos1.y - pos2.y, 2) + 
      Math.pow(pos1.z - pos2.z, 2)
    );
  };

  // Generate quantum routes using quantum-inspired algorithms
  const generateQuantumRoutes = (nodes: QuantumNode[]): QuantumRoute[] => {
    const routes: QuantumRoute[] = [];
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];
        
        if (nodeA.entanglements.includes(nodeB.id)) {
          const distance = calculateDistance(nodeA.position, nodeB.position);
          const entanglementStrength = Math.max(0.1, 1 - (distance / simulationParams.entanglementRange));
          
          routes.push({
            id: `route-${nodeA.id}-${nodeB.id}`,
            nodes: [nodeA.id, nodeB.id],
            entanglementStrength,
            decoherenceRate: simulationParams.decoherenceRate * (1 + Math.random() * 0.5),
            throughput: entanglementStrength * 1000, // Mbps
            latency: distance / 10 // Simulated quantum latency
          });
        }
      }
    }
    
    return routes;
  };

  // Quantum simulation animation
  const animateQuantumNetwork = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isSimulating) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with quantum background
    const gradient = ctx.createRadialGradient(300, 300, 0, 300, 300, 300);
    gradient.addColorStop(0, 'rgba(20, 20, 40, 0.95)');
    gradient.addColorStop(0.5, 'rgba(10, 10, 30, 0.98)');
    gradient.addColorStop(1, 'rgba(5, 5, 20, 1)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 600);

    // Draw quantum field grid
    ctx.strokeStyle = 'rgba(100, 150, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 600; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 600);
      ctx.stroke();
    }
    for (let y = 0; y < 600; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(600, y);
      ctx.stroke();
    }

    const time = Date.now() * 0.001;

    // Draw quantum entanglements
    quantumRoutes.forEach(route => {
      const nodeA = quantumNodes.find(n => n.id === route.nodes[0]);
      const nodeB = quantumNodes.find(n => n.id === route.nodes[1]);
      
      if (nodeA && nodeB && nodeA.isActive && nodeB.isActive) {
        const pulsation = Math.sin(time * 3 + route.entanglementStrength * 10) * 0.5 + 0.5;
        const opacity = route.entanglementStrength * (0.3 + pulsation * 0.4);
        
        // Quantum entanglement beam
        const gradient = ctx.createLinearGradient(
          nodeA.position.x, nodeA.position.y,
          nodeB.position.x, nodeB.position.y
        );
        gradient.addColorStop(0, `rgba(100, 200, 255, ${opacity})`);
        gradient.addColorStop(0.5, `rgba(200, 100, 255, ${opacity * 1.2})`);
        gradient.addColorStop(1, `rgba(255, 100, 200, ${opacity})`);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2 + pulsation * 3;
        ctx.beginPath();
        ctx.moveTo(nodeA.position.x, nodeA.position.y);
        ctx.lineTo(nodeB.position.x, nodeB.position.y);
        ctx.stroke();

        // Quantum particles along the connection
        const particleCount = Math.floor(route.throughput / 200);
        for (let i = 0; i < particleCount; i++) {
          const progress = (time * 0.5 + i / particleCount) % 1;
          const particleX = nodeA.position.x + (nodeB.position.x - nodeA.position.x) * progress;
          const particleY = nodeA.position.y + (nodeB.position.y - nodeA.position.y) * progress;
          
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 2})`;
          ctx.beginPath();
          ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });

    // Draw quantum nodes
    quantumNodes.forEach((node, index) => {
      if (!node.isActive) return;

      const pulsation = Math.sin(time * 2 + index) * 0.3 + 0.7;
      const quantumGlow = Math.sin(time * 4 + index * 0.5) * 0.5 + 0.5;
      
      // Quantum superposition field
      const fieldSize = 40 + quantumGlow * 20;
      const fieldGradient = ctx.createRadialGradient(
        node.position.x, node.position.y, 0,
        node.position.x, node.position.y, fieldSize
      );
      
      switch (node.quantumState) {
        case 'superposition':
          fieldGradient.addColorStop(0, `rgba(100, 255, 200, ${0.3 * pulsation})`);
          fieldGradient.addColorStop(1, 'rgba(100, 255, 200, 0)');
          break;
        case 'entangled':
          fieldGradient.addColorStop(0, `rgba(255, 100, 255, ${0.4 * pulsation})`);
          fieldGradient.addColorStop(1, 'rgba(255, 100, 255, 0)');
          break;
        case 'collapsed':
          fieldGradient.addColorStop(0, `rgba(255, 200, 100, ${0.2 * pulsation})`);
          fieldGradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
          break;
      }
      
      ctx.fillStyle = fieldGradient;
      ctx.beginPath();
      ctx.arc(node.position.x, node.position.y, fieldSize, 0, Math.PI * 2);
      ctx.fill();

      // Node core
      const coreSize = 8 + pulsation * 4;
      ctx.fillStyle = node.quantumState === 'superposition' ? 
        `rgba(200, 255, 255, ${pulsation})` : 
        node.quantumState === 'entangled' ? 
        `rgba(255, 200, 255, ${pulsation})` : 
        `rgba(255, 255, 200, ${pulsation})`;
      
      ctx.beginPath();
      ctx.arc(node.position.x, node.position.y, coreSize, 0, Math.PI * 2);
      ctx.fill();

      // Quantum state indicator
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        node.quantumState.charAt(0).toUpperCase(),
        node.position.x,
        node.position.y - 20
      );
    });

    if (isSimulating) {
      animationRef.current = requestAnimationFrame(animateQuantumNetwork);
    }
  }, [quantumNodes, quantumRoutes, isSimulating]);

  // Start/stop animation
  useEffect(() => {
    if (isSimulating) {
      animateQuantumNetwork();
    } else {
      cancelAnimationFrame(animationRef.current);
    }
    
    return () => cancelAnimationFrame(animationRef.current);
  }, [isSimulating, animateQuantumNetwork]);

  // Update network metrics
  useEffect(() => {
    const totalEntanglements = quantumNodes.reduce((sum, node) => sum + node.entanglements.length, 0);
    const coherenceIndex = quantumNodes.filter(n => n.quantumState === 'superposition').length / quantumNodes.length;
    const networkFidelity = quantumNodes.reduce((sum, node) => sum + node.fidelity, 0) / quantumNodes.length;
    const quantumThroughput = quantumRoutes.reduce((sum, route) => sum + route.throughput, 0);

    setNetworkMetrics({
      totalEntanglements,
      coherenceIndex: Math.round(coherenceIndex * 100),
      networkFidelity: Math.round(networkFidelity * 100),
      quantumThroughput: Math.round(quantumThroughput)
    });
  }, [quantumNodes, quantumRoutes]);

  // Handle node selection
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const clickedNode = quantumNodes.find(node => {
      const distance = Math.sqrt(
        Math.pow(node.position.x - x, 2) + Math.pow(node.position.y - y, 2)
      );
      return distance < 20;
    });

    setSelectedNode(clickedNode || null);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="p-4 border-b border-purple-500/30 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600">
              <AtomIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Quantum Mesh Routing</h2>
              <p className="text-sm text-purple-300">Advanced quantum-inspired network topology</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-purple-500/20 border-purple-400">
              {networkMetrics.totalEntanglements} Entanglements
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSimulating(!isSimulating)}
              className="border-purple-400 text-purple-300 hover:bg-purple-500/20"
            >
              {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Visualization */}
        <div className="flex-1 p-4">
          <Card className="h-full bg-black/40 border-purple-500/30">
            <CardContent className="p-4 h-full flex flex-col">
              <div className="flex-1 flex justify-center items-center">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={600}
                  onClick={handleCanvasClick}
                  className="border border-purple-500/30 rounded-lg cursor-crosshair"
                  style={{ maxWidth: '100%', maxHeight: '100%' }}
                />
              </div>
              
              {/* Network Metrics */}
              <div className="mt-4 grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{networkMetrics.coherenceIndex}%</div>
                  <div className="text-xs text-purple-300">Coherence</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-400">{networkMetrics.networkFidelity}%</div>
                  <div className="text-xs text-pink-300">Fidelity</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-400">{networkMetrics.quantumThroughput}</div>
                  <div className="text-xs text-cyan-300">Throughput</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{quantumNodes.length}</div>
                  <div className="text-xs text-green-300">Q-Nodes</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Control Panel */}
        <div className="w-80 p-4">
          <Tabs defaultValue="controls" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 bg-purple-900/50">
              <TabsTrigger value="controls">Controls</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="controls" className="space-y-4">
              <Card className="bg-black/40 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-purple-300 text-sm">Quantum Parameters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs text-purple-300 mb-2 block">Coherence Time</label>
                    <Slider
                      value={[simulationParams.coherenceTime]}
                      onValueChange={([value]) => 
                        setSimulationParams(prev => ({ ...prev, coherenceTime: value }))
                      }
                      min={1000}
                      max={10000}
                      step={500}
                      className="w-full"
                    />
                    <span className="text-xs text-purple-400">{simulationParams.coherenceTime}ms</span>
                  </div>

                  <div>
                    <label className="text-xs text-purple-300 mb-2 block">Entanglement Range</label>
                    <Slider
                      value={[simulationParams.entanglementRange]}
                      onValueChange={([value]) => 
                        setSimulationParams(prev => ({ ...prev, entanglementRange: value }))
                      }
                      min={100}
                      max={300}
                      step={10}
                      className="w-full"
                    />
                    <span className="text-xs text-purple-400">{simulationParams.entanglementRange}px</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-xs text-purple-300">Quantum Advantage</label>
                    <Switch
                      checked={simulationParams.quantumAdvantage}
                      onCheckedChange={(checked) => 
                        setSimulationParams(prev => ({ ...prev, quantumAdvantage: checked }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {selectedNode && (
                <Card className="bg-black/40 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-purple-300 text-sm">Selected Node</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-purple-300">State:</span>
                      <Badge variant="outline" className="text-xs">
                        {selectedNode.quantumState}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-purple-300">Fidelity:</span>
                      <span className="text-xs text-white">{(selectedNode.fidelity * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-purple-300">Entanglements:</span>
                      <span className="text-xs text-white">{selectedNode.entanglements.length}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {quantumRoutes.slice(0, 10).map((route, index) => (
                    <Card key={route.id} className="bg-black/40 border-purple-500/30">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-medium text-purple-300">Route #{index + 1}</span>
                          <Badge variant="outline" className="text-xs">
                            {route.entanglementStrength.toFixed(2)}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-xs text-purple-300">Throughput:</span>
                            <span className="text-xs text-white">{route.throughput.toFixed(0)} Mbps</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-purple-300">Latency:</span>
                            <span className="text-xs text-white">{route.latency.toFixed(1)}ms</span>
                          </div>
                          <Progress 
                            value={route.entanglementStrength * 100} 
                            className="h-1 mt-2"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}