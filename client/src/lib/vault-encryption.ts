/**
 * Advanced Vault Encryption System
 * Implements military-grade encryption for secure file storage
 */

// Encryption constants
const ENCRYPTION_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;

export interface EncryptedFile {
  id: string;
  name: string;
  encryptedData: ArrayBuffer;
  iv: Uint8Array;
  salt: Uint8Array;
  tag: Uint8Array;
  size: number;
  type: string;
  timestamp: number;
  checksum: string;
}

export interface VaultKey {
  keyData: CryptoKey;
  salt: Uint8Array;
  derivedAt: number;
}

class VaultEncryption {
  private masterKey: CryptoKey | null = null;
  private keyCache: Map<string, VaultKey> = new Map();

  // Generate cryptographically secure random bytes
  private generateSecureRandom(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  // Generate master key from password using PBKDF2
  async generateMasterKey(password: string, salt?: Uint8Array): Promise<VaultKey> {
    if (!salt) {
      salt = this.generateSecureRandom(SALT_LENGTH);
    }

    // Import password as raw key material
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive AES key using PBKDF2
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      passwordKey,
      {
        name: ENCRYPTION_ALGORITHM,
        length: KEY_LENGTH
      },
      false,
      ['encrypt', 'decrypt']
    );

    const vaultKey: VaultKey = {
      keyData: derivedKey,
      salt: salt,
      derivedAt: Date.now()
    };

    // Cache the key
    const keyId = await this.generateKeyId(password, salt);
    this.keyCache.set(keyId, vaultKey);

    return vaultKey;
  }

  // Generate unique key ID from password and salt
  private async generateKeyId(password: string, salt: Uint8Array): Promise<string> {
    const combined = new Uint8Array(password.length + salt.length);
    combined.set(new TextEncoder().encode(password));
    combined.set(salt, password.length);
    
    const hash = await crypto.subtle.digest('SHA-256', combined);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Calculate file checksum for integrity verification
  private async calculateChecksum(data: ArrayBuffer): Promise<string> {
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Encrypt file with AES-GCM
  async encryptFile(file: File, password: string): Promise<EncryptedFile> {
    try {
      // Generate vault key
      const vaultKey = await this.generateMasterKey(password);
      
      // Read file data
      const fileData = await file.arrayBuffer();
      
      // Generate IV for this encryption
      const iv = this.generateSecureRandom(IV_LENGTH);
      
      // Calculate checksum before encryption
      const checksum = await this.calculateChecksum(fileData);
      
      // Encrypt the file data
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: ENCRYPTION_ALGORITHM,
          iv: iv
        },
        vaultKey.keyData,
        fileData
      );

      // Extract the tag (last 16 bytes)
      const encryptedData = encryptedBuffer.slice(0, -TAG_LENGTH);
      const tag = new Uint8Array(encryptedBuffer.slice(-TAG_LENGTH));

      const encryptedFile: EncryptedFile = {
        id: crypto.randomUUID(),
        name: file.name,
        encryptedData,
        iv,
        salt: vaultKey.salt,
        tag,
        size: file.size,
        type: file.type,
        timestamp: Date.now(),
        checksum
      };

      return encryptedFile;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt file: ' + (error as Error).message);
    }
  }

  // Decrypt file with AES-GCM
  async decryptFile(encryptedFile: EncryptedFile, password: string): Promise<File> {
    try {
      // Regenerate vault key using stored salt
      const vaultKey = await this.generateMasterKey(password, encryptedFile.salt);
      
      // Reconstruct full encrypted buffer with tag
      const fullEncryptedData = new Uint8Array(encryptedFile.encryptedData.byteLength + encryptedFile.tag.length);
      fullEncryptedData.set(new Uint8Array(encryptedFile.encryptedData));
      fullEncryptedData.set(encryptedFile.tag, encryptedFile.encryptedData.byteLength);
      
      // Decrypt the data
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: ENCRYPTION_ALGORITHM,
          iv: encryptedFile.iv
        },
        vaultKey.keyData,
        fullEncryptedData
      );

      // Verify file integrity
      const calculatedChecksum = await this.calculateChecksum(decryptedData);
      if (calculatedChecksum !== encryptedFile.checksum) {
        throw new Error('File integrity check failed - data may be corrupted');
      }

      // Create and return decrypted file
      const decryptedFile = new File([decryptedData], encryptedFile.name, {
        type: encryptedFile.type,
        lastModified: encryptedFile.timestamp
      });

      return decryptedFile;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt file: ' + (error as Error).message);
    }
  }

  // Verify password without full decryption
  async verifyPassword(password: string, salt: Uint8Array, testData: ArrayBuffer, iv: Uint8Array): Promise<boolean> {
    try {
      const vaultKey = await this.generateMasterKey(password, salt);
      await crypto.subtle.decrypt(
        {
          name: ENCRYPTION_ALGORITHM,
          iv: iv
        },
        vaultKey.keyData,
        testData
      );
      return true;
    } catch {
      return false;
    }
  }

  // Generate secure vault password
  generateSecurePassword(length: number = 32): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const randomBytes = this.generateSecureRandom(length);
    return Array.from(randomBytes)
      .map(byte => charset[byte % charset.length])
      .join('');
  }

  // Export encrypted file for storage
  exportEncryptedFile(encryptedFile: EncryptedFile): string {
    const exportData = {
      id: encryptedFile.id,
      name: encryptedFile.name,
      encryptedData: Array.from(new Uint8Array(encryptedFile.encryptedData)),
      iv: Array.from(encryptedFile.iv),
      salt: Array.from(encryptedFile.salt),
      tag: Array.from(encryptedFile.tag),
      size: encryptedFile.size,
      type: encryptedFile.type,
      timestamp: encryptedFile.timestamp,
      checksum: encryptedFile.checksum
    };
    
    return JSON.stringify(exportData);
  }

  // Import encrypted file from storage
  importEncryptedFile(exportedData: string): EncryptedFile {
    const data = JSON.parse(exportedData);
    
    return {
      id: data.id,
      name: data.name,
      encryptedData: new Uint8Array(data.encryptedData).buffer,
      iv: new Uint8Array(data.iv),
      salt: new Uint8Array(data.salt),
      tag: new Uint8Array(data.tag),
      size: data.size,
      type: data.type,
      timestamp: data.timestamp,
      checksum: data.checksum
    };
  }

  // Clear sensitive data from memory
  clearCache(): void {
    this.keyCache.clear();
    this.masterKey = null;
  }

  // Get encryption info
  getEncryptionInfo(): {
    algorithm: string;
    keyLength: number;
    iterations: number;
    securityLevel: string;
  } {
    return {
      algorithm: ENCRYPTION_ALGORITHM,
      keyLength: KEY_LENGTH,
      iterations: PBKDF2_ITERATIONS,
      securityLevel: 'Military Grade (AES-256-GCM + PBKDF2)'
    };
  }
}

// Export singleton instance
export const vaultEncryption = new VaultEncryption();