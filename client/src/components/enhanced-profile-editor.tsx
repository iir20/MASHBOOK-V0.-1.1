import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  User as UserIcon, 
  Camera, 
  Save, 
  X, 
  Upload,
  Edit3,
  Shield,
  Radio,
  Network,
  Loader2
} from 'lucide-react';
import type { User, UpdateUser } from '@shared/schema';

interface EnhancedProfileEditorProps {
  user: User;
  onUserUpdate: (updatedUser: User) => void;
  onClose: () => void;
}

export function EnhancedProfileEditor({ user, onUserUpdate, onClose }: EnhancedProfileEditorProps) {
  const [profileData, setProfileData] = useState({
    alias: user.alias || '',
    profile: user.profile || '',
    avatar: user.avatar || ''
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: UpdateUser) => {
      const response = await apiRequest(`/api/users/${user.id}`, {
        method: 'PATCH',
        body: updates
      });
      return response;
    },
    onSuccess: (updatedUser: User) => {
      onUserUpdate(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated!",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewImage(result);
        setProfileData(prev => ({ ...prev, avatar: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!profileData.alias.trim()) {
      toast({
        title: "Missing Information",
        description: "Username is required.",
        variant: "destructive",
      });
      return;
    }

    const updates: UpdateUser = {
      alias: profileData.alias.trim(),
      profile: profileData.profile.trim(),
      avatar: previewImage || user.avatar
    };

    updateProfileMutation.mutate(updates);
  };

  const generateRandomAvatar = () => {
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`;
    setPreviewImage(avatarUrl);
    setProfileData(prev => ({ ...prev, avatar: avatarUrl }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-cyan-400">
            <div className="flex items-center gap-2">
              <Edit3 className="w-5 h-5" />
              Edit Profile
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-cyan-500/50">
                <AvatarImage src={previewImage || user.avatar} />
                <AvatarFallback className="bg-gray-700 text-gray-300">
                  <UserIcon className="w-16 h-16" />
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 rounded-full w-10 h-10 bg-cyan-600 hover:bg-cyan-500"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Photo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={generateRandomAvatar}
                className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20"
              >
                Generate Avatar
              </Button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* User Info Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-2">
                Username *
              </label>
              <Input
                value={profileData.alias}
                onChange={(e) => setProfileData(prev => ({ ...prev, alias: e.target.value }))}
                placeholder="Enter your username"
                className="bg-slate-800/50 border-cyan-500/30 text-white placeholder:text-gray-400"
                maxLength={30}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-2">
                Bio
              </label>
              <Textarea
                value={profileData.profile}
                onChange={(e) => setProfileData(prev => ({ ...prev, profile: e.target.value }))}
                placeholder="Tell the network about yourself..."
                className="bg-slate-800/50 border-cyan-500/30 text-white placeholder:text-gray-400 min-h-[100px]"
                maxLength={200}
              />
              <div className="text-xs text-gray-400 mt-1">
                {profileData.profile.length}/200 characters
              </div>
            </div>
          </div>

          {/* User Badges */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-cyan-400">
              Network Status
            </label>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-pink-300 border-pink-500/50 bg-pink-500/10">
                <Radio className="w-3 h-3 mr-1" />
                {user.meshCallsign}
              </Badge>
              <Badge variant="outline" className="text-green-300 border-green-500/50 bg-green-500/10">
                <Shield className="w-3 h-3 mr-1" />
                Security Level {user.securityLevel}
              </Badge>
              <Badge variant="outline" className="text-blue-300 border-blue-500/50 bg-blue-500/10">
                <Network className="w-3 h-3 mr-1" />
                {user.nodeCapabilities?.length || 0} Capabilities
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={updateProfileMutation.isPending}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}