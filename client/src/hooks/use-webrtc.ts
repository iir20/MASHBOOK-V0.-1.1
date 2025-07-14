import { useEffect, useRef, useState, useCallback } from 'react';
import { useWebSocket } from './use-websocket';
import { WebRTCSignal } from '@/types/mesh';

export function useWebRTC(userId: string) {
  const [peers, setPeers] = useState<Map<string, RTCPeerConnection>>(new Map());
  const [dataChannels, setDataChannels] = useState<Map<string, RTCDataChannel>>(new Map());
  const [connectedPeers, setConnectedPeers] = useState<Set<string>>(new Set());
  const { sendMessage: sendWebSocketMessage, messages } = useWebSocket(userId);
  
  const localStreamRef = useRef<MediaStream | null>(null);

  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  const createPeerConnection = (peerId: string, isInitiator: boolean = false) => {
    const peerConnection = new RTCPeerConnection(configuration);
    
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendWebSocketMessage({
          type: 'ice-candidate',
          targetUserId: peerId,
          data: event.candidate
        });
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
      }
    };

    if (isInitiator) {
      // Create data channel for messaging
      const dataChannel = peerConnection.createDataChannel('messaging', {
        ordered: true
      });
      
      setupDataChannel(dataChannel, peerId);
      setDataChannels(prev => new Map(prev).set(peerId, dataChannel));
    } else {
      // Handle incoming data channel
      peerConnection.ondatachannel = (event) => {
        const dataChannel = event.channel;
        setupDataChannel(dataChannel, peerId);
        setDataChannels(prev => new Map(prev).set(peerId, dataChannel));
      };
    }

    setPeers(prev => new Map(prev).set(peerId, peerConnection));
    return peerConnection;
  };

  const setupDataChannel = (dataChannel: RTCDataChannel, peerId: string) => {
    dataChannel.onopen = () => {
      console.log(`Data channel opened with ${peerId}`);
    };
    
    dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        // Handle incoming P2P message
        console.log('Received P2P message:', message);
      } catch (error) {
        console.error('Failed to parse P2P message:', error);
      }
    };
    
    dataChannel.onclose = () => {
      console.log(`Data channel closed with ${peerId}`);
    };
  };

  const sendP2PMessage = (message: any) => {
    dataChannels.forEach((channel, peerId) => {
      if (channel.readyState === 'open') {
        channel.send(JSON.stringify(message));
      }
    });
  };

  const createOffer = async (peerId: string) => {
    const peerConnection = createPeerConnection(peerId, true);
    
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      sendWebSocketMessage({
        type: 'offer',
        targetUserId: peerId,
        data: offer
      });
    } catch (error) {
      console.error('Failed to create offer:', error);
    }
  };

  const handleOffer = async (fromUserId: string, offer: RTCSessionDescriptionInit) => {
    const peerConnection = createPeerConnection(fromUserId);
    
    try {
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      sendWebSocketMessage({
        type: 'answer',
        targetUserId: fromUserId,
        data: answer
      });
    } catch (error) {
      console.error('Failed to handle offer:', error);
    }
  };

  const handleAnswer = async (fromUserId: string, answer: RTCSessionDescriptionInit) => {
    const peerConnection = peers.get(fromUserId);
    if (peerConnection && peerConnection.signalingState === 'have-local-offer') {
      try {
        await peerConnection.setRemoteDescription(answer);
      } catch (error) {
        console.error('Failed to handle answer:', error, 'Signaling state:', peerConnection.signalingState);
      }
    }
  };

  const handleIceCandidate = async (fromUserId: string, candidate: RTCIceCandidateInit) => {
    const peerConnection = peers.get(fromUserId);
    if (peerConnection && peerConnection.remoteDescription) {
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch (error) {
        console.error('Failed to handle ICE candidate:', error);
      }
    }
  };

  const joinRoom = useCallback(() => {
    sendWebSocketMessage({
      type: 'join-room'
    });
  }, [sendWebSocketMessage]);

  // Handle WebSocket messages
  useEffect(() => {
    if (messages.length === 0) return;
    
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage) return;
    
    switch (latestMessage.type) {
      case 'offer':
        if (latestMessage.fromUserId && latestMessage.data && latestMessage.fromUserId !== userId) {
          handleOffer(latestMessage.fromUserId, latestMessage.data);
        }
        break;
      case 'answer':
        if (latestMessage.fromUserId && latestMessage.data && latestMessage.fromUserId !== userId) {
          handleAnswer(latestMessage.fromUserId, latestMessage.data);
        }
        break;
      case 'ice-candidate':
        if (latestMessage.fromUserId && latestMessage.data && latestMessage.fromUserId !== userId) {
          handleIceCandidate(latestMessage.fromUserId, latestMessage.data);
        }
        break;
      case 'user-joined':
        if (latestMessage.userId && latestMessage.userId !== userId) {
          setTimeout(() => createOffer(latestMessage.userId!), 1000);
        }
        break;
      case 'user-left':
        if (latestMessage.userId && latestMessage.userId !== userId) {
          const peerConnection = peers.get(latestMessage.userId);
          if (peerConnection) {
            peerConnection.close();
            setPeers(prev => {
              const newMap = new Map(prev);
              newMap.delete(latestMessage.userId!);
              return newMap;
            });
          }
        }
        break;
    }
  }, [messages.length, userId]);

  return {
    peers,
    dataChannels,
    connectedPeers,
    createOffer,
    sendP2PMessage,
    joinRoom,
  };
}
