import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Terminal, 
  Send, 
  Lock, 
  Unlock,
  Zap,
  Shield,
  Radio,
  Activity,
  Eye,
  EyeOff,
  ChevronRight
} from 'lucide-react';

interface QuantumMessage {
  id: string;
  type: 'sent' | 'received' | 'system' | 'encrypted';
  content: string;
  timestamp: Date;
  fromNode?: string;
  toNode?: string;
  encrypted: boolean;
  verified: boolean;
}

interface QuantumTerminalProps {
  nodeCallsign: string;
  targetNodes: string[];
  onMessageSent?: (message: QuantumMessage) => void;
}

export function QuantumTerminal({ nodeCallsign, targetNodes, onMessageSent }: QuantumTerminalProps) {
  const [messages, setMessages] = useState<QuantumMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<string>(targetNodes[0] || '');
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [showEncrypted, setShowEncrypted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with system messages
  useEffect(() => {
    const systemMessages: QuantumMessage[] = [
      {
        id: 'sys1',
        type: 'system',
        content: `Quantum Terminal initialized for ${nodeCallsign}`,
        timestamp: new Date(),
        encrypted: false,
        verified: true
      },
      {
        id: 'sys2',
        type: 'system',
        content: 'Establishing quantum entanglement protocols...',
        timestamp: new Date(),
        encrypted: false,
        verified: true
      },
      {
        id: 'sys3',
        type: 'system',
        content: 'Neural mesh network ready. End-to-end encryption active.',
        timestamp: new Date(),
        encrypted: false,
        verified: true
      }
    ];
    setMessages(systemMessages);
    setIsConnected(true);
  }, [nodeCallsign]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate incoming messages
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance every 10 seconds
        const incomingMessage: QuantumMessage = {
          id: `incoming_${Date.now()}`,
          type: 'received',
          content: generateRandomMessage(),
          timestamp: new Date(),
          fromNode: targetNodes[Math.floor(Math.random() * targetNodes.length)],
          toNode: nodeCallsign,
          encrypted: true,
          verified: Math.random() > 0.1 // 90% verified
        };
        setMessages(prev => [...prev, incomingMessage]);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isConnected, nodeCallsign, targetNodes]);

  const generateRandomMessage = () => {
    const messages = [
      'Node status: Operational. Signal strength optimal.',
      'Quantum entanglement verified. Channel secure.',
      'Mesh relay active. Routing traffic through phantom nodes.',
      'Neural bridge established. Data stream synchronized.',
      'Void protocol engaged. Stealth mode activated.',
      'Cipher vault unlocked. Accessing encrypted archives.',
      'Network topology updated. New nodes detected.',
      'Security sweep complete. No intrusions detected.'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const handleSendMessage = () => {
    if (!currentMessage.trim() || !selectedTarget) return;

    const newMessage: QuantumMessage = {
      id: `sent_${Date.now()}`,
      type: 'sent',
      content: currentMessage.trim(),
      timestamp: new Date(),
      fromNode: nodeCallsign,
      toNode: selectedTarget,
      encrypted: encryptionEnabled,
      verified: true
    };

    setMessages(prev => [...prev, newMessage]);
    onMessageSent?.(newMessage);
    setCurrentMessage('');

    // Simulate response
    setTimeout(() => {
      const response: QuantumMessage = {
        id: `response_${Date.now()}`,
        type: 'received',
        content: `Acknowledged: ${currentMessage.slice(0, 20)}${currentMessage.length > 20 ? '...' : ''}`,
        timestamp: new Date(),
        fromNode: selectedTarget,
        toNode: nodeCallsign,
        encrypted: encryptionEnabled,
        verified: true
      };
      setMessages(prev => [...prev, response]);
    }, 1000 + Math.random() * 3000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageDisplay = (message: QuantumMessage) => {
    if (message.encrypted && !showEncrypted && message.type !== 'system') {
      return '█████████████████████████████████████████';
    }
    return message.content;
  };

  const getMessageStyle = (message: QuantumMessage) => {
    switch (message.type) {
      case 'sent':
        return 'bg-green-900/20 border-green-500/30 text-green-400 ml-12';
      case 'received':
        return 'bg-blue-900/20 border-blue-500/30 text-blue-400 mr-12';
      case 'system':
        return 'bg-purple-900/20 border-purple-500/30 text-purple-400 mx-6 text-center';
      case 'encrypted':
        return 'bg-orange-900/20 border-orange-500/30 text-orange-400';
      default:
        return 'bg-gray-900/20 border-gray-500/30 text-gray-400';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg">
            <Terminal className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Quantum Terminal
            </h1>
            <p className="text-gray-400">Secure encrypted communications interface</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Badge className={`${isConnected ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
            <Activity className="w-4 h-4 mr-2" />
            {isConnected ? 'CONNECTED' : 'OFFLINE'}
          </Badge>
          <Badge className="bg-blue-900/20 text-blue-400">
            <Radio className="w-4 h-4 mr-2" />
            {nodeCallsign}
          </Badge>
        </div>
      </div>

      {/* Main Terminal */}
      <Card className="border-green-500/30 bg-black/80">
        <CardHeader className="border-b border-green-500/30">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-green-400">
              <Terminal className="w-5 h-5" />
              <span>Quantum Communication Channel</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEncrypted(!showEncrypted)}
                className="text-orange-400 hover:bg-orange-900/20"
              >
                {showEncrypted ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showEncrypted ? 'Hide' : 'Show'} Encrypted
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEncryptionEnabled(!encryptionEnabled)}
                className={encryptionEnabled ? 'text-green-400 hover:bg-green-900/20' : 'text-red-400 hover:bg-red-900/20'}
              >
                {encryptionEnabled ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                Encryption {encryptionEnabled ? 'ON' : 'OFF'}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {/* Messages Area */}
          <div className="h-96 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-black/90 to-gray-900/90">
            {messages.map((message) => (
              <div key={message.id} className={`p-3 rounded border ${getMessageStyle(message)}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    {message.type === 'sent' && <ChevronRight className="w-3 h-3 text-green-400" />}
                    {message.type === 'received' && <ChevronRight className="w-3 h-3 text-blue-400 rotate-180" />}
                    <span className="text-xs font-mono">
                      {message.fromNode && message.toNode 
                        ? `${message.fromNode} → ${message.toNode}`
                        : message.type.toUpperCase()
                      }
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {message.encrypted && (
                      <Lock className="w-3 h-3 text-orange-400" />
                    )}
                    {message.verified && (
                      <Shield className="w-3 h-3 text-green-400" />
                    )}
                    <span className="text-xs text-gray-400">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <div className="font-mono text-sm">
                  {getMessageDisplay(message)}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-green-500/30 p-4 bg-gray-900/50">
            <div className="flex items-center space-x-2 mb-3">
              <label className="text-sm font-medium text-gray-300">Target Node:</label>
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-gray-300 text-sm"
              >
                {targetNodes.map(node => (
                  <option key={node} value={node}>{node}</option>
                ))}
              </select>
              <Badge className={`${encryptionEnabled ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                {encryptionEnabled ? 'ENCRYPTED' : 'PLAINTEXT'}
              </Badge>
            </div>
            
            <div className="flex space-x-2">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter quantum transmission..."
                className="flex-1 bg-black border-green-500/30 text-green-400 placeholder-gray-500 font-mono"
                disabled={!isConnected}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || !isConnected}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Transmit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}