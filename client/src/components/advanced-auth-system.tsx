import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Shield, 
  Key, 
  Lock, 
  UserPlus, 
  LogIn, 
  Fingerprint,
  Cpu,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Zap,
  Radio,
  Wifi,
  Globe,
  Network,
  Binary,
  Layers3
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { User as UserType, InsertUser } from '@shared/schema';

interface AuthSystemProps {
  onUserAuthenticated: (user: UserType, deviceId: string) => void;
}

export function AdvancedAuthSystem({ onUserAuthenticated }: AuthSystemProps) {
  const [activeTab, setActiveTab] = useState('login');
  const [deviceId, setDeviceId] = useState<string>('');
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  const [securityProgress, setSecurityProgress] = useState(0);
  const [showDeviceInfo, setShowDeviceInfo] = useState(false);
  const [authStep, setAuthStep] = useState<'device' | 'keys' | 'profile' | 'complete'>('device');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const [registrationData, setRegistrationData] = useState({
    alias: '',
    profile: '',
    avatar: '',
    meshCallsign: '',
    nodeCapabilities: ['messaging', 'file-transfer'] as string[]
  });

  const [loginData, setLoginData] = useState({
    deviceId: '',
    alias: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 3D Canvas Animation for Meshbook branding
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const particles: Array<{x: number, y: number, vx: number, vy: number, life: number}> = [];

    // Initialize particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: Math.random()
      });
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      time += 0.016;
      
      // Draw mesh network visualization
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.6;

      // Connect nearby particles
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Update and draw particles
      particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life += 0.01;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle
        ctx.fillStyle = `hsl(${180 + Math.sin(particle.life) * 30}, 70%, 60%)`;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 2 + Math.sin(particle.life) * 1, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw central mesh logo
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(time * 0.5);
      
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.9;
      
      // Draw mesh pattern
      for (let i = 0; i < 8; i++) {
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(30, 0);
        ctx.moveTo(20, -5);
        ctx.lineTo(30, 0);
        ctx.lineTo(20, 5);
        ctx.stroke();
      }
      
      ctx.restore();

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Generate unique device ID with enhanced security
  useEffect(() => {
    const generateAdvancedDeviceId = async () => {
      try {
        setAuthStep('device');
        setSecurityProgress(20);

        const fingerprint = await createDeviceFingerprint();
        const uniqueDeviceId = `mesh-${fingerprint}`;
        
        setDeviceId(uniqueDeviceId);
        setLoginData(prev => ({ ...prev, deviceId: uniqueDeviceId }));
        setSecurityProgress(40);
        
        // Generate mesh callsign
        const callsign = generateMeshCallsign(uniqueDeviceId);
        setRegistrationData(prev => ({ ...prev, meshCallsign: callsign }));
        setSecurityProgress(60);
        
      } catch (error) {
        console.error('Failed to generate device ID:', error);
        const fallbackId = `mesh-${Math.random().toString(36).substring(2, 18)}`;
        setDeviceId(fallbackId);
        setLoginData(prev => ({ ...prev, deviceId: fallbackId }));
      }
    };

    generateAdvancedDeviceId();
  }, []);

  const createDeviceFingerprint = async (): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#00ffff';
      ctx.fillText('Meshbook Device Signature', 2, 2);
      ctx.fillStyle = '#ff00ff';
      ctx.fillText(navigator.userAgent, 2, 20);
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
      navigator.hardwareConcurrency || 'unknown',
      navigator.platform,
      (navigator as any).deviceMemory || 'unknown',
      (navigator as any).connection?.effectiveType || 'unknown'
    ].join('|');

    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprint);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
  };

  const generateMeshCallsign = (deviceId: string): string => {
    const prefixes = ['ALPHA', 'BETA', 'GAMMA', 'DELTA', 'OMEGA', 'SIGMA', 'THETA', 'ZETA'];
    const hash = deviceId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const prefix = prefixes[hash % prefixes.length];
    const suffix = deviceId.substring(5, 9).toUpperCase();
    return `${prefix}-${suffix}`;
  };

  // Check if user exists
  const { data: existingUser, isLoading: isCheckingUser } = useQuery({
    queryKey: ['/api/users/device', deviceId],
    enabled: !!deviceId,
    retry: false
  });

  // Auto-login if user exists
  useEffect(() => {
    if (existingUser && deviceId && typeof existingUser === 'object') {
      setAuthStep('complete');
      setSecurityProgress(100);
      toast({
        title: "Welcome Back!",
        description: `Connected as ${(existingUser as UserType).alias}`,
      });
      onUserAuthenticated(existingUser as UserType, deviceId);
    }
  }, [existingUser, deviceId, onUserAuthenticated, toast]);

  // Generate advanced RSA key pair
  const generateAdvancedKeyPair = async () => {
    setIsGeneratingKeys(true);
    setAuthStep('keys');
    setSecurityProgress(70);
    
    try {
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
      );

      const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
      const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
      
      const publicKeyBase64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(publicKey))));
      const privateKeyBase64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(privateKey))));

      setSecurityProgress(90);

      return {
        publicKey: publicKeyBase64,
        privateKey: privateKeyBase64
      };
    } catch (error) {
      console.error('Key generation failed:', error);
      throw error;
    } finally {
      setIsGeneratingKeys(false);
    }
  };

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      return await apiRequest('/api/users', {
        method: 'POST',
        body: userData
      });
    },
    onSuccess: (newUser) => {
      setAuthStep('complete');
      setSecurityProgress(100);
      toast({
        title: "Welcome to the Mesh Network!",
        description: `Node ${registrationData.meshCallsign} is now active`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      onUserAuthenticated(newUser, deviceId);
    },
    onError: (error: any) => {
      let title = "Registration Failed";
      let description = "Failed to create user account";
      
      if (error.message.includes("409")) {
        title = "User Already Exists";
        description = "This device or username is already registered. Please login instead.";
        // Switch to login mode
        setIsRegistering(false);
      } else if (error.message.includes("Username already taken")) {
        title = "Username Taken";
        description = "This alias is already in use. Please choose a different one.";
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
    }
  });

  const handleRegister = async () => {
    if (!registrationData.alias.trim()) {
      toast({
        title: "Alias Required",
        description: "Please enter your mesh network alias",
        variant: "destructive",
      });
      return;
    }

    try {
      setAuthStep('keys');
      const keyPair = await generateAdvancedKeyPair();
      
      setAuthStep('profile');
      
      const userData: InsertUser = {
        alias: registrationData.alias,
        profile: registrationData.profile || `Node operator on the Meshbook network`,
        avatar: registrationData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${registrationData.alias}`,
        deviceId,
        publicKey: keyPair.publicKey,
        privateKeyEncrypted: keyPair.privateKey,
        meshCallsign: registrationData.meshCallsign,
        securityLevel: 2,
        nodeCapabilities: registrationData.nodeCapabilities
      };

      registerMutation.mutate(userData);
    } catch (error) {
      console.error('Registration process failed:', error);
      toast({
        title: "Registration Failed",
        description: "Failed to complete registration process",
        variant: "destructive",
      });
    }
  };

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/users/device/${loginData.deviceId}`);
    },
    onSuccess: (user) => {
      setAuthStep('complete');
      setSecurityProgress(100);
      toast({
        title: "Welcome Back",
        description: `Connected as ${user.alias}`,
      });
      onUserAuthenticated(user, loginData.deviceId);
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Device not found in network",
        variant: "destructive",
      });
    }
  });

  const DeviceInfoCard = () => (
    <Card className="bg-black/50 border-cyan-500/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan-400">
          <Smartphone className="w-5 h-5" />
          Device Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Device ID:</span>
          <Badge variant="outline" className="text-cyan-300 border-cyan-500/50">
            {deviceId.substring(0, 12)}...
          </Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Mesh Callsign:</span>
          <Badge variant="outline" className="text-pink-300 border-pink-500/50">
            {registrationData.meshCallsign}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Platform:</span>
          <span className="text-white">{navigator.platform}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Security Level:</span>
          <Badge className="bg-green-500/20 text-green-300">Level 2</Badge>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Canvas */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      />
      
      {/* Main Auth Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Meshbook Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="relative">
              <Network className="w-12 h-12 text-cyan-400 animate-pulse" />
              <Layers3 className="w-6 h-6 text-pink-400 absolute -top-1 -right-1 animate-bounce" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
                Meshbook
              </h1>
              <p className="text-sm text-gray-400">Decentralized Network</p>
            </div>
          </div>
          
          {/* Security Progress */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Security Initialization</span>
              <span>{securityProgress}%</span>
            </div>
            <Progress value={securityProgress} className="h-2" />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-black/50 border-cyan-500/20">
            <TabsTrigger value="login" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
              <LogIn className="w-4 h-4 mr-2" />
              Connect
            </TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-300">
              <UserPlus className="w-4 h-4 mr-2" />
              Join Network
            </TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login" className="space-y-6">
            <Card className="bg-black/50 border-cyan-500/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyan-400">
                  <Shield className="w-5 h-5" />
                  Network Authentication
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Connect to the mesh network with your device signature
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isCheckingUser ? (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center gap-2 text-cyan-400">
                      <Zap className="w-4 h-4 animate-pulse" />
                      Scanning network for your device...
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="alias" className="text-cyan-300">Network Alias</Label>
                      <Input
                        id="alias"
                        placeholder="Enter your mesh alias..."
                        value={loginData.alias}
                        onChange={(e) => setLoginData(prev => ({ ...prev, alias: e.target.value }))}
                        className="bg-black/30 border-cyan-500/30 text-white placeholder-gray-500 focus:border-cyan-400"
                      />
                    </div>
                    
                    <Button 
                      onClick={() => loginMutation.mutate()}
                      disabled={loginMutation.isPending}
                      className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Radio className="w-4 h-4 mr-2 animate-spin" />
                          Connecting to Network...
                        </>
                      ) : (
                        <>
                          <Wifi className="w-4 h-4 mr-2" />
                          Connect to Mesh
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Device Info Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowDeviceInfo(!showDeviceInfo)}
              className="w-full border-gray-600 text-gray-300 hover:border-cyan-500 hover:text-cyan-300"
            >
              {showDeviceInfo ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showDeviceInfo ? 'Hide' : 'Show'} Device Info
            </Button>

            {showDeviceInfo && <DeviceInfoCard />}
          </TabsContent>

          {/* Registration Tab */}
          <TabsContent value="register" className="space-y-6">
            <Card className="bg-black/50 border-pink-500/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-pink-400">
                  <Network className="w-5 h-5" />
                  Join the Network
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Create your identity on the decentralized mesh
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-alias" className="text-pink-300">Network Alias</Label>
                  <Input
                    id="reg-alias"
                    placeholder="Choose your mesh alias..."
                    value={registrationData.alias}
                    onChange={(e) => setRegistrationData(prev => ({ ...prev, alias: e.target.value }))}
                    className="bg-black/30 border-pink-500/30 text-white placeholder-gray-500 focus:border-pink-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reg-profile" className="text-pink-300">Profile Description</Label>
                  <Input
                    id="reg-profile"
                    placeholder="Tell the network about yourself..."
                    value={registrationData.profile}
                    onChange={(e) => setRegistrationData(prev => ({ ...prev, profile: e.target.value }))}
                    className="bg-black/30 border-pink-500/30 text-white placeholder-gray-500 focus:border-pink-400"
                  />
                </div>

                {/* Node Capabilities */}
                <div className="space-y-2">
                  <Label className="text-pink-300">Node Capabilities</Label>
                  <div className="flex flex-wrap gap-2">
                    {['messaging', 'file-transfer', 'routing', 'encryption'].map((capability) => (
                      <Badge
                        key={capability}
                        variant={registrationData.nodeCapabilities.includes(capability) ? 'default' : 'outline'}
                        className={registrationData.nodeCapabilities.includes(capability) 
                          ? 'bg-pink-500/20 text-pink-300 border-pink-500' 
                          : 'border-gray-600 text-gray-400 hover:border-pink-500 hover:text-pink-300 cursor-pointer'
                        }
                        onClick={() => {
                          if (registrationData.nodeCapabilities.includes(capability)) {
                            setRegistrationData(prev => ({
                              ...prev,
                              nodeCapabilities: prev.nodeCapabilities.filter(c => c !== capability)
                            }));
                          } else {
                            setRegistrationData(prev => ({
                              ...prev,
                              nodeCapabilities: [...prev.nodeCapabilities, capability]
                            }));
                          }
                        }}
                      >
                        {capability}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleRegister}
                  disabled={registerMutation.isPending || isGeneratingKeys}
                  className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white"
                >
                  {registerMutation.isPending || isGeneratingKeys ? (
                    <>
                      <Key className="w-4 h-4 mr-2 animate-pulse" />
                      {authStep === 'keys' ? 'Generating Keys...' : 'Creating Node...'}
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4 mr-2" />
                      Initialize Network Node
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <DeviceInfoCard />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-500">
          <p>Secured by RSA-2048 • Device authenticated • Mesh enabled</p>
        </div>
      </div>
    </div>
  );
}