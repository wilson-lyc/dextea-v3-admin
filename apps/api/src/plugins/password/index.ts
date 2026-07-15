import * as argon2 from 'argon2';

/**
 * 密码哈希能力（扩展点）。
 *
 * 当前实现基于 argon2。该能力未来可能更换算法策略（bcrypt / scrypt 等），
 * 只需提供一个新的 PasswordHasher 实现，再替换下方 `passwordHasher` 单例即可，
 * 调用方无需改动。
 */
export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, hashed: string): Promise<boolean>;
}

/** 基于 argon2 的密码哈希实现 */
class Argon2PasswordHasher implements PasswordHasher {
  hash(password: string): Promise<string> {
    return argon2.hash(password);
  }

  verify(password: string, hashed: string): Promise<boolean> {
    return argon2.verify(hashed, password);
  }
}

/** 当前启用的密码哈希实现（默认 argon2）。换算法时替换此单例即可。 */
export const passwordHasher: PasswordHasher = new Argon2PasswordHasher();

export function hashPassword(password: string): Promise<string> {
  return passwordHasher.hash(password);
}

export function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return passwordHasher.verify(password, hashed);
}
