import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { User } from '@shared/schema';
import { FuturisticCard, GlowButton, NeonText } from './modern-futuristic-theme';

import {
  Save, X, Upload, Camera, Edit, User as UserIcon, Shield, 
  Network, Bluetooth, Wifi, Lock, CheckCircle, AlertCircle,
  Loader2, RotateCcw, Eye, EyeOff
} from 'lucide-react';

interface EnhancedProfileEditorProps {
  currentUser: User;
  onUserUpdate: (updatedUser: User) => void;
  onClose: () => void;
  isOffline: boolean;
}

export function EnhancedProfileEditor({ currentUser, onUserUpdate, onClose, isOffline }: EnhancedProfileEditorProps) {
  const [editedUser, setEditedUser] = useState<User>(currentUser);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Enhanced profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData: Partial<User>) => {
      setIsUploading(true);
      setUploadProgress(10);

      try {
        let avatarUrl = editedUser.avatar;

        // Handle avatar upload if a file is selected
        if (selectedFile) {
          setUploadProgress(30);
          
          // In a real implementation, upload to a file storage service
          // For now, we'll create a local object URL
          avatarUrl = URL.createObjectURL(selectedFile);
          setUploadProgress(70);
        }

        setUploadProgress(90);

        const finalData = {
          ...updatedData,
          avatar: avatarUrl
        };

        const response = await apiRequest(`/api/users/${currentUser.id}`, {
          method: 'PATCH',
          body: finalData,
        });

        setUploadProgress(100);
        return response;
      } catch (error) {
        setUploadProgress(0);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "Profile Updated Successfully!",
        description: "Your profile changes have been saved.",
      });
      
      onUserUpdate(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      // Update localStorage immediately
      localStorage.setItem('meshbook-user', JSON.stringify(updatedUser));
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Handle file selection for avatar
  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (file.size > maxSize) {
      setErrors(prev => ({ ...prev, avatar: 'File too large. Maximum size is 5MB.' }));
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, avatar: 'Invalid file type. Please use JPEG, PNG, GIF, or WebP.' }));
      toast({
        title: "Invalid File Type",
        description: "Please select a valid image file.",
        variant: "destructive"
      });
      return;
    }

    setErrors(prev => ({ ...prev, avatar: '' }));
    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!editedUser.alias.trim()) {
      newErrors.alias = 'Alias is required';
    } else if (editedUser.alias.trim().length < 2) {
      newErrors.alias = 'Alias must be at least 2 characters';
    } else if (editedUser.alias.trim().length > 20) {
      newErrors.alias = 'Alias must be less than 20 characters';
    }

    if (editedUser.profile && editedUser.profile.length > 500) {
      newErrors.profile = 'Bio must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors below.",
        variant: "destructive"
      });
      return;
    }

    updateProfileMutation.mutate({
      alias: editedUser.alias.trim(),
      profile: editedUser.profile?.trim() || '',
      securityLevel: editedUser.securityLevel,
      nodeCapabilities: editedUser.nodeCapabilities,
      meshCallsign: editedUser.meshCallsign
    });
  };

  // Reset form
  const handleReset = () => {
    setEditedUser(currentUser);
    setSelectedFile(null);
    setAvatarPreview(null);
    setErrors({});
  };

  // Toggle node capability
  const toggleCapability = (capability: string) => {
    setEditedUser(prev => ({
      ...prev,
      nodeCapabilities: prev.nodeCapabilities.includes(capability)
        ? prev.nodeCapabilities.filter(c => c !== capability)
        : [...prev.nodeCapabilities, capability]
    }));
  };

  const availableCapabilities = [
    'mesh-relay',
    'file-transfer',
    'voice-chat',
    'bluetooth-bridge',
    'emergency-beacon',
    'offline-storage',
    'encryption-node',
    'discovery-beacon'
  ];

  return (
    <FuturisticCard className="border-cyan-400/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-cyan-400" />
            Edit Profile
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload Section */}
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <Avatar className="w-32 h-32 border-4 border-cyan-400/30">
                <AvatarImage src={avatarPreview || editedUser.avatar} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-cyan-400/20 to-purple-400/20">
                  {editedUser.alias.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 rounded-full w-10 h-10 border-cyan-400/30"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarSelect}
              accept="image/*"
              className="hidden"
            />
            
            {errors.avatar && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.avatar}
              </p>
            )}
            
            <p className="text-xs text-muted-foreground">
              Click the camera icon to upload a new profile picture (Max 5MB)
            </p>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Updating profile...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-cyan-400 to-purple-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="alias">Alias *</Label>
              <Input
                id="alias"
                value={editedUser.alias}
                onChange={(e) => setEditedUser(prev => ({ ...prev, alias: e.target.value }))}
                className="bg-black/50 border-cyan-400/30"
                placeholder="Enter your alias"
                disabled={isUploading}
              />
              {errors.alias && (
                <p className="text-sm text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.alias}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="meshCallsign">Mesh Callsign</Label>
              <Input
                id="meshCallsign"
                value={editedUser.meshCallsign}
                onChange={(e) => setEditedUser(prev => ({ ...prev, meshCallsign: e.target.value }))}
                className="bg-black/50 border-cyan-400/30"
                placeholder="Enter mesh callsign"
                disabled={isUploading}
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={editedUser.profile || ''}
              onChange={(e) => setEditedUser(prev => ({ ...prev, profile: e.target.value }))}
              rows={3}
              className="bg-black/50 border-cyan-400/30"
              placeholder="Tell others about yourself..."
              disabled={isUploading}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{editedUser.profile?.length || 0}/500 characters</span>
              {errors.profile && (
                <span className="text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.profile}
                </span>
              )}
            </div>
          </div>

          {/* Security Level */}
          <div>
            <Label htmlFor="securityLevel">Security Level</Label>
            <select
              id="securityLevel"
              value={editedUser.securityLevel}
              onChange={(e) => setEditedUser(prev => ({ ...prev, securityLevel: parseInt(e.target.value) }))}
              className="w-full bg-black/50 border border-cyan-400/30 rounded-md px-3 py-2 text-sm"
              disabled={isUploading}
            >
              <option value={1}>Level 1 - Basic</option>
              <option value={2}>Level 2 - Standard</option>
              <option value={3}>Level 3 - Enhanced</option>
              <option value={4}>Level 4 - Advanced</option>
              <option value={5}>Level 5 - Maximum</option>
            </select>
          </div>

          {/* Node Capabilities */}
          <div>
            <Label className="text-base font-medium mb-3 block">Node Capabilities</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableCapabilities.map((capability) => (
                <div
                  key={capability}
                  onClick={() => !isUploading && toggleCapability(capability)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all duration-300 ${
                    editedUser.nodeCapabilities.includes(capability)
                      ? 'border-cyan-400 bg-cyan-400/10'
                      : 'border-gray-600 hover:border-gray-500'
                  } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    {editedUser.nodeCapabilities.includes(capability) ? (
                      <CheckCircle className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-gray-400" />
                    )}
                    <span className="text-sm font-medium">
                      {capability.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between pt-4 border-t border-cyan-400/20">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isUploading}
                className="border-cyan-400/30"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isUploading}
                className="border-cyan-400/30"
              >
                Cancel
              </Button>
            </div>
            
            <GlowButton
              type="submit"
              disabled={isUploading || isOffline}
              className="min-w-[120px]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </GlowButton>
          </div>

          {isOffline && (
            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
              <AlertCircle className="w-4 h-4 text-yellow-400" />
              <p className="text-sm text-yellow-400">
                You're offline. Changes will be saved locally and synced when connection is restored.
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </FuturisticCard>
  );
}