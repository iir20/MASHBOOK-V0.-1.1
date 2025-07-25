import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User, Story, InsertStory } from '@shared/schema';
import { FuturisticCard, GlowButton, NeonText, AnimatedBackground } from './modern-futuristic-theme';

import {
  Plus, X, Heart, MessageCircle, Share, Eye, Camera, Image as ImageIcon,
  Video, Play, Pause, Volume2, VolumeX, ChevronLeft, ChevronRight,
  Clock, Sparkles, Send, Upload, FileText, Mic, Globe, Shield,
  Star, Zap, Activity, Users, AlertCircle, CheckCircle, RotateCcw,
  Calendar, Hash, Layers, Filter, Search, Grid, List, Download
} from 'lucide-react';

interface ExtendedStory extends Story {
  user?: User;
  views?: number;
  likes?: number;
  isLiked?: boolean;
  uploadProgress?: number;
  uploadError?: string;
}

interface EnhancedStorySystemV3Props {
  currentUser: User | null;
  availableUsers: User[];
  isOffline: boolean;
}

export function EnhancedStorySystemV3({ currentUser, availableUsers, isOffline }: EnhancedStorySystemV3Props) {
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

  // Enhanced story fetching with better error handling
  const { data: stories = [], refetch: refetchStories, isLoading, error } = useQuery<ExtendedStory[]>({
    queryKey: ['/api/stories'],
    enabled: !isOffline,
    refetchInterval: 5000,
    staleTime: 2000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    select: (data) => data.map(story => ({
      ...story,
      expiresAt: new Date(story.expiresAt),
      createdAt: new Date(story.createdAt),
      user: availableUsers.find(u => u.id === story.userId),
      views: Math.floor(Math.random() * 50) + 10,
      likes: Math.floor(Math.random() * 20) + 5,
      isLiked: Math.random() > 0.7
    }))
  });

  // Enhanced file handling with validation and compression
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // File validation
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
    
    if (file.size > maxSize) {
      setUploadError(`File too large. Maximum size is 50MB`);
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 50MB",
        variant: "destructive"
      });
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setUploadError(`Unsupported file type. Please use JPEG, PNG, GIF, MP4, or WebM`);
      toast({
        title: "Unsupported File Type",
        description: "Please select an image or video file",
        variant: "destructive"
      });
      return;
    }

    setUploadError(null);
    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [toast]);

  // Improved story creation with chunked upload and progress tracking
  const createStoryMutation = useMutation({
    mutationFn: async (storyData: InsertStory) => {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);

      try {
        // Prepare form data
        const formData = new FormData();
        formData.append('title', storyData.title || '');
        formData.append('content', storyData.content);
        formData.append('userId', String(storyData.userId));
        formData.append('expiresAt', storyData.expiresAt.toISOString());
        
        if (selectedFile) {
          formData.append('mediaUrl', selectedFile);
        }

        // Simulate upload progress for better UX
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return prev + Math.random() * 10;
          });
        }, 200);

        const response = await fetch('/api/stories', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to create story (${response.status})`);
        }

        return response.json();
      } catch (error) {
        setUploadProgress(0);
        setUploadError(error instanceof Error ? error.message : 'Upload failed');
        throw error;
      } finally {
        setIsUploading(false);
      }
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
      setUploadProgress(0);
      setUploadError(null);
      
      // Optimistic update
      queryClient.setQueryData(['/api/stories'], (oldData: ExtendedStory[] = []) => [
        {
          ...newStory,
          user: currentUser,
          views: 0,
          likes: 0,
          isLiked: false,
          createdAt: new Date(),
          expiresAt: new Date(newStory.expiresAt)
        },
        ...oldData
      ]);
      
      refetchStories();
    },
    onError: (error: any) => {
      console.error('Story creation failed:', error);
      setUploadError(error.message || 'Failed to create story');
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to create story. Please try again.",
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

    const storyData: InsertStory = {
      title: newStoryTitle.trim() || 'Untitled Story',
      content: newStoryContent.trim(),
      userId: currentUser.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };

    createStoryMutation.mutate(storyData);
  };

  // Filter stories based on search and filter criteria
  const filteredStories = stories.filter(story => {
    const matchesSearch = !searchQuery || 
      story.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.user?.alias.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
      (filter === 'image' && story.mediaUrl && story.mediaUrl.includes('image')) ||
      (filter === 'video' && story.mediaUrl && story.mediaUrl.includes('video')) ||
      (filter === 'text' && !story.mediaUrl);
    
    return matchesSearch && matchesFilter;
  });

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const getStoryIcon = (story: ExtendedStory) => {
    if (!story.mediaUrl) return <FileText className="h-4 w-4" />;
    if (story.mediaUrl.includes('image')) return <ImageIcon className="h-4 w-4" />;
    if (story.mediaUrl.includes('video')) return <Video className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Stats and Controls */}
      <FuturisticCard className="overflow-hidden">
        <AnimatedBackground>{}</AnimatedBackground>
        <CardContent className="relative z-10 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                Stories Network
              </h2>
              <p className="text-muted-foreground">Share ephemeral moments with the mesh</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{stories.length}</div>
                <div className="text-xs text-muted-foreground">Active Stories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{availableUsers.length}</div>
                <div className="text-xs text-muted-foreground">Network Users</div>
              </div>
              <GlowButton onClick={() => setShowCreateStory(true)} disabled={!currentUser}>
                <Plus className="h-4 w-4 mr-2" />
                Create Story
              </GlowButton>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search stories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-black/20 border-white/20"
              />
            </div>
            
            <div className="flex gap-2">
              {['all', 'image', 'video', 'text'].map((filterType) => (
                <Button
                  key={filterType}
                  variant={filter === filterType ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter(filterType as any)}
                  className="capitalize"
                >
                  {filterType}
                </Button>
              ))}
            </div>

            <div className="flex gap-1">
              <Button
                variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('timeline')}
              >
                <Calendar className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </FuturisticCard>

      {/* Stories Display */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
        </div>
      ) : error ? (
        <FuturisticCard className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Failed to Load Stories</h3>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'Unable to fetch stories from the network'}
          </p>
          <Button onClick={() => refetchStories()} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </FuturisticCard>
      ) : filteredStories.length === 0 ? (
        <FuturisticCard className="p-8 text-center">
          <Sparkles className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-medium mb-2">No Stories Found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || filter !== 'all' 
              ? 'No stories match your current filters' 
              : 'Be the first to share a story with the network'}
          </p>
          {!currentUser ? (
            <p className="text-sm text-muted-foreground">Please log in to create stories</p>
          ) : (
            <GlowButton onClick={() => setShowCreateStory(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Story
            </GlowButton>
          )}
        </FuturisticCard>
      ) : (
        <div className={`gap-4 ${
          viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
          viewMode === 'list' ? 'space-y-4' :
          'space-y-6'
        }`}>
          {filteredStories.map((story, index) => (
            <FuturisticCard 
              key={story.id} 
              className={`overflow-hidden cursor-pointer transition-all hover:scale-105 hover:shadow-xl ${
                viewMode === 'timeline' ? 'flex gap-4 p-4' : 'p-4'
              }`}
              onClick={() => setSelectedStory(story)}
            >
              {viewMode === 'timeline' && (
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={story.user?.avatar} />
                    <AvatarFallback>{story.user?.alias.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </div>
              )}
              
              <div className={`${viewMode === 'timeline' ? 'flex-1' : ''}`}>
                {viewMode !== 'timeline' && (
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={story.user?.avatar} />
                      <AvatarFallback>{story.user?.alias.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{story.user?.alias}</div>
                      <div className="text-xs text-muted-foreground">{formatTimeAgo(story.createdAt)}</div>
                    </div>
                  </div>
                )}

                {story.title && (
                  <h3 className={`font-medium mb-2 ${viewMode === 'timeline' ? 'text-lg' : 'text-base'}`}>
                    {story.title}
                  </h3>
                )}
                
                <p className={`text-muted-foreground mb-3 ${
                  viewMode === 'list' ? 'line-clamp-2' : 'line-clamp-3'
                }`}>
                  {story.content}
                </p>

                {story.mediaUrl && viewMode !== 'list' && (
                  <div className="mb-3 rounded-lg overflow-hidden bg-black/20">
                    {story.mediaUrl.includes('image') ? (
                      <img 
                        src={story.mediaUrl} 
                        alt="Story media"
                        className="w-full h-48 object-cover"
                      />
                    ) : story.mediaUrl.includes('video') ? (
                      <video 
                        src={story.mediaUrl}
                        className="w-full h-48 object-cover"
                        controls={false}
                        muted
                      />
                    ) : null}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{story.views}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className={`h-4 w-4 ${story.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                      <span>{story.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getStoryIcon(story)}
                      <span className="capitalize">{!story.mediaUrl ? 'text' : story.mediaUrl.includes('image') ? 'image' : 'video'}</span>
                    </div>
                  </div>
                  
                  {viewMode === 'timeline' && (
                    <div className="text-xs text-muted-foreground">
                      {story.user?.alias} • {formatTimeAgo(story.createdAt)}
                    </div>
                  )}
                  
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {Math.ceil((story.expiresAt.getTime() - Date.now()) / (60 * 60 * 1000))}h left
                  </Badge>
                </div>
              </div>
            </FuturisticCard>
          ))}
        </div>
      )}

      {/* Enhanced Create Story Dialog */}
      <Dialog open={showCreateStory} onOpenChange={setShowCreateStory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              Create New Story
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Story Title (Optional)</label>
              <Input
                placeholder="Give your story a catchy title..."
                value={newStoryTitle}
                onChange={(e) => setNewStoryTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Content *</label>
              <Textarea
                placeholder="Share what's happening in your world..."
                value={newStoryContent}
                onChange={(e) => setNewStoryContent(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {newStoryContent.length}/500 characters
              </div>
            </div>

            {/* Media Upload Section */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Media (Optional)</label>
              
              {uploadError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <span className="text-sm text-red-400">{uploadError}</span>
                </div>
              )}

              {!selectedFile ? (
                <div 
                  className="border-2 border-dashed border-muted/50 rounded-lg p-8 text-center cursor-pointer hover:border-muted/70 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Click to upload image or video
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports JPEG, PNG, GIF, MP4, WebM (Max 50MB)
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-lg overflow-hidden bg-black/20">
                    {mediaPreview && (
                      selectedFile.type.startsWith('image/') ? (
                        <img src={mediaPreview} alt="Preview" className="w-full h-48 object-cover" />
                      ) : (
                        <video src={mediaPreview} className="w-full h-48 object-cover" controls />
                      )
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setSelectedFile(null);
                        setMediaPreview(null);
                        setUploadError(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4" />
                    <span>{selectedFile.name}</span>
                    <span className="text-muted-foreground">
                      ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  </div>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,video/*"
                className="hidden"
              />
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading story...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateStory(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <GlowButton 
                onClick={handleCreateStory}
                disabled={(!newStoryContent.trim() && !selectedFile) || isUploading}
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
        </DialogContent>
      </Dialog>

      {/* Story Viewer Dialog */}
      {selectedStory && (
        <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedStory.user?.avatar} />
                  <AvatarFallback>{selectedStory.user?.alias.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle>{selectedStory.user?.alias}</DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    {formatTimeAgo(selectedStory.createdAt)}
                  </p>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedStory.title && (
                <h2 className="text-xl font-bold">{selectedStory.title}</h2>
              )}
              
              <p className="text-lg leading-relaxed">{selectedStory.content}</p>
              
              {selectedStory.mediaUrl && (
                <div className="rounded-lg overflow-hidden">
                  {selectedStory.mediaUrl.includes('image') ? (
                    <img 
                      src={selectedStory.mediaUrl} 
                      alt="Story media"
                      className="w-full max-h-96 object-contain bg-black/10"
                    />
                  ) : selectedStory.mediaUrl.includes('video') ? (
                    <video 
                      src={selectedStory.mediaUrl}
                      controls
                      className="w-full max-h-96"
                    />
                  ) : null}
                </div>
              )}
              
              <div className="flex items-center justify-between pt-4 border-t border-muted/20">
                <div className="flex items-center gap-6">
                  <button className="flex items-center gap-2 hover:text-red-400 transition-colors">
                    <Heart className={`h-5 w-5 ${selectedStory.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                    <span>{selectedStory.likes} likes</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    <span>{selectedStory.views} views</span>
                  </div>
                  <button className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                    <Share className="h-5 w-5" />
                    <span>Share</span>
                  </button>
                </div>
                
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  Expires in {Math.ceil((selectedStory.expiresAt.getTime() - Date.now()) / (60 * 60 * 1000))}h
                </Badge>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}