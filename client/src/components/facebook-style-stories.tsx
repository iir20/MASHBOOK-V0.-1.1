import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

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
  Sparkles,
  Send,
  User,
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { User as UserType, Story, InsertStory } from '@shared/schema';

interface FacebookStory extends Story {
  user?: UserType;
  views?: number;
  likes?: number;
  isLiked?: boolean;
  timeRemaining?: string;
  timeAgo?: string;
}

interface FacebookStoriesProps {
  currentUser: UserType;
  availableUsers: UserType[];
  onMessageUser: (user: UserType) => void;
  onUserProfile: (user: UserType) => void;
}

export function FacebookStyleStories({ 
  currentUser, 
  availableUsers, 
  onMessageUser,
  onUserProfile 
}: FacebookStoriesProps) {
  const [stories, setStories] = useState<FacebookStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<FacebookStory | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [storyProgress, setStoryProgress] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  
  const [newStory, setNewStory] = useState({
    title: '',
    content: '',
    mediaUrl: '',
    duration: 24
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const storyIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch stories with real-time updates
  const { data: dbStories = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/stories'],
    enabled: !!currentUser,
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Create story mutation
  const createStoryMutation = useMutation({
    mutationFn: async (storyData: InsertStory) => {
      const response = await apiRequest('/api/stories', {
        method: 'POST',
        body: JSON.stringify(storyData)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to create story');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      setIsCreating(false);
      setNewStory({ title: '', content: '', mediaUrl: '', duration: 24 });
      toast({
        title: "Story Created!",
        description: "Your story has been shared with the network",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Story Creation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Process stories with enhanced metadata
  useEffect(() => {
    if (Array.isArray(dbStories) && dbStories.length > 0) {
      const processedStories = (dbStories as Story[]).map((story: Story) => {
        const user = availableUsers.find(u => u.id === story.userId) || currentUser;
        const expiresAt = new Date(story.expiresAt);
        const createdAt = new Date(story.createdAt);
        const now = new Date();
        
        const timeRemaining = Math.max(0, expiresAt.getTime() - now.getTime());
        const hoursLeft = Math.floor(timeRemaining / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        
        const timeAgo = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
        
        return {
          ...story,
          user,
          views: Math.floor(Math.random() * 100) + 10,
          likes: Math.floor(Math.random() * 50) + 5,
          isLiked: Math.random() > 0.6,
          timeRemaining: timeRemaining > 0 ? `${hoursLeft}h ${minutesLeft}m` : undefined,
          timeAgo: timeAgo < 1 ? 'Just now' : timeAgo < 24 ? `${timeAgo}h ago` : `${Math.floor(timeAgo/24)}d ago`
        };
      }).filter(story => story.timeRemaining); // Only show active stories

      setStories(processedStories);
    }
  }, [dbStories, availableUsers, currentUser]);

  // Auto-play story progression
  useEffect(() => {
    if (!selectedStory || !autoPlay) return;

    const duration = 5000; // 5 seconds per story
    let progress = 0;
    
    storyIntervalRef.current = setInterval(() => {
      progress += 100;
      setStoryProgress((progress / duration) * 100);
      
      if (progress >= duration) {
        handleNextStory();
      }
    }, 100);

    return () => {
      if (storyIntervalRef.current) {
        clearInterval(storyIntervalRef.current);
      }
    };
  }, [selectedStory, currentStoryIndex, autoPlay]);

  const handleNextStory = useCallback(() => {
    const currentUserStories = stories.filter(s => s.user?.id === selectedStory?.user?.id);
    const nextIndex = currentStoryIndex + 1;
    
    if (nextIndex < currentUserStories.length) {
      setCurrentStoryIndex(nextIndex);
      setSelectedStory(currentUserStories[nextIndex]);
      setStoryProgress(0);
    } else {
      // Move to next user's stories or close
      const currentUserIndex = availableUsers.findIndex(u => u.id === selectedStory?.user?.id);
      const nextUserIndex = currentUserIndex + 1;
      
      if (nextUserIndex < availableUsers.length) {
        const nextUser = availableUsers[nextUserIndex];
        const nextUserStories = stories.filter(s => s.user?.id === nextUser.id);
        if (nextUserStories.length > 0) {
          setCurrentStoryIndex(0);
          setSelectedStory(nextUserStories[0]);
          setStoryProgress(0);
        } else {
          setSelectedStory(null);
        }
      } else {
        setSelectedStory(null);
      }
    }
  }, [selectedStory, currentStoryIndex, stories, availableUsers]);

  const handleCreateStory = async () => {
    if (!newStory.title.trim() || !newStory.content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both title and content",
        variant: "destructive"
      });
      return;
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + newStory.duration);

    const storyData: InsertStory = {
      userId: currentUser.id,
      title: newStory.title,
      content: newStory.content,
      mediaUrl: newStory.mediaUrl || null,
      expiresAt
    };

    createStoryMutation.mutate(storyData);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setNewStory(prev => ({ ...prev, mediaUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openStory = (story: FacebookStory) => {
    setSelectedStory(story);
    setCurrentStoryIndex(0);
    setStoryProgress(0);
  };

  // Group stories by user
  const storiesByUser = availableUsers.map(user => ({
    user,
    stories: stories.filter(s => s.user?.id === user.id),
    hasStories: stories.some(s => s.user?.id === user.id)
  }));

  return (
    <div className="w-full h-full bg-background">
      {/* Stories Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Stories</h2>
          <Button
            onClick={() => setIsCreating(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Create Story
          </Button>
        </div>
      </div>

      {/* Stories Grid - Facebook Style */}
      <ScrollArea className="flex-1 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Create Story Card */}
          <Card 
            className="relative h-48 bg-gradient-to-b from-blue-600 to-blue-800 border-none cursor-pointer group overflow-hidden"
            onClick={() => setIsCreating(true)}
          >
            <CardContent className="p-0 h-full flex flex-col">
              <div className="flex-1 flex items-center justify-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="p-3 bg-white/90 backdrop-blur-sm">
                <p className="text-xs font-medium text-gray-800 text-center">Create Story</p>
              </div>
            </CardContent>
          </Card>

          {/* User Stories */}
          {storiesByUser.map(({ user, stories: userStories, hasStories }) => (
            <Card 
              key={user.id}
              className={`relative h-48 border-2 cursor-pointer group overflow-hidden ${
                hasStories 
                  ? 'border-blue-500 bg-gradient-to-b from-gray-900 to-gray-800' 
                  : 'border-gray-600 bg-gradient-to-b from-gray-800 to-gray-700 opacity-60'
              }`}
              onClick={() => {
                if (hasStories && userStories.length > 0) {
                  openStory(userStories[0]);
                } else {
                  onUserProfile(user);
                }
              }}
            >
              <CardContent className="p-0 h-full relative">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70" />
                
                {/* User Avatar */}
                <div className="absolute top-3 left-3">
                  <div className={`p-1 rounded-full ${hasStories ? 'bg-blue-500' : 'bg-gray-500'}`}>
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.alias.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                {/* Story Count */}
                {hasStories && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="text-xs bg-black/50 text-white">
                      {userStories.length}
                    </Badge>
                  </div>
                )}

                {/* User Info */}
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-white text-xs font-medium truncate">{user.alias}</p>
                  {hasStories && userStories[0] && (
                    <p className="text-white/70 text-xs">{userStories[0].timeAgo}</p>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="absolute bottom-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-6 h-6 p-0 bg-black/50 hover:bg-black/70"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMessageUser(user);
                    }}
                  >
                    <MessageSquare className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Story Viewer Modal */}
      {selectedStory && (
        <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
          <DialogContent className="max-w-md h-[80vh] p-0 bg-black border-none">
            <div className="relative h-full bg-gradient-to-b from-gray-900 to-black">
              {/* Progress Bar */}
              <div className="absolute top-4 left-4 right-4 z-10">
                <Progress value={storyProgress} className="h-1 bg-white/20" />
              </div>

              {/* Header */}
              <div className="absolute top-8 left-4 right-4 z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={selectedStory.user?.avatar} />
                    <AvatarFallback>{selectedStory.user?.alias.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white text-sm font-medium">{selectedStory.user?.alias}</p>
                    <p className="text-white/70 text-xs">{selectedStory.timeAgo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20 p-1"
                    onClick={() => setAutoPlay(!autoPlay)}
                  >
                    {autoPlay ? <Clock className="w-4 h-4" /> : <Clock className="w-4 h-4 opacity-50" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20 p-1"
                    onClick={() => setSelectedStory(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Story Content */}
              <div className="h-full flex items-center justify-center p-8 pt-20 pb-20">
                <div className="text-center">
                  <h3 className="text-white text-xl font-semibold mb-4">{selectedStory.title}</h3>
                  <p className="text-white/90 text-sm leading-relaxed mb-6">{selectedStory.content}</p>
                  
                  {selectedStory.mediaUrl && (
                    <div className="mb-6">
                      <img 
                        src={selectedStory.mediaUrl} 
                        alt="Story media"
                        className="max-w-full h-auto rounded-lg"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-4 text-white/70 text-sm">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {selectedStory.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {selectedStory.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {selectedStory.timeRemaining}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="absolute bottom-6 left-4 right-4 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={() => onUserProfile(selectedStory.user!)}
                >
                  <User className="w-4 h-4 mr-1" />
                  Profile
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => onMessageUser(selectedStory.user!)}
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Message
                </Button>
              </div>

              {/* Touch Areas for Navigation */}
              <div className="absolute inset-0 flex">
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Previous story logic here
                  }}
                />
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextStory();
                  }}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Story Modal */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Create Your Story
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Story Title</Label>
              <Input
                id="title"
                value={newStory.title}
                onChange={(e) => setNewStory(prev => ({ ...prev, title: e.target.value }))}
                placeholder="What's your story about?"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="content">Story Content</Label>
              <Textarea
                id="content"
                value={newStory.content}
                onChange={(e) => setNewStory(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Share your thoughts, experiences, or updates..."
                className="mt-1 min-h-[100px]"
              />
            </div>

            <div>
              <Label>Add Media (Optional)</Label>
              <div className="mt-1 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Image className="w-4 h-4 mr-1" />
                  Photo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Video className="w-4 h-4 mr-1" />
                  Video
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {newStory.mediaUrl && (
              <div className="relative">
                <img 
                  src={newStory.mediaUrl} 
                  alt="Story preview"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={() => setNewStory(prev => ({ ...prev, mediaUrl: '' }))}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setIsCreating(false)}
                disabled={createStoryMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateStory}
                disabled={createStoryMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createStoryMutation.isPending ? 'Creating...' : 'Share Story'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}