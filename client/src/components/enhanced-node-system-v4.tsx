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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@shared/schema';
import { FuturisticCard, GlowButton, NeonText, AnimatedBackground } from './modern-futuristic-theme';

import {
  Cpu, Zap, Network, Shield, TrendingUp, Coins, Award, Activity, Signal, Radio,
  Server, Gauge, Star, Trophy, Gift, ShoppingCart, Download, Upload, Wifi,
  Settings, Play, Pause, RotateCcw, Bluetooth, Users, Eye, Lock, Globe,
  Bitcoin, DollarSign, CreditCard, Wallet, Sparkles, Crown, Medal, CheckCircle,
  Package, Gamepad2, Headphones, Palette, FileImage, MessageSquare, Heart
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
  benefits?: string[];
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

interface EnhancedNodeSystemV4Props {
  currentUser: User;
  isOffline: boolean;
  wsState: {
    isConnected: boolean;
    sendMessage: (message: any) => void;
  };
}

export function EnhancedNodeSystemV4({ currentUser, isOffline, wsState }: EnhancedNodeSystemV4Props) {
  const [nodeStats, setNodeStats] = useState<NodeStats>({
    uptime: 24.5,
    packetsRouted: 1247,
    bandwidth: 45.2,
    points: 2847,
    reputation: 94,
    isRunning: true,
    earnings: 456,
    level: 15,
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
    nextMilestone: 3000,
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
        name: 'Network Builder',
        description: 'Route 1000 packets',
        progress: 847,
        target: 1000,
        reward: 500,
        unlocked: false
      },
      {
        id: '3',
        name: 'Story Teller',
        description: 'Share 50 stories',
        progress: 23,
        target: 50,
        reward: 300,
        unlocked: false
      }
    ]
  });

  const [pointsHistory, setPointsHistory] = useState<PointsHistory[]>([
    {
      id: '1',
      action: 'Packet Relay',
      points: 15,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      type: 'earned',
      category: 'relay'
    },
    {
      id: '2',
      action: 'Story Share',
      points: 25,
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      type: 'earned',
      category: 'story'
    },
    {
      id: '3',
      action: 'Premium Theme',
      points: -500,
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      type: 'spent',
      category: 'purchase'
    }
  ]);

  const [marketItems] = useState<MarketItem[]>([
    {
      id: '1',
      name: 'Cyberpunk Avatar',
      description: 'Exclusive neon-themed avatar with animated effects',
      cost: 500,
      type: 'avatar',
      icon: <Sparkles className="w-6 h-6" />,
      rarity: 'epic',
      benefits: ['Animated effects', 'Exclusive design', 'Status boost'],
      owned: false
    },
    {
      id: '2',
      name: 'Mesh Pioneer Badge',
      description: 'Show your status as an early mesh network adopter',
      cost: 200,
      type: 'badge',
      icon: <Medal className="w-6 h-6" />,
      rarity: 'rare',
      benefits: ['Profile badge', 'Recognition boost'],
      owned: false
    },
    {
      id: '3',
      name: 'Dark Neon Theme',
      description: 'Premium dark theme with neon accents',
      cost: 300,
      type: 'theme',
      icon: <Palette className="w-6 h-6" />,
      rarity: 'rare',
      benefits: ['Custom colors', 'Enhanced visuals'],
      owned: false
    },
    {
      id: '4',
      name: 'Custom Emoji Pack',
      description: 'Exclusive cyberpunk emoji collection',
      cost: 150,
      type: 'emoji',
      icon: <Heart className="w-6 h-6" />,
      rarity: 'common',
      benefits: ['20+ unique emojis', 'Express yourself'],
      owned: false
    },
    {
      id: '5',
      name: 'Mesh Premium',
      description: 'Unlock premium features and priority routing',
      cost: 1000,
      type: 'premium',
      icon: <Crown className="w-6 h-6" />,
      rarity: 'legendary',
      benefits: ['Priority routing', 'Advanced features', 'Premium support'],
      owned: false
    }
  ]);

  const [purchaseHistory, setPurchaseHistory] = useState<string[]>([]);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState<MarketItem | null>(null);
  
  const { toast } = useToast();

  // Enhanced purchase system with real functionality
  const handlePurchase = (item: MarketItem) => {
    if (nodeStats.points < item.cost) {
      toast({
        title: "Insufficient Points",
        description: `You need ${item.cost - nodeStats.points} more points to purchase this item.`,
        variant: "destructive"
      });
      return;
    }

    // Deduct points and mark as purchased
    setNodeStats(prev => ({
      ...prev,
      points: prev.points - item.cost
    }));

    // Add to purchase history
    setPurchaseHistory(prev => [...prev, item.id]);
    
    // Add transaction to points history
    const newTransaction: PointsHistory = {
      id: Date.now().toString(),
      action: `Purchased ${item.name}`,
      points: -item.cost,
      timestamp: new Date(),
      type: 'spent',
      category: 'purchase'
    };
    
    setPointsHistory(prev => [newTransaction, ...prev]);

    // Apply item effects based on type
    switch (item.type) {
      case 'premium':
        // Unlock premium features
        setNodeSettings(prev => ({ ...prev, enableMining: true }));
        break;
      case 'theme':
        // Apply theme (would integrate with theme system)
        break;
      case 'avatar':
        // Update user avatar (would update user profile)
        break;
    }

    setShowPurchaseDialog(null);
    
    toast({
      title: "Purchase Successful! 🎉",
      description: `You've purchased ${item.name}. ${item.benefits?.join(', ')}`,
    });
  };

  // Enhanced points earning system
  const earnPoints = (action: string, amount: number, category: PointsHistory['category']) => {
    setNodeStats(prev => ({
      ...prev,
      points: prev.points + amount
    }));

    const newTransaction: PointsHistory = {
      id: Date.now().toString(),
      action,
      points: amount,
      timestamp: new Date(),
      type: 'earned',
      category
    };
    
    setPointsHistory(prev => [newTransaction, ...prev.slice(0, 49)]); // Keep last 50 transactions
  };

  // Simulate earning points from various activities
  useEffect(() => {
    if (nodeStats.isRunning && !isOffline) {
      const interval = setInterval(() => {
        // Random point earning simulation
        const actions = [
          { action: 'Packet Relay', points: Math.floor(Math.random() * 20) + 5, category: 'relay' as const },
          { action: 'Network Discovery', points: Math.floor(Math.random() * 15) + 10, category: 'discovery' as const },
          { action: 'Message Routing', points: Math.floor(Math.random() * 10) + 5, category: 'message' as const },
          { action: 'Uptime Bonus', points: Math.floor(Math.random() * 25) + 15, category: 'uptime' as const }
        ];
        
        if (Math.random() > 0.7) { // 30% chance to earn points
          const randomAction = actions[Math.floor(Math.random() * actions.length)];
          earnPoints(randomAction.action, randomAction.points, randomAction.category);
        }
      }, 10000); // Every 10 seconds

      return () => clearInterval(interval);
    }
  }, [nodeStats.isRunning, isOffline]);

  // Toggle node running state
  const toggleNode = () => {
    setNodeStats(prev => ({ ...prev, isRunning: !prev.isRunning }));
    
    if (!nodeStats.isRunning) {
      toast({
        title: "🚀 Node Started",
        description: "Your mesh node is now active and earning points!",
      });
    } else {
      toast({
        title: "⏸️ Node Stopped",
        description: "Your mesh node has been paused.",
      });
    }
  };

  // Claim daily bonus
  const claimDailyBonus = () => {
    earnPoints('Daily Bonus', rewardSystem.dailyBonus, 'uptime');
    toast({
      title: "🎁 Daily Bonus Claimed!",
      description: `You earned ${rewardSystem.dailyBonus} points!`,
    });
  };

  // Get rarity color
  const getRarityColor = (rarity: MarketItem['rarity']) => {
    switch (rarity) {
      case 'common': return 'text-gray-400 border-gray-400/30';
      case 'rare': return 'text-blue-400 border-blue-400/30';
      case 'epic': return 'text-purple-400 border-purple-400/30';
      case 'legendary': return 'text-yellow-400 border-yellow-400/30';
      default: return 'text-gray-400 border-gray-400/30';
    }
  };

  return (
    <div className="space-y-6">
      <AnimatedBackground>
        <div className="flex items-center justify-between">
          <div>
            <NeonText className="text-2xl font-bold">⚡ Mesh Node Control</NeonText>
            <p className="text-sm text-muted-foreground mt-1">
              Earn points by contributing to the mesh network
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`${nodeStats.isRunning ? 'border-green-400/50 text-green-400' : 'border-red-400/50 text-red-400'}`}>
              {nodeStats.isRunning ? '🟢 Active' : '🔴 Stopped'}
            </Badge>
            <Badge variant="outline" className="border-yellow-400/50 text-yellow-400">
              💰 {nodeStats.points} Points
            </Badge>
            <GlowButton
              onClick={toggleNode}
              variant={nodeStats.isRunning ? "destructive" : "secondary"}
              className="gap-2"
            >
              {nodeStats.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {nodeStats.isRunning ? 'Stop Node' : 'Start Node'}
            </GlowButton>
          </div>
        </div>
      </AnimatedBackground>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-black/40 border border-cyan-400/20">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Node Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FuturisticCard>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  Points Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-400">{nodeStats.points.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+{Math.floor(Math.random() * 50) + 10} today</p>
              </CardContent>
            </FuturisticCard>

            <FuturisticCard>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-400" />
                  Network Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">Level {nodeStats.level}</div>
                <p className="text-xs text-muted-foreground">{nodeStats.rank}</p>
              </CardContent>
            </FuturisticCard>

            <FuturisticCard>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Network className="w-4 h-4 text-cyan-400" />
                  Connections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-400">{nodeStats.meshConnections}</div>
                <p className="text-xs text-muted-foreground">Active peers</p>
              </CardContent>
            </FuturisticCard>

            <FuturisticCard>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-purple-400" />
                  Reputation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-400">{nodeStats.reputation}%</div>
                <p className="text-xs text-muted-foreground">Trust score</p>
              </CardContent>
            </FuturisticCard>
          </div>

          {/* Achievements and Rewards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FuturisticCard>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {rewardSystem.achievements.map((achievement) => (
                  <div key={achievement.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{achievement.name}</p>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      </div>
                      {achievement.unlocked && (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{achievement.progress}/{achievement.target}</span>
                        <span>{achievement.reward} points</span>
                      </div>
                      <Progress 
                        value={(achievement.progress / achievement.target) * 100} 
                        className="h-2" 
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </FuturisticCard>

            <FuturisticCard>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-pink-400" />
                  Daily Rewards
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-gradient-to-r from-cyan-400/10 to-purple-400/10 rounded-lg">
                  <div className="text-2xl font-bold text-cyan-400 mb-2">
                    {rewardSystem.dailyBonus} Points
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Day {rewardSystem.streakDays} Streak Bonus
                  </p>
                  <GlowButton onClick={claimDailyBonus} className="w-full">
                    <Gift className="w-4 h-4 mr-2" />
                    Claim Daily Bonus
                  </GlowButton>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Next Milestone</span>
                    <span>{rewardSystem.nextMilestone} points</span>
                  </div>
                  <Progress 
                    value={(nodeStats.points / rewardSystem.nextMilestone) * 100} 
                    className="h-2" 
                  />
                  <p className="text-xs text-muted-foreground">
                    {rewardSystem.nextMilestone - nodeStats.points} points to go
                  </p>
                </div>
              </CardContent>
            </FuturisticCard>
          </div>
        </TabsContent>

        <TabsContent value="marketplace" className="space-y-6">
          <FuturisticCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-cyan-400" />
                Mesh Marketplace
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Spend your earned points on exclusive items and upgrades
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {marketItems.map((item) => (
                  <Card 
                    key={item.id} 
                    className={`border-2 transition-all duration-300 hover:scale-105 ${getRarityColor(item.rarity)} ${
                      purchaseHistory.includes(item.id) ? 'opacity-50' : 'cursor-pointer hover:shadow-lg'
                    }`}
                    onClick={() => !purchaseHistory.includes(item.id) && setShowPurchaseDialog(item)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {item.icon}
                          <Badge variant="outline" className={getRarityColor(item.rarity)}>
                            {item.rarity}
                          </Badge>
                        </div>
                        {purchaseHistory.includes(item.id) && (
                          <Badge variant="default" className="bg-green-600">
                            Owned
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-sm">{item.name}</h3>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      
                      {item.benefits && (
                        <div className="space-y-1">
                          {item.benefits.map((benefit, index) => (
                            <div key={index} className="flex items-center gap-1 text-xs">
                              <CheckCircle className="w-3 h-3 text-green-400" />
                              <span>{benefit}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-2 border-t border-gray-600">
                        <span className="text-lg font-bold text-yellow-400">
                          {item.cost} <Coins className="w-4 h-4 inline" />
                        </span>
                        {!purchaseHistory.includes(item.id) && (
                          <Button 
                            size="sm" 
                            disabled={nodeStats.points < item.cost}
                            className="bg-cyan-600 hover:bg-cyan-700"
                          >
                            Buy Now
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </FuturisticCard>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <FuturisticCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Points History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {pointsHistory.map((transaction) => (
                    <div 
                      key={transaction.id} 
                      className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-cyan-400/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          transaction.type === 'earned' ? 'bg-green-400' : 'bg-red-400'
                        }`} />
                        <div>
                          <p className="font-medium text-sm">{transaction.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {transaction.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className={`font-bold ${
                        transaction.type === 'earned' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {transaction.type === 'earned' ? '+' : ''}{transaction.points}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </FuturisticCard>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <FuturisticCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-400" />
                Node Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(nodeSettings).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <Label htmlFor={key} className="font-medium">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Configure {key.toLowerCase()} functionality
                    </p>
                  </div>
                  <Switch
                    id={key}
                    checked={typeof value === 'boolean' ? value : false}
                    onCheckedChange={(checked) => 
                      setNodeSettings(prev => ({ ...prev, [key]: checked }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </FuturisticCard>
        </TabsContent>
      </Tabs>

      {/* Purchase Dialog */}
      {showPurchaseDialog && (
        <Dialog open={!!showPurchaseDialog} onOpenChange={() => setShowPurchaseDialog(null)}>
          <DialogContent className="max-w-md bg-black/95 border-cyan-400/30">
            <DialogHeader>
              <DialogTitle className="text-cyan-100 flex items-center gap-2">
                {showPurchaseDialog.icon}
                Purchase {showPurchaseDialog.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-cyan-400/10 to-purple-400/10 rounded-lg">
                <p className="text-sm">{showPurchaseDialog.description}</p>
                
                {showPurchaseDialog.benefits && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium">Benefits:</p>
                    {showPurchaseDialog.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between p-3 bg-black/50 rounded-lg">
                <span className="font-medium">Cost:</span>
                <span className="text-lg font-bold text-yellow-400">
                  {showPurchaseDialog.cost} <Coins className="w-4 h-4 inline" />
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-black/50 rounded-lg">
                <span className="font-medium">Your Balance:</span>
                <span className={`text-lg font-bold ${
                  nodeStats.points >= showPurchaseDialog.cost ? 'text-green-400' : 'text-red-400'
                }`}>
                  {nodeStats.points} <Coins className="w-4 h-4 inline" />
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPurchaseDialog(null)}
                  className="flex-1 border-cyan-400/30"
                >
                  Cancel
                </Button>
                <GlowButton
                  onClick={() => handlePurchase(showPurchaseDialog)}
                  disabled={nodeStats.points < showPurchaseDialog.cost}
                  className="flex-1"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Purchase
                </GlowButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}