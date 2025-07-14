import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Network, Images, Wallet, Wifi, Bluetooth, Activity } from 'lucide-react';

export function Sidebar() {
  const [activeTab, setActiveTab] = useState('chat');

  const tabs = [
    { id: 'chat', icon: MessageCircle, color: 'text-[var(--cyber-cyan)]' },
    { id: 'network', icon: Network, color: 'text-gray-400' },
    { id: 'stories', icon: Images, color: 'text-gray-400' },
    { id: 'wallet', icon: Wallet, color: 'text-gray-400' },
    { id: 'bluetooth', icon: Bluetooth, color: 'text-gray-400' },
  ];

  return (
    <div className="w-16 bg-[var(--cyber-gray)] border-r border-gray-800 flex flex-col items-center py-4 space-y-4">
      {/* App Logo */}
      <div className="w-10 h-10 cyber-gradient rounded-lg flex items-center justify-center text-[var(--cyber-dark)] font-bold text-xl shadow-lg group cursor-pointer">
        <span className="group-hover:scale-110 transition-transform">M</span>
      </div>
      
      {/* Navigation Icons */}
      <div className="flex flex-col space-y-4">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            size="icon"
            onClick={() => setActiveTab(tab.id)}
            className={`w-10 h-10 rounded-lg ${
              activeTab === tab.id 
                ? 'bg-[var(--cyber-cyan)]/20 text-[var(--cyber-cyan)]' 
                : 'text-gray-400 hover:text-[var(--cyber-cyan)] hover:bg-[var(--cyber-cyan)]/20'
            } transition-colors`}
          >
            <tab.icon className="w-5 h-5" />
          </Button>
        ))}
      </div>
      
      {/* Status Indicator */}
      <div className="flex-1 flex items-end">
        <div className="w-10 h-10 rounded-lg bg-[var(--cyber-green)]/20 text-[var(--cyber-green)] flex items-center justify-center group">
          <div className="relative">
            <Activity className="w-5 h-5 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--cyber-green)] rounded-full animate-ping"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
