/** Built-in page covers. Stored as a key so backups stay small and themes stay consistent. */
export const COVER_PRESETS = {
  mint: "linear-gradient(135deg, #187e5e 0%, #4fd8a5 100%)",
  violet: "linear-gradient(135deg, #5a46d6 0%, #8b7ff0 100%)",
  gold: "linear-gradient(135deg, #9c6b23 0%, #d9ae68 100%)",
  dusk: "linear-gradient(135deg, #5a46d6 0%, #d9ae68 100%)",
  ocean: "linear-gradient(135deg, #187e5e 0%, #5a46d6 100%)",
  slate: "linear-gradient(135deg, #1b1d30 0%, #4a4d6b 100%)",
} as const;

export type CoverKey = keyof typeof COVER_PRESETS;

export const COVER_KEYS = Object.keys(COVER_PRESETS) as CoverKey[];

export function coverBackground(key: string | undefined): string | undefined {
  return key && key in COVER_PRESETS ? COVER_PRESETS[key as CoverKey] : undefined;
}
