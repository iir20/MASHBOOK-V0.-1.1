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
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch stories with enhanced metadata
  const { data: stories = [], refetch: refetchStories } = useQuery<Story[]>({
    queryKey: ['/api/stories'],
    enabled: !isOffline,
    refetchInterval: 30000,
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

        // Draw orbital trail
        ctx.beginPath();
        ctx.strokeStyle = `rgba(99, 102, 241, ${0.3 + z * 0.001})`;
        ctx.lineWidth = 1;
        ctx.arc(centerX, centerY, story.orbitalPosition.radius * orbitalCamera.zoom, 0, Math.PI * 2);
        ctx.stroke();

        // Draw story orb
        const orbSize = 8 + Math.max(0, z * 0.05);
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, orbSize);
        gradient.addColorStop(0, story.mediaType === 'video' ? '#ff6b6b' : story.mediaType === 'image' ? '#4ecdc4' : '#45b7d1');
        gradient.addColorStop(1, 'rgba(0,0,0,0.3)');
        
        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(x, y, orbSize, 0, Math.PI * 2);
        ctx.fill();

        // Add glow effect
        ctx.shadowColor = story.mediaType === 'video' ? '#ff6b6b' : story.mediaType === 'image' ? '#4ecdc4' : '#45b7d1';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(x, y, orbSize * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

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

  // Create story mutation
  const createStoryMutation = useMutation({
    mutationFn: async (storyData: InsertStory) => {
      const response = await apiRequest('/api/stories', {
        method: 'POST',
        body: storyData,
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Story Launched",
        description: "Your story is now orbiting in the mesh network!",
      });
      setShowCreateStory(false);
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
    },
  });

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
                  className="bg-black/30 border-purple-500/50 text-white placeholder-gray-400"
                />
                <Textarea
                  placeholder="What's happening in your world?"
                  className="bg-black/30 border-purple-500/50 text-white placeholder-gray-400 min-h-[100px]"
                />
                
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" className="border-purple-500/50">
                    <Camera className="w-4 h-4 mr-1" />
                    Photo
                  </Button>
                  <Button size="sm" variant="outline" className="border-purple-500/50">
                    <Video className="w-4 h-4 mr-1" />
                    Video
                  </Button>
                  <Button size="sm" variant="outline" className="border-purple-500/50">
                    <MapPin className="w-4 h-4 mr-1" />
                    Location
                  </Button>
                </div>
                
                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Launch into Orbit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}