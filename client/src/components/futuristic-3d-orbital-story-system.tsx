import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { User, InsertStory } from '@shared/schema';

import {
  Sparkles, Plus, Clock, Eye, Camera, Video, Upload, Send, X,
  Heart, MessageCircle, Share, Play, Pause, Volume2, VolumeX,
  Globe, MapPin, Zap, Star, Orbit, Box, Circle
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
  location?: {
    lat: number;
    lng: number;
    name: string;
  };
  orbitalPosition?: {
    x: number;
    y: number;
    z: number;
    radius: number;
    speed: number;
  };
}

interface Futuristic3DOrbitalStorySystemProps {
  currentUser: User | null;
  availableUsers: User[];
  isOffline: boolean;
}

export function Futuristic3DOrbitalStorySystem({ 
  currentUser, 
  availableUsers, 
  isOffline 
}: Futuristic3DOrbitalStorySystemProps) {
  const [viewMode, setViewMode] = useState<'3d-orbital' | '2d-timeline' | 'ar-world'>('3d-orbital');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [orbitalCamera, setOrbitalCamera] = useState({ rotation: 0, zoom: 1, tilt: 0 });
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  
  // Create story form state
  const [createForm, setCreateForm] = useState({
    title: '',
    content: '',
    mediaFile: null as File | null,
    mediaType: null as string | null,
    mediaUrl: null as string | null
  });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch stories with offline support
  const { data: stories = [], refetch: refetchStories } = useQuery<Story[]>({
    queryKey: ['/api/stories'],
    enabled: !isOffline,
    refetchInterval: 30000,
    initialData: isOffline ? (() => {
      // Load from offline storage
      try {
        const { offlineStorage } = require('@/lib/offline-storage');
        return offlineStorage.getStories();
      } catch {
        return [];
      }
    })() : []
  });

  // Initialize 3D orbital positions for stories
  const [orbitalStories, setOrbitalStories] = useState<Story[]>([]);

  useEffect(() => {
    if (stories.length > 0) {
      const enhanced = stories.map((story, index) => ({
        ...story,
        orbitalPosition: {
          x: Math.cos((index * Math.PI * 2) / stories.length) * 200,
          y: Math.sin((index * Math.PI * 2) / stories.length) * 200,
          z: (index % 3 - 1) * 50,
          radius: 150 + (index % 4) * 50,
          speed: 0.5 + Math.random() * 0.5
        }
      }));
      setOrbitalStories(enhanced);
    }
  }, [stories]);

  // 3D Canvas Animation Engine
  useEffect(() => {
    if (!canvasRef.current || viewMode !== '3d-orbital') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const animate = () => {
      if (!isPlaying) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw cosmic background
      ctx.fillStyle = 'radial-gradient(circle, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw orbital paths
      orbitalStories.forEach((story, index) => {
        if (!story.orbitalPosition) return;

        const time = Date.now() * 0.001 * animationSpeed;
        const angle = time * story.orbitalPosition.speed + (index * Math.PI * 2) / orbitalStories.length;
        
        // Calculate 3D position with orbital camera
        const x = centerX + Math.cos(angle + orbitalCamera.rotation) * story.orbitalPosition.radius * orbitalCamera.zoom;
        const y = centerY + Math.sin(angle + orbitalCamera.rotation) * story.orbitalPosition.radius * orbitalCamera.zoom * Math.cos(orbitalCamera.tilt);
        const z = Math.sin(angle + orbitalCamera.rotation) * story.orbitalPosition.radius * Math.sin(orbitalCamera.tilt);

        // Enhanced orbital trail with depth and glow
        const trailOpacity = 0.4 + Math.sin(time * 2) * 0.1 + z * 0.002;
        const trailGradient = ctx.createRadialGradient(centerX, centerY, story.orbitalPosition.radius * 0.8, centerX, centerY, story.orbitalPosition.radius * 1.2);
        trailGradient.addColorStop(0, `rgba(99, 102, 241, ${trailOpacity})`);
        trailGradient.addColorStop(0.5, `rgba(139, 69, 19, ${trailOpacity * 0.6})`);
        trailGradient.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.beginPath();
        ctx.strokeStyle = trailGradient;
        ctx.lineWidth = 2 + Math.sin(time) * 0.5;
        ctx.arc(centerX, centerY, story.orbitalPosition.radius * orbitalCamera.zoom, 0, Math.PI * 2);
        ctx.stroke();

        // Enhanced story orb with sophisticated 3D appearance
        const orbSize = 12 + Math.max(0, z * 0.08) + Math.sin(time * 3 + index) * 2;
        const orbColor = story.mediaType === 'video' ? '#ff6b6b' : story.mediaType === 'image' ? '#4ecdc4' : '#45b7d1';
        const orbSecondary = story.mediaType === 'video' ? '#ff9999' : story.mediaType === 'image' ? '#7ef0e8' : '#73c5f0';
        
        // Create sophisticated gradient with depth
        const orbGradient = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, orbSize);
        orbGradient.addColorStop(0, orbSecondary);
        orbGradient.addColorStop(0.3, orbColor);
        orbGradient.addColorStop(0.7, orbColor);
        orbGradient.addColorStop(1, 'rgba(0,0,0,0.8)');
        
        // Draw main orb
        ctx.beginPath();
        ctx.fillStyle = orbGradient;
        ctx.arc(x, y, orbSize, 0, Math.PI * 2);
        ctx.fill();

        // Add dynamic glow effect with pulsing
        const glowIntensity = 20 + Math.sin(time * 4 + index) * 8;
        ctx.shadowColor = orbColor;
        ctx.shadowBlur = glowIntensity;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${parseInt(orbColor.slice(1, 3), 16)}, ${parseInt(orbColor.slice(3, 5), 16)}, ${parseInt(orbColor.slice(5, 7), 16)}, 0.6)`;
        ctx.arc(x, y, orbSize * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        // Add sparkle effect
        if (Math.random() < 0.1) {
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(x + (Math.random() - 0.5) * orbSize, y + (Math.random() - 0.5) * orbSize, 1, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.shadowBlur = 0;

        // Add story content preview ring
        if (orbSize > 15) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 255, 255, 0.3)`;
          ctx.lineWidth = 1;
          ctx.arc(x, y, orbSize + 4, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Store position for click detection
        (story as any).renderX = x;
        (story as any).renderY = y;
        (story as any).renderSize = orbSize;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [orbitalStories, orbitalCamera, animationSpeed, isPlaying, viewMode]);

  // Handle canvas clicks for story selection
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (viewMode !== '3d-orbital') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    for (const story of orbitalStories) {
      const renderX = (story as any).renderX;
      const renderY = (story as any).renderY;
      const renderSize = (story as any).renderSize;

      if (renderX && renderY && renderSize) {
        const distance = Math.sqrt((clickX - renderX) ** 2 + (clickY - renderY) ** 2);
        if (distance <= renderSize) {
          setSelectedStory(story);
          toast({
            title: "Story Selected",
            description: `Viewing "${story.title}" by ${story.user?.alias}`,
          });
          break;
        }
      }
    }
  };

  // Create story mutation with offline support
  const createStoryMutation = useMutation({
    mutationFn: async (storyData: InsertStory & { mediaFile?: File }) => {
      if (isOffline) {
        // Save to offline storage
        const story = {
          id: Date.now(),
          userId: currentUser?.id || 0,
          title: storyData.title,
          content: storyData.content,
          mediaUrl: storyData.mediaUrl || null,
          expiresAt: storyData.expiresAt,
          createdAt: new Date(),
          user: currentUser,
          views: 0,
          likes: 0,
          isLiked: false,
          orbitalPosition: {
            x: Math.random() * 400 - 200,
            y: Math.random() * 400 - 200,
            z: Math.random() * 200 - 100,
            radius: 100 + Math.random() * 100,
            speed: 0.5 + Math.random() * 1.5
          }
        };
        
        const { offlineStorage } = await import('@/lib/offline-storage');
        offlineStorage.addStory(story);
        return story;
      }
      
      // Online mode - send to server
      if (storyData.mediaFile) {
        const formData = new FormData();
        formData.append('title', storyData.title);
        formData.append('content', storyData.content);
        formData.append('userId', String(storyData.userId));
        formData.append('expiresAt', storyData.expiresAt.toISOString());
        formData.append('mediaFile', storyData.mediaFile);
        
        return fetch('/api/stories', {
          method: 'POST',
          body: formData,
        }).then(res => res.json());
      } else {
        return apiRequest('/api/stories', {
          method: 'POST',
          body: storyData,
        });
      }
    },
    onSuccess: (newStory) => {
      toast({
        title: "Story Launched",
        description: "Your story is now orbiting in the mesh network!",
      });
      setShowCreateStory(false);
      setCreateForm({
        title: '',
        content: '',
        mediaFile: null,
        mediaType: null,
        mediaUrl: null
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
    },
    onError: (error: any) => {
      toast({
        title: "Launch Failed",
        description: error.message || "Failed to launch story into orbit",
      });
    }
  });

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCreateForm(prev => ({
        ...prev,
        mediaFile: file,
        mediaType: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file',
        mediaUrl: URL.createObjectURL(file)
      }));
    }
  };

  // Handle story creation
  const handleCreateStory = () => {
    if (!currentUser || !createForm.title.trim() || !createForm.content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both title and content for your story",
      });
      return;
    }

    const storyData: InsertStory & { mediaFile?: File } = {
      userId: currentUser.id,
      title: createForm.title.trim(),
      content: createForm.content.trim(),
      mediaUrl: createForm.mediaUrl,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      mediaFile: createForm.mediaFile || undefined
    };

    createStoryMutation.mutate(storyData);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-900 via-purple-900 to-black">
      {/* Futuristic Control Panel */}
      <div className="border-b border-purple-500/30 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Orbit className="w-6 h-6 text-purple-400 animate-spin" />
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                3D Orbital Stories
              </h2>
            </div>
            
            {/* View Mode Selector */}
            <div className="flex space-x-1 bg-black/30 rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === '3d-orbital' ? 'default' : 'ghost'}
                onClick={() => setViewMode('3d-orbital')}
                className="h-8 px-3"
              >
                <Box className="w-4 h-4 mr-1" />
                3D Orbital
              </Button>
              <Button
                size="sm"
                variant={viewMode === '2d-timeline' ? 'default' : 'ghost'}
                onClick={() => setViewMode('2d-timeline')}
                className="h-8 px-3"
              >
                <Clock className="w-4 h-4 mr-1" />
                Timeline
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'ar-world' ? 'default' : 'ghost'}
                onClick={() => setViewMode('ar-world')}
                className="h-8 px-3"
              >
                <Globe className="w-4 h-4 mr-1" />
                AR World
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Animation Controls */}
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsPlaying(!isPlaying)}
                className="h-8 w-8 p-0"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                className="w-20 h-2 bg-purple-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <Button
              onClick={() => setShowCreateStory(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Launch Story
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* 3D Orbital View */}
        {viewMode === '3d-orbital' && (
          <div className="flex-1 relative">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              onClick={handleCanvasClick}
              className="w-full h-full cursor-pointer"
            />
            
            {/* Orbital Camera Controls */}
            <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 space-y-2">
              <div className="text-xs text-purple-300 font-medium">Camera Controls</div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-300">Rotation:</span>
                  <input
                    type="range"
                    min="0"
                    max={Math.PI * 2}
                    step="0.1"
                    value={orbitalCamera.rotation}
                    onChange={(e) => setOrbitalCamera(prev => ({ ...prev, rotation: parseFloat(e.target.value) }))}
                    className="w-16 h-1 bg-purple-600 rounded appearance-none cursor-pointer"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-300">Zoom:</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={orbitalCamera.zoom}
                    onChange={(e) => setOrbitalCamera(prev => ({ ...prev, zoom: parseFloat(e.target.value) }))}
                    className="w-16 h-1 bg-purple-600 rounded appearance-none cursor-pointer"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-300">Tilt:</span>
                  <input
                    type="range"
                    min={-Math.PI / 4}
                    max={Math.PI / 4}
                    step="0.1"
                    value={orbitalCamera.tilt}
                    onChange={(e) => setOrbitalCamera(prev => ({ ...prev, tilt: parseFloat(e.target.value) }))}
                    className="w-16 h-1 bg-purple-600 rounded appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Story Count & Stats */}
            <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Circle className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-300">{orbitalStories.length} Stories</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-300">Orbital</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-300">Active</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline View */}
        {viewMode === '2d-timeline' && (
          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orbitalStories.map((story) => (
                <Card 
                  key={story.id}
                  className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30 hover:border-purple-400/50 transition-all cursor-pointer"
                  onClick={() => setSelectedStory(story)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={story.user?.avatar} />
                        <AvatarFallback>{story.user?.alias?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{story.title}</h3>
                        <p className="text-sm text-gray-300 mt-1 line-clamp-2">{story.content}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {story.mediaType || 'text'}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {new Date(story.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* AR World View */}
        {viewMode === 'ar-world' && (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-900/30 to-green-900/30">
            <div className="text-center space-y-4">
              <Globe className="w-16 h-16 text-blue-400 mx-auto animate-pulse" />
              <h3 className="text-xl font-semibold text-white">AR World Integration</h3>
              <p className="text-gray-300 max-w-md">
                Augmented Reality story drops will overlay stories in real-world locations using GPS + AR technology.
              </p>
              <Button className="bg-gradient-to-r from-blue-600 to-green-600">
                <MapPin className="w-4 h-4 mr-2" />
                Enable Location & AR
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Story Modal */}
      {selectedStory && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-gradient-to-br from-purple-900 to-pink-900 border-purple-500 max-w-2xl w-full">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={selectedStory.user?.avatar} />
                    <AvatarFallback>{selectedStory.user?.alias?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedStory.title}</h3>
                    <p className="text-sm text-purple-300">by {selectedStory.user?.alias}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedStory(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-200">{selectedStory.content}</p>
                
                {selectedStory.mediaUrl && (
                  <div className="rounded-lg overflow-hidden">
                    {selectedStory.mediaType === 'image' && (
                      <img src={selectedStory.mediaUrl} alt={selectedStory.title} className="w-full" />
                    )}
                    {selectedStory.mediaType === 'video' && (
                      <video src={selectedStory.mediaUrl} controls className="w-full" />
                    )}
                  </div>
                )}
                
                <div className="flex items-center space-x-4 pt-4 border-t border-purple-500/30">
                  <Button size="sm" variant="outline" className="border-purple-500/50">
                    <Heart className="w-4 h-4 mr-1" />
                    {selectedStory.likes || 0}
                  </Button>
                  <Button size="sm" variant="outline" className="border-purple-500/50">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Comment
                  </Button>
                  <Button size="sm" variant="outline" className="border-purple-500/50">
                    <Share className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Story Modal */}
      {showCreateStory && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-gradient-to-br from-purple-900 to-pink-900 border-purple-500 max-w-lg w-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Launch New Story</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateStory(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <Input
                  placeholder="Story title..."
                  value={createForm.title}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-black/30 border-purple-500/50 text-white placeholder-gray-400"
                />
                <Textarea
                  placeholder="What's happening in your world?"
                  value={createForm.content}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, content: e.target.value }))}
                  className="bg-black/30 border-purple-500/50 text-white placeholder-gray-400 min-h-[100px]"
                />
                
                {/* Media Preview */}
                {createForm.mediaUrl && (
                  <div className="relative bg-black/20 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-purple-300">Media attached</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setCreateForm(prev => ({ ...prev, mediaFile: null, mediaType: null, mediaUrl: null }))}
                        className="text-gray-400 hover:text-white h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    {createForm.mediaType === 'image' && (
                      <img src={createForm.mediaUrl} alt="Preview" className="w-full h-32 object-cover rounded" />
                    )}
                    {createForm.mediaType === 'video' && (
                      <video src={createForm.mediaUrl} className="w-full h-32 object-cover rounded" />
                    )}
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="media-upload"
                  />
                  <label htmlFor="media-upload">
                    <Button size="sm" variant="outline" className="border-purple-500/50" asChild>
                      <span>
                        <Camera className="w-4 h-4 mr-1" />
                        Media
                      </span>
                    </Button>
                  </label>
                  <Button size="sm" variant="outline" className="border-purple-500/50" disabled>
                    <MapPin className="w-4 h-4 mr-1" />
                    Location
                  </Button>
                </div>
                
                <Button 
                  onClick={handleCreateStory}
                  disabled={createStoryMutation.isPending || !createForm.title.trim() || !createForm.content.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
                >
                  {createStoryMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Launching...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Launch into Orbit
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}