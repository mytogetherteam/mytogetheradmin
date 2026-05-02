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



