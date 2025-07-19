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
import type { User as UserType, UpdateUser } from '@shared/schema';

interface CipherProfileProps {
  user: UserType;
  onProfileUpdate?: (user: UserType) => void;
}

export function CipherProfile({ user, onProfileUpdate }: CipherProfileProps) {
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
        description: "Your cipher profile has been successfully updated",
      });
      setIsEditing(false);
      onProfileUpdate?.(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      alias: user.alias || '',
      profile: user.profile || '',
      avatar: user.avatar || '',
      securityLevel: user.securityLevel || 1,
      nodeCapabilities: user.nodeCapabilities || []
    });
    setIsEditing(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormData(prev => ({ ...prev, avatar: result }));
      };
      reader.readAsDataURL(file);
    }
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
                      src={isEditing ? formData.avatar : user.avatar} 
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
                    className="text-2xl font-bold bg-transparent border-purple-500/30 text-purple-400 font-mono"
                    placeholder="Enter alias..."
                  />
                ) : (
                  <h1 className="text-3xl font-bold text-purple-400 font-mono">
                    {user.alias || 'UNNAMED_NODE'}
                  </h1>
                )}
                <div className="flex items-center space-x-3">
                  <Badge className="bg-cyan-900/30 text-cyan-400 border-cyan-500/30">
                    Callsign: {user.meshCallsign || 'UNASSIGNED'}
                  </Badge>
                  <Badge className={`${getCurrentSecurityLevel().color} border-current`}>
                    <Shield className="w-3 h-3 mr-1" />
                    {getCurrentSecurityLevel().name}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="border-gray-600 text-gray-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={updateProfileMutation.isPending}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card className="border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-cyan-400">
              <Brain className="w-5 h-5" />
              <span>Neural Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300">Profile Description</label>
              {isEditing ? (
                <Textarea
                  value={formData.profile}
                  onChange={(e) => setFormData(prev => ({ ...prev, profile: e.target.value }))}
                  placeholder="Enter your profile description..."
                  className="mt-1 bg-gray-900 border-gray-600 text-gray-300"
                  rows={4}
                />
              ) : (
                <p className="mt-1 text-gray-400 p-3 bg-gray-900/50 rounded border border-gray-700">
                  {user.profile || 'No profile description available'}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300">Security Clearance</label>
              {isEditing ? (
                <select
                  value={formData.securityLevel}
                  onChange={(e) => setFormData(prev => ({ ...prev, securityLevel: parseInt(e.target.value) }))}
                  className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-gray-300"
                >
                  {securityLevels.map(level => (
                    <option key={level.level} value={level.level}>
                      Level {level.level} - {level.name} ({level.description})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="mt-1 p-3 bg-gray-900/50 rounded border border-gray-700">
                  <div className={`font-bold ${getCurrentSecurityLevel().color}`}>
                    Level {getCurrentSecurityLevel().level} - {getCurrentSecurityLevel().name}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    {getCurrentSecurityLevel().description}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300">Device Information</label>
              <div className="mt-1 space-y-2">
                <div className="p-3 bg-gray-900/50 rounded border border-gray-700">
                  <div className="text-sm text-gray-400">Device ID</div>
                  <div className="font-mono text-xs text-green-400">{user.deviceId}</div>
                </div>
                <div className="p-3 bg-gray-900/50 rounded border border-gray-700">
                  <div className="text-sm text-gray-400">Last Seen</div>
                  <div className="text-xs text-gray-300">
                    {user.lastSeen ? new Date(user.lastSeen).toLocaleString() : 'Never'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Node Capabilities */}
        <Card className="border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-400">
              <Zap className="w-5 h-5" />
              <span>Node Capabilities</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {availableCapabilities.map(capability => {
                const isSelected = (isEditing ? formData.nodeCapabilities : user.nodeCapabilities).includes(capability);
                return (
                  <Button
                    key={capability}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className={`justify-start text-xs font-mono ${
                      isSelected 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : `${getCapabilityColor(capability)} hover:bg-gray-800`
                    }`}
                    onClick={() => isEditing && toggleCapability(capability)}
                    disabled={!isEditing}
                  >
                    {capability}
                  </Button>
                );
              })}
            </div>
            {!isEditing && user.nodeCapabilities.length === 0 && (
              <p className="text-gray-500 text-sm italic">No capabilities configured</p>
            )}
          </CardContent>
        </Card>

        {/* Cryptographic Keys */}
        <Card className="border-gray-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-400">
              <Key className="w-5 h-5" />
              <span>Cryptographic Keys</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300">Public Key</label>
                <div className="mt-1 p-3 bg-gray-900/50 rounded border border-gray-700">
                  <div className="font-mono text-xs text-green-400 break-all">
                    {user.publicKey || 'No public key available'}
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">Private Key</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    className="text-gray-400 hover:text-gray-300"
                  >
                    {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="mt-1 p-3 bg-gray-900/50 rounded border border-gray-700">
                  <div className="font-mono text-xs text-red-400 break-all">
                    {showPrivateKey 
                      ? (user.privateKeyEncrypted || 'No private key available')
                      : '••••••••••••••••••••••••••••••••••••••••••••••••••••'
                    }
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <Button
                variant="outline"
                className="border-orange-500/30 text-orange-400 hover:bg-orange-900/20"
              >
                <Lock className="w-4 h-4 mr-2" />
                Generate New Key Pair
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}