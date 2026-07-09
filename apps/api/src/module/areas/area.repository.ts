import {
  getTopDivisions,
  getDivisionChildren,
  matchDivisionByNames,
} from '@aurouscia/china-areas/dist/index.js';

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
};
