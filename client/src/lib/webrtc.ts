export class WebRTCManager {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private configuration: RTCConfiguration;

  constructor() {
    this.configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };
  }

  createPeerConnection(peerId: string): RTCPeerConnection {
    const peerConnection = new RTCPeerConnection(this.configuration);
    
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to peer via signaling server
        this.sendSignalingMessage(peerId, {
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state with ${peerId}: ${peerConnection.connectionState}`);
    };

    this.peerConnections.set(peerId, peerConnection);
    return peerConnection;
  }

  async createOffer(peerId: string): Promise<RTCSessionDescriptionInit> {
    const peerConnection = this.createPeerConnection(peerId);
    
    // Create data channel
    const dataChannel = peerConnection.createDataChannel('messaging');
    this.setupDataChannel(dataChannel, peerId);
    this.dataChannels.set(peerId, dataChannel);

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    return offer;
  }

  async createAnswer(peerId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const peerConnection = this.createPeerConnection(peerId);
    
    // Handle incoming data channel
    peerConnection.ondatachannel = (event) => {
      const dataChannel = event.channel;
      this.setupDataChannel(dataChannel, peerId);
      this.dataChannels.set(peerId, dataChannel);
    };

    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    
    return answer;
  }

  async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peerConnection = this.peerConnections.get(peerId);
    if (peerConnection) {
      await peerConnection.setRemoteDescription(answer);
    }
  }

  async handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peerConnection = this.peerConnections.get(peerId);
    if (peerConnection) {
      await peerConnection.addIceCandidate(candidate);
    }
  }

  private setupDataChannel(dataChannel: RTCDataChannel, peerId: string): void {
    dataChannel.onopen = () => {
      console.log(`Data channel opened with ${peerId}`);
    };

    dataChannel.onmessage = (event) => {
      console.log(`Message from ${peerId}:`, event.data);
      // Handle incoming message
      this.onMessage?.(peerId, event.data);
    };

    dataChannel.onclose = () => {
      console.log(`Data channel closed with ${peerId}`);
    };
  }

  sendMessage(peerId: string, message: string): void {
    const dataChannel = this.dataChannels.get(peerId);
    if (dataChannel && dataChannel.readyState === 'open') {
      dataChannel.send(message);
    } else {
      console.warn(`Cannot send message to ${peerId}: data channel not open`);
    }
  }

  broadcastMessage(message: string): void {
    this.dataChannels.forEach((dataChannel, peerId) => {
      if (dataChannel.readyState === 'open') {
        dataChannel.send(message);
      }
    });
  }

  closePeerConnection(peerId: string): void {
    const peerConnection = this.peerConnections.get(peerId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(peerId);
    }
    
    const dataChannel = this.dataChannels.get(peerId);
    if (dataChannel) {
      dataChannel.close();
      this.dataChannels.delete(peerId);
    }
  }

  private sendSignalingMessage(peerId: string, message: any): void {
    // This would send message via WebSocket signaling server
    console.log('Sending signaling message to', peerId, message);
  }

  // Callback for incoming messages
  onMessage?: (peerId: string, message: string) => void;

  getConnectedPeers(): string[] {
    return Array.from(this.peerConnections.keys()).filter(peerId => {
      const pc = this.peerConnections.get(peerId);
      return pc?.connectionState === 'connected';
    });
  }
}
