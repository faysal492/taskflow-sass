import * as bcrypt from 'bcrypt';

export class HashUtil {
  private static readonly SALT_ROUNDS = 10;

  static async hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, this.SALT_ROUNDS);
  }

  static async compare(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }

  static async generateRandomToken(length: number = 32): Promise<string> {
    const crypto = await import('crypto');
    return crypto.randomBytes(length).toString('hex');
  }
}