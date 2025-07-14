import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChatMessage } from '@/types/mesh';
import { Send, Search, Share2, Settings, Shield, Clock, Network, Mic, Plus, Bluetooth, Wifi, Radio } from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isConnected: boolean;
}

export function ChatInterface({ messages, onSendMessage, isConnected }: ChatInterfaceProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      onSendMessage(inputMessage);
      setInputMessage('');
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const getMessageAvatar = (message: ChatMessage) => {
    if (message.fromUsername === 'You') {
      return 'Y';
    }
    return message.fromUsername.charAt(0).toUpperCase();
  };

  const getAvatarColor = (message: ChatMessage) => {
    if (message.fromUsername === 'You') {
      return 'from-[var(--cyber-green)] to-[var(--cyber-cyan)]';
    }
    if (message.fromUsername.includes('CyberNode')) {
      return 'from-[var(--cyber-cyan)] to-[var(--cyber-magenta)]';
    }
    return 'from-[var(--cyber-magenta)] to-[var(--cyber-cyan)]';
  };

  const getConnectionTypeIcon = (message: ChatMessage) => {
    if (message.meshHops > 0) return { text: 'Mesh Relay', icon: Radio };
    if (message.fromUsername.includes('Bluetooth')) return { text: 'Bluetooth', icon: Bluetooth };
    return { text: 'WebRTC', icon: Wifi };
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="h-16 bg-[var(--cyber-gray)] border-b border-gray-800 flex items-center justify-between px-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[var(--cyber-magenta)] to-[var(--cyber-cyan)] rounded-full flex items-center justify-center text-[var(--cyber-dark)] font-bold">
            GM
          </div>
          <div>
            <div className="font-medium">General Mesh</div>
            <div className="text-xs text-gray-400">
              {messages.length} messages • E2E Encrypted
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-[var(--cyber-cyan)]">
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-[var(--cyber-cyan)]">
            <Share2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-[var(--cyber-cyan)]">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* System Message */}
        <div className="flex justify-center">
          <Card className="bg-[var(--cyber-gray)]/50 border-gray-800 px-4 py-2">
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <Shield className="w-4 h-4 text-[var(--cyber-green)]" />
              <span>End-to-end encryption enabled • Messages are ephemeral</span>
            </div>
          </Card>
        </div>

        {/* Chat Messages */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.fromUsername === 'You' ? 'flex-row-reverse' : ''
            }`}
          >
            <div className={`w-8 h-8 bg-gradient-to-br ${getAvatarColor(message)} rounded-full flex items-center justify-center text-[var(--cyber-dark)] text-sm font-bold`}>
              {getMessageAvatar(message)}
            </div>
            
            <div className="flex-1">
              <div className={`flex items-center space-x-2 mb-1 ${
                message.fromUsername === 'You' ? 'justify-end' : ''
              }`}>
                {message.fromUsername !== 'You' && (
                  <>
                    <span className="text-sm font-medium text-[var(--cyber-cyan)]">
                      {message.fromUsername}
                    </span>
                    <div className="flex items-center space-x-1 text-xs text-gray-400 font-mono">
                      <span>via</span>
                      {(() => {
                        const connectionInfo = getConnectionTypeIcon(message);
                        const IconComponent = connectionInfo.icon;
                        return (
                          <>
                            <IconComponent className="w-3 h-3" />
                            <span>{connectionInfo.text}</span>
                          </>
                        );
                      })()}
                    </div>
                  </>
                )}
                <span className="text-xs text-gray-400">
                  {message.timestamp.toLocaleTimeString()}
                </span>
                {message.fromUsername === 'You' && (
                  <>
                    <div className="flex items-center space-x-1 text-xs text-gray-400 font-mono">
                      <span>via</span>
                      {(() => {
                        const connectionInfo = getConnectionTypeIcon(message);
                        const IconComponent = connectionInfo.icon;
                        return (
                          <>
                            <IconComponent className="w-3 h-3" />
                            <span>{connectionInfo.text}</span>
                          </>
                        );
                      })()}
                    </div>
                    <span className="text-sm font-medium text-[var(--cyber-green)]">
                      {message.fromUsername}
                    </span>
                  </>
                )}
              </div>
              
              <div className={`message-bubble rounded-lg p-3 max-w-md ${
                message.fromUsername === 'You' 
                  ? 'bg-[var(--cyber-cyan)]/20 border border-[var(--cyber-cyan)]/30 ml-auto'
                  : 'glass-morphism'
              }`}>
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Status Message */}
        <div className="flex justify-center">
          <Card className="bg-[var(--cyber-green)]/20 border-[var(--cyber-green)]/30 px-4 py-2">
            <div className="flex items-center space-x-2 text-xs text-[var(--cyber-green)]">
              <div className="w-2 h-2 bg-[var(--cyber-green)] rounded-full animate-pulse"></div>
              <span>Messages delivered through mesh network • Encrypted payload intact</span>
            </div>
          </Card>
        </div>

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-[var(--cyber-cyan)]">
            <Plus className="w-4 h-4" />
          </Button>
          
          <div className="flex-1">
            <Input
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                setIsTyping(e.target.value.length > 0);
              }}
              onKeyPress={handleKeyPress}
              placeholder="Type encrypted message..."
              className="terminal-input"
            />
          </div>
          
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-[var(--cyber-cyan)]">
            <Mic className="w-4 h-4" />
          </Button>
          
          <Button 
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || !isConnected}
            className="neon-button px-4 py-2 font-medium"
          >
            SEND
          </Button>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Shield className="w-3 h-3 text-[var(--cyber-green)]" />
              <span>E2E Encrypted</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-[var(--cyber-yellow)]" />
              <span>Ephemeral</span>
            </div>
            <div className="flex items-center space-x-1">
              <Network className="w-3 h-3 text-[var(--cyber-cyan)]" />
              <span>Mesh Route</span>
            </div>
          </div>
          <div className="font-mono">
            <span className="text-[var(--cyber-cyan)]">{inputMessage.length}</span>/1024 bytes
          </div>
        </div>
      </div>
    </div>
  );
}
