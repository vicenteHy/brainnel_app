import AsyncStorage from '@react-native-async-storage/async-storage';

interface VerificationAttempt {
  timestamp: number;
  phoneNumber: string;
}

interface PhoneCooldown {
  phoneNumber: string;
  lastAttempt: number;
}

class VerificationLimiter {
  private static readonly STORAGE_KEY_ATTEMPTS = '@verification_attempts';
  private static readonly STORAGE_KEY_COOLDOWNS = '@phone_cooldowns';
  
  // 限制配置
  private static readonly HOURLY_LIMIT = 5;          // 每小时最多5次
  private static readonly DAILY_LIMIT = 10;          // 每天最多10次
  private static readonly BASE_COOLDOWN = 60 * 1000; // 固定冷却60秒

  /**
   * 检查是否可以发送验证码
   */
  static async canSendVerification(phoneNumber: string): Promise<{
    allowed: boolean;
    reason?: string;
    waitTime?: number;
  }> {
    try {
      const now = Date.now();
      
      // 检查单个手机号冷却时间
      const cooldownCheck = await this.checkPhoneCooldown(phoneNumber, now);
      if (!cooldownCheck.allowed) {
        return cooldownCheck;
      }

      // 检查小时和日限制
      const limitCheck = await this.checkTimeLimits(now);
      if (!limitCheck.allowed) {
        return limitCheck;
      }

      return { allowed: true };
    } catch (error) {
      console.error('检查验证码发送限制失败:', error);
      return { allowed: true }; // 出错时允许发送，避免影响用户体验
    }
  }

  /**
   * 记录验证码发送尝试
   */
  static async recordAttempt(phoneNumber: string): Promise<void> {
    try {
      const now = Date.now();
      
      // 记录发送尝试
      await this.addAttemptRecord(phoneNumber, now);
      
      // 更新手机号冷却状态
      await this.updatePhoneCooldown(phoneNumber, now);
      
      // 清理过期记录
      await this.cleanupExpiredRecords(now);
    } catch (error) {
      console.error('记录验证码尝试失败:', error);
    }
  }

  /**
   * 获取剩余发送次数信息
   */
  static async getRemainingAttempts(): Promise<{
    hourlyRemaining: number;
    dailyRemaining: number;
  }> {
    try {
      const now = Date.now();
      const attempts = await this.getStoredAttempts();
      
      const oneHourAgo = now - (60 * 60 * 1000);
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      
      const hourlyCount = attempts.filter(a => a.timestamp > oneHourAgo).length;
      const dailyCount = attempts.filter(a => a.timestamp > oneDayAgo).length;
      
      return {
        hourlyRemaining: Math.max(0, this.HOURLY_LIMIT - hourlyCount),
        dailyRemaining: Math.max(0, this.DAILY_LIMIT - dailyCount)
      };
    } catch (error) {
      console.error('获取剩余次数失败:', error);
      return {
        hourlyRemaining: this.HOURLY_LIMIT,
        dailyRemaining: this.DAILY_LIMIT
      };
    }
  }

  /**
   * 检查手机号冷却时间
   */
  private static async checkPhoneCooldown(phoneNumber: string, now: number): Promise<{
    allowed: boolean;
    reason?: string;
    waitTime?: number;
  }> {
    const cooldowns = await this.getStoredCooldowns();
    const phoneCooldown = cooldowns.find(c => c.phoneNumber === phoneNumber);
    
    if (phoneCooldown) {
      const nextAllowedTime = phoneCooldown.lastAttempt + this.BASE_COOLDOWN;
      if (now < nextAllowedTime) {
        const waitTime = Math.ceil((nextAllowedTime - now) / 1000);
        return {
          allowed: false,
          reason: `请等待 ${waitTime} 秒后再试`,
          waitTime
        };
      }
    }
    
    return { allowed: true };
  }

  /**
   * 检查时间限制
   */
  private static async checkTimeLimits(now: number): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const attempts = await this.getStoredAttempts();
    
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    const hourlyCount = attempts.filter(a => a.timestamp > oneHourAgo).length;
    const dailyCount = attempts.filter(a => a.timestamp > oneDayAgo).length;
    
    if (hourlyCount >= this.HOURLY_LIMIT) {
      return {
        allowed: false,
        reason: `每小时最多发送 ${this.HOURLY_LIMIT} 次验证码，请稍后再试`
      };
    }
    
    if (dailyCount >= this.DAILY_LIMIT) {
      return {
        allowed: false,
        reason: `今日验证码发送次数已达上限（${this.DAILY_LIMIT}次），请明天再试`
      };
    }
    
    return { allowed: true };
  }

  /**
   * 添加尝试记录
   */
  private static async addAttemptRecord(phoneNumber: string, timestamp: number): Promise<void> {
    const attempts = await this.getStoredAttempts();
    attempts.push({ phoneNumber, timestamp });
    await AsyncStorage.setItem(this.STORAGE_KEY_ATTEMPTS, JSON.stringify(attempts));
  }

  /**
   * 更新手机号冷却状态
   */
  private static async updatePhoneCooldown(phoneNumber: string, now: number): Promise<void> {
    const cooldowns = await this.getStoredCooldowns();
    let phoneCooldown = cooldowns.find(c => c.phoneNumber === phoneNumber);
    
    if (!phoneCooldown) {
      phoneCooldown = {
        phoneNumber,
        lastAttempt: now
      };
      cooldowns.push(phoneCooldown);
    } else {
      phoneCooldown.lastAttempt = now;
    }
    
    await AsyncStorage.setItem(this.STORAGE_KEY_COOLDOWNS, JSON.stringify(cooldowns));
    console.log(`📱 [${phoneNumber}] 记录发送时间，下次可发送时间: ${new Date(now + this.BASE_COOLDOWN).toLocaleTimeString()}`);
  }

  /**
   * 获取存储的尝试记录
   */
  private static async getStoredAttempts(): Promise<VerificationAttempt[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY_ATTEMPTS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('获取尝试记录失败:', error);
      return [];
    }
  }

  /**
   * 获取存储的冷却记录
   */
  private static async getStoredCooldowns(): Promise<PhoneCooldown[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY_COOLDOWNS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('获取冷却记录失败:', error);
      return [];
    }
  }

  /**
   * 清理过期记录
   */
  private static async cleanupExpiredRecords(now: number): Promise<void> {
    try {
      // 清理超过24小时的尝试记录
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      const attempts = await this.getStoredAttempts();
      const validAttempts = attempts.filter(a => a.timestamp > oneDayAgo);
      await AsyncStorage.setItem(this.STORAGE_KEY_ATTEMPTS, JSON.stringify(validAttempts));
      
      // 清理超过24小时的冷却记录
      const cooldowns = await this.getStoredCooldowns();
      const validCooldowns = cooldowns.filter(c => c.lastAttempt > oneDayAgo);
      await AsyncStorage.setItem(this.STORAGE_KEY_COOLDOWNS, JSON.stringify(validCooldowns));
    } catch (error) {
      console.error('清理过期记录失败:', error);
    }
  }

  /**
   * 清除所有限制记录（用于测试或重置）
   */
  static async clearAllLimits(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY_ATTEMPTS);
      await AsyncStorage.removeItem(this.STORAGE_KEY_COOLDOWNS);
      console.log('✅ 已清除所有验证码发送限制记录');
    } catch (error) {
      console.error('清除限制记录失败:', error);
    }
  }

  /**
   * 获取调试信息
   */
  static async getDebugInfo(): Promise<any> {
    try {
      const attempts = await this.getStoredAttempts();
      const cooldowns = await this.getStoredCooldowns();
      return {
        attempts,
        cooldowns,
        remaining: await this.getRemainingAttempts()
      };
    } catch (error) {
      console.error('获取调试信息失败:', error);
      return null;
    }
  }
}

export default VerificationLimiter;