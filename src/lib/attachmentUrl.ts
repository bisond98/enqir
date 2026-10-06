/**
 * Attachment URL helpers — shared by response/detail pages so that resume and
 * document files (PDF/DOC etc.) uploaded on hiring enquiry responses render as
 * a file tile with a name and open in a new tab, instead of breaking inside
 * <img> tags.
 */
export const isDocumentUrl = (url: string): boolean =>
  !/\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(url || '');

export const attachmentFileName = (url: string, index: number, names?: string[]): string => {
  const fromList = names?.[index];
  if (fromList && !/^image-\d+\.jpg$/i.test(fromList)) return fromList;
  try {
    const path = new URL(url, window.location.origin).pathname;
    const last = path.split('/').pop() || '';
    return last || `Document ${index + 1}`;
  } catch {
    return `Document ${index + 1}`;
  }
};
