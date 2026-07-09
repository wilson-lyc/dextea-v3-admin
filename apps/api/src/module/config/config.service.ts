import { configRepository } from './config.repository.js';

export const configService = {
  async getAmapConfig() {
    return configRepository.getAmapConfig();
  },
};
