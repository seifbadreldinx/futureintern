/**
 * Resolve the correct display URL for a company logo / profile image.
 *
 * The database stores several formats:
 *   1. Full external URL  (https://t3.gstatic.com/…)  → use as-is
 *   2. Backend upload path (/uploads/logos/logo_5_…)   → prepend backend base
 *   3. Static asset path   (/logos/vodafone.jpg)       → keep relative so the
 *      browser loads it from the *frontend* origin where public/logos/ is served
 */
export function resolveLogoUrl(logoUrl: string): string {
  const apiBase = (
    import.meta.env.VITE_API_BASE_URL ||
    'https://futureintern-production.up.railway.app/api'
  ).replace(/\/api\/?$/, '');

  // ── Full external URL ──────────────────────────────────────────────
  if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
    // Old Railway / localhost URLs that embed /uploads/logos/ — normalise them
    const pathMatch = logoUrl.match(/\/uploads\/logos\/(.+)$/);
    if (pathMatch) {
      return `${apiBase}/uploads/logos/${pathMatch[1]}`;
    }
    return logoUrl; // CDN / Google Favicon / ui-avatars — use as-is
  }

  // ── Backend-uploaded file (/uploads/logos/…) ───────────────────────
  if (logoUrl.startsWith('/uploads/')) {
    return `${apiBase}${logoUrl}`;
  }

  // ── Static frontend asset (/logos/vodafone.jpg) ────────────────────
  // Served from public/logos/ on the frontend origin — keep relative
  return logoUrl;
}
