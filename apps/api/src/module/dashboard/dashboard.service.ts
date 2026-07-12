import { dashboardRepository } from './dashboard.repository.js';
import type { DashboardStats } from '@dextea-admin/contracts';

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    return dashboardRepository.getStats();
  },
};
