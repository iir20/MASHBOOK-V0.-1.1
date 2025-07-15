import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useOfflineStorage } from '@/hooks/use-offline-storage';
import { 
  Radar, 
  Users, 
  Wifi, 
  WifiOff, 
  Signal, 
  Activity,
  Bluetooth,
  Zap,
  Shield,
  RefreshCw
} from 'lucide-react';

interface RadarUser {
  id: string;
  username: string;
  angle: number;
  distance: number;
  signalStrength: number;
  isOnline: boolean;
  connectionType: 'wifi' | 'bluetooth' | 'webrtc' | 'mesh';
  lastSeen: number;
  publicKey?: string;
}

interface EnhancedRadarViewProps {
  currentUserId: string;
  connectedPeers: string[];
  isScanning: boolean;
  onStartScan: () => void;
  onStopScan: () => void;
  onUserSelect: (userId: string) => void;
}

export function EnhancedRadarView({ 
  currentUserId, 
  connectedPeers, 
  isScanning, 
  onStartScan, 
  onStopScan,
  onUserSelect 
}: EnhancedRadarViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [sweepAngle, setSweepAngle] = useState(0);
  const [detectedUsers, setDetectedUsers] = useState<RadarUser[]>([]);
  const [scanRange, setScanRange] = useState(100);
  const { users, addOrUpdateUser, isOfflineMode } = useOfflineStorage();
  
  // Simulate user detection with realistic data
  const simulateUserDetection = useCallback(() => {
    const userTypes = [
      { name: 'CyberNode_A1', type: 'mesh' as const },
      { name: 'NetRunner_X9', type: 'webrtc' as const },
      { name: 'MeshRelay_7', type: 'wifi' as const },
      { name: 'BlueLink_M3', type: 'bluetooth' as const },
      { name: 'DataStream_5', type: 'mesh' as const },
      { name: 'SyncNode_K2', type: 'wifi' as const }
    ];
    
    return userTypes.map((user, index) => {
      const angle = (index * 60 + Math.random() * 30) % 360;
      const distance = 30 + Math.random() * 60;
      const signalStrength = Math.max(0.2, 1 - (distance / 100));
      
      const detectedUser: RadarUser = {
        id: `user_${index + 1}`,
        username: user.name,
        angle,
        distance,
        signalStrength,
        isOnline: Math.random() > 0.3,
        connectionType: user.type,
        lastSeen: Date.now() - Math.random() * 3600000, // Random time within last hour
        publicKey: `pk_${Math.random().toString(36).substr(2, 9)}`
      };
      
      // Add to offline storage
      addOrUpdateUser({
        id: detectedUser.id,
        username: detectedUser.username,
        isOnline: detectedUser.isOnline,
        publicKey: detectedUser.publicKey,
        walletAddress: `0x${Math.random().toString(16).substr(2, 8)}`
      });
      
      return detectedUser;
    });
  }, [addOrUpdateUser]);
  
  // Start scanning animation
  useEffect(() => {
    if (isScanning && canvasRef.current) {
      const animate = () => {
        setSweepAngle(prev => (prev + 2) % 360);
        
        // Simulate new user detection occasionally
        if (Math.random() < 0.05) {
          const newUsers = simulateUserDetection();
          setDetectedUsers(prev => {
            const updatedUsers = [...prev];
            newUsers.forEach(newUser => {
              const existingIndex = updatedUsers.findIndex(u => u.id === newUser.id);
              if (existingIndex >= 0) {
                updatedUsers[existingIndex] = newUser;
              } else {
                updatedUsers.push(newUser);
              }
            });
            return updatedUsers;
          });
        }
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isScanning, simulateUserDetection]);
  
  // Draw radar on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 20;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw radar circles
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (maxRadius / 4) * i, 0, 2 * Math.PI);
      ctx.stroke();
    }
    
    // Draw radar lines
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
    for (let i = 0; i < 8; i++) {
      const angle = (i * 45) * Math.PI / 180;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * maxRadius,
        centerY + Math.sin(angle) * maxRadius
      );
      ctx.stroke();
    }
    
    // Draw sweep
    if (isScanning) {
      const sweepRad = sweepAngle * Math.PI / 180;
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
      gradient.addColorStop(0, 'rgba(0, 255, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, maxRadius, sweepRad - 0.3, sweepRad + 0.3);
      ctx.closePath();
      ctx.fill();
    }
    
    // Draw detected users
    detectedUsers.forEach(user => {
      const userAngle = user.angle * Math.PI / 180;
      const userRadius = (user.distance / 100) * maxRadius;
      const userX = centerX + Math.cos(userAngle) * userRadius;
      const userY = centerY + Math.sin(userAngle) * userRadius;
      
      // User dot
      ctx.fillStyle = user.isOnline ? 
        `rgba(0, 255, ${255 * user.signalStrength}, 0.8)` : 
        'rgba(255, 255, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(userX, userY, 4, 0, 2 * Math.PI);
      ctx.fill();
      
      // Connection type indicator
      const typeColors = {
        wifi: 'rgba(0, 255, 0, 0.8)',
        bluetooth: 'rgba(0, 100, 255, 0.8)',
        webrtc: 'rgba(255, 0, 255, 0.8)',
        mesh: 'rgba(255, 255, 0, 0.8)'
      };
      
      ctx.strokeStyle = typeColors[user.connectionType];
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(userX, userY, 8, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Signal strength rings
      if (user.isOnline) {
        for (let i = 1; i <= 3; i++) {
          const alpha = user.signalStrength * (0.3 - i * 0.1);
          ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(userX, userY, 8 + i * 4, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
    });
    
    // Draw center (current user)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, 2 * Math.PI);
    ctx.fill();
    
    // Center pulse effect
    if (isScanning) {
      const pulseRadius = 6 + Math.sin(sweepAngle * Math.PI / 180) * 4;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  }, [sweepAngle, detectedUsers, isScanning]);
  
  const getConnectionTypeIcon = (type: string) => {
    switch (type) {
      case 'wifi': return <Wifi className="w-4 h-4" />;
      case 'bluetooth': return <Bluetooth className="w-4 h-4" />;
      case 'webrtc': return <Zap className="w-4 h-4" />;
      case 'mesh': return <Activity className="w-4 h-4" />;
      default: return <Signal className="w-4 h-4" />;
    }
  };
  
  const getSignalColor = (strength: number) => {
    if (strength > 0.7) return 'text-green-500';
    if (strength > 0.4) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  const formatLastSeen = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };
  
  return (
    <div className="space-y-4">
      {/* Radar Canvas */}
      <Card className="glass-morphism">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Radar className="w-5 h-5 text-[var(--cyber-cyan)]" />
              <span>Network Radar</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={isOfflineMode ? 'text-red-500' : 'text-green-500'}>
                {isOfflineMode ? (
                  <>
                    <WifiOff className="w-3 h-3 mr-1" />
                    Offline
                  </>
                ) : (
                  <>
                    <Wifi className="w-3 h-3 mr-1" />
                    Online
                  </>
                )}
              </Badge>
              <Badge variant="outline" className="text-[var(--cyber-cyan)]">
                {detectedUsers.length} detected
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={300}
                height={300}
                className="border border-gray-700 rounded-lg bg-black/20"
              />
              {isScanning && (
                <div className="absolute top-2 right-2">
                  <div className="w-3 h-3 bg-[var(--cyber-cyan)] rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={isScanning ? onStopScan : onStartScan}
                className={isScanning ? 'text-red-500' : 'text-[var(--cyber-cyan)]'}
              >
                {isScanning ? (
                  <>
                    <WifiOff className="w-4 h-4 mr-1" />
                    Stop Scan
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Start Scan
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setScanRange(prev => prev === 100 ? 200 : 100)}
              >
                Range: {scanRange}m
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Detected Users List */}
      <Card className="glass-morphism">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-[var(--cyber-green)]" />
            <span>Detected Users</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {detectedUsers.length === 0 ? (
            <div className="text-center py-4 text-gray-400">
              {isScanning ? 'Scanning for users...' : 'No users detected'}
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {detectedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors cursor-pointer"
                  onClick={() => onUserSelect(user.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      {getConnectionTypeIcon(user.connectionType)}
                      <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                        user.isOnline ? 'bg-green-500' : 'bg-gray-500'
                      }`}></div>
                    </div>
                    <div>
                      <div className="font-medium">{user.username}</div>
                      <div className="text-sm text-gray-400">
                        {Math.round(user.distance)}m • {formatLastSeen(user.lastSeen)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`flex items-center space-x-1 ${getSignalColor(user.signalStrength)}`}>
                      <Signal className="w-4 h-4" />
                      <span className="text-sm">{Math.round(user.signalStrength * 100)}%</span>
                    </div>
                    {user.isOnline && (
                      <Shield className="w-4 h-4 text-[var(--cyber-cyan)]" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}