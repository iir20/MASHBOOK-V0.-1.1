import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
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
import type { Story, InsertStory, User as UserType } from '@shared/schema';

interface RealStoriesManagerProps {
  userId: number;
  currentUser?: UserType;
}

interface StoryFormData {
  title: string;
  content: string;
  expiresInHours: number;
}

export function RealStoriesManager({ userId, currentUser }: RealStoriesManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<StoryFormData>({
    title: '',
    content: '',
    expiresInHours: 24
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch active stories for real users only
  const { data: stories, isLoading } = useQuery({
    queryKey: ['/api/stories'],
    queryFn: async () => {
      const response = await fetch('/api/stories');
      if (!response.ok) {
        throw new Error('Failed to fetch stories');
      }
      return response.json() as Promise<Story[]>;
    },
    refetchInterval: 30000,
    retry: 2
  });

  // Create story mutation for real users
  const createStoryMutation = useMutation({
    mutationFn: async (storyData: InsertStory) => {
      return apiRequest('/api/stories', {
        method: 'POST',
        body: storyData
      });
    },
    onSuccess: () => {
      toast({
        title: "Story Published",
        description: "Your phantom story is now live in the mesh network."
      });
      setShowCreateForm(false);
      setFormData({ title: '', content: '', expiresInHours: 24 });
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
    },
    onError: () => {
      toast({
        title: "Failed to Publish",
        description: "Unable to publish story to the mesh network.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = () => {
    if (!currentUser || !formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both title and content for your story.",
        variant: "destructive"
      });
      return;
    }

    const newStory: InsertStory = {
      userId: currentUser.id,
      title: formData.title,
      content: formData.content,
      mediaUrl: null,
      expiresAt: new Date(Date.now() + formData.expiresInHours * 60 * 60 * 1000)
    };

    createStoryMutation.mutate(newStory);
  };

  const getTimeRemaining = (expiresAt: Date | null) => {
    if (!expiresAt) return 'Unknown';
    const now = new Date();
    const timeLeft = new Date(expiresAt).getTime() - now.getTime();
    if (timeLeft <= 0) return 'Expired';
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const realStories = stories?.filter(story => story.userId && story.userId !== null) || [];

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Phantom Stories
          </h1>
          <p className="text-gray-400 mt-1">Ephemeral content shared across the mesh network</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          disabled={!currentUser}
        >
          <Plus className="w-4 h-4 mr-2" />
          Share Story
        </Button>
      </div>

      {/* Create Story Form */}
      {showCreateForm && (
        <Card className="border-emerald-500/30 bg-emerald-900/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-emerald-400">Create Phantom Story</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateForm(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <CardDescription>
              Share ephemeral content that automatically expires and disappears
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Story title..."
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="border-emerald-500/30 bg-black/50 text-white placeholder-gray-400"
            />
            <Textarea
              placeholder="What's happening in your digital realm?"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="border-emerald-500/30 bg-black/50 text-white placeholder-gray-400 min-h-[100px]"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Timer className="w-4 h-4 text-emerald-400" />
                <select
                  value={formData.expiresInHours}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiresInHours: parseInt(e.target.value) }))}
                  className="bg-black/50 border border-emerald-500/30 rounded px-3 py-1 text-white"
                >
                  <option value={1}>1 Hour</option>
                  <option value={6}>6 Hours</option>
                  <option value={24}>24 Hours</option>
                  <option value={72}>3 Days</option>
                  <option value={168}>1 Week</option>
                </select>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={createStoryMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Publish to Mesh
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stories Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-48 bg-gray-800 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : realStories.length === 0 ? (
        <Card className="border-gray-700 bg-gray-900/50">
          <CardContent className="p-8 text-center">
            <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No Stories Yet</h3>
            <p className="text-gray-500 mb-4">
              {currentUser 
                ? "Be the first to share a phantom story in the mesh network"
                : "Connect to see stories shared by real users"
              }
            </p>
            {currentUser && (
              <Button 
                onClick={() => setShowCreateForm(true)}
                variant="outline"
                className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                Share First Story
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {realStories.map((story) => (
            <Card key={story.id} className="border-emerald-500/20 bg-gradient-to-br from-emerald-900/10 to-cyan-900/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-emerald-400">User {story.userId}</span>
                  </div>
                  <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400">
                    <Clock className="w-3 h-3 mr-1" />
                    {getTimeRemaining(story.expiresAt)}
                  </Badge>
                </div>
                <CardTitle className="text-lg text-white line-clamp-2">{story.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm line-clamp-4 mb-4">{story.content}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Globe className="w-3 h-3" />
                    <span>Mesh Network</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Timer className="w-3 h-3" />
                    <span>Expires {getTimeRemaining(story.expiresAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Connection Status */}
      {!currentUser && (
        <Alert className="border-orange-500/30 bg-orange-900/10">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Connect to the mesh network to view and share phantom stories with other users.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}