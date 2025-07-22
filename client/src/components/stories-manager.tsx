import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Images, 
  Plus, 
  Clock, 
  Eye, 
  Share2, 
  X, 
  Edit,
  Trash2,
  Globe,
  Lock,
  Users,
  Sparkles,
  Timer,
  AlertCircle,
  Check,
  User
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Story, InsertStory } from '@shared/schema';

interface StoriesManagerProps {
  userId: number;
  currentUser?: {
    id: number;
    username: string;
  };
}

interface StoryFormData {
  title: string;
  content: string;
  expiresInHours: number;
  isPublic: boolean;
}

export function StoriesManager({ userId, currentUser }: StoriesManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [formData, setFormData] = useState<StoryFormData>({
    title: '',
    content: '',
    expiresInHours: 24,
    isPublic: true
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch active stories
  const { data: stories, isLoading } = useQuery({
    queryKey: ['/api/stories'],
    queryFn: async () => {
      const response = await fetch('/api/stories');
      return response.json() as Promise<Story[]>;
    },
    refetchInterval: 30000,
    retry: 2
  });

  // Fetch user's stories
  const { data: myStories } = useQuery({
    queryKey: ['/api/stories/user', userId],
    queryFn: async () => {
      const response = await fetch(`/api/stories/user/${userId}`);
      return response.json() as Promise<Story[]>;
    },
    enabled: !!userId,
    refetchInterval: 30000,
    retry: 2
  });

  // Create story mutation
  const createStoryMutation = useMutation({
    mutationFn: async (storyData: StoryFormData) => {
      const insertData: InsertStory = {
        title: storyData.title,
        content: storyData.content,
        userId: currentUser?.id || userId,
        expiresAt: new Date(Date.now() + storyData.expiresInHours * 60 * 60 * 1000),
        mediaUrl: null
      };
      
      return apiRequest('/api/stories', {
        method: 'POST',
        body: insertData
      });
    },
    onSuccess: () => {
      toast({
        title: "Story Created",
        description: "Your story has been published successfully",
      });
      setShowCreateForm(false);
      setFormData({
        title: '',
        content: '',
        expiresInHours: 24,
        isPublic: true
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create story",
        variant: "destructive",
      });
    }
  });

  // Delete story mutation
  const deleteStoryMutation = useMutation({
    mutationFn: async (storyId: number) => {
      return apiRequest(`/api/stories/${storyId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "Story Deleted",
        description: "Story has been removed",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete story",
        variant: "destructive",
      });
    }
  });

  const handleCreateStory = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    createStoryMutation.mutate(formData);
  };

  const handleDeleteStory = (storyId: number) => {
    if (window.confirm('Are you sure you want to delete this story?')) {
      deleteStoryMutation.mutate(storyId);
    }
  };

  const calculateTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const calculateProgress = (createdAt: Date, expiresAt: Date) => {
    const now = new Date();
    const created = new Date(createdAt);
    const expires = new Date(expiresAt);
    
    const total = expires.getTime() - created.getTime();
    const elapsed = now.getTime() - created.getTime();
    
    return Math.min(100, (elapsed / total) * 100);
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--cyber-cyan)]">Stories</h2>
          <p className="text-gray-400 mt-1">Share ephemeral content with the mesh network</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-[var(--cyber-cyan)] hover:bg-[var(--cyber-cyan)]/80"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Story
        </Button>
      </div>

      {/* Create Story Form */}
      {showCreateForm && (
        <Card className="glass-morphism border-[var(--cyber-cyan)]/30">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5" />
              <span>Create New Story</span>
            </CardTitle>
            <CardDescription>
              Share temporary content that expires automatically
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Story Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter story title..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="content">Story Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="What's happening in your part of the network?"
                rows={4}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expires">Expires In (hours)</Label>
                <Input
                  id="expires"
                  type="number"
                  min="1"
                  max="168"
                  value={formData.expiresInHours}
                  onChange={(e) => setFormData({ ...formData, expiresInHours: parseInt(e.target.value) || 24 })}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center space-x-2 mt-6">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isPublic" className="flex items-center space-x-2">
                  <Globe className="w-4 h-4" />
                  <span>Public Story</span>
                </Label>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={handleCreateStory}
                disabled={createStoryMutation.isPending}
                className="flex-1"
              >
                {createStoryMutation.isPending ? 'Creating...' : 'Create Story'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stories Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">All Stories</TabsTrigger>
          <TabsTrigger value="my">My Stories</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card className="glass-morphism">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Images className="w-5 h-5" />
                <span>Network Stories</span>
              </CardTitle>
              <CardDescription>
                Stories shared across the mesh network
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--cyber-cyan)] mx-auto"></div>
                  <p className="text-gray-400 mt-2">Loading stories...</p>
                </div>
              ) : stories && stories.length > 0 ? (
                <div className="space-y-4">
                  {stories.map((story) => (
                    <div key={story.id} className="border rounded-lg p-4 hover:border-[var(--cyber-cyan)]/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[var(--cyber-cyan)] to-[var(--cyber-magenta)] rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {story.userId?.toString().slice(-1) || '?'}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-medium text-white">{story.title}</h3>
                            <p className="text-sm text-gray-400">
                              User {story.userId || 'Unknown'} • {formatRelativeTime(story.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-[var(--cyber-green)]">
                            <Clock className="w-3 h-3 mr-1" />
                            {calculateTimeRemaining(story.expiresAt)}
                          </Badge>
                          <Globe className="w-4 h-4 text-[var(--cyber-cyan)]" />
                        </div>
                      </div>

                      <p className="text-gray-300 mb-3">{story.content}</p>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Time remaining</span>
                          <span className="text-[var(--cyber-cyan)]">
                            {calculateTimeRemaining(story.expiresAt)}
                          </span>
                        </div>
                        <Progress 
                          value={calculateProgress(story.createdAt, story.expiresAt)} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Images className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No stories available</p>
                  <p className="text-sm mt-2">Be the first to share something!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my" className="space-y-4">
          <Card className="glass-morphism">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>My Stories</span>
              </CardTitle>
              <CardDescription>
                Stories you've created and shared
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myStories && myStories.length > 0 ? (
                <div className="space-y-4">
                  {myStories.map((story) => (
                    <div key={story.id} className="border rounded-lg p-4 hover:border-[var(--cyber-cyan)]/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-white">{story.title}</h3>
                          <p className="text-sm text-gray-400">
                            Created {formatRelativeTime(story.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-[var(--cyber-green)]">
                            <Timer className="w-3 h-3 mr-1" />
                            {calculateTimeRemaining(story.expiresAt)}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteStory(story.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-gray-300 mb-3">{story.content}</p>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Progress</span>
                          <span className="text-[var(--cyber-cyan)]">
                            {calculateProgress(story.createdAt, story.expiresAt).toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={calculateProgress(story.createdAt, story.expiresAt)} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No stories yet</p>
                  <p className="text-sm mt-2">Create your first story to get started!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}