// ====== 行政区划 ======
// ──────────────────────────────

export interface Division {
  code: string;
  name: string;
}

export interface ResolveAreaRequest {
  names: string[];
}
