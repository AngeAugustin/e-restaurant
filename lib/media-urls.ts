const LOCAL_PRODUCT_PATH = /^\/uploads\/products\/[\w.-]+$/;
const LOCAL_BRANDING_PATH = /^\/uploads\/branding\/[a-zA-Z0-9._-]+$/;
export const BLOB_STORAGE_URL =
  /^https:\/\/[a-z0-9-]+\.(?:public\.)?blob\.vercel-storage\.com\/[\w./%-]+$/i;

export function isAllowedProductImageUrl(url: string): boolean {
  return LOCAL_PRODUCT_PATH.test(url) || BLOB_STORAGE_URL.test(url);
}

export function isAllowedBrandingImageUrl(url: string): boolean {
  return LOCAL_BRANDING_PATH.test(url) || BLOB_STORAGE_URL.test(url);
}
