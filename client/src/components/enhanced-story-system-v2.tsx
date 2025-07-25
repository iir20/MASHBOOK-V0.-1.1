import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { User, Story, InsertStory } from '@shared/schema';
import { FuturisticCard, GlowButton, NeonText, AnimatedBackground } from './modern-futuristic-theme';

import {
  Plus,
  X,
  Heart,
  MessageCircle,
  Share,
  Eye,
  Camera,
  Image as ImageIcon,
  Video,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Send
} from 'lucide-react';

interface ExtendedStory extends Story {
  user?: User;
  views?: number;
  likes?: number;
  isLiked?: boolean;
}

interface EnhancedStorySystemV2Props {
  currentUser: User | null;
  availableUsers: User[];
  isOffline: boolean;
}

export function EnhancedStorySystemV2({ currentUser, availableUsers, isOffline }: EnhancedStorySystemV2Props) {
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [selectedStory, setSelectedStory] = useState<ExtendedStory | null>(null);
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
  const { data: stories = [], refetch: refetchStories, isLoading } = useQuery<ExtendedStory[]>({
    queryKey: ['/api/stories'],
    enabled: !isOffline,
    refetchInterval: 3000, // More frequent updates
    staleTime: 1000,
    select: (data) => data.map(story => ({
      ...story,
      expiresAt: new Date(story.expiresAt),
      createdAt: new Date(story.createdAt),
      user: availableUsers.find(u => u.id === story.userId),
      views: 0,
      likes: 0
    }))
  });

  // Create story mutation with enhanced error handling
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

      console.log('Creating story with data:', {
        title: storyData.title,
        content: storyData.content,
        userId: storyData.userId,
        expiresAt: storyData.expiresAt.toISOString()
      });

      const response = await fetch('/api/stories', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}: Failed to create story`);
      }

      return response.json();
    },
    onSuccess: (newStory) => {
      toast({
        title: "Story Created Successfully!",
        description: "Your story is now live and visible to the network.",
      });
      
      setShowCreateStory(false);
      setNewStoryContent('');
      setNewStoryTitle('');
      setSelectedFile(null);
      setMediaPreview(null);
      
      // Immediate cache update for instant UI feedback
      queryClient.setQueryData(['/api/stories'], (oldData: ExtendedStory[] | undefined) => {
        const storyWithUser = { ...newStory, user: currentUser, views: 0, likes: 0 };
        if (!oldData) return [storyWithUser];
        return [storyWithUser, ...oldData];
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
    },
    onError: (error) => {
      console.error('Story creation failed:', error);
      toast({
        title: "Story Creation Failed",
        description: error.message || "Unable to create story. Please check your connection and try again.",
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
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Unsupported File Type",
        description: "Please select an image (JPG, PNG, GIF) or video (MP4, WebM).",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle story creation
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

  // Handle story viewing
  const handleStoryView = (story: ExtendedStory, index: number) => {
    setSelectedStory(story);
    setStoryIndex(index);
    
    // Mark story as viewed (if not own story)
    if (story.userId !== currentUser?.id) {
      apiRequest(`/api/stories/${story.id}/view`, { method: 'POST' }).catch(console.error);
    }
  };

  // Story navigation
  const navigateStory = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
      ? Math.max(0, storyIndex - 1)
      : Math.min(activeStories.length - 1, storyIndex + 1);
    
    const newStory = activeStories[newIndex];
    if (newStory) {
      setSelectedStory(newStory);
      setStoryIndex(newIndex);
    }
  };

  // Video controls
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

  // Auto-refetch stories
  useEffect(() => {
    if (!isOffline) {
      const interval = setInterval(() => {
        refetchStories();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [isOffline, refetchStories]);

  // Filter active stories (not expired) and sort by creation time
  const activeStories = stories
    .filter(story => {
      const now = new Date();
      return story.expiresAt > now;
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Group stories by user for the carousel
  const storyGroups = availableUsers.map(user => {
    const userStories = activeStories.filter(story => story.userId === user.id);
    return {
      user,
      stories: userStories,
      hasStories: userStories.length > 0,
      latestStory: userStories[0] // Already sorted by creation time
    };
  }).filter(group => group.hasStories);

  // Add current user's stories at the top if they have any
  const currentUserStories = activeStories.filter(story => story.userId === currentUser?.id);
  if (currentUser && currentUserStories.length > 0) {
    const currentUserGroup = {
      user: currentUser,
      stories: currentUserStories,
      hasStories: true,
      latestStory: currentUserStories[0]
    };
    // Remove current user from other groups and add at beginning
    const otherGroups = storyGroups.filter(group => group.user.id !== currentUser.id);
    storyGroups.splice(0, storyGroups.length, currentUserGroup, ...otherGroups);
  }

  // Format time helper
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  // Story viewer modal
  if (selectedStory) {
    return (
      <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
        <AnimatedBackground>
          <div></div>
        </AnimatedBackground>
        
        {/* Story Viewer */}
        <div className="relative w-full max-w-lg h-full max-h-[90vh] bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-xl rounded-lg overflow-hidden">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/70 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10 border-2 border-cyan-400/50">
                  <AvatarImage src={selectedStory.user?.avatar} />
                  <AvatarFallback>{selectedStory.user?.alias?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-white">{selectedStory.user?.alias}</p>
                  <p className="text-sm text-gray-300">{formatTimeAgo(selectedStory.createdAt)}</p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedStory(null)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Progress indicators */}
            <div className="flex space-x-1 mt-3">
              {activeStories.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full ${
                    index === storyIndex ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Story Content */}
          <div className="relative h-full flex items-center justify-center p-4 pt-20 pb-20">
            {selectedStory.mediaUrl ? (
              selectedStory.mediaUrl.includes('video') ? (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    src={selectedStory.mediaUrl}
                    className="w-full h-full object-cover rounded-lg"
                    autoPlay
                    loop
                    muted={isMuted}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                  
                  {/* Video Controls */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleVideoPlay}
                      className="text-white hover:bg-white/20"
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleMute}
                      className="text-white hover:bg-white/20"
                    >
                      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>
              ) : (
                <img
                  src={selectedStory.mediaUrl}
                  alt={selectedStory.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              )
            ) : (
              <div className="text-center text-white p-6">
                <h2 className="text-2xl font-bold mb-4">{selectedStory.title}</h2>
                <p className="text-lg leading-relaxed">{selectedStory.content}</p>
              </div>
            )}
          </div>

          {/* Navigation arrows */}
          {storyIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateStory('prev')}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
          
          {storyIndex < activeStories.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateStory('next')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}

          {/* Bottom interaction bar */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
            <div className="flex items-center justify-between text-white">
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
    );
  }

  return (
    <div className="h-full space-y-6">
      <AnimatedBackground>
        <div></div>
      </AnimatedBackground>
      
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <NeonText className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            Stories Network
          </NeonText>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <span>{activeStories.length} active stories</span>
            <span>{storyGroups.length} users sharing</span>
            {!isOffline && <Badge variant="default">Live</Badge>}
            {isOffline && <Badge variant="destructive">Offline</Badge>}
          </div>
        </div>
        
        {currentUser && (
          <GlowButton onClick={() => setShowCreateStory(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Story
          </GlowButton>
        )}
      </div>

      {/* Story carousel - user stories at top */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Active Stories
        </h4>
        
        <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
          {/* Current User's Story Creation Button */}
          {currentUser && (
            <div className="flex-shrink-0 text-center">
              <div
                onClick={() => setShowCreateStory(true)}
                className="relative w-20 h-20 rounded-full border-2 border-dashed border-cyan-400/50 hover:border-cyan-400 cursor-pointer flex items-center justify-center transition-all duration-300 hover:scale-105 bg-gradient-to-br from-cyan-500/10 to-purple-500/10"
              >
                <Plus className="h-8 w-8 text-cyan-400" />
              </div>
              <p className="text-xs text-center mt-2 font-medium">Your Story</p>
            </div>
          )}
          
          {/* User Stories */}
          {storyGroups.map((group) => (
            <div key={group.user.id} className="flex-shrink-0 text-center">
              <div
                onClick={() => handleStoryView(group.latestStory, activeStories.indexOf(group.latestStory))}
                className="relative w-20 h-20 rounded-full p-1 bg-gradient-to-br from-purple-500 via-cyan-500 to-pink-500 cursor-pointer transition-all duration-300 hover:scale-105 animate-pulse"
              >
                <div className="w-full h-full rounded-full bg-background p-1">
                  <Avatar className="w-full h-full">
                    <AvatarImage src={group.user.avatar} />
                    <AvatarFallback className="text-lg font-bold">
                      {group.user.alias.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                {/* Story count badge */}
                {group.stories.length > 1 && (
                  <Badge className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold bg-gradient-to-r from-purple-500 to-cyan-500">
                    {group.stories.length}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-center mt-2 font-medium truncate w-20">
                {group.user.alias}
              </p>
              <p className="text-xs text-center text-muted-foreground">
                {formatTimeAgo(group.latestStory.createdAt)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Stories Grid */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold">Recent Stories</h4>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <FuturisticCard key={i} className="h-48 animate-pulse bg-muted" />
            ))}
          </div>
        ) : activeStories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeStories.slice(0, 9).map((story, index) => (
              <FuturisticCard
                key={story.id}
                className="cursor-pointer group hover:scale-105 transition-all duration-300 overflow-hidden"
                onClick={() => handleStoryView(story, index)}
              >
                <div className="h-48 relative">
                  {story.mediaUrl ? (
                    <img
                      src={story.mediaUrl}
                      alt={story.title}
                      className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-cyan-400" />
                    </div>
                  )}
                  
                  <div className="p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={story.user?.avatar} />
                        <AvatarFallback className="text-xs">
                          {story.user?.alias?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{story.user?.alias}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatTimeAgo(story.createdAt)}
                      </span>
                    </div>
                    
                    <h5 className="font-semibold text-sm mb-1 line-clamp-1">{story.title}</h5>
                    <p className="text-xs text-muted-foreground line-clamp-2">{story.content}</p>
                    
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {story.views || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {story.likes || 0}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {Math.round((story.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60))}h left
                      </Badge>
                    </div>
                  </div>
                </div>
              </FuturisticCard>
            ))}
          </div>
        ) : (
          <FuturisticCard className="text-center p-12">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Stories Yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to share a story with the network!
            </p>
            {currentUser && (
              <GlowButton onClick={() => setShowCreateStory(true)}>
                Create First Story
              </GlowButton>
            )}
          </FuturisticCard>
        )}
      </div>

      {/* Create Story Dialog */}
      <Dialog open={showCreateStory} onOpenChange={setShowCreateStory}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Create New Story
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Story Title</label>
              <Input
                placeholder="What's your story about?"
                value={newStoryTitle}
                onChange={(e) => setNewStoryTitle(e.target.value)}
                maxLength={100}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Content</label>
              <Textarea
                placeholder="Share your thoughts, experiences, or updates..."
                value={newStoryContent}
                onChange={(e) => setNewStoryContent(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {newStoryContent.length}/500 characters
              </p>
            </div>
            
            {/* Media Upload */}
            <div>
              <label className="text-sm font-medium mb-2 block">Media (Optional)</label>
              <div className="border-2 border-dashed border-muted rounded-lg p-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {mediaPreview ? (
                  <div className="relative">
                    {selectedFile?.type.startsWith('video/') ? (
                      <video src={mediaPreview} className="w-full h-32 object-cover rounded" controls />
                    ) : (
                      <img src={mediaPreview} alt="Preview" className="w-full h-32 object-cover rounded" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedFile(null);
                        setMediaPreview(null);
                      }}
                      className="absolute top-1 right-1"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="text-center cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex justify-center space-x-4 mb-2">
                      <Camera className="h-6 w-6 text-muted-foreground" />
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      <Video className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Click to add photos or videos
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateStory(false)}
                disabled={createStoryMutation.isPending}
              >
                Cancel
              </Button>
              <GlowButton
                onClick={handleCreateStory}
                disabled={createStoryMutation.isPending || !newStoryTitle.trim() || !newStoryContent.trim()}
                className="flex items-center gap-2"
              >
                {createStoryMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Share Story
                  </>
                )}
              </GlowButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}