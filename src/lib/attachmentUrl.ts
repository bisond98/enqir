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

/**
 * Trigger a download of a document attachment without ever navigating the user
 * to a Cloudinary URL:
 *
 * 1. fetch() the file bytes in the background (Cloudinary sends
 *    `access-control-allow-origin: *`, so this works cross-origin)
 * 2. wrap them in a Blob and create a `blob:https://enqir.in/...` object URL
 * 3. click an invisible anchor pointing at the blob URL
 *
 * The user stays on the page — no new tab, no address-bar flash, no visible
 * res.cloudinary.com address. Falls back to opening the fl_attachment URL if
 * fetch is unavailable or fails (e.g. offline).
 */
export const downloadAttachment = async (url: string, fileNameOverride?: string): Promise<void> => {
  const fileName = fileNameOverride || (() => {
    try {
      const path = new URL(url, window.location.origin).pathname;
      return decodeURIComponent(path.split('/').pop() || '') || 'document';
    } catch {
      return 'document';
    }
  })();

  try {
    const response = await fetch(toAttachmentDownloadUrl(url));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();

    // Release the blob once the browser has picked it up
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
  } catch {
    // Fallback: old behaviour (opens fl_attachment URL, which still forces a
    // download via Cloudinary's content-disposition header)
    const a = document.createElement('a');
    a.href = toAttachmentDownloadUrl(url);
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
};
