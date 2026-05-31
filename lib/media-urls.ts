const LOCAL_PRODUCT_PATH = /^\/uploads\/products\/[\w.-]+$/;
const LOCAL_BRANDING_PATH = /^\/uploads\/branding\/[a-zA-Z0-9._-]+$/;
export const MONGO_PRODUCT_IMAGE_PATH = /^\/api\/media\/products\/[a-f0-9]{24}$/i;
export const BLOB_STORAGE_URL =
  /^https:\/\/[a-z0-9-]+\.(?:public\.)?blob\.vercel-storage\.com\/[\w./%-]+$/i;

export function productImagePublicPath(id: string): string {
  return `/api/media/products/${id}`;
}

export function parseProductImageId(url: string): string | null {
  const path = url.trim().split("?")[0];
  const m = path.match(/^\/api\/media\/products\/([a-f0-9]{24})$/i);
  return m ? m[1] : null;
}

export function isAllowedProductImageUrl(url: string): boolean {
  const path = url.trim().split("?")[0];
  return (
    LOCAL_PRODUCT_PATH.test(path) ||
    MONGO_PRODUCT_IMAGE_PATH.test(path) ||
    BLOB_STORAGE_URL.test(path)
  );
}

/** URL affichée dans `<img>` — invalide le cache navigateur après migration MongoDB. */
export function resolveProductImageDisplayUrl(image?: string): string | undefined {
  const t = image?.trim();
  if (!t) return undefined;
  const path = t.split("?")[0];
  if (MONGO_PRODUCT_IMAGE_PATH.test(path)) {
    return `${path}?v=2`;
  }
  return t;
}

export function isAllowedBrandingImageUrl(url: string): boolean {
  return LOCAL_BRANDING_PATH.test(url) || BLOB_STORAGE_URL.test(url);
}
