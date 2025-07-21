import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Edit3, 
  Save, 
  Camera, 
  Shield, 
  Key, 
  Settings,
  Zap,
  Brain,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import type { User as UserType, UpdateUser } from '@shared/schema';

interface RealCipherProfileProps {
  user: UserType;
  onProfileUpdate?: (user: UserType) => void;
}

export function RealCipherProfile({ user, onProfileUpdate }: RealCipherProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [formData, setFormData] = useState({
    alias: user.alias || '',
    profile: user.profile || '',
    avatar: user.avatar || '',
    securityLevel: user.securityLevel || 1,
    nodeCapabilities: user.nodeCapabilities || []
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Available capabilities for mesh network
  const availableCapabilities = [
    'quantum-relay',
    'neural-bridge', 
    'void-comm',
    'data-vault',
    'stealth-mode',
    'crypto-shield',
    'mesh-relay',
    'signal-boost',
    'phantom-route',
    'cipher-node'
  ];

  // Security levels with descriptions
  const securityLevels = [
    { level: 1, name: 'Initiate', color: 'text-gray-400', description: 'Basic mesh access' },
    { level: 2, name: 'Operative', color: 'text-blue-400', description: 'Standard encryption' },
    { level: 3, name: 'Agent', color: 'text-green-400', description: 'Enhanced security' },
    { level: 4, name: 'Cipher', color: 'text-purple-400', description: 'Quantum protocols' },
    { level: 5, name: 'Phantom', color: 'text-red-400', description: 'Maximum clearance' }
  ];

  const updateProfileMutation = useMutation({
    mutationFn: async (updateData: UpdateUser) => {
      return apiRequest(`/api/users/${user.id}`, {
        method: 'PATCH',
        body: updateData
      });
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "Profile Updated",
        description: "Your cipher profile has been synchronized across the mesh network."
      });
      setIsEditing(false);
      onProfileUpdate?.(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Unable to synchronize profile changes to the mesh network.",
        variant: "destructive"
      });
    }
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setFormData(prev => ({ ...prev, avatar: imageUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const updateData: UpdateUser = {
      alias: formData.alias || undefined,
      profile: formData.profile || undefined,
      avatar: formData.avatar || undefined,
      securityLevel: formData.securityLevel,
      nodeCapabilities: formData.nodeCapabilities
    };

    updateProfileMutation.mutate(updateData);
  };

  const toggleCapability = (capability: string) => {
    setFormData(prev => ({
      ...prev,
      nodeCapabilities: prev.nodeCapabilities.includes(capability)
        ? prev.nodeCapabilities.filter(c => c !== capability)
        : [...prev.nodeCapabilities, capability]
    }));
  };

  const getCurrentSecurityLevel = () => {
    return securityLevels.find(s => s.level === (isEditing ? formData.securityLevel : user.securityLevel)) || securityLevels[0];
  };

  const getCapabilityColor = (capability: string) => {
    const colors = [
      'border-purple-500/30 text-purple-400',
      'border-cyan-500/30 text-cyan-400',
      'border-green-500/30 text-green-400',
      'border-orange-500/30 text-orange-400',
      'border-pink-500/30 text-pink-400'
    ];
    return colors[capability.length % colors.length];
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card className="border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-cyan-900/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-2 border-purple-500/50 overflow-hidden bg-gray-800 flex items-center justify-center">
                  {(isEditing ? formData.avatar : user.avatar) ? (
                    <img 
                      src={isEditing ? formData.avatar : user.avatar || ''} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-gray-400" />
                  )}
                </div>
                {isEditing && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0 border-purple-500/50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <div className="space-y-1">
                {isEditing ? (
                  <Input
                    value={formData.alias}
                    onChange={(e) => setFormData(prev => ({ ...prev, alias: e.target.value }))}
                    placeholder="Cipher alias..."
                    className="text-xl font-bold bg-black/50 border-purple-500/30 text-white"
                  />
                ) : (
                  <h2 className="text-2xl font-bold text-white">{user.alias}</h2>
                )}
                <div className="flex items-center space-x-2">
                  <Badge className={cn("px-2 py-1", getCurrentSecurityLevel().color, "border-current bg-current/10")}>
                    <Shield className="w-3 h-3 mr-1" />
                    {getCurrentSecurityLevel().name}
                  </Badge>
                  <Badge variant="outline" className="text-cyan-400 border-cyan-500/30">
                    <Key className="w-3 h-3 mr-1" />
                    {user.meshCallsign}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} disabled={updateProfileMutation.isPending} className="bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} variant="outline" className="border-purple-500/30 text-purple-400">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={formData.profile}
              onChange={(e) => setFormData(prev => ({ ...prev, profile: e.target.value }))}
              placeholder="Describe your role in the mesh network..."
              className="w-full bg-black/50 border-purple-500/30 text-white placeholder-gray-400 min-h-[80px]"
            />
          ) : (
            <p className="text-gray-300 leading-relaxed">
              {user.profile || 'No profile information available. Click edit to add your cipher identity.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Security Configuration */}
      <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-900/20 to-blue-900/10">
        <CardHeader>
          <CardTitle className="flex items-center text-cyan-400">
            <Shield className="w-5 h-5 mr-2" />
            Security Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Security Level */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Security Clearance Level</h3>
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                {securityLevels.map((level) => (
                  <Button
                    key={level.level}
                    variant={formData.securityLevel === level.level ? "default" : "outline"}
                    className={cn(
                      "p-4 flex flex-col items-center space-y-1",
                      formData.securityLevel === level.level
                        ? `${level.color} bg-current/20 border-current`
                        : `${level.color} border-current/30`
                    )}
                    onClick={() => setFormData(prev => ({ ...prev, securityLevel: level.level }))}
                  >
                    <span className="font-bold">{level.level}</span>
                    <span className="text-sm">{level.name}</span>
                  </Button>
                ))}
              </div>
            ) : (
              <div className={cn("p-4 border rounded-lg", getCurrentSecurityLevel().color, "border-current bg-current/10")}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold">Level {getCurrentSecurityLevel().level} - {getCurrentSecurityLevel().name}</h4>
                    <p className="text-sm opacity-80">{getCurrentSecurityLevel().description}</p>
                  </div>
                  <Shield className="w-8 h-8" />
                </div>
              </div>
            )}
          </div>

          {/* Node Capabilities */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Node Capabilities</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {availableCapabilities.map((capability) => {
                const isActive = (isEditing ? formData.nodeCapabilities : user.nodeCapabilities || []).includes(capability);
                const colorClass = getCapabilityColor(capability);
                
                return (
                  <Button
                    key={capability}
                    variant="outline"
                    className={cn(
                      "h-auto p-3 flex flex-col items-center space-y-1 text-xs",
                      isActive ? colorClass + " bg-current/20" : "border-gray-700 text-gray-400",
                      isEditing && "cursor-pointer hover:bg-current/10"
                    )}
                    onClick={isEditing ? () => toggleCapability(capability) : undefined}
                    disabled={!isEditing}
                  >
                    <Zap className="w-4 h-4" />
                    <span className="font-medium leading-tight text-center">
                      {capability.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    {isActive && <div className="w-2 h-2 rounded-full bg-current" />}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Cryptographic Keys */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Cryptographic Keys</h3>
            <div className="space-y-3">
              <div className="p-4 border border-green-500/30 rounded-lg bg-green-900/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-green-400">Public Key</h4>
                    <p className="text-xs text-gray-400 font-mono mt-1">
                      {user.publicKey.slice(0, 32)}...{user.publicKey.slice(-8)}
                    </p>
                  </div>
                  <Key className="w-5 h-5 text-green-400" />
                </div>
              </div>
              
              <div className="p-4 border border-red-500/30 rounded-lg bg-red-900/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-red-400">Private Key (Encrypted)</h4>
                    <p className="text-xs text-gray-400 font-mono mt-1">
                      {showPrivateKey 
                        ? user.privateKeyEncrypted || 'Not available'
                        : '••••••••••••••••••••••••••••••••'
                      }
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                  >
                    {showPrivateKey ? (
                      <EyeOff className="w-4 h-4 text-red-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-red-400" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device Information */}
      <Card className="border-orange-500/30 bg-gradient-to-br from-orange-900/20 to-yellow-900/10">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-400">
            <Settings className="w-5 h-5 mr-2" />
            Device Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-white">Device ID</h4>
              <p className="text-gray-400 font-mono text-sm">{user.deviceId}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-white">Mesh Callsign</h4>
              <p className="text-gray-400 font-mono text-sm">{user.meshCallsign}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-white">Online Status</h4>
              <Badge className={user.isOnline ? "bg-green-600 text-white" : "bg-red-600 text-white"}>
                {user.isOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-white">Last Seen</h4>
              <p className="text-gray-400 text-sm">
                {user.lastSeen ? new Date(user.lastSeen).toLocaleString() : 'Unknown'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}