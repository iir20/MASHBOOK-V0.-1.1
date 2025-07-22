import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wifi, 
  Shield, 
  Smartphone, 
  Users, 
  Zap, 
  Globe, 
  Lock, 
  Bluetooth,
  MessageSquare,
  Network,
  AlertTriangle,
  CheckCircle,
  Radio,
  Eye,
  Heart,
  MapPin,
  BookOpen,
  Star
} from 'lucide-react';

interface AboutMeshBookProps {
  onGetStarted?: () => void;
}

export function AboutMeshBook({ onGetStarted }: AboutMeshBookProps) {
  const features = [
    {
      icon: <MessageSquare className="h-8 w-8 text-emerald-400" />,
      title: "Chat Offline",
      description: "Send messages without internet or cellular networks using peer-to-peer connections"
    },
    {
      icon: <Bluetooth className="h-8 w-8 text-blue-400" />,
      title: "Bluetooth Mesh",
      description: "Connect via Bluetooth to nearby devices and relay messages across the network"
    },
    {
      icon: <Shield className="h-8 w-8 text-purple-400" />,
      title: "End-to-End Encryption",
      description: "All messages are encrypted with military-grade AES-256 encryption"
    },
    {
      icon: <Smartphone className="h-8 w-8 text-green-400" />,
      title: "No SIM Required",
      description: "Works without phone numbers, SIM cards, or traditional cellular service"
    },
    {
      icon: <Network className="h-8 w-8 text-cyan-400" />,
      title: "Mesh Networking",
      description: "Messages hop through multiple devices to reach their destination"
    },
    {
      icon: <Eye className="h-8 w-8 text-red-400" />,
      title: "Complete Privacy",
      description: "No central servers, no data collection, no tracking of any kind"
    }
  ];

  const useCases = [
    {
      region: "Rural Bangladesh",
      scenario: "Village Communication",
      description: "Connect remote villages during monsoon floods when cellular towers are down",
      icon: "🌊"
    },
    {
      region: "Dhaka Universities",
      scenario: "Campus Networks",
      description: "Students communicate across campus without using mobile data",
      icon: "🎓"
    },
    {
      region: "Kashmir Region",
      scenario: "Emergency Communication",
      description: "Stay connected during internet shutdowns and communication blackouts",
      icon: "🚨"
    },
    {
      region: "Cyclone Shelters",
      scenario: "Disaster Relief",
      description: "Coordinate rescue efforts when traditional infrastructure fails",
      icon: "🌪️"
    },
    {
      region: "Sylhet Tea Gardens",
      scenario: "Remote Work",
      description: "Workers in remote areas stay connected to supervisors and family",
      icon: "🍃"
    },
    {
      region: "Assam Border Areas",
      scenario: "Cross-Border Communication",
      description: "Families separated by borders maintain contact securely",
      icon: "🏔️"
    }
  ];

  const limitations = [
    {
      title: "Network Firewalls",
      description: "Corporate and institutional firewalls may block WebRTC connections",
      icon: <AlertTriangle className="h-5 w-5 text-yellow-400" />
    },
    {
      title: "Device Proximity",
      description: "Bluetooth range is limited to ~100 meters, works best with more nearby users",
      icon: <Radio className="h-5 w-5 text-orange-400" />
    },
    {
      title: "Storage Limits",
      description: "Messages are cached locally, older messages may be cleared on low storage",
      icon: <Smartphone className="h-5 w-5 text-blue-400" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-emerald-900 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 blur-3xl"></div>
        <div className="relative max-w-6xl mx-auto px-4 py-16 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-xl flex items-center justify-center">
                <Network className="h-6 w-6 text-gray-900" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                MeshBook
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Offline Messaging. Total Privacy. Real Freedom.
            </p>
            <p className="text-lg text-gray-400 mt-4 max-w-2xl mx-auto">
              The decentralized communication platform built for South Asia's connectivity challenges
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-300 px-4 py-2">
              <Globe className="h-4 w-4 mr-2" />
              Works Offline
            </Badge>
            <Badge variant="outline" className="border-blue-500/30 text-blue-300 px-4 py-2">
              <Shield className="h-4 w-4 mr-2" />
              Fully Encrypted
            </Badge>
            <Badge variant="outline" className="border-purple-500/30 text-purple-300 px-4 py-2">
              <Eye className="h-4 w-4 mr-2" />
              No Tracking
            </Badge>
          </div>

          <Button 
            onClick={onGetStarted}
            size="lg" 
            className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <MessageSquare className="h-5 w-5 mr-2" />
            Try MeshBook Now
          </Button>
        </div>
      </div>

      {/* Why MeshBook Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-emerald-400">
            Why MeshBook?
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Traditional communication fails when you need it most. MeshBook was built to solve real problems faced across South Asia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="bg-gray-800/50 border-gray-700 hover:border-red-500/50 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="font-semibold text-red-400 mb-2">Slow Internet</h3>
              <p className="text-sm text-gray-300">Rural areas struggle with poor connectivity and expensive data plans</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 hover:border-yellow-500/50 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="font-semibold text-yellow-400 mb-2">Natural Disasters</h3>
              <p className="text-sm text-gray-300">Cyclones and floods regularly destroy communication infrastructure</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-4">📶</div>
              <h3 className="font-semibold text-blue-400 mb-2">Network Shutdowns</h3>
              <p className="text-sm text-gray-300">Governments sometimes restrict internet access during sensitive periods</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="font-semibold text-purple-400 mb-2">Privacy Concerns</h3>
              <p className="text-sm text-gray-300">Traditional apps collect data and can be monitored by authorities</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Key Features */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-emerald-400">
            How MeshBook Works
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Revolutionary peer-to-peer technology that creates a communication network without relying on traditional infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="bg-gray-800/50 border-gray-700 hover:border-emerald-500/50 transition-colors group">
              <CardContent className="p-6">
                <div className="mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Use Cases */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-emerald-400">
            Real-World Applications
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            MeshBook is already making a difference across Bangladesh, India, and the broader South Asian region.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => (
            <Card key={index} className="bg-gray-800/50 border-gray-700 hover:border-cyan-500/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3">{useCase.icon}</span>
                  <div>
                    <h3 className="font-semibold text-cyan-400">{useCase.scenario}</h3>
                    <p className="text-sm text-gray-400">{useCase.region}</p>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed">{useCase.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Technical Details */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <Tabs defaultValue="technology" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-gray-800">
            <TabsTrigger value="technology" className="data-[state=active]:bg-emerald-600">
              How It Works
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-emerald-600">
              Security & Privacy
            </TabsTrigger>
            <TabsTrigger value="limitations" className="data-[state=active]:bg-emerald-600">
              Limitations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="technology">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-emerald-400 flex items-center">
                    <Network className="h-5 w-5 mr-2" />
                    Peer-to-Peer Network
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">
                    Messages travel directly between devices without going through central servers. Each device acts as both a sender and relay point.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                      <span className="text-sm text-gray-300">WebRTC for direct connections</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                      <span className="text-sm text-gray-300">Automatic route discovery</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                      <span className="text-sm text-gray-300">Multi-hop message delivery</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-blue-400 flex items-center">
                    <Bluetooth className="h-5 w-5 mr-2" />
                    Bluetooth Mesh
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">
                    When internet isn't available, devices can connect via Bluetooth and create a local mesh network for communication.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                      <span className="text-sm text-gray-300">100m range per device</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                      <span className="text-sm text-gray-300">Auto-discovery of nearby devices</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                      <span className="text-sm text-gray-300">Low power consumption</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-purple-400 flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    End-to-End Encryption
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">
                    Every message is encrypted with AES-256 before leaving your device. Only the intended recipient can decrypt and read it.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Lock className="h-4 w-4 text-purple-400 mr-2" />
                      <span className="text-sm text-gray-300">AES-256-GCM encryption</span>
                    </div>
                    <div className="flex items-center">
                      <Lock className="h-4 w-4 text-purple-400 mr-2" />
                      <span className="text-sm text-gray-300">RSA-2048 key exchange</span>
                    </div>
                    <div className="flex items-center">
                      <Lock className="h-4 w-4 text-purple-400 mr-2" />
                      <span className="text-sm text-gray-300">Perfect forward secrecy</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-red-400 flex items-center">
                    <Eye className="h-5 w-5 mr-2" />
                    Complete Privacy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">
                    No central servers, no data collection, no user tracking. Your communications are completely private and anonymous.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                      <span className="text-sm text-gray-300">No phone number required</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                      <span className="text-sm text-gray-300">Device-based identity only</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                      <span className="text-sm text-gray-300">Messages self-destruct</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="limitations">
            <div className="space-y-6">
              <Card className="bg-yellow-900/20 border-yellow-500/30">
                <CardHeader>
                  <CardTitle className="text-yellow-400 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Important Limitations
                  </CardTitle>
                  <CardDescription className="text-yellow-200">
                    Understanding these limitations helps you use MeshBook more effectively
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {limitations.map((limitation, index) => (
                      <div key={index} className="flex items-start space-x-3 p-4 bg-gray-800/50 rounded-lg">
                        {limitation.icon}
                        <div>
                          <h4 className="font-semibold text-white mb-1">{limitation.title}</h4>
                          <p className="text-gray-300 text-sm">{limitation.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-emerald-900/20 border-emerald-500/30">
                <CardContent className="p-6 text-center">
                  <Heart className="h-8 w-8 text-emerald-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-emerald-400 mb-2">
                    MeshBook Works Best Together
                  </h3>
                  <p className="text-gray-300">
                    The more people in your area using MeshBook, the stronger and more reliable the network becomes. 
                    Encourage friends, family, and community members to join!
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-emerald-900/50 to-cyan-900/50 py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-emerald-400">
            Join the Mesh. Stay Connected.
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Be part of a communication revolution that puts privacy, freedom, and reliability first. 
            No registration required - just download and start connecting.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button 
              onClick={onGetStarted}
              size="lg" 
              className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white px-8 py-4 text-lg font-semibold rounded-xl"
            >
              <Star className="h-5 w-5 mr-2" />
              Try MeshBook Now
            </Button>
            
            <div className="flex items-center space-x-4 text-gray-400">
              <span className="text-sm">✓ 100% Free</span>
              <span className="text-sm">✓ No Sign-up</span>
              <span className="text-sm">✓ Instant Start</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Built for South Asia
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Community Driven
            </div>
            <div className="flex items-center">
              <BookOpen className="h-4 w-4 mr-2" />
              Open Source
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}