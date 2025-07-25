import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { User, Message, InsertMessage } from '@shared/schema';
import { FuturisticCard, GlowButton, NeonText, AnimatedBackground } from './modern-futuristic-theme';

import {
  Send,
  Search,
  Paperclip,
  Image,
  Smile,
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  Shield,
  CheckCircle,
  Circle,
  MessageSquare,
  Users
} from 'lucide-react';

interface ExtendedMessage extends Message {
  fromUser?: User;
  toUser?: User;
  isRead?: boolean;
  deliveryStatus?: 'sending' | 'sent' | 'delivered' | 'failed';
}

interface EnhancedMessagingSystemV2Props {
  currentUser: User | null;
  availableUsers: User[];
  selectedUser: User | null;
  onUserSelect: (user: User | null) => void;
  isOffline: boolean;
  wsState: {
    isConnected: boolean;
    sendMessage: (message: any) => void;
  };
}

export function EnhancedMessagingSystemV2({ 
  currentUser, 
  availableUsers, 
  selectedUser, 
  onUserSelect, 
  isOffline,
  wsState 
}: EnhancedMessagingSystemV2Props) {
  const [messageContent, setMessageContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [offlineMessages, setOfflineMessages] = useState<ExtendedMessage[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch messages for selected conversation with enhanced error handling
  const { data: messages = [], refetch: refetchMessages, isLoading } = useQuery<ExtendedMessage[]>({
    queryKey: ['/api/messages', selectedUser?.id],
    enabled: !!currentUser && !!selectedUser && !isOffline,
    refetchInterval: 2000, // Real-time updates
    staleTime: 500,
    retry: 3,
    retryDelay: 1000,
    select: (data) => data.map(message => ({
      ...message,
      timestamp: new Date(message.timestamp),
      fromUser: availableUsers.find(u => u.id === message.fromUserId),
      toUser: availableUsers.find(u => u.id === message.toUserId)
    }))
  });

  // Load offline messages from localStorage
  useEffect(() => {
    const savedOfflineMessages = localStorage.getItem('meshbook-offline-messages');
    if (savedOfflineMessages) {
      try {
        const parsed = JSON.parse(savedOfflineMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setOfflineMessages(parsed);
      } catch (error) {
        console.error('Failed to load offline messages:', error);
      }
    }
  }, []);

  // Combine online and offline messages
  const allMessages = isOffline ? offlineMessages.filter(msg => 
    (msg.fromUserId === currentUser?.id && msg.toUserId === selectedUser?.id) ||
    (msg.fromUserId === selectedUser?.id && msg.toUserId === currentUser?.id)
  ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) : messages;

  // Send message mutation with comprehensive error handling
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: InsertMessage) => {
      const formData = new FormData();
      formData.append('fromUserId', String(messageData.fromUserId));
      formData.append('toUserId', String(messageData.toUserId));
      formData.append('content', messageData.content);
      formData.append('encryptedContent', messageData.encryptedContent);
      formData.append('messageType', messageData.messageType || 'text');
      formData.append('isEphemeral', String(messageData.isEphemeral || true));

      if (selectedFile) {
        formData.append('attachment', selectedFile);
      }

      console.log('Sending message:', {
        from: messageData.fromUserId,
        to: messageData.toUserId,
        content: messageData.content.substring(0, 50) + '...'
      });

      const response = await fetch('/api/messages', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}: Failed to send message`);
      }

      return response.json();
    },
    onSuccess: (sentMessage) => {
      setMessageContent('');
      setSelectedFile(null);
      
      // Send real-time notification
      if (wsState.isConnected && selectedUser) {
        wsState.sendMessage({
          type: 'new-message',
          message: sentMessage,
          toUserId: selectedUser?.id
        });
      }
      
      // Immediate cache update
      queryClient.setQueryData(['/api/messages', selectedUser?.id], (oldData: ExtendedMessage[] | undefined) => {
        const messageWithUsers = {
          ...sentMessage,
          timestamp: new Date(sentMessage.timestamp),
          fromUser: currentUser,
          toUser: selectedUser
        };
        if (!oldData) return [messageWithUsers];
        return [...oldData, messageWithUsers];
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      
      toast({
        title: "Message Sent",
        description: "Your message has been delivered successfully.",
      });
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      
      // Store in offline queue if offline
      if (isOffline && currentUser && selectedUser) {
        const offlineMessage: ExtendedMessage = {
          id: Date.now(), // Temporary ID
          fromUserId: currentUser.id,
          toUserId: selectedUser.id,
          content: messageContent,
          encryptedContent: btoa(messageContent), // Simple encoding for demo
          messageType: 'text',
          timestamp: new Date(),
          isEphemeral: true,
          meshHops: 0,
          fromUser: currentUser,
          toUser: selectedUser,
          deliveryStatus: 'sending'
        };
        
        const newOfflineMessages = [...offlineMessages, offlineMessage];
        setOfflineMessages(newOfflineMessages);
        localStorage.setItem('meshbook-offline-messages', JSON.stringify(newOfflineMessages));
        
        toast({
          title: "Message Queued",
          description: "Message saved for offline delivery.",
        });
        
        setMessageContent('');
      } else {
        toast({
          title: "Message Failed",
          description: error.message || "Failed to send message. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  // Handle typing indicators
  const handleTyping = () => {
    if (!isTyping && wsState.isConnected && selectedUser) {
      setIsTyping(true);
      wsState.sendMessage({
        type: 'user-typing',
        toUserId: selectedUser.id,
        fromUserId: currentUser?.id
      });
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping && wsState.isConnected && selectedUser) {
        setIsTyping(false);
        wsState.sendMessage({
          type: 'user-stopped-typing',
          toUserId: selectedUser.id,
          fromUserId: currentUser?.id
        });
      }
    }, 2000);
  };

  const handleSendMessage = () => {
    if (!currentUser || !selectedUser) {
      toast({
        title: "No Conversation Selected",
        description: "Please select a user to send messages to.",
        variant: "destructive",
      });
      return;
    }
    
    if (!messageContent.trim() && !selectedFile) {
      toast({
        title: "Empty Message",
        description: "Please enter a message or select a file.",
        variant: "destructive",
      });
      return;
    }

    const messageData: InsertMessage = {
      fromUserId: currentUser.id,
      toUserId: selectedUser.id,
      content: messageContent.trim(),
      encryptedContent: btoa(messageContent.trim()), // Simple encoding
      messageType: selectedFile ? 'file' : 'text',
      isEphemeral: true
    };

    sendMessageMutation.mutate(messageData);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    handleTyping();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    toast({
      title: "File Selected",
      description: `${file.name} ready to send`,
    });
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages]);

  // Filter users for search
  const filteredUsers = availableUsers.filter(user =>
    user.alias.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format time helper
  const formatMessageTime = (timestamp: Date | string | number) => {
    const now = new Date();
    const time = new Date(timestamp);
    
    // Check if valid date
    if (isNaN(time.getTime())) {
      return 'Unknown time';
    }
    
    const diff = now.getTime() - time.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return time.toLocaleDateString();
  };

  // Get last message for each conversation
  const getLastMessage = (userId: number) => {
    if (isOffline) {
      const userMessages = offlineMessages.filter(msg =>
        (msg.fromUserId === currentUser?.id && msg.toUserId === userId) ||
        (msg.fromUserId === userId && msg.toUserId === currentUser?.id)
      );
      return userMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    }
    
    // Would need to implement API endpoint for last messages
    return null;
  };

  // No conversation selected - show chat list
  if (!selectedUser) {
    return (
      <div className="h-full flex">
        <AnimatedBackground>
          <div></div>
        </AnimatedBackground>
        
        {/* Chat List */}
        <div className="w-full max-w-md mx-auto">
          <FuturisticCard className="h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <NeonText className="text-xl font-bold flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Messages
                  </NeonText>
                  <p className="text-sm text-muted-foreground mt-1">
                    {availableUsers.length} users online
                  </p>
                </div>
                <Badge variant={wsState.isConnected ? "default" : "destructive"}>
                  {wsState.isConnected ? 'Online' : 'Offline'}
                </Badge>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {filteredUsers.length > 0 ? (
                  <div className="space-y-1 p-4">
                    {filteredUsers.map((user) => {
                      const lastMessage = getLastMessage(user.id);
                      
                      return (
                        <div
                          key={user.id}
                          onClick={() => onUserSelect(user)}
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-all duration-200 border border-transparent hover:border-cyan-400/30"
                        >
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>
                                {user.alias.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {user.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium truncate">{user.alias}</p>
                              {lastMessage && (
                                <span className="text-xs text-muted-foreground">
                                  {formatMessageTime(lastMessage.timestamp)}
                                </span>
                              )}
                            </div>
                            
                            {lastMessage ? (
                              <p className="text-sm text-muted-foreground truncate">
                                {lastMessage.fromUserId === currentUser?.id ? 'You: ' : ''}
                                {lastMessage.content}
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No messages yet
                              </p>
                            )}
                          </div>
                          
                          {typingUsers.has(user.id) && (
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery ? 'Try adjusting your search' : 'No users are currently online'}
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </FuturisticCard>
        </div>
      </div>
    );
  }

  // Conversation view
  return (
    <div className="h-full flex flex-col">
      <AnimatedBackground>
        <div></div>
      </AnimatedBackground>
      
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onUserSelect(null)}
            className="lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={selectedUser.avatar} />
              <AvatarFallback>
                {selectedUser.alias.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {selectedUser.isOnline && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
            )}
          </div>
          
          <div>
            <h3 className="font-semibold">{selectedUser.alias}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              {selectedUser.isOnline ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Online
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  Last seen {formatMessageTime(selectedUser.lastSeen)}
                </>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant={wsState.isConnected ? "default" : "destructive"} className="text-xs">
            {wsState.isConnected ? 'Connected' : 'Offline'}
          </Badge>
          
          <Button variant="ghost" size="icon">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : allMessages.length > 0 ? (
          <div className="space-y-4">
            {allMessages.map((message, index) => {
              const isOwnMessage = message.fromUserId === currentUser?.id;
              const prevMessage = allMessages[index - 1];
              const showAvatar = !prevMessage || prevMessage.fromUserId !== message.fromUserId;
              
              return (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  {showAvatar && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={isOwnMessage ? currentUser?.avatar : selectedUser.avatar} />
                      <AvatarFallback>
                        {(isOwnMessage ? currentUser?.alias : selectedUser.alias)?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  {!showAvatar && <div className="w-8"></div>}
                  
                  <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isOwnMessage
                          ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-1 text-xs text-muted-foreground">
                      <span>{formatMessageTime(message.timestamp)}</span>
                      
                      {isOwnMessage && (
                        <div className="flex items-center">
                          {message.deliveryStatus === 'sending' && (
                            <Circle className="h-3 w-3" />
                          )}
                          {message.deliveryStatus === 'sent' && (
                            <CheckCircle className="h-3 w-3" />
                          )}
                          {message.deliveryStatus === 'delivered' && (
                            <div className="flex -space-x-1">
                              <CheckCircle className="h-3 w-3" />
                              <CheckCircle className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                      )}
                      
                      {message.isEphemeral && (
                        <Shield className="h-3 w-3" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Start a Conversation</h3>
            <p className="text-muted-foreground">
              Send your first message to {selectedUser.alias}
            </p>
          </div>
        )}
        
        {/* Typing indicator */}
        {typingUsers.has(selectedUser.id) && (
          <div className="flex items-center space-x-3 mt-4">
            <Avatar className="h-6 w-6">
              <AvatarImage src={selectedUser.avatar} />
              <AvatarFallback className="text-xs">
                {selectedUser.alias.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex space-x-1 bg-muted rounded-full px-3 py-2">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </ScrollArea>
      
      {/* Message Input */}
      <div className="p-4 border-t bg-background/80 backdrop-blur-sm">
        {selectedFile && (
          <div className="mb-3 p-2 bg-muted rounded-lg flex items-center justify-between">
            <span className="text-sm">{selectedFile.name}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedFile(null)}
            >
              ×
            </Button>
          </div>
        )}
        
        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <Textarea
              placeholder={`Message ${selectedUser.alias}...`}
              value={messageContent}
              onChange={(e) => {
                setMessageContent(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              rows={1}
              className="resize-none min-h-[40px] max-h-32 pr-20"
            />
            
            <div className="absolute right-2 bottom-2 flex items-center space-x-1">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <Image className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <GlowButton
            onClick={handleSendMessage}
            disabled={sendMessageMutation.isPending || (!messageContent.trim() && !selectedFile)}
            className="h-10 w-10"
          >
            {sendMessageMutation.isPending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </GlowButton>
        </div>
        
        {!wsState.isConnected && (
          <div className="mt-2 text-xs text-muted-foreground flex items-center space-x-2">
            <Shield className="h-3 w-3" />
            <span>Messages will be queued for offline delivery</span>
          </div>
        )}
      </div>
    </div>
  );
}