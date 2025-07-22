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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
  MessageSquare,
  Search,
  Phone,
  Video,
  MoreVertical,
  Reply,
  Heart,
  User as UserIcon,
  ArrowLeft,
  Online,
  Zap,
  Eye,
  MessageCircle,
  ChevronDown,
  Settings,
  Info
} from 'lucide-react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { User, Message, InsertMessage } from '@shared/schema';

interface EnhancedMessage extends Message {
  user?: User;
  encrypted?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  isTyping?: boolean;
  timeAgo?: string;
}

interface RealTimeMessagingProps {
  currentUser: User;
  availableUsers: User[];
  wsState: {
    isConnected: boolean;
    connectionQuality: string;
    sendMessage: (message: any) => void;
  };
  onUserProfile: (user: User) => void;
  isOffline?: boolean;
}

export function EnhancedRealTimeMessaging({ 
  currentUser, 
  availableUsers, 
  wsState,
  onUserProfile,
  isOffline = false
}: RealTimeMessagingProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEncrypted, setIsEncrypted] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showUserList, setShowUserList] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [lastSeen, setLastSeen] = useState<Map<number, string>>(new Map());

  const scrollRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch messages with auto-refresh
  const { data: dbMessages = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/messages'],
    enabled: !!currentUser,
    refetchInterval: autoRefresh ? 1000 : false // Refresh every second when enabled
  });

  // Enhanced message processing
  useEffect(() => {
    if (Array.isArray(dbMessages) && dbMessages.length > 0) {
      const processedMessages = (dbMessages as Message[]).map((message: Message) => {
        const user = availableUsers.find(u => u.id === message.fromUserId) || currentUser;
        const timestamp = new Date(message.timestamp);
        const now = new Date();
        const diffMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
        
        let timeAgo = '';
        if (diffMinutes < 1) timeAgo = 'Just now';
        else if (diffMinutes < 60) timeAgo = `${diffMinutes}m ago`;
        else if (diffMinutes < 1440) timeAgo = `${Math.floor(diffMinutes / 60)}h ago`;
        else timeAgo = `${Math.floor(diffMinutes / 1440)}d ago`;

        return {
          ...message,
          user,
          encrypted: isEncrypted,
          status: 'delivered' as const,
          timeAgo
        };
      });

      setMessages(processedMessages);
    }
  }, [dbMessages, availableUsers, currentUser, isEncrypted]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle typing indicators
  const handleTyping = useCallback(() => {
    if (selectedUser && wsState.isConnected) {
      wsState.sendMessage({
        type: 'typing',
        fromUserId: currentUser.id,
        toUserId: selectedUser.id,
        timestamp: new Date().toISOString()
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (selectedUser && wsState.isConnected) {
        wsState.sendMessage({
          type: 'stop-typing',
          fromUserId: currentUser.id,
          toUserId: selectedUser.id,
          timestamp: new Date().toISOString()
        });
      }
    }, 3000);
  }, [selectedUser, currentUser, wsState]);

  // WebSocket message handling
  useEffect(() => {
    const handleWSMessage = (event: CustomEvent) => {
      const data = event.detail;
      
      switch (data.type) {
        case 'chat-message':
          const newMessage: EnhancedMessage = {
            id: Date.now(),
            fromUserId: data.fromUserId,
            toUserId: data.toUserId,
            content: data.content,
            encryptedContent: data.encrypted ? data.content : '',
            timestamp: new Date(),
            messageType: 'text',
            isEphemeral: false,
            meshHops: 0,
            user: availableUsers.find(u => u.id === data.fromUserId),
            encrypted: data.encrypted,
            status: 'delivered',
            timeAgo: 'Just now'
          };
          setMessages(prev => [...prev, newMessage]);
          break;

        case 'typing':
          setTypingUsers(prev => new Set([...prev, data.fromUserId]));
          break;

        case 'stop-typing':
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.fromUserId);
            return newSet;
          });
          break;

        case 'user-online':
          setLastSeen(prev => new Map(prev.set(data.userId, 'Online')));
          break;

        case 'user-offline':
          const now = new Date().toLocaleTimeString();
          setLastSeen(prev => new Map(prev.set(data.userId, `Last seen ${now}`)));
          break;
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('ws-message', handleWSMessage as EventListener);
      return () => window.removeEventListener('ws-message', handleWSMessage as EventListener);
    }
  }, [availableUsers]);

  // Create message mutation
  const createMessageMutation = useMutation({
    mutationFn: async (messageData: InsertMessage) => {
      const response = await apiRequest('/api/messages', {
        method: 'POST',
        body: JSON.stringify(messageData)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to send message');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      
      // Send via WebSocket for real-time delivery
      if (selectedUser && wsState.isConnected) {
        wsState.sendMessage({
          type: 'chat-message',
          fromUserId: currentUser.id,
          toUserId: selectedUser.id,
          content: messageInput,
          encrypted: isEncrypted,
          timestamp: new Date().toISOString()
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Message Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedUser) return;

    const messageData: InsertMessage = {
      fromUserId: currentUser.id,
      toUserId: selectedUser.id,
      content: messageInput,
      encryptedContent: isEncrypted ? messageInput : '',
      messageType: 'text',
      isEphemeral: false,
      meshHops: 0
    };

    // Optimistic update
    const optimisticMessage: EnhancedMessage = {
      id: Date.now(),
      ...messageData,
      timestamp: new Date(),
      user: currentUser,
      encrypted: isEncrypted,
      status: 'sending',
      timeAgo: 'Sending...'
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setMessageInput('');

    try {
      await createMessageMutation.mutateAsync(messageData);
    } catch (error) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else {
      handleTyping();
    }
  };

  const filteredUsers = availableUsers.filter(user =>
    user.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.profile.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getConnectionStatus = () => {
    if (isOffline) return { color: 'text-red-500', text: 'Offline', icon: WifiOff };
    if (!wsState.isConnected) return { color: 'text-yellow-500', text: 'Connecting...', icon: AlertCircle };
    return { color: 'text-green-500', text: 'Connected', icon: Wifi };
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className="w-full h-full bg-background flex">
      {/* Users List */}
      {showUserList && (
        <div className="w-80 border-r border-border flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Messages</h2>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={`${connectionStatus.color} border-current`}
                >
                  <connectionStatus.icon className="w-3 h-3 mr-1" />
                  {connectionStatus.text}
                </Badge>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Settings */}
            <div className="flex items-center justify-between mt-3 text-sm">
              <div className="flex items-center gap-2">
                <Switch
                  id="auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
                <Label htmlFor="auto-refresh">Auto-refresh</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="encryption"
                  checked={isEncrypted}
                  onCheckedChange={setIsEncrypted}
                />
                <Label htmlFor="encryption">
                  <Lock className="w-3 h-3" />
                </Label>
              </div>
            </div>
          </div>

          {/* Users List */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredUsers.map((user) => {
                const userMessages = messages.filter(m => 
                  m.fromUserId === user.id || m.toUserId === user.id
                );
                const lastMessage = userMessages[userMessages.length - 1];
                const unreadCount = userMessages.filter(m => 
                  m.fromUserId === user.id && m.status !== 'read'
                ).length;
                const isOnline = lastSeen.get(user.id) === 'Online';
                const isTyping = typingUsers.has(user.id);

                return (
                  <Card
                    key={user.id}
                    className={`mb-2 cursor-pointer transition-all hover:bg-accent/50 ${
                      selectedUser?.id === user.id ? 'bg-accent border-primary' : ''
                    }`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.alias.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          {isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium truncate">{user.alias}</h4>
                            {lastMessage && (
                              <span className="text-xs text-muted-foreground">
                                {lastMessage.timeAgo}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground truncate">
                              {isTyping ? (
                                <span className="text-blue-600 italic">typing...</span>
                              ) : lastMessage ? (
                                `${lastMessage.fromUserId === currentUser.id ? 'You: ' : ''}${lastMessage.content}`
                              ) : (
                                'No messages yet'
                              )}
                            </p>
                            {unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {lastSeen.get(user.id) || 'Last seen recently'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-accent/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {!showUserList && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowUserList(true)}
                      className="md:hidden"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  )}
                  <div 
                    className="flex items-center gap-3 cursor-pointer hover:bg-accent/50 p-2 rounded-lg transition-colors"
                    onClick={() => onUserProfile(selectedUser)}
                  >
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={selectedUser.avatar} />
                        <AvatarFallback>{selectedUser.alias.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    </div>
                    <div>
                      <h3 className="font-medium">{selectedUser.alias}</h3>
                      <p className="text-sm text-muted-foreground">
                        {typingUsers.has(selectedUser.id) ? 'typing...' : lastSeen.get(selectedUser.id) || 'Online'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Info className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1" ref={scrollRef}>
              <div className="p-4 space-y-4">
                {messages
                  .filter(m => 
                    (m.fromUserId === selectedUser.id && m.toUserId === currentUser.id) ||
                    (m.fromUserId === currentUser.id && m.toUserId === selectedUser.id)
                  )
                  .map((message) => {
                    const isFromMe = message.fromUserId === currentUser.id;
                    return (
                      <div key={message.id} className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] ${isFromMe ? 'order-2' : 'order-1'}`}>
                          <div
                            className={`p-3 rounded-2xl ${
                              isFromMe
                                ? 'bg-blue-600 text-white rounded-br-sm'
                                : 'bg-accent text-foreground rounded-bl-sm'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <div className="flex items-center justify-between mt-1 text-xs opacity-70">
                              <span>{message.timeAgo}</span>
                              <div className="flex items-center gap-1">
                                {message.encrypted && <Lock className="w-3 h-3" />}
                                {isFromMe && (
                                  <>
                                    {message.status === 'sending' && <Clock className="w-3 h-3" />}
                                    {message.status === 'sent' && <CheckCircle className="w-3 h-3" />}
                                    {message.status === 'delivered' && <Eye className="w-3 h-3" />}
                                    {message.status === 'read' && <Eye className="w-3 h-3 text-blue-400" />}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {/* Typing Indicator */}
                {typingUsers.has(selectedUser.id) && (
                  <div className="flex justify-start">
                    <div className="bg-accent text-foreground p-3 rounded-2xl rounded-bl-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-100" />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-200" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Textarea
                    ref={messageInputRef}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Message ${selectedUser.alias}...`}
                    className="min-h-[40px] max-h-[120px] resize-none"
                    rows={1}
                    disabled={isOffline}
                  />
                </div>
                <div className="flex items-center gap-2">
                  {isEncrypted && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Shield className="w-3 h-3 mr-1" />
                      Encrypted
                    </Badge>
                  )}
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || createMessageMutation.isPending || isOffline}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {isOffline && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <div className="flex items-center gap-2">
                    <WifiOff className="w-4 h-4" />
                    You're offline. Messages will be sent when connection is restored.
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* No Chat Selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">
                Choose a user from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}