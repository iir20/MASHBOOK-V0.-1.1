import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Settings,
  Users,
  Clock,
  Signal,
  Maximize2,
  Minimize2,
  ScreenShare,
  ScreenShareOff,
  MessageSquare,
  PhoneCall,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CallParticipant {
  id: string;
  username: string;
  avatar?: string;
  isLocal?: boolean;
  videoEnabled: boolean;
  audioEnabled: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor';
  stream?: MediaStream;
}

interface VoiceVideoCallProps {
  isVoiceCall?: boolean;
  isVideoCall?: boolean;
  participants: CallParticipant[];
  onEndCall: () => void;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onToggleScreenShare: () => void;
  className?: string;
}

export function VoiceVideoCall({
  isVoiceCall = false,
  isVideoCall = false,
  participants = [],
  onEndCall,
  onToggleVideo,
  onToggleAudio,
  onToggleScreenShare,
  className
}: VoiceVideoCallProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(isVideoCall);
  const [screenShareEnabled, setScreenShareEnabled] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('good');
  const [showControls, setShowControls] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
  const callStartTimeRef = useRef<number>(Date.now());
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // Get local user
  const localUser = participants.find(p => p.isLocal);
  const remoteUsers = participants.filter(p => !p.isLocal);

  // Update call duration
  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-hide controls in fullscreen
  useEffect(() => {
    if (isFullscreen) {
      const resetTimeout = () => {
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        setShowControls(true);
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      };

      resetTimeout();
      
      const handleMouseMove = () => resetTimeout();
      document.addEventListener('mousemove', handleMouseMove);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      };
    }
  }, [isFullscreen]);

  // Handle audio toggle
  const handleToggleAudio = useCallback(() => {
    setAudioEnabled(prev => !prev);
    onToggleAudio();
    toast({
      title: audioEnabled ? "Microphone Off" : "Microphone On",
      description: audioEnabled ? "Your microphone has been muted" : "Your microphone is now active",
    });
  }, [audioEnabled, onToggleAudio, toast]);

  // Handle video toggle
  const handleToggleVideo = useCallback(() => {
    setVideoEnabled(prev => !prev);
    onToggleVideo();
    toast({
      title: videoEnabled ? "Camera Off" : "Camera On",
      description: videoEnabled ? "Your camera has been turned off" : "Your camera is now active",
    });
  }, [videoEnabled, onToggleVideo, toast]);

  // Handle screen share toggle
  const handleToggleScreenShare = useCallback(() => {
    setScreenShareEnabled(prev => !prev);
    onToggleScreenShare();
    toast({
      title: screenShareEnabled ? "Screen Share Stopped" : "Screen Share Started",
      description: screenShareEnabled ? "You stopped sharing your screen" : "You are now sharing your screen",
    });
  }, [screenShareEnabled, onToggleScreenShare, toast]);

  // Handle end call
  const handleEndCall = useCallback(() => {
    onEndCall();
    toast({
      title: "Call Ended",
      description: `Call duration: ${formatDuration(callDuration)}`,
    });
  }, [onEndCall, callDuration, toast]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Get quality color
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-[var(--cyber-green)]';
      case 'good': return 'text-[var(--cyber-yellow)]';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  // Get quality bars
  const getQualityBars = (quality: string) => {
    const bars = quality === 'excellent' ? 3 : quality === 'good' ? 2 : 1;
    return Array.from({ length: 3 }, (_, i) => (
      <div
        key={i}
        className={cn(
          "w-1 h-3 rounded-sm",
          i < bars ? getQualityColor(quality).replace('text-', 'bg-') : "bg-gray-600"
        )}
      />
    ));
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-64 glass-morphism">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isVideoCall ? <Video className="w-5 h-5 text-[var(--cyber-cyan)]" /> : <Phone className="w-5 h-5 text-[var(--cyber-green)]" />}
                <div>
                  <p className="font-medium text-white">
                    {isVideoCall ? 'Video Call' : 'Voice Call'}
                  </p>
                  <p className="text-sm text-gray-400">{formatDuration(callDuration)}</p>
                </div>
              </div>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(false)}
                  className="h-8 w-8 p-0"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEndCall}
                  className="h-8 w-8 p-0 text-red-500"
                >
                  <PhoneOff className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn(
      "fixed inset-0 z-50 bg-black/95 backdrop-blur-sm",
      isFullscreen ? "p-0" : "p-4",
      className
    )}>
      <Card className={cn(
        "h-full glass-morphism",
        isFullscreen ? "rounded-none" : "rounded-lg"
      )}>
        {/* Header */}
        <CardHeader className={cn(
          "flex flex-row items-center justify-between p-4",
          isFullscreen && !showControls ? "opacity-0" : "opacity-100"
        )}>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {isVideoCall ? <Video className="w-6 h-6 text-[var(--cyber-cyan)]" /> : <Phone className="w-6 h-6 text-[var(--cyber-green)]" />}
              <div>
                <h2 className="text-xl font-bold text-white">
                  {isVideoCall ? 'Video Call' : 'Voice Call'}
                </h2>
                <p className="text-sm text-gray-400">
                  {participants.length} participant{participants.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">{formatDuration(callDuration)}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Signal className={cn("w-4 h-4", getQualityColor(connectionQuality))} />
                <div className="flex space-x-1">
                  {getQualityBars(connectionQuality)}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8 p-0"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(true)}
              className="h-8 w-8 p-0"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Video Content */}
        <CardContent className="flex-1 p-4">
          {isVideoCall ? (
            <div className="h-full relative">
              {/* Remote participants */}
              <div className={cn(
                "grid h-full gap-2",
                remoteUsers.length === 1 ? "grid-cols-1" :
                remoteUsers.length === 2 ? "grid-cols-2" :
                remoteUsers.length <= 4 ? "grid-cols-2 grid-rows-2" :
                "grid-cols-3 grid-rows-2"
              )}>
                {remoteUsers.map((participant) => (
                  <div
                    key={participant.id}
                    className="relative bg-[var(--cyber-dark)]/50 rounded-lg overflow-hidden"
                  >
                    {participant.videoEnabled ? (
                      <video
                        ref={el => {
                          if (el) remoteVideoRefs.current[participant.id] = el;
                        }}
                        className="w-full h-full object-cover"
                        autoPlay
                        playsInline
                        muted={false}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[var(--cyber-dark)]/50">
                        <Avatar className="w-24 h-24">
                          <AvatarImage src={participant.avatar} />
                          <AvatarFallback className="text-2xl">
                            {participant.username?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                    
                    {/* Participant info overlay */}
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="bg-black/50 rounded-lg p-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-medium truncate">
                              {participant.username}
                            </span>
                            <div className="flex space-x-1">
                              {getQualityBars(participant.connectionQuality)}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            {!participant.audioEnabled && (
                              <MicOff className="w-4 h-4 text-red-500" />
                            )}
                            {!participant.videoEnabled && (
                              <VideoOff className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Local video (picture-in-picture) */}
              {localUser && (
                <div className="absolute bottom-4 right-4 w-48 h-36 bg-[var(--cyber-dark)]/50 rounded-lg overflow-hidden border-2 border-[var(--cyber-cyan)]/30">
                  {localUser.videoEnabled ? (
                    <video
                      ref={localVideoRef}
                      className="w-full h-full object-cover scale-x-[-1]"
                      autoPlay
                      playsInline
                      muted
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={localUser.avatar} />
                        <AvatarFallback>{localUser.username?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                  
                  <div className="absolute bottom-1 left-1 right-1">
                    <div className="bg-black/50 rounded px-2 py-1">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-xs">You</span>
                        <div className="flex items-center space-x-1">
                          {!localUser.audioEnabled && (
                            <MicOff className="w-3 h-3 text-red-500" />
                          )}
                          {!localUser.videoEnabled && (
                            <VideoOff className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Voice call layout
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-8">
                <div className="relative">
                  <div className="w-48 h-48 mx-auto bg-gradient-to-br from-[var(--cyber-cyan)] to-[var(--cyber-magenta)] rounded-full flex items-center justify-center">
                    <PhoneCall className="w-24 h-24 text-white" />
                  </div>
                  <div className="absolute -inset-4 border-2 border-[var(--cyber-cyan)]/30 rounded-full animate-pulse" />
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-white">Voice Call Active</h3>
                  <div className="flex items-center justify-center space-x-8">
                    {participants.map((participant) => (
                      <div key={participant.id} className="text-center">
                        <Avatar className="w-16 h-16 mx-auto mb-2">
                          <AvatarImage src={participant.avatar} />
                          <AvatarFallback className="text-xl">
                            {participant.username?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-white font-medium">{participant.username}</p>
                        <div className="flex items-center justify-center space-x-1 mt-1">
                          {!participant.audioEnabled && (
                            <MicOff className="w-4 h-4 text-red-500" />
                          )}
                          <div className="flex space-x-1">
                            {getQualityBars(participant.connectionQuality)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        {/* Controls */}
        <div className={cn(
          "flex items-center justify-center space-x-4 p-6 bg-[var(--cyber-dark)]/50",
          isFullscreen && !showControls ? "opacity-0" : "opacity-100"
        )}>
          <Button
            variant={audioEnabled ? "default" : "destructive"}
            size="lg"
            onClick={handleToggleAudio}
            className="h-12 w-12 rounded-full"
          >
            {audioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>

          {isVideoCall && (
            <Button
              variant={videoEnabled ? "default" : "destructive"}
              size="lg"
              onClick={handleToggleVideo}
              className="h-12 w-12 rounded-full"
            >
              {videoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </Button>
          )}

          <Button
            variant={screenShareEnabled ? "default" : "ghost"}
            size="lg"
            onClick={handleToggleScreenShare}
            className="h-12 w-12 rounded-full"
          >
            {screenShareEnabled ? <ScreenShare className="w-6 h-6" /> : <ScreenShareOff className="w-6 h-6" />}
          </Button>

          <Button
            variant="destructive"
            size="lg"
            onClick={handleEndCall}
            className="h-12 w-12 rounded-full"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      </Card>
    </div>
  );
}