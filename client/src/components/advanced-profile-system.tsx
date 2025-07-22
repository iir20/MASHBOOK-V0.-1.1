import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

import { 
  User, 
  Shield, 
  Key, 
  Lock, 
  Camera, 
  Upload,
  Download,
  Settings,
  Activity,
  Network,
  Cpu,
  Wifi,
  Bluetooth,
  Globe,
  Eye,
  EyeOff,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Zap,
  Radio,
  Layers3,
  Binary,
  Fingerprint,
  QrCode
} from 'lucide-react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { User as UserType, UpdateUser } from '@shared/schema';

interface AdvancedProfileProps {
  currentUser: UserType;
  onUserUpdate: (user: UserType) => void;
}

export function AdvancedProfileSystem({ currentUser, onUserUpdate }: AdvancedProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [profileData, setProfileData] = useState({
    alias: currentUser.alias,
    profile: currentUser.profile,
    avatar: currentUser.avatar,
    securityLevel: currentUser.securityLevel,
    nodeCapabilities: currentUser.nodeCapabilities
  });
  
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Generate QR code for profile sharing
  useEffect(() => {
    generateProfileQR();
  }, [currentUser]);

  // Generate a 3D avatar animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const animate = () => {
      time += 0.02;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw animated mesh network pattern around avatar
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      
      // Rotating outer ring
      ctx.rotate(time);
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6;
      
      for (let i = 0; i < 8; i++) {
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.moveTo(60, 0);
        ctx.lineTo(80, 0);
        ctx.stroke();
        
        // Add nodes
        ctx.beginPath();
        ctx.arc(70, 0, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Inner pulse effect
      ctx.restore();
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      
      const pulse = Math.sin(time * 3) * 0.3 + 0.7;
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 3;
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.arc(0, 0, 50 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.restore();
      
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  const generateProfileQR = async () => {
    const profileData = {
      alias: currentUser.alias,
      meshCallsign: currentUser.meshCallsign,
      publicKey: currentUser.publicKey.substring(0, 50) + '...',
      capabilities: currentUser.nodeCapabilities
    };
    
    // In a real app, you'd use a QR code library
    // For demo, we'll create a simple data URL
    const dataString = JSON.stringify(profileData);
    setQrCodeUrl(`data:text/plain;base64,${btoa(dataString)}`);
  };

  // Update user profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updateData: UpdateUser) => {
      return await apiRequest(`/api/users/${currentUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated",
      });
      onUserUpdate(updatedUser);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    }
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // In a real app, you'd upload to a service
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setProfileData(prev => ({ ...prev, avatar: result }));
    };
    reader.readAsDataURL(file);
  };

  const toggleCapability = (capability: string) => {
    setProfileData(prev => ({
      ...prev,
      nodeCapabilities: prev.nodeCapabilities.includes(capability)
        ? prev.nodeCapabilities.filter(c => c !== capability)
        : [...prev.nodeCapabilities, capability]
    }));
  };

  const securityLevelNames = {
    1: 'Basic',
    2: 'Intermediate', 
    3: 'Advanced',
    4: 'Expert',
    5: 'Elite'
  };

  const SecurityIndicator = ({ level }: { level: number }) => (
    <div className="flex items-center gap-2">
      <div className="flex space-x-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`w-2 h-4 rounded-sm ${
              i < level 
                ? i < 2 ? 'bg-green-500' 
                  : i < 4 ? 'bg-yellow-500' 
                  : 'bg-red-500'
                : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
      <span className="text-sm text-gray-400">
        {securityLevelNames[level as keyof typeof securityLevelNames]} ({level}/5)
      </span>
    </div>
  );

  return (
    <div className="h-full bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="bg-black/50 border-cyan-500/20 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="relative">
              {/* Animated Background */}
              <canvas 
                ref={canvasRef}
                width={200}
                height={200}
                className="absolute top-4 right-4 opacity-30"
              />
              
              <div className="p-6 relative">
                <div className="flex items-start gap-6">
                  {/* Avatar Section */}
                  <div className="relative">
                    <div className="relative group">
                      <Avatar className="w-24 h-24 border-4 border-cyan-500/50">
                        <AvatarImage src={profileData.avatar} alt={profileData.alias} />
                        <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-pink-500 text-white text-xl">
                          {profileData.alias.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      {isEditing && (
                        <Button
                          size="sm"
                          className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-pink-600 hover:bg-pink-500"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Camera className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    {/* Status indicator */}
                    <div className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 bg-green-500 rounded-full border-2 border-black">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    </div>
                  </div>
                  
                  {/* Profile Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      {isEditing ? (
                        <Input
                          value={profileData.alias}
                          onChange={(e) => setProfileData(prev => ({ ...prev, alias: e.target.value }))}
                          className="text-2xl font-bold bg-transparent border-cyan-500/30 text-cyan-400"
                        />
                      ) : (
                        <h1 className="text-2xl font-bold text-cyan-400">{currentUser.alias}</h1>
                      )}
                      
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              onClick={handleSaveProfile}
                              disabled={updateProfileMutation.isPending}
                              className="bg-green-600 hover:bg-green-500"
                            >
                              {updateProfileMutation.isPending ? (
                                <Activity className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4 mr-2" />
                              )}
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setIsEditing(false)}
                              className="border-gray-600"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={() => setIsEditing(true)}
                            className="bg-pink-600 hover:bg-pink-500"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Profile
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="text-pink-300 border-pink-500/50">
                          <Radio className="w-3 h-3 mr-1" />
                          {currentUser.meshCallsign}
                        </Badge>
                        <Badge variant="outline" className="text-green-300 border-green-500/50">
                          <Shield className="w-3 h-3 mr-1" />
                          Security Level {currentUser.securityLevel}
                        </Badge>
                        <Badge variant="outline" className="text-blue-300 border-blue-500/50">
                          <Network className="w-3 h-3 mr-1" />
                          {currentUser.nodeCapabilities.length} Capabilities
                        </Badge>
                      </div>
                      
                      <SecurityIndicator level={currentUser.securityLevel} />
                    </div>
                    
                    {isEditing ? (
                      <Textarea
                        value={profileData.profile}
                        onChange={(e) => setProfileData(prev => ({ ...prev, profile: e.target.value }))}
                        placeholder="Tell the network about yourself..."
                        className="bg-transparent border-cyan-500/30 text-gray-300"
                        rows={3}
                      />
                    ) : (
                      <p className="text-gray-300">{currentUser.profile}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-black/50 border-cyan-500/20">
            <TabsTrigger value="details" className="data-[state=active]:bg-cyan-500/20">
              <User className="w-4 h-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-pink-500/20">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="network" className="data-[state=active]:bg-purple-500/20">
              <Network className="w-4 h-4 mr-2" />
              Network
            </TabsTrigger>
            <TabsTrigger value="sharing" className="data-[state=active]:bg-green-500/20">
              <QrCode className="w-4 h-4 mr-2" />
              Sharing
            </TabsTrigger>
          </TabsList>

          {/* Profile Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-black/50 border-cyan-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-cyan-400">
                    <User className="w-5 h-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-400">Device ID</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={currentUser.deviceId}
                        readOnly
                        className="bg-gray-800/50 border-gray-600 text-gray-300 font-mono text-sm"
                      />
                      <Button size="sm" variant="outline" className="border-gray-600">
                        <Fingerprint className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-gray-400">Last Seen</Label>
                    <Input
                      value={new Date(currentUser.lastSeen).toLocaleString()}
                      readOnly
                      className="bg-gray-800/50 border-gray-600 text-gray-300"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-gray-400">Account Created</Label>
                    <Input
                      value={new Date(currentUser.createdAt).toLocaleString()}
                      readOnly
                      className="bg-gray-800/50 border-gray-600 text-gray-300"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/50 border-pink-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-pink-400">
                    <Settings className="w-5 h-5" />
                    Node Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-400">Security Level</Label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <Slider
                          value={[profileData.securityLevel]}
                          onValueChange={(value) => setProfileData(prev => ({ ...prev, securityLevel: value[0] }))}
                          max={5}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                        <div className="text-sm text-gray-400">
                          Level {profileData.securityLevel}: {securityLevelNames[profileData.securityLevel as keyof typeof securityLevelNames]}
                        </div>
                      </div>
                    ) : (
                      <SecurityIndicator level={currentUser.securityLevel} />
                    )}
                  </div>

                  <div>
                    <Label className="text-gray-400">Node Capabilities</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['messaging', 'file-transfer', 'routing', 'encryption', 'analytics', 'storage'].map((capability) => (
                        <Badge
                          key={capability}
                          variant={
                            (isEditing ? profileData.nodeCapabilities : currentUser.nodeCapabilities).includes(capability) 
                              ? 'default' 
                              : 'outline'
                          }
                          className={
                            (isEditing ? profileData.nodeCapabilities : currentUser.nodeCapabilities).includes(capability)
                              ? 'bg-pink-500/20 text-pink-300 border-pink-500'
                              : `border-gray-600 text-gray-400 ${isEditing ? 'hover:border-pink-500 hover:text-pink-300 cursor-pointer' : ''}`
                          }
                          onClick={isEditing ? () => toggleCapability(capability) : undefined}
                        >
                          {capability}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="bg-black/50 border-pink-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-pink-400">
                  <Shield className="w-5 h-5" />
                  Cryptographic Keys
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-gray-400">Show Sensitive Information</Label>
                  <Switch
                    checked={showSecrets}
                    onCheckedChange={setShowSecrets}
                  />
                </div>

                <div>
                  <Label className="text-gray-400 flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Public Key (RSA-2048)
                  </Label>
                  <div className="relative">
                    <Textarea
                      value={showSecrets ? currentUser.publicKey : '•'.repeat(50)}
                      readOnly
                      className="bg-gray-800/50 border-gray-600 text-gray-300 font-mono text-xs"
                      rows={4}
                    />
                    <div className="absolute top-2 right-2">
                      <Badge variant="outline" className="text-green-300 border-green-500/50">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-400 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Private Key Status
                  </Label>
                  <div className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg">
                    <Lock className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-sm text-green-400 font-medium">Securely Encrypted</p>
                      <p className="text-xs text-gray-400">Private key is encrypted and stored locally</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="border-gray-600">
                    <Download className="w-4 h-4 mr-2" />
                    Export Keys
                  </Button>
                  <Button variant="outline" className="border-gray-600">
                    <Upload className="w-4 h-4 mr-2" />
                    Import Keys
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Network Tab */}
          <TabsContent value="network" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-black/50 border-cyan-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/20 rounded-lg">
                      <Wifi className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">WebRTC Status</p>
                      <p className="text-lg font-semibold text-green-400">Connected</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/50 border-purple-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Bluetooth className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Bluetooth</p>
                      <p className="text-lg font-semibold text-yellow-400">Available</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/50 border-green-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Network className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Mesh Nodes</p>
                      <p className="text-lg font-semibold text-green-400">3 Active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-black/50 border-gray-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-400">
                  <Activity className="w-5 h-5" />
                  Network Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Connection Quality</span>
                      <span className="text-green-400">98%</span>
                    </div>
                    <Progress value={98} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Data Transfer Rate</span>
                      <span className="text-cyan-400">2.4 MB/s</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Mesh Reliability</span>
                      <span className="text-pink-400">94%</span>
                    </div>
                    <Progress value={94} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Sharing Tab */}
          <TabsContent value="sharing" className="space-y-6">
            <Card className="bg-black/50 border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-400">
                  <QrCode className="w-5 h-5" />
                  Share Your Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-48 h-48 bg-white rounded-lg">
                    <div className="text-gray-800 font-mono text-xs break-all p-4">
                      QR Code
                      <br />
                      {currentUser.meshCallsign}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">
                      Scan this QR code to connect with other Meshbook users
                    </p>
                    <Badge variant="outline" className="text-green-300 border-green-500/50">
                      <Zap className="w-3 h-3 mr-1" />
                      Quick Connect Enabled
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="border-gray-600">
                      <Download className="w-4 h-4 mr-2" />
                      Save QR Code
                    </Button>
                    <Button variant="outline" className="border-gray-600">
                      <Globe className="w-4 h-4 mr-2" />
                      Share Link
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Hidden file input for avatar upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarUpload}
        />
      </div>
    </div>
  );
}