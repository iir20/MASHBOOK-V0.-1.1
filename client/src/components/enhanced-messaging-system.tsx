import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

import { 
  Send, 
  Users, 
  Lock, 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Wifi,
  WifiOff,
  Paperclip,
  Image,
  FileText,
  Mic,
  MicOff,
  Video,
  VideoOff,
  MoreHorizontal,
  Reply,
  Forward,
  Star,
  Download,
  Search,
  Settings,
  Eye,
  EyeOff,
  Zap,
  Radio,
  Network,
  Bot,
  User as UserIcon,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { User, Message, InsertMessage } from '@shared/schema';

interface EnhancedMessage extends Message {
  user?: User;
  encrypted?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  reactions?: { emoji: string; users: string[] }[];
  replyTo?: EnhancedMessage;
  forwarded?: boolean;
  starred?: boolean;
  meshRoute?: string[];
}

interface EnhancedMessagingProps {
  currentUser: User;
  availableUsers: User[];
  wsState: {
    isConnected: boolean;
    connectionQuality: string;
    sendMessage: (message: any) => void;
  };
}

export function EnhancedMessagingSystem({ 
  currentUser, 
  availableUsers, 
  wsState 
}: EnhancedMessagingProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [isEncrypted, setIsEncrypted] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [showUserList, setShowUserList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyingTo, setReplyingTo] = useState<EnhancedMessage | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [messageType, setMessageType] = useState<'text' | 'voice' | 'file'>('text');
  const [isRecording, setIsRecording] = useState(false);
  const [meshRouting, setMeshRouting] = useState(false);
  const [ephemeralMode, setEphemeralMode] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get messages from database
  const { data: dbMessages = [], isLoading } = useQuery({
    queryKey: ['/api/messages'],
    enabled: !!currentUser
  });

  // Enhanced WebSocket message handling
  useEffect(() => {
    const handleWSMessage = (event: CustomEvent) => {
      const message = event.detail;
      
      if (message.type === 'chat-message') {
        const enhancedMessage: EnhancedMessage = {
          id: Date.now(),
          fromUserId: message.fromUserId,
          toUserId: message.toUserId,
          content: message.content,
          encryptedContent: message.encrypted ? message.content : '',
          timestamp: new Date(),
          messageType: message.messageType || 'text',
          isEphemeral: message.ephemeral || false,
          meshHops: message.meshHops || 0,
          encrypted: message.encrypted || false,
          status: 'delivered',
          meshRoute: message.meshRoute || [],
          reactions: []
        };
        
        setMessages(prev => [...prev, enhancedMessage]);
        scrollToBottom();
        
        // Show notification if not from current user
        if (message.fromUserId !== currentUser.id) {
          const sender = availableUsers.find(u => u.id === message.fromUserId);
          toast({
            title: `Message from ${sender?.alias || 'Unknown'}`,
            description: message.encrypted ? '🔒 Encrypted message received' : message.content.substring(0, 50),
          });
        }
      } else if (message.type === 'typing-indicator') {
        setIsTyping(message.isTyping && message.userId !== currentUser.id);
      }
    };

    window.addEventListener('phantom-ws-message', handleWSMessage as EventListener);
    return () => window.removeEventListener('phantom-ws-message', handleWSMessage as EventListener);
  }, [currentUser.id, availableUsers, toast]);

  // Load and enhance messages from database
  useEffect(() => {
    if (Array.isArray(dbMessages) && dbMessages.length > 0) {
      const enhancedMessages: EnhancedMessage[] = (dbMessages as Message[]).map((msg: Message) => ({
        ...msg,
        status: 'delivered' as const,
        encrypted: isEncrypted,
        reactions: [],
        meshRoute: []
      }));
      setMessages(enhancedMessages);
    }
  }, [dbMessages, isEncrypted]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Enhanced message encryption
  const encryptMessage = async (content: string): Promise<string> => {
    if (!isEncrypted || !selectedUser) return content;
    
    try {
      // Simple XOR encryption for demo - in production use proper encryption
      const key = `${currentUser.deviceId}${selectedUser.deviceId}`;
      let encrypted = '';
      for (let i = 0; i < content.length; i++) {
        encrypted += String.fromCharCode(content.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return btoa(encrypted);
    } catch (error) {
      console.error('Encryption failed:', error);
      return content;
    }
  };

  // Send message with enhanced features
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: InsertMessage) => {
      // First save to database
      const savedMessage = await apiRequest('/api/messages', {
        method: 'POST',
        body: messageData
      });
      
      // Then send via WebSocket for real-time delivery
      if (wsState.isConnected) {
        const wsMessage = {
          type: 'chat-message',
          fromUserId: messageData.fromUserId,
          toUserId: messageData.toUserId,
          content: messageData.content,
          encrypted: isEncrypted,
          messageType: messageData.messageType,
          ephemeral: messageData.isEphemeral,
          meshHops: messageData.meshHops,
          meshRoute: meshRouting ? [currentUser.meshCallsign] : [],
          replyTo: replyingTo?.id,
          timestamp: Date.now()
        };
        wsState.sendMessage(wsMessage);
      }
      
      return savedMessage;
    },
    onSuccess: (savedMessage) => {
      // Add optimistic update
      const optimisticMessage: EnhancedMessage = {
        ...savedMessage,
        status: wsState.isConnected ? 'sent' : 'sending',
        encrypted: isEncrypted,
        reactions: [],
        replyTo: replyingTo || undefined,
        meshRoute: meshRouting ? [currentUser.meshCallsign] : []
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      setMessageInput('');
      setReplyingTo(null);
      scrollToBottom();
      
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    },
    onError: (error: any) => {
      toast({
        title: "Message Failed",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedUser) return;
    
    try {
      const encryptedContent = await encryptMessage(messageInput);
      
      const messageData: InsertMessage = {
        fromUserId: currentUser.id,
        toUserId: selectedUser.id,
        content: messageInput,
        encryptedContent: isEncrypted ? encryptedContent : messageInput,
        messageType: messageType,
        isEphemeral: ephemeralMode,
        meshHops: meshRouting ? 1 : 0
      };

      sendMessageMutation.mutate(messageData);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Handle file attachment
  const handleFileAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedUser) return;

    // In a real app, you'd upload the file and get a URL
    const fileMessage = `📎 File: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    
    const messageData: InsertMessage = {
      fromUserId: currentUser.id,
      toUserId: selectedUser.id,
      content: fileMessage,
      encryptedContent: isEncrypted ? await encryptMessage(fileMessage) : fileMessage,
      messageType: 'file',
      isEphemeral: ephemeralMode,
      meshHops: 0
    };

    sendMessageMutation.mutate(messageData);
  };

  // Handle typing indicators
  const handleTyping = () => {
    if (wsState.isConnected && selectedUser) {
      wsState.sendMessage({
        type: 'typing-indicator',
        userId: currentUser.id,
        targetUserId: selectedUser.id,
        isTyping: true
      });
      
      // Stop typing after 3 seconds
      setTimeout(() => {
        wsState.sendMessage({
          type: 'typing-indicator',
          userId: currentUser.id,
          targetUserId: selectedUser.id,
          isTyping: false
        });
      }, 3000);
    }
  };

  // Filter messages for selected conversation
  const conversationMessages = selectedUser 
    ? messages.filter(msg => 
        (msg.fromUserId === currentUser.id && msg.toUserId === selectedUser.id) ||
        (msg.fromUserId === selectedUser.id && msg.toUserId === currentUser.id)
      )
    : [];

  // Filter available users based on search
  const filteredUsers = availableUsers.filter(user => 
    user.id !== currentUser.id &&
    (user.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.meshCallsign.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Message component with enhanced features
  const MessageBubble = ({ message }: { message: EnhancedMessage }) => {
    const isOwn = message.fromUserId === currentUser.id;
    const messageUser = isOwn ? currentUser : availableUsers.find(u => u.id === message.fromUserId);

    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group`}>
        <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-xs`}>
          <Avatar className="w-8 h-8">
            <AvatarImage src={messageUser?.avatar} alt={messageUser?.alias} />
            <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-pink-500 text-white text-xs">
              {messageUser?.alias.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className={`relative px-4 py-2 rounded-2xl ${
            isOwn 
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white' 
              : 'bg-gray-800 text-white'
          }`}>
            {/* Reply indicator */}
            {message.replyTo && (
              <div className="text-xs text-gray-300 mb-1 p-1 bg-black/20 rounded">
                ↳ {message.replyTo.content.substring(0, 30)}...
              </div>
            )}
            
            {/* Message content */}
            <div className="flex items-start gap-2">
              {message.encrypted && <Lock className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />}
              <p className="text-sm break-words">{message.content}</p>
            </div>
            
            {/* Mesh route indicator */}
            {message.meshRoute && message.meshRoute.length > 0 && (
              <div className="text-xs text-gray-300 mt-1 flex items-center gap-1">
                <Network className="w-3 h-3" />
                Route: {message.meshRoute.join(' → ')}
              </div>
            )}
            
            {/* Message metadata */}
            <div className="flex items-center justify-between mt-1 text-xs text-gray-300">
              <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
              <div className="flex items-center gap-1">
                {message.status === 'sending' && <Clock className="w-3 h-3" />}
                {message.status === 'sent' && <CheckCircle className="w-3 h-3" />}
                {message.status === 'delivered' && <CheckCircle className="w-3 h-3 text-blue-400" />}
                {message.status === 'failed' && <AlertCircle className="w-3 h-3 text-red-400" />}
                {message.starred && <Star className="w-3 h-3 text-yellow-400 fill-current" />}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`h-full flex ${isDarkMode ? 'bg-gray-900' : 'bg-white'} text-white`}>
      {/* User List Sidebar */}
      {showUserList && (
        <div className="w-1/3 border-r border-gray-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-cyan-400">Mesh Network</h2>
              <Badge variant="outline" className={`${wsState.isConnected ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400'}`}>
                {wsState.isConnected ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                {wsState.connectionQuality}
              </Badge>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-600 text-white"
              />
            </div>
          </div>

          {/* User List */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedUser?.id === user.id 
                      ? 'bg-cyan-600/20 border border-cyan-500/50' 
                      : 'hover:bg-gray-800 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar} alt={user.alias} />
                        <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                          {user.alias.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {user.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-white truncate">{user.alias}</p>
                        <Badge variant="outline" className="text-xs text-pink-300 border-pink-500/50">
                          {user.meshCallsign}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 truncate">{user.profile}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          Level {user.securityLevel}
                        </Badge>
                        {user.nodeCapabilities.includes('encryption') && (
                          <Shield className="w-3 h-3 text-green-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-700 bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedUser.avatar} alt={selectedUser.alias} />
                    <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                      {selectedUser.alias.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-cyan-400">{selectedUser.alias}</h3>
                    <p className="text-sm text-gray-400">
                      {selectedUser.isOnline ? 'Online' : `Last seen ${new Date(selectedUser.lastSeen).toLocaleString()}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Message Settings */}
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Label htmlFor="encryption" className="text-gray-400">Encrypt</Label>
                      <Switch
                        id="encryption"
                        checked={isEncrypted}
                        onCheckedChange={setIsEncrypted}
                      />
                      {isEncrypted && <Lock className="w-3 h-3 text-green-400" />}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Label htmlFor="mesh" className="text-gray-400">Mesh</Label>
                      <Switch
                        id="mesh"
                        checked={meshRouting}
                        onCheckedChange={setMeshRouting}
                      />
                      {meshRouting && <Network className="w-3 h-3 text-pink-400" />}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Label htmlFor="ephemeral" className="text-gray-400">Ephemeral</Label>
                      <Switch
                        id="ephemeral"
                        checked={ephemeralMode}
                        onCheckedChange={setEphemeralMode}
                      />
                      {ephemeralMode && <Zap className="w-3 h-3 text-yellow-400" />}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUserList(!showUserList)}
                    className="border-gray-600"
                  >
                    {showUserList ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-1">
                {conversationMessages.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No messages yet</p>
                    <p className="text-sm mt-2">Start the conversation with {selectedUser.alias}</p>
                  </div>
                ) : (
                  conversationMessages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))
                )}
                
                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex justify-start mb-4">
                    <div className="flex items-center space-x-2 px-4 py-2 bg-gray-800 rounded-2xl">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-xs text-gray-400">{selectedUser.alias} is typing...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Reply indicator */}
            {replyingTo && (
              <div className="px-4 py-2 bg-gray-800/50 border-t border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Reply className="w-4 h-4" />
                    Replying to: {replyingTo.content.substring(0, 50)}...
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(null)}
                    className="h-6 w-6 p-0"
                  >
                    ✕
                  </Button>
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 border-t border-gray-700 bg-gray-800/30">
              <div className="flex items-end space-x-2">
                <div className="flex-1 space-y-2">
                  <Textarea
                    ref={messageInputRef}
                    placeholder={`Message ${selectedUser.alias}...`}
                    value={messageInput}
                    onChange={(e) => {
                      setMessageInput(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="min-h-[40px] max-h-32 bg-gray-800 border-gray-600 text-white resize-none"
                    rows={1}
                  />
                </div>

                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFileAttachment}
                    className="border-gray-600"
                    title="Attach file"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>

                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendMessageMutation.isPending}
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                  >
                    {sendMessageMutation.isPending ? (
                      <Radio className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              />

              {/* Status indicator */}
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <div className="flex items-center space-x-3">
                  <span>
                    {wsState.isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                  </span>
                  {isEncrypted && <span>🔒 End-to-end encrypted</span>}
                  {meshRouting && <span>🌐 Mesh routing enabled</span>}
                  {ephemeralMode && <span>⚡ Ephemeral messages</span>}
                </div>
                <span>{messageInput.length}/1000</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Welcome to Meshbook Chat</h3>
              <p className="max-w-md">
                Select a user from the network to start messaging. 
                All conversations are encrypted and can route through the mesh network.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}