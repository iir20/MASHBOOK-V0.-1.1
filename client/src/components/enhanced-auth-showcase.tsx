import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { insertUserSchema, type InsertUser, type User } from '@shared/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import {
  Shield,
  Wifi,
  Bluetooth,
  Network,
  Lock,
  Eye,
  EyeOff,
  Zap,
  Cpu,
  Globe,
  Users,
  MessageCircle,
  FileText,
  Radio,
  Satellite,
  Brain,
  Sparkles,
  ChevronRight,
  Play,
  CheckCircle,
  Star,
  Rocket,
  Code
} from 'lucide-react';

interface EnhancedAuthShowcaseProps {
  onAuthSuccess: (user: User) => void;
}

export function EnhancedAuthShowcase({ onAuthSuccess }: EnhancedAuthShowcaseProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'showcase'>('showcase');
  const [showPassword, setShowPassword] = useState(false);
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Animated background particles
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3
    }));
    setParticles(newParticles);
  }, []);

  // Device fingerprinting for unique ID
  const generateDeviceId = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx!.textBaseline = 'top';
    ctx!.font = '14px Arial';
    ctx!.fillText('MeshBook Fingerprint', 2, 2);
    
    const fingerprint = canvas.toDataURL() + 
      navigator.userAgent + 
      navigator.language + 
      screen.width + 
      screen.height + 
      new Date().getTimezoneOffset();
    
    return btoa(fingerprint).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  };

  // RSA Key generation
  const generateKeyPair = async () => {
    setIsGeneratingKeys(true);
    try {
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256'
        },
        true,
        ['encrypt', 'decrypt']
      );

      const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
      const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

      const publicKeyB64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(publicKey))));
      const privateKeyB64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(privateKey))));

      return { publicKey: publicKeyB64, privateKey: privateKeyB64 };
    } catch (error) {
      console.error('Key generation failed:', error);
      return null;
    } finally {
      setIsGeneratingKeys(false);
    }
  };

  // Generate mesh callsign
  const generateCallsign = () => {
    const prefixes = ['ALPHA', 'BETA', 'GAMMA', 'DELTA', 'ECHO', 'FOXTROT', 'GOLF', 'HOTEL'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `${prefix}-${suffix}`;
  };

  // Form setup
  const registerForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      alias: '',
      profile: '',
      avatar: '',
      deviceId: generateDeviceId(),
      publicKey: '',
      privateKeyEncrypted: '',
      meshCallsign: generateCallsign(),
      securityLevel: 2,
      nodeCapabilities: ['mesh-relay', 'encryption']
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
      localStorage.setItem('meshbook-user', JSON.stringify(user));
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      onAuthSuccess(user);
      toast({
        title: "Welcome to MeshBook",
        description: "Your decentralized identity has been created!"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
  });

  // Login by device ID
  const handleLogin = async () => {
    const deviceId = generateDeviceId();
    try {
      const user = await apiRequest(`/api/users/device/${deviceId}`);
      localStorage.setItem('meshbook-user', JSON.stringify(user));
      onAuthSuccess(user);
      toast({
        title: "Welcome Back",
        description: "Successfully logged in!"
      });
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Device not found. Please register first.",
        variant: "destructive"
      });
    }
  };

  const handleRegister = async (data: InsertUser) => {
    const keys = await generateKeyPair();
    if (!keys) {
      toast({
        title: "Key Generation Failed",
        description: "Please try again",
        variant: "destructive"
      });
      return;
    }

    const userData = {
      ...data,
      publicKey: keys.publicKey,
      privateKeyEncrypted: keys.privateKey,
      avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.alias}`
    };

    registerMutation.mutate(userData);
  };

  const features = [
    {
      icon: Network,
      title: "Decentralized Mesh Network",
      description: "True P2P communication without central servers",
      color: "from-cyan-500 to-blue-500"
    },
    {
      icon: Shield,
      title: "End-to-End Encryption",
      description: "Military-grade RSA + AES encryption for all data",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Bluetooth,
      title: "Multi-Protocol Connectivity",
      description: "WebRTC, Bluetooth, WiFi Direct support",
      color: "from-purple-500 to-violet-500"
    },
    {
      icon: Brain,
      title: "AI-Powered Routing",
      description: "Intelligent mesh routing with self-healing networks",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: Satellite,
      title: "Offline-First Design",
      description: "Works without internet using local mesh networks",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: Zap,
      title: "Real-Time Everything",
      description: "Instant messaging, stories, and file sharing",
      color: "from-pink-500 to-rose-500"
    }
  ];

  const useCases = [
    "Emergency communication during disasters",
    "Private messaging in restricted regions",
    "Decentralized social networking",
    "Secure file sharing and storage",
    "Community mesh networks",
    "Privacy-focused group communication"
  ];

  if (authMode === 'showcase') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          {particles.map(particle => (
            <motion.div
              key={particle.id}
              className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-60"
              style={{ left: `${particle.x}%`, top: `${particle.y}%` }}
              animate={{
                y: [0, -100, 0],
                opacity: [0.3, 0.8, 0.3]
              }}
              transition={{
                duration: 3,
                delay: particle.delay,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {/* Main Content */}
        <div className="relative z-10 container mx-auto px-6 py-12">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <motion.div
              className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30"
              whileHover={{ scale: 1.05 }}
            >
              <Network className="w-5 h-5 text-cyan-400" />
              <span className="text-cyan-400 font-medium">Decentralized Communication Platform</span>
            </motion.div>

            <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              MeshBook
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Revolutionary peer-to-peer communication that works anywhere, anytime, 
              without central servers or internet dependency
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold px-8 py-4"
                onClick={() => setAuthMode('register')}
              >
                <Rocket className="w-5 h-5 mr-2" />
                Join the Network
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 px-8 py-4"
                onClick={() => setAuthMode('login')}
              >
                <Play className="w-5 h-5 mr-2" />
                Access Existing Node
              </Button>
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative group"
              >
                <Card className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all duration-300 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-slate-400">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Use Cases Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="bg-slate-800/30 rounded-2xl p-8 border border-slate-700 backdrop-blur-sm"
          >
            <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Perfect For
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {useCases.map((useCase, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700/30 transition-colors"
                >
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-slate-300">{useCase}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Tech Stack */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="mt-16 text-center"
          >
            <h3 className="text-2xl font-semibold text-slate-300 mb-6">Built with Modern Tech</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {['React', 'TypeScript', 'WebRTC', 'Web Bluetooth', 'PostgreSQL', 'Node.js', 'Crypto API'].map((tech, index) => (
                <Badge key={index} variant="outline" className="border-slate-600 text-slate-400 px-3 py-1">
                  <Code className="w-3 h-3 mr-1" />
                  {tech}
                </Badge>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0">
        {particles.slice(0, 15).map(particle => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-40"
            style={{ left: `${particle.x}%`, top: `${particle.y}%` }}
            animate={{
              y: [0, -50, 0],
              opacity: [0.2, 0.6, 0.2]
            }}
            transition={{
              duration: 4,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-lg">
          <CardHeader className="text-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center"
            >
              <Network className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              {authMode === 'login' ? 'Access Node' : 'Join Network'}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex rounded-lg bg-slate-700/30 p-1">
              <Button
                variant={authMode === 'login' ? 'default' : 'ghost'}
                className="flex-1"
                onClick={() => setAuthMode('login')}
              >
                Login
              </Button>
              <Button
                variant={authMode === 'register' ? 'default' : 'ghost'}
                className="flex-1"
                onClick={() => setAuthMode('register')}
              >
                Register
              </Button>
            </div>

            {authMode === 'login' ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-400 text-center">
                  Login using your device fingerprint
                </p>
                <Button
                  onClick={handleLogin}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Connect to Network
                </Button>
              </div>
            ) : (
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <div>
                  <Input
                    {...registerForm.register('alias')}
                    placeholder="Choose your alias"
                    className="bg-slate-700/50 border-slate-600"
                  />
                </div>
                <div>
                  <Textarea
                    {...registerForm.register('profile')}
                    placeholder="Brief bio (optional)"
                    rows={3}
                    className="bg-slate-700/50 border-slate-600"
                  />
                </div>
                <div className="text-sm text-slate-400 space-y-2">
                  <p>🔐 Generating secure RSA keys...</p>
                  <p>📡 Callsign: {registerForm.watch('meshCallsign')}</p>
                  <p>🆔 Device: {registerForm.watch('deviceId')}</p>
                </div>
                <Button
                  type="submit"
                  disabled={registerMutation.isPending || isGeneratingKeys}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500"
                >
                  {registerMutation.isPending ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Cpu className="w-4 h-4 mr-2" />
                    </motion.div>
                  ) : (
                    <Shield className="w-4 h-4 mr-2" />
                  )}
                  {registerMutation.isPending ? 'Joining Network...' : 'Create Node'}
                </Button>
              </form>
            )}

            <Button
              variant="ghost"
              onClick={() => setAuthMode('showcase')}
              className="w-full text-slate-400 hover:text-white"
            >
              ← Back to Overview
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}