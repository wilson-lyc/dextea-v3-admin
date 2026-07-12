import {
  getTopDivisions,
  getDivisionChildren,
  matchDivisionByNames,
} from '@aurouscia/china-areas/dist/index.js';
import { getDivisionPath as getDivisionPathUtil } from '@/plugins/utils/division.js';

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
    return getDivisionPathUtil(code);
  },
};
