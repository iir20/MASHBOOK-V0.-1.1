import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { User, InsertStory } from '@shared/schema';
import { FuturisticCard, GlowButton, NeonText, AnimatedBackground } from './modern-futuristic-theme';

import {
  Sparkles,
  Plus,
  Clock,
  Eye,
  Camera,
  Video,
  FileText,
  Upload,
  Send,
  X,
  Heart,
  MessageCircle,
  Share,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';

interface Story {
  id: number;
  userId: number;
  title: string;
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  expiresAt: Date;
  createdAt: Date;
  user?: User;
  views?: number;
  likes?: number;
  isLiked?: boolean;
}

interface EnhancedStorySystemProps {
  currentUser: User | null;
  availableUsers: User[];
  isOffline: boolean;
}

export function EnhancedStorySystem({ currentUser, availableUsers, isOffline }: EnhancedStorySystemProps) {
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [newStoryContent, setNewStoryContent] = useState('');
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch stories with real-time updates
  const { data: stories = [], refetch: refetchStories } = useQuery<Story[]>({
    queryKey: ['/api/stories'],
    enabled: !isOffline,
    refetchInterval: 5000, // Real-time updates every 5 seconds
    staleTime: 2000,
    select: (data) => data.map(story => ({
      ...story,
      expiresAt: new Date(story.expiresAt),
      createdAt: new Date(story.createdAt)
    }))
  });

  // Create story mutation with proper error handling
  const createStoryMutation = useMutation({
    mutationFn: async (storyData: InsertStory) => {
      const formData = new FormData();
      formData.append('title', storyData.title);
      formData.append('content', storyData.content);
      formData.append('userId', String(storyData.userId));
      formData.append('expiresAt', storyData.expiresAt.toISOString());
      
      if (selectedFile) {
        formData.append('media', selectedFile);
      }

      const response = await fetch('/api/stories', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create story');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Story Created",
        description: "Your story has been shared successfully!",
      });
      
      setShowCreateStory(false);
      setNewStoryContent('');
      setNewStoryTitle('');
      setSelectedFile(null);
      setMediaPreview(null);
      
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
    },
    onError: (error) => {
      console.error('Failed to create story:', error);
      toast({
        title: "Story Creation Failed",
        description: error.message || "Failed to create your story. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle file selection and preview
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image (JPEG, PNG, GIF) or video (MP4, WebM).",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setMediaPreview(previewUrl);
  };

  const handleCreateStory = () => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create stories.",
        variant: "destructive",
      });
      return;
    }

    if (!newStoryTitle.trim() || !newStoryContent.trim()) {
      toast({
        title: "Missing Content",
        description: "Please provide both title and content for your story.",
        variant: "destructive",
      });
      return;
    }

    const storyData: InsertStory = {
      title: newStoryTitle.trim(),
      content: newStoryContent.trim(),
      userId: currentUser.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    };

    createStoryMutation.mutate(storyData);
  };

  const handleStoryView = (story: Story, index: number) => {
    setSelectedStory(story);
    setStoryIndex(index);
    
    // Mark story as viewed (if implemented in backend)
    if (story.userId !== currentUser?.id) {
      // Increment view count
      apiRequest(`/api/stories/${story.id}/view`, { method: 'POST' }).catch(console.error);
    }
  };

  const navigateStory = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
      ? Math.max(0, storyIndex - 1)
      : Math.min(stories.length - 1, storyIndex + 1);
    
    const newStory = stories[newIndex];
    if (newStory) {
      setSelectedStory(newStory);
      setStoryIndex(newIndex);
    }
  };

  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Auto-refetch stories periodically
  useEffect(() => {
    if (!isOffline) {
      const interval = setInterval(() => {
        refetchStories();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [isOffline, refetchStories]);

  // Filter active stories (not expired)
  const activeStories = stories.filter(story => {
    const now = new Date();
    const expiresAt = new Date(story.expiresAt);
    return expiresAt > now;
  });

  // Group stories by user
  const storyGroups = availableUsers.map(user => {
    const userStories = activeStories.filter(story => story.userId === user.id);
    return {
      user,
      stories: userStories,
      hasStories: userStories.length > 0,
      latestStory: userStories.length > 0 ? userStories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] : null
    };
  }).filter(group => group.hasStories);

  if (selectedStory) {
    return (
      <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
        <AnimatedBackground>
          <div></div>
        </AnimatedBackground>
        
        {/* Story Viewer */}
        <div className="relative w-full max-w-lg h-full max-h-[90vh] bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-xl rounded-lg overflow-hidden">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10 border-2 border-cyan-400/50">
                  <AvatarImage src={selectedStory.user?.avatar} />
                  <AvatarFallback>{selectedStory.user?.alias?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-white">{selectedStory.user?.alias}</p>
                  <p className="text-sm text-gray-300">
                    {Math.round((Date.now() - new Date(selectedStory.createdAt).getTime()) / (1000 * 60 * 60))}h ago
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedStory(null)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Progress bars */}
            <div className="flex space-x-1 mt-3">
              {stories.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full ${
                    index <= storyIndex ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Media Content */}
          <div className="relative w-full h-full flex items-center justify-center">
            {selectedStory.mediaUrl ? (
              selectedStory.mediaType?.startsWith('video/') ? (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    src={selectedStory.mediaUrl}
                    className="w-full h-full object-cover"
                    muted={isMuted}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => navigateStory('next')}
                  />
                  
                  {/* Video controls */}
                  <div className="absolute bottom-20 left-4 right-4 flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleVideoPlay}
                      className="text-white hover:bg-white/20"
                    >
                      {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleMute}
                      className="text-white hover:bg-white/20"
                    >
                      {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                    </Button>
                  </div>
                </div>
              ) : (
                <img
                  src={selectedStory.mediaUrl}
                  alt={selectedStory.title}
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              <div className="text-center text-white p-8">
                <h2 className="text-2xl font-bold mb-4">{selectedStory.title}</h2>
                <p className="text-lg leading-relaxed">{selectedStory.content}</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          {storyIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateStory('prev')}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}
          
          {storyIndex < stories.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateStory('next')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}

          {/* Footer with content and actions */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
            <div className="text-white">
              <h3 className="font-semibold text-lg mb-2">{selectedStory.title}</h3>
              <p className="text-sm mb-4">{selectedStory.content}</p>
              
              {/* Action buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    <Heart className="h-5 w-5 mr-1" />
                    {selectedStory.likes || 0}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    <MessageCircle className="h-5 w-5 mr-1" />
                    Reply
                  </Button>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    <Share className="h-5 w-5 mr-1" />
                    Share
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2 text-xs text-gray-300">
                  <Eye className="h-4 w-4" />
                  <span>{selectedStory.views || 0} views</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full space-y-6">
      <AnimatedBackground>
        <div></div>
      </AnimatedBackground>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <NeonText className="text-2xl font-bold">Stories</NeonText>
          <p className="text-muted-foreground">Share moments that disappear in 24 hours</p>
        </div>
        
        {currentUser && (
          <GlowButton onClick={() => setShowCreateStory(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Story
          </GlowButton>
        )}
      </div>

      {/* Story Ring */}
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {/* Current User's Story Creation */}
        {currentUser && (
          <div className="flex-shrink-0">
            <div
              onClick={() => setShowCreateStory(true)}
              className="relative w-16 h-16 rounded-full border-2 border-dashed border-cyan-400/50 hover:border-cyan-400 cursor-pointer flex items-center justify-center transition-all duration-300 hover:scale-105"
            >
              <Plus className="h-6 w-6 text-cyan-400" />
            </div>
            <p className="text-xs text-center mt-2">Your Story</p>
          </div>
        )}
        
        {/* User Stories */}
        {storyGroups.map((group) => (
          <div key={group.user.id} className="flex-shrink-0">
            <div
              onClick={() => group.latestStory && handleStoryView(group.latestStory, 0)}
              className="relative w-16 h-16 rounded-full border-3 border-gradient-to-r from-purple-500 to-cyan-500 p-0.5 cursor-pointer transition-all duration-300 hover:scale-105"
            >
              <Avatar className="w-full h-full">
                <AvatarImage src={group.user.avatar} />
                <AvatarFallback>{group.user.alias?.charAt(0)}</AvatarFallback>
              </Avatar>
              
              {/* Story count badge */}
              {group.stories.length > 1 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-cyan-500">
                  {group.stories.length}
                </Badge>
              )}
            </div>
            <p className="text-xs text-center mt-2 max-w-16 truncate">
              {group.user.alias}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Stories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeStories.slice(0, 6).map((story, index) => (
          <FuturisticCard
            key={story.id}
            className="cursor-pointer transition-all duration-300 hover:scale-105"
            onClick={() => handleStoryView(story, index)}
          >
            <div className="aspect-[4/3] relative">
              {story.mediaUrl ? (
                story.mediaType?.startsWith('image/') ? (
                  <img
                    src={story.mediaUrl}
                    alt={story.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg flex items-center justify-center">
                    <Play className="h-12 w-12 text-cyan-400" />
                  </div>
                )
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg flex items-center justify-center p-4">
                  <div className="text-center">
                    <FileText className="h-8 w-8 text-cyan-400 mx-auto mb-2" />
                    <p className="text-sm font-medium line-clamp-3">{story.title}</p>
                  </div>
                </div>
              )}
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg" />
              
              {/* User info */}
              <div className="absolute bottom-2 left-2 right-2">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={story.user?.avatar} />
                    <AvatarFallback className="text-xs">{story.user?.alias?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-white text-xs font-medium">{story.user?.alias}</span>
                </div>
                <p className="text-white text-xs opacity-80 mt-1 line-clamp-2">{story.title}</p>
              </div>
              
              {/* Time indicator */}
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="bg-black/50 text-white text-xs">
                  {Math.round((Date.now() - new Date(story.createdAt).getTime()) / (1000 * 60 * 60))}h
                </Badge>
              </div>
            </div>
          </FuturisticCard>
        ))}
      </div>

      {/* Create Story Modal */}
      {showCreateStory && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <FuturisticCard className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Create New Story</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowCreateStory(false);
                    setSelectedFile(null);
                    setMediaPreview(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="What's your story about?"
                  value={newStoryTitle}
                  onChange={(e) => setNewStoryTitle(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  placeholder="Share your moment..."
                  value={newStoryContent}
                  onChange={(e) => setNewStoryContent(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Media Upload */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {mediaPreview ? (
                  <div className="relative">
                    {selectedFile?.type.startsWith('image/') ? (
                      <img
                        src={mediaPreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <video
                        src={mediaPreview}
                        className="w-full h-48 object-cover rounded-lg"
                        controls
                      />
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        setSelectedFile(null);
                        setMediaPreview(null);
                      }}
                      className="absolute top-2 right-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-20 flex flex-col items-center justify-center"
                    >
                      <Camera className="h-6 w-6 mb-1" />
                      <span className="text-xs">Photo</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-20 flex flex-col items-center justify-center"
                    >
                      <Video className="h-6 w-6 mb-1" />
                      <span className="text-xs">Video</span>
                    </Button>
                    <Button
                      variant="outline"
                      disabled
                      className="h-20 flex flex-col items-center justify-center opacity-50"
                    >
                      <FileText className="h-6 w-6 mb-1" />
                      <span className="text-xs">Text Only</span>
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Expires in 24 hours</span>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => {
                    setShowCreateStory(false);
                    setSelectedFile(null);
                    setMediaPreview(null);
                    setNewStoryTitle('');
                    setNewStoryContent('');
                  }}>
                    Cancel
                  </Button>
                  <GlowButton 
                    onClick={handleCreateStory}
                    disabled={createStoryMutation.isPending || !newStoryTitle.trim() || !newStoryContent.trim()}
                  >
                    {createStoryMutation.isPending ? (
                      <>
                        <Upload className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Share Story
                      </>
                    )}
                  </GlowButton>
                </div>
              </div>
            </CardContent>
          </FuturisticCard>
        </div>
      )}
      
      {/* Empty State */}
      {activeStories.length === 0 && !isOffline && (
        <div className="text-center py-12">
          <Sparkles className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Stories</h3>
          <p className="text-muted-foreground mb-4">
            Be the first to share a moment with your mesh network!
          </p>
          {currentUser && (
            <GlowButton onClick={() => setShowCreateStory(true)}>
              Create Your First Story
            </GlowButton>
          )}
        </div>
      )}
    </div>
  );
}