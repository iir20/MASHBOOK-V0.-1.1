import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  AlertCircle
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { User as UserType, InsertUser } from '@shared/schema';

interface AuthSystemProps {
  onUserAuthenticated: (user: UserType, deviceId: string) => void;
}

export function AuthSystem({ onUserAuthenticated }: AuthSystemProps) {
  const [activeTab, setActiveTab] = useState('login');
  const [deviceId, setDeviceId] = useState<string>('');
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  const [securityLevel, setSecurityLevel] = useState(1);
  const [registrationData, setRegistrationData] = useState({
    alias: '',
    profile: '',
    avatar: '',
    meshCallsign: '',
    nodeCapabilities: [] as string[]
  });
  const [loginData, setLoginData] = useState({
    deviceId: '',
    alias: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Generate unique device ID on component mount
  useEffect(() => {
    const generateDeviceId = async () => {
      try {
        // Use browser fingerprinting for unique device identification
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
          navigator.hardwareConcurrency || 'unknown',
          navigator.platform
        ].join('|');

        const encoder = new TextEncoder();
        const data = encoder.encode(fingerprint);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        const uniqueDeviceId = `phantom-${hashHex.substring(0, 16)}`;
        setDeviceId(uniqueDeviceId);
        setLoginData(prev => ({ ...prev, deviceId: uniqueDeviceId }));
      } catch (error) {
        console.error('Failed to generate device ID:', error);
        // Fallback to random ID if crypto fails
        const fallbackId = `phantom-${Math.random().toString(36).substring(2, 18)}`;
        setDeviceId(fallbackId);
        setLoginData(prev => ({ ...prev, deviceId: fallbackId }));
      }
    };

    generateDeviceId();
  }, []);

  // Check if user exists by device ID
  const { data: existingUser, isLoading: isCheckingUser } = useQuery({
    queryKey: ['/api/users/device', deviceId],
    enabled: !!deviceId,
    retry: false
  });

  // Auto-login if user exists
  useEffect(() => {
    if (existingUser && deviceId) {
      onUserAuthenticated(existingUser, deviceId);
    }
  }, [existingUser, deviceId, onUserAuthenticated]);

  // Generate RSA key pair for secure communication
  const generateKeyPair = async () => {
    setIsGeneratingKeys(true);
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
      
      const publicKeyB64 = btoa(String.fromCharCode(...new Uint8Array(publicKey)));
      const privateKeyB64 = btoa(String.fromCharCode(...new Uint8Array(privateKey)));

      return {
        publicKey: publicKeyB64,
        privateKey: privateKeyB64
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
        body: JSON.stringify(userData),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: (user: UserType) => {
      toast({
        title: "Registration Successful",
        description: "Your secure account has been created successfully.",
      });
      
      // Store user data in localStorage for persistence
      localStorage.setItem('phantomUser', JSON.stringify(user));
      localStorage.setItem('phantomDeviceId', deviceId);
      
      onUserAuthenticated(user, deviceId);
      queryClient.invalidateQueries({ queryKey: ['/api/users/device', deviceId] });
    },
    onError: (error) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle registration
  const handleRegister = async () => {
    if (!registrationData.alias || !registrationData.meshCallsign) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const keys = await generateKeyPair();
      
      const userData: InsertUser = {
        alias: registrationData.alias,
        profile: registrationData.profile || 'Phantom Network Operator',
        avatar: registrationData.avatar || '',
        deviceId,
        publicKey: keys.publicKey,
        privateKeyEncrypted: keys.privateKey, // In production, this should be encrypted
        meshCallsign: registrationData.meshCallsign,
        securityLevel,
        nodeCapabilities: ['webrtc', 'bluetooth', 'mesh-routing', 'file-transfer']
      };

      registerMutation.mutate(userData);
    } catch (error) {
      toast({
        title: "Key Generation Failed",
        description: "Failed to generate security keys. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle login (device lookup)
  const handleLogin = () => {
    if (!loginData.alias) {
      toast({
        title: "Missing Information",
        description: "Please enter your alias.",
        variant: "destructive",
      });
      return;
    }

    // Trigger query refetch to check for user
    queryClient.invalidateQueries({ queryKey: ['/api/users/device', deviceId] });
  };

  if (isCheckingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <Card className="w-96 bg-gray-800/50 backdrop-blur-sm border-emerald-500/30">
          <CardContent className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-emerald-400">Authenticating device...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800/80 backdrop-blur-sm border-emerald-500/30 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 h-12 w-12 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-gray-900" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Phantom Network
          </CardTitle>
          <CardDescription className="text-gray-300">
            Secure mesh communication platform
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Device Info */}
          <div className="mb-6 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <Fingerprint className="h-4 w-4 text-emerald-400" />
              <span>Device ID:</span>
              <code className="text-xs font-mono text-emerald-400">{deviceId.substring(0, 16)}...</code>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="flex items-center space-x-2">
                <LogIn className="h-4 w-4" />
                <span>Login</span>
              </TabsTrigger>
              <TabsTrigger value="register" className="flex items-center space-x-2">
                <UserPlus className="h-4 w-4" />
                <span>Register</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="loginAlias">Alias</Label>
                  <Input
                    id="loginAlias"
                    type="text"
                    placeholder="Enter your alias"
                    value={loginData.alias}
                    onChange={(e) => setLoginData(prev => ({ ...prev, alias: e.target.value }))}
                    className="bg-gray-700/50 border-gray-600"
                  />
                </div>

                <Button 
                  onClick={handleLogin}
                  disabled={!loginData.alias}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Access Network
                </Button>
              </div>

              <Alert className="border-cyan-500/30 bg-cyan-900/20">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-cyan-300">
                  Your device is automatically recognized. Enter your alias to access the network.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="alias">Alias *</Label>
                  <Input
                    id="alias"
                    type="text"
                    placeholder="Choose your alias"
                    value={registrationData.alias}
                    onChange={(e) => setRegistrationData(prev => ({ ...prev, alias: e.target.value }))}
                    className="bg-gray-700/50 border-gray-600"
                  />
                </div>

                <div>
                  <Label htmlFor="meshCallsign">Mesh Callsign *</Label>
                  <Input
                    id="meshCallsign"
                    type="text"
                    placeholder="e.g., PHANTOM-01"
                    value={registrationData.meshCallsign}
                    onChange={(e) => setRegistrationData(prev => ({ ...prev, meshCallsign: e.target.value }))}
                    className="bg-gray-700/50 border-gray-600"
                  />
                </div>

                <div>
                  <Label htmlFor="profile">Profile</Label>
                  <Input
                    id="profile"
                    type="text"
                    placeholder="Brief description"
                    value={registrationData.profile}
                    onChange={(e) => setRegistrationData(prev => ({ ...prev, profile: e.target.value }))}
                    className="bg-gray-700/50 border-gray-600"
                  />
                </div>

                <div>
                  <Label htmlFor="avatar">Avatar URL</Label>
                  <Input
                    id="avatar"
                    type="url"
                    placeholder="https://..."
                    value={registrationData.avatar}
                    onChange={(e) => setRegistrationData(prev => ({ ...prev, avatar: e.target.value }))}
                    className="bg-gray-700/50 border-gray-600"
                  />
                </div>

                <div>
                  <Label>Security Level</Label>
                  <div className="flex space-x-2 mt-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <Button
                        key={level}
                        variant={securityLevel === level ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSecurityLevel(level)}
                        className={securityLevel === level ? "bg-emerald-600" : ""}
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleRegister}
                  disabled={registerMutation.isPending || isGeneratingKeys || !registrationData.alias || !registrationData.meshCallsign}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {isGeneratingKeys ? (
                    <>
                      <Cpu className="h-4 w-4 mr-2 animate-spin" />
                      Generating Keys...
                    </>
                  ) : registerMutation.isPending ? (
                    <>
                      <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Join Network
                    </>
                  )}
                </Button>
              </div>

              <Alert className="border-yellow-500/30 bg-yellow-900/20">
                <Key className="h-4 w-4" />
                <AlertDescription className="text-yellow-300">
                  Your RSA key pair will be generated automatically for secure communications.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}