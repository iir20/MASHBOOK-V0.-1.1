import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Upload, 
  Download, 
  Pause, 
  Play, 
  X, 
  File, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Image,
  Video,
  Music,
  Archive
} from 'lucide-react';
import { useAdvancedMesh } from '@/hooks/use-advanced-mesh';
import { useToast } from '@/hooks/use-toast';

interface FileTransferManagerProps {
  nodeId: string;
  availableNodes: string[];
}

export function FileTransferManager({ nodeId, availableNodes }: FileTransferManagerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetNode, setTargetNode] = useState<string>('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const {
    transferStatus,
    initiateFileTransfer,
    refetchTransfers
  } = useAdvancedMesh(nodeId);
  
  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    toast({
      title: "File Selected",
      description: `${file.name} (${formatBytes(file.size)}) ready for transfer`,
    });
  }, [toast]);
  
  const handleFileInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);
  
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);
  
  const handleTransferStart = useCallback(async () => {
    if (!selectedFile || !targetNode) {
      toast({
        title: "Error",
        description: "Please select a file and target node",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const transferId = await initiateFileTransfer(
        selectedFile.name,
        selectedFile.size,
        targetNode,
        priority
      );
      
      toast({
        title: "Transfer Started",
        description: `File transfer initiated with ID: ${transferId}`,
      });
      
      // Clear form
      setSelectedFile(null);
      setTargetNode('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      toast({
        title: "Transfer Failed",
        description: "Failed to start file transfer",
        variant: "destructive",
      });
    }
  }, [selectedFile, targetNode, priority, initiateFileTransfer, toast]);
  
  const handleTransferControl = useCallback(async (transferId: string, action: 'pause' | 'resume' | 'cancel') => {
    try {
      const response = await fetch(`/api/transfers/${transferId}/${action}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: `Transfer ${action}d successfully`,
        });
        refetchTransfers();
      } else {
        throw new Error(`Failed to ${action} transfer`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} transfer`,
        variant: "destructive",
      });
    }
  }, [toast, refetchTransfers]);
  
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'svg':
        return <Image className="w-5 h-5 text-blue-500" />;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'mkv':
        return <Video className="w-5 h-5 text-red-500" />;
      case 'mp3':
      case 'wav':
      case 'flac':
      case 'ogg':
        return <Music className="w-5 h-5 text-green-500" />;
      case 'zip':
      case 'rar':
      case 'tar':
      case 'gz':
        return <Archive className="w-5 h-5 text-yellow-500" />;
      case 'txt':
      case 'md':
      case 'doc':
      case 'docx':
      case 'pdf':
        return <FileText className="w-5 h-5 text-gray-500" />;
      default:
        return <File className="w-5 h-5 text-gray-400" />;
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      case 'transferring':
        return <Play className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'transferring':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const formatSpeed = (bytesPerSecond: number): string => {
    return formatBytes(bytesPerSecond) + '/s';
  };
  
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--cyber-cyan)]">File Transfer Manager</h2>
          <p className="text-gray-400 mt-1">Secure peer-to-peer file transfers</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-[var(--cyber-green)]">
            {transferStatus?.statistics?.activeTransfers || 0} active
          </Badge>
          <Badge variant="outline" className="text-[var(--cyber-cyan)]">
            {transferStatus?.statistics?.completedTransfers || 0} completed
          </Badge>
        </div>
      </div>
      
      {/* File Upload Interface */}
      <Card className="glass-morphism">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>New File Transfer</span>
          </CardTitle>
          <CardDescription>
            Select a file and target node to begin transfer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-[var(--cyber-cyan)] bg-[var(--cyber-cyan)]/10'
                : 'border-gray-300 hover:border-[var(--cyber-cyan)]/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="flex items-center justify-center space-x-3">
                {getFileIcon(selectedFile.name)}
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-400">{formatBytes(selectedFile.size)}</p>
                </div>
              </div>
            ) : (
              <div>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg mb-2">Drop files here or click to select</p>
                <p className="text-sm text-gray-400">Supports all file types</p>
              </div>
            )}
          </div>
          
          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileInput}
            className="hidden"
            accept="*/*"
          />
          
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            Select File
          </Button>
          
          {/* Transfer Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="targetNode">Target Node</Label>
              <Select value={targetNode} onValueChange={setTargetNode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target node" />
                </SelectTrigger>
                <SelectContent>
                  {availableNodes.map((node) => (
                    <SelectItem key={node} value={node}>
                      {node}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
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
          
          {/* Start Transfer Button */}
          <Button 
            onClick={handleTransferStart}
            disabled={!selectedFile || !targetNode}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            Start Transfer
          </Button>
        </CardContent>
      </Card>
      
      {/* Active Transfers */}
      <Card className="glass-morphism">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Active Transfers</span>
          </CardTitle>
          <CardDescription>
            Monitor ongoing file transfers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transferStatus?.activeTransfers?.length ? (
            <div className="space-y-4">
              {transferStatus.activeTransfers.map((transfer) => (
                <div key={transfer.transferId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(transfer.fileName)}
                      <div>
                        <p className="font-medium">{transfer.fileName}</p>
                        <p className="text-sm text-gray-400">
                          {formatBytes(transfer.transferredSize)} / {formatBytes(transfer.totalSize)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(transfer.status)}>
                        {getStatusIcon(transfer.status)}
                        <span className="ml-1">{transfer.status}</span>
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{transfer.progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={transfer.progress} className="h-2" />
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Speed: {formatSpeed(transfer.speed)}</span>
                      <span>ETA: {formatTime(transfer.eta)}</span>
                    </div>
                  </div>
                  
                  {/* Transfer Controls */}
                  <div className="flex space-x-2 mt-4">
                    {transfer.status === 'transferring' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleTransferControl(transfer.transferId, 'pause')}
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        Pause
                      </Button>
                    )}
                    {transfer.status === 'paused' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleTransferControl(transfer.transferId, 'resume')}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Resume
                      </Button>
                    )}
                    {!['completed', 'failed', 'cancelled'].includes(transfer.status) && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleTransferControl(transfer.transferId, 'cancel')}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Download className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No active transfers</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Transfer Statistics */}
      {transferStatus?.statistics && (
        <Card className="glass-morphism">
          <CardHeader>
            <CardTitle>Transfer Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--cyber-cyan)]">
                  {transferStatus.statistics.totalTransfers}
                </div>
                <div className="text-sm text-gray-400">Total Transfers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--cyber-green)]">
                  {transferStatus.statistics.completedTransfers}
                </div>
                <div className="text-sm text-gray-400">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--cyber-red)]">
                  {transferStatus.statistics.failedTransfers}
                </div>
                <div className="text-sm text-gray-400">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--cyber-yellow)]">
                  {formatBytes(transferStatus.statistics.totalBytesTransferred)}
                </div>
                <div className="text-sm text-gray-400">Total Data</div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Average Speed</span>
                <span className="text-sm font-mono">
                  {formatSpeed(transferStatus.statistics.averageSpeed)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}