import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { User, InsertStory, Story } from '@shared/schema';
import { FuturisticCard, GlowButton, NeonText, AnimatedBackground } from './modern-futuristic-theme';

import {
  Sparkles, Plus, Clock, Eye, Heart, Share2, Camera, Video, FileText, Upload, 
  Play, Pause, Volume2, VolumeX, Maximize, Grid3X3, List, Timeline, Search, 
  Filter, TrendingUp, Zap, Star, Users, Globe, Lock, AlertCircle, CheckCircle,
  X, Loader2, Download, MoreHorizontal, Send
} from 'lucide-react';

interface ExtendedStory extends Story {
  user?: User;
  views: number;
  likes: number;
  isLiked: boolean;
}

interface EnhancedStorySystemV4Props {
  currentUser: User | null;
  availableUsers: User[];
  isOffline: boolean;
}

export function EnhancedStorySystemV4({ currentUser, availableUsers, isOffline }: EnhancedStorySystemV4Props) {
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [selectedStory, setSelectedStory] = useState<ExtendedStory | null>(null);
  const [newStoryContent, setNewStoryContent] = useState('');
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'timeline'>('timeline');
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'text'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stories = [], refetch: refetchStories, isLoading } = useQuery<ExtendedStory[]>({
    queryKey: ['/api/stories'],
    enabled: !isOffline,
    refetchInterval: 5000,
    select: (data: Story[]) => data.map((story: Story) => ({
      ...story,
      user: availableUsers.find(u => u.id === story.userId),
      views: Math.floor(Math.random() * 100),
      likes: Math.floor(Math.random() * 50),
      isLiked: Math.random() > 0.7
    }))
  });

  // Enhanced file handling with comprehensive validation
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Comprehensive file validation
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/ogg',
      'audio/mp3', 'audio/wav', 'audio/ogg'
    ];
    
    if (file.size > maxSize) {
      setUploadError(`File too large. Maximum size is 100MB, your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      toast({
        title: "File Too Large",
        description: `Please select a file smaller than 100MB. Your file: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        variant: "destructive"
      });
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setUploadError(`Unsupported file type: ${file.type}. Please use JPEG, PNG, GIF, WebP, MP4, WebM, OGG, MP3, or WAV`);
      toast({
        title: "Unsupported File Type",
        description: `File type ${file.type} is not supported. Please select an image, video, or audio file.`,
        variant: "destructive"
      });
      return;
    }

    setUploadError(null);
    setSelectedFile(file);
    
    // Create preview with proper error handling
    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaPreview(e.target?.result as string);
    };
    reader.onerror = () => {
      setUploadError('Failed to read file. Please try again.');
      toast({
        title: "File Read Error",
        description: "Could not read the selected file. Please try again.",
        variant: "destructive"
      });
    };
    reader.readAsDataURL(file);
  }, [toast]);

  // Improved story creation with better error handling and progress tracking
  const createStoryMutation = useMutation({
    mutationFn: async (storyData: InsertStory) => {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);

      try {
        let mediaUrl = '';
        
        // Handle file upload if present
        if (selectedFile) {
          const formData = new FormData();
          formData.append('file', selectedFile);
          
          // Simulate realistic upload progress
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
              if (prev >= 85) {
                clearInterval(progressInterval);
                return prev;
              }
              return prev + Math.random() * 15;
            });
          }, 300);

          try {
            // In a real implementation, this would upload to a file storage service
            // For now, we'll use the file name as a placeholder
            mediaUrl = `uploads/${Date.now()}-${selectedFile.name}`;
            clearInterval(progressInterval);
            setUploadProgress(90);
          } catch (uploadError) {
            clearInterval(progressInterval);
            throw new Error('File upload failed. Please try again.');
          }
        }

        // Create story data
        const finalStoryData = {
          ...storyData,
          mediaUrl: mediaUrl || null
        };

        setUploadProgress(95);

        const response = await apiRequest('/api/stories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(finalStoryData),
        });

        setUploadProgress(100);
        return response;
      } catch (error) {
        setUploadProgress(0);
        if (error instanceof Error) {
          setUploadError(error.message);
          throw error;
        }
        const errorMessage = 'Failed to create story. Please check your connection and try again.';
        setUploadError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: (newStory) => {
      toast({
        title: "🚀 Story Created Successfully!",
        description: "Your story is now live and visible across the mesh network.",
      });
      
      setShowCreateStory(false);
      setNewStoryContent('');
      setNewStoryTitle('');
      setSelectedFile(null);
      setMediaPreview(null);
      setUploadProgress(0);
      setUploadError(null);
      
      // Optimistic update with proper typing
      queryClient.setQueryData(['/api/stories'], (oldData: ExtendedStory[] = []) => [
        {
          ...newStory,
          user: currentUser,
          views: 0,
          likes: 0,
          isLiked: false,
          createdAt: new Date(),
          expiresAt: new Date(newStory.expiresAt)
        } as ExtendedStory,
        ...oldData
      ]);
      
      refetchStories();
    },
    onError: (error: any) => {
      console.error('Story creation failed:', error);
      const errorMessage = error.message || 'Failed to create story. Please try again.';
      setUploadError(errorMessage);
      toast({
        title: "❌ Upload Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const handleCreateStory = () => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create stories",
        variant: "destructive"
      });
      return;
    }

    if (!newStoryContent.trim() && !selectedFile) {
      toast({
        title: "Content Required", 
        description: "Please add some content or media to your story",
        variant: "destructive"
      });
      return;
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Story expires in 24 hours

    createStoryMutation.mutate({
      userId: currentUser.id,
      title: newStoryTitle.trim() || 'Untitled Story',
      content: newStoryContent.trim(),
      expiresAt
    });
  };

  // Filter and search functionality
  const filteredStories = stories.filter(story => {
    const matchesSearch = !searchQuery || 
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.user?.alias.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
      (filter === 'image' && story.mediaUrl?.includes('image')) ||
      (filter === 'video' && story.mediaUrl?.includes('video')) ||
      (filter === 'text' && !story.mediaUrl);
    
    return matchesSearch && matchesFilter;
  });

  // Story viewer navigation
  const nextStory = () => {
    if (storyIndex < filteredStories.length - 1) {
      setStoryIndex(storyIndex + 1);
      setSelectedStory(filteredStories[storyIndex + 1]);
    }
  };

  const prevStory = () => {
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1);
      setSelectedStory(filteredStories[storyIndex - 1]);
    }
  };

  return (
    <div className="space-y-6">
      <AnimatedBackground>
        <div className="flex items-center justify-between">
          <div>
            <NeonText className="text-2xl font-bold">📖 Mesh Stories</NeonText>
            <p className="text-sm text-muted-foreground mt-1">
              Share ephemeral moments across the mesh network
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-cyan-400/50">
              {isOffline ? '📡 Offline' : '🌐 Live'}
            </Badge>
            <GlowButton
              onClick={() => setShowCreateStory(true)}
              disabled={!currentUser || isOffline}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Story
            </GlowButton>
          </div>
        </div>
      </AnimatedBackground>

      {/* Search and Filter Controls */}
      <Card className="border-cyan-400/20 bg-black/40 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search stories, users, or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-black/50 border-cyan-400/30"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value as any)}
                className="bg-black/50 border border-cyan-400/30 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Types</option>
                <option value="text">Text Only</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
              </select>
            </div>
            <div className="flex items-center gap-1 bg-black/50 rounded-md p-1">
              <Button
                variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('timeline')}
              >
                <Timeline className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stories Display */}
      {isLoading ? (
        <Card className="border-cyan-400/20 bg-black/40 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-cyan-400" />
            <p className="text-muted-foreground">Loading stories from the mesh network...</p>
          </CardContent>
        </Card>
      ) : filteredStories.length === 0 ? (
        <Card className="border-cyan-400/20 bg-black/40 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <Sparkles className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Stories Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'No stories match your search criteria.' : 'Be the first to share a story on the mesh network!'}
            </p>
            {currentUser && !isOffline && (
              <GlowButton onClick={() => setShowCreateStory(true)}>
                Create Your First Story
              </GlowButton>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' :
          viewMode === 'list' ? 'space-y-4' :
          'space-y-6'
        }>
          {filteredStories.map((story) => (
            <FuturisticCard 
              key={story.id} 
              className="group cursor-pointer hover:border-cyan-400/50 transition-all duration-300"
              onClick={() => {
                setSelectedStory(story);
                setStoryIndex(filteredStories.indexOf(story));
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8 border border-cyan-400/30">
                      <AvatarImage src={story.user?.avatar} />
                      <AvatarFallback className="bg-cyan-400/20">
                        {story.user?.alias[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{story.user?.alias || 'Unknown User'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(story.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs border-cyan-400/50">
                    {story.mediaUrl ? '📎 Media' : '📝 Text'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-semibold text-cyan-100 mb-1">{story.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {story.content}
                  </p>
                </div>
                
                {story.mediaUrl && (
                  <div className="w-full h-32 bg-gradient-to-br from-cyan-400/10 to-purple-400/10 rounded-md flex items-center justify-center">
                    {story.mediaUrl.includes('video') ? (
                      <Video className="w-8 h-8 text-cyan-400" />
                    ) : (
                      <Camera className="w-8 h-8 text-cyan-400" />
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {story.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className={`w-3 h-3 ${story.isLiked ? 'fill-red-400 text-red-400' : ''}`} />
                      {story.likes}
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    Expires {new Date(story.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </FuturisticCard>
          ))}
        </div>
      )}

      {/* Create Story Dialog */}
      <Dialog open={showCreateStory} onOpenChange={setShowCreateStory}>
        <DialogContent className="max-w-md bg-black/95 border-cyan-400/30">
          <DialogHeader>
            <DialogTitle className="text-cyan-100">Create New Story</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="story-title">Title (Optional)</Label>
              <Input
                id="story-title"
                placeholder="Give your story a title..."
                value={newStoryTitle}
                onChange={(e) => setNewStoryTitle(e.target.value)}
                className="bg-black/50 border-cyan-400/30 mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="story-content">Content</Label>
              <Textarea
                id="story-content"
                placeholder="Share your thoughts with the mesh network..."
                value={newStoryContent}
                onChange={(e) => setNewStoryContent(e.target.value)}
                rows={4}
                className="bg-black/50 border-cyan-400/30 mt-1"
              />
            </div>

            {uploadError && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-md">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-sm text-red-400">{uploadError}</p>
              </div>
            )}

            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress.toFixed(0)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {mediaPreview && (
              <div className="relative">
                <div className="w-full h-32 bg-black/50 rounded-md overflow-hidden">
                  {selectedFile?.type.startsWith('image/') ? (
                    <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-8 h-8 text-cyan-400" />
                      <span className="ml-2 text-sm">{selectedFile?.name}</span>
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-1 right-1"
                  onClick={() => {
                    setSelectedFile(null);
                    setMediaPreview(null);
                    setUploadError(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,video/*,audio/*"
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex-1 border-cyan-400/30"
              >
                <Upload className="w-4 h-4 mr-2" />
                Add Media
              </Button>
              <GlowButton
                onClick={handleCreateStory}
                disabled={isUploading || (!newStoryContent.trim() && !selectedFile)}
                className="flex-1"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Share Story
              </GlowButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Story Viewer Dialog */}
      {selectedStory && (
        <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
          <DialogContent className="max-w-lg bg-black/95 border-cyan-400/30">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border border-cyan-400/30">
                    <AvatarImage src={selectedStory.user?.avatar} />
                    <AvatarFallback className="bg-cyan-400/20">
                      {selectedStory.user?.alias[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-cyan-100">{selectedStory.user?.alias || 'Unknown User'}</DialogTitle>
                    <p className="text-xs text-muted-foreground">
                      {new Date(selectedStory.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={prevStory}
                    disabled={storyIndex === 0}
                  >
                    ←
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {storyIndex + 1} / {filteredStories.length}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={nextStory}
                    disabled={storyIndex === filteredStories.length - 1}
                  >
                    →
                  </Button>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-cyan-100 mb-2">{selectedStory.title}</h3>
                <p className="text-sm leading-relaxed">{selectedStory.content}</p>
              </div>
              
              {selectedStory.mediaUrl && (
                <div className="w-full h-48 bg-gradient-to-br from-cyan-400/10 to-purple-400/10 rounded-md flex items-center justify-center">
                  {selectedStory.mediaUrl.includes('video') ? (
                    <Video className="w-12 h-12 text-cyan-400" />
                  ) : (
                    <Camera className="w-12 h-12 text-cyan-400" />
                  )}
                  <span className="ml-2 text-sm text-muted-foreground">Media content</span>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-3 border-t border-cyan-400/20">
                <div className="flex items-center gap-4">
                  <Button size="sm" variant="ghost" className="gap-1">
                    <Heart className={`w-4 h-4 ${selectedStory.isLiked ? 'fill-red-400 text-red-400' : ''}`} />
                    {selectedStory.likes}
                  </Button>
                  <Button size="sm" variant="ghost" className="gap-1">
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  <Eye className="w-3 h-3 inline mr-1" />
                  {selectedStory.views} views
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}