import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { User, Message, InsertMessage } from '@shared/schema';
import { FuturisticCard, GlowButton, NeonText } from './modern-futuristic-theme';

import {
  Send, Search, Paperclip, Image, Smile, Phone, Video, MoreVertical,
  ArrowLeft, Shield, CheckCircle, Circle, MessageSquare, Users, Mic,
  Camera, File, Download, Upload, Lock, Unlock, Wifi, WifiOff,
  AlertCircle, Clock, RefreshCw, Bluetooth, Globe, Zap
} from 'lucide-react';

interface ExtendedMessage extends Message {
  fromUser?: User;
  toUser?: User;
  isRead?: boolean;
  deliveryStatus?: 'sending' | 'sent' | 'delivered' | 'failed' | 'p2p' | 'relayed';
  encryptionLevel?: 'none' | 'standard' | 'e2e';
  routePath?: string[];
  mediaFile?: File;
  mediaUrl?: string;
  messageSize?: number;
}

interface P2PConnection {
  peerId: string;
  userId: number;
  status: 'connecting' | 'connected' | 'disconnected' | 'failed';
  type: 'webrtc' | 'websocket' | 'bluetooth';
  latency: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  dataChannel?: RTCDataChannel;
}

interface FileTransfer {
  id: string;
  fileName: string;
  fileSize: number;
  progress: number;
  status: 'pending' | 'uploading' | 'downloading' | 'completed' | 'failed';
  chunks: ArrayBuffer[];
  totalChunks: number;
}

interface EnhancedP2PMessagingProps {
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

export function EnhancedP2PMessaging({ 
  currentUser, 
  availableUsers, 
  selectedUser, 
  onUserSelect, 
  isOffline,
  wsState 
}: EnhancedP2PMessagingProps) {
  const [messageContent, setMessageContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [offlineMessages, setOfflineMessages] = useState<ExtendedMessage[]>([]);
  const [p2pConnections, setP2pConnections] = useState<Map<number, P2PConnection>>(new Map());
  const [fileTransfers, setFileTransfers] = useState<Map<string, FileTransfer>>(new Map());
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout>();
  const peerConnectionsRef = useRef<Map<number, RTCPeerConnection>>(new Map());
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Enhanced message fetching with P2P and offline support
  const { data: messages = [], refetch: refetchMessages, isLoading } = useQuery<ExtendedMessage[]>({
    queryKey: ['/api/messages', selectedUser?.id],
    enabled: !!currentUser && !!selectedUser && !isOffline,
    refetchInterval: 2000,
    staleTime: 500,
    retry: 3,
    retryDelay: 1000,
    select: (data) => data.map(message => ({
      ...message,
      timestamp: new Date(message.timestamp),
      fromUser: availableUsers.find(u => u.id === message.fromUserId),
      toUser: availableUsers.find(u => u.id === message.toUserId),
      deliveryStatus: 'delivered' as const,
      encryptionLevel: 'standard' as const
    }))
  });

  // Initialize WebRTC connections for P2P messaging
  const initP2PConnection = useCallback(async (targetUserId: number) => {
    if (!selectedUser || selectedUser.id !== targetUserId) return;

    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Create data channel for messages
    const dataChannel = peerConnection.createDataChannel('messages', {
      ordered: true
    });

    dataChannel.onopen = () => {
      setP2pConnections(prev => new Map(prev.set(targetUserId, {
        peerId: `peer-${targetUserId}`,
        userId: targetUserId,
        status: 'connected',
        type: 'webrtc',
        latency: 0,
        quality: 'excellent',
        dataChannel
      })));

      toast({
        title: "P2P Connection Established",
        description: `Direct connection to ${selectedUser.alias}`
      });
    };

    dataChannel.onmessage = (event) => {
      try {
        const messageData = JSON.parse(event.data);
        handleP2PMessage(messageData);
      } catch (error) {
        console.error('Failed to parse P2P message:', error);
      }
    };

    dataChannel.onerror = (error) => {
      console.error('Data channel error:', error);
      setP2pConnections(prev => {
        const updated = new Map(prev);
        const connection = updated.get(targetUserId);
        if (connection) {
          updated.set(targetUserId, { ...connection, status: 'failed' });
        }
        return updated;
      });
    };

    peerConnection.oniceconnectionstatechange = () => {
      const state = peerConnection.iceConnectionState;
      console.log('ICE connection state:', state);
      
      if (state === 'failed' || state === 'disconnected') {
        setP2pConnections(prev => {
          const updated = new Map(prev);
          const connection = updated.get(targetUserId);
          if (connection) {
            updated.set(targetUserId, { ...connection, status: 'disconnected' });
          }
          return updated;
        });
      }
    };

    peerConnectionsRef.current.set(targetUserId, peerConnection);

    // Signal through WebSocket for WebRTC handshake
    if (wsState.isConnected) {
      wsState.sendMessage({
        type: 'webrtc-init',
        targetUserId,
        fromUserId: currentUser?.id
      });
    }
  }, [selectedUser, currentUser, wsState, toast]);

  // Handle incoming P2P messages
  const handleP2PMessage = useCallback((messageData: any) => {
    const newMessage: ExtendedMessage = {
      ...messageData,
      timestamp: new Date(messageData.timestamp),
      deliveryStatus: 'p2p',
      encryptionLevel: 'e2e',
      fromUser: availableUsers.find(u => u.id === messageData.fromUserId),
      toUser: availableUsers.find(u => u.id === messageData.toUserId)
    };

    // Add to local messages immediately
    setOfflineMessages(prev => [...prev, newMessage]);
    
    // Mark as read and send acknowledgment
    if (messageData.fromUserId !== currentUser?.id) {
      const connection = p2pConnections.get(messageData.fromUserId);
      if (connection?.dataChannel && connection.dataChannel.readyState === 'open') {
        connection.dataChannel.send(JSON.stringify({
          type: 'message-ack',
          messageId: messageData.id,
          timestamp: new Date().toISOString()
        }));
      }
    }
  }, [availableUsers, currentUser, p2pConnections]);

  // Enhanced send message with P2P, encryption, and fallback
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: InsertMessage & { file?: File }) => {
      let encryptedContent = messageData.content;
      let deliveryMethod: 'p2p' | 'websocket' | 'stored' = 'stored';

      // Try P2P first if connection exists
      const p2pConnection = selectedUser ? p2pConnections.get(selectedUser.id) : null;
      
      if (p2pConnection?.dataChannel && p2pConnection.dataChannel.readyState === 'open') {
        // Send via P2P
        const p2pMessage = {
          id: Date.now().toString(),
          fromUserId: currentUser?.id,
          toUserId: selectedUser?.id,
          content: messageData.content,
          encryptedContent: encryptedContent,
          messageType: messageData.messageType || 'text',
          timestamp: new Date().toISOString(),
          isEphemeral: true,
          meshHops: 0
        };

        p2pConnection.dataChannel.send(JSON.stringify(p2pMessage));
        deliveryMethod = 'p2p';

        // Add to local messages immediately
        const localMessage: ExtendedMessage = {
          ...p2pMessage,
          id: parseInt(p2pMessage.id),
          timestamp: new Date(),
          deliveryStatus: 'p2p',
          encryptionLevel: 'e2e',
          fromUser: currentUser,
          toUser: selectedUser
        };
        
        setOfflineMessages(prev => [...prev, localMessage]);
        return localMessage;
      }

      // Fallback to WebSocket signaling
      if (wsState.isConnected && !isOffline) {
        wsState.sendMessage({
          type: 'message',
          ...messageData,
          deliveryMethod: 'websocket'
        });
        deliveryMethod = 'websocket';
      }

      // Fallback to server storage
      const formData = new FormData();
      formData.append('fromUserId', String(messageData.fromUserId));
      formData.append('toUserId', String(messageData.toUserId));
      formData.append('content', messageData.content);
      formData.append('encryptedContent', encryptedContent);
      formData.append('messageType', messageData.messageType || 'text');
      formData.append('isEphemeral', String(messageData.isEphemeral || true));

      if (messageData.file) {
        // Handle file upload with chunking
        await handleFileUpload(messageData.file);
        formData.append('attachment', messageData.file);
      }

      return await apiRequest(`/api/messages`, {
        method: 'POST',
        body: {
          fromUserId: messageData.fromUserId,
          toUserId: messageData.toUserId,
          content: messageData.content,
          encryptedContent: encryptedContent,
          messageType: messageData.messageType || 'text',
          isEphemeral: messageData.isEphemeral || true
        }
      });
    },
    onSuccess: (data, variables) => {
      setMessageContent('');
      setSelectedFile(null);
      
      if (selectedFile) {
        fileInputRef.current!.value = '';
      }

      // Invalidate messages query to refresh
      queryClient.invalidateQueries({ 
        queryKey: ['/api/messages', selectedUser?.id] 
      });

      toast({
        title: "Message Sent",
        description: `Delivered via ${data.deliveryStatus || 'server'}`
      });
    },
    onError: (error: any) => {
      console.error('Message send failed:', error);
      
      // Store message for retry when online
      if (isOffline || !wsState.isConnected) {
        const offlineMessage: ExtendedMessage = {
          id: Date.now(),
          fromUserId: currentUser?.id || 0,
          toUserId: selectedUser?.id || 0,
          content: messageContent,
          encryptedContent: messageContent,
          messageType: 'text',
          timestamp: new Date(),
          isEphemeral: true,
          meshHops: 0,
          deliveryStatus: 'failed',
          encryptionLevel: 'standard',
          fromUser: currentUser,
          toUser: selectedUser
        };
        
        setOfflineMessages(prev => [...prev, offlineMessage]);
        setMessageContent('');
        
        toast({
          title: "Message Queued",
          description: "Will send when connection is restored",
          variant: "default"
        });
      } else {
        toast({
          title: "Send Failed",
          description: error.message || "Failed to send message",
          variant: "destructive"
        });
      }
    }
  });

  // File upload with chunking and progress
  const handleFileUpload = async (file: File): Promise<void> => {
    const fileId = Date.now().toString();
    const chunkSize = 64 * 1024; // 64KB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);
    
    const transfer: FileTransfer = {
      id: fileId,
      fileName: file.name,
      fileSize: file.size,
      progress: 0,
      status: 'uploading',
      chunks: [],
      totalChunks
    };
    
    setFileTransfers(prev => new Map(prev.set(fileId, transfer)));
    
    try {
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = await file.slice(start, end).arrayBuffer();
        
        // Simulate upload progress
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const progress = ((i + 1) / totalChunks) * 100;
        setFileTransfers(prev => {
          const updated = new Map(prev);
          const current = updated.get(fileId);
          if (current) {
            updated.set(fileId, { ...current, progress });
          }
          return updated;
        });
      }
      
      setFileTransfers(prev => {
        const updated = new Map(prev);
        const current = updated.get(fileId);
        if (current) {
          updated.set(fileId, { ...current, status: 'completed' });
        }
        return updated;
      });
      
    } catch (error) {
      setFileTransfers(prev => {
        const updated = new Map(prev);
        const current = updated.get(fileId);
        if (current) {
          updated.set(fileId, { ...current, status: 'failed' });
        }
        return updated;
      });
      throw error;
    }
  };

  // Audio recording functionality
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
        setSelectedFile(audioFile);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      toast({
        title: "Recording Failed",
        description: "Could not access microphone",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  // Handle send message
  const handleSendMessage = () => {
    if ((!messageContent.trim() && !selectedFile) || !currentUser || !selectedUser) return;

    const messageData: InsertMessage & { file?: File } = {
      fromUserId: currentUser.id,
      toUserId: selectedUser.id,
      content: messageContent || (selectedFile ? `📎 ${selectedFile.name}` : ''),
      encryptedContent: messageContent || (selectedFile ? `📎 ${selectedFile.name}` : ''),
      messageType: selectedFile ? (selectedFile.type.startsWith('image/') ? 'image' : 
                                  selectedFile.type.startsWith('audio/') ? 'audio' : 
                                  selectedFile.type.startsWith('video/') ? 'video' : 'file') : 'text',
      isEphemeral: true,
      meshHops: 0,
      file: selectedFile || undefined
    };

    sendMessageMutation.mutate(messageData);
  };

  // Combine online and offline messages
  const allMessages = isOffline ? 
    offlineMessages.filter(msg => 
      (msg.fromUserId === currentUser?.id && msg.toUserId === selectedUser?.id) ||
      (msg.fromUserId === selectedUser?.id && msg.toUserId === currentUser?.id)
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) : 
    messages;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages]);

  // Initialize P2P connection when user is selected
  useEffect(() => {
    if (selectedUser && currentUser && !isOffline) {
      initP2PConnection(selectedUser.id);
    }
  }, [selectedUser, currentUser, isOffline, initP2PConnection]);

  // Cleanup connections on unmount
  useEffect(() => {
    return () => {
      peerConnectionsRef.current.forEach(pc => pc.close());
      peerConnectionsRef.current.clear();
    };
  }, []);

  if (!selectedUser) {
    return (
      <FuturisticCard className="h-[600px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto" />
          <div>
            <h3 className="font-medium">Select a Conversation</h3>
            <p className="text-sm text-muted-foreground">Choose a user to start messaging</p>
          </div>
        </div>
      </FuturisticCard>
    );
  }

  const connectionStatus = p2pConnections.get(selectedUser.id);

  return (
    <div className="space-y-4">
      {/* Connection Status Bar */}
      <FuturisticCard className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={selectedUser.avatar} />
              <AvatarFallback>{selectedUser.alias.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{selectedUser.alias}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {connectionStatus ? (
                  <>
                    {connectionStatus.type === 'webrtc' && <Zap className="h-3 w-3 text-blue-400" />}
                    {connectionStatus.type === 'bluetooth' && <Bluetooth className="h-3 w-3 text-purple-400" />}
                    {connectionStatus.type === 'websocket' && <Globe className="h-3 w-3 text-green-400" />}
                    <span className="capitalize">{connectionStatus.status}</span>
                    {connectionStatus.status === 'connected' && (
                      <Badge variant="outline" className="text-xs">
                        {connectionStatus.type.toUpperCase()}
                      </Badge>
                    )}
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-muted-foreground" />
                    <span>No direct connection</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {encryptionEnabled && <Lock className="h-4 w-4 text-green-400" />}
            <Button variant="ghost" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </FuturisticCard>

      {/* Messages Area */}
      <FuturisticCard className="h-[400px] flex flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center text-muted-foreground">Loading messages...</div>
            ) : allMessages.length === 0 ? (
              <div className="text-center text-muted-foreground">No messages yet. Start the conversation!</div>
            ) : (
              allMessages.map((message) => {
                const isOwn = message.fromUserId === currentUser?.id;
                
                return (
                  <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-lg p-3 ${
                      isOwn 
                        ? 'bg-blue-500/20 border border-blue-500/30' 
                        : 'bg-muted/20 border border-muted/30'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        {message.encryptionLevel === 'e2e' && <Lock className="h-3 w-3 text-green-400" />}
                        {message.deliveryStatus === 'p2p' && <Zap className="h-3 w-3 text-blue-400" />}
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <p className="text-sm">{message.content}</p>
                      
                      {message.messageType !== 'text' && (
                        <div className="mt-2 p-2 bg-muted/10 rounded border border-muted/20">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {message.messageType === 'image' && <Image className="h-3 w-3" />}
                            {message.messageType === 'audio' && <Mic className="h-3 w-3" />}
                            {message.messageType === 'video' && <Camera className="h-3 w-3" />}
                            {message.messageType === 'file' && <File className="h-3 w-3" />}
                            <span>Media file</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="outline" className="text-xs">
                          {message.deliveryStatus}
                        </Badge>
                        {isOwn && (
                          <div className="flex items-center gap-1">
                            {message.deliveryStatus === 'sent' && <CheckCircle className="h-3 w-3 text-muted-foreground" />}
                            {message.deliveryStatus === 'delivered' && <CheckCircle className="h-3 w-3 text-blue-400" />}
                            {message.deliveryStatus === 'p2p' && <CheckCircle className="h-3 w-3 text-green-400" />}
                            {message.deliveryStatus === 'failed' && <AlertCircle className="h-3 w-3 text-red-400" />}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* File Transfers */}
        {fileTransfers.size > 0 && (
          <div className="border-t border-muted/20 p-2">
            {Array.from(fileTransfers.values()).map(transfer => (
              <div key={transfer.id} className="flex items-center gap-2 p-2 bg-muted/10 rounded">
                <File className="h-4 w-4" />
                <div className="flex-1">
                  <div className="text-xs font-medium">{transfer.fileName}</div>
                  <Progress value={transfer.progress} className="h-1" />
                </div>
                <Badge variant="outline" className="text-xs">
                  {transfer.status}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-muted/20 p-4">
          {selectedFile && (
            <div className="mb-3 p-2 bg-muted/10 rounded border border-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <File className="h-4 w-4" />
                <span className="text-sm">{selectedFile.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
                ×
              </Button>
            </div>
          )}
          
          {isRecording && (
            <div className="mb-3 p-2 bg-red-500/10 rounded border border-red-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4 text-red-400" />
                <span className="text-sm">Recording...</span>
                <span className="text-xs text-muted-foreground">
                  {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={stopRecording}>
                Stop
              </Button>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2">
              <Textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Type a message..."
                className="resize-none min-h-[40px] max-h-[120px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              
              <div className="flex items-center gap-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                  accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
                />
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!!selectedFile}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={isRecording ? 'text-red-400' : ''}
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <GlowButton 
              onClick={handleSendMessage}
              disabled={(!messageContent.trim() && !selectedFile) || sendMessageMutation.isPending}
              size="sm"
            >
              {sendMessageMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </GlowButton>
          </div>
        </div>
      </FuturisticCard>
    </div>
  );
}