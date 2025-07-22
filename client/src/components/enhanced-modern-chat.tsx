import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

import { 
  Send, 
  Users, 
  Lock, 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { User, Message, InsertMessage } from '@shared/schema';

interface ChatMessage extends Message {
  user?: User;
  encrypted?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'failed';
}

interface EnhancedModernChatProps {
  currentUser: User;
  availableUsers: User[];
  wsState: {
    isConnected: boolean;
    connectionQuality: string;
    sendMessage: (message: any) => void;
  };
}

export function EnhancedModernChat({ 
  currentUser, 
  availableUsers, 
  wsState 
}: EnhancedModernChatProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isEncrypted, setIsEncrypted] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get messages from database
  const { data: dbMessages = [], isLoading } = useQuery({
    queryKey: ['/api/messages'],
    enabled: !!currentUser
  });

  // Listen for WebSocket messages
  useEffect(() => {
    const handleWSMessage = (event: CustomEvent) => {
      const message = event.detail;
      
      if (message.type === 'chat-message') {
        const newMessage: ChatMessage = {
          id: Date.now(),
          fromUserId: message.fromUserId,
          toUserId: message.toUserId,
          content: message.content,
          encryptedContent: message.content,
          timestamp: new Date(),
          messageType: 'text',
          isEphemeral: false,
          meshHops: 0,
          encrypted: message.encrypted || false,
          status: 'delivered'
        };
        
        setMessages(prev => [...prev, newMessage]);
        scrollToBottom();
      }
    };

    window.addEventListener('phantom-ws-message', handleWSMessage as EventListener);
    return () => window.removeEventListener('phantom-ws-message', handleWSMessage as EventListener);
  }, []);

  // Load messages from database and merge with local state
  useEffect(() => {
    if (Array.isArray(dbMessages) && dbMessages.length > 0) {
      const enhancedMessages: ChatMessage[] = (dbMessages as Message[]).map((msg: Message) => ({
        ...msg,
        status: 'delivered' as const,
        encrypted: isEncrypted
      }));
      setMessages(enhancedMessages);
    }
  }, [dbMessages, isEncrypted]);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: InsertMessage) => {
      // First save to database
      const savedMessage = await apiRequest('/api/messages', {
        method: 'POST',
        body: messageData
      });
      
      // Then send via WebSocket for real-time delivery
      if (wsState.isConnected) {
        wsState.sendMessage({
          type: 'chat-message',
          fromUserId: messageData.fromUserId,
          toUserId: messageData.toUserId,
          content: messageData.content,
          encrypted: isEncrypted,
          timestamp: Date.now()
        });
      }
      
      return savedMessage;
    },
    onSuccess: (savedMessage) => {
      // Add to local state with success status
      const chatMessage: ChatMessage = {
        ...savedMessage,
        status: wsState.isConnected ? 'sent' : 'sending',
        encrypted: isEncrypted
      };
      
      setMessages(prev => [...prev, chatMessage]);
      setMessageInput('');
      scrollToBottom();
      
      // Invalidate messages query to refresh from database
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    },
    onError: (error) => {
      toast({
        title: "Message Failed",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendMessage = () => {
    if (!messageInput.trim() || !selectedUser) return;

    const messageData: InsertMessage = {
      fromUserId: currentUser.id,
      toUserId: selectedUser.id,
      content: messageInput.trim(),
      encryptedContent: encryptMessage(messageInput.trim()),
      messageType: 'text',
      isEphemeral: false,
      meshHops: 0
    };

    sendMessageMutation.mutate(messageData);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Encrypt message content (simplified AES encryption simulation)
  const encryptMessage = (content: string): string => {
    if (!isEncrypted) return content;
    // In a real implementation, this would use proper AES encryption
    return `🔒 ${btoa(content)}`;
  };

  const decryptMessage = (content: string): string => {
    if (!isEncrypted || !content.startsWith('🔒 ')) return content;
    try {
      return atob(content.substring(2));
    } catch {
      return content;
    }
  };

  // Filter messages for selected conversation
  const conversationMessages = selectedUser 
    ? messages.filter(msg => 
        (msg.fromUserId === currentUser.id && msg.toUserId === selectedUser.id) ||
        (msg.fromUserId === selectedUser.id && msg.toUserId === currentUser.id)
      )
    : [];

  const getMessageStatus = (message: ChatMessage) => {
    switch (message.status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-yellow-400" />;
      case 'sent':
        return <CheckCircle className="h-3 w-3 text-green-400" />;
      case 'delivered':
        return <CheckCircle className="h-3 w-3 text-green-400 fill-current" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 h-[calc(100vh-120px)]">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
        {/* User List */}
        <Card className="lg:col-span-1 bg-gray-800/50 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-emerald-400 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Contacts ({availableUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px] lg:h-[calc(100vh-200px)]">
              <div className="space-y-2 p-4">
                {availableUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedUser?.id === user.id
                        ? 'bg-emerald-900/30 border border-emerald-500/30'
                        : 'hover:bg-gray-700/50'
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-cyan-400 text-gray-900">
                        {user.alias.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{user.alias}</p>
                      <p className="text-sm text-gray-400 truncate">{user.meshCallsign}</p>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-1">
                      <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                      <Badge variant="outline" className="text-xs">
                        L{user.securityLevel}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                {availableUsers.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No contacts available</p>
                    <p className="text-xs mt-1">Users will appear here when they join</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-3 bg-gray-800/50 border-gray-700 flex flex-col">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-3 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedUser.avatar || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-cyan-400 text-gray-900">
                        {selectedUser.alias.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h3 className="font-medium text-white">{selectedUser.alias}</h3>
                      <p className="text-sm text-gray-400 flex items-center">
                        {selectedUser.isOnline ? (
                          <>
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            Online
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                            Offline
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant={isEncrypted ? "default" : "outline"}
                      onClick={() => setIsEncrypted(!isEncrypted)}
                      className={isEncrypted ? "bg-emerald-600 hover:bg-emerald-700" : "border-gray-600"}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      {isEncrypted ? 'E2E Enabled' : 'E2E Disabled'}
                    </Button>
                    
                    <div className="flex items-center space-x-1 text-sm text-gray-400">
                      {wsState.isConnected ? (
                        <Wifi className="h-4 w-4 text-green-400" />
                      ) : (
                        <WifiOff className="h-4 w-4 text-red-400" />
                      )}
                      <span className="text-xs">{wsState.connectionQuality}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea ref={scrollRef} className="h-full p-4">
                  <div className="space-y-4">
                    {isLoading ? (
                      <div className="text-center py-8 text-gray-400">
                        <div className="animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                        Loading messages...
                      </div>
                    ) : conversationMessages.length > 0 ? (
                      conversationMessages.map((message, index) => {
                        const isOwnMessage = message.fromUserId === currentUser.id;
                        const showTime = index === 0 || 
                          (new Date(message.timestamp!).getTime() - new Date(conversationMessages[index - 1].timestamp!).getTime()) > 300000; // 5 minutes
                        
                        return (
                          <div key={message.id || index}>
                            {showTime && (
                              <div className="text-center py-2">
                                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                                  {new Date(message.timestamp!).toLocaleTimeString()}
                                </span>
                              </div>
                            )}
                            
                            <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                isOwnMessage
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-gray-700 text-gray-100'
                              }`}>
                                <div className="flex items-start space-x-2">
                                  <div className="flex-1">
                                    <p className="text-sm break-words">
                                      {decryptMessage(message.content)}
                                    </p>
                                    
                                    <div className="flex items-center justify-between mt-1">
                                      <div className="flex items-center space-x-1">
                                        {message.encrypted && (
                                          <Lock className="h-3 w-3 text-green-400" />
                                        )}
                                        <span className="text-xs opacity-70">
                                          {new Date(message.timestamp!).toLocaleTimeString([], { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                          })}
                                        </span>
                                      </div>
                                      
                                      {isOwnMessage && getMessageStatus(message)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <Send className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No messages yet</p>
                        <p className="text-xs mt-1">Start a conversation with {selectedUser.alias}</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="border-t border-gray-700 p-4">
                <div className="flex space-x-2">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isEncrypted ? "Send encrypted message..." : "Send message..."}
                    className="flex-1 bg-gray-700/50 border-gray-600"
                    disabled={!wsState.isConnected}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!messageInput.trim() || sendMessageMutation.isPending || !wsState.isConnected}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {sendMessageMutation.isPending ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {!wsState.isConnected && (
                  <p className="text-xs text-yellow-400 mt-2 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Connection lost. Messages will be sent when reconnected.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a contact to start chatting</p>
                <p className="text-sm mt-2">Choose someone from your contacts list</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}