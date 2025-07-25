import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@shared/schema';
import { FuturisticCard, GlowButton, NeonText, AnimatedBackground } from './modern-futuristic-theme';

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
  Gauge,
  Star,
  Trophy,
  Gift,
  ShoppingCart,
  Download,
  Upload,
  Wifi,
  Settings,
  Play,
  Pause,
  RotateCcw
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
}

interface PointsHistory {
  id: string;
  action: string;
  points: number;
  timestamp: Date;
  type: 'earned' | 'spent';
}

interface MarketItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'avatar' | 'badge' | 'theme' | 'emoji' | 'effect';
  icon: React.ReactNode;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface EnhancedNodeSystemV2Props {
  currentUser: User;
  isOffline: boolean;
}

export function EnhancedNodeSystemV2({ currentUser, isOffline }: EnhancedNodeSystemV2Props) {
  const [nodeStats, setNodeStats] = useState<NodeStats>({
    uptime: 24.5,
    packetsRouted: 1247,
    bandwidth: 45.2,
    points: 342,
    reputation: 89,
    isRunning: false,
    earnings: 156,
    level: 7,
    rank: 'Relay Master'
  });

  const [nodeSettings, setNodeSettings] = useState({
    enableRelay: true,
    enableEncryption: true,
    maxBandwidth: 100,
    enableP2P: true,
    enableMining: false,
    autoAcceptConnections: true,
    shareLocation: false
  });

  const [pointsHistory, setPointsHistory] = useState<PointsHistory[]>([
    { id: '1', action: 'Message Relayed', points: 5, timestamp: new Date(Date.now() - 300000), type: 'earned' },
    { id: '2', action: 'Story Shared', points: 10, timestamp: new Date(Date.now() - 600000), type: 'earned' },
    { id: '3', action: 'Premium Avatar', points: -50, timestamp: new Date(Date.now() - 900000), type: 'spent' },
    { id: '4', action: 'Network Discovery', points: 15, timestamp: new Date(Date.now() - 1200000), type: 'earned' },
    { id: '5', action: 'Badge Purchase', points: -25, timestamp: new Date(Date.now() - 1500000), type: 'spent' }
  ]);

  const [marketItems] = useState<MarketItem[]>([
    {
      id: '1',
      name: 'Cyber Avatar Pack',
      description: 'Futuristic avatar collection with neon effects',
      cost: 100,
      type: 'avatar',
      icon: <Trophy className="h-5 w-5" />,
      rarity: 'epic'
    },
    {
      id: '2',
      name: 'Network Pioneer Badge',
      description: 'Exclusive badge for early network contributors',
      cost: 75,
      type: 'badge',
      icon: <Award className="h-5 w-5" />,
      rarity: 'rare'
    },
    {
      id: '3',
      name: 'Holographic Theme',
      description: 'Premium interface theme with holographic effects',
      cost: 200,
      type: 'theme',
      icon: <Star className="h-5 w-5" />,
      rarity: 'legendary'
    },
    {
      id: '4',
      name: 'Emoji Pack: Tech',
      description: 'Technology-themed emoji collection',
      cost: 30,
      type: 'emoji',
      icon: <Gift className="h-5 w-5" />,
      rarity: 'common'
    },
    {
      id: '5',
      name: 'Message Sparkle Effect',
      description: 'Add sparkle animations to your messages',
      cost: 50,
      type: 'effect',
      icon: <Zap className="h-5 w-5" />,
      rarity: 'rare'
    }
  ]);

  const [activeTab, setActiveTab] = useState<'overview' | 'points' | 'market' | 'settings'>('overview');

  const { toast } = useToast();

  // Simulate node activity and point earning
  useEffect(() => {
    if (nodeStats.isRunning && !isOffline) {
      const interval = setInterval(() => {
        setNodeStats(prev => {
          const pointsEarned = Math.floor(Math.random() * 3);
          const newPoints = prev.points + pointsEarned;
          
          // Add to history if points earned
          if (pointsEarned > 0) {
            const actions = [
              'Message Relayed',
              'Data Forwarded', 
              'Network Maintenance',
              'Peer Discovery',
              'Route Optimization'
            ];
            
            const newHistoryItem: PointsHistory = {
              id: Date.now().toString(),
              action: actions[Math.floor(Math.random() * actions.length)],
              points: pointsEarned,
              timestamp: new Date(),
              type: 'earned'
            };
            
            setPointsHistory(current => [newHistoryItem, ...current.slice(0, 19)]);
          }
          
          return {
            ...prev,
            uptime: prev.uptime + 0.1,
            packetsRouted: prev.packetsRouted + Math.floor(Math.random() * 3),
            bandwidth: Math.max(0, Math.min(100, prev.bandwidth + (Math.random() - 0.5) * 10)),
            points: newPoints,
            reputation: Math.max(0, Math.min(100, prev.reputation + (Math.random() - 0.4) * 2)),
            earnings: prev.earnings + (pointsEarned * 0.1),
            level: Math.floor(newPoints / 50) + 1
          };
        });
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [nodeStats.isRunning, isOffline]);

  const handleStartStop = () => {
    setNodeStats(prev => ({ ...prev, isRunning: !prev.isRunning }));
    
    toast({
      title: nodeStats.isRunning ? "Node Stopped" : "Node Started",
      description: nodeStats.isRunning 
        ? "Your mesh node has been stopped. You'll no longer earn points."
        : "Your mesh node is now active! You'll start earning points for network contributions.",
    });
  };

  const handleSettingChange = (key: keyof typeof nodeSettings, value: boolean | number) => {
    setNodeSettings(prev => ({ ...prev, [key]: value }));
    
    toast({
      title: "Settings Updated",
      description: "Your node configuration has been updated.",
    });
  };

  const handlePurchaseItem = (item: MarketItem) => {
    if (nodeStats.points < item.cost) {
      toast({
        title: "Insufficient Points",
        description: `You need ${item.cost - nodeStats.points} more points to purchase this item.`,
        variant: "destructive",
      });
      return;
    }

    setNodeStats(prev => ({ ...prev, points: prev.points - item.cost }));
    
    const purchaseRecord: PointsHistory = {
      id: Date.now().toString(),
      action: `Purchased: ${item.name}`,
      points: -item.cost,
      timestamp: new Date(),
      type: 'spent'
    };
    
    setPointsHistory(current => [purchaseRecord, ...current.slice(0, 19)]);
    
    toast({
      title: "Purchase Successful!",
      description: `You've purchased ${item.name} for ${item.cost} points.`,
    });
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

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-full space-y-6">
      <AnimatedBackground>
        <div></div>
      </AnimatedBackground>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <NeonText className="text-2xl font-bold flex items-center gap-2">
            <Server className="h-6 w-6" />
            Mesh Node Control
          </NeonText>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <span>Level {nodeStats.level} • {nodeStats.rank}</span>
            <Badge variant={nodeStats.isRunning ? 'default' : 'secondary'}>
              {nodeStats.isRunning ? 'Active' : 'Inactive'}
            </Badge>
            {isOffline && <Badge variant="destructive">Offline</Badge>}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <GlowButton
            onClick={handleStartStop}
            disabled={isOffline}
            className="flex items-center gap-2"
          >
            {nodeStats.isRunning ? (
              <>
                <Pause className="h-4 w-4" />
                Stop Node
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start Node
              </>
            )}
          </GlowButton>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex rounded-lg border p-1">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('overview')}
          className="flex-1"
        >
          <Activity className="h-4 w-4 mr-1" />
          Overview
        </Button>
        <Button
          variant={activeTab === 'points' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('points')}
          className="flex-1"
        >
          <Coins className="h-4 w-4 mr-1" />
          Points
        </Button>
        <Button
          variant={activeTab === 'market' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('market')}
          className="flex-1"
        >
          <ShoppingCart className="h-4 w-4 mr-1" />
          Market
        </Button>
        <Button
          variant={activeTab === 'settings' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('settings')}
          className="flex-1"
        >
          <Settings className="h-4 w-4 mr-1" />
          Settings
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Node Status */}
          <div className="lg:col-span-2 space-y-4">
            <FuturisticCard>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Gauge className="h-5 w-5" />
                    Node Performance
                  </span>
                  <Badge variant={nodeStats.isRunning ? 'default' : 'secondary'}>
                    {nodeStats.isRunning ? 'Running' : 'Stopped'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-cyan-400">{nodeStats.uptime.toFixed(1)}h</p>
                    <p className="text-sm text-muted-foreground">Uptime</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-green-400">{nodeStats.packetsRouted}</p>
                    <p className="text-sm text-muted-foreground">Packets Routed</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Bandwidth Usage</span>
                    <span>{nodeStats.bandwidth.toFixed(1)}%</span>
                  </div>
                  <Progress value={nodeStats.bandwidth} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Reputation Score</span>
                    <span>{nodeStats.reputation.toFixed(0)}/100</span>
                  </div>
                  <Progress value={nodeStats.reputation} className="h-2" />
                </div>
              </CardContent>
            </FuturisticCard>

            <FuturisticCard>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Earnings Summary
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-xl font-bold text-yellow-400">{nodeStats.points}</p>
                    <p className="text-xs text-muted-foreground">Current Points</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-xl font-bold text-green-400">${nodeStats.earnings.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Total Earnings</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-xl font-bold text-cyan-400">{nodeStats.level}</p>
                    <p className="text-xs text-muted-foreground">Node Level</p>
                  </div>
                </div>
              </CardContent>
            </FuturisticCard>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <FuturisticCard>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Network Status
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Signal className="h-4 w-4" />
                    <span className="text-sm">Connection Quality</span>
                  </div>
                  <Badge variant="default">Excellent</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Network className="h-4 w-4" />
                    <span className="text-sm">Mesh Connections</span>
                  </div>
                  <span className="text-sm font-medium">12 active</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4" />
                    <span className="text-sm">Relay Capacity</span>
                  </div>
                  <span className="text-sm font-medium">80%</span>
                </div>
              </CardContent>
            </FuturisticCard>

            <FuturisticCard>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Achievements
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm">First Connection</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                  <Star className="h-4 w-4 text-blue-400" />
                  <span className="text-sm">100 Messages Relayed</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                  <Zap className="h-4 w-4 text-purple-400" />
                  <span className="text-sm">24h Uptime</span>
                </div>
              </CardContent>
            </FuturisticCard>
          </div>
        </div>
      )}

      {activeTab === 'points' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FuturisticCard>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Points Balance
                </span>
                <Badge variant="default" className="text-lg px-3 py-1">
                  {nodeStats.points} PTS
                </Badge>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-center p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg">
                <Coins className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
                <p className="text-3xl font-bold text-yellow-400">{nodeStats.points}</p>
                <p className="text-sm text-muted-foreground">Available Points</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded">
                  <p className="text-lg font-bold text-green-400">
                    +{pointsHistory.filter(h => h.type === 'earned').reduce((sum, h) => sum + h.points, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Earned</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded">
                  <p className="text-lg font-bold text-red-400">
                    {pointsHistory.filter(h => h.type === 'spent').reduce((sum, h) => sum + h.points, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Spent</p>
                </div>
              </div>
            </CardContent>
          </FuturisticCard>

          <FuturisticCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Points History
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {pointsHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 bg-muted/20 rounded border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        entry.type === 'earned' ? 'bg-green-400' : 'bg-red-400'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium">{entry.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimeAgo(entry.timestamp)}
                        </p>
                      </div>
                    </div>
                    <span className={`font-medium ${
                      entry.type === 'earned' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {entry.type === 'earned' ? '+' : ''}{entry.points}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </FuturisticCard>
        </div>
      )}

      {activeTab === 'market' && (
        <div className="space-y-6">
          <FuturisticCard>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Points Marketplace
                </span>
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-yellow-400" />
                  <span className="font-medium">{nodeStats.points} PTS</span>
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {marketItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 border border-muted rounded-lg hover:border-cyan-400/50 transition-all duration-200 bg-muted/20"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-muted rounded">
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <Badge variant="outline" className={getRarityColor(item.rarity)}>
                          {item.rarity}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Coins className="h-4 w-4 text-yellow-400" />
                        <span className="font-medium">{item.cost}</span>
                      </div>
                      
                      <GlowButton
                        onClick={() => handlePurchaseItem(item)}
                        disabled={nodeStats.points < item.cost}
                        size="sm"
                      >
                        {nodeStats.points >= item.cost ? 'Purchase' : 'Need More'}
                      </GlowButton>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </FuturisticCard>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FuturisticCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Node Configuration
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="relay" className="flex items-center gap-2">
                  <Radio className="h-4 w-4" />
                  Enable Relay
                </Label>
                <Switch
                  id="relay"
                  checked={nodeSettings.enableRelay}
                  onCheckedChange={(value) => handleSettingChange('enableRelay', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="encryption" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Enable Encryption
                </Label>
                <Switch
                  id="encryption"
                  checked={nodeSettings.enableEncryption}
                  onCheckedChange={(value) => handleSettingChange('enableEncryption', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="p2p" className="flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  Enable P2P
                </Label>
                <Switch
                  id="p2p"
                  checked={nodeSettings.enableP2P}
                  onCheckedChange={(value) => handleSettingChange('enableP2P', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="mining" className="flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  Enable Mining
                </Label>
                <Switch
                  id="mining"
                  checked={nodeSettings.enableMining}
                  onCheckedChange={(value) => handleSettingChange('enableMining', value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bandwidth">Max Bandwidth (%)</Label>
                <Input
                  id="bandwidth"
                  type="number"
                  min="10"
                  max="100"
                  value={nodeSettings.maxBandwidth}
                  onChange={(e) => handleSettingChange('maxBandwidth', parseInt(e.target.value))}
                />
              </div>
            </CardContent>
          </FuturisticCard>

          <FuturisticCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoconnect">Auto-Accept Connections</Label>
                <Switch
                  id="autoconnect"
                  checked={nodeSettings.autoAcceptConnections}
                  onCheckedChange={(value) => handleSettingChange('autoAcceptConnections', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="location">Share Location</Label>
                <Switch
                  id="location"
                  checked={nodeSettings.shareLocation}
                  onCheckedChange={(value) => handleSettingChange('shareLocation', value)}
                />
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Node Statistics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Node ID</span>
                    <span className="font-mono text-xs">{currentUser.id.toString().padStart(6, '0')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Network Age</span>
                    <span>{Math.floor(nodeStats.uptime / 24)} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trust Score</span>
                    <span>{nodeStats.reputation.toFixed(0)}/100</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-1" />
                  Export Data
                </Button>
                <Button variant="outline" className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset Node
                </Button>
              </div>
            </CardContent>
          </FuturisticCard>
        </div>
      )}
    </div>
  );
}