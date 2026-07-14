import {
  getTopDivisions,
  getDivisionChildren,
  namesToCode,
  getDivisionPath,
} from '@/utils';

export const areaRepository = {
  async getProvinceList() {
    return getTopDivisions();
  },

  async getChildren(code: string) {
    return getDivisionChildren(code);
  },

  async resolveAreas(names: string[]) {
    const code = namesToCode(names[0], names[1], names[2]);
    return code ? getDivisionPath(code) : [];
  },

  async getDivisionPath(code: string) {
    return getDivisionPath(code);
  },
};
