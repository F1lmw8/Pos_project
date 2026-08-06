/**
 * Helper utility to get pharmacy store settings (Store Name, Branch, License, Pharmacist, Address, Phone)
 * Synchronized with localStorage 'pharmacy_store_settings'
 */
export function getStoreSettings() {
  const defaultSettings = {
    storeName: 'NONGFILM_MJU_Pharmacy',
    branchName: 'สาขาหลัก แม่โจ้',
    licenseNo: 'ภก. 12345/2569',
    pharmacistName: 'ภก. อภิโช โลมทอง (ภ. 34152)',
    address: '123 ม.6 ต.หนองหาร อ.สันทราย จ.เชียงใหม่ 50290',
    phone: '098-934-2456'
  };

  if (typeof window === 'undefined') {
    return defaultSettings;
  }

  try {
    const saved = localStorage.getItem('pharmacy_store_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        storeName: parsed.storeName || defaultSettings.storeName,
        branchName: parsed.branchName || defaultSettings.branchName,
        licenseNo: parsed.licenseNo || defaultSettings.licenseNo,
        pharmacistName: parsed.pharmacistName || defaultSettings.pharmacistName,
        address: parsed.address || defaultSettings.address,
        phone: parsed.phone || defaultSettings.phone
      };
    }
  } catch (e) {
    console.error('Failed to load store settings:', e);
  }

  return defaultSettings;
}
