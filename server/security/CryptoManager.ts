import { randomBytes, createCipheriv, createDecipheriv, createHash, createHmac, scryptSync, timingSafeEqual } from 'crypto';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
  keyDerivationSalt?: string;
}

export interface SecurityMetrics {
  encryptionLevel: 'low' | 'medium' | 'high' | 'military';
  keyStrength: number;
  lastKeyRotation: number;
  failedAttempts: number;
}

/**
 * Advanced cryptographic manager with AES-256-GCM encryption,
 * key derivation, digital signatures, and security monitoring
 */
export class CryptoManager {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly TAG_LENGTH = 16;
  private static readonly SALT_LENGTH = 32;

  private keyPairs = new Map<string, KeyPair>();
  private derivedKeys = new Map<string, Buffer>();
  private securityMetrics = new Map<string, SecurityMetrics>();
  private blacklistedKeys = new Set<string>();

  constructor() {
    this.initializeSecurityMetrics();
  }

  /**
   * Generate a new key pair for asymmetric encryption
   */
  generateKeyPair(nodeId: string): KeyPair {
    const { publicKey, privateKey } = require('crypto').generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    const keyPair = { publicKey, privateKey };
    this.keyPairs.set(nodeId, keyPair);
    this.updateSecurityMetrics(nodeId, 'high', 2048);
    
    return keyPair;
  }

  /**
   * Derive a symmetric key from a password using scrypt
   */
  deriveKey(password: string, salt?: Buffer): { key: Buffer, salt: Buffer } {
    const keySalt = salt || randomBytes(CryptoManager.SALT_LENGTH);
    const derivedKey = scryptSync(password, keySalt, CryptoManager.KEY_LENGTH);
    
    return { key: derivedKey, salt: keySalt };
  }

  /**
   * Encrypt data using AES-256-GCM with derived key
   */
  encrypt(data: string, password: string): EncryptedData {
    const { key, salt } = this.deriveKey(password);
    const iv = randomBytes(CryptoManager.IV_LENGTH);
    
    const cipher = createCipheriv(CryptoManager.ALGORITHM, key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      keyDerivationSalt: salt.toString('hex')
    };
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  decrypt(encryptedData: EncryptedData, password: string): string {
    if (!encryptedData.keyDerivationSalt) {
      throw new Error('Key derivation salt is required');
    }

    const salt = Buffer.from(encryptedData.keyDerivationSalt, 'hex');
    const { key } = this.deriveKey(password, salt);
    
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const tag = Buffer.from(encryptedData.tag, 'hex');
    
    const decipher = createDecipheriv(CryptoManager.ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Create digital signature for message authentication
   */
  sign(message: string, privateKey: string): string {
    const { sign } = require('crypto');
    const signature = sign('sha256', Buffer.from(message))
      .update(message)
      .sign(privateKey, 'hex');
    
    return signature;
  }

  /**
   * Verify digital signature
   */
  verify(message: string, signature: string, publicKey: string): boolean {
    try {
      const { verify } = require('crypto');
      const isValid = verify('sha256', Buffer.from(message))
        .update(message)
        .verify(publicKey, signature, 'hex');
      
      return isValid;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Generate secure hash of data
   */
  hash(data: string, algorithm: string = 'sha256'): string {
    return createHash(algorithm).update(data).digest('hex');
  }

  /**
   * Generate HMAC for message integrity
   */
  generateHMAC(message: string, key: string): string {
    return createHmac('sha256', key).update(message).digest('hex');
  }

  /**
   * Verify HMAC
   */
  verifyHMAC(message: string, hmac: string, key: string): boolean {
    const computedHMAC = this.generateHMAC(message, key);
    return timingSafeEqual(Buffer.from(hmac), Buffer.from(computedHMAC));
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  /**
   * Validate key strength
   */
  validateKeyStrength(key: string): boolean {
    if (key.length < 32) return false;
    if (!/[A-Z]/.test(key)) return false;
    if (!/[a-z]/.test(key)) return false;
    if (!/[0-9]/.test(key)) return false;
    if (!/[^A-Za-z0-9]/.test(key)) return false;
    
    return true;
  }

  /**
   * Rotate encryption keys for a node
   */
  rotateKeys(nodeId: string): KeyPair {
    const oldKeyPair = this.keyPairs.get(nodeId);
    if (oldKeyPair) {
      this.blacklistedKeys.add(oldKeyPair.publicKey);
    }
    
    const newKeyPair = this.generateKeyPair(nodeId);
    this.updateSecurityMetrics(nodeId, 'high', 2048);
    
    return newKeyPair;
  }

  /**
   * Check if a key is blacklisted
   */
  isKeyBlacklisted(key: string): boolean {
    return this.blacklistedKeys.has(key);
  }

  /**
   * Generate wallet address from public key
   */
  generateWalletAddress(publicKey: string): string {
    const hash = createHash('sha256').update(publicKey).digest();
    const address = hash.subarray(0, 20).toString('hex');
    return `0x${address}`;
  }

  /**
   * Encrypt file content in chunks
   */
  encryptFile(fileContent: Buffer, password: string, chunkSize: number = 64 * 1024): EncryptedData[] {
    const chunks: EncryptedData[] = [];
    
    for (let i = 0; i < fileContent.length; i += chunkSize) {
      const chunk = fileContent.subarray(i, i + chunkSize);
      const encryptedChunk = this.encrypt(chunk.toString('base64'), password);
      chunks.push(encryptedChunk);
    }
    
    return chunks;
  }

  /**
   * Decrypt file content from chunks
   */
  decryptFile(encryptedChunks: EncryptedData[], password: string): Buffer {
    const decryptedChunks: Buffer[] = [];
    
    for (const chunk of encryptedChunks) {
      const decryptedChunk = this.decrypt(chunk, password);
      decryptedChunks.push(Buffer.from(decryptedChunk, 'base64'));
    }
    
    return Buffer.concat(decryptedChunks);
  }

  /**
   * Initialize security metrics for monitoring
   */
  private initializeSecurityMetrics(): void {
    // Initialize with default metrics
  }

  /**
   * Update security metrics for a node
   */
  private updateSecurityMetrics(nodeId: string, level: SecurityMetrics['encryptionLevel'], keyStrength: number): void {
    const metrics: SecurityMetrics = {
      encryptionLevel: level,
      keyStrength,
      lastKeyRotation: Date.now(),
      failedAttempts: 0
    };
    
    this.securityMetrics.set(nodeId, metrics);
  }

  /**
   * Get security metrics for a node
   */
  getSecurityMetrics(nodeId: string): SecurityMetrics | undefined {
    return this.securityMetrics.get(nodeId);
  }

  /**
   * Record failed authentication attempt
   */
  recordFailedAttempt(nodeId: string): void {
    const metrics = this.securityMetrics.get(nodeId);
    if (metrics) {
      metrics.failedAttempts++;
      this.securityMetrics.set(nodeId, metrics);
    }
  }

  /**
   * Check if node is under security threat
   */
  isUnderThreat(nodeId: string): boolean {
    const metrics = this.securityMetrics.get(nodeId);
    if (!metrics) return false;
    
    const timeSinceLastRotation = Date.now() - metrics.lastKeyRotation;
    const rotationThreshold = 24 * 60 * 60 * 1000; // 24 hours
    
    return metrics.failedAttempts > 5 || timeSinceLastRotation > rotationThreshold;
  }

  /**
   * Get overall security health
   */
  getSecurityHealth(): {
    totalNodes: number;
    secureNodes: number;
    vulnerableNodes: number;
    blacklistedKeys: number;
  } {
    let secureNodes = 0;
    let vulnerableNodes = 0;
    
    this.securityMetrics.forEach((metrics) => {
      if (metrics.encryptionLevel === 'high' || metrics.encryptionLevel === 'military') {
        secureNodes++;
      } else {
        vulnerableNodes++;
      }
    });
    
    return {
      totalNodes: this.securityMetrics.size,
      secureNodes,
      vulnerableNodes,
      blacklistedKeys: this.blacklistedKeys.size
    };
  }

  /**
   * Clear sensitive data from memory
   */
  destroy(): void {
    this.keyPairs.clear();
    this.derivedKeys.clear();
    this.securityMetrics.clear();
    this.blacklistedKeys.clear();
  }
}