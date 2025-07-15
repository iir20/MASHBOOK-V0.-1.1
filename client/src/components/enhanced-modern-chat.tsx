import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical, 
  Phone, 
  Video, 
  Shield, 
  MessageSquare,
  Heart,
  ThumbsUp,
  Laugh,
  Angry,
  Sad,
  Plus,
  Search,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Image,
  File,
  Mic,
  MicOff,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Zap,
  Wifi,
  WifiOff,
  Clock,
  Check,
  CheckCheck,
  AlertCircle,
  Info,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStableWebSocket } from '@/hooks/use-stable-websocket';
import { cn } from '@/lib/utils';
import type { User, Message } from '@shared/schema';

interface EnhancedMessage extends Message {
  reactions?: { [emoji: string]: string[] };
  isTyping?: boolean;
  deliveryStatus?: 'sending' | 'sent' | 'delivered' | 'read';
  replyTo?: string;
  attachments?: Array<{
    type: 'image' | 'file' | 'audio' | 'video';
    url: string;
    name: string;
    size: number;
  }>;
  edited?: boolean;
  editedAt?: Date;
}

interface ChatUser {
  id: number;
  username: string;
  isOnline: boolean;
  lastSeen?: Date;
  profileImage?: string;
  isTyping?: boolean;
  unreadCount?: number;
  encryptionEnabled?: boolean;
  connectionQuality?: 'excellent' | 'good' | 'poor';
}

interface EnhancedModernChatProps {
  currentUser: User;
  selectedUserId?: number;
  onUserSelect?: (userId: number) => void;
  className?: string;
}

export function EnhancedModernChat({ 
  currentUser, 
  selectedUserId, 
  onUserSelect,
  className 
}: EnhancedModernChatProps) {
  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showChatUsers, setShowChatUsers] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Sample chat users
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([
    {
      id: 1,
      username: 'CyberNode_Alpha',
      isOnline: true,
      profileImage: undefined,
      isTyping: false,
      unreadCount: 2,
      encryptionEnabled: true,
      connectionQuality: 'excellent'
    },
    {
      id: 2,
      username: 'SecureNode_Beta',
      isOnline: true,
      profileImage: undefined,
      isTyping: false,
      unreadCount: 0,
      encryptionEnabled: true,
      connectionQuality: 'good'
    },
    {
      id: 3,
      username: 'DataNode_Gamma',
      isOnline: false,
      lastSeen: new Date(Date.now() - 600000),
      profileImage: undefined,
      isTyping: false,
      unreadCount: 5,
      encryptionEnabled: false,
      connectionQuality: 'poor'
    }
  ]);

  // WebSocket connection
  const { isConnected, sendMessage } = useStableWebSocket({
    url: `ws://localhost:5000/ws`,
    onMessage: (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    }
  });

  // Initialize sample messages
  useEffect(() => {
    const sampleMessages: EnhancedMessage[] = [
      {
        id: 1,
        content: 'Welcome to the decentralized mesh network! 🚀',
        fromUserId: 1,
        timestamp: new Date(Date.now() - 1800000),
        messageType: 'text',
        deliveryStatus: 'read',
        reactions: { '👍': ['CyberNode_Alpha'], '🚀': ['SecureNode_Beta'] },
        attachments: []
      },
      {
        id: 2,
        content: 'Encryption protocols are active and secure.',
        fromUserId: 2,
        timestamp: new Date(Date.now() - 1200000),
        messageType: 'text',
        deliveryStatus: 'read',
        attachments: []
      },
      {
        id: 3,
        content: 'File transfer initiated - mesh_protocol.pdf (2.5MB)',
        fromUserId: 3,
        timestamp: new Date(Date.now() - 900000),
        messageType: 'system',
        deliveryStatus: 'delivered',
        attachments: [
          {
            type: 'file',
            url: '#',
            name: 'mesh_protocol.pdf',
            size: 2500000
          }
        ]
      },
      {
        id: 4,
        content: 'Network topology updated successfully ✅',
        fromUserId: 1,
        timestamp: new Date(Date.now() - 600000),
        messageType: 'text',
        deliveryStatus: 'read',
        reactions: { '✅': ['DataNode_Gamma'] },
        attachments: []
      }
    ];

    setMessages(sampleMessages);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicator
  useEffect(() => {
    if (isTyping) {
      const timeout = setTimeout(() => {
        setIsTyping(false);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [isTyping]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'message':
        const newMsg: EnhancedMessage = {
          id: Date.now(),
          content: data.content,
          fromUserId: data.fromUserId,
          timestamp: new Date(data.timestamp),
          messageType: data.messageType || 'text',
          deliveryStatus: 'delivered',
          reactions: {},
          attachments: data.attachments || []
        };
        setMessages(prev => [...prev, newMsg]);
        
        if (soundEnabled && notificationsEnabled) {
          // Play notification sound
          const audio = new Audio('/notification.mp3');
          audio.play().catch(() => {});
        }
        break;
        
      case 'typing':
        setTypingUsers(prev => 
          data.isTyping 
            ? [...prev.filter(u => u !== data.username), data.username]
            : prev.filter(u => u !== data.username)
        );
        break;
        
      case 'reaction':
        setMessages(prev => prev.map(msg => 
          msg.id === data.messageId 
            ? {
                ...msg,
                reactions: {
                  ...msg.reactions,
                  [data.emoji]: data.users
                }
              }
            : msg
        ));
        break;
    }
  }, [soundEnabled, notificationsEnabled]);

  // Send message
  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim()) return;

    const messageData = {
      type: 'message',
      content: newMessage,
      fromUserId: currentUser.id,
      timestamp: new Date(),
      messageType: 'text',
      encrypted: encryptionEnabled,
      replyTo: replyingTo
    };

    if (isConnected) {
      sendMessage(JSON.stringify(messageData));
    }

    // Add to local messages immediately
    const localMessage: EnhancedMessage = {
      id: Date.now(),
      content: newMessage,
      fromUserId: currentUser.id,
      timestamp: new Date(),
      messageType: 'text',
      deliveryStatus: 'sending',
      reactions: {},
      attachments: [],
      replyTo: replyingTo || undefined
    };

    setMessages(prev => [...prev, localMessage]);
    setNewMessage('');
    setReplyingTo(null);
    setIsTyping(false);
    
    // Update delivery status after a delay
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === localMessage.id 
          ? { ...msg, deliveryStatus: 'sent' }
          : msg
      ));
    }, 1000);
  }, [newMessage, currentUser, isConnected, sendMessage, encryptionEnabled, replyingTo]);

  // Handle typing
  const handleTyping = useCallback((value: string) => {
    setNewMessage(value);
    
    if (!isTyping) {
      setIsTyping(true);
      if (isConnected) {
        sendMessage(JSON.stringify({
          type: 'typing',
          username: currentUser.username,
          isTyping: true
        }));
      }
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (isConnected) {
        sendMessage(JSON.stringify({
          type: 'typing',
          username: currentUser.username,
          isTyping: false
        }));
      }
    }, 1000);
  }, [isTyping, isConnected, sendMessage, currentUser.username]);

  // Handle reactions
  const handleReaction = useCallback((messageId: number, emoji: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const currentReactions = message.reactions || {};
    const userReactions = currentReactions[emoji] || [];
    const hasReacted = userReactions.includes(currentUser.username);

    const updatedReactions = hasReacted
      ? userReactions.filter(u => u !== currentUser.username)
      : [...userReactions, currentUser.username];

    if (isConnected) {
      sendMessage(JSON.stringify({
        type: 'reaction',
        messageId,
        emoji,
        users: updatedReactions
      }));
    }

    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? {
            ...msg,
            reactions: {
              ...msg.reactions,
              [emoji]: updatedReactions
            }
          }
        : msg
    ));
  }, [messages, currentUser.username, isConnected, sendMessage]);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const attachment = {
        type: file.type.startsWith('image/') ? 'image' as const : 'file' as const,
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size
      };

      const fileMessage: EnhancedMessage = {
        id: Date.now() + Math.random(),
        content: `Shared ${file.name}`,
        fromUserId: currentUser.id,
        timestamp: new Date(),
        messageType: 'text',
        deliveryStatus: 'sending',
        reactions: {},
        attachments: [attachment]
      };

      setMessages(prev => [...prev, fileMessage]);
    });

    // Reset file input
    event.target.value = '';
  }, [currentUser.id]);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  // Get delivery status icon
  const getDeliveryStatusIcon = (status: string) => {
    switch (status) {
      case 'sending': return Clock;
      case 'sent': return Check;
      case 'delivered': return CheckCheck;
      case 'read': return CheckCheck;
      default: return Clock;
    }
  };

  // Get connection quality color
  const getConnectionQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-[var(--cyber-green)]';
      case 'good': return 'text-[var(--cyber-yellow)]';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  // Filter messages based on search
  const filteredMessages = messages.filter(msg => 
    msg.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get selected user
  const selectedUser = chatUsers.find(u => u.id === selectedUserId);

  return (
    <div className={cn("flex h-full", className)}>
      {/* Users List */}
      <div className={cn(
        "w-80 border-r border-[var(--cyber-cyan)]/30 flex flex-col",
        !showChatUsers && "hidden"
      )}>
        <div className="p-4 border-b border-[var(--cyber-cyan)]/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--cyber-cyan)]">Mesh Chat</h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className="h-8 w-8 p-0"
              >
                {notificationsEnabled ? 
                  <Bell className="w-4 h-4 text-[var(--cyber-green)]" /> : 
                  <BellOff className="w-4 h-4 text-gray-400" />
                }
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="h-8 w-8 p-0"
              >
                {soundEnabled ? 
                  <Volume2 className="w-4 h-4 text-[var(--cyber-green)]" /> : 
                  <VolumeX className="w-4 h-4 text-gray-400" />
                }
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {chatUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => onUserSelect?.(user.id)}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors",
                  selectedUserId === user.id ? "bg-[var(--cyber-cyan)]/20" : "hover:bg-[var(--cyber-cyan)]/10"
                )}
              >
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.profileImage} />
                    <AvatarFallback className="bg-gradient-to-br from-[var(--cyber-cyan)] to-[var(--cyber-magenta)]">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[var(--cyber-dark)]",
                    user.isOnline ? "bg-[var(--cyber-green)]" : "bg-gray-500"
                  )} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-white truncate">{user.username}</p>
                    <div className="flex items-center space-x-1">
                      {user.encryptionEnabled && (
                        <Shield className="w-3 h-3 text-[var(--cyber-green)]" />
                      )}
                      <Wifi className={cn("w-3 h-3", getConnectionQualityColor(user.connectionQuality || 'good'))} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">
                      {user.isTyping ? 'Typing...' : 
                       user.isOnline ? 'Online' : 
                       user.lastSeen ? `Last seen ${user.lastSeen.toLocaleTimeString()}` : 'Offline'}
                    </p>
                    {user.unreadCount && user.unreadCount > 0 && (
                      <Badge variant="default" className="bg-[var(--cyber-cyan)] text-xs">
                        {user.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-[var(--cyber-cyan)]/30 bg-[var(--cyber-dark)]/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedUser.profileImage} />
                    <AvatarFallback className="bg-gradient-to-br from-[var(--cyber-cyan)] to-[var(--cyber-magenta)]">
                      {selectedUser.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-white">{selectedUser.username}</p>
                    <p className="text-sm text-gray-400 flex items-center space-x-2">
                      <span>
                        {selectedUser.isTyping ? 'Typing...' : 
                         selectedUser.isOnline ? 'Online' : 'Offline'}
                      </span>
                      {selectedUser.encryptionEnabled && (
                        <Shield className="w-3 h-3 text-[var(--cyber-green)]" />
                      )}
                      <Wifi className={cn("w-3 h-3", getConnectionQualityColor(selectedUser.connectionQuality || 'good'))} />
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEncryptionEnabled(!encryptionEnabled)}
                    className="h-8 w-8 p-0"
                  >
                    {encryptionEnabled ? 
                      <Lock className="w-4 h-4 text-[var(--cyber-green)]" /> : 
                      <Unlock className="w-4 h-4 text-gray-400" />
                    }
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowChatUsers(!showChatUsers)}
                    className="h-8 w-8 p-0"
                  >
                    {showChatUsers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {filteredMessages.map((message) => {
                  const isOwn = message.fromUserId === currentUser.id;
                  const user = chatUsers.find(u => u.id === message.fromUserId);
                  const DeliveryIcon = getDeliveryStatusIcon(message.deliveryStatus || 'sent');
                  
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex items-end space-x-2",
                        isOwn ? "justify-end" : "justify-start"
                      )}
                    >
                      {!isOwn && (
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user?.profileImage} />
                          <AvatarFallback className="bg-gradient-to-br from-[var(--cyber-cyan)] to-[var(--cyber-magenta)] text-xs">
                            {user?.username.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={cn(
                        "max-w-xs lg:max-w-md",
                        isOwn ? "order-1" : "order-2"
                      )}>
                        <div className={cn(
                          "px-4 py-2 rounded-lg",
                          isOwn 
                            ? "bg-[var(--cyber-cyan)] text-white" 
                            : "bg-[var(--cyber-dark)] text-white",
                          message.messageType === 'system' && "bg-[var(--cyber-yellow)]/20 text-[var(--cyber-yellow)]"
                        )}>
                          {message.replyTo && (
                            <div className="text-xs opacity-70 mb-1 border-l-2 border-white/30 pl-2">
                              Replying to message
                            </div>
                          )}
                          
                          <p className="text-sm">{message.content}</p>
                          
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {message.attachments.map((attachment, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  {attachment.type === 'image' ? (
                                    <Image className="w-4 h-4" />
                                  ) : (
                                    <File className="w-4 h-4" />
                                  )}
                                  <span className="text-xs">{attachment.name}</span>
                                  <span className="text-xs opacity-70">
                                    ({formatFileSize(attachment.size)})
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs opacity-70">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                            {isOwn && (
                              <DeliveryIcon className={cn(
                                "w-3 h-3",
                                message.deliveryStatus === 'read' ? "text-[var(--cyber-green)]" : "text-gray-400"
                              )} />
                            )}
                          </div>
                        </div>
                        
                        {/* Reactions */}
                        {message.reactions && Object.keys(message.reactions).length > 0 && (
                          <div className="flex items-center space-x-1 mt-1">
                            {Object.entries(message.reactions).map(([emoji, users]) => (
                              users.length > 0 && (
                                <Button
                                  key={emoji}
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleReaction(message.id, emoji)}
                                  className="h-6 px-2 text-xs"
                                >
                                  {emoji} {users.length}
                                </Button>
                              )
                            ))}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedReaction(message.id.toString())}
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* Typing indicator */}
                {typingUsers.length > 0 && (
                  <div className="flex items-center space-x-2 text-gray-400">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span className="text-sm">
                      {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                    </span>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-[var(--cyber-cyan)]/30">
              {replyingTo && (
                <div className="flex items-center justify-between mb-2 p-2 bg-[var(--cyber-cyan)]/10 rounded">
                  <span className="text-sm text-gray-400">Replying to message</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(null)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-9 w-9 p-0"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                    className="pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <Smile className="w-4 h-4" />
                  </Button>
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="h-9 w-9 p-0 bg-[var(--cyber-cyan)] hover:bg-[var(--cyber-cyan)]/80"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                <div className="flex items-center space-x-2">
                  <span>Status:</span>
                  <span className={cn(
                    "flex items-center space-x-1",
                    isConnected ? "text-[var(--cyber-green)]" : "text-red-500"
                  )}>
                    {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {encryptionEnabled && (
                    <span className="flex items-center space-x-1 text-[var(--cyber-green)]">
                      <Shield className="w-3 h-3" />
                      <span>Encrypted</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Select a conversation</p>
              <p className="text-sm mt-2">Choose a user from the list to start chatting</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}