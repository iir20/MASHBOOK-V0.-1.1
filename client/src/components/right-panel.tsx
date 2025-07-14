import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Story } from '@/types/mesh';
import { Images, Wallet, TrendingUp, Clock, Signal } from 'lucide-react';

export function RightPanel() {
  const [stories, setStories] = useState<Story[]>([]);
  const [networkStats, setNetworkStats] = useState({
    messagesToday: 147,
    dataRelayed: 2.3,
    meshUptime: 99.7,
  });

  useEffect(() => {
    // Initialize demo stories
    const demoStories: Story[] = [
      {
        id: '1',
        userId: 'user1',
        username: 'CyberNode_A1',
        title: 'Network Status',
        content: 'Mesh network expanding in sector 7',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000),
        isNew: true,
      },
      {
        id: '2',
        userId: 'user2',
        username: 'MeshRelay_B7',
        title: 'Sector Update',
        content: 'New relay nodes deployed successfully',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 20 * 60 * 60 * 1000),
        isNew: false,
      },
    ];
    
    setStories(demoStories);
  }, []);

  const getStoryTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours === 0) return 'now';
    if (hours === 1) return '1h ago';
    return `${hours}h ago`;
  };

  const getWalletAddress = () => {
    return '0x1a2b...c3d4';
  };

  const getBalance = () => {
    return '0.245 ETH';
  };

  return (
    <div className="w-80 bg-[var(--cyber-gray)] border-l border-gray-800 flex flex-col">
      {/* Stories Section */}
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-lg font-semibold text-[var(--cyber-magenta)] mb-3 flex items-center">
          <Images className="w-5 h-5 mr-2" />
          MESH STORIES
        </h3>
        <div className="space-y-3">
          {stories.map((story) => (
            <Card
              key={story.id}
              className="p-2 bg-[var(--cyber-dark)]/50 border-gray-800 hover:border-[var(--cyber-magenta)]/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[var(--cyber-magenta)] to-[var(--cyber-cyan)] rounded-full flex items-center justify-center text-[var(--cyber-dark)] font-bold">
                  {story.username.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{story.username}</div>
                  <div className="text-xs text-gray-400">{story.title} • {getStoryTimeAgo(story.timestamp)}</div>
                </div>
                {story.isNew && (
                  <div className="w-3 h-3 bg-[var(--cyber-magenta)] rounded-full animate-pulse"></div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Wallet Section */}
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-lg font-semibold text-[var(--cyber-green)] mb-3 flex items-center">
          <Wallet className="w-5 h-5 mr-2" />
          WALLET ID
        </h3>
        <Card className="glass-morphism p-4 border-gray-800">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--cyber-green)] to-[var(--cyber-cyan)] rounded-full flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[var(--cyber-dark)]" />
            </div>
            <div>
              <div className="text-sm font-medium">MeshWallet</div>
              <div className="text-xs text-gray-400">Ethereum Compatible</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Address:</span>
              <span className="font-mono text-[var(--cyber-green)]">{getWalletAddress()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Balance:</span>
              <span className="font-mono text-[var(--cyber-cyan)]">{getBalance()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Network:</span>
              <span className="font-mono text-[var(--cyber-magenta)]">MASH Chain</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Network Analytics */}
      <div className="flex-1 p-4">
        <h3 className="text-lg font-semibold text-[var(--cyber-cyan)] mb-3 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          NETWORK STATS
        </h3>
        <div className="space-y-4">
          <Card className="glass-morphism p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Messages Today</span>
              <span className="text-[var(--cyber-cyan)] font-mono">{networkStats.messagesToday}</span>
            </div>
            <Progress value={65} className="h-2" />
          </Card>

          <Card className="glass-morphism p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Data Relayed</span>
              <span className="text-[var(--cyber-green)] font-mono">{networkStats.dataRelayed} MB</span>
            </div>
            <Progress value={80} className="h-2" />
          </Card>

          <Card className="glass-morphism p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Mesh Uptime</span>
              <span className="text-[var(--cyber-magenta)] font-mono">{networkStats.meshUptime}%</span>
            </div>
            <Progress value={97} className="h-2" />
          </Card>

          {/* Connection Quality */}
          <Card className="glass-morphism p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Signal className="w-4 h-4 text-[var(--cyber-cyan)]" />
              <span className="text-sm text-gray-400">Signal Quality</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 flex space-x-1">
                <div className="w-2 h-4 bg-[var(--cyber-green)] rounded-sm"></div>
                <div className="w-2 h-4 bg-[var(--cyber-green)] rounded-sm"></div>
                <div className="w-2 h-4 bg-[var(--cyber-green)] rounded-sm"></div>
                <div className="w-2 h-4 bg-[var(--cyber-yellow)] rounded-sm"></div>
                <div className="w-2 h-4 bg-gray-600 rounded-sm"></div>
              </div>
              <span className="text-xs text-[var(--cyber-cyan)] font-mono">4/5</span>
            </div>
          </Card>

          {/* Active Connections */}
          <Card className="glass-morphism p-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-[var(--cyber-green)] rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">Active Connections</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">WebRTC:</span>
                <span className="text-[var(--cyber-cyan)] font-mono">2</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Bluetooth:</span>
                <span className="text-[var(--cyber-magenta)] font-mono">3</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Mesh Relays:</span>
                <span className="text-[var(--cyber-green)] font-mono">1</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
