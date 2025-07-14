export class EncryptionManager {
  private keyPair: CryptoKeyPair | null = null;
  private symmetricKey: CryptoKey | null = null;

  async initialize(): Promise<void> {
    await this.generateKeyPair();
    await this.generateSymmetricKey();
  }

  private async generateKeyPair(): Promise<void> {
    try {
      this.keyPair = await crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.error('Failed to generate key pair:', error);
      throw error;
    }
  }

  private async generateSymmetricKey(): Promise<void> {
    try {
      this.symmetricKey = await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256,
        },
        true,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.error('Failed to generate symmetric key:', error);
      throw error;
    }
  }

  async encryptMessage(message: string, recipientPublicKey?: CryptoKey): Promise<string> {
    if (!this.symmetricKey) {
      throw new Error('Encryption not initialized');
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        this.symmetricKey,
        data
      );

      const result = {
        encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
        iv: btoa(String.fromCharCode(...iv))
      };

      return JSON.stringify(result);
    } catch (error) {
      console.error('Encryption failed:', error);
      throw error;
    }
  }

  async decryptMessage(encryptedData: string): Promise<string> {
    if (!this.symmetricKey) {
      throw new Error('Encryption not initialized');
    }

    try {
      const { encrypted, iv } = JSON.parse(encryptedData);
      
      const encryptedBytes = new Uint8Array(
        atob(encrypted).split('').map(char => char.charCodeAt(0))
      );
      const ivBytes = new Uint8Array(
        atob(iv).split('').map(char => char.charCodeAt(0))
      );

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivBytes,
        },
        this.symmetricKey,
        encryptedBytes
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw error;
    }
  }

  async exportPublicKey(): Promise<string> {
    if (!this.keyPair) {
      throw new Error('Key pair not generated');
    }

    try {
      const exported = await crypto.subtle.exportKey('spki', this.keyPair.publicKey);
      return btoa(String.fromCharCode(...new Uint8Array(exported)));
    } catch (error) {
      console.error('Failed to export public key:', error);
      throw error;
    }
  }

  async importPublicKey(publicKeyString: string): Promise<CryptoKey> {
    try {
      const keyData = new Uint8Array(
        atob(publicKeyString).split('').map(char => char.charCodeAt(0))
      );

      return await crypto.subtle.importKey(
        'spki',
        keyData,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        true,
        ['encrypt']
      );
    } catch (error) {
      console.error('Failed to import public key:', error);
      throw error;
    }
  }

  async generateWalletAddress(): Promise<string> {
    // Simple mock wallet address generation
    const randomBytes = crypto.getRandomValues(new Uint8Array(20));
    return '0x' + Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async signMessage(message: string): Promise<string> {
    if (!this.keyPair) {
      throw new Error('Key pair not generated');
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      
      const signature = await crypto.subtle.sign(
        'RSA-PSS',
        this.keyPair.privateKey,
        data
      );

      return btoa(String.fromCharCode(...new Uint8Array(signature)));
    } catch (error) {
      console.error('Failed to sign message:', error);
      throw error;
    }
  }

  async verifySignature(message: string, signature: string, publicKey: CryptoKey): Promise<boolean> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      const signatureBytes = new Uint8Array(
        atob(signature).split('').map(char => char.charCodeAt(0))
      );

      return await crypto.subtle.verify(
        'RSA-PSS',
        publicKey,
        signatureBytes,
        data
      );
    } catch (error) {
      console.error('Failed to verify signature:', error);
      return false;
    }
  }

  getPublicKey(): CryptoKey | null {
    return this.keyPair?.publicKey || null;
  }
}
