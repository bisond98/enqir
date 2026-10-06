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

/**
 * Cloudinary serves PDFs as raw bytes under /image/upload/, which renders as a
 * blank browser tab. Inserting the fl_attachment flag makes Cloudinary return
 * the file as a download with its filename, instead of a blank page.
 */
export const toAttachmentDownloadUrl = (url: string): string => {
  if (/res\.cloudinary\.com/.test(url) && /\/upload\//.test(url) && !/fl_attachment/.test(url)) {
    return url.replace('/upload/', '/upload/fl_attachment/');
  }
  return url;
};

/** Trigger a direct download of a document attachment. */
export const downloadAttachment = (url: string): void => {
  const a = document.createElement('a');
  a.href = toAttachmentDownloadUrl(url);
  a.target = '_blank';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
};
