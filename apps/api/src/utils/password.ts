import * as argon2 from 'argon2';

// 对明文密码进行 argon2 哈希加密
export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

// 校验明文密码与哈希值是否匹配
export function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return argon2.verify(hashed, password);
}
