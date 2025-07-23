import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@shared/schema';
import { FuturisticCard } from './modern-futuristic-theme';

import {
  Cpu,
  Zap,
  Network,
  Shield,
  TrendingUp,
  Coins,
  Award,
  Activity,
  Signal,
  Radio,
  Server,
  Gauge
} from 'lucide-react';

interface EnhancedNodeSystemProps {
  currentUser: User;
  isOffline: boolean;
}

interface NodeStats {
  uptime: number;
  packetsRouted: number;
  bandwidth: number;
  points: number;
  reputation: number;
  isRunning: boolean;
}

export function EnhancedNodeSystem({ currentUser, isOffline }: EnhancedNodeSystemProps) {
  const [nodeStats, setNodeStats] = useState<NodeStats>({
    uptime: 24.5,
    packetsRouted: 1247,
    bandwidth: 45.2,
    points: 342,
    reputation: 89,
    isRunning: false
  });

  const [nodeSettings, setNodeSettings] = useState({
    enableRelay: true,
    enableEncryption: true,
    maxBandwidth: 100,
    enableP2P: true,
    enableMining: false
  });

  const { toast } = useToast();

  useEffect(() => {
    if (nodeStats.isRunning && !isOffline) {
      const interval = setInterval(() => {
        setNodeStats(prev => ({
          ...prev,
          uptime: prev.uptime + 0.1,
          packetsRouted: prev.packetsRouted + Math.floor(Math.random() * 3),
          bandwidth: Math.max(0, Math.min(100, prev.bandwidth + (Math.random() - 0.5) * 10)),
          points: prev.points + Math.floor(Math.random() * 2),
          reputation: Math.max(0, Math.min(100, prev.reputation + (Math.random() - 0.4) * 2))
        }));
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [nodeStats.isRunning, isOffline]);

  const toggleNode = () => {
    if (isOffline) {
      toast({
        title: "Offline Mode",
        description: "Node services require online connectivity",
        variant: "destructive"
      });
      return;
    }

    setNodeStats(prev => ({ ...prev, isRunning: !prev.isRunning }));
    toast({
      title: nodeStats.isRunning ? "Node Stopped" : "Node Started",
      description: nodeStats.isRunning ? "Your mesh node is now offline" : "Your mesh node is now active and earning points",
    });
  };

  const getReputationColor = (rep: number) => {
    if (rep >= 80) return "bg-green-500";
    if (rep >= 60) return "bg-yellow-500";
    if (rep >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const pointsToNextLevel = Math.ceil(nodeStats.points / 100) * 100 - nodeStats.points;
  const currentLevel = Math.floor(nodeStats.points / 100) + 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
          Mesh Node Control
        </h2>
        <p className="text-muted-foreground">Run your node to earn points and help the network</p>
      </div>

      {/* Node Control Panel */}
      <FuturisticCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full ${nodeStats.isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            <h3 className="text-xl font-bold">Node Status</h3>
            <Badge variant={nodeStats.isRunning ? "default" : "secondary"}>
              {nodeStats.isRunning ? 'ACTIVE' : 'INACTIVE'}
            </Badge>
          </div>
          
          <Button
            onClick={toggleNode}
            disabled={isOffline}
            className={`px-6 ${nodeStats.isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
          >
            <Zap className="w-4 h-4 mr-2" />
            {nodeStats.isRunning ? 'Stop Node' : 'Start Node'}
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <FuturisticCard className="p-4 text-center">
            <Activity className="w-8 h-8 mx-auto mb-2 text-blue-400" />
            <p className="text-2xl font-bold">{nodeStats.uptime.toFixed(1)}h</p>
            <p className="text-sm text-muted-foreground">Uptime</p>
          </FuturisticCard>

          <FuturisticCard className="p-4 text-center">
            <Network className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <p className="text-2xl font-bold">{nodeStats.packetsRouted.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Packets Routed</p>
          </FuturisticCard>

          <FuturisticCard className="p-4 text-center">
            <Signal className="w-8 h-8 mx-auto mb-2 text-purple-400" />
            <p className="text-2xl font-bold">{nodeStats.bandwidth.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground">Bandwidth Usage</p>
          </FuturisticCard>

          <FuturisticCard className="p-4 text-center">
            <Shield className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
            <p className="text-2xl font-bold">{nodeStats.reputation.toFixed(0)}%</p>
            <p className="text-sm text-muted-foreground">Reputation</p>
          </FuturisticCard>
        </div>

        {/* Progress Bars */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <Label>Bandwidth Usage</Label>
              <span className="text-sm text-muted-foreground">{nodeStats.bandwidth.toFixed(1)}%</span>
            </div>
            <Progress value={nodeStats.bandwidth} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <Label>Network Reputation</Label>
              <span className="text-sm text-muted-foreground">{nodeStats.reputation.toFixed(0)}%</span>
            </div>
            <Progress value={nodeStats.reputation} className={`h-2 ${getReputationColor(nodeStats.reputation)}`} />
          </div>
        </div>
      </FuturisticCard>

      {/* Points System */}
      <FuturisticCard className="p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Coins className="w-5 h-5" />
          Points & Rewards
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-cyan-400">{nodeStats.points.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Points Earned</p>
              </div>
              <Award className="w-8 h-8 text-yellow-400" />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <Label>Level {currentLevel} Progress</Label>
                <span className="text-sm text-muted-foreground">{pointsToNextLevel} points to next level</span>
              </div>
              <Progress value={(nodeStats.points % 100)} className="h-3" />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Earning Opportunities</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Relay Messages:</span>
                <span className="font-mono">+1 point/msg</span>
              </div>
              <div className="flex justify-between">
                <span>Share Bandwidth:</span>
                <span className="font-mono">+2 points/MB</span>
              </div>
              <div className="flex justify-between">
                <span>Maintain Uptime:</span>
                <span className="font-mono">+5 points/hour</span>
              </div>
              <div className="flex justify-between">
                <span>High Reputation:</span>
                <span className="font-mono">+10 points/day</span>
              </div>
            </div>
          </div>
        </div>
      </FuturisticCard>

      {/* Node Settings */}
      <FuturisticCard className="p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Gauge className="w-5 h-5" />
          Node Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Message Relay</Label>
                <p className="text-sm text-muted-foreground">Route messages through your node</p>
              </div>
              <Switch
                checked={nodeSettings.enableRelay}
                onCheckedChange={(checked) => setNodeSettings(prev => ({ ...prev, enableRelay: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>P2P Connections</Label>
                <p className="text-sm text-muted-foreground">Allow direct peer connections</p>
              </div>
              <Switch
                checked={nodeSettings.enableP2P}
                onCheckedChange={(checked) => setNodeSettings(prev => ({ ...prev, enableP2P: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Advanced Encryption</Label>
                <p className="text-sm text-muted-foreground">Use military-grade encryption</p>
              </div>
              <Switch
                checked={nodeSettings.enableEncryption}
                onCheckedChange={(checked) => setNodeSettings(prev => ({ ...prev, enableEncryption: checked }))}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Max Bandwidth Allocation</Label>
              <div className="flex items-center gap-4">
                <Progress value={nodeSettings.maxBandwidth} className="flex-1" />
                <span className="text-sm font-mono w-12">{nodeSettings.maxBandwidth}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Point Mining</Label>
                <p className="text-sm text-muted-foreground">Earn extra points through computation</p>
              </div>
              <Switch
                checked={nodeSettings.enableMining}
                onCheckedChange={(checked) => setNodeSettings(prev => ({ ...prev, enableMining: checked }))}
              />
            </div>

            <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500">
              <Server className="w-4 h-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        </div>
      </FuturisticCard>
    </div>
  );
}