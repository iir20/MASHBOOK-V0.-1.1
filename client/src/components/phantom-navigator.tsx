import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain,
  Terminal,
  Shield,
  Radio,
  Settings,
  User,
  Zap,
  Network,
  Menu,
  X,
  Wifi,
  WifiOff,
  Sparkles
} from 'lucide-react';

interface NavigationTab {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  color: string;
  isActive?: boolean;
}

interface PhantomNavigatorProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isConnected?: boolean;
  nodeCount?: number;
  userCallsign?: string;
}

export function PhantomNavigator({ 
  activeTab, 
  onTabChange, 
  isConnected = false, 
  nodeCount = 0,
  userCallsign = 'UNKNOWN'
}: PhantomNavigatorProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationTabs: NavigationTab[] = [
    { 
      id: 'neural', 
      icon: Brain, 
      label: 'Neural Mesh', 
      description: 'Network topology & node management',
      color: 'text-purple-400 hover:bg-purple-900/20 data-[state=active]:bg-purple-600'
    },
    { 
      id: 'quantum', 
      icon: Terminal, 
      label: 'Quantum Terminal', 
      description: 'Secure communications interface',
      color: 'text-green-400 hover:bg-green-900/20 data-[state=active]:bg-green-600'
    },
    { 
      id: 'cipher', 
      icon: Shield, 
      label: 'Cipher Vault', 
      description: 'Cryptographic key management',
      color: 'text-cyan-400 hover:bg-cyan-900/20 data-[state=active]:bg-cyan-600'
    },
    { 
      id: 'phantom', 
      icon: Radio, 
      label: 'Phantom Link', 
      description: 'Bluetooth & wireless protocols',
      color: 'text-orange-400 hover:bg-orange-900/20 data-[state=active]:bg-orange-600'
    },
    { 
      id: 'void', 
      icon: Network, 
      label: 'Void Analytics', 
      description: 'Network performance metrics',
      color: 'text-pink-400 hover:bg-pink-900/20 data-[state=active]:bg-pink-600'
    },
    { 
      id: 'nexus', 
      icon: User, 
      label: 'Nexus Profile', 
      description: 'Identity & node configuration',
      color: 'text-yellow-400 hover:bg-yellow-900/20 data-[state=active]:bg-yellow-600'
    },
    { 
      id: 'stories', 
      icon: Sparkles, 
      label: 'Phantom Stories', 
      description: 'Ephemeral content & sharing',
      color: 'text-emerald-400 hover:bg-emerald-900/20 data-[state=active]:bg-emerald-600'
    }
  ];

  const getConnectionStatus = () => {
    if (isConnected && nodeCount > 0) {
      return {
        color: 'text-green-400 bg-green-900/20 border-green-400/30',
        icon: Wifi,
        text: `${nodeCount} NODES`,
        pulse: 'animate-pulse'
      };
    } else if (isConnected) {
      return {
        color: 'text-cyan-400 bg-cyan-900/20 border-cyan-400/30',
        icon: Wifi,
        text: 'ONLINE',
        pulse: ''
      };
    } else {
      return {
        color: 'text-red-400 bg-red-900/20 border-red-400/30',
        icon: WifiOff,
        text: 'OFFLINE',
        pulse: 'animate-pulse'
      };
    }
  };

  const connectionStatus = getConnectionStatus();

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden w-full p-2 bg-black/95 border-t border-purple-500/30 backdrop-blur-sm">
        <div className="flex justify-around items-center">
          {navigationTabs.slice(0, 5).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                variant="ghost"
                size="sm"
                onClick={() => onTabChange(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 p-2 h-auto ${
                  isActive ? 'bg-purple-600/30 text-purple-300' : 'text-gray-400 hover:text-purple-400'
                } transition-colors`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs truncate max-w-[60px]">{tab.label.split(' ')[0]}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Desktop Sidebar Navigation */}
      <div className="hidden lg:flex lg:w-20 xl:w-80 h-full bg-gray-900/95 border-r border-purple-500/30 backdrop-blur-sm flex-col">
        {/* Header (Desktop Only) */}
        <div className="p-4 xl:p-6 border-b border-purple-500/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 xl:w-12 xl:h-12 bg-gradient-to-br from-purple-600 via-cyan-600 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
              <Zap className="w-4 h-4 xl:w-6 xl:h-6 text-white" />
            </div>
            <div className="hidden xl:block">
              <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                PHANTOM MESH
              </h1>
              <p className="text-xs text-gray-400 font-mono">{userCallsign}</p>
            </div>
          </div>
        </div>

        {/* Connection Status (Desktop Only) */}
        <div className="p-4 xl:p-6">
          <Badge className={`w-full justify-center xl:justify-start ${connectionStatus.color} ${connectionStatus.pulse}`}>
            <connectionStatus.icon className="w-3 h-3 mr-0 xl:mr-2" />
            <span className="hidden xl:inline">{connectionStatus.text}</span>
          </Badge>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-2 lg:px-3 space-y-2">
          {navigationTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                variant="ghost"
                className={`
                  w-full h-auto py-4 px-3 
                  flex items-center gap-3 
                  justify-start
                  ${tab.color}
                  ${isActive ? 'bg-purple-600 text-white' : ''}
                  transition-all duration-200
                  border border-transparent
                  ${isActive ? 'border-purple-400/50 shadow-lg shadow-purple-500/20' : 'hover:border-gray-600/50'}
                `}
                onClick={() => {
                  onTabChange(tab.id);
                  setIsMobileMenuOpen(false);
                }}
              >
                <tab.icon className="w-5 h-5 flex-shrink-0" />
                <div className="text-left flex-1 min-w-0">
                  <div className="font-medium text-sm leading-none">
                    {tab.label}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 leading-none line-clamp-2">
                    {tab.description}
                  </div>
                </div>
                {isActive && (
                  <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0" />
                )}
              </Button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 lg:p-6 border-t border-gray-700/50">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-gray-400 hover:text-gray-300"
          >
            <Settings className="w-4 h-4 mr-2" />
            <span>System Config</span>
          </Button>
        </div>
      </div>
    </>
  );
}