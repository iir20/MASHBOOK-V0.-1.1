import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@shared/schema';
import { FuturisticCard, GlowButton, NeonText } from './modern-futuristic-theme';

import {
  Cpu, Zap, Network, Shield, TrendingUp, Coins, Award, Activity, Signal, Radio,
  Server, Gauge, Star, Trophy, Gift, ShoppingCart, Download, Upload, Wifi,
  Settings, Play, Pause, RotateCcw, Bluetooth, Users, Eye, Lock, Globe,
  Bitcoin, DollarSign, CreditCard, Wallet, Sparkles, Crown, Medal
} from 'lucide-react';

interface NodeStats {
  uptime: number;
  packetsRouted: number;
  bandwidth: number;
  points: number;
  reputation: number;
  isRunning: boolean;
  earnings: number;
  level: number;
  rank: string;
  meshConnections: number;
  bluetoothDevices: number;
  p2pMessages: number;
}

interface PointsHistory {
  id: string;
  action: string;
  points: number;
  timestamp: Date;
  type: 'earned' | 'spent' | 'bonus';
  category: 'relay' | 'story' | 'message' | 'discovery' | 'uptime' | 'purchase';
}

interface MarketItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'avatar' | 'badge' | 'theme' | 'emoji' | 'effect' | 'premium';
  icon: React.ReactNode;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  discount?: number;
  owned?: boolean;
}

interface RewardSystem {
  dailyBonus: number;
  streakDays: number;
  nextMilestone: number;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    progress: number;
    target: number;
    reward: number;
    unlocked: boolean;
  }>;
}

interface EnhancedNodeSystemV3Props {
  currentUser: User;
  isOffline: boolean;
  wsState: {
    isConnected: boolean;
    sendMessage: (message: any) => void;
  };
}

export function EnhancedNodeSystemV3({ currentUser, isOffline, wsState }: EnhancedNodeSystemV3Props) {
  const [nodeStats, setNodeStats] = useState<NodeStats>({
    uptime: 24.5,
    packetsRouted: 1247,
    bandwidth: 45.2,
    points: 1847,
    reputation: 94,
    isRunning: true,
    earnings: 256,
    level: 12,
    rank: 'Mesh Pioneer',
    meshConnections: 8,
    bluetoothDevices: 3,
    p2pMessages: 156
  });

  const [nodeSettings, setNodeSettings] = useState({
    enableRelay: true,
    enableEncryption: true,
    maxBandwidth: 100,
    enableP2P: true,
    enableMining: true,
    autoAcceptConnections: true,
    shareLocation: false,
    enableBluetooth: true,
    discoverableMode: true,
    autoBackup: true
  });

  const [rewardSystem, setRewardSystem] = useState<RewardSystem>({
    dailyBonus: 50,
    streakDays: 7,
    nextMilestone: 2000,
    achievements: [
      {
        id: '1',
        name: 'First Connection',
        description: 'Connect to your first peer',
        progress: 1,
        target: 1,
        reward: 100,
        unlocked: true
      },
      {
        id: '2', 
        name: 'Relay Master',
        description: 'Route 1000 messages',
        progress: 847,
        target: 1000,
        reward: 500,
        unlocked: false
      },
      {
        id: '3',
        name: 'Network Builder',
        description: 'Maintain 10 simultaneous connections',
        progress: 8,
        target: 10,
        reward: 250,
        unlocked: false
      }
    ]
  });

  const [pointsHistory, setPointsHistory] = useState<PointsHistory[]>([
    { id: '1', action: 'P2P Message Relayed', points: 5, timestamp: new Date(Date.now() - 300000), type: 'earned', category: 'relay' },
    { id: '2', action: 'Story Shared', points: 15, timestamp: new Date(Date.now() - 600000), type: 'earned', category: 'story' },
    { id: '3', action: 'Daily Login Bonus', points: 50, timestamp: new Date(Date.now() - 900000), type: 'bonus', category: 'uptime' },
    { id: '4', action: 'Network Discovery', points: 25, timestamp: new Date(Date.now() - 1200000), type: 'earned', category: 'discovery' },
    { id: '5', action: 'Premium Avatar', points: -75, timestamp: new Date(Date.now() - 1500000), type: 'spent', category: 'purchase' }
  ]);

  const [marketItems] = useState<MarketItem[]>([
    {
      id: '1',
      name: 'Cyber Avatar Collection',
      description: 'Futuristic avatar pack with neon effects and animations',
      cost: 150,
      type: 'avatar',
      icon: <Crown className="h-5 w-5" />,
      rarity: 'epic',
      discount: 20
    },
    {
      id: '2',
      name: 'Network Pioneer Badge',
      description: 'Exclusive badge for early network contributors',
      cost: 100,
      type: 'badge',
      icon: <Medal className="h-5 w-5" />,
      rarity: 'rare'
    },
    {
      id: '3',
      name: 'Matrix Theme Pack',
      description: 'Dark green matrix-style interface theme',
      cost: 75,
      type: 'theme',
      icon: <Sparkles className="h-5 w-5" />,
      rarity: 'rare'
    },
    {
      id: '4',
      name: 'Premium Encryption',
      description: 'Enhanced encryption algorithms for maximum security',
      cost: 200,
      type: 'premium',
      icon: <Shield className="h-5 w-5" />,
      rarity: 'legendary'
    }
  ]);

  const { toast } = useToast();

  // Update stats periodically
  useEffect(() => {
    if (nodeStats.isRunning && !isOffline) {
      const interval = setInterval(() => {
        setNodeStats(prev => ({
          ...prev,
          uptime: prev.uptime + 0.1,
          packetsRouted: prev.packetsRouted + Math.floor(Math.random() * 3),
          bandwidth: Math.max(0, prev.bandwidth + (Math.random() - 0.5) * 10),
          points: prev.points + Math.floor(Math.random() * 2),
          p2pMessages: prev.p2pMessages + Math.floor(Math.random() * 2)
        }));
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [nodeStats.isRunning, isOffline]);

  const toggleNodeStatus = () => {
    setNodeStats(prev => ({ ...prev, isRunning: !prev.isRunning }));
    toast({
      title: nodeStats.isRunning ? "Node Stopped" : "Node Started",
      description: nodeStats.isRunning 
        ? "Your mesh node is now offline" 
        : "Your mesh node is now active and earning points"
    });
  };

  const claimDailyBonus = () => {
    setNodeStats(prev => ({ ...prev, points: prev.points + rewardSystem.dailyBonus }));
    setRewardSystem(prev => ({ ...prev, streakDays: prev.streakDays + 1 }));
    
    const newHistory: PointsHistory = {
      id: Date.now().toString(),
      action: `Daily Bonus Day ${rewardSystem.streakDays + 1}`,
      points: rewardSystem.dailyBonus,
      timestamp: new Date(),
      type: 'bonus',
      category: 'uptime'
    };
    
    setPointsHistory(prev => [newHistory, ...prev.slice(0, 9)]);
    toast({
      title: "Daily Bonus Claimed!",
      description: `+${rewardSystem.dailyBonus} points earned. Streak: ${rewardSystem.streakDays + 1} days`
    });
  };

  const purchaseItem = (item: MarketItem) => {
    const finalCost = item.discount ? Math.floor(item.cost * (100 - item.discount) / 100) : item.cost;
    
    if (nodeStats.points >= finalCost) {
      setNodeStats(prev => ({ ...prev, points: prev.points - finalCost }));
      
      const newHistory: PointsHistory = {
        id: Date.now().toString(),
        action: `Purchased ${item.name}`,
        points: -finalCost,
        timestamp: new Date(),
        type: 'spent',
        category: 'purchase'
      };
      
      setPointsHistory(prev => [newHistory, ...prev.slice(0, 9)]);
      toast({
        title: "Purchase Successful!",
        description: `${item.name} has been added to your collection`
      });
    } else {
      toast({
        title: "Insufficient Points",
        description: `You need ${finalCost - nodeStats.points} more points`,
        variant: "destructive"
      });
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400';
      case 'rare': return 'text-blue-400';
      case 'epic': return 'text-purple-400';
      case 'legendary': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500/20';
      case 'rare': return 'bg-blue-500/20';
      case 'epic': return 'bg-purple-500/20';
      case 'legendary': return 'bg-yellow-500/20';
      default: return 'bg-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="marketplace">Exchange</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Node Status Card */}
          <FuturisticCard>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="h-5 w-5 text-blue-400" />
                  <NeonText>Mesh Node Status</NeonText>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {nodeStats.rank} • Level {nodeStats.level}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={nodeStats.isRunning ? "default" : "secondary"} className="flex items-center gap-1">
                  {nodeStats.isRunning ? <Activity className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                  {nodeStats.isRunning ? 'Active' : 'Inactive'}
                </Badge>
                <GlowButton onClick={toggleNodeStatus} variant={nodeStats.isRunning ? "destructive" : "default"}>
                  {nodeStats.isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {nodeStats.isRunning ? 'Stop' : 'Start'}
                </GlowButton>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="text-2xl font-bold text-blue-400">{nodeStats.points.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Points</div>
                </div>
                <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="text-2xl font-bold text-green-400">{nodeStats.reputation}%</div>
                  <div className="text-xs text-muted-foreground">Reputation</div>
                </div>
                <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <div className="text-2xl font-bold text-purple-400">{nodeStats.meshConnections}</div>
                  <div className="text-xs text-muted-foreground">Mesh Links</div>
                </div>
                <div className="text-center p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <div className="text-2xl font-bold text-orange-400">{nodeStats.uptime.toFixed(1)}h</div>
                  <div className="text-xs text-muted-foreground">Uptime</div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Bandwidth Usage</span>
                    <span>{nodeStats.bandwidth.toFixed(1)}%</span>
                  </div>
                  <Progress value={nodeStats.bandwidth} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Messages Routed</span>
                    <span>{nodeStats.packetsRouted}</span>
                  </div>
                  <Progress value={(nodeStats.packetsRouted / 2000) * 100} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>P2P Messages</span>
                    <span>{nodeStats.p2pMessages}</span>
                  </div>
                  <Progress value={(nodeStats.p2pMessages / 200) * 100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </FuturisticCard>

          {/* Real-time Activity */}
          <FuturisticCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-400" />
                Real-time Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {pointsHistory.slice(0, 8).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={entry.type === 'earned' ? 'text-green-400' : entry.type === 'bonus' ? 'text-blue-400' : 'text-red-400'}>
                          {entry.category}
                        </Badge>
                        <span className="text-sm">{entry.action}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${entry.points > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {entry.points > 0 ? '+' : ''}{entry.points}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {entry.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </FuturisticCard>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-6">
          {/* Daily Bonus */}
          <FuturisticCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-yellow-400" />
                Daily Rewards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
                <div>
                  <div className="font-medium">Daily Login Bonus</div>
                  <div className="text-sm text-muted-foreground">Streak: {rewardSystem.streakDays} days</div>
                </div>
                <GlowButton onClick={claimDailyBonus} className="bg-yellow-500/20 hover:bg-yellow-500/30">
                  <Coins className="h-4 w-4 mr-2" />
                  Claim {rewardSystem.dailyBonus}
                </GlowButton>
              </div>
            </CardContent>
          </FuturisticCard>

          {/* Achievements */}
          <FuturisticCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-purple-400" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rewardSystem.achievements.map((achievement) => (
                  <div key={achievement.id} className={`p-4 rounded-lg border ${achievement.unlocked ? 'bg-green-500/10 border-green-500/20' : 'bg-muted/20 border-muted/20'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{achievement.name}</div>
                      <Badge variant={achievement.unlocked ? "default" : "secondary"}>
                        {achievement.unlocked ? 'Unlocked' : `${achievement.reward} pts`}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                    <Progress value={(achievement.progress / achievement.target) * 100} className="h-2" />
                    <div className="text-xs text-muted-foreground mt-1">
                      {achievement.progress}/{achievement.target}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </FuturisticCard>
        </TabsContent>

        {/* Marketplace Tab */}
        <TabsContent value="marketplace" className="space-y-6">
          {/* Points Balance */}
          <FuturisticCard>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">{nodeStats.points.toLocaleString()}</div>
                <div className="text-muted-foreground">Available Points</div>
              </div>
            </CardContent>
          </FuturisticCard>

          {/* Market Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {marketItems.map((item) => {
              const finalCost = item.discount ? Math.floor(item.cost * (100 - item.discount) / 100) : item.cost;
              const canAfford = nodeStats.points >= finalCost;
              
              return (
                <FuturisticCard key={item.id} className={`${getRarityBg(item.rarity)} border-2 ${canAfford ? 'border-blue-500/30' : 'border-muted/20'}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.icon}
                        <div>
                          <CardTitle className={`text-lg ${getRarityColor(item.rarity)}`}>{item.name}</CardTitle>
                          <Badge variant="outline" className={getRarityColor(item.rarity)}>
                            {item.rarity}
                          </Badge>
                        </div>
                      </div>
                      {item.discount && (
                        <Badge variant="destructive" className="text-xs">-{item.discount}%</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-yellow-400" />
                        <span className="font-medium">{finalCost.toLocaleString()}</span>
                        {item.discount && (
                          <span className="text-xs text-muted-foreground line-through">{item.cost}</span>
                        )}
                      </div>
                      <GlowButton 
                        onClick={() => purchaseItem(item)}
                        disabled={!canAfford}
                        variant={canAfford ? "default" : "secondary"}
                        size="sm"
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        {canAfford ? 'Buy' : 'Not enough'}
                      </GlowButton>
                    </div>
                  </CardContent>
                </FuturisticCard>
              );
            })}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <FuturisticCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-400" />
                Node Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Connection Settings */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  Network Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-relay">Enable Message Relay</Label>
                    <Switch 
                      id="enable-relay"
                      checked={nodeSettings.enableRelay}
                      onCheckedChange={(checked) => setNodeSettings(prev => ({ ...prev, enableRelay: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-p2p">Enable P2P Direct</Label>
                    <Switch 
                      id="enable-p2p"
                      checked={nodeSettings.enableP2P}
                      onCheckedChange={(checked) => setNodeSettings(prev => ({ ...prev, enableP2P: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-bluetooth">Enable Bluetooth</Label>
                    <Switch 
                      id="enable-bluetooth"
                      checked={nodeSettings.enableBluetooth}
                      onCheckedChange={(checked) => setNodeSettings(prev => ({ ...prev, enableBluetooth: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-accept">Auto Accept Connections</Label>
                    <Switch 
                      id="auto-accept"
                      checked={nodeSettings.autoAcceptConnections}
                      onCheckedChange={(checked) => setNodeSettings(prev => ({ ...prev, autoAcceptConnections: checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* Security Settings */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Security & Privacy
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-encryption">Force Encryption</Label>
                    <Switch 
                      id="enable-encryption"
                      checked={nodeSettings.enableEncryption}
                      onCheckedChange={(checked) => setNodeSettings(prev => ({ ...prev, enableEncryption: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="share-location">Share Location</Label>
                    <Switch 
                      id="share-location"
                      checked={nodeSettings.shareLocation}
                      onCheckedChange={(checked) => setNodeSettings(prev => ({ ...prev, shareLocation: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="discoverable">Discoverable Mode</Label>
                    <Switch 
                      id="discoverable"
                      checked={nodeSettings.discoverableMode}
                      onCheckedChange={(checked) => setNodeSettings(prev => ({ ...prev, discoverableMode: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-backup">Auto Backup Data</Label>
                    <Switch 
                      id="auto-backup"
                      checked={nodeSettings.autoBackup}
                      onCheckedChange={(checked) => setNodeSettings(prev => ({ ...prev, autoBackup: checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* Performance Settings */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  Performance
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="max-bandwidth">Max Bandwidth Usage (%)</Label>
                    <Input
                      id="max-bandwidth"
                      type="number"
                      min="10"
                      max="100"
                      value={nodeSettings.maxBandwidth}
                      onChange={(e) => setNodeSettings(prev => ({ ...prev, maxBandwidth: parseInt(e.target.value) }))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </FuturisticCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}