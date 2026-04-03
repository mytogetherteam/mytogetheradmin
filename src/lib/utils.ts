import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { config } from "@/config/config"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumberWithCommas(value: string | number | undefined): string {
  if (value === undefined || value === null || value === "") return "";
  const stringValue = typeof value === "number" ? value.toString() : value.replace(/,/g, "");
  if (isNaN(Number(stringValue))) return stringValue;
  
  const parts = stringValue.split(".");
  // Remove leading zeros from the integer part (except for "0" itself)
  parts[0] = Number(parts[0]).toString();
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

export function parseNumberFromCommas(value: string): string {
  return value.replace(/,/g, "");
}

/**
 * Ensures an image URL is absolute by prepending the API base URL for relative paths.
 * In dev mode, relative paths are kept relative so they route through the Vite proxy
 * (which forwards cookies/auth automatically). In production builds, the full base URL is used.
 */
export function formatImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  
  // Already an absolute URL – use as-is
  if (url.startsWith('http')) {
    // If the URL points to the API server and we're in dev, convert to relative
    // so it goes through the Vite proxy and sends auth cookies
    const apiBaseUrl = config.apiBaseUrl || '';
    if (import.meta.env.DEV && apiBaseUrl && url.startsWith(apiBaseUrl)) {
      return url.slice(apiBaseUrl.length) || '/';
    }
    return url;
  }
  
  // Relative path: in dev, keep relative so Vite proxy handles it with credentials
  if (import.meta.env.DEV) {
    return url.startsWith('/') ? url : `/${url}`;
  }
  
  // Production: prepend API base URL
  const apiBaseUrl = config.apiBaseUrl || ''; 
  const cleanBaseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  
  return `${cleanBaseUrl}${cleanUrl}`;
}


