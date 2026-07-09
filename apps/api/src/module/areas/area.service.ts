import { BizError } from '@/common/exceptions/index.js';
import { AreaErrorCodes } from './area.errorcode.js';
import { areaRepository } from './area.repository.js';

export const areaService = {
  async getProvinceList() {
    try {
      return areaRepository.getProvinceList();
    } catch (error) {
      throw new BizError(AreaErrorCodes.PROVINCES_FAILED);
    }
  },

  async getChildren(code: string) {
    if (!code.trim()) {
      throw new BizError(AreaErrorCodes.INVALID_AREA_CODE);
    }
    try {
      return areaRepository.getChildren(code);
    } catch (error) {
      throw new BizError(AreaErrorCodes.CHILDREN_FAILED);
    }
  },

  async resolveAreas(names: string[]) {
    if (!Array.isArray(names) || names.length === 0) {
      throw new BizError(AreaErrorCodes.RESOLVE_FAILED);
    }
    try {
      return areaRepository.resolveAreas(names);
    } catch (error) {
      throw new BizError(AreaErrorCodes.RESOLVE_FAILED);
    }
  },
};
