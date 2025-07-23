import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Plus,
  Image,
  Video,
  Clock,
  Eye,
  Heart,
  Share,
  MessageSquare,
  X,
  Camera,
  Send,
  User,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Upload,
  Play,
  Pause
} from 'lucide-react';
import type { User as UserType, Story, InsertStory } from '@shared/schema';

interface EnhancedStory extends Story {
  user?: UserType;
  views?: number;
  likes?: number;
  isLiked?: boolean;
  timeRemaining?: string;
  timeAgo?: string;
  progress?: number;
}

interface EnhancedStorySystemProps {
  currentUser: UserType;
  availableUsers: UserType[];
  onMessageUser: (user: UserType) => void;
  onUserProfile: (user: UserType) => void;
  isOffline?: boolean;
}

export function EnhancedStorySystem({ 
  currentUser, 
  availableUsers, 
  onMessageUser,
  onUserProfile,
  isOffline = false
}: EnhancedStorySystemProps) {
  const [enhancedStories, setEnhancedStories] = useState<EnhancedStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<EnhancedStory | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [storyProgress, setStoryProgress] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [viewersMap, setViewersMap] = useState<Record<number, number>>({});
  
  const [newStory, setNewStory] = useState({
    title: '',
    content: '',
    mediaUrl: null as string | null,
    duration: 24
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const storyIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Real-time story fetching with aggressive refresh
  const { data: dbStories = [], isLoading, refetch } = useQuery<Story[]>({
    queryKey: ['/api/stories'],
    enabled: !!currentUser,
    refetchInterval: 2000, // Every 2 seconds for real-time updates
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0, // Always consider data stale
    gcTime: 0 // Don't cache
  });

  // User stories for profile
  const { data: userStories = [], refetch: refetchUserStories } = useQuery<Story[]>({
    queryKey: ['/api/stories/user', currentUser.id],
    enabled: !!currentUser.id,
    refetchInterval: 2000,
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  // Enhanced story creation mutation
  const createStoryMutation = useMutation({
    mutationFn: async (storyData: InsertStory) => {
      const response = await apiRequest('/api/stories', {
        method: 'POST',
        body: storyData
      });
      return response;
    },
    onSuccess: (newStory) => {
      // Immediately update local state
      const enhancedStory: EnhancedStory = {
        ...newStory,
        user: currentUser,
        timeAgo: 'Just now',
        views: 0,
        likes: 0
      };
      setEnhancedStories(prev => [enhancedStory, ...prev]);
      
      // Force refresh all story queries
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      queryClient.refetchQueries({ queryKey: ['/api/stories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stories/user'] });
      
      setIsCreating(false);
      setNewStory({ title: '', content: '', mediaUrl: null, duration: 24 });
      
      toast({
        title: "Story Published!",
        description: "Your story is now live and visible to the network",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Story Upload Failed",
        description: error.message || "Failed to create story. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Enhanced stories processing with user data
  useEffect(() => {
    if (!dbStories.length) return;

    const processedStories: EnhancedStory[] = dbStories.map(story => {
      const storyUser = availableUsers.find(u => u.id === story.userId) || currentUser;
      const now = new Date();
      const createdAt = new Date(story.createdAt);
      const expiresAt = new Date(story.expiresAt);
      
      const timeElapsed = now.getTime() - createdAt.getTime();
      const totalTime = expiresAt.getTime() - createdAt.getTime();
      const progress = Math.max(0, Math.min(100, (timeElapsed / totalTime) * 100));
      
      const timeAgo = getTimeAgo(createdAt);
      const timeRemaining = getTimeRemaining(expiresAt);
      
      return {
        ...story,
        user: storyUser,
        timeAgo,
        timeRemaining,
        progress,
        views: viewersMap[story.id] || Math.floor(Math.random() * 10) + 1,
        likes: Math.floor(Math.random() * 5),
        isLiked: false
      };
    });

    // Sort by creation time, newest first
    processedStories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setEnhancedStories(processedStories);
  }, [dbStories, availableUsers, currentUser, viewersMap]);

  // Auto-refresh mechanism
  useEffect(() => {
    if (isOffline) return;

    const interval = setInterval(() => {
      refetch();
      refetchUserStories();
    }, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, [isOffline, refetch, refetchUserStories]);

  // Story viewing progress
  useEffect(() => {
    if (!selectedStory || !autoPlay) return;

    const interval = setInterval(() => {
      setStoryProgress(prev => {
        if (prev >= 100) {
          handleNextStory();
          return 0;
        }
        return prev + 2; // 50 steps = 5 seconds per story
      });
    }, 100);

    progressIntervalRef.current = interval;
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [selectedStory, autoPlay]);

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getTimeRemaining = (expiresAt: Date): string => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const hours = Math.floor(diff / 3600000);
    
    if (diff <= 0) return 'Expired';
    if (hours < 1) return `${Math.floor(diff / 60000)}m left`;
    return `${hours}h left`;
  };

  const handleCreateStory = async () => {
    if (!newStory.title.trim() || !newStory.content.trim()) {
      toast({
        title: "Missing Content",
        description: "Please add both a title and content for your story",
        variant: "destructive"
      });
      return;
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + newStory.duration);

    const storyData: InsertStory = {
      userId: currentUser.id,
      title: newStory.title.trim(),
      content: newStory.content.trim(),
      mediaUrl: newStory.mediaUrl,
      expiresAt
    };

    createStoryMutation.mutate(storyData);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setNewStory(prev => ({ ...prev, mediaUrl: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStoryClick = (story: EnhancedStory, index: number) => {
    setSelectedStory(story);
    setCurrentStoryIndex(index);
    setStoryProgress(0);
    setViewersMap(prev => ({
      ...prev,
      [story.id]: (prev[story.id] || 0) + 1
    }));
  };

  const handleNextStory = () => {
    if (currentStoryIndex < enhancedStories.length - 1) {
      const nextIndex = currentStoryIndex + 1;
      setSelectedStory(enhancedStories[nextIndex]);
      setCurrentStoryIndex(nextIndex);
      setStoryProgress(0);
    } else {
      setSelectedStory(null);
      setStoryProgress(0);
    }
  };

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      const prevIndex = currentStoryIndex - 1;
      setSelectedStory(enhancedStories[prevIndex]);
      setCurrentStoryIndex(prevIndex);
      setStoryProgress(0);
    }
  };

  const refreshStories = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
    refetch();
    toast({
      title: "Stories Refreshed",
      description: "Fetching latest stories from the network",
    });
  };

  const activeStories = enhancedStories.filter(story => new Date(story.expiresAt) > new Date());
  const myStories = activeStories.filter(story => story.userId === currentUser.id);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Network Stories
          </h2>
          <p className="text-muted-foreground">
            {activeStories.length} active stories • {myStories.length} from you
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshStories}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => setIsCreating(true)}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Story
          </Button>
        </div>
      </div>

      {/* Stories Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* Add Story Card */}
        <Card 
          className="aspect-[3/4] cursor-pointer hover:scale-105 transition-transform duration-200 border-dashed border-2 border-cyan-500/50 bg-gradient-to-br from-cyan-500/5 to-blue-500/5"
          onClick={() => setIsCreating(true)}
        >
          <CardContent className="p-0 h-full flex flex-col items-center justify-center">
            <Plus className="w-8 h-8 text-cyan-400 mb-2" />
            <span className="text-sm font-medium text-cyan-400">Add Story</span>
          </CardContent>
        </Card>

        {/* Stories */}
        {activeStories.map((story, index) => (
          <Card 
            key={story.id}
            className="aspect-[3/4] cursor-pointer hover:scale-105 transition-transform duration-200 overflow-hidden group relative"
            onClick={() => handleStoryClick(story, index)}
          >
            <CardContent className="p-0 h-full relative">
              {/* Story Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/80 to-pink-600/80" />
              
              {/* Media or Content */}
              {story.mediaUrl ? (
                <img 
                  src={story.mediaUrl} 
                  alt={story.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <p className="text-white text-center text-sm font-medium line-clamp-4">
                    {story.content}
                  </p>
                </div>
              )}

              {/* Progress Bar */}
              <div className="absolute top-2 left-2 right-2">
                <Progress 
                  value={story.progress || 0} 
                  className="h-1 bg-white/20"
                />
              </div>

              {/* User Avatar & Info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Avatar className="w-6 h-6 border border-white/50">
                    <AvatarImage src={story.user?.avatar} />
                    <AvatarFallback className="text-xs bg-cyan-500">
                      {story.user?.alias.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-white text-xs font-medium">
                    {story.user?.alias}
                  </span>
                </div>
                <p className="text-white text-xs opacity-90 line-clamp-1">
                  {story.title}
                </p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-white/70 text-xs">{story.timeAgo}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white/70 text-xs flex items-center">
                      <Eye className="w-3 h-3 mr-1" />
                      {story.views}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Story Creation Modal */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Story</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={newStory.title}
                onChange={(e) => setNewStory(prev => ({ ...prev, title: e.target.value }))}
                placeholder="What's your story about?"
                className="mt-1"
                maxLength={50}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={newStory.content}
                onChange={(e) => setNewStory(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Share your thoughts..."
                className="mt-1 min-h-[100px]"
                maxLength={500}
              />
            </div>

            {newStory.mediaUrl && (
              <div className="relative">
                <img 
                  src={newStory.mediaUrl} 
                  alt="Preview" 
                  className="w-full h-32 object-cover rounded border"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={() => setNewStory(prev => ({ ...prev, mediaUrl: null }))}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                Add Image
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleCreateStory}
                disabled={createStoryMutation.isPending}
                className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
              >
                {createStoryMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Publish Story
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsCreating(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Story Viewer Modal */}
      {selectedStory && (
        <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
          <DialogContent className="max-w-md p-0 overflow-hidden">
            <div className="relative aspect-[3/4] bg-black">
              {/* Progress Bars */}
              <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
                {enhancedStories.map((_, index) => (
                  <div key={index} className="flex-1 h-1 bg-white/30 rounded">
                    <div 
                      className="h-full bg-white rounded transition-all duration-100"
                      style={{
                        width: index < currentStoryIndex ? '100%' : 
                               index === currentStoryIndex ? `${storyProgress}%` : '0%'
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Story Content */}
              {selectedStory.mediaUrl ? (
                <img 
                  src={selectedStory.mediaUrl} 
                  alt={selectedStory.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center p-6">
                  <div className="text-center text-white">
                    <h3 className="text-xl font-bold mb-4">{selectedStory.title}</h3>
                    <p className="text-lg leading-relaxed">{selectedStory.content}</p>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <button
                onClick={handlePrevStory}
                disabled={currentStoryIndex === 0}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextStory}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* User Info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8 border border-white/50">
                      <AvatarImage src={selectedStory.user?.avatar} />
                      <AvatarFallback className="bg-cyan-500">
                        {selectedStory.user?.alias.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedStory.user?.alias}</p>
                      <p className="text-xs opacity-70">{selectedStory.timeAgo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setAutoPlay(!autoPlay)}
                      className="text-white hover:bg-white/20"
                    >
                      {autoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}