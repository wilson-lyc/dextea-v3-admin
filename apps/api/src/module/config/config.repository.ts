import { config } from '@/config.js';

export const configRepository = {
  async getAmapConfig() {
    return {
      key: config.amap.jsKey,
      securityCode: config.amap.jsSecurityCode,
    };
  },
};
