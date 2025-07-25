import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { User, InsertMessage } from '@shared/schema';
import { FuturisticCard, GlowButton, NeonText } from './modern-futuristic-theme';

import {
  MessageSquare,
  Send,
  Paperclip,
  Image,
  Smile,
  Search,
  MoreVertical,
  Phone,
  Video,
  Lock,
  Shield,
  Check,
  CheckCheck,
  Clock,
  ArrowLeft,
  X,
  FileText,
  Eye
} from 'lucide-react';

interface Message {
  id: number;
  fromUserId: number;
  toUserId: number;
  content: string;
  encryptedContent: string;
  messageType: string;
  timestamp: Date;
  isEphemeral: boolean;
  meshHops: number;
  fromUser?: User;
  toUser?: User;
  isRead?: boolean;
  deliveryStatus?: 'sending' | 'sent' | 'delivered' | 'failed';
}

interface EnhancedMessagingSystemProps {
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

export function EnhancedMessagingSystem({ 
  currentUser, 
  availableUsers, 
  selectedUser, 
  onUserSelect, 
  isOffline,
  wsState 
}: EnhancedMessagingSystemProps) {
  const [messageContent, setMessageContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [offlineMessages, setOfflineMessages] = useState<Message[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch messages for selected conversation
  const { data: messages = [], refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: ['/api/messages', selectedUser?.id],
    enabled: !!currentUser && !!selectedUser && !isOffline,
    refetchInterval: 1000, // Real-time updates every second
    staleTime: 500,
    select: (data) => data.map(message => ({
      ...message,
      timestamp: new Date(message.timestamp)
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
  ) : messages;

  // Send message mutation
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

      const response = await fetch('/api/messages', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send message');
      }

      return response.json();
    },
    onSuccess: (sentMessage) => {
      setMessageContent('');
      setSelectedFile(null);
      
      // Send via WebSocket for real-time delivery
      if (wsState.isConnected) {
        wsState.sendMessage({
          type: 'new-message',
          message: sentMessage,
          toUserId: selectedUser?.id
        });
      }
      
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
        const offlineMessage: Message = {
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
    if (!currentUser || !selectedUser) return;
    
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
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages]);

  // Filter users for search
  const filteredUsers = availableUsers.filter(user =>
    user.alias.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  if (!selectedUser) {
    return (
      <div className="h-full flex">
        {/* Chat List */}
        <div className="w-80 border-r bg-background/50 backdrop-blur-sm">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <NeonText className="text-lg font-bold">Messages</NeonText>
              <Badge variant={wsState.isConnected ? "default" : "destructive"}>
                {wsState.isConnected ? 'Online' : 'Offline'}
              </Badge>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <ScrollArea className="h-[calc(100%-120px)]">
            <div className="p-2 space-y-1">
              {filteredUsers.map((user) => {
                const lastMessage = getLastMessage(user.id);
                const unreadCount = 0; // Would implement unread counting
                
                return (
                  <div
                    key={user.id}
                    onClick={() => onUserSelect(user)}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.alias.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {user.isOnline && (
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-background rounded-full" />
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
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">
                          {lastMessage ? lastMessage.content : 'No messages yet'}
                        </p>
                        {unreadCount > 0 && (
                          <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 text-xs">
                            {unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a Conversation</h3>
            <p className="text-muted-foreground">
              Choose a user from the sidebar to start messaging
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onUserSelect(null)}
            className="md:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <Avatar className="h-10 w-10">
            <AvatarImage src={selectedUser.avatar} />
            <AvatarFallback>{selectedUser.alias.charAt(0)}</AvatarFallback>
          </Avatar>
          
          <div>
            <p className="font-medium">{selectedUser.alias}</p>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              {typingUsers.has(selectedUser.id) ? (
                <span className="flex items-center">
                  <div className="flex space-x-1 mr-2">
                    <div className="w-1 h-1 bg-current rounded-full animate-bounce" />
                    <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                  typing...
                </span>
              ) : selectedUser.isOnline ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                  <span>Last seen {formatMessageTime(selectedUser.lastSeen)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
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

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {allMessages.map((message, index) => {
            const isFromCurrentUser = message.fromUserId === currentUser?.id;
            const showAvatar = index === 0 || allMessages[index - 1].fromUserId !== message.fromUserId;
            
            return (
              <div
                key={message.id}
                className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'} space-x-3`}
              >
                {!isFromCurrentUser && (
                  <Avatar className={`h-8 w-8 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                    <AvatarImage src={selectedUser.avatar} />
                    <AvatarFallback className="text-xs">{selectedUser.alias.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`max-w-[70%] ${isFromCurrentUser ? 'items-end' : 'items-start'} space-y-1`}>
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      isFromCurrentUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.messageType === 'file' ? (
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">File attachment</span>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    )}
                  </div>
                  
                  <div className={`flex items-center space-x-2 text-xs text-muted-foreground ${
                    isFromCurrentUser ? 'justify-end' : 'justify-start'
                  }`}>
                    <span>{formatMessageTime(message.timestamp)}</span>
                    
                    {isFromCurrentUser && (
                      <div className="flex items-center">
                        {message.deliveryStatus === 'sending' && <Clock className="h-3 w-3" />}
                        {message.deliveryStatus === 'sent' && <Check className="h-3 w-3" />}
                        {message.deliveryStatus === 'delivered' && <CheckCheck className="h-3 w-3" />}
                        {message.deliveryStatus === 'failed' && <X className="h-3 w-3 text-destructive" />}
                      </div>
                    )}
                    
                    {message.isEphemeral && <Eye className="h-3 w-3" />}
                    {message.encryptedContent && <Lock className="h-3 w-3" />}
                    {message.meshHops > 0 && (
                      <Badge variant="outline" className="h-4 text-xs px-1">
                        {message.meshHops} hops
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t bg-background/50 backdrop-blur-sm">
        {selectedFile && (
          <div className="mb-3 p-2 bg-muted rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Paperclip className="h-4 w-4" />
              <span className="text-sm">{selectedFile.name}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedFile(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <Textarea
              placeholder="Type a message..."
              value={messageContent}
              onChange={(e) => {
                setMessageContent(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              rows={1}
              className="resize-none min-h-[40px] max-h-32"
            />
          </div>
          
          <div className="flex items-center space-x-1">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
            >
              <Image className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
            >
              <Smile className="h-4 w-4" />
            </Button>
            
            <GlowButton
              onClick={handleSendMessage}
              disabled={sendMessageMutation.isPending || (!messageContent.trim() && !selectedFile)}
              className="h-10 w-10"
            >
              <Send className="h-4 w-4" />
            </GlowButton>
          </div>
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