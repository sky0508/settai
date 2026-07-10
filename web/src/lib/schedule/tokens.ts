import { randomBytes } from 'crypto';

// URL-safe な乱数トークン。adminToken/editToken は唯一の認可ゲートなので
// 十分に長く・推測不能にする。参加者やメールには adminToken を絶対露出しない。
export function newToken(bytes = 16): string {
  return randomBytes(bytes).toString('base64url');
}
