import { config } from '@/config/index.js';

export const configRepository = {
  async getAmapConfig() {
    return {
      key: config.amapJsKey,
      securityCode: config.amapJsSecurityCode,
    };
  },
};
