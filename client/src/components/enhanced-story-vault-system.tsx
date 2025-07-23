import React, { useState, useEffect } from 'react';
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
import { FuturisticCard } from './modern-futuristic-theme';

import {
  Sparkles,
  Plus,
  Clock,
  Eye,
  Shield,
  Lock,
  Camera,
  FileText,
  Upload,
  Trash2,
  Download
} from 'lucide-react';

interface StoryVaultSystemProps {
  currentUser: User;
  availableUsers: User[];
  isOffline: boolean;
}

interface Story {
  id: number;
  userId: number;
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  expiresAt: Date;
  createdAt: Date;
  user?: User;
}

export function EnhancedStoryVaultSystem({ currentUser, availableUsers, isOffline }: StoryVaultSystemProps) {
  const [activeTab, setActiveTab] = useState<'stories'>('stories');
  const [newStoryContent, setNewStoryContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [vaultFiles, setVaultFiles] = useState<any[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch stories
  const { data: stories = [], refetch: refetchStories } = useQuery<Story[]>({
    queryKey: ['/api/stories'],
    enabled: !isOffline,
    refetchInterval: 10000,
    staleTime: 5000
  });

  // Create story mutation
  const createStoryMutation = useMutation({
    mutationFn: async (storyData: InsertStory) => {
      return apiRequest('/api/stories', {
        method: 'POST',
        body: storyData
      });
    },
    onSuccess: () => {
      setNewStoryContent('');
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      toast({
        title: "Story Created",
        description: "Your story has been shared with the network."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Story Creation Failed",
        description: error.message || "Failed to create story",
        variant: "destructive"
      });
    }
  });

  const handleCreateStory = () => {
    if (!newStoryContent.trim() && !selectedFile) {
      toast({
        title: "Validation Error",
        description: "Please add some content or select a file",
        variant: "destructive"
      });
      return;
    }

    let mediaUrl = '';
    let mediaType = '';

    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        mediaUrl = e.target?.result as string;
        mediaType = selectedFile.type.startsWith('image/') ? 'image' : 
                   selectedFile.type.startsWith('video/') ? 'video' : 'file';

        const storyData: InsertStory = {
          userId: currentUser.id,
          title: newStoryContent.trim().substring(0, 50) || 'Untitled',
          content: newStoryContent.trim(),
          mediaUrl: mediaUrl || null,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        };

        createStoryMutation.mutate(storyData);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      const storyData: InsertStory = {
        userId: currentUser.id,
        title: newStoryContent.trim().substring(0, 50) || 'Untitled',
        content: newStoryContent.trim(),
        mediaUrl: null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };

      createStoryMutation.mutate(storyData);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const formatTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const timeLeft = new Date(expiresAt).getTime() - now.getTime();
    
    if (timeLeft <= 0) return 'Expired';
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Filter stories for display
  const activeStories = stories.filter(story => new Date(story.expiresAt) > new Date());
  const myStories = activeStories.filter(story => story.userId === currentUser.id);
  const networkStories = activeStories.filter(story => story.userId !== currentUser.id);

  return (
    <div className="space-y-6">
      {/* Stories Header */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
          Ephemeral Stories
        </h2>
        <p className="text-muted-foreground">Share moments that disappear in 24 hours</p>
      </div>

      <div className="space-y-6">
          {/* Create Story */}
          <FuturisticCard className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create Story
            </h3>
            
            <div className="space-y-4">
              <Textarea
                value={newStoryContent}
                onChange={(e) => setNewStoryContent(e.target.value)}
                placeholder="Share what's happening..."
                rows={3}
                className="bg-slate-700/30 border-slate-600"
              />
              
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  id="story-file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('story-file')?.click()}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Add Media
                </Button>
                
                {selectedFile && (
                  <Badge variant="secondary">
                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)}MB)
                  </Badge>
                )}
                
                <div className="flex-1" />
                
                <Button
                  onClick={handleCreateStory}
                  disabled={createStoryMutation.isPending || isOffline}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500"
                >
                  {createStoryMutation.isPending ? 'Sharing...' : 'Share Story'}
                </Button>
              </div>
            </div>
          </FuturisticCard>

          {/* My Stories */}
          <FuturisticCard className="p-6">
            <h4 className="font-bold mb-4">My Stories ({myStories.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myStories.map(story => (
                <FuturisticCard key={story.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={currentUser.avatar} />
                        <AvatarFallback className="text-xs">
                          {currentUser.alias.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{currentUser.alias}</p>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimeRemaining(story.expiresAt)}
                        </Badge>
                      </div>
                    </div>
                    
                    {story.content && (
                      <p className="text-sm">{story.content}</p>
                    )}
                    
                    {story.mediaUrl && (
                      <img 
                        src={story.mediaUrl} 
                        alt="Story media" 
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    )}
                  </div>
                </FuturisticCard>
              ))}
              
              {myStories.length === 0 && (
                <p className="text-muted-foreground text-center col-span-full py-8">
                  No active stories. Create your first story above!
                </p>
              )}
            </div>
          </FuturisticCard>

          {/* Network Stories */}
          <FuturisticCard className="p-6">
            <h4 className="font-bold mb-4">Network Stories ({networkStories.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {networkStories.map(story => {
                const author = availableUsers.find(u => u.id === story.userId);
                return (
                  <FuturisticCard key={story.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={author?.avatar} />
                          <AvatarFallback className="text-xs">
                            {author?.alias.slice(0, 2).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{author?.alias || 'Unknown User'}</p>
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatTimeRemaining(story.expiresAt)}
                          </Badge>
                        </div>
                      </div>
                      
                      {story.content && (
                        <p className="text-sm">{story.content}</p>
                      )}
                      
                      {story.mediaUrl && (
                        <img 
                          src={story.mediaUrl} 
                          alt="Story media" 
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      )}
                    </div>
                  </FuturisticCard>
                );
              })}
              
              {networkStories.length === 0 && (
                <p className="text-muted-foreground text-center col-span-full py-8">
                  No stories from network users yet.
                </p>
              )}
            </div>
          </FuturisticCard>
        </div>
    </div>
  );
}