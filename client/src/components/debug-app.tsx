import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export function DebugApp() {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [wsUrl, setWsUrl] = useState(`ws://${window.location.host}/ws`);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [networkStatus, setNetworkStatus] = useState<any>(null);
  const { toast } = useToast();

  const log = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-49), `[${timestamp}] ${message}`]);
  };

  const connectWebSocket = () => {
    try {
      const websocket = new WebSocket(wsUrl);
      
      websocket.onopen = () => {
        setConnectionStatus('connected');
        setWs(websocket);
        log('WebSocket connected successfully');
        
        // Send join-room message to register with the server
        websocket.send(JSON.stringify({
          type: 'join-room',
          userId: `debug-${Math.random().toString(36).substr(2, 9)}`
        }));
        
        toast({
          title: "Connected",
          description: "WebSocket connection established",
        });
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          log(`Received: ${data.type || 'unknown'} message`);
          
          if (data.type === 'pong') {
            log(`Ping response received from ${data.nodeId}`);
          }
        } catch (err) {
          log(`Received raw: ${event.data.slice(0, 100)}...`);
        }
      };

      websocket.onerror = (error) => {
        log(`WebSocket error: ${error}`);
        setConnectionStatus('error');
      };

      websocket.onclose = () => {
        setConnectionStatus('disconnected');
        setWs(null);
        log('WebSocket disconnected');
      };
    } catch (error) {
      log(`Connection failed: ${error}`);
      setConnectionStatus('error');
    }
  };

  const sendPing = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'ping',
        timestamp: Date.now()
      }));
      log('Ping sent');
    } else {
      log('WebSocket not connected');
    }
  };

  const fetchStats = async () => {
    try {
      const usersRes = await fetch('/api/users');
      const users = await usersRes.json();
      setUserCount(users.length);
      log(`Fetched ${users.length} users from database`);
      
      const messagesRes = await fetch('/api/messages');
      const messages = await messagesRes.json();
      setMessageCount(messages.length);
      log(`Fetched ${messages.length} messages from database`);
      
      const networkRes = await fetch('/api/network/status');
      const network = await networkRes.json();
      setNetworkStatus(network);
      log(`Network status updated - ${network.networkStats.totalNodes} nodes`);
      
    } catch (error) {
      log(`Failed to fetch stats: ${error}`);
    }
  };

  const createTestUser = async () => {
    try {
      const userData = {
        alias: `TestUser${Date.now()}`,
        profile: 'Debug test user created for data persistence testing',
        avatar: '',
        deviceId: `device-${Math.random().toString(36).substr(2, 9)}`,
        publicKey: `pubkey-${Math.random().toString(36).substr(2, 20)}`,
        meshCallsign: `CALL${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        securityLevel: 1,
        nodeCapabilities: ['basic', 'messaging']
      };

      log(`Creating user: ${userData.alias}`);

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const user = await response.json();
        log(`✓ User created successfully: ${user.alias} (ID: ${user.id})`);
        fetchStats();
        toast({
          title: "User Created",
          description: `User ${user.alias} saved to database`,
        });
      } else {
        const error = await response.json();
        log(`✗ Failed to create user: ${error.error || error.details}`);
        toast({
          title: "Error",
          description: error.error || "Failed to create user",
          variant: "destructive"
        });
      }
    } catch (error) {
      log(`✗ Create user error: ${error}`);
    }
  };

  const createTestMessage = async () => {
    if (userCount < 2) {
      log('Need at least 2 users to create a message');
      toast({
        title: "Error",
        description: "Create at least 2 users first",
        variant: "destructive"
      });
      return;
    }

    try {
      const messageData = {
        fromUserId: 1,
        toUserId: userCount > 1 ? 2 : 1,
        content: `Test message created at ${new Date().toLocaleTimeString()}`,
        encryptedContent: 'encrypted_test_content',
        messageType: 'text',
        isEphemeral: false,
        meshHops: 0
      };

      log(`Creating message from user ${messageData.fromUserId} to user ${messageData.toUserId}`);

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      });

      if (response.ok) {
        const message = await response.json();
        log(`✓ Message created successfully (ID: ${message.id})`);
        fetchStats();
        toast({
          title: "Message Created",
          description: "Message saved to database",
        });
      } else {
        const error = await response.json();
        log(`✗ Failed to create message: ${error.error}`);
      }
    } catch (error) {
      log(`✗ Create message error: ${error}`);
    }
  };

  useEffect(() => {
    fetchStats();
    log('Debug interface loaded');
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-green-400">Mesh Network Debug Interface</CardTitle>
            <CardDescription>Test data persistence, WebSocket connections, and network functionality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{userCount}</div>
                <div className="text-sm text-gray-400">Users in DB</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{messageCount}</div>
                <div className="text-sm text-gray-400">Messages in DB</div>
              </div>
              <div className="text-center">
                <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
                  {connectionStatus}
                </Badge>
                <div className="text-sm text-gray-400">WebSocket</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {networkStatus?.networkStats?.totalNodes || 0}
                </div>
                <div className="text-sm text-gray-400">Network Nodes</div>
              </div>
              <div className="text-center">
                <Button onClick={fetchStats} size="sm">
                  Refresh All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>WebSocket Testing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  value={wsUrl} 
                  onChange={(e) => setWsUrl(e.target.value)}
                  placeholder="WebSocket URL"
                  className="bg-gray-700 border-gray-600"
                />
                <Button onClick={connectWebSocket} disabled={connectionStatus === 'connected'}>
                  Connect
                </Button>
              </div>
              <Button 
                onClick={sendPing} 
                disabled={connectionStatus !== 'connected'}
                className="w-full"
              >
                Send Ping Test
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Data Persistence Testing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={createTestUser} className="w-full">
                Create Test User
              </Button>
              <Button 
                onClick={createTestMessage} 
                className="w-full"
                disabled={userCount < 2}
              >
                Create Test Message {userCount < 2 && '(Need 2+ users)'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>System Logs</CardTitle>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setLogs([])}
              >
                Clear Logs
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-black p-4 rounded max-h-60 overflow-y-auto font-mono text-sm">
              {logs.map((log, index) => (
                <div key={index} className="text-green-400">{log}</div>
              ))}
              {logs.length === 0 && (
                <div className="text-gray-500">No logs yet...</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}