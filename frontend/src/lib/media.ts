export function getMediaUrl(url: string): string {
  if (!url) {
    return '';
  }

  const trimmedUrl = url.trim();
  let pathname = trimmedUrl;

  if (/^https?:\/\//i.test(trimmedUrl)) {
    try {
      pathname = new URL(trimmedUrl).pathname;
    } catch {
      return trimmedUrl;
    }
  }

  const uploadsIndex = pathname.indexOf('/uploads/');

  if (uploadsIndex >= 0) {
    return pathname.slice(uploadsIndex);
  }

  if (pathname.startsWith('uploads/')) {
    return `/${pathname}`;
  }

  return trimmedUrl;
}
