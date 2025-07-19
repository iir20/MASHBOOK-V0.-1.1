import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  KeyRound, 
  Shield, 
  Zap, 
  User, 
  Brain,
  Lock,
  Eye,
  EyeOff,
  Fingerprint,
  Cpu
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { User as UserType, InsertUser } from '@shared/schema';

interface CipherAuthProps {
  onUserAuthenticated: (user: UserType, deviceId: string) => void;
}

interface AuthFormData {
  alias: string;
  profile: string;
  securityLevel: number;
  nodeCapabilities: string[];
}

export function CipherAuth({ onUserAuthenticated }: CipherAuthProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [deviceId, setDeviceId] = useState('');
  const [showKeys, setShowKeys] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<{ publicKey: string; privateKey: string } | null>(null);
  const [formData, setFormData] = useState<AuthFormData>({
    alias: '',
    profile: '',
    securityLevel: 1,
    nodeCapabilities: []
  });
  const { toast } = useToast();

  // Available capabilities for selection
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

  // Generate device fingerprint
  useEffect(() => {
    const generateDeviceId = async () => {
      try {
        // Create a unique device fingerprint
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.textBaseline = 'top';
          ctx.font = '14px Arial';
          ctx.fillText('Device fingerprint', 2, 2);
        }
        
        const fingerprint = [
          navigator.userAgent,
          navigator.language,
          screen.width + 'x' + screen.height,
          new Date().getTimezoneOffset(),
          canvas.toDataURL(),
          navigator.hardwareConcurrency || 0,
          navigator.deviceMemory || 0
        ].join('|');
        
        // Create hash of fingerprint
        const encoder = new TextEncoder();
        const data = encoder.encode(fingerprint);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        const deviceIdGenerated = `device_${hashHex.substring(0, 12)}_${Date.now().toString(36)}`;
        setDeviceId(deviceIdGenerated);
      } catch (error) {
        console.error('Failed to generate device ID:', error);
        setDeviceId(`device_fallback_${Date.now()}`);
      }
    };

    generateDeviceId();
  }, []);

  // Generate cryptographic keys
  const generateCryptoKeys = async () => {
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

      const publicKeyPem = arrayBufferToPem(publicKey, 'PUBLIC KEY');
      const privateKeyPem = arrayBufferToPem(privateKey, 'PRIVATE KEY');

      setGeneratedKeys({
        publicKey: publicKeyPem,
        privateKey: privateKeyPem
      });

      return { publicKey: publicKeyPem, privateKey: privateKeyPem };
    } catch (error) {
      console.error('Key generation failed:', error);
      toast({
        title: "Key Generation Failed",
        description: "Failed to generate cryptographic keys",
        variant: "destructive",
      });
      return null;
    }
  };

  const arrayBufferToPem = (buffer: ArrayBuffer, label: string) => {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    const formatted = base64.match(/.{1,64}/g)?.join('\n') || base64;
    return `-----BEGIN ${label}-----\n${formatted}\n-----END ${label}-----`;
  };

  // Generate unique mesh callsign
  const generateCallsign = (alias: string): string => {
    const prefixes = ['PHANTOM', 'CIPHER', 'GHOST', 'SHADOW', 'VOID', 'NEURAL', 'QUANTUM'];
    const suffixes = ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ'];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const number = Math.floor(Math.random() * 99).toString().padStart(2, '0');
    
    return `${prefix}-${suffix}${number}`;
  };

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/users/device/${deviceId}`);
      if (!response.ok) {
        throw new Error('User not found');
      }
      return response.json() as Promise<UserType>;
    },
    onSuccess: (user) => {
      toast({
        title: "Authentication Successful",
        description: `Welcome back, ${user.alias}`,
      });
      onUserAuthenticated(user, deviceId);
    },
    onError: () => {
      toast({
        title: "Authentication Failed",
        description: "No existing user found for this device. Please register.",
        variant: "destructive",
      });
      setMode('register');
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      return apiRequest('/api/users', {
        method: 'POST',
        body: userData
      });
    },
    onSuccess: (user) => {
      toast({
        title: "Registration Successful",
        description: `Welcome to the mesh network, ${user.alias}`,
      });
      onUserAuthenticated(user, deviceId);
    },
    onError: () => {
      toast({
        title: "Registration Failed",
        description: "Failed to create user account. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleLogin = () => {
    if (!deviceId) {
      toast({
        title: "Device Error",
        description: "Device ID not generated. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate();
  };

  const handleRegister = async () => {
    if (!formData.alias.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an alias",
        variant: "destructive",
      });
      return;
    }

    const keys = await generateCryptoKeys();
    if (!keys) return;

    const userData: InsertUser = {
      alias: formData.alias,
      profile: formData.profile,
      avatar: '',
      deviceId,
      publicKey: keys.publicKey,
      privateKeyEncrypted: keys.privateKey, // In real app, this should be encrypted
      meshCallsign: generateCallsign(formData.alias),
      securityLevel: formData.securityLevel,
      nodeCapabilities: formData.nodeCapabilities
    };

    registerMutation.mutate(userData);
  };

  const toggleCapability = (capability: string) => {
    setFormData(prev => ({
      ...prev,
      nodeCapabilities: prev.nodeCapabilities.includes(capability)
        ? prev.nodeCapabilities.filter(c => c !== capability)
        : [...prev.nodeCapabilities, capability]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-purple-500/30 bg-black/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-lg flex items-center justify-center mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            CIPHER AUTHENTICATION
          </CardTitle>
          <p className="text-gray-400 mt-2">
            {mode === 'login' ? 'Access the neural mesh network' : 'Join the quantum collective'}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Device Information */}
          <Card className="border-gray-700 bg-gray-900/50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Fingerprint className="w-5 h-5 text-cyan-400" />
                <span className="font-medium text-cyan-400">Device Identity</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Device ID</span>
                  <Badge className="bg-green-900/30 text-green-400 font-mono text-xs">
                    {deviceId || 'Generating...'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Quantum Status</span>
                  <Badge className="bg-purple-900/30 text-purple-400">
                    <Lock className="w-3 h-3 mr-1" />
                    SECURED
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mode Toggle */}
          <div className="flex space-x-2 p-1 bg-gray-800 rounded-lg">
            <Button
              variant={mode === 'login' ? 'default' : 'ghost'}
              className={`flex-1 ${mode === 'login' ? 'bg-purple-600' : 'text-gray-400'}`}
              onClick={() => setMode('login')}
            >
              <KeyRound className="w-4 h-4 mr-2" />
              Authentication
            </Button>
            <Button
              variant={mode === 'register' ? 'default' : 'ghost'}
              className={`flex-1 ${mode === 'register' ? 'bg-cyan-600' : 'text-gray-400'}`}
              onClick={() => setMode('register')}
            >
              <User className="w-4 h-4 mr-2" />
              Registration
            </Button>
          </div>

          {mode === 'login' ? (
            /* Login Form */
            <div className="space-y-4">
              <Card className="border-purple-500/30 bg-purple-900/10">
                <CardContent className="p-4 text-center">
                  <Shield className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-purple-400 mb-2">Quantum Authentication</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Your device identity will be verified against the mesh network database
                  </p>
                  <Button 
                    onClick={handleLogin}
                    disabled={loginMutation.isPending || !deviceId}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Cpu className="w-4 h-4 mr-2 animate-pulse" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Access Neural Mesh
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Registration Form */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300">Node Alias</label>
                  <Input
                    value={formData.alias}
                    onChange={(e) => setFormData(prev => ({ ...prev, alias: e.target.value }))}
                    placeholder="Enter your alias..."
                    className="mt-1 bg-gray-900 border-gray-600 text-gray-300"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">Security Level</label>
                  <select
                    value={formData.securityLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, securityLevel: parseInt(e.target.value) }))}
                    className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-gray-300"
                  >
                    <option value={1}>Level 1 - Initiate</option>
                    <option value={2}>Level 2 - Operative</option>
                    <option value={3}>Level 3 - Agent</option>
                    <option value={4}>Level 4 - Cipher</option>
                    <option value={5}>Level 5 - Phantom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300">Profile Description</label>
                <Textarea
                  value={formData.profile}
                  onChange={(e) => setFormData(prev => ({ ...prev, profile: e.target.value }))}
                  placeholder="Describe your role in the mesh network..."
                  className="mt-1 bg-gray-900 border-gray-600 text-gray-300"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-3 block">Node Capabilities</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableCapabilities.map(capability => (
                    <Button
                      key={capability}
                      variant={formData.nodeCapabilities.includes(capability) ? "default" : "outline"}
                      size="sm"
                      className={`justify-start text-xs ${
                        formData.nodeCapabilities.includes(capability)
                          ? 'bg-cyan-600 hover:bg-cyan-700'
                          : 'border-gray-600 text-gray-400 hover:bg-gray-800'
                      }`}
                      onClick={() => toggleCapability(capability)}
                    >
                      {capability}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Generated Keys Display */}
              {generatedKeys && (
                <Card className="border-orange-500/30 bg-orange-900/10">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm text-orange-400">Cryptographic Keys</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowKeys(!showKeys)}
                        className="text-gray-400"
                      >
                        {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {showKeys ? (
                      <div className="space-y-2">
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Public Key</div>
                          <div className="text-xs font-mono bg-gray-900 p-2 rounded border text-green-400 break-all">
                            {generatedKeys.publicKey}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Private Key</div>
                          <div className="text-xs font-mono bg-gray-900 p-2 rounded border text-red-400 break-all">
                            {generatedKeys.privateKey}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 py-4">
                        <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Keys will be generated during registration</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Button 
                onClick={handleRegister}
                disabled={registerMutation.isPending || !formData.alias.trim()}
                className="w-full bg-cyan-600 hover:bg-cyan-700"
              >
                {registerMutation.isPending ? (
                  <>
                    <Cpu className="w-4 h-4 mr-2 animate-pulse" />
                    Joining Network...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Initialize Neural Node
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}