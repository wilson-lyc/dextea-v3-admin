declare module '@aurouscia/china-areas/dist/index.js' {
  export interface Division {
    code: string;
    name: string;
  }

  export interface DivisionWithChildren extends Division {
    children?: DivisionWithChildren[];
  }

  export declare function getDivisionChildren(code: string, strict?: boolean): Division[];
  export declare function getDivisionParent(code: string, strict?: boolean): Division | undefined;
  export declare function getTopDivisions(): Division[];
  export declare function isExistingCode(code: string): boolean;
  export declare function isFinalDivision(code: string): boolean;
  export declare function matchDivisionByCode(code: string, strict?: boolean): Division[];
  export declare function matchDivisionByNames(names: string[], strict?: boolean): Division[];

  declare const areas: Division[];
  export default areas;
}
