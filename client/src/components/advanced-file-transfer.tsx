import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Upload, 
  Download, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive, 
  File,
  Pause,
  Play,
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Folder,
  FolderOpen,
  Share2,
  Copy,
  Trash2,
  Eye,
  Clock,
  Zap,
  Shield,
  Wifi,
  WifiOff,
  HardDrive,
  Cloud,
  Users,
  Settings,
  Filter,
  Search,
  MoreHorizontal,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FileTransfer {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  progress: number;
  speed: number;
  eta: number;
  status: 'pending' | 'transferring' | 'paused' | 'completed' | 'failed' | 'cancelled';
  direction: 'upload' | 'download';
  peer: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  encrypted: boolean;
  chunks: {
    total: number;
    completed: number;
    failed: number[];
  };
  timestamp: Date;
  resumable: boolean;
}

interface FileHistory {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  direction: 'sent' | 'received';
  peer: string;
  timestamp: Date;
  status: 'success' | 'failed';
  encrypted: boolean;
}

interface NetworkStats {
  totalTransfers: number;
  completedTransfers: number;
  failedTransfers: number;
  totalBytesTransferred: number;
  averageSpeed: number;
  activeTransfers: number;
  peersConnected: number;
}

interface AdvancedFileTransferProps {
  currentUser: any;
  availableNodes: any[];
  className?: string;
}

export function AdvancedFileTransfer({ currentUser, availableNodes, className }: AdvancedFileTransferProps) {
  const [activeTransfers, setActiveTransfers] = useState<FileTransfer[]>([]);
  const [fileHistory, setFileHistory] = useState<FileHistory[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [targetPeer, setTargetPeer] = useState<string>('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'failed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [maxConcurrentTransfers, setMaxConcurrentTransfers] = useState(3);
  const [bandwidthLimit, setBandwidthLimit] = useState(0); // 0 = unlimited
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch network statistics
  const { data: networkStats } = useQuery<NetworkStats>({
    queryKey: ['/api/transfers/stats'],
    queryFn: async () => {
      const response = await fetch('/api/transfers/status');
      const data = await response.json();
      return data.statistics;
    },
    refetchInterval: 1000,
  });

  // Simulate file transfers for demonstration
  useEffect(() => {
    const mockTransfers: FileTransfer[] = [
      {
        id: 'transfer_1',
        fileName: 'mesh_protocol.pdf',
        fileSize: 2.5 * 1024 * 1024,
        fileType: 'application/pdf',
        progress: 75,
        speed: 1.2 * 1024 * 1024,
        eta: 5,
        status: 'transferring',
        direction: 'download',
        peer: 'CyberNode_Alpha',
        priority: 'medium',
        encrypted: true,
        chunks: { total: 40, completed: 30, failed: [] },
        timestamp: new Date(Date.now() - 30000),
        resumable: true
      },
      {
        id: 'transfer_2',
        fileName: 'encryption_keys.zip',
        fileSize: 856 * 1024,
        fileType: 'application/zip',
        progress: 45,
        speed: 512 * 1024,
        eta: 12,
        status: 'transferring',
        direction: 'upload',
        peer: 'SecureNode_Beta',
        priority: 'high',
        encrypted: true,
        chunks: { total: 14, completed: 6, failed: [3] },
        timestamp: new Date(Date.now() - 45000),
        resumable: true
      },
      {
        id: 'transfer_3',
        fileName: 'network_topology.json',
        fileSize: 128 * 1024,
        fileType: 'application/json',
        progress: 100,
        speed: 0,
        eta: 0,
        status: 'completed',
        direction: 'download',
        peer: 'DataNode_Gamma',
        priority: 'low',
        encrypted: false,
        chunks: { total: 2, completed: 2, failed: [] },
        timestamp: new Date(Date.now() - 120000),
        resumable: false
      }
    ];

    setActiveTransfers(mockTransfers);

    // Mock file history
    const mockHistory: FileHistory[] = [
      {
        id: 'history_1',
        fileName: 'blockchain_data.db',
        fileSize: 12 * 1024 * 1024,
        fileType: 'application/octet-stream',
        direction: 'received',
        peer: 'MeshNode_Delta',
        timestamp: new Date(Date.now() - 300000),
        status: 'success',
        encrypted: true
      },
      {
        id: 'history_2',
        fileName: 'user_profiles.json',
        fileSize: 245 * 1024,
        fileType: 'application/json',
        direction: 'sent',
        peer: 'UserNode_Echo',
        timestamp: new Date(Date.now() - 600000),
        status: 'success',
        encrypted: true
      }
    ];

    setFileHistory(mockHistory);
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList) => {
    if (!targetPeer) {
      toast({
        title: "No Target Selected",
        description: "Please select a peer to send files to",
        variant: "destructive",
      });
      return;
    }

    const newTransfers: FileTransfer[] = Array.from(files).map((file, index) => ({
      id: `transfer_${Date.now()}_${index}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      progress: 0,
      speed: 0,
      eta: 0,
      status: 'pending',
      direction: 'upload',
      peer: targetPeer,
      priority,
      encrypted: encryptionEnabled,
      chunks: { 
        total: Math.ceil(file.size / (64 * 1024)), 
        completed: 0, 
        failed: [] 
      },
      timestamp: new Date(),
      resumable: true
    }));

    setActiveTransfers(prev => [...prev, ...newTransfers]);
    
    // Start transfers
    newTransfers.forEach(transfer => {
      startTransfer(transfer);
    });

    toast({
      title: "Files Added",
      description: `${files.length} file(s) added to transfer queue`,
    });
  }, [targetPeer, priority, encryptionEnabled, toast]);

  // Start transfer simulation
  const startTransfer = useCallback((transfer: FileTransfer) => {
    const interval = setInterval(() => {
      setActiveTransfers(prev => prev.map(t => {
        if (t.id === transfer.id && t.status === 'transferring') {
          const newProgress = Math.min(100, t.progress + Math.random() * 5);
          const newSpeed = Math.random() * 2 * 1024 * 1024; // Random speed up to 2MB/s
          const remainingBytes = t.fileSize * (1 - newProgress / 100);
          const newEta = newSpeed > 0 ? Math.ceil(remainingBytes / newSpeed) : 0;
          
          if (newProgress >= 100) {
            clearInterval(interval);
            toast({
              title: "Transfer Complete",
              description: `${t.fileName} has been transferred successfully`,
            });
            return { ...t, progress: 100, status: 'completed', speed: 0, eta: 0 };
          }
          
          return { ...t, progress: newProgress, speed: newSpeed, eta: newEta };
        }
        return t;
      }));
    }, 1000);

    // Update status to transferring
    setActiveTransfers(prev => prev.map(t => 
      t.id === transfer.id ? { ...t, status: 'transferring' } : t
    ));
  }, [toast]);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  // Control transfer actions
  const pauseTransfer = useCallback((transferId: string) => {
    setActiveTransfers(prev => prev.map(t => 
      t.id === transferId ? { ...t, status: 'paused' } : t
    ));
  }, []);

  const resumeTransfer = useCallback((transferId: string) => {
    setActiveTransfers(prev => prev.map(t => {
      if (t.id === transferId) {
        const updatedTransfer = { ...t, status: 'transferring' };
        startTransfer(updatedTransfer);
        return updatedTransfer;
      }
      return t;
    }));
  }, [startTransfer]);

  const cancelTransfer = useCallback((transferId: string) => {
    setActiveTransfers(prev => prev.map(t => 
      t.id === transferId ? { ...t, status: 'cancelled' } : t
    ));
  }, []);

  // Get file icon
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image;
    if (fileType.startsWith('video/')) return Video;
    if (fileType.startsWith('audio/')) return Music;
    if (fileType.includes('zip') || fileType.includes('rar')) return Archive;
    if (fileType.includes('pdf') || fileType.includes('doc')) return FileText;
    return File;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  };

  // Format speed
  const formatSpeed = (bytesPerSecond: number) => {
    if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`;
    if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    return `${(bytesPerSecond / 1024 / 1024).toFixed(1)} MB/s`;
  };

  // Format time
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  // Filter transfers
  const filteredTransfers = activeTransfers.filter(transfer => {
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && ['pending', 'transferring', 'paused'].includes(transfer.status)) ||
      (filterStatus === 'completed' && transfer.status === 'completed') ||
      (filterStatus === 'failed' && ['failed', 'cancelled'].includes(transfer.status));
    
    const matchesSearch = searchTerm === '' || 
      transfer.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.peer.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  return (
    <div className={cn("w-full max-w-6xl mx-auto p-4 space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--cyber-cyan)]">Advanced File Transfer</h2>
          <p className="text-gray-400 mt-1">Secure P2P file sharing with encryption and resume support</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-[var(--cyber-green)]">
            <Zap className="w-3 h-3 mr-1" />
            {networkStats?.activeTransfers || 0} Active
          </Badge>
          <Badge variant="outline" className="text-[var(--cyber-cyan)]">
            <Shield className="w-3 h-3 mr-1" />
            E2E Encrypted
          </Badge>
        </div>
      </div>

      {/* Network Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-morphism">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Upload className="w-5 h-5 text-[var(--cyber-cyan)]" />
              <div>
                <p className="text-sm text-gray-400">Total Transfers</p>
                <p className="text-xl font-bold text-white">{networkStats?.totalTransfers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-morphism">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-[var(--cyber-green)]" />
              <div>
                <p className="text-sm text-gray-400">Completed</p>
                <p className="text-xl font-bold text-white">{networkStats?.completedTransfers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-morphism">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-5 h-5 text-[var(--cyber-magenta)]" />
              <div>
                <p className="text-sm text-gray-400">Data Transferred</p>
                <p className="text-xl font-bold text-white">
                  {formatFileSize(networkStats?.totalBytesTransferred || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-morphism">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Wifi className="w-5 h-5 text-[var(--cyber-yellow)]" />
              <div>
                <p className="text-sm text-gray-400">Avg Speed</p>
                <p className="text-xl font-bold text-white">
                  {formatSpeed(networkStats?.averageSpeed || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* File Upload Section */}
      <Card className="glass-morphism">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Send Files</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Target Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="target-peer">Target Peer</Label>
              <Select value={targetPeer} onValueChange={setTargetPeer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a peer..." />
                </SelectTrigger>
                <SelectContent>
                  {availableNodes.map((node) => (
                    <SelectItem key={node.id} value={node.id}>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>{node.id}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="encryption"
                checked={encryptionEnabled}
                onChange={(e) => setEncryptionEnabled(e.target.checked)}
              />
              <Label htmlFor="encryption" className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Encrypt Files</span>
              </Label>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Advanced
              {showAdvanced ? <ChevronDown className="w-4 h-4 ml-2" /> : <ChevronRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-[var(--cyber-cyan)]/30 rounded-lg">
              <div>
                <Label htmlFor="concurrent">Max Concurrent Transfers</Label>
                <Input
                  type="number"
                  value={maxConcurrentTransfers}
                  onChange={(e) => setMaxConcurrentTransfers(parseInt(e.target.value) || 3)}
                  min="1"
                  max="10"
                />
              </div>
              <div>
                <Label htmlFor="bandwidth">Bandwidth Limit (KB/s)</Label>
                <Input
                  type="number"
                  value={bandwidthLimit}
                  onChange={(e) => setBandwidthLimit(parseInt(e.target.value) || 0)}
                  placeholder="0 = unlimited"
                />
              </div>
            </div>
          )}

          {/* Drop Zone */}
          <div
            ref={dropZoneRef}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              dragActive ? "border-[var(--cyber-cyan)] bg-[var(--cyber-cyan)]/10" : "border-gray-600 hover:border-[var(--cyber-cyan)]/50"
            )}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => setDragActive(true)}
            onDragLeave={() => setDragActive(false)}
          >
            <Cloud className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium text-white mb-2">
              Drop files here or click to select
            </p>
            <p className="text-sm text-gray-400 mb-4">
              Supports all file types • Max 100MB per file
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={!targetPeer}
              className="bg-[var(--cyber-cyan)] hover:bg-[var(--cyber-cyan)]/80"
            >
              <Upload className="w-4 h-4 mr-2" />
              Select Files
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFileSelect(e.target.files);
            }}
          />
        </CardContent>
      </Card>

      {/* Transfer Management */}
      <Card className="glass-morphism">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Download className="w-5 h-5" />
              <span>Transfer Manager</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search transfers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {filteredTransfers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No transfers found</p>
                <p className="text-sm mt-2">Upload files to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransfers.map((transfer) => {
                  const Icon = getFileIcon(transfer.fileType);
                  return (
                    <div
                      key={transfer.id}
                      className="flex items-center space-x-4 p-4 border border-[var(--cyber-cyan)]/20 rounded-lg hover:border-[var(--cyber-cyan)]/40 transition-colors"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <Icon className="w-8 h-8 text-[var(--cyber-cyan)]" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-white truncate">{transfer.fileName}</p>
                            <div className="flex items-center space-x-2">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  transfer.priority === 'urgent' ? "text-red-500" :
                                  transfer.priority === 'high' ? "text-orange-500" :
                                  transfer.priority === 'medium' ? "text-[var(--cyber-cyan)]" :
                                  "text-gray-400"
                                )}
                              >
                                {transfer.priority}
                              </Badge>
                              {transfer.encrypted && <Shield className="w-4 h-4 text-[var(--cyber-green)]" />}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                            <span>{formatFileSize(transfer.fileSize)}</span>
                            <span>•</span>
                            <span>{transfer.direction === 'upload' ? 'To' : 'From'}: {transfer.peer}</span>
                            <span>•</span>
                            <span>{formatTime((Date.now() - transfer.timestamp.getTime()) / 1000)} ago</span>
                          </div>
                          
                          {transfer.status === 'transferring' && (
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span>{transfer.progress.toFixed(1)}%</span>
                                <span>{formatSpeed(transfer.speed)}</span>
                                <span>ETA: {formatTime(transfer.eta)}</span>
                              </div>
                              <Progress value={transfer.progress} className="h-2" />
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <span>Chunks: {transfer.chunks.completed}/{transfer.chunks.total}</span>
                                {transfer.chunks.failed.length > 0 && (
                                  <span className="text-red-500">Failed: {transfer.chunks.failed.length}</span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {transfer.status === 'completed' && (
                            <div className="mt-2 flex items-center space-x-2 text-sm text-[var(--cyber-green)]">
                              <CheckCircle className="w-4 h-4" />
                              <span>Transfer completed successfully</span>
                            </div>
                          )}
                          
                          {['failed', 'cancelled'].includes(transfer.status) && (
                            <div className="mt-2 flex items-center space-x-2 text-sm text-red-500">
                              <AlertCircle className="w-4 h-4" />
                              <span>Transfer {transfer.status}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Transfer Controls */}
                      <div className="flex items-center space-x-2">
                        {transfer.status === 'transferring' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => pauseTransfer(transfer.id)}
                          >
                            <Pause className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {transfer.status === 'paused' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resumeTransfer(transfer.id)}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {!['completed', 'failed', 'cancelled'].includes(transfer.status) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cancelTransfer(transfer.id)}
                            className="text-red-500 hover:text-red-400"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {transfer.status === 'failed' && transfer.resumable && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resumeTransfer(transfer.id)}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Transfer History */}
      <Card className="glass-morphism">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Transfer History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {fileHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No transfer history</p>
              </div>
            ) : (
              <div className="space-y-3">
                {fileHistory.map((item) => {
                  const Icon = getFileIcon(item.fileType);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center space-x-4 p-3 border border-[var(--cyber-cyan)]/10 rounded-lg"
                    >
                      <Icon className="w-6 h-6 text-[var(--cyber-cyan)]" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-white">{item.fileName}</p>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                item.status === 'success' ? "text-[var(--cyber-green)]" : "text-red-500"
                              )}
                            >
                              {item.status}
                            </Badge>
                            {item.encrypted && <Shield className="w-3 h-3 text-[var(--cyber-green)]" />}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                          <span>{formatFileSize(item.fileSize)}</span>
                          <span>•</span>
                          <span>{item.direction === 'sent' ? 'Sent to' : 'Received from'}: {item.peer}</span>
                          <span>•</span>
                          <span>{item.timestamp.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}