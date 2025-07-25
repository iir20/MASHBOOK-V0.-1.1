import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { User } from '@shared/schema';

import {
  MapPin, Camera, Globe, Compass, Target, Zap, Eye, Share,
  Navigation, Crosshair, Layers, Filter, Users, Clock,
  Star, Heart, MessageCircle, AlertTriangle, CheckCircle,
  RefreshCw, Maximize, Minimize, RotateCcw, Search
} from 'lucide-react';

interface ARWorldDropSystemProps {
  currentUser: User | null;
  availableUsers: User[];
  isOffline: boolean;
}

interface ARLocation {
  id: string;
  lat: number;
  lng: number;
  name: string;
  address: string;
  type: 'landmark' | 'business' | 'park' | 'custom';
}

interface ARStoryDrop {
  id: string;
  userId: number;
  title: string;
  content: string;
  mediaUrl?: string;
  mediaType?: string;
  location: ARLocation;
  radius: number; // meters
  expiresAt: Date;
  createdAt: Date;
  user?: User;
  discoveredBy: number[];
  likes: number;
  views: number;
  isActive: boolean;
}

export function ARWorldDropSystem({ 
  currentUser, 
  availableUsers, 
  isOffline 
}: ARWorldDropSystemProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [arEnabled, setArEnabled] = useState(false);
  const [showCreateDrop, setShowCreateDrop] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<ARLocation | null>(null);
  const [nearbyDrops, setNearbyDrops] = useState<ARStoryDrop[]>([]);
  const [discoveredDrops, setDiscoveredDrops] = useState<ARStoryDrop[]>([]);
  const [mapView, setMapView] = useState<'ar' | 'map' | 'list'>('map');
  const [searchRadius, setSearchRadius] = useState(1000); // meters
  const [filterType, setFilterType] = useState<'all' | 'friends' | 'trending' | 'recent'>('all');
  
  const mapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          toast({
            title: "Location Enabled",
            description: "AR World Drops are now available in your area",
          });
        },
        (error) => {
          toast({
            title: "Location Required",
            description: "Enable location access to discover AR story drops",
            variant: "destructive"
          });
        }
      );
    }
  }, []);

  // Initialize mock AR drops
  useEffect(() => {
    if (userLocation) {
      const mockDrops: ARStoryDrop[] = [
        {
          id: '1',
          userId: 1,
          title: '🌟 Hidden Gem Discovery',
          content: 'Found this amazing coffee shop with the best view in the city! The barista makes incredible latte art.',
          mediaUrl: '/api/placeholder/400/300',
          mediaType: 'image',
          location: {
            id: 'loc1',
            lat: userLocation.lat + 0.001,
            lng: userLocation.lng + 0.001,
            name: 'Downtown Coffee',
            address: '123 Main St',
            type: 'business'
          },
          radius: 50,
          expiresAt: new Date(Date.now() + 86400000 * 7), // 7 days
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
          user: availableUsers[0],
          discoveredBy: [1, 2, 3],
          likes: 12,
          views: 35,
          isActive: true
        },
        {
          id: '2',
          userId: 2,
          title: '🎨 Street Art Spotting',
          content: 'Incredible mural just appeared overnight! The artist captured the spirit of our neighborhood perfectly.',
          mediaUrl: '/api/placeholder/400/400',
          mediaType: 'image',
          location: {
            id: 'loc2',
            lat: userLocation.lat - 0.002,
            lng: userLocation.lng + 0.003,
            name: 'Art Alley',
            address: '456 Creative Ave',
            type: 'landmark'
          },
          radius: 25,
          expiresAt: new Date(Date.now() + 86400000 * 30), // 30 days
          createdAt: new Date(Date.now() - 86400000 * 3), // 3 days ago
          user: availableUsers[1],
          discoveredBy: [2, 4, 5, 6],
          likes: 28,
          views: 67,
          isActive: true
        },
        {
          id: '3',
          userId: 3,
          title: '🌳 Secret Garden Path',
          content: 'There is a hidden trail behind the library that leads to a beautiful garden. Perfect for reading!',
          location: {
            id: 'loc3',
            lat: userLocation.lat + 0.003,
            lng: userLocation.lng - 0.001,
            name: 'Library Gardens',
            address: '789 Knowledge Blvd',
            type: 'park'
          },
          radius: 100,
          expiresAt: new Date(Date.now() + 86400000 * 14), // 14 days
          createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
          user: availableUsers[2],
          discoveredBy: [3, 7],
          likes: 8,
          views: 22,
          isActive: true
        }
      ];
      
      setNearbyDrops(mockDrops);
    }
  }, [userLocation, availableUsers]);

  // Enable AR camera
  const enableAR = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setArEnabled(true);
        toast({
          title: "AR Camera Enabled",
          description: "Point your camera around to discover story drops",
        });
      }
    } catch (error) {
      toast({
        title: "Camera Access Required",
        description: "Enable camera access to use AR features",
        variant: "destructive"
      });
    }
  };

  // Disable AR camera
  const disableAR = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setArEnabled(false);
  };

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // Filter drops based on current criteria
  const filteredDrops = nearbyDrops.filter(drop => {
    if (!userLocation) return false;
    
    const distance = calculateDistance(
      userLocation.lat, userLocation.lng,
      drop.location.lat, drop.location.lng
    );
    
    if (distance > searchRadius) return false;
    
    switch (filterType) {
      case 'friends':
        return availableUsers.some(user => user.id === drop.userId);
      case 'trending':
        return drop.likes > 10 || drop.views > 50;
      case 'recent':
        return Date.now() - drop.createdAt.getTime() < 86400000 * 2; // 2 days
      default:
        return true;
    }
  });

  // Create new AR drop
  const createARDrop = async (dropData: Partial<ARStoryDrop>) => {
    if (!userLocation || !selectedLocation) return;
    
    const newDrop: ARStoryDrop = {
      id: Date.now().toString(),
      userId: currentUser?.id || 0,
      title: dropData.title || '',
      content: dropData.content || '',
      mediaUrl: dropData.mediaUrl,
      mediaType: dropData.mediaType,
      location: selectedLocation,
      radius: 50,
      expiresAt: new Date(Date.now() + 86400000 * 7), // 7 days
      createdAt: new Date(),
      user: currentUser || undefined,
      discoveredBy: [],
      likes: 0,
      views: 0,
      isActive: true
    };
    
    setNearbyDrops(prev => [...prev, newDrop]);
    setShowCreateDrop(false);
    
    toast({
      title: "AR Drop Created!",
      description: "Your story has been placed in the world for others to discover",
    });
  };

  // Discover a drop (when user is within range)
  const discoverDrop = (drop: ARStoryDrop) => {
    if (!userLocation || !currentUser) return;
    
    const distance = calculateDistance(
      userLocation.lat, userLocation.lng,
      drop.location.lat, drop.location.lng
    );
    
    if (distance <= drop.radius && !drop.discoveredBy.includes(currentUser.id)) {
      drop.discoveredBy.push(currentUser.id);
      drop.views += 1;
      setDiscoveredDrops(prev => [...prev, drop]);
      
      toast({
        title: "AR Drop Discovered! 🎉",
        description: `You found "${drop.title}" by ${drop.user?.alias}`,
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-green-900 via-blue-900 to-purple-900">
      {/* Header Controls */}
      <div className="border-b border-green-500/30 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Globe className="w-6 h-6 text-green-400" />
            <div>
              <h2 className="text-xl font-bold text-white">AR World Drops</h2>
              <p className="text-sm text-green-300">Discover stories in your world</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex space-x-1 bg-black/30 rounded-lg p-1">
              <Button
                size="sm"
                variant={mapView === 'ar' ? 'default' : 'ghost'}
                onClick={() => setMapView('ar')}
                className="h-8 px-3"
              >
                <Camera className="w-4 h-4 mr-1" />
                AR
              </Button>
              <Button
                size="sm"
                variant={mapView === 'map' ? 'default' : 'ghost'}
                onClick={() => setMapView('map')}
                className="h-8 px-3"
              >
                <MapPin className="w-4 h-4 mr-1" />
                Map
              </Button>
              <Button
                size="sm"
                variant={mapView === 'list' ? 'default' : 'ghost'}
                onClick={() => setMapView('list')}
                className="h-8 px-3"
              >
                <Layers className="w-4 h-4 mr-1" />
                List
              </Button>
            </div>
            
            <Button
              onClick={() => setShowCreateDrop(true)}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              <Target className="w-4 h-4 mr-2" />
              Drop Story
            </Button>
          </div>
        </div>
        
        {/* Filter Controls */}
        <div className="px-4 pb-4 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-green-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-black/30 border border-green-500/30 rounded px-2 py-1 text-sm text-white"
            >
              <option value="all">All Drops</option>
              <option value="friends">Friends Only</option>
              <option value="trending">Trending</option>
              <option value="recent">Recent</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-green-400" />
            <input
              type="range"
              min="100"
              max="5000"
              value={searchRadius}
              onChange={(e) => setSearchRadius(parseInt(e.target.value))}
              className="w-24 h-2 bg-green-600 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm text-green-300">{searchRadius}m</span>
          </div>
          
          <Badge variant="outline" className="border-green-500/50 text-green-300">
            {filteredDrops.length} drops nearby
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* AR Camera View */}
        {mapView === 'ar' && (
          <div className="absolute inset-0">
            {arEnabled ? (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* AR Overlays */}
                <div className="absolute inset-0 pointer-events-none">
                  {filteredDrops.map((drop) => {
                    if (!userLocation) return null;
                    
                    const distance = calculateDistance(
                      userLocation.lat, userLocation.lng,
                      drop.location.lat, drop.location.lng
                    );
                    
                    // Simple AR positioning (in real app, use AR.js or similar)
                    const x = 50 + (drop.location.lng - userLocation.lng) * 10000;
                    const y = 50 + (drop.location.lat - userLocation.lat) * 10000;
                    
                    return (
                      <div
                        key={drop.id}
                        className="absolute pointer-events-auto"
                        style={{
                          left: `${Math.max(10, Math.min(90, x))}%`,
                          top: `${Math.max(10, Math.min(80, y))}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-green-500/50 max-w-48">
                          <div className="flex items-center space-x-2 mb-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={drop.user?.avatar} />
                              <AvatarFallback className="text-xs">
                                {drop.user?.alias?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-green-300 font-medium">
                              {drop.user?.alias}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-white mb-1">
                            {drop.title}
                          </h4>
                          <p className="text-xs text-gray-300 line-clamp-2 mb-2">
                            {drop.content}
                          </p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-green-400">
                              {Math.round(distance)}m away
                            </span>
                            <Button
                              size="sm"
                              onClick={() => discoverDrop(drop)}
                              className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700"
                            >
                              Discover
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* AR Controls */}
                <div className="absolute top-4 right-4 space-y-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={disableAR}
                    className="bg-black/70 border-green-500/50"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-black/70 border-green-500/50"
                  >
                    <Crosshair className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full bg-black/90">
                <div className="text-center space-y-4">
                  <Camera className="w-16 h-16 text-green-400 mx-auto" />
                  <h3 className="text-xl font-semibold text-white">AR Camera Required</h3>
                  <p className="text-green-300 max-w-md">
                    Enable your camera to see AR story drops overlaid in the real world
                  </p>
                  <Button
                    onClick={enableAR}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Enable AR Camera
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Map View */}
        {mapView === 'map' && (
          <div className="h-full bg-gradient-to-br from-blue-900/50 to-green-900/50 flex items-center justify-center">
            <div className="text-center space-y-4">
              <MapPin className="w-16 h-16 text-blue-400 mx-auto" />
              <h3 className="text-xl font-semibold text-white">Interactive Map</h3>
              <p className="text-blue-300 max-w-md">
                Interactive map integration would show AR drops on a real map interface
              </p>
              <div className="grid grid-cols-2 gap-4 mt-6">
                {filteredDrops.slice(0, 4).map((drop) => (
                  <Card key={drop.id} className="bg-black/40 border-blue-500/30">
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-white">
                          {drop.location.name}
                        </span>
                      </div>
                      <p className="text-xs text-blue-300">{drop.title}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* List View */}
        {mapView === 'list' && (
          <div className="h-full overflow-y-auto p-6">
            <div className="space-y-4">
              {filteredDrops.map((drop) => {
                const distance = userLocation ? calculateDistance(
                  userLocation.lat, userLocation.lng,
                  drop.location.lat, drop.location.lng
                ) : 0;
                
                return (
                  <Card key={drop.id} className="bg-black/40 border-green-500/30 hover:border-green-400/50 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={drop.user?.avatar} />
                          <AvatarFallback>{drop.user?.alias?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-white">{drop.title}</h3>
                            <Badge variant="outline" className="text-xs border-green-500/50 text-green-300">
                              {Math.round(distance)}m
                            </Badge>
                          </div>
                          
                          <p className="text-gray-300 text-sm mb-3">{drop.content}</p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4" />
                                <span>{drop.location.name}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Users className="w-4 h-4" />
                                <span>{drop.discoveredBy.length}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-green-500/50 text-green-300 hover:bg-green-600/20"
                              >
                                <Heart className="w-4 h-4 mr-1" />
                                {drop.likes}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => discoverDrop(drop)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Discover
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Create AR Drop Modal */}
      {showCreateDrop && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-gradient-to-br from-green-900 to-blue-900 border-green-500 max-w-lg w-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                <span>Drop Story in AR World</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateDrop(false)}
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-green-300 mb-2 block">Story Title</label>
                <Input
                  placeholder="What did you discover?"
                  className="bg-black/30 border-green-500/50 text-white"
                />
              </div>
              
              <div>
                <label className="text-sm text-green-300 mb-2 block">Story Content</label>
                <Textarea
                  placeholder="Tell others about this location..."
                  className="bg-black/30 border-green-500/50 text-white min-h-[100px]"
                />
              </div>
              
              <div>
                <label className="text-sm text-green-300 mb-2 block">Location</label>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Current location"
                    value={userLocation ? "Using current location" : "Location required"}
                    disabled
                    className="bg-black/30 border-green-500/50 text-white"
                  />
                  <Button size="sm" variant="outline" className="border-green-500/50">
                    <Navigation className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline" className="border-green-500/50">
                  <Camera className="w-4 h-4 mr-1" />
                  Photo
                </Button>
                <Button size="sm" variant="outline" className="border-green-500/50">
                  <MapPin className="w-4 h-4 mr-1" />
                  Pin Location
                </Button>
              </div>
              
              <Button
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                onClick={() => createARDrop({})}
              >
                <Target className="w-4 h-4 mr-2" />
                Drop Story Here
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}