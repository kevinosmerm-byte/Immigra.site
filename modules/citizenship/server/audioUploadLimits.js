// Client contract: one recording (`audio`) and its `language` (en/es).
export const AUDIO_UPLOAD_LIMITS = Object.freeze({
  fileSize: 10 * 1024 * 1024,
  files: 1,
  fields: 1,
  // Busboy emits its parts limit on the boundary after the last accepted part.
  // files + fields enforce the actual two-part client contract.
  parts: 3,
  fieldSize: 16,
  fieldNameSize: 32,
});
