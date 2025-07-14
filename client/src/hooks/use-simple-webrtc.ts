import { useEffect, useRef, useState, useCallback } from 'react';
import { WebRTCSignal } from '@/types/mesh';

export function useSimpleWebRTC(userId: string) {
  const [connectedPeers, setConnectedPeers] = useState<Set<string>>(new Set());
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const dataChannelsRef = useRef<Map<string, RTCDataChannel>>(new Map());

  const initializeWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${userId}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      if (!hasJoinedRoom) {
        ws.send(JSON.stringify({ type: 'join-room' }));
        setHasJoinedRoom(true);
      }
    };
    
    ws.onmessage = (event) => {
      try {
        const message: WebRTCSignal = JSON.parse(event.data);
        handleSignalingMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setHasJoinedRoom(false);
      setTimeout(initializeWebSocket, 3000);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [userId, hasJoinedRoom]);

  const handleSignalingMessage = useCallback((message: WebRTCSignal) => {
    if (message.fromUserId === userId) return;
    
    switch (message.type) {
      case 'user-joined':
        if (message.userId && message.userId !== userId) {
          setTimeout(() => createOffer(message.userId!), 1000);
        }
        break;
      case 'offer':
        if (message.fromUserId && message.data) {
          handleOffer(message.fromUserId, message.data);
        }
        break;
      case 'answer':
        if (message.fromUserId && message.data) {
          handleAnswer(message.fromUserId, message.data);
        }
        break;
      case 'ice-candidate':
        if (message.fromUserId && message.data) {
          handleIceCandidate(message.fromUserId, message.data);
        }
        break;
    }
  }, [userId]);

  const createPeerConnection = useCallback((peerId: string) => {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };
    
    const peerConnection = new RTCPeerConnection(configuration);
    
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          targetUserId: peerId,
          data: event.candidate
        }));
      }
    };
    
    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState === 'connected') {
        setConnectedPeers(prev => new Set(prev).add(peerId));
      } else if (peerConnection.connectionState === 'disconnected' || 
                 peerConnection.connectionState === 'failed') {
        setConnectedPeers(prev => {
          const newSet = new Set(prev);
          newSet.delete(peerId);
          return newSet;
        });
        cleanup(peerId);
      }
    };
    
    peersRef.current.set(peerId, peerConnection);
    return peerConnection;
  }, []);

  const createOffer = useCallback(async (peerId: string) => {
    const peerConnection = createPeerConnection(peerId);
    
    // Create data channel for messaging
    const dataChannel = peerConnection.createDataChannel('messaging', { ordered: true });
    dataChannelsRef.current.set(peerId, dataChannel);
    
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'offer',
          targetUserId: peerId,
          data: offer
        }));
      }
    } catch (error) {
      console.error('Failed to create offer:', error);
    }
  }, [createPeerConnection]);

  const handleOffer = useCallback(async (fromUserId: string, offer: RTCSessionDescriptionInit) => {
    const peerConnection = createPeerConnection(fromUserId);
    
    peerConnection.ondatachannel = (event) => {
      const dataChannel = event.channel;
      dataChannelsRef.current.set(fromUserId, dataChannel);
    };
    
    try {
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'answer',
          targetUserId: fromUserId,
          data: answer
        }));
      }
    } catch (error) {
      console.error('Failed to handle offer:', error);
    }
  }, [createPeerConnection]);

  const handleAnswer = useCallback(async (fromUserId: string, answer: RTCSessionDescriptionInit) => {
    const peerConnection = peersRef.current.get(fromUserId);
    if (peerConnection && peerConnection.signalingState === 'have-local-offer') {
      try {
        await peerConnection.setRemoteDescription(answer);
      } catch (error) {
        console.error('Failed to handle answer:', error);
      }
    }
  }, []);

  const handleIceCandidate = useCallback(async (fromUserId: string, candidate: RTCIceCandidateInit) => {
    const peerConnection = peersRef.current.get(fromUserId);
    if (peerConnection && peerConnection.remoteDescription) {
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch (error) {
        console.error('Failed to handle ICE candidate:', error);
      }
    }
  }, []);

  const cleanup = useCallback((peerId: string) => {
    const peerConnection = peersRef.current.get(peerId);
    if (peerConnection) {
      peerConnection.close();
      peersRef.current.delete(peerId);
    }
    
    const dataChannel = dataChannelsRef.current.get(peerId);
    if (dataChannel) {
      dataChannel.close();
      dataChannelsRef.current.delete(peerId);
    }
  }, []);

  const sendP2PMessage = useCallback((message: any) => {
    dataChannelsRef.current.forEach((channel, peerId) => {
      if (channel.readyState === 'open') {
        channel.send(JSON.stringify(message));
      }
    });
  }, []);

  useEffect(() => {
    initializeWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
      
      dataChannelsRef.current.forEach((dc) => dc.close());
      dataChannelsRef.current.clear();
    };
  }, [initializeWebSocket]);

  return {
    connectedPeers,
    sendP2PMessage,
    isConnected: hasJoinedRoom
  };
}