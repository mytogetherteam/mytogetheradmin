import {
  resolveShopCityLabel,
  resolveShopDistrictLabel,
  type Shop,
} from '@/services/shopService';
import { handleApiError } from '@/lib/error-utils';

export async function exportAdminShopProfilesToExcel(shops: Shop[]): Promise<void> {
  try {
    const XLSX = await import('xlsx');
    const data = shops.map((shop) => ({
      ID: shop.id,
      Name: shop.name,
      NameMM: shop.nameMm || '',
      Category: shop.category,
      SubCategory: shop.category || '',
      Address: shop.address,
      District: resolveShopDistrictLabel(shop) || '',
      City: resolveShopCityLabel(shop) || '',
      Phone: shop.phone || '',
      Rating: shop.ratingAvg || 0,
      ReviewCount: shop.ratingCount || 0,
      Verified: shop.isVerified ? 'Yes' : 'No',
      Active: shop.isActive ? 'Yes' : 'No',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Shops');
    XLSX.writeFile(wb, 'Shops.xlsx');
  } catch (error) {
    handleApiError(error, 'Failed to export to Excel');
  }
}
