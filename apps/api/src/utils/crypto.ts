import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { config } from '@/config';

/**
 * secretKey 加密工具（AES-256-GCM）。
 * 存储位置的私密密钥落库前加密，构造适配器 / 测试连接时解密。
 * 加密结果带 `enc:v1:` 前缀；无此前缀的存量数据按明文兼容返回。
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const PREFIX = 'enc:v1:';
const SALT = 'dextea-storage-salt';

// 生产环境务必通过环境变量 STORAGE_ENCRYPTION_KEY 配置独立密钥；
// 缺失时使用固定开发密钥并告警（仅用于本地调试，重启后仍可解密历史数据）。
const DEV_FALLBACK = 'dev-only-insecure-storage-key-change-me-please';
let warned = false;

function getKey(): Buffer {
  const passphrase = config.storageEncryptionKey || DEV_FALLBACK;
  if (!config.storageEncryptionKey && !warned) {
    console.warn(
      '[crypto] 未配置 STORAGE_ENCRYPTION_KEY，使用不安全默认密钥。生产环境请配置独立密钥。',
    );
    warned = true;
  }
  return scryptSync(passphrase, SALT, 32);
}

/** 加密明文，返回带前缀的 base64 密文 */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf-8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

/** 解密密文；无前缀的存量明文直接原样返回 */
export function decryptSecret(payload: string): string {
  if (!payload.startsWith(PREFIX)) return payload;
  const raw = Buffer.from(payload.slice(PREFIX.length), 'base64');
  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf-8');
}
