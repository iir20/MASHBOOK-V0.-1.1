import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { User } from '@shared/schema';

import {
  Brain, Zap, Settings, Eye, EyeOff, MessageSquare, User as UserIcon,
  Sparkles, Bot, Activity, TrendingUp, Clock, Shield, Star,
  Cpu, Database, Wifi, WifiOff, PlayCircle, PauseCircle, CheckCircle
} from 'lucide-react';

interface AIShadowCloneSystemProps {
  currentUser: User | null;
  onUserUpdate: (updatedUser: User) => void;
  isOffline: boolean;
}

interface AIShadowProfile {
  id: string;
  userId: number;
  personalityTraits: string[];
  responseStyle: 'friendly' | 'professional' | 'casual' | 'witty' | 'mysterious';
  autoResponseEnabled: boolean;
  learningEnabled: boolean;
  knowledgeBase: string[];
  conversationHistory: any[];
  responsePatterns: any[];
  isActive: boolean;
  lastActivity: Date;
  interactionCount: number;
  confidenceLevel: number;
}

export function AIShadowCloneSystem({ 
  currentUser, 
  onUserUpdate, 
  isOffline 
}: AIShadowCloneSystemProps) {
  const [shadowProfile, setShadowProfile] = useState<AIShadowProfile | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [customBio, setCustomBio] = useState('');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Available personality traits
  const personalityTraits = [
    'Analytical', 'Creative', 'Empathetic', 'Humorous', 'Philosophical',
    'Technical', 'Artistic', 'Leadership', 'Curious', 'Optimistic',
    'Strategic', 'Innovative', 'Collaborative', 'Detail-oriented', 'Visionary'
  ];

  // Initialize shadow profile
  useEffect(() => {
    if (currentUser && !shadowProfile) {
      const initialProfile: AIShadowProfile = {
        id: `shadow_${currentUser.id}`,
        userId: currentUser.id,
        personalityTraits: [],
        responseStyle: 'friendly',
        autoResponseEnabled: false,
        learningEnabled: true,
        knowledgeBase: [],
        conversationHistory: [],
        responsePatterns: [],
        isActive: false,
        lastActivity: new Date(),
        interactionCount: 0,
        confidenceLevel: 0.1
      };
      setShadowProfile(initialProfile);
    }
  }, [currentUser, shadowProfile]);

  // AI Bio Generation
  const generateBioMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser || !shadowProfile) return;
      
      setIsTraining(true);
      setTrainingProgress(0);

      // Simulate AI bio generation process
      const steps = [
        'Analyzing personality traits...',
        'Processing conversation patterns...',
        'Generating unique bio content...',
        'Optimizing for authenticity...',
        'Finalizing AI profile...'
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setTrainingProgress((i + 1) * 20);
        
        toast({
          title: "AI Training",
          description: steps[i],
        });
      }

      // Generate bio based on selected traits
      const traits = selectedTraits.join(', ');
      const generatedBio = `🤖 AI Shadow Clone | ${traits} personality | 
      Autonomous responses when offline | Learned from ${shadowProfile.interactionCount} interactions | 
      Confidence: ${Math.round(shadowProfile.confidenceLevel * 100)}% | 
      Last sync: ${new Date().toLocaleDateString()}`;

      return generatedBio;
    },
    onSuccess: (generatedBio) => {
      if (generatedBio && currentUser) {
        setCustomBio(generatedBio);
        setShadowProfile(prev => prev ? {
          ...prev,
          personalityTraits: selectedTraits,
          isActive: true,
          confidenceLevel: 0.8
        } : null);
        
        setIsTraining(false);
        setTrainingProgress(100);
        
        toast({
          title: "AI Shadow Clone Created!",
          description: "Your AI profile is now active and learning from your interactions.",
        });
      }
    },
  });

  // Auto-response system
  const toggleAutoResponse = () => {
    if (!shadowProfile) return;
    
    const newState = !shadowProfile.autoResponseEnabled;
    setShadowProfile(prev => prev ? {
      ...prev,
      autoResponseEnabled: newState
    } : null);

    toast({
      title: newState ? "Auto-Response Activated" : "Auto-Response Deactivated",
      description: newState 
        ? "Your AI clone will now respond when you're offline" 
        : "Auto-responses have been disabled",
    });
  };

  // Learning mode toggle
  const toggleLearning = () => {
    if (!shadowProfile) return;
    
    const newState = !shadowProfile.learningEnabled;
    setShadowProfile(prev => prev ? {
      ...prev,
      learningEnabled: newState
    } : null);

    toast({
      title: newState ? "Learning Mode Enabled" : "Learning Mode Disabled",
      description: newState 
        ? "AI will learn from your conversations to improve responses" 
        : "AI learning has been paused",
    });
  };

  // Handle trait selection
  const toggleTrait = (trait: string) => {
    setSelectedTraits(prev => 
      prev.includes(trait)
        ? prev.filter(t => t !== trait)
        : [...prev, trait]
    );
  };

  if (!currentUser || !shadowProfile) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <Brain className="w-16 h-16 text-gray-400 mx-auto" />
          <p className="text-gray-500">Loading AI Shadow Clone System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Brain className="w-8 h-8 text-purple-400" />
              {shadowProfile.isActive && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AI Shadow Clone</h1>
              <p className="text-purple-300 text-sm">Your autonomous digital twin</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge 
              variant={shadowProfile.isActive ? "default" : "secondary"}
              className={shadowProfile.isActive ? "bg-green-600" : "bg-gray-600"}
            >
              {shadowProfile.isActive ? "Active" : "Inactive"}
            </Badge>
            <Badge variant="outline">
              Confidence: {Math.round(shadowProfile.confidenceLevel * 100)}%
            </Badge>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Profile Status */}
          <Card className="bg-black/40 border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Bot className="w-5 h-5" />
                <span>AI Profile Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={currentUser.avatar} />
                    <AvatarFallback>{currentUser.alias.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-white">{currentUser.alias}</p>
                    <p className="text-sm text-purple-300">Original Profile</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">→</div>
                  <div className="text-xs text-gray-400">Cloning</div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Avatar className="w-12 h-12 border-2 border-purple-500">
                      <AvatarImage src={currentUser.avatar} className="opacity-75 blur-sm" />
                      <AvatarFallback className="bg-purple-900 text-purple-300">AI</AvatarFallback>
                    </Avatar>
                    <Bot className="absolute -bottom-1 -right-1 w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-purple-300">{currentUser.alias} AI</p>
                    <p className="text-sm text-purple-400">Shadow Clone</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-purple-500/30">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{shadowProfile.interactionCount}</div>
                  <div className="text-xs text-gray-400">Interactions</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{shadowProfile.personalityTraits.length}</div>
                  <div className="text-xs text-gray-400">Traits</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{Math.round(shadowProfile.confidenceLevel * 100)}%</div>
                  <div className="text-xs text-gray-400">Accuracy</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Control Panel */}
          <Card className="bg-black/40 border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Settings className="w-5 h-5" />
                <span>AI Controls</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-purple-400" />
                    <span className="text-white">Auto-Response</span>
                  </div>
                  <Button
                    size="sm"
                    variant={shadowProfile.autoResponseEnabled ? "default" : "outline"}
                    onClick={toggleAutoResponse}
                    className={shadowProfile.autoResponseEnabled ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {shadowProfile.autoResponseEnabled ? (
                      <PlayCircle className="w-4 h-4 mr-1" />
                    ) : (
                      <PauseCircle className="w-4 h-4 mr-1" />
                    )}
                    {shadowProfile.autoResponseEnabled ? "ON" : "OFF"}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Brain className="w-4 h-4 text-purple-400" />
                    <span className="text-white">Learning Mode</span>
                  </div>
                  <Button
                    size="sm"
                    variant={shadowProfile.learningEnabled ? "default" : "outline"}
                    onClick={toggleLearning}
                    className={shadowProfile.learningEnabled ? "bg-blue-600 hover:bg-blue-700" : ""}
                  >
                    {shadowProfile.learningEnabled ? (
                      <Activity className="w-4 h-4 mr-1" />
                    ) : (
                      <PauseCircle className="w-4 h-4 mr-1" />
                    )}
                    {shadowProfile.learningEnabled ? "LEARNING" : "PAUSED"}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span className="text-white">Privacy Mode</span>
                  </div>
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4 mr-1" />
                    VISIBLE
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t border-purple-500/30">
                <div className="text-sm text-purple-300 mb-2">Response Style</div>
                <div className="grid grid-cols-2 gap-2">
                  {['friendly', 'professional', 'casual', 'witty'].map((style) => (
                    <Button
                      key={style}
                      size="sm"
                      variant={shadowProfile.responseStyle === style ? "default" : "outline"}
                      onClick={() => setShadowProfile(prev => prev ? { ...prev, responseStyle: style as any } : null)}
                      className="capitalize"
                    >
                      {style}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Personality Traits Selection */}
        <Card className="bg-black/40 border-purple-500/30">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Sparkles className="w-5 h-5" />
              <span>Personality Training</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-purple-300 text-sm">
              Select personality traits to train your AI shadow clone. These will influence how it responds when you're offline.
            </p>
            
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {personalityTraits.map((trait) => (
                <Button
                  key={trait}
                  size="sm"
                  variant={selectedTraits.includes(trait) ? "default" : "outline"}
                  onClick={() => toggleTrait(trait)}
                  className={`text-xs ${selectedTraits.includes(trait) ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                >
                  {trait}
                </Button>
              ))}
            </div>

            {selectedTraits.length > 0 && (
              <div className="pt-4 border-t border-purple-500/30">
                <Button
                  onClick={() => generateBioMutation.mutate()}
                  disabled={isTraining}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isTraining ? (
                    <>
                      <Cpu className="w-4 h-4 mr-2 animate-spin" />
                      Training AI... {trainingProgress}%
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Generate AI Profile
                    </>
                  )}
                </Button>
              </div>
            )}

            {isTraining && (
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${trainingProgress}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generated Bio Preview */}
        {customBio && (
          <Card className="bg-black/40 border-green-500/30">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Star className="w-5 h-5 text-green-400" />
                <span>AI-Generated Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={customBio}
                onChange={(e) => setCustomBio(e.target.value)}
                className="bg-black/30 border-green-500/50 text-white min-h-[100px]"
                placeholder="Your AI-generated bio will appear here..."
              />
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2 text-sm text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>AI Profile Generated Successfully</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    if (currentUser) {
                      onUserUpdate({ ...currentUser, profile: customBio });
                      toast({
                        title: "Profile Updated",
                        description: "Your AI-generated bio has been saved to your profile.",
                      });
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Apply to Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Advanced Settings */}
        <Card className="bg-black/40 border-purple-500/30">
          <CardHeader>
            <CardTitle 
              className="flex items-center justify-between cursor-pointer text-white"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            >
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Advanced AI Settings</span>
              </div>
              <Button variant="ghost" size="sm">
                {showAdvancedSettings ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </CardTitle>
          </CardHeader>
          {showAdvancedSettings && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-purple-300">Response Delay (ms)</label>
                  <Input 
                    type="number" 
                    defaultValue="1500"
                    className="bg-black/30 border-purple-500/50 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm text-purple-300">Confidence Threshold</label>
                  <Input 
                    type="number" 
                    min="0" 
                    max="1" 
                    step="0.1"
                    defaultValue="0.7"
                    className="bg-black/30 border-purple-500/50 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm text-purple-300">Max Response Length</label>
                  <Input 
                    type="number" 
                    defaultValue="280"
                    className="bg-black/30 border-purple-500/50 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm text-purple-300">Learning Rate</label>
                  <Input 
                    type="number" 
                    min="0" 
                    max="1" 
                    step="0.01"
                    defaultValue="0.1"
                    className="bg-black/30 border-purple-500/50 text-white mt-1"
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t border-purple-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-white">Export Training Data</span>
                  <Button size="sm" variant="outline">
                    <Database className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

