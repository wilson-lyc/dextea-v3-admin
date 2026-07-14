import { config } from '@/config.js';

export const configRepository = {
  async getAmapConfig() {
    return {
      key: config.amapJsKey,
      securityCode: config.amapJsSecurityCode,
    };
  },
};
