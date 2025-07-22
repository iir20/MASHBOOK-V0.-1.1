import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

import { 
  Plus,
  Image,
  Video,
  Mic,
  FileText,
  Clock,
  Eye,
  Heart,
  Share,
  Download,
  Trash2,
  Edit,
  Send,
  Camera,
  Globe,
  Lock,
  Users,
  Timer,
  Zap,
  Sparkles,
  Layers3,
  Radio,
  User
} from 'lucide-react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { User as UserType, Story, InsertStory } from '@shared/schema';

interface EnhancedStory extends Story {
  user?: UserType;
  views?: number;
  likes?: number;
  isLiked?: boolean;
  timeRemaining?: number;
}

interface EnhancedStoriesProps {
  currentUser: UserType;
  availableUsers: UserType[];
}

export function EnhancedStoriesSystem({ currentUser, availableUsers }: EnhancedStoriesProps) {
  const [selectedStory, setSelectedStory] = useState<EnhancedStory | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [stories, setStories] = useState<EnhancedStory[]>([]);
  const [filter, setFilter] = useState<'all' | 'following' | 'mine'>('all');
  const [storyProgress, setStoryProgress] = useState(0);
  
  const [newStory, setNewStory] = useState({
    title: '',
    content: '',
    mediaUrl: '',
    duration: 24, // hours
    type: 'text' as 'text' | 'image' | 'video'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get stories from database
  const { data: dbStories = [], isLoading } = useQuery({
    queryKey: ['/api/stories'],
    enabled: !!currentUser
  });

  // Enhanced stories with user data and metadata
  useEffect(() => {
    if (Array.isArray(dbStories) && dbStories.length > 0) {
      const enhancedStories: EnhancedStory[] = (dbStories as Story[]).map((story: Story) => {
        const user = availableUsers.find(u => u.id === story.userId) || currentUser;
        const expiresAt = new Date(story.expiresAt);
        const now = new Date();
        const timeRemaining = Math.max(0, expiresAt.getTime() - now.getTime());
        
        return {
          ...story,
          user,
          views: Math.floor(Math.random() * 50) + 1,
          likes: Math.floor(Math.random() * 20) + 1,
          isLiked: Math.random() > 0.7,
          timeRemaining
        };
      });
      
      // Filter out expired stories
      const activeStories = enhancedStories.filter(story => story.timeRemaining && story.timeRemaining > 0);
      setStories(activeStories);
    }
  }, [dbStories, availableUsers, currentUser]);

  // Story viewing animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedStory) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;
    const duration = 15000; // 15 seconds per story

    const animate = () => {
      time += 16; // ~60fps
      const progress = Math.min(time / duration, 1);
      setStoryProgress(progress * 100);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw animated background
      ctx.save();
      
      // Gradient background
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
      );
      gradient.addColorStop(0, `hsla(${time * 0.1}, 70%, 20%, 0.8)`);
      gradient.addColorStop(1, `hsla(${time * 0.05 + 120}, 70%, 10%, 0.4)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Floating particles
      for (let i = 0; i < 20; i++) {
        const x = (Math.sin(time * 0.001 + i) * 100 + canvas.width / 2);
        const y = (Math.cos(time * 0.0015 + i * 0.5) * 50 + canvas.height / 2);
        const size = Math.sin(time * 0.01 + i) * 2 + 3;
        
        ctx.fillStyle = `hsla(${i * 30 + time * 0.1}, 70%, 60%, 0.7)`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        // Auto-advance to next story
        const currentIndex = stories.findIndex(s => s.id === selectedStory?.id);
        if (currentIndex < stories.length - 1) {
          setSelectedStory(stories[currentIndex + 1]);
          time = 0;
          animationId = requestAnimationFrame(animate);
        } else {
          setSelectedStory(null);
        }
      }
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [selectedStory, stories]);

  // Create story mutation
  const createStoryMutation = useMutation({
    mutationFn: async (storyData: InsertStory) => {
      return await apiRequest('/api/stories', {
        method: 'POST',
        body: JSON.stringify(storyData)
      });
    },
    onSuccess: (newStory) => {
      toast({
        title: "Story Created",
        description: `Your story "${newStory.title}" is now live`,
      });
      setIsCreating(false);
      setNewStory({ title: '', content: '', mediaUrl: '', duration: 24, type: 'text' });
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
    },
    onError: (error: any) => {
      toast({
        title: "Story Creation Failed",
        description: error.message || "Failed to create story",
        variant: "destructive",
      });
    }
  });

  const handleCreateStory = () => {
    if (!newStory.title.trim() || !newStory.content.trim()) {
      toast({
        title: "Missing Content",
        description: "Please provide both title and content for your story",
        variant: "destructive",
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

  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // In a real app, you'd upload to a service
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setNewStory(prev => ({ 
        ...prev, 
        mediaUrl: result,
        type: file.type.startsWith('video/') ? 'video' : 'image'
      }));
    };
    reader.readAsDataURL(file);
  };

  const formatTimeRemaining = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const filteredStories = stories.filter(story => {
    switch (filter) {
      case 'mine':
        return story.userId === currentUser.id;
      case 'following':
        // In a real app, you'd have a following system
        return story.userId !== currentUser.id;
      default:
        return true;
    }
  });

  const StoryCard = ({ story }: { story: EnhancedStory }) => (
    <div 
      className="relative group cursor-pointer"
      onClick={() => setSelectedStory(story)}
    >
      <Card className="bg-black/50 border-purple-500/20 backdrop-blur-sm overflow-hidden hover:border-purple-500/50 transition-all duration-300">
        <div className="relative">
          {/* Story thumbnail */}
          <div className="h-48 bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center">
            {story.mediaUrl ? (
              story.content.includes('image') || story.mediaUrl.startsWith('data:image') ? (
                <img 
                  src={story.mediaUrl} 
                  alt={story.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Video className="w-12 h-12 text-purple-300" />
              )
            ) : (
              <div className="text-center p-4">
                <FileText className="w-8 h-8 text-purple-300 mx-auto mb-2" />
                <p className="text-purple-200 text-sm line-clamp-3">{story.content}</p>
              </div>
            )}
          </div>
          
          {/* User avatar overlay */}
          <div className="absolute top-3 left-3">
            <Avatar className="w-10 h-10 border-2 border-purple-500">
              <AvatarImage src={story.user?.avatar} alt={story.user?.alias} />
              <AvatarFallback className="bg-purple-600 text-white">
                {story.user?.alias.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          
          {/* Time remaining */}
          <div className="absolute top-3 right-3">
            <Badge className="bg-black/70 text-purple-300 border-purple-500/50">
              <Timer className="w-3 h-3 mr-1" />
              {story.timeRemaining ? formatTimeRemaining(story.timeRemaining) : '0m'}
            </Badge>
          </div>
          
          {/* Engagement overlay */}
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">{story.views}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className={`w-4 h-4 ${story.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                  <span className="text-sm">{story.likes}</span>
                </div>
              </div>
              {story.userId === currentUser.id && (
                <Badge variant="outline" className="text-green-300 border-green-500/50">
                  Mine
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-purple-300 line-clamp-1">{story.title}</h3>
          <p className="text-sm text-gray-400 mt-1">{story.user?.alias}</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="h-full bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6 overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-purple-400 flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              Mesh Stories
            </h1>
            <p className="text-gray-400">Share ephemeral moments with the network</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Filter buttons */}
            <div className="flex bg-black/50 rounded-lg p-1">
              {[
                { key: 'all', label: 'All', icon: Globe },
                { key: 'following', label: 'Network', icon: Users },
                { key: 'mine', label: 'Mine', icon: User }
              ].map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  variant={filter === key ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter(key as any)}
                  className={filter === key ? 'bg-purple-600 text-white' : 'text-gray-400'}
                >
                  <Icon className="w-4 h-4 mr-1" />
                  {label}
                </Button>
              ))}
            </div>
            
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Story
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-purple-500/20 text-white max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-purple-400 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Create New Story
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-400">Story Title</Label>
                    <Input
                      placeholder="Give your story a title..."
                      value={newStory.title}
                      onChange={(e) => setNewStory(prev => ({ ...prev, title: e.target.value }))}
                      className="bg-gray-800 border-purple-500/30 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-gray-400">Content</Label>
                    <Textarea
                      placeholder="Share your thoughts with the network..."
                      value={newStory.content}
                      onChange={(e) => setNewStory(prev => ({ ...prev, content: e.target.value }))}
                      className="bg-gray-800 border-purple-500/30 text-white"
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-gray-400">Expires in (hours)</Label>
                    <div className="space-y-2">
                      <Slider
                        value={[newStory.duration]}
                        onValueChange={(value) => setNewStory(prev => ({ ...prev, duration: value[0] }))}
                        max={168}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                      <div className="text-sm text-gray-400 text-center">
                        {newStory.duration} hour{newStory.duration !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-purple-500/50 text-purple-300 flex-1"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Add Media
                    </Button>
                    
                    {newStory.mediaUrl && (
                      <Badge className="bg-purple-500/20 text-purple-300">
                        <Image className="w-3 h-3 mr-1" />
                        Media attached
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateStory}
                      disabled={createStoryMutation.isPending}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 flex-1"
                    >
                      {createStoryMutation.isPending ? (
                        <Radio className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Share Story
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => setIsCreating(false)}
                      className="border-gray-600"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stories Grid */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="bg-gray-800/50 animate-pulse">
                  <div className="h-48 bg-gray-700/50" />
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-700/50 rounded mb-2" />
                    <div className="h-3 bg-gray-700/50 rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredStories.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Stories Yet</h3>
              <p className="max-w-md mx-auto">
                {filter === 'mine' 
                  ? "You haven't created any stories yet. Share your first moment with the network!"
                  : "No stories available. Be the first to share something with the community!"
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
              {filteredStories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Story Viewer Dialog */}
        <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
          <DialogContent className="bg-gray-900 border-purple-500/20 text-white max-w-lg p-0 overflow-hidden">
            {selectedStory && (
              <div className="relative">
                {/* Animated background canvas */}
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={300}
                  className="absolute inset-0 w-full h-full opacity-30"
                />
                
                {/* Progress bar */}
                <div className="absolute top-0 left-0 right-0 z-20">
                  <Progress value={storyProgress} className="h-1 rounded-none" />
                </div>
                
                {/* Story content */}
                <div className="relative z-10 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="w-12 h-12 border-2 border-purple-500">
                      <AvatarImage src={selectedStory.user?.avatar} alt={selectedStory.user?.alias} />
                      <AvatarFallback className="bg-purple-600 text-white">
                        {selectedStory.user?.alias.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-purple-300">{selectedStory.user?.alias}</h3>
                      <p className="text-sm text-gray-400">
                        {selectedStory.timeRemaining ? formatTimeRemaining(selectedStory.timeRemaining) : '0m'} remaining
                      </p>
                    </div>
                  </div>
                  
                  <h2 className="text-xl font-bold text-white mb-3">{selectedStory.title}</h2>
                  
                  {selectedStory.mediaUrl && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img 
                        src={selectedStory.mediaUrl} 
                        alt={selectedStory.title}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}
                  
                  <p className="text-gray-300 mb-4">{selectedStory.content}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-400">{selectedStory.views}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-400">
                        <Heart className={`w-4 h-4 mr-1 ${selectedStory.isLiked ? 'fill-red-400 text-red-400' : ''}`} />
                        {selectedStory.likes}
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-purple-400">
                        <Share className="w-4 h-4" />
                      </Button>
                      {selectedStory.userId === currentUser.id && (
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleMediaUpload}
        />
      </div>
    </div>
  );
}