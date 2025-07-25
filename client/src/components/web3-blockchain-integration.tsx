import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { User } from '@shared/schema';

import {
  Wallet, Coins, Shield, Award, TrendingUp, ExternalLink,
  Zap, Star, Gift, Users, Lock, Unlock, CheckCircle,
  AlertTriangle, RefreshCw, Copy, QrCode, Send
} from 'lucide-react';

interface Web3BlockchainIntegrationProps {
  currentUser: User | null;
  onUserUpdate: (updatedUser: User) => void;
  isOffline: boolean;
}

interface WalletConnection {
  address: string;
  balance: string;
  network: 'ethereum' | 'polygon' | 'arbitrum' | 'optimism';
  isConnected: boolean;
  provider: 'metamask' | 'walletconnect' | 'coinbase';
}

interface TokenReward {
  id: string;
  name: string;
  symbol: string;
  amount: number;
  action: string;
  timestamp: Date;
  txHash?: string;
}

interface NFTBadge {
  id: string;
  name: string;
  description: string;
  image: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earned: boolean;
  requirement: string;
}

export function Web3BlockchainIntegration({ 
  currentUser, 
  onUserUpdate, 
  isOffline 
}: Web3BlockchainIntegrationProps) {
  const [walletConnection, setWalletConnection] = useState<WalletConnection | null>(null);
  const [showConnectWallet, setShowConnectWallet] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [tokenRewards, setTokenRewards] = useState<TokenReward[]>([]);
  const [nftBadges, setNftBadges] = useState<NFTBadge[]>([]);
  const [meshTokenBalance, setMeshTokenBalance] = useState(0);
  const [stakingAmount, setStakingAmount] = useState('');
  const [showStaking, setShowStaking] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize with mock Web3 data (in production, connect to real blockchain)
  useEffect(() => {
    // Mock token rewards
    setTokenRewards([
      {
        id: '1',
        name: 'MESH Token',
        symbol: 'MESH',
        amount: 50,
        action: 'Story Creation',
        timestamp: new Date(Date.now() - 86400000),
        txHash: '0x1234...5678'
      },
      {
        id: '2',
        name: 'MESH Token',
        symbol: 'MESH',
        amount: 25,
        action: 'Message Sent',
        timestamp: new Date(Date.now() - 172800000),
        txHash: '0x2345...6789'
      },
      {
        id: '3',
        name: 'MESH Token',
        symbol: 'MESH',
        amount: 100,
        action: 'Node Discovery',
        timestamp: new Date(Date.now() - 259200000),
        txHash: '0x3456...7890'
      }
    ]);

    // Mock NFT badges
    setNftBadges([
      {
        id: '1',
        name: 'Pioneer Badge',
        description: 'Early adopter of the mesh network',
        image: '🚀',
        rarity: 'legendary',
        earned: true,
        requirement: 'Join in first 1000 users'
      },
      {
        id: '2',
        name: 'Storyteller Badge',
        description: 'Created 10 stories',
        image: '📖',
        rarity: 'rare',
        earned: true,
        requirement: 'Create 10 stories'
      },
      {
        id: '3',
        name: 'Network Builder',
        description: 'Connected 50 nodes',
        image: '🔗',
        rarity: 'epic',
        earned: false,
        requirement: 'Connect 50 mesh nodes'
      },
      {
        id: '4',
        name: 'Crypto Whale',
        description: 'Hold 10,000+ MESH tokens',
        image: '🐋',
        rarity: 'legendary',
        earned: false,
        requirement: 'Hold 10,000 MESH tokens'
      }
    ]);

    setMeshTokenBalance(175);
  }, []);

  // Connect wallet simulation
  const connectWallet = async (provider: 'metamask' | 'walletconnect' | 'coinbase') => {
    setIsConnecting(true);
    
    try {
      // Simulate wallet connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockWallet: WalletConnection = {
        address: '0x742d35Cc6634C0532925a3b8D46323dF45f789F3',
        balance: '2.45',
        network: 'ethereum',
        isConnected: true,
        provider
      };
      
      setWalletConnection(mockWallet);
      setShowConnectWallet(false);
      
      toast({
        title: "Wallet Connected!",
        description: `Connected to ${provider} wallet successfully`,
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Stake tokens
  const stakeTokens = async () => {
    if (!stakingAmount || parseFloat(stakingAmount) <= 0) return;
    
    const amount = parseFloat(stakingAmount);
    if (amount > meshTokenBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough MESH tokens to stake.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Staking Transaction",
      description: `Staking ${amount} MESH tokens...`,
    });

    // Simulate staking
    setTimeout(() => {
      setMeshTokenBalance(prev => prev - amount);
      setStakingAmount('');
      setShowStaking(false);
      
      toast({
        title: "Tokens Staked!",
        description: `Successfully staked ${amount} MESH tokens. Earning 12% APY.`,
      });
    }, 3000);
  };

  // Claim rewards
  const claimRewards = async () => {
    const pendingRewards = 42; // Mock pending rewards
    
    toast({
      title: "Claiming Rewards",
      description: `Claiming ${pendingRewards} MESH tokens...`,
    });

    setTimeout(() => {
      setMeshTokenBalance(prev => prev + pendingRewards);
      
      toast({
        title: "Rewards Claimed!",
        description: `Successfully claimed ${pendingRewards} MESH tokens.`,
      });
    }, 2000);
  };

  // Copy wallet address
  const copyAddress = () => {
    if (walletConnection?.address) {
      navigator.clipboard.writeText(walletConnection.address);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Wallet className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">Web3 Integration</h1>
              <p className="text-blue-300 text-sm">Blockchain-powered rewards & verification</p>
            </div>
          </div>
          
          {!walletConnection?.isConnected ? (
            <Button
              onClick={() => setShowConnectWallet(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          ) : (
            <div className="flex items-center space-x-2">
              <Badge className="bg-green-600">Connected</Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={copyAddress}
                className="border-blue-500/50"
              >
                <Copy className="w-4 h-4 mr-1" />
                {walletConnection.address.slice(0, 6)}...{walletConnection.address.slice(-4)}
              </Button>
            </div>
          )}
        </div>

        {/* Wallet Connection Modal */}
        {showConnectWallet && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="bg-gradient-to-br from-blue-900 to-purple-900 border-blue-500 max-w-md w-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  <span>Connect Wallet</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConnectWallet(false)}
                  >
                    ✕
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-blue-300 text-sm">
                  Connect your wallet to access Web3 features, earn MESH tokens, and unlock exclusive NFT badges.
                </p>
                
                <div className="space-y-2">
                  <Button
                    className="w-full justify-start bg-orange-600 hover:bg-orange-700"
                    onClick={() => connectWallet('metamask')}
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Wallet className="w-4 h-4 mr-2" />
                    )}
                    MetaMask
                  </Button>
                  
                  <Button
                    className="w-full justify-start bg-blue-600 hover:bg-blue-700"
                    onClick={() => connectWallet('walletconnect')}
                    disabled={isConnecting}
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    WalletConnect
                  </Button>
                  
                  <Button
                    className="w-full justify-start bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => connectWallet('coinbase')}
                    disabled={isConnecting}
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Coinbase Wallet
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {walletConnection?.isConnected && (
          <>
            {/* Wallet Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-black/40 border-blue-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <Coins className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-300">MESH Balance</p>
                      <p className="text-2xl font-bold text-white">{meshTokenBalance.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-green-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-600 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-green-300">Staked Rewards</p>
                      <p className="text-2xl font-bold text-white">42 MESH</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-purple-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-600 rounded-lg">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-purple-300">NFT Badges</p>
                      <p className="text-2xl font-bold text-white">{nftBadges.filter(b => b.earned).length}/4</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={claimRewards}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Gift className="w-4 h-4 mr-2" />
                Claim Rewards (42 MESH)
              </Button>
              
              <Button
                onClick={() => setShowStaking(true)}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                <Zap className="w-4 h-4 mr-2" />
                Stake Tokens (12% APY)
              </Button>
              
              <Button
                variant="outline"
                className="border-purple-500/50"
              >
                <Send className="w-4 h-4 mr-2" />
                Send MESH
              </Button>
              
              <Button
                variant="outline"
                className="border-blue-500/50"
              >
                <QrCode className="w-4 h-4 mr-2" />
                Receive
              </Button>
            </div>

            {/* Staking Modal */}
            {showStaking && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <Card className="bg-gradient-to-br from-blue-900 to-cyan-900 border-blue-500 max-w-md w-full">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-white">
                      <span>Stake MESH Tokens</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowStaking(false)}
                      >
                        ✕
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-blue-300 text-sm mb-2">
                        Stake your MESH tokens to earn 12% APY and boost your network reputation.
                      </p>
                      <p className="text-sm text-gray-400">
                        Available: {meshTokenBalance} MESH
                      </p>
                    </div>
                    
                    <Input
                      type="number"
                      placeholder="Amount to stake"
                      value={stakingAmount}
                      onChange={(e) => setStakingAmount(e.target.value)}
                      className="bg-black/30 border-blue-500/50 text-white"
                    />
                    
                    <div className="flex space-x-2">
                      <Button
                        onClick={stakeTokens}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                      >
                        Stake Tokens
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setStakingAmount(meshTokenBalance.toString())}
                        className="border-blue-500/50"
                      >
                        Max
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Recent Rewards */}
            <Card className="bg-black/40 border-blue-500/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Coins className="w-5 h-5" />
                  <span>Recent Token Rewards</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tokenRewards.map((reward) => (
                    <div key={reward.id} className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-600 rounded-lg">
                          <Coins className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">+{reward.amount} {reward.symbol}</p>
                          <p className="text-sm text-blue-300">{reward.action}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">
                          {reward.timestamp.toLocaleDateString()}
                        </p>
                        {reward.txHash && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-blue-400 hover:text-blue-300 h-auto p-0"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View Tx
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* NFT Badge Collection */}
            <Card className="bg-black/40 border-purple-500/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Award className="w-5 h-5" />
                  <span>NFT Badge Collection</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {nftBadges.map((badge) => (
                    <div 
                      key={badge.id} 
                      className={`p-4 rounded-lg border-2 ${
                        badge.earned 
                          ? 'bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-purple-500/50' 
                          : 'bg-gray-900/50 border-gray-600/50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="text-3xl">{badge.image}</div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className={`font-semibold ${badge.earned ? 'text-white' : 'text-gray-400'}`}>
                              {badge.name}
                            </h4>
                            {badge.earned && <CheckCircle className="w-4 h-4 text-green-400" />}
                          </div>
                          <p className={`text-sm ${badge.earned ? 'text-purple-300' : 'text-gray-500'}`}>
                            {badge.description}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                badge.rarity === 'legendary' 
                                  ? 'border-yellow-500/50 text-yellow-400' 
                                  : badge.rarity === 'epic'
                                  ? 'border-purple-500/50 text-purple-400'
                                  : badge.rarity === 'rare'
                                  ? 'border-blue-500/50 text-blue-400'
                                  : 'border-gray-500/50 text-gray-400'
                              }`}
                            >
                              {badge.rarity}
                            </Badge>
                            {!badge.earned && (
                              <AlertTriangle className="w-4 h-4 text-yellow-400" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {badge.requirement}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Blockchain Stats */}
            <Card className="bg-black/40 border-green-500/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Shield className="w-5 h-5" />
                  <span>Blockchain Verification</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">100%</div>
                    <div className="text-xs text-gray-400">Messages Verified</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">847</div>
                    <div className="text-xs text-gray-400">Transactions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">15.2k</div>
                    <div className="text-xs text-gray-400">Gas Saved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">A+</div>
                    <div className="text-xs text-gray-400">Trust Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}