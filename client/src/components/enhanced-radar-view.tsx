import { useEffect, useState } from 'react';
import { MeshNode } from '@/types/mesh';

interface RadarViewProps {
  nodes: MeshNode[];
}

export function RadarView({ nodes }: RadarViewProps) {
  const [rotation, setRotation] = useState(0);
  const [pulseNodes, setPulseNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => (prev + 2) % 360);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Simulate node detection pulses
    const interval = setInterval(() => {
      const onlineNodes = nodes.filter(n => n.isOnline);
      if (onlineNodes.length > 0) {
        const randomNode = onlineNodes[Math.floor(Math.random() * onlineNodes.length)];
        setPulseNodes(prev => new Set(prev).add(randomNode.id));
        setTimeout(() => {
          setPulseNodes(prev => {
            const newSet = new Set(prev);
            newSet.delete(randomNode.id);
            return newSet;
          });
        }, 1000);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [nodes]);

  return (
    <div className="relative w-full h-40 bg-[var(--cyber-dark)] rounded-lg border border-gray-800 overflow-hidden">
      {/* Radar Background */}
      <div className="absolute inset-0 rounded-lg">
        {/* Concentric circles */}
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="absolute border border-[var(--cyber-cyan)]/20 rounded-full"
            style={{
              width: `${i * 25}%`,
              height: `${i * 25}%`,
              left: `${50 - (i * 25) / 2}%`,
              top: `${50 - (i * 25) / 2}%`,
            }}
          />
        ))}
        
        {/* Crosshairs */}
        <div className="absolute w-full h-0.5 bg-[var(--cyber-cyan)]/20 top-1/2 transform -translate-y-1/2" />
        <div className="absolute h-full w-0.5 bg-[var(--cyber-cyan)]/20 left-1/2 transform -translate-x-1/2" />
        
        {/* Diagonal lines */}
        <div className="absolute w-full h-0.5 bg-[var(--cyber-cyan)]/10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45" />
        <div className="absolute w-full h-0.5 bg-[var(--cyber-cyan)]/10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-45" />
      </div>

      {/* Rotating Sweep */}
      <div
        className="absolute w-0.5 h-20 bg-gradient-to-t from-[var(--cyber-cyan)] via-[var(--cyber-cyan)]/60 to-transparent top-1/2 left-1/2 transform origin-bottom"
        style={{
          transform: `translate(-50%, -100%) rotate(${rotation}deg)`,
        }}
      />

      {/* Sweep Trail */}
      <div
        className="absolute w-0.5 h-20 bg-gradient-to-t from-[var(--cyber-cyan)]/30 via-[var(--cyber-cyan)]/10 to-transparent top-1/2 left-1/2 transform origin-bottom"
        style={{
          transform: `translate(-50%, -100%) rotate(${rotation - 30}deg)`,
        }}
      />

      {/* Nodes */}
      {nodes.map((node) => {
        const isPulsing = pulseNodes.has(node.id);
        const nodeColor = node.isOnline ? 'var(--cyber-green)' : 'var(--cyber-red)';
        
        return (
          <div
            key={node.id}
            className={`absolute w-2 h-2 rounded-full transition-all duration-300 ${
              node.isOnline ? 'animate-pulse' : ''
            } ${isPulsing ? 'scale-150' : ''}`}
            style={{
              left: `${Math.max(5, Math.min(95, node.position.x / 200 * 100))}%`,
              top: `${Math.max(5, Math.min(95, node.position.y / 200 * 100))}%`,
              transform: 'translate(-50%, -50%)',
              backgroundColor: nodeColor,
              boxShadow: node.isOnline 
                ? `0 0 ${isPulsing ? '16px' : '8px'} ${nodeColor}` 
                : `0 0 6px ${nodeColor}`,
            }}
          >
            {/* Connection type indicator */}
            <div className={`absolute -top-1 -right-1 w-1 h-1 rounded-full ${
              node.connectionType === 'bluetooth' ? 'bg-[var(--cyber-blue)]' :
              node.connectionType === 'webrtc' ? 'bg-[var(--cyber-magenta)]' :
              'bg-[var(--cyber-yellow)]'
            }`} />
          </div>
        );
      })}

      {/* Signal Strength Rings */}
      {nodes.filter(n => n.isOnline).map((node) => (
        <div
          key={`ring-${node.id}`}
          className="absolute rounded-full border border-[var(--cyber-green)]/30 animate-ping"
          style={{
            left: `${Math.max(5, Math.min(95, node.position.x / 200 * 100))}%`,
            top: `${Math.max(5, Math.min(95, node.position.y / 200 * 100))}%`,
            width: `${Math.max(20, node.signalStrength / 10)}px`,
            height: `${Math.max(20, node.signalStrength / 10)}px`,
            transform: 'translate(-50%, -50%)',
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: '3s',
          }}
        />
      ))}

      {/* Distance Labels */}
      <div className="absolute bottom-2 left-2 text-xs text-[var(--cyber-cyan)]/60 font-mono">
        <div>0m</div>
      </div>
      <div className="absolute bottom-2 right-2 text-xs text-[var(--cyber-cyan)]/60 font-mono">
        <div>100m</div>
      </div>
      <div className="absolute top-2 left-2 text-xs text-[var(--cyber-cyan)]/60 font-mono">
        <div>MESH RADAR</div>
      </div>
    </div>
  );
}