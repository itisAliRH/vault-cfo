/** Simli face IDs for Agent Meeting avatars */
export const SIMLI_FACE_IDS = {
  tina: "cace3ef7-a4c4-425d-a8cf-a5358eb0c427",
  hank: "dd10cb5a-d31d-4f12-b69f-6db3383c006e",
} as const;

export type SimliFaceId = (typeof SIMLI_FACE_IDS)[keyof typeof SIMLI_FACE_IDS];

export const SIMLI_FACE_LABELS: Record<keyof typeof SIMLI_FACE_IDS, string> = {
  tina: "Tina",
  hank: "Hank",
};
