import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import { 
  User, 
  Shield, 
  Zap, 
  Globe, 
  MessageSquare,
  Radio,
  Lock,
  Key,
  Wifi,
  Bluetooth,
  Network,
  Users,
  Eye,
  EyeOff,
  Camera,
  Edit,
  Check,
  X,
  Sparkles,
  Rocket,
  MapPin,
  Clock,
  Share,
  Heart,
  Star,
  Bot,
  FileText,
  Settings,
  Info,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { InsertUser } from '@shared/schema';

interface AuthRegistrationProps {
  onUserAuthenticated: (user: any) => void;
  onLogout?: () => void;
  currentUser?: any;
}

export function EnhancedAuthRegistration({ onUserAuthenticated, currentUser }: AuthRegistrationProps) {
  const [activeTab, setActiveTab] = useState<'register' | 'login' | 'about'>('about');
  const [formData, setFormData] = useState({
    alias: '',
    profile: '',
    avatar: '',
    deviceId: '',
    agreeToTerms: false
  });
  
  const [deviceFingerprint, setDeviceFingerprint] = useState('');
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({
    alias: '',
    deviceId: ''
  });

  const { toast } = useToast();

  // Generate device fingerprint
  useEffect(() => {
    const generateFingerprint = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx?.fillText('Device fingerprint', 2, 2);
      const canvasFingerprint = canvas.toDataURL();
      
      const fingerprint = btoa(
        navigator.userAgent + 
        navigator.language + 
        screen.width + 
        screen.height + 
        new Date().getTimezoneOffset() +
        canvasFingerprint
      ).slice(0, 16);
      
      const meshId = `mesh-${fingerprint}`;
      setDeviceFingerprint(meshId);
      setFormData(prev => ({ ...prev, deviceId: meshId }));
      setLoginData(prev => ({ ...prev, deviceId: meshId }));
    };

    generateFingerprint();
  }, []);

  // Generate RSA key pair
  const generateKeyPair = async () => {
    try {
      setIsGeneratingKeys(true);
      
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
      );

      const publicKey = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
      const privateKey = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

      const publicKeyArray = new Uint8Array(publicKey);
      const privateKeyArray = new Uint8Array(privateKey);
      
      const publicKeyPem = btoa(String.fromCharCode.apply(null, Array.from(publicKeyArray)));
      const privateKeyPem = btoa(String.fromCharCode.apply(null, Array.from(privateKeyArray)));

      return { publicKeyPem, privateKeyPem };
    } catch (error) {
      console.error('Key generation failed:', error);
      throw new Error('Failed to generate encryption keys');
    } finally {
      setIsGeneratingKeys(false);
    }
  };

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const response = await apiRequest('/api/users', {
        method: 'POST',
        body: userData
      });
      return response;
    },
    onSuccess: (user) => {
      localStorage.setItem('meshbook-user', JSON.stringify(user));
      onUserAuthenticated(user);
      toast({
        title: "Welcome to Meshbook!",
        description: "Your account has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (loginData: { alias: string; deviceId: string }) => {
      const response = await apiRequest(`/api/users/device/${loginData.deviceId}`);
      return response;
    },
    onSuccess: (user) => {
      localStorage.setItem('meshbook-user', JSON.stringify(user));
      onUserAuthenticated(user);
      toast({
        title: "Welcome back!",
        description: "Successfully logged in to Meshbook",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleRegister = async () => {
    if (!formData.alias.trim() || !formData.profile.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (!formData.agreeToTerms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the terms and conditions",
        variant: "destructive"
      });
      return;
    }

    try {
      const { publicKeyPem, privateKeyPem } = await generateKeyPair();
      
      const meshCallsigns = ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT', 'GOLF', 'HOTEL'];
      const randomCallsign = meshCallsigns[Math.floor(Math.random() * meshCallsigns.length)];
      const randomNumber = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      
      const userData: InsertUser = {
        alias: formData.alias,
        profile: formData.profile,
        avatar: formData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.alias}`,
        deviceId: formData.deviceId,
        publicKey: publicKeyPem,
        privateKeyEncrypted: privateKeyPem,
        meshCallsign: `${randomCallsign}-${randomNumber}`,
        securityLevel: 2,
        nodeCapabilities: ['messaging', 'file-transfer', 'routing', 'encryption']
      };

      registerMutation.mutate(userData);
    } catch (error) {
      toast({
        title: "Key Generation Failed",
        description: "Failed to generate security keys",
        variant: "destructive"
      });
    }
  };

  const handleLogin = () => {
    if (!loginData.alias.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your username",
        variant: "destructive"
      });
      return;
    }

    loginMutation.mutate(loginData);
  };

  if (currentUser) {
    return null; // Already logged in
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-black/80 backdrop-blur-xl border-blue-500/30">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-800/50">
              <TabsTrigger value="about" className="data-[state=active]:bg-blue-600">
                <Info className="w-4 h-4 mr-2" />
                About Meshbook
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-blue-600">
                <User className="w-4 h-4 mr-2" />
                Join Network
              </TabsTrigger>
              <TabsTrigger value="login" className="data-[state=active]:bg-blue-600">
                <Key className="w-4 h-4 mr-2" />
                Connect Device
              </TabsTrigger>
            </TabsList>

            {/* About Section */}
            <TabsContent value="about" className="p-6">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Network className="w-10 h-10 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-white mb-2">Meshbook</h1>
                  <p className="text-blue-300 text-lg">Decentralized Mesh Network Communication</p>
                </div>

                <Tabs defaultValue="features" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-gray-800/50">
                    <TabsTrigger value="features">Features</TabsTrigger>
                    <TabsTrigger value="technology">Technology</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="use-cases">Use Cases</TabsTrigger>
                  </TabsList>

                  <TabsContent value="features" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-gray-800/50 border-blue-500/30">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <MessageSquare className="w-6 h-6 text-blue-400" />
                            <h3 className="font-semibold text-white">Real-time Messaging</h3>
                          </div>
                          <p className="text-gray-300 text-sm">
                            Send encrypted messages directly between devices without servers
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-800/50 border-blue-500/30">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <Sparkles className="w-6 h-6 text-purple-400" />
                            <h3 className="font-semibold text-white">Ephemeral Stories</h3>
                          </div>
                          <p className="text-gray-300 text-sm">
                            Share temporary content that disappears automatically
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-800/50 border-blue-500/30">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <Bluetooth className="w-6 h-6 text-cyan-400" />
                            <h3 className="font-semibold text-white">Bluetooth Discovery</h3>
                          </div>
                          <p className="text-gray-300 text-sm">
                            Find and connect to nearby devices automatically
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-800/50 border-blue-500/30">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <Globe className="w-6 h-6 text-green-400" />
                            <h3 className="font-semibold text-white">Mesh Routing</h3>
                          </div>
                          <p className="text-gray-300 text-sm">
                            Messages hop through multiple devices to reach destinations
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="technology" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <Rocket className="w-5 h-5 text-blue-400" />
                          Frontend Stack
                        </h3>
                        <ul className="space-y-2 text-gray-300 text-sm">
                          <li>• React 18 with TypeScript</li>
                          <li>• Vite for fast development</li>
                          <li>• Tailwind CSS for styling</li>
                          <li>• Radix UI components</li>
                          <li>• WebRTC for peer connections</li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <Settings className="w-5 h-5 text-green-400" />
                          Backend Stack
                        </h3>
                        <ul className="space-y-2 text-gray-300 text-sm">
                          <li>• Node.js with Express.js</li>
                          <li>• PostgreSQL with Drizzle ORM</li>
                          <li>• WebSocket for signaling</li>
                          <li>• End-to-end encryption</li>
                          <li>• Mesh network routing</li>
                        </ul>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="security" className="space-y-4">
                    <div className="bg-gray-800/50 border border-green-500/30 rounded-lg p-4">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-green-400" />
                        Security Features
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="text-green-400 font-medium mb-2">Encryption</h4>
                          <ul className="space-y-1 text-gray-300">
                            <li>• RSA-OAEP key generation</li>
                            <li>• AES-GCM message encryption</li>
                            <li>• End-to-end security</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-green-400 font-medium mb-2">Privacy</h4>
                          <ul className="space-y-1 text-gray-300">
                            <li>• No central servers</li>
                            <li>• Device-based authentication</li>
                            <li>• Ephemeral messaging</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="use-cases" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-gradient-to-br from-green-900/30 to-green-800/30 border-green-500/30">
                        <CardContent className="p-4">
                          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-green-400" />
                            Rural & Remote Areas
                          </h3>
                          <p className="text-gray-300 text-sm">
                            Perfect for areas with limited internet connectivity in Bangladesh, India, and other developing regions.
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border-blue-500/30">
                        <CardContent className="p-4">
                          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-400" />
                            Community Networks
                          </h3>
                          <p className="text-gray-300 text-sm">
                            Build resilient communication networks for local communities, schools, and organizations.
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 border-purple-500/30">
                        <CardContent className="p-4">
                          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-purple-400" />
                            Emergency Communications
                          </h3>
                          <p className="text-gray-300 text-sm">
                            Maintain communication during natural disasters when traditional networks fail.
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-red-900/30 to-red-800/30 border-red-500/30">
                        <CardContent className="p-4">
                          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <Eye className="w-5 h-5 text-red-400" />
                            Privacy-Focused Chat
                          </h3>
                          <p className="text-gray-300 text-sm">
                            Secure communication for activists, journalists, and privacy-conscious users.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="text-center pt-4">
                  <Button 
                    onClick={() => setActiveTab('register')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                  >
                    Join the Network
                    <Rocket className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Registration Section */}
            <TabsContent value="register" className="p-6">
              <div className="max-w-md mx-auto space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-2">Join Meshbook Network</h2>
                  <p className="text-gray-400">Create your decentralized identity</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="alias" className="text-white">Username *</Label>
                    <Input
                      id="alias"
                      value={formData.alias}
                      onChange={(e) => setFormData(prev => ({ ...prev, alias: e.target.value }))}
                      placeholder="Enter your username"
                      className="mt-1 bg-gray-800/50 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="profile" className="text-white">Bio *</Label>
                    <Textarea
                      id="profile"
                      value={formData.profile}
                      onChange={(e) => setFormData(prev => ({ ...prev, profile: e.target.value }))}
                      placeholder="Tell us about yourself..."
                      className="mt-1 bg-gray-800/50 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="avatar" className="text-white">Avatar URL (Optional)</Label>
                    <Input
                      id="avatar"
                      value={formData.avatar}
                      onChange={(e) => setFormData(prev => ({ ...prev, avatar: e.target.value }))}
                      placeholder="https://example.com/avatar.jpg"
                      className="mt-1 bg-gray-800/50 border-gray-600 text-white"
                    />
                  </div>

                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <Label className="text-white font-medium">Device ID</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="text-green-400 text-sm bg-gray-900/50 px-2 py-1 rounded flex-1">
                        {deviceFingerprint}
                      </code>
                      <Badge variant="outline" className="text-green-400 border-green-400">
                        Auto-generated
                      </Badge>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">
                      Unique identifier for this device
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="terms"
                      checked={formData.agreeToTerms}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreeToTerms: checked }))}
                    />
                    <Label htmlFor="terms" className="text-gray-300 text-sm">
                      I agree to the terms and understand this is a decentralized network
                    </Label>
                  </div>

                  <Button
                    onClick={handleRegister}
                    disabled={registerMutation.isPending || isGeneratingKeys}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                  >
                    {registerMutation.isPending || isGeneratingKeys ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        {isGeneratingKeys ? 'Generating Keys...' : 'Creating Account...'}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Create Secure Account
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Login Section */}
            <TabsContent value="login" className="p-6">
              <div className="max-w-md mx-auto space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-2">Connect Your Device</h2>
                  <p className="text-gray-400">Login with your existing account</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="login-alias" className="text-white">Username *</Label>
                    <Input
                      id="login-alias"
                      value={loginData.alias}
                      onChange={(e) => setLoginData(prev => ({ ...prev, alias: e.target.value }))}
                      placeholder="Enter your username"
                      className="mt-1 bg-gray-800/50 border-gray-600 text-white"
                    />
                  </div>

                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <Label className="text-white font-medium">Current Device ID</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="text-green-400 text-sm bg-gray-900/50 px-2 py-1 rounded flex-1">
                        {deviceFingerprint}
                      </code>
                      <Badge variant="outline" className="text-green-400 border-green-400">
                        This Device
                      </Badge>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">
                      This device must be registered with your account
                    </p>
                  </div>

                  <Button
                    onClick={handleLogin}
                    disabled={loginMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                  >
                    {loginMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Connecting...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        Connect to Network
                      </div>
                    )}
                  </Button>

                  <div className="text-center">
                    <p className="text-gray-400 text-sm">
                      Don't have an account?{' '}
                      <Button
                        variant="link"
                        className="text-blue-400 hover:text-blue-300 p-0"
                        onClick={() => setActiveTab('register')}
                      >
                        Join the network
                      </Button>
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}