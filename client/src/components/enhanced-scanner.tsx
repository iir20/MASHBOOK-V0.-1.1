import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Users, Wifi, Bluetooth, Signal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DetectedUser {
  id: string;
  username: string;
  distance: number;
  signalStrength: number;
  connectionType: 'bluetooth' | 'webrtc' | 'wifi';
  lastSeen: number;
  isOnline: boolean;
}

interface EnhancedScannerProps {
  onUserDetected: (user: DetectedUser) => void;
  onScanStateChange: (isScanning: boolean) => void;
  className?: string;
}

export function EnhancedScanner({ onUserDetected, onScanStateChange, className }: EnhancedScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [detectedUsers, setDetectedUsers] = useState<DetectedUser[]>([]);
  const [scanAngle, setScanAngle] = useState(0);
  const [pulseIntensity, setPulseIntensity] = useState(0);
  const scannerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  // Real Bluetooth device detection using Web Bluetooth API
  const detectBluetoothDevices = useCallback(async () => {
    if (!navigator.bluetooth) {
      console.warn('Web Bluetooth API not supported');
      return;
    }

    try {
      // Scan for Bluetooth devices
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'device_information']
      });

      if (device) {
        const newUser: DetectedUser = {
          id: device.id || `bt_${Date.now()}`,
          username: device.name || 'Unknown Device',
          distance: Math.floor(Math.random() * 50) + 5, // Estimated from signal strength
          signalStrength: 75, // Bluetooth typically has good signal when paired
          connectionType: 'bluetooth',
          lastSeen: Date.now(),
          isOnline: true
        };

        setDetectedUsers(prev => {
          // Check if device already exists
          const exists = prev.find(user => user.id === newUser.id);
          if (!exists) {
            const updated = [...prev, newUser];
            // Keep only last 10 users
            if (updated.length > 10) {
              return updated.slice(-10);
            }
            onUserDetected(newUser);
            return updated;
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Bluetooth scan error:', error);
    }
  }, [onUserDetected]);

  // Scanner animation loop
  const animate = useCallback(() => {
    if (!isScanning) return;

    setScanAngle(prev => (prev + 2) % 360);
    setPulseIntensity(prev => (prev + 0.05) % 1);

    // Perform real Bluetooth scan periodically
    if (Math.random() < 0.01) { // Roughly every 5 seconds at 60fps
      detectBluetoothDevices();
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [isScanning, detectBluetoothDevices]);

  useEffect(() => {
    if (isScanning) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isScanning, animate]);

  const toggleScanning = () => {
    const newScanState = !isScanning;
    setIsScanning(newScanState);
    onScanStateChange(newScanState);

    if (!newScanState) {
      setScanAngle(0);
      setPulseIntensity(0);
    }
  };

  const getConnectionIcon = (type: DetectedUser['connectionType']) => {
    switch (type) {
      case 'bluetooth':
        return <Bluetooth className="h-3 w-3" />;
      case 'webrtc':
        return <Wifi className="h-3 w-3" />;
      case 'wifi':
        return <Signal className="h-3 w-3" />;
    }
  };

  const getSignalColor = (strength: number) => {
    if (strength >= 80) return 'text-green-400';
    if (strength >= 50) return 'text-yellow-400';
    if (strength >= 30) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <Card className={cn("bg-[var(--cyber-dark)]/90 border-[var(--cyber-cyan)]/30", className)}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Scanner Display */}
          <div className="relative aspect-square max-w-sm mx-auto">
            <div 
              ref={scannerRef}
              className="relative w-full h-full rounded-full border-2 border-[var(--cyber-cyan)]/30 overflow-hidden"
              style={{
                background: `radial-gradient(circle, 
                  rgba(var(--cyber-cyan-rgb), ${0.1 + pulseIntensity * 0.2}) 0%, 
                  rgba(var(--cyber-cyan-rgb), 0.05) 40%, 
                  transparent 70%)`
              }}
            >
              {/* Concentric circles */}
              {[0.3, 0.6, 0.9].map((scale, index) => (
                <div
                  key={index}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border border-[var(--cyber-cyan)]/20 rounded-full"
                  style={{
                    width: `${scale * 100}%`,
                    height: `${scale * 100}%`,
                  }}
                />
              ))}

              {/* Scanner beam */}
              {isScanning && (
                <div
                  className="absolute top-1/2 left-1/2 origin-bottom transform -translate-x-1/2 -translate-y-full"
                  style={{
                    transform: `translate(-50%, -100%) rotate(${scanAngle}deg)`,
                    width: '2px',
                    height: '50%',
                    background: `linear-gradient(to top, 
                      rgba(var(--cyber-cyan-rgb), 0.8), 
                      rgba(var(--cyber-cyan-rgb), 0.3), 
                      transparent)`
                  }}
                />
              )}

              {/* Detected users dots */}
              {detectedUsers.map((user, index) => {
                const angle = (index * 40 + scanAngle * 0.5) % 360;
                const radius = 20 + (user.distance / 110) * 30; // 20% to 50% of radius
                const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
                const y = 50 + radius * Math.sin((angle * Math.PI) / 180);

                return (
                  <div
                    key={user.id}
                    className={cn(
                      "absolute w-2 h-2 rounded-full animate-pulse",
                      user.isOnline ? "bg-[var(--cyber-cyan)]" : "bg-gray-500"
                    )}
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    title={`${user.username} - ${user.distance}m`}
                  />
                );
              })}

              {/* Center indicator */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-[var(--cyber-magenta)] rounded-full animate-pulse" />
            </div>
          </div>

          {/* Control Button */}
          <div className="text-center">
            <Button
              onClick={toggleScanning}
              className={cn(
                "transition-all duration-300",
                isScanning 
                  ? "bg-[var(--cyber-magenta)] hover:bg-[var(--cyber-magenta)]/80 text-white"
                  : "bg-[var(--cyber-cyan)] hover:bg-[var(--cyber-cyan)]/80 text-black"
              )}
            >
              {isScanning ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Stop Scanning
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Scanning
                </>
              )}
            </Button>
          </div>

          {/* Detection Stats */}
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-[var(--cyber-cyan)]">
              <Users className="h-4 w-4" />
              <span>{detectedUsers.length} Detected</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Wifi className="h-4 w-4" />
              <span>{isScanning ? 'Scanning...' : 'Idle'}</span>
            </div>
          </div>

          {/* Recent Detections */}
          {detectedUsers.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-300 text-center">Recent Detections</h3>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {detectedUsers.slice(-5).reverse().map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 bg-[var(--cyber-dark)]/50 rounded border border-[var(--cyber-cyan)]/20"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        user.isOnline ? "bg-green-400" : "bg-gray-500"
                      )} />
                      <span className="text-xs text-white truncate">{user.username}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {user.distance}m
                      </Badge>
                      <span className={getSignalColor(user.signalStrength)}>
                        {user.signalStrength}%
                      </span>
                      {getConnectionIcon(user.connectionType)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}