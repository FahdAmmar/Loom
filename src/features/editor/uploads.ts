// There's no real backend to upload to, so files are stored as data URIs
// directly in block content. localStorage has a shared quota (commonly ~5MB
// per origin) across every page, so one file is capped well under that.
export const MAX_UPLOAD_BYTES = 1.5 * 1024 * 1024;

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Couldn't read that file."));
    reader.readAsDataURL(file);
  });
}
