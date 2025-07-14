import { useEffect, useState } from 'react';

export function useEncryption() {
  const [keyPair, setKeyPair] = useState<CryptoKeyPair | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    generateKeyPair();
  }, []);

  const generateKeyPair = async () => {
    try {
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
      );
      
      setKeyPair(keyPair);
      setIsReady(true);
    } catch (error) {
      console.error('Failed to generate key pair:', error);
    }
  };

  const encryptMessage = async (message: string, publicKey?: CryptoKey): Promise<string> => {
    if (!keyPair && !publicKey) {
      throw new Error('No key pair available');
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      
      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'RSA-OAEP',
        },
        publicKey || keyPair!.publicKey,
        data
      );
      
      return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw error;
    }
  };

  const decryptMessage = async (encryptedMessage: string): Promise<string> => {
    if (!keyPair) {
      throw new Error('No key pair available');
    }

    try {
      const encryptedData = new Uint8Array(
        atob(encryptedMessage).split('').map(char => char.charCodeAt(0))
      );
      
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'RSA-OAEP',
        },
        keyPair.privateKey,
        encryptedData
      );
      
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw error;
    }
  };

  const exportPublicKey = async (): Promise<string> => {
    if (!keyPair) {
      throw new Error('No key pair available');
    }

    try {
      const exported = await crypto.subtle.exportKey('spki', keyPair.publicKey);
      return btoa(String.fromCharCode(...new Uint8Array(exported)));
    } catch (error) {
      console.error('Failed to export public key:', error);
      throw error;
    }
  };

  const importPublicKey = async (publicKeyString: string): Promise<CryptoKey> => {
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
  };

  const generateAESKey = async (): Promise<CryptoKey> => {
    return await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
  };

  const encryptWithAES = async (message: string, key: CryptoKey): Promise<{ encrypted: string; iv: string }> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      data
    );
    
    return {
      encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      iv: btoa(String.fromCharCode(...iv))
    };
  };

  const decryptWithAES = async (encryptedMessage: string, iv: string, key: CryptoKey): Promise<string> => {
    const encryptedData = new Uint8Array(
      atob(encryptedMessage).split('').map(char => char.charCodeAt(0))
    );
    const ivData = new Uint8Array(
      atob(iv).split('').map(char => char.charCodeAt(0))
    );
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivData,
      },
      key,
      encryptedData
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  };

  return {
    keyPair,
    isReady,
    encryptMessage,
    decryptMessage,
    exportPublicKey,
    importPublicKey,
    generateAESKey,
    encryptWithAES,
    decryptWithAES,
  };
}
