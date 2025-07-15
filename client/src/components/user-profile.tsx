import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Camera, Edit3, Save, X, User as UserIcon, Wifi, WifiOff } from 'lucide-react';
import type { User, UpdateUser } from '@shared/schema';

interface UserProfileProps {
  userId: number;
  deviceId: string;
  onClose?: () => void;
}

export function UserProfile({ userId, deviceId, onClose }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UpdateUser>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user data
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/users', userId],
    enabled: !!userId,
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (updates: UpdateUser) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsEditing(false);
      setEditForm({});
      setPreviewImage(null);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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
        const imageData = e.target?.result as string;
        setPreviewImage(imageData);
        setEditForm(prev => ({ ...prev, profileImage: imageData }));
      };
      reader.readAsDataURL(file);
    }
  };

  const startEditing = () => {
    setIsEditing(true);
    setEditForm({
      username: user?.username || '',
      bio: user?.bio || '',
      profileImage: user?.profileImage || '',
    });
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm({});
    setPreviewImage(null);
  };

  const saveProfile = () => {
    if (!editForm.username?.trim()) {
      toast({
        title: "Username Required",
        description: "Please enter a username.",
        variant: "destructive",
      });
      return;
    }
    updateUserMutation.mutate(editForm);
  };

  const generateAvatar = (name: string) => {
    const colors = [
      'bg-gradient-to-br from-[var(--cyber-cyan)] to-blue-600',
      'bg-gradient-to-br from-[var(--cyber-magenta)] to-purple-600',
      'bg-gradient-to-br from-green-400 to-emerald-600',
      'bg-gradient-to-br from-orange-400 to-red-600',
      'bg-gradient-to-br from-blue-400 to-indigo-600',
    ];
    const colorIndex = name.length % colors.length;
    return colors[colorIndex];
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto bg-[var(--cyber-dark)]/90 border-[var(--cyber-cyan)]/30">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-4"></div>
            <div className="h-4 bg-gray-700 rounded w-3/4 mx-auto mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayImage = previewImage || user?.profileImage;
  const displayName = isEditing ? (editForm.username || '') : (user?.username || 'Unknown User');
  const displayBio = isEditing ? (editForm.bio || '') : (user?.bio || 'No bio available');

  return (
    <Card className="w-full max-w-md mx-auto bg-[var(--cyber-dark)]/95 border-[var(--cyber-cyan)]/30 backdrop-blur-sm">
      <CardHeader className="relative">
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-2 top-2 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <CardTitle className="text-center text-[var(--cyber-cyan)] flex items-center justify-center gap-2">
          <UserIcon className="h-5 w-5" />
          Profile
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Profile Image Section */}
        <div className="relative flex flex-col items-center">
          <div className="relative group">
            <Avatar className="w-24 h-24 border-2 border-[var(--cyber-cyan)]/50">
              {displayImage ? (
                <AvatarImage src={displayImage} alt={displayName} />
              ) : (
                <AvatarFallback className={`text-white text-xl font-bold ${generateAvatar(displayName)}`}>
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            
            {isEditing && (
              <Button
                variant="outline"
                size="sm"
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-[var(--cyber-cyan)] text-black hover:bg-[var(--cyber-cyan)]/80"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Connection Status */}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="border-[var(--cyber-cyan)]/50 text-[var(--cyber-cyan)]">
              {user?.isOnline ? (
                <>
                  <Wifi className="h-3 w-3 mr-1" />
                  Online
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* Username Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Username</label>
          {isEditing ? (
            <Input
              value={editForm.username || ''}
              onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Enter username"
              className="bg-[var(--cyber-dark)]/50 border-[var(--cyber-cyan)]/30 text-white"
              maxLength={30}
            />
          ) : (
            <p className="text-white font-medium text-lg">{displayName}</p>
          )}
        </div>

        {/* Bio Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Bio</label>
          {isEditing ? (
            <Textarea
              value={editForm.bio || ''}
              onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell others about yourself..."
              className="bg-[var(--cyber-dark)]/50 border-[var(--cyber-cyan)]/30 text-white resize-none"
              rows={3}
              maxLength={150}
            />
          ) : (
            <p className="text-gray-300 text-sm">{displayBio}</p>
          )}
        </div>

        {/* Device Info */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Device ID</label>
          <p className="text-xs text-gray-400 font-mono bg-[var(--cyber-dark)]/50 p-2 rounded border border-[var(--cyber-cyan)]/20">
            {deviceId}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          {isEditing ? (
            <>
              <Button
                onClick={saveProfile}
                disabled={updateUserMutation.isPending}
                className="flex-1 bg-[var(--cyber-cyan)] text-black hover:bg-[var(--cyber-cyan)]/80"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateUserMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button
                onClick={cancelEditing}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              onClick={startEditing}
              className="w-full bg-[var(--cyber-magenta)] text-white hover:bg-[var(--cyber-magenta)]/80"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}