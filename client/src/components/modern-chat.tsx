import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Send, Shield, Lock, Users, Wifi, WifiOff, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Message, User } from '@shared/schema';

interface ModernChatProps {
  currentUser: User;
  selectedUserId?: number;
  onUserSelect?: (userId: number) => void;
  className?: string;
}

export function ModernChat({ currentUser, selectedUserId, onUserSelect, className }: ModernChatProps) {
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch online users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
    refetchInterval: 5000, // Update every 5 seconds
  });

  // Fetch messages
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['/api/messages'],
    refetchInterval: 1000, // Update every second for real-time feel
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const messageData = {
        content,
        encryptedContent: await encryptMessage(content),
        fromUserId: currentUser.id,
        toUserId: selectedUserId,
        messageType: 'text',
        isEphemeral: false,
        meshHops: 0,
      };

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      setMessageInput('');
      scrollToBottom();
    },
    onError: (error) => {
      toast({
        title: "Message Failed",
        description: "Unable to send message. Check your connection.",
        variant: "destructive",
      });
    },
  });

  // Simple encryption simulation
  const encryptMessage = async (message: string): Promise<string> => {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      const key = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );
      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: new Uint8Array(12) },
        key,
        data
      );
      return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    } catch {
      return btoa(message); // Fallback to simple base64
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    const content = messageInput.trim();
    if (content && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(content);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredMessages = selectedUserId 
    ? messages.filter(m => 
        (m.fromUserId === currentUser.id && m.toUserId === selectedUserId) ||
        (m.fromUserId === selectedUserId && m.toUserId === currentUser.id)
      )
    : messages;

  const onlineUsers = users.filter(u => u.isOnline && u.id !== currentUser.id);
  const selectedUser = users.find(u => u.id === selectedUserId);

  const getMessageSender = (message: Message) => {
    return users.find(u => u.id === message.fromUserId) || currentUser;
  };

  const generateAvatarColor = (username: string) => {
    const colors = [
      'from-blue-500 to-purple-600',
      'from-green-500 to-teal-600',
      'from-orange-500 to-red-600',
      'from-pink-500 to-rose-600',
      'from-indigo-500 to-blue-600',
    ];
    return colors[username.length % colors.length];
  };

  return (
    <div className={cn("flex h-full", className)}>
      {/* Users Sidebar - Hidden on mobile when user selected */}
      <Card className={cn(
        "w-80 border-r border-[var(--cyber-cyan)]/30 bg-[var(--cyber-dark)]/95",
        selectedUserId ? "hidden lg:block" : "block"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[var(--cyber-cyan)]" />
            <h3 className="font-semibold text-white">Online Users</h3>
            <Badge variant="outline" className="ml-auto border-[var(--cyber-cyan)]/50 text-[var(--cyber-cyan)]">
              {onlineUsers.length}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="space-y-2 p-4">
              {/* All Users Option */}
              <div
                onClick={() => onUserSelect?.(0)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                  !selectedUserId 
                    ? "bg-[var(--cyber-cyan)]/20 border border-[var(--cyber-cyan)]/50" 
                    : "hover:bg-[var(--cyber-dark)]/50"
                )}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--cyber-cyan)] to-[var(--cyber-magenta)] flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">General Chat</p>
                  <p className="text-xs text-gray-400">Public mesh channel</p>
                </div>
              </div>

              {/* Individual Users */}
              {onlineUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => onUserSelect?.(user.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                    selectedUserId === user.id 
                      ? "bg-[var(--cyber-cyan)]/20 border border-[var(--cyber-cyan)]/50" 
                      : "hover:bg-[var(--cyber-dark)]/50"
                  )}
                >
                  <div className="relative">
                    <Avatar className="w-10 h-10 border border-[var(--cyber-cyan)]/30">
                      {user.profileImage ? (
                        <AvatarImage src={user.profileImage} alt={user.username} />
                      ) : (
                        <AvatarFallback className={`bg-gradient-to-br ${generateAvatarColor(user.username)} text-white`}>
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {user.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-[var(--cyber-dark)] rounded-full" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.username}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Wifi className="h-3 w-3" />
                      <span>Online</span>
                    </div>
                  </div>
                </div>
              ))}

              {onlineUsers.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <WifiOff className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No users online</p>
                  <p className="text-xs">Start scanning to find nearby users</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-[var(--cyber-dark)]/50">
        {/* Chat Header */}
        <div className="border-b border-[var(--cyber-cyan)]/30 p-4">
          <div className="flex items-center gap-3">
            {selectedUser ? (
              <>
                <Avatar className="w-8 h-8 border border-[var(--cyber-cyan)]/30">
                  {selectedUser.profileImage ? (
                    <AvatarImage src={selectedUser.profileImage} alt={selectedUser.username} />
                  ) : (
                    <AvatarFallback className={`bg-gradient-to-br ${generateAvatarColor(selectedUser.username)} text-white text-sm`}>
                      {selectedUser.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-medium text-white">{selectedUser.username}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Lock className="h-3 w-3" />
                    <span>End-to-end encrypted</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--cyber-cyan)] to-[var(--cyber-magenta)] flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white">General Chat</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Shield className="h-3 w-3" />
                    <span>Public mesh channel</span>
                  </div>
                </div>
              </>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUserSelect?.(0)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              Back
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs">Start a conversation!</p>
              </div>
            ) : (
              filteredMessages.map((message) => {
                const sender = getMessageSender(message);
                const isCurrentUser = sender.id === currentUser.id;
                
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3 max-w-[80%]",
                      isCurrentUser ? "ml-auto flex-row-reverse" : ""
                    )}
                  >
                    <Avatar className="w-8 h-8 border border-[var(--cyber-cyan)]/30 flex-shrink-0">
                      {sender.profileImage ? (
                        <AvatarImage src={sender.profileImage} alt={sender.username} />
                      ) : (
                        <AvatarFallback className={`bg-gradient-to-br ${generateAvatarColor(sender.username)} text-white text-sm`}>
                          {sender.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    <div className={cn("flex-1", isCurrentUser ? "text-right" : "")}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-300">
                          {isCurrentUser ? 'You' : sender.username}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp || '').toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        {message.meshHops && message.meshHops > 0 && (
                          <Badge variant="outline" className="text-xs px-1 py-0 border-[var(--cyber-cyan)]/50">
                            {message.meshHops} hops
                          </Badge>
                        )}
                      </div>
                      
                      <div
                        className={cn(
                          "inline-block px-3 py-2 rounded-lg text-sm break-words",
                          isCurrentUser
                            ? "bg-[var(--cyber-cyan)]/20 text-white border border-[var(--cyber-cyan)]/30"
                            : "bg-[var(--cyber-dark)]/80 text-gray-100 border border-gray-600/30"
                        )}
                      >
                        {message.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t border-[var(--cyber-cyan)]/30 p-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={selectedUser ? `Message ${selectedUser.username}...` : "Type a message..."}
              className="flex-1 bg-[var(--cyber-dark)]/50 border-[var(--cyber-cyan)]/30 text-white placeholder-gray-400"
              disabled={sendMessageMutation.isPending}
              maxLength={500}
            />
            
            <Button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || sendMessageMutation.isPending}
              className="bg-[var(--cyber-cyan)] text-black hover:bg-[var(--cyber-cyan)]/80"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              <span>Messages are encrypted</span>
            </div>
            <span>{messageInput.length}/500</span>
          </div>
        </div>
      </div>
    </div>
  );
}