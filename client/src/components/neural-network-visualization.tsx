import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  Activity,
  Zap,
  Cpu,
  TrendingUp,
  Eye,
  Layers,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Network
} from 'lucide-react';

interface Neuron {
  id: string;
  layer: number;
  position: { x: number; y: number };
  activation: number;
  bias: number;
  isActive: boolean;
}

interface Connection {
  id: string;
  from: string;
  to: string;
  weight: number;
  signal: number;
}

interface NeuralNetworkVisualizationProps {
  currentUser: any;
  isOffline: boolean;
}

export function NeuralNetworkVisualization({ currentUser, isOffline }: NeuralNetworkVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  const [neurons, setNeurons] = useState<Neuron[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [networkMetrics, setNetworkMetrics] = useState({
    accuracy: 0,
    loss: 0,
    learningRate: 0.01,
    epoch: 0
  });
  
  const [networkConfig, setNetworkConfig] = useState({
    inputNodes: 8,
    hiddenLayers: 2,
    hiddenNodes: 12,
    outputNodes: 4,
    activationFunction: 'relu'
  });

  // Initialize neural network
  useEffect(() => {
    const newNeurons: Neuron[] = [];
    const newConnections: Connection[] = [];
    
    const layers = [
      networkConfig.inputNodes,
      ...Array(networkConfig.hiddenLayers).fill(networkConfig.hiddenNodes),
      networkConfig.outputNodes
    ];
    
    let neuronId = 0;
    
    // Create neurons
    layers.forEach((nodeCount, layerIndex) => {
      for (let i = 0; i < nodeCount; i++) {
        const x = 100 + layerIndex * 120;
        const y = 100 + (i * 400) / nodeCount + (400 - nodeCount * 40) / 2;
        
        newNeurons.push({
          id: `neuron-${neuronId++}`,
          layer: layerIndex,
          position: { x, y },
          activation: Math.random(),
          bias: (Math.random() - 0.5) * 2,
          isActive: true
        });
      }
    });
    
    // Create connections
    let connectionId = 0;
    for (let layer = 0; layer < layers.length - 1; layer++) {
      const currentLayerNodes = newNeurons.filter(n => n.layer === layer);
      const nextLayerNodes = newNeurons.filter(n => n.layer === layer + 1);
      
      currentLayerNodes.forEach(fromNode => {
        nextLayerNodes.forEach(toNode => {
          newConnections.push({
            id: `connection-${connectionId++}`,
            from: fromNode.id,
            to: toNode.id,
            weight: (Math.random() - 0.5) * 2,
            signal: 0
          });
        });
      });
    }
    
    setNeurons(newNeurons);
    setConnections(newConnections);
  }, [networkConfig]);

  // Neural network animation
  const animateNetwork = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with neural background
    const gradient = ctx.createLinearGradient(0, 0, 600, 400);
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(0.5, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 400);

    const time = Date.now() * 0.001;

    // Draw connections
    connections.forEach(connection => {
      const fromNeuron = neurons.find(n => n.id === connection.from);
      const toNeuron = neurons.find(n => n.id === connection.to);
      
      if (fromNeuron && toNeuron) {
        const signalIntensity = Math.abs(connection.signal);
        const opacity = 0.2 + signalIntensity * 0.6;
        
        // Connection line
        const connectionColor = connection.weight > 0 ? 
          `rgba(100, 255, 150, ${opacity})` : 
          `rgba(255, 100, 150, ${opacity})`;
        
        ctx.strokeStyle = connectionColor;
        ctx.lineWidth = 1 + Math.abs(connection.weight) * 2;
        ctx.beginPath();
        ctx.moveTo(fromNeuron.position.x, fromNeuron.position.y);
        ctx.lineTo(toNeuron.position.x, toNeuron.position.y);
        ctx.stroke();

        // Signal pulse animation
        if (isTraining && signalIntensity > 0.1) {
          const pulseProgress = (time * 2 + Math.abs(connection.weight) * 10) % 1;
          const pulseX = fromNeuron.position.x + (toNeuron.position.x - fromNeuron.position.x) * pulseProgress;
          const pulseY = fromNeuron.position.y + (toNeuron.position.y - fromNeuron.position.y) * pulseProgress;
          
          ctx.fillStyle = `rgba(255, 255, 255, ${signalIntensity})`;
          ctx.beginPath();
          ctx.arc(pulseX, pulseY, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });

    // Draw neurons
    neurons.forEach((neuron, index) => {
      const pulsation = Math.sin(time * 3 + index * 0.5) * 0.3 + 0.7;
      const activationLevel = neuron.activation;
      
      // Neuron glow effect
      const glowSize = 20 + activationLevel * 15;
      const glowGradient = ctx.createRadialGradient(
        neuron.position.x, neuron.position.y, 0,
        neuron.position.x, neuron.position.y, glowSize
      );
      
      const layerColors = [
        'rgba(100, 150, 255, 0.4)', // Input layer
        'rgba(255, 150, 100, 0.4)', // Hidden layers
        'rgba(150, 255, 100, 0.4)'  // Output layer
      ];
      
      const colorIndex = neuron.layer === 0 ? 0 : 
                        neuron.layer === Math.max(...neurons.map(n => n.layer)) ? 2 : 1;
      
      glowGradient.addColorStop(0, layerColors[colorIndex].replace('0.4', String(activationLevel * 0.6)));
      glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(neuron.position.x, neuron.position.y, glowSize, 0, Math.PI * 2);
      ctx.fill();

      // Neuron core
      const coreSize = 6 + activationLevel * 6;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.8 + activationLevel * 0.2})`;
      ctx.beginPath();
      ctx.arc(neuron.position.x, neuron.position.y, coreSize, 0, Math.PI * 2);
      ctx.fill();

      // Activation level indicator
      if (activationLevel > 0.5) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          activationLevel.toFixed(1),
          neuron.position.x,
          neuron.position.y - 15
        );
      }
    });

    // Layer labels
    const layerLabels = ['Input', 'Hidden', 'Hidden', 'Output'];
    const uniqueLayers = Array.from(new Set(neurons.map(n => n.layer)));
    
    uniqueLayers.forEach(layer => {
      const layerNeurons = neurons.filter(n => n.layer === layer);
      if (layerNeurons.length > 0) {
        const avgY = layerNeurons.reduce((sum, n) => sum + n.position.y, 0) / layerNeurons.length;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          layerLabels[Math.min(layer, layerLabels.length - 1)],
          layerNeurons[0].position.x,
          avgY + 50
        );
      }
    });

    if (isTraining) {
      animationRef.current = requestAnimationFrame(animateNetwork);
    }
  }, [neurons, connections, isTraining]);

  // Start/stop animation
  useEffect(() => {
    if (isTraining) {
      animateNetwork();
    } else {
      cancelAnimationFrame(animationRef.current);
    }
    
    return () => cancelAnimationFrame(animationRef.current);
  }, [isTraining, animateNetwork]);

  // Simulate training process
  useEffect(() => {
    if (!isTraining) return;

    const trainingInterval = setInterval(() => {
      // Update neuron activations
      setNeurons(prev => prev.map(neuron => ({
        ...neuron,
        activation: Math.max(0, Math.min(1, neuron.activation + (Math.random() - 0.5) * 0.1))
      })));

      // Update connection signals
      setConnections(prev => prev.map(connection => ({
        ...connection,
        signal: Math.random() * connection.weight
      })));

      // Update training metrics
      setNetworkMetrics(prev => ({
        ...prev,
        accuracy: Math.min(0.99, prev.accuracy + Math.random() * 0.01),
        loss: Math.max(0.01, prev.loss - Math.random() * 0.01),
        epoch: prev.epoch + 1
      }));
    }, 100);

    return () => clearInterval(trainingInterval);
  }, [isTraining]);

  const startTraining = () => {
    setIsTraining(true);
    setNetworkMetrics(prev => ({ ...prev, epoch: 0 }));
  };

  const resetNetwork = () => {
    setIsTraining(false);
    setNetworkMetrics({
      accuracy: 0,
      loss: 1,
      learningRate: 0.01,
      epoch: 0
    });
    
    // Reset neuron activations
    setNeurons(prev => prev.map(neuron => ({
      ...neuron,
      activation: Math.random()
    })));
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="p-4 border-b border-blue-500/30 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Neural Network AI</h2>
              <p className="text-sm text-blue-300">Real-time deep learning visualization</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-500/20 border-blue-400">
              Epoch {networkMetrics.epoch}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={startTraining}
              disabled={isTraining}
              className="border-blue-400 text-blue-300 hover:bg-blue-500/20"
            >
              <Play className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTraining(false)}
              disabled={!isTraining}
              className="border-blue-400 text-blue-300 hover:bg-blue-500/20"
            >
              <Pause className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetNetwork}
              className="border-blue-400 text-blue-300 hover:bg-blue-500/20"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Visualization */}
        <div className="flex-1 p-4">
          <Card className="h-full bg-black/40 border-blue-500/30">
            <CardContent className="p-4 h-full flex flex-col">
              <div className="flex-1 flex justify-center items-center">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={400}
                  className="border border-blue-500/30 rounded-lg"
                  style={{ maxWidth: '100%', maxHeight: '100%' }}
                />
              </div>
              
              {/* Training Metrics */}
              <div className="mt-4 grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {(networkMetrics.accuracy * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-green-300">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {networkMetrics.loss.toFixed(3)}
                  </div>
                  <div className="text-xs text-red-300">Loss</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {networkMetrics.learningRate}
                  </div>
                  <div className="text-xs text-blue-300">Learning Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {neurons.length}
                  </div>
                  <div className="text-xs text-purple-300">Neurons</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Control Panel */}
        <div className="w-80 p-4">
          <Tabs defaultValue="architecture" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 bg-blue-900/50">
              <TabsTrigger value="architecture">Architecture</TabsTrigger>
              <TabsTrigger value="training">Training</TabsTrigger>
            </TabsList>

            <TabsContent value="architecture" className="space-y-4">
              <Card className="bg-black/40 border-blue-500/30">
                <CardHeader>
                  <CardTitle className="text-blue-300 text-sm">Network Architecture</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs text-blue-300 mb-2 block">Input Nodes</label>
                    <Slider
                      value={[networkConfig.inputNodes]}
                      onValueChange={([value]) => 
                        setNetworkConfig(prev => ({ ...prev, inputNodes: value }))
                      }
                      min={4}
                      max={16}
                      step={1}
                      className="w-full"
                    />
                    <span className="text-xs text-blue-400">{networkConfig.inputNodes}</span>
                  </div>

                  <div>
                    <label className="text-xs text-blue-300 mb-2 block">Hidden Layers</label>
                    <Slider
                      value={[networkConfig.hiddenLayers]}
                      onValueChange={([value]) => 
                        setNetworkConfig(prev => ({ ...prev, hiddenLayers: value }))
                      }
                      min={1}
                      max={4}
                      step={1}
                      className="w-full"
                    />
                    <span className="text-xs text-blue-400">{networkConfig.hiddenLayers}</span>
                  </div>

                  <div>
                    <label className="text-xs text-blue-300 mb-2 block">Hidden Nodes</label>
                    <Slider
                      value={[networkConfig.hiddenNodes]}
                      onValueChange={([value]) => 
                        setNetworkConfig(prev => ({ ...prev, hiddenNodes: value }))
                      }
                      min={6}
                      max={20}
                      step={1}
                      className="w-full"
                    />
                    <span className="text-xs text-blue-400">{networkConfig.hiddenNodes}</span>
                  </div>

                  <div>
                    <label className="text-xs text-blue-300 mb-2 block">Output Nodes</label>
                    <Slider
                      value={[networkConfig.outputNodes]}
                      onValueChange={([value]) => 
                        setNetworkConfig(prev => ({ ...prev, outputNodes: value }))
                      }
                      min={2}
                      max={8}
                      step={1}
                      className="w-full"
                    />
                    <span className="text-xs text-blue-400">{networkConfig.outputNodes}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="training" className="space-y-4">
              <Card className="bg-black/40 border-blue-500/30">
                <CardHeader>
                  <CardTitle className="text-blue-300 text-sm">Training Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-blue-300">Accuracy</span>
                      <span className="text-xs text-white">
                        {(networkMetrics.accuracy * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={networkMetrics.accuracy * 100} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-blue-300">Loss Reduction</span>
                      <span className="text-xs text-white">
                        {((1 - networkMetrics.loss) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={(1 - networkMetrics.loss) * 100} className="h-2" />
                  </div>

                  <div>
                    <label className="text-xs text-blue-300 mb-2 block">Learning Rate</label>
                    <Slider
                      value={[networkMetrics.learningRate * 100]}
                      onValueChange={([value]) => 
                        setNetworkMetrics(prev => ({ ...prev, learningRate: value / 100 }))
                      }
                      min={1}
                      max={10}
                      step={0.1}
                      className="w-full"
                    />
                    <span className="text-xs text-blue-400">{networkMetrics.learningRate.toFixed(3)}</span>
                  </div>

                  <div className="pt-4">
                    <div className="text-xs text-blue-300 mb-2">Training Status</div>
                    <Badge variant={isTraining ? "default" : "outline"} className="w-full justify-center">
                      {isTraining ? "Training Active" : "Training Stopped"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}