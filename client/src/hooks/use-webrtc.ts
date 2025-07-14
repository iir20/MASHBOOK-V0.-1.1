import { useEffect, useRef, useState } from 'react';
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
    if (peerConnection) {
      try {
        await peerConnection.setRemoteDescription(answer);
      } catch (error) {
        console.error('Failed to handle answer:', error);
      }
    }
  };

  const handleIceCandidate = async (fromUserId: string, candidate: RTCIceCandidateInit) => {
    const peerConnection = peers.get(fromUserId);
    if (peerConnection) {
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch (error) {
        console.error('Failed to handle ICE candidate:', error);
      }
    }
  };

  const joinRoom = () => {
    sendWebSocketMessage({
      type: 'join-room'
    });
  };

  // Handle WebSocket messages
  useEffect(() => {
    messages.forEach((message: WebRTCSignal) => {
      switch (message.type) {
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
        case 'user-joined':
          if (message.userId) {
            createOffer(message.userId);
          }
          break;
        case 'user-left':
          if (message.userId) {
            const peerConnection = peers.get(message.userId);
            if (peerConnection) {
              peerConnection.close();
              setPeers(prev => {
                const newMap = new Map(prev);
                newMap.delete(message.userId!);
                return newMap;
              });
            }
          }
          break;
      }
    });
  }, [messages]);

  return {
    peers,
    dataChannels,
    connectedPeers,
    createOffer,
    sendP2PMessage,
    joinRoom,
  };
}
