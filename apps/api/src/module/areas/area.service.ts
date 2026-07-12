import { BizError } from '@/common/exceptions/index.js';
import { AreaErrorCodes } from './area.errorcode.js';
import { areaRepository } from './area.repository.js';
import type { ResolveAreaRequest } from '@dextea-admin/contracts';

export const areaService = {
  async getProvinceList() {
    return areaRepository.getProvinceList();
  },

  async getChildren(code: string) {
    if (!code.trim()) {
      throw new BizError(AreaErrorCodes.INVALID_AREA_CODE);
    }
    return areaRepository.getChildren(code);
  },

  async resolveAreas(names: ResolveAreaRequest['names']) {
    return areaRepository.resolveAreas(names);
  },

  async getDivisionPath(code: string) {
    if (!code.trim()) {
      throw new BizError(AreaErrorCodes.INVALID_AREA_CODE);
    }
    return areaRepository.getDivisionPath(code);
  },
};
