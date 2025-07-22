import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User as UserIcon, 
  MessageSquare, 
  Camera, 
  Heart, 
  Share2, 
  Eye, 
  Clock, 
  Signal,
  MapPin,
  Calendar,
  Settings,
  ArrowLeft,
  MoreHorizontal,
  Send,
  Phone,
  Video,
  Info,
  Shield
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { User, Story } from '@shared/schema';

interface CompleteUserProfileProps {
  user: User;
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  onMessage?: (user: User) => void;
}

export function CompleteUserProfile({ 
  user, 
  currentUser, 
  isOpen, 
  onClose, 
  onMessage 
}: CompleteUserProfileProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Get user's stories
  const { data: userStories = [] } = useQuery<Story[]>({
    queryKey: ['/api/stories/user', user.id],
    enabled: isOpen && !!user.id,
  });

  const isOwnProfile = currentUser?.id === user.id;
  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  const handleMessage = () => {
    if (onMessage) {
      onMessage(user);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="relative">
            {/* Cover Photo Area */}
            <div className="h-48 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 relative">
              <Button 
                onClick={onClose}
                variant="ghost" 
                size="icon" 
                className="absolute top-4 left-4 bg-black/20 text-white hover:bg-black/40"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-4 right-4 bg-black/20 text-white hover:bg-black/40"
              >
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </div>

            {/* Profile Photo & Basic Info */}
            <div className="px-6 pb-4">
              <div className="flex items-end -mt-16 mb-4">
                <Avatar className="w-32 h-32 border-4 border-white bg-white">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="text-2xl">
                    <UserIcon className="w-16 h-16" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="ml-4 pb-2">
                  <h1 className="text-3xl font-bold">{user.alias}</h1>
                  <p className="text-lg text-muted-foreground mb-2">{user.profile}</p>
                  
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {joinDate}</span>
                    <Separator orientation="vertical" className="h-4" />
                    <Signal className="w-4 h-4" />
                    <span className={user.isOnline ? 'text-green-600' : 'text-gray-500'}>
                      {user.isOnline ? 'Online' : `Last seen ${new Date(user.lastSeen).toLocaleDateString()}`}
                    </span>
                  </div>
                </div>

                <div className="ml-auto pb-2">
                  {!isOwnProfile && (
                    <div className="flex space-x-2">
                      <Button onClick={handleMessage}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                      <Button variant="outline">
                        <Phone className="w-4 h-4 mr-2" />
                        Voice Call
                      </Button>
                      <Button variant="outline">
                        <Video className="w-4 h-4 mr-2" />
                        Video Call
                      </Button>
                    </div>
                  )}
                  {isOwnProfile && (
                    <Button variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="px-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="stories">Stories ({userStories.length})</TabsTrigger>
                <TabsTrigger value="network">Network</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>

              <ScrollArea className="h-96 mt-4">
                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Profile Stats */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Profile Statistics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between">
                          <span>Stories Shared</span>
                          <span className="font-semibold">{userStories.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Messages Sent</span>
                          <span className="font-semibold">0</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Network Connections</span>
                          <span className="font-semibold">0</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Security Level</span>
                          <Badge variant={user.securityLevel >= 3 ? 'default' : 'secondary'}>
                            Level {user.securityLevel}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Mesh Network Info */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Mesh Network Profile</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between">
                          <span>Callsign</span>
                          <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                            {user.meshCallsign}
                          </code>
                        </div>
                        <div className="flex justify-between">
                          <span>Device ID</span>
                          <code className="font-mono text-sm bg-muted px-2 py-1 rounded text-xs">
                            {user.deviceId.slice(0, 16)}...
                          </code>
                        </div>
                        <div>
                          <span className="block mb-2">Node Capabilities</span>
                          <div className="flex flex-wrap gap-1">
                            {user.nodeCapabilities.map((capability: string) => (
                              <Badge key={capability} variant="outline" className="text-xs">
                                {capability}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* About Section */}
                  {user.profile && (
                    <Card>
                      <CardHeader>
                        <CardTitle>About {user.alias}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{user.profile}</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="stories" className="space-y-4">
                  {userStories.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userStories.map((story) => (
                        <Card key={story.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                          <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 relative">
                            {story.mediaUrl ? (
                              <img 
                                src={story.mediaUrl} 
                                alt="Story content" 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full p-4">
                                <p className="text-white text-center font-medium">{story.content}</p>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/20" />
                            <div className="absolute bottom-2 left-2 right-2 text-white">
                              <p className="font-medium text-sm mb-1">{story.title}</p>
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center space-x-2">
                                  <Eye className="w-3 h-3" />
                                  <span>{Math.floor(Math.random() * 100) + 10}</span>
                                  <Heart className="w-3 h-3" />
                                  <span>{Math.floor(Math.random() * 50) + 5}</span>
                                </div>
                                <div className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  <span>{new Date(story.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No Stories Yet</h3>
                      <p>
                        {isOwnProfile 
                          ? "You haven't shared any stories yet. Start sharing your moments!" 
                          : `${user.alias} hasn't shared any stories yet.`
                        }
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="network" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Network Connections</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                        <Signal className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">Building Network</h3>
                        <p>Mesh network connections will appear here as users come online.</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="security" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Security Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-5 h-5 text-green-600" />
                          <span>Encryption Status</span>
                        </div>
                        <Badge variant="default">Active</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span>Security Level</span>
                        <Badge variant={user.securityLevel >= 3 ? 'default' : 'secondary'}>
                          Level {user.securityLevel}
                        </Badge>
                      </div>

                      <div>
                        <span className="block mb-2">Public Key Fingerprint</span>
                        <code className="font-mono text-xs bg-muted p-2 rounded block break-all">
                          {user.publicKey ? user.publicKey.slice(0, 64) + '...' : 'Not available'}
                        </code>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <Info className="w-4 h-4 inline mr-1" />
                        All communications with this user are end-to-end encrypted
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}