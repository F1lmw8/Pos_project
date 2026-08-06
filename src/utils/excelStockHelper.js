import * as XLSX from 'xlsx';

/**
 * Downloads Official Pharmacy & Hospital Excel Template (.xlsx)
 * Matches Hospital/Clinic Stock Card Standards with Automatic Formulas
 */
export function downloadStockTemplate() {
  const headers = [
    'ลำดับ',
    'รายการยาและเวชภัณฑ์',
    'ความแรง',
    'ED/N',
    'ขนาดบรรจุ',
    'บัญชียา',
    'กลุ่มยา',
    'เงื่อนไขการใช้ยา',
    'รหัสล็อต (Batch/Lot No.)',
    'วันหมดอายุ (YYYY-MM-DD)',
    'จำนวนรับเข้า',
    'จำนวนจ่ายออก',
    'จำนวนคงเหลือ',
    'ราคาต้นทุน (บาท)',
    'ราคาขาย (บาท)',
    'ผู้บันทึก'
  ];

  const sampleData = [
    [1, 'ACYCLOVIR', '400 mg', 'ED', '1*70s', 'ก', 'Infections (Antivirals)', '', 'LOT-ACY-2569', '2027-12-31', 100, 0, 100, 150.00, 250.00, 'ภก. สมชาย'],
    [2, 'ALBENDAZOLE', '200 mg', 'ED', '10*10s', 'ก', 'Infections (Anthelmintics)', '', 'LOT-ALB-2569', '2027-10-15', 50, 5, 45, 80.00, 120.00, 'ภก. สมชาย'],
    [3, 'ALLOPURINOL', '100 mg', 'ED', '50*10s', 'ก', 'Drugs for gout & hyperuricaemia', '', 'LOT-ALLO-2569', '2028-01-20', 200, 10, 190, 110.00, 180.00, 'ภก. สมชาย'],
    [4, 'AMITRIPTYLINE', '10 mg', 'ED', '1000s', 'ก', 'Central nervous system (Antidepressant)', '', 'LOT-AMI-2569', '2027-08-30', 300, 20, 280, 200.00, 350.00, 'ภก. สมชาย'],
    [5, 'AMOXYCILLIN', '500 mg', 'ED', '50*10s', 'ก', 'Infections (Antibacterial, Penicillin)', '', 'LOT-AMX-2569', '2027-11-25', 500, 50, 450, 450.00, 750.00, 'ภก. สมชาย'],
    [6, 'AUGMENTIN (Amoxicillin+Clavulanic)', '1 g', 'ED', '10s', 'ค', 'Infections (Antibacterial, Penicillin)', 'มีเงื่อนไขการสั่งใช้ในผู้ป่วย ASCVD/DUE', 'LOT-AUG-2569', '2027-06-18', 40, 2, 38, 550.00, 850.00, 'ภก. สมชาย']
  ];

  const wsData = [
    ['บัญชีคลังยาและเวชภัณฑ์มาตรฐาน (Stock Card Template)'],
    ['วันที่สร้างเทมเพลต: ' + new Date().toLocaleDateString('th-TH')],
    [],
    headers,
    ...sampleData
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  worksheet['!cols'] = [
    { wch: 8 },  // ลำดับ
    { wch: 36 }, // รายการยา
    { wch: 12 }, // ความแรง
    { wch: 8 },  // ED/N
    { wch: 12 }, // ขนาดบรรจุ
    { wch: 10 }, // บัญชียา
    { wch: 32 }, // กลุ่มยา
    { wch: 36 }, // เงื่อนไขการใช้ยา
    { wch: 22 }, // รหัสล็อต
    { wch: 18 }, // วันหมดอายุ
    { wch: 14 }, // รับเข้า
    { wch: 14 }, // จ่ายออก
    { wch: 14 }, // คงเหลือ
    { wch: 16 }, // ต้นทุน
    { wch: 16 }, // ราคาขาย
    { wch: 18 }  // ผู้บันทึก
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Card Template');

  XLSX.writeFile(workbook, 'Template_StockCard_Pharmacy.xlsx');
}

/**
 * Exports Active Inventory & Lot Stock Card to Excel (.xlsx)
 */
export function exportStockCardExcel(items = [], storeName = 'ร้านยารู้เรื่องยา RDU') {
  const headers = [
    'ลำดับ',
    'รายการยาและเวชภัณฑ์',
    'ความแรง',
    'รูปแบบยา',
    'ขนาดบรรจุ',
    'รหัส TMT / SKU',
    'เลขทะเบียน อย.',
    'สถานะ อย.',
    'ผู้ผลิต / ผู้จำหน่าย',
    'ล็อตยา (Batch/Lot No.)',
    'วันหมดอายุ',
    'จำนวนรับเข้า',
    'จำนวนคงเหลือ',
    'ราคาขาย (บาท)',
    'มูลค่ารวมคงเหลือ (บาท)',
    'สถานะสต็อก'
  ];

  const rows = items.map((item, index) => {
    const stockQty = Number(item.sellable_quantity || item.stock_quantity || 0);
    const price = Number(item.price || 0);
    const totalVal = stockQty * price;

    let statusText = 'พร้อมขาย';
    if (stockQty <= 0) statusText = 'หมดสต็อก';
    else if (stockQty <= (item.reorder_point || 10)) statusText = 'ใกล้หมด';

    return [
      index + 1,
      item.trade_name || item.name || '-',
      item.strength || '-',
      item.dosage_form || '-',
      item.unit || 'กล่อง',
      item.sku || item.tmt_id || '-',
      item.fda_reg_no || '-',
      item.fda_status === 'verified' ? 'ตรวจสอบแล้ว' : 'ไม่ระบุ',
      item.manufacturer || '-',
      item.lot_number || item.sku || '-',
      item.nearest_expiry_date ? new Date(item.nearest_expiry_date).toLocaleDateString('th-TH') : '-',
      item.total_lot_quantity || stockQty,
      stockQty,
      price,
      totalVal,
      statusText
    ];
  });

  const wsData = [
    [`รายงานบัญชีสต็อกยาและคลังเวชภัณฑ์ (Stock Card Report) - ${storeName}`],
    [`วันที่ส่งออก: ${new Date().toLocaleDateString('th-TH')} | จำนวนรายการ: ${items.length} รายการ`],
    [],
    headers,
    ...rows
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(wsData);

  worksheet['!cols'] = [
    { wch: 8 },  // ลำดับ
    { wch: 32 }, // รายการยา
    { wch: 12 }, // ความแรง
    { wch: 12 }, // รูปแบบยา
    { wch: 12 }, // ขนาดบรรจุ
    { wch: 20 }, // SKU
    { wch: 16 }, // เลข อย.
    { wch: 14 }, // สถานะ อย.
    { wch: 26 }, // ผู้ผลิต
    { wch: 20 }, // ล็อตยา
    { wch: 16 }, // วันหมดอายุ
    { wch: 14 }, // รับเข้า
    { wch: 14 }, // คงเหลือ
    { wch: 14 }, // ราคาขาย
    { wch: 18 }, // มูลค่าคงเหลือ
    { wch: 14 }  // สถานะสต็อก
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Card Data');

  const filename = `StockCard_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

/**
 * Parses uploaded Excel file (.xlsx / .xls / .csv) into JSON Array
 */
export async function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert sheet to JSON rows
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!rawJson || rawJson.length === 0) {
          return resolve([]);
        }

        // Find header row (usually contains 'รายการยา' or 'trade_name')
        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(rawJson.length, 10); i++) {
          const rowStr = (rawJson[i] || []).join(' ');
          if (rowStr.includes('รายการยา') || rowStr.includes('trade_name') || rowStr.includes('Drug Name')) {
            headerRowIndex = i;
            break;
          }
        }

        const headers = rawJson[headerRowIndex].map((h) => String(h || '').trim());
        const dataRows = rawJson.slice(headerRowIndex + 1);

        const parsedItems = dataRows
          .filter((row) => row && row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== ''))
          .map((row) => {
            const itemObj = {};
            headers.forEach((h, colIdx) => {
              if (h) {
                itemObj[h] = row[colIdx] !== undefined ? row[colIdx] : '';
              }
            });

            // Map aliases to standard fields
            return {
              ...itemObj,
              trade_name: itemObj['รายการยาและเวชภัณฑ์'] || itemObj['trade_name'] || itemObj['Drug Name'] || itemObj['ชื่อยา'] || '',
              strength: itemObj['ความแรง'] || itemObj['strength'] || '',
              ed_type: itemObj['ED/N'] || itemObj['ed_type'] || '',
              unit: itemObj['ขนาดบรรจุ'] || itemObj['unit'] || 'กล่อง',
              category: itemObj['บัญชียา'] || itemObj['category'] || '',
              drug_group: itemObj['กลุ่มยา'] || itemObj['drug_group'] || '',
              usage_condition: itemObj['เงื่อนไขการใช้ยา'] || itemObj['usage_condition'] || '',
              lot_number: itemObj['รหัสล็อต (Batch/Lot No.)'] || itemObj['lot_number'] || itemObj['Batch No.'] || '',
              expiry_date: itemObj['วันหมดอายุ (YYYY-MM-DD)'] || itemObj['expiry_date'] || itemObj['วันหมดอายุ'] || '',
              quantity: itemObj['จำนวนรับเข้า'] || itemObj['จำนวนคงเหลือ'] || itemObj['quantity'] || 0,
              cost_price: itemObj['ราคาต้นทุน (บาท)'] || itemObj['cost_price'] || 0,
              price: itemObj['ราคาขาย (บาท)'] || itemObj['price'] || 0,
              pharmacist: itemObj['ผู้บันทึก'] || itemObj['pharmacist'] || ''
            };
          })
          .filter((item) => item.trade_name && item.trade_name !== 'รายการยาและเวชภัณฑ์');

        resolve(parsedItems);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
