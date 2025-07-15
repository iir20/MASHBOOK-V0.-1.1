import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useOfflineStorage } from '@/hooks/use-offline-storage';
import { 
  MessageCircle, 
  Send, 
  Shield, 
  Wifi, 
  WifiOff, 
  Clock,
  Check,
  CheckCheck,
  AlertCircle,
  Users,
  Zap
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  fromUserId: string;
  fromUsername: string;
  timestamp: Date;
  isEncrypted: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'failed';
  meshHops?: number;
}

interface RealTimeChatProps {
  currentUserId: string;
  selectedUser: string | null;
  onSendMessage: (content: string, targetUser?: string) => void;
  isConnected: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'critical';
}

export function RealTimeChat({ 
  currentUserId, 
  selectedUser, 
  onSendMessage, 
  isConnected,
  connectionQuality 
}: RealTimeChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { isOfflineMode, addMessage, messages: offlineMessages } = useOfflineStorage();
  
  // Load offline messages on mount
  useEffect(() => {
    const formattedMessages = offlineMessages.map(msg => ({
      id: msg.id,
      content: msg.content,
      fromUserId: msg.fromUserId,
      fromUsername: msg.fromUserId === currentUserId ? 'You' : `User_${msg.fromUserId.slice(-4)}`,
      timestamp: new Date(msg.timestamp),
      isEncrypted: msg.isEncrypted,
      status: msg.status === 'sent' ? 'delivered' : msg.status === 'pending' ? 'sending' : 'failed'
    })) as Message[];
    
    setMessages(formattedMessages);
  }, [offlineMessages, currentUserId]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Simulate real-time features
  useEffect(() => {
    if (isConnected) {
      // Simulate active users
      const users = ['CyberNode_A1', 'NetRunner_X9', 'MeshRelay_7', 'BlueLink_M3'];
      setActiveUsers(users);
      
      // Simulate incoming messages
      const messageInterval = setInterval(() => {
        if (Math.random() < 0.1) { // 10% chance every 5 seconds
          const randomUser = users[Math.floor(Math.random() * users.length)];
          const randomMessages = [
            'Network topology is expanding rapidly',
            'New mesh relay established in sector 7',
            'Signal strength optimal for data transfer',
            'Encryption protocols are functioning normally',
            'Mesh network health is excellent',
            'Detecting new nodes in the area'
          ];
          
          const newMessage: Message = {
            id: Date.now().toString(),
            content: randomMessages[Math.floor(Math.random() * randomMessages.length)],
            fromUserId: randomUser,
            fromUsername: randomUser,
            timestamp: new Date(),
            isEncrypted: true,
            status: 'delivered',
            meshHops: Math.floor(Math.random() * 5) + 1
          };
          
          setMessages(prev => [...prev, newMessage]);
        }
      }, 5000);
      
      // Simulate typing indicators
      const typingInterval = setInterval(() => {
        if (Math.random() < 0.05) { // 5% chance
          const randomUser = users[Math.floor(Math.random() * users.length)];
          setIsTyping(prev => [...prev, randomUser]);
          
          setTimeout(() => {
            setIsTyping(prev => prev.filter(user => user !== randomUser));
          }, 2000);
        }
      }, 3000);
      
      return () => {
        clearInterval(messageInterval);
        clearInterval(typingInterval);
      };
    }
  }, [isConnected]);
  
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      fromUserId: currentUserId,
      fromUsername: 'You',
      timestamp: new Date(),
      isEncrypted: true,
      status: isOfflineMode ? 'sending' : 'sent'
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Store in offline storage
    addMessage({
      content: inputMessage,
      fromUserId: currentUserId,
      toUserId: selectedUser || undefined,
      isEncrypted: true
    });
    
    // Send message
    onSendMessage(inputMessage, selectedUser || undefined);
    setInputMessage('');
    
    // Show toast for offline mode
    if (isOfflineMode) {
      toast({
        title: "Message Queued",
        description: "Message will be sent when connection is restored",
        variant: "default",
      });
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-yellow-500" />;
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };
  
  const getConnectionColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'poor': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };
  
  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <Card className="glass-morphism h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-[var(--cyber-cyan)]" />
            <span>Real-Time Chat</span>
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
            <Badge variant="outline" className={getConnectionColor(connectionQuality)}>
              {connectionQuality}
            </Badge>
            <Badge variant="outline" className="text-[var(--cyber-green)]">
              <Users className="w-3 h-3 mr-1" />
              {activeUsers.length}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Messages Area */}
        <ScrollArea className="flex-1 h-96" ref={scrollRef}>
          <div className="space-y-4 p-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.fromUserId === currentUserId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.fromUserId === currentUserId
                      ? 'bg-[var(--cyber-cyan)] text-black'
                      : 'bg-gray-700 text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {message.fromUsername.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">{message.fromUsername}</span>
                    {message.isEncrypted && (
                      <Shield className="w-3 h-3 text-green-400" />
                    )}
                    {message.meshHops && (
                      <Badge variant="outline" className="text-xs">
                        <Zap className="w-2 h-2 mr-1" />
                        {message.meshHops}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm">{message.content}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs opacity-70">
                      {formatTime(message.timestamp)}
                    </span>
                    {message.fromUserId === currentUserId && (
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(message.status)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicators */}
            {isTyping.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-gray-700 px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {isTyping.join(', ')} {isTyping.length === 1 ? 'is' : 'are'} typing...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Input Area */}
        <div className="flex items-center space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isOfflineMode ? "Type message (will send when online)..." : "Type a message..."}
            className="flex-1"
            disabled={!isConnected && !isOfflineMode}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            size="sm"
            className="px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Connection Status */}
        {!isConnected && !isOfflineMode && (
          <div className="text-center py-2 text-sm text-gray-400">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Connecting to network...
          </div>
        )}
        
        {selectedUser && (
          <div className="text-center py-1 text-xs text-gray-400">
            Chatting with {selectedUser}
          </div>
        )}
      </CardContent>
    </Card>
  );
}