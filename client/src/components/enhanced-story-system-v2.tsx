import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
  Loader2,
  Image as ImageIcon,
  Film,
  FileAudio,
  Trash2
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

export function EnhancedStorySystemV2({ currentUser, availableUsers, isOffline }: EnhancedStorySystemProps) {
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [newStoryContent, setNewStoryContent] = useState('');
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch stories with real-time updates and better error handling
  const { data: stories = [], refetch: refetchStories, isLoading, error } = useQuery<Story[]>({
    queryKey: ['/api/stories'],
    enabled: !isOffline && !!currentUser,
    refetchInterval: 5000,
    staleTime: 2000,
    retry: 3,
    select: (data: any) => data.map((story: any) => ({
      ...story,
      expiresAt: new Date(story.expiresAt),
      createdAt: new Date(story.createdAt)
    }))
  });

  // Handle error separately
  useEffect(() => {
    if (error) {
      console.error('Failed to fetch stories:', error);
      toast({
        title: "Connection Error",
        description: "Failed to load stories. Retrying...",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  // Create story mutation with enhanced error handling and progress tracking
  const createStoryMutation = useMutation({
    mutationFn: async (storyData: InsertStory) => {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);

      try {
        const formData = new FormData();
        formData.append('title', storyData.title);
        formData.append('content', storyData.content);
        formData.append('userId', String(storyData.userId));
        
        // Set expiration to 24 hours from now
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        formData.append('expiresAt', expiresAt.toISOString());
        
        if (selectedFile) {
          formData.append('media', selectedFile);
        }

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return prev + Math.random() * 20;
          });
        }, 200);

        const response = await fetch('/api/stories', {
          method: 'POST',
          body: formData,
          headers: {
            // Don't set Content-Type for FormData - browser will set it with boundary
          }
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        const result = await response.json();
        return result;
      } catch (error: any) {
        setUploadError(error.message);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "Story Created!",
        description: "Your story has been shared successfully and will expire in 24 hours.",
      });
      
      // Reset form
      setShowCreateStory(false);
      setNewStoryContent('');
      setNewStoryTitle('');
      setSelectedFile(null);
      setMediaPreview(null);
      setUploadProgress(0);
      setUploadError(null);
      
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
    },
    onError: (error: any) => {
      console.error('Story creation failed:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to create story. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Handle file selection with validation
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'audio/mp3', 'audio/wav'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image, video, or audio file.",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview
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
        description: "Please login to create stories.",
        variant: "destructive"
      });
      return;
    }

    if (!newStoryTitle.trim() || !newStoryContent.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both title and content for your story.",
        variant: "destructive"
      });
      return;
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    createStoryMutation.mutate({
      title: newStoryTitle.trim(),
      content: newStoryContent.trim(),
      userId: currentUser.id,
      expiresAt
    });
  };

  // Get media type icon
  const getMediaIcon = (mediaType: string | null) => {
    if (!mediaType) return FileText;
    if (mediaType.startsWith('image/')) return ImageIcon;
    if (mediaType.startsWith('video/')) return Film;
    if (mediaType.startsWith('audio/')) return FileAudio;
    return FileText;
  };

  // Format time remaining
  const getTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const timeLeft = expiresAt.getTime() - now.getTime();
    
    if (timeLeft <= 0) return 'Expired';
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (isOffline) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-lg">Offline Mode</h3>
            <p className="text-gray-500">Stories are not available in offline mode.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Create Story Section */}
      <FuturisticCard className="relative overflow-hidden">
        <AnimatedBackground>{null}</AnimatedBackground>
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <NeonText>Share Your Story</NeonText>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          {!showCreateStory ? (
            <div className="flex items-center space-x-4">
              <Avatar className="w-10 h-10">
                <AvatarImage src={currentUser?.avatar || ''} />
                <AvatarFallback>
                  {currentUser?.alias?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <Button
                onClick={() => setShowCreateStory(true)}
                className="flex-1 justify-start text-left bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/30"
                variant="outline"
                disabled={!currentUser}
              >
                <Plus className="w-4 h-4 mr-2" />
                {currentUser ? "What's happening in the mesh?" : "Login to share stories"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Create New Story</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCreateStory(false);
                    setNewStoryTitle('');
                    setNewStoryContent('');
                    setSelectedFile(null);
                    setMediaPreview(null);
                    setUploadError(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="story-title">Title</Label>
                  <Input
                    id="story-title"
                    value={newStoryTitle}
                    onChange={(e) => setNewStoryTitle(e.target.value)}
                    placeholder="Give your story a title..."
                    maxLength={100}
                  />
                </div>

                <div>
                  <Label htmlFor="story-content">Content</Label>
                  <Textarea
                    id="story-content"
                    value={newStoryContent}
                    onChange={(e) => setNewStoryContent(e.target.value)}
                    placeholder="Share your thoughts, experiences, or ideas..."
                    rows={4}
                    maxLength={500}
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {newStoryContent.length}/500 characters
                  </div>
                </div>

                {/* Media Upload Section */}
                <div className="space-y-2">
                  <Label>Media (Optional)</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*,video/*,audio/*"
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                    </Button>
                    {selectedFile && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{selectedFile.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedFile(null);
                            setMediaPreview(null);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Media Preview */}
                  {mediaPreview && (
                    <div className="mt-2">
                      {selectedFile?.type.startsWith('image/') && (
                        <img
                          src={mediaPreview}
                          alt="Preview"
                          className="max-w-full h-32 object-cover rounded-lg"
                        />
                      )}
                      {selectedFile?.type.startsWith('video/') && (
                        <video
                          src={mediaPreview}
                          controls
                          className="max-w-full h-32 rounded-lg"
                        />
                      )}
                      {selectedFile?.type.startsWith('audio/') && (
                        <audio src={mediaPreview} controls className="w-full" />
                      )}
                    </div>
                  )}
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Uploading...</span>
                      <span className="text-sm">{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                )}

                {/* Upload Error */}
                {uploadError && (
                  <div className="flex items-center space-x-2 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{uploadError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Stories expire in 24 hours
                  </div>
                  <GlowButton
                    onClick={handleCreateStory}
                    disabled={!newStoryTitle.trim() || !newStoryContent.trim() || isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Share Story
                      </>
                    )}
                  </GlowButton>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </FuturisticCard>

      {/* Stories Feed */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            <span className="ml-2 text-gray-500">Loading stories...</span>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg">Connection Error</h3>
                <p className="text-gray-500">Failed to load stories. Check your connection.</p>
                <Button onClick={() => refetchStories()} className="mt-4">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (stories as Story[]).length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg">No Stories Yet</h3>
                <p className="text-gray-500">Be the first to share a story in the mesh network!</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(stories as Story[]).map((story) => {
              const MediaIcon = getMediaIcon(story.mediaType);
              const timeRemaining = getTimeRemaining(story.expiresAt);
              const isExpired = timeRemaining === 'Expired';

              return (
                <FuturisticCard
                  key={story.id}
                  className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                    isExpired ? 'opacity-50' : ''
                  }`}
                  onClick={() => !isExpired && setSelectedStory(story)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={story.user?.avatar || ''} />
                          <AvatarFallback>
                            {story.user?.alias?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{story.user?.alias || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">
                            {story.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className={`text-xs ${isExpired ? 'text-red-500' : 'text-gray-500'}`}>
                          {timeRemaining}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <h3 className="font-semibold text-sm line-clamp-2">{story.title}</h3>
                    <p className="text-xs text-gray-600 line-clamp-3">{story.content}</p>
                    
                    {story.mediaUrl && (
                      <div className="flex items-center space-x-1 text-xs text-purple-400">
                        <MediaIcon className="w-3 h-3" />
                        <span>Media attached</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>{story.views || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Heart className="w-3 h-3" />
                          <span>{story.likes || 0}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {story.mediaType ? story.mediaType.split('/')[0] : 'text'}
                      </Badge>
                    </div>
                  </CardContent>
                </FuturisticCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Story Viewer Dialog */}
      <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedStory && (
            <>
              <DialogHeader>
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedStory.user?.avatar || ''} />
                    <AvatarFallback>
                      {selectedStory.user?.alias?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle>{selectedStory.title}</DialogTitle>
                    <DialogDescription>
                      By {selectedStory.user?.alias || 'Unknown'} • {selectedStory.createdAt.toLocaleDateString()}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <p className="text-sm leading-relaxed">{selectedStory.content}</p>

                {selectedStory.mediaUrl && (
                  <div className="rounded-lg overflow-hidden">
                    {selectedStory.mediaType?.startsWith('image/') && (
                      <img
                        src={selectedStory.mediaUrl}
                        alt="Story media"
                        className="w-full max-h-96 object-cover"
                      />
                    )}
                    {selectedStory.mediaType?.startsWith('video/') && (
                      <video
                        src={selectedStory.mediaUrl}
                        controls
                        className="w-full max-h-96"
                      />
                    )}
                    {selectedStory.mediaType?.startsWith('audio/') && (
                      <audio src={selectedStory.mediaUrl} controls className="w-full" />
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{selectedStory.views || 0} views</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span>{selectedStory.likes || 0} likes</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>Expires in {getTimeRemaining(selectedStory.expiresAt)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}