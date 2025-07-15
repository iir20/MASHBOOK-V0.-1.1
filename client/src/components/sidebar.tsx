import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Network, Images, Wifi, Bluetooth, Activity, Shield, FileText, BarChart3, Menu, X } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isConnected?: boolean;
  connectionCount?: number;
}

export function Sidebar({ activeTab, onTabChange, isConnected = false, connectionCount = 0 }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'chat', icon: MessageCircle, label: 'Chat', description: 'Real-time encrypted messaging' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics', description: 'Network performance metrics' },
    { id: 'transfers', icon: FileText, label: 'Transfers', description: 'File sharing & progress' },
    { id: 'security', icon: Shield, label: 'Security', description: 'Encryption & key management' },
    { id: 'network', icon: Network, label: 'Network', description: 'Mesh topology explorer' },
    { id: 'stories', icon: Images, label: 'Stories', description: 'Ephemeral content sharing' },
    { id: 'bluetooth', icon: Bluetooth, label: 'Bluetooth', description: 'Device discovery & pairing' },
  ];

  const getStatusColor = () => {
    if (isConnected && connectionCount > 0) return 'text-[var(--cyber-green)]';
    if (isConnected) return 'text-[var(--cyber-cyan)]';
    return 'text-orange-400';
  };

  const getStatusText = () => {
    if (isConnected && connectionCount > 0) return `${connectionCount} peers`;
    if (isConnected) return 'Online';
    return 'Connecting';
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-[var(--cyber-dark)]/90 border border-[var(--cyber-cyan)]/30 text-[var(--cyber-cyan)] hover:bg-[var(--cyber-cyan)]/20"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative
        top-0 left-0 h-full
        w-80 lg:w-16
        bg-[var(--cyber-dark)]/95 lg:bg-[var(--cyber-gray)]
        border-r border-[var(--cyber-cyan)]/30
        backdrop-blur-sm lg:backdrop-blur-none
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        z-40 lg:z-auto
        flex flex-col
      `}>
        {/* Header */}
        <div className="p-4 lg:p-4 lg:flex lg:justify-center">
          <div className="flex items-center gap-3 lg:w-10 lg:h-10">
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--cyber-cyan)] to-[var(--cyber-magenta)] rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg">
              M
            </div>
            <div className="lg:hidden">
              <h1 className="text-[var(--cyber-cyan)] font-bold text-lg">Mesh Network</h1>
              <p className="text-gray-400 text-sm">Decentralized Chat</p>
            </div>
          </div>
        </div>

        {/* Status (Mobile Only) */}
        <div className="lg:hidden px-4 pb-4">
          <div className="flex items-center gap-2 p-3 bg-[var(--cyber-dark)]/50 rounded-lg border border-[var(--cyber-cyan)]/20">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[var(--cyber-green)]' : 'bg-orange-400'} animate-pulse`} />
            <span className="text-sm text-gray-300">{getStatusText()}</span>
            {connectionCount > 0 && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {connectionCount}
              </Badge>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 lg:px-0 lg:flex lg:flex-col lg:items-center lg:space-y-4">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              onClick={() => {
                onTabChange(tab.id);
                setIsMobileMenuOpen(false);
              }}
              className={`
                w-full lg:w-10 lg:h-10
                justify-start lg:justify-center
                p-3 lg:p-0
                mb-2 lg:mb-0
                rounded-lg
                ${activeTab === tab.id 
                  ? 'bg-[var(--cyber-cyan)]/20 text-[var(--cyber-cyan)] border-l-4 lg:border-l-0 border-[var(--cyber-cyan)]' 
                  : 'text-gray-400 hover:text-[var(--cyber-cyan)] hover:bg-[var(--cyber-cyan)]/10'
                }
                transition-all duration-200
                group
              `}
            >
              <tab.icon className="w-5 h-5 lg:w-5 lg:h-5 flex-shrink-0" />
              <div className="lg:hidden ml-3 flex-1 text-left">
                <div className="font-medium">{tab.label}</div>
                <div className="text-xs text-gray-500 group-hover:text-gray-400">
                  {tab.description}
                </div>
              </div>
            </Button>
          ))}
        </div>

        {/* Bottom Status (Desktop Only) */}
        <div className="hidden lg:flex lg:flex-col lg:items-center lg:p-4">
          <div className={`w-10 h-10 rounded-lg ${isConnected ? 'bg-[var(--cyber-green)]/20' : 'bg-orange-400/20'} flex items-center justify-center group relative`}>
            <div className="relative">
              <Activity className={`w-5 h-5 ${getStatusColor()} ${isConnected ? 'animate-pulse' : ''}`} />
              {connectionCount > 0 && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--cyber-green)] rounded-full animate-ping"></div>
              )}
            </div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-full ml-2 mb-2 px-2 py-1 bg-[var(--cyber-dark)] text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {getStatusText()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
