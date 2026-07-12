import {
  getTopDivisions,
  getDivisionChildren,
  matchDivisionByNames,
  getDivisionPath,
} from '@/plugins/utils/area-code.js';

export const areaRepository = {
  async getProvinceList() {
    return getTopDivisions();
  },

  async getChildren(code: string) {
    return getDivisionChildren(code);
  },

  async resolveAreas(names: string[]) {
    return matchDivisionByNames(names);
  },

  async getDivisionPath(code: string) {
    return getDivisionPath(code);
  },
};
