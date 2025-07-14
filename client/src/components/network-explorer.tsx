import { useState, useEffect } from 'react';
import { RadarView } from './radar-view';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { MeshNode } from '@/types/mesh';
import { Bluetooth } from 'lucide-react';

interface NetworkExplorerProps {
  connectedPeers: Set<string>;
}

export function NetworkExplorer({ connectedPeers }: NetworkExplorerProps) {
  const [meshNodes, setMeshNodes] = useState<MeshNode[]>([]);

  // Query mesh nodes from the server
  const { data: serverNodes } = useQuery({
    queryKey: ['/api/mesh-nodes'],
    queryFn: async () => {
      const response = await fetch('/api/mesh-nodes');
      return response.json();
    },
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (serverNodes) {
      const nodes: MeshNode[] = serverNodes.map((node: any) => ({
        id: node.nodeId,
        name: node.nodeId,
        walletAddress: `0x${node.nodeId.slice(-8)}`,
        signalStrength: node.signalStrength,
        distance: node.distance,
        connectionType: node.connectionType,
        isOnline: node.isActive,
        position: {
          x: Math.random() * 200,
          y: Math.random() * 200
        }
      }));
      setMeshNodes(nodes);
    }
  }, [serverNodes]);

  const getStatusColor = (node: MeshNode) => {
    if (node.isOnline) return 'bg-[var(--cyber-green)] shadow-[0_0_10px_var(--cyber-green)]';
    if (connectedPeers.has(node.id)) return 'bg-[var(--cyber-yellow)] animate-pulse';
    return 'bg-[var(--cyber-red)]';
  };

  const getStatusText = (node: MeshNode) => {
    if (node.isOnline) return 'online';
    if (connectedPeers.has(node.id)) return 'connecting';
    return 'offline';
  };

  return (
    <div className="w-80 bg-[var(--cyber-gray)] border-r border-gray-800 flex flex-col">
      {/* Network Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-[var(--cyber-cyan)]">MESH NETWORK</h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-[var(--cyber-green)] rounded-full shadow-[0_0_10px_var(--cyber-green)]"></div>
            <span className="text-xs text-gray-400 font-mono">{meshNodes.length} NODES</span>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <Bluetooth className="w-4 h-4 text-[var(--cyber-cyan)]" />
          <span>Bluetooth Mesh Active</span>
        </div>
      </div>

      {/* Radar View */}
      <div className="p-4 flex-1">
        <RadarView nodes={meshNodes} />
        
        {/* Node List */}
        <div className="mt-4 space-y-2">
          {meshNodes.map((node) => (
            <Card key={node.id} className="p-2 bg-[var(--cyber-dark)]/50 border-gray-800 hover:border-[var(--cyber-cyan)]/50 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(node)}`}></div>
                  <div>
                    <div className="text-sm font-medium">{node.name}</div>
                    <div className="text-xs text-gray-400 font-mono">{node.walletAddress}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[var(--cyber-cyan)]">{node.distance}m</div>
                  <Badge variant="outline" className="text-xs">
                    {node.connectionType}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Connection Stats */}
      <div className="p-4 border-t border-gray-800">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="glass-morphism rounded-lg p-3">
            <div className="text-[var(--cyber-cyan)] font-mono text-lg font-bold">
              {meshNodes.filter(n => n.isOnline).length}
            </div>
            <div className="text-xs text-gray-400">Active Nodes</div>
          </div>
          <div className="glass-morphism rounded-lg p-3">
            <div className="text-[var(--cyber-green)] font-mono text-lg font-bold">99%</div>
            <div className="text-xs text-gray-400">Mesh Integrity</div>
          </div>
        </div>
      </div>
    </div>
  );
}
