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
  const [showAbout, setShowAbout] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  // Generate device fingerprint and check for persistent login
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
          (navigator as any).deviceMemory || 0
        ].join('|');
        
        // Create hash of fingerprint
        const encoder = new TextEncoder();
        const data = encoder.encode(fingerprint);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = new Uint8Array(hashBuffer);
        const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
        
        const deviceIdGenerated = `device_${hashHex.substring(0, 12)}_${Date.now().toString(36)}`;
        setDeviceId(deviceIdGenerated);

        // Check for persistent login
        const savedUser = localStorage.getItem('meshbook_user');
        const savedDeviceId = localStorage.getItem('meshbook_device_id');
        
        if (savedUser && savedDeviceId && savedDeviceId === deviceIdGenerated) {
          try {
            const user = JSON.parse(savedUser) as UserType;
            console.log('Found saved user, attempting auto-login:', user.alias);
            onUserAuthenticated(user, savedDeviceId);
          } catch (error) {
            console.error('Failed to parse saved user data:', error);
            localStorage.removeItem('meshbook_user');
            localStorage.removeItem('meshbook_device_id');
          }
        }
      } catch (error) {
        console.error('Failed to generate device ID:', error);
        setDeviceId(`device_fallback_${Date.now()}`);
      }
    };

    generateDeviceId();
  }, [onUserAuthenticated]);

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
    const uint8Array = new Uint8Array(buffer);
    const base64 = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));
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
        if (response.status === 404) {
          throw new Error('No user found for this device. Please register first.');
        }
        throw new Error('Authentication failed. Please try again.');
      }
      return response.json() as Promise<UserType>;
    },
    onSuccess: (user: UserType) => {
      // Save user to localStorage for persistent login
      localStorage.setItem('meshbook_user', JSON.stringify(user));
      localStorage.setItem('meshbook_device_id', deviceId);
      
      toast({
        title: "Authentication Successful",
        description: `Welcome back, ${user.alias}`,
      });
      onUserAuthenticated(user, deviceId);
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      toast({
        title: "Authentication Failed",
        description: error.message || "No existing user found for this device. Please register.",
        variant: "destructive",
      });
      setMode('register');
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      console.log('Making API request with data:', userData);
      const response = await apiRequest('/api/users', {
        method: 'POST',
        body: userData
      });
      console.log('API response:', response);
      return response;
    },
    onSuccess: (user: UserType) => {
      console.log('Registration successful:', user);
      
      // Save user to localStorage for persistent login
      localStorage.setItem('meshbook_user', JSON.stringify(user));
      localStorage.setItem('meshbook_device_id', deviceId);
      
      toast({
        title: "Registration Successful",
        description: `Welcome to the mesh network, ${user.alias}`,
      });
      onUserAuthenticated(user, deviceId);
    },
    onError: (error: any) => {
      console.error('Registration mutation error:', error);
      const errorMessage = error.message || "Failed to create user account. Please try again.";
      toast({
        title: "Registration Failed",
        description: errorMessage,
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
    console.log('Registration starting...', { deviceId, alias: formData.alias });
    
    if (!deviceId) {
      toast({
        title: "Device Error",
        description: "Device ID not generated. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.alias.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an alias",
        variant: "destructive",
      });
      return;
    }

    try {
      const keys = await generateCryptoKeys();
      if (!keys) {
        toast({
          title: "Encryption Error",
          description: "Failed to generate cryptographic keys",
          variant: "destructive",
        });
        return;
      }

      const userData: InsertUser = {
        alias: formData.alias,
        profile: formData.profile || '',
        avatar: '',
        deviceId,
        publicKey: keys.publicKey,
        privateKeyEncrypted: keys.privateKey,
        meshCallsign: generateCallsign(formData.alias),
        securityLevel: formData.securityLevel,
        nodeCapabilities: formData.nodeCapabilities
      };

      console.log('Sending registration data:', userData);
      registerMutation.mutate(userData);
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Error",
        description: "An unexpected error occurred during registration",
        variant: "destructive",
      });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 flex items-start justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-2xl mt-2 sm:mt-8">
        <Card className="w-full border-purple-500/30 bg-black/80 backdrop-blur-sm">
          <CardHeader className="text-center px-3 sm:px-4 lg:px-6 py-4">
            <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-lg flex items-center justify-center mb-3">
              <Brain className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" />
            </div>
            <CardTitle className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              CIPHER AUTH
            </CardTitle>
            <p className="text-gray-400 mt-2 text-xs sm:text-sm lg:text-base">
              {mode === 'login' ? 'Access neural mesh' : 'Join quantum collective'}
            </p>
          </CardHeader>

          <CardContent className="space-y-3 sm:space-y-4 lg:space-y-6 px-3 sm:px-4 lg:px-6 pb-6">
          {/* Device Information */}
          <Card className="border-gray-700 bg-gray-900/50">
            <CardContent className="p-2 sm:p-3 lg:p-4">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                <Fingerprint className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-cyan-400 flex-shrink-0" />
                <span className="font-medium text-cyan-400 text-xs sm:text-sm lg:text-base">Device Identity</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-400 text-xs sm:text-sm lg:text-sm flex-shrink-0">Device ID</span>
                  <Badge className="bg-green-900/30 text-green-400 font-mono text-xs truncate max-w-[120px] sm:max-w-[160px] lg:max-w-none">
                    {deviceId ? deviceId.slice(0, 8) + '...' : 'Generating...'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-400 text-xs sm:text-sm lg:text-sm flex-shrink-0">Status</span>
                  <Badge className="bg-purple-900/30 text-purple-400 text-xs">
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
              className={`flex-1 ${mode === 'login' ? 'bg-purple-600' : 'text-gray-400'} text-xs lg:text-sm`}
              onClick={() => setMode('login')}
            >
              <KeyRound className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
              <span className="hidden lg:inline">Authentication</span>
              <span className="lg:hidden">Auth</span>
            </Button>
            <Button
              variant={mode === 'register' ? 'default' : 'ghost'}
              className={`flex-1 ${mode === 'register' ? 'bg-cyan-600' : 'text-gray-400'} text-xs lg:text-sm`}
              onClick={() => setMode('register')}
            >
              <User className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
              <span className="hidden lg:inline">Registration</span>
              <span className="lg:hidden">Register</span>
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
                  {/* Live Authentication Status */}
                  {loginMutation.isPending && (
                    <div className="mb-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Shield className="w-5 h-5 text-purple-400 animate-pulse" />
                        <div>
                          <div className="text-sm font-medium text-purple-400">Authenticating Device</div>
                          <div className="text-xs text-gray-400">Verifying identity against mesh network...</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={handleLogin}
                    disabled={loginMutation.isPending || !deviceId}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-sm lg:text-base py-3 lg:py-2 disabled:opacity-50 transition-all"
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Cpu className="w-4 h-4 mr-2 animate-spin" />
                        <span className="hidden lg:inline">Authenticating...</span>
                        <span className="lg:hidden">Auth...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        <span className="hidden lg:inline">Access Neural Mesh</span>
                        <span className="lg:hidden">Access Mesh</span>
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Registration Form */
            <div className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-xs lg:text-sm font-medium text-gray-300">Node Alias</label>
                  <Input
                    value={formData.alias}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData(prev => ({ ...prev, alias: value }));
                      // Clear any previous error messages when user starts typing
                      if (value.trim()) {
                        e.target.setCustomValidity('');
                      }
                    }}
                    onBlur={(e) => {
                      // Validate on blur
                      if (!e.target.value.trim()) {
                        e.target.setCustomValidity('Alias is required');
                      } else if (e.target.value.length < 2) {
                        e.target.setCustomValidity('Alias must be at least 2 characters');
                      } else if (e.target.value.length > 20) {
                        e.target.setCustomValidity('Alias must be less than 20 characters');
                      } else {
                        e.target.setCustomValidity('');
                      }
                    }}
                    placeholder="Enter your alias..."
                    className={`mt-1 bg-gray-900 border-gray-600 text-gray-300 text-sm lg:text-base transition-colors ${
                      !formData.alias.trim() && formData.alias !== '' 
                        ? 'border-red-500 focus:border-red-400' 
                        : formData.alias.trim() 
                          ? 'border-green-500 focus:border-green-400' 
                          : 'border-gray-600'
                    }`}
                    maxLength={20}
                    required
                  />
                  {/* Live validation feedback */}
                  {formData.alias === '' ? (
                    <p className="text-xs text-red-400 mt-1 flex items-center">
                      <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
                      Alias is required
                    </p>
                  ) : formData.alias.length < 2 ? (
                    <p className="text-xs text-yellow-400 mt-1 flex items-center">
                      <span className="w-1 h-1 bg-yellow-400 rounded-full mr-2"></span>
                      At least 2 characters needed
                    </p>
                  ) : formData.alias.length >= 2 ? (
                    <p className="text-xs text-green-400 mt-1 flex items-center">
                      <span className="w-1 h-1 bg-green-400 rounded-full mr-2"></span>
                      Valid alias
                    </p>
                  ) : null}
                </div>
                <div>
                  <label className="text-xs lg:text-sm font-medium text-gray-300">Security Level</label>
                  <select
                    value={formData.securityLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, securityLevel: parseInt(e.target.value) }))}
                    className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-gray-300 text-xs lg:text-sm"
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
                <label className="text-xs lg:text-sm font-medium text-gray-300">Profile Description</label>
                <Textarea
                  value={formData.profile}
                  onChange={(e) => setFormData(prev => ({ ...prev, profile: e.target.value }))}
                  placeholder="Describe your role in the mesh network..."
                  className={`mt-1 bg-gray-900 border-gray-600 text-gray-300 text-sm lg:text-base transition-colors ${
                    formData.profile.length > 200 ? 'border-yellow-500' : ''
                  }`}
                  rows={3}
                  maxLength={250}
                />
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-gray-500">Optional: Brief description of your node</p>
                  <p className={`text-xs ${formData.profile.length > 200 ? 'text-yellow-400' : 'text-gray-500'}`}>
                    {formData.profile.length}/250
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs lg:text-sm font-medium text-gray-300 mb-3 block">Node Capabilities</label>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  {availableCapabilities.map(capability => (
                    <Button
                      key={capability}
                      variant={formData.nodeCapabilities.includes(capability) ? "default" : "outline"}
                      size="sm"
                      className={`justify-start text-xs lg:text-sm ${
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

              {/* Live Registration Status */}
              {registerMutation.isPending && (
                <Card className="border-cyan-500/30 bg-cyan-900/10 mb-4">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      <Cpu className="w-5 h-5 text-cyan-400 animate-spin" />
                      <div>
                        <div className="text-sm font-medium text-cyan-400">Processing Registration</div>
                        <div className="text-xs text-gray-400">Generating keys and establishing connection...</div>
                      </div>
                    </div>
                    <div className="mt-2 bg-gray-800 rounded-full h-2">
                      <div className="bg-cyan-500 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button 
                onClick={handleRegister}
                disabled={registerMutation.isPending || !formData.alias.trim() || formData.alias.length < 2}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-sm lg:text-base py-3 lg:py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {registerMutation.isPending ? (
                  <>
                    <Cpu className="w-4 h-4 mr-2 animate-spin" />
                    <span className="hidden lg:inline">Joining Network...</span>
                    <span className="lg:hidden">Joining...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    <span className="hidden lg:inline">Initialize Neural Node</span>
                    <span className="lg:hidden">Initialize Node</span>
                  </>
                )}
              </Button>
            </div>
          )}

          {/* About MeshBook Section */}
          <Card className="border-blue-500/30 bg-blue-900/10 mt-4">
            <CardContent className="p-3 sm:p-4">
              <Button
                variant="ghost"
                onClick={() => setShowAbout(!showAbout)}
                className="w-full text-left p-0 h-auto text-blue-400 hover:text-blue-300 hover:bg-transparent"
              >
                <div className="flex items-center text-sm">
                  <span className="text-lg mr-2">ℹ️</span>
                  <span>Why MeshBook?</span>
                </div>
              </Button>
              
              {showAbout && (
                <div className="mt-3 space-y-3 text-xs lg:text-sm">
                  <p className="text-gray-300">
                    <strong className="text-blue-400">MeshBook</strong> is a decentralized messaging app built for{' '}
                    <em className="text-cyan-300">crisis communication</em>,{' '}
                    <em className="text-cyan-300">offline chatting</em>, and{' '}
                    <em className="text-cyan-300">freedom of speech</em>.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <span className="text-green-400 flex-shrink-0 mt-0.5">🛰️</span>
                      <span className="text-gray-400">Works without internet using P2P (WebRTC)</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-purple-400 flex-shrink-0 mt-0.5">🔐</span>
                      <span className="text-gray-400">Secure by design (End-to-end encrypted)</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-orange-400 flex-shrink-0 mt-0.5">⚠️</span>
                      <span className="text-gray-400">Emergency use: disaster zones, censored networks</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-red-400 flex-shrink-0 mt-0.5">📉</span>
                      <span className="text-gray-400">Limitations: NAT/firewall restrictions, offline cache size</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-700">
                    <div className="text-gray-500 text-xs">
                      <div>• Your identity is tied to this device</div>
                      <div>• End-to-end encryption is automatically enabled</div>
                      <div>• No personal information required</div>
                      <div>• Works in offline mesh networks</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}