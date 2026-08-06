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
    [1, 'AMOXYCILLIN 500 MG (แอมม็อกซี่ซิลลิน)', '500 mg', 'ED', 'กล่อง (10x10s)', 'ก', 'ยาอันตราย (ข.ย. 11)', 'ไม่มี', 'LOT-2026A01', '2027-12-31', 50, 0, 50, 120.00, 180.00, 'ภก.สมชาย ใจดี'],
    [2, 'AUGMENTIN 1g (ออเมนติน 1000mg)', '1000 mg', 'ED', 'กล่อง (14s)', 'ข', 'ยาอันตราย (ข.ย. 11)', 'DUE', 'LOT-2026A02', '2027-10-15', 30, 0, 30, 450.00, 620.00, 'ภก.สมชาย ใจดี'],
    [3, 'IBUPROFEN 400 MG (ไอบูโพรเฟน)', '400 mg', 'ED', 'แผง (10s)', 'ก', 'ยาอันตราย (ข.ย. 11)', 'ไม่มี', 'LOT-2026A03', '2028-05-20', 100, 0, 100, 18.00, 35.00, 'ภก.สมชาย ใจดี'],
    [4, 'DICLOFENAC 25 MG (ไดโคลฟีแนค)', '25 mg', 'ED', 'กล่อง (10x10s)', 'ก', 'ยาอันตราย (ข.ย. 11)', 'ไม่มี', 'LOT-2026A04', '2027-08-30', 40, 0, 40, 85.00, 130.00, 'ภก.สมชาย ใจดี'],
    [5, 'OMEPRAZOLE 20 MG (โอเมพราโซล)', '20 mg', 'ED', 'กล่อง (14s)', 'ก', 'ยาอันตราย (ข.ย. 11)', 'ไม่มี', 'LOT-2026A05', '2028-02-14', 60, 0, 60, 65.00, 100.00, 'ภก.สมชาย ใจดี'],
    [6, 'CETIRIZINE 10 MG (เซทิริซีน แก้แพ้)', '10 mg', 'ED', 'แผง (10s)', 'ก', 'ยาอันตราย (ข.ย. 11)', 'ไม่มี', 'LOT-2026A06', '2028-09-01', 150, 0, 150, 12.00, 25.00, 'ภก.สมชาย ใจดี'],
    [7, 'LORATADINE 10 MG (ลอราทาดีน)', '10 mg', 'ED', 'แผง (10s)', 'ก', 'ยาอันตราย (ข.ย. 11)', 'ไม่มี', 'LOT-2026A07', '2027-11-20', 120, 0, 120, 15.00, 30.00, 'ภก.สมชาย ใจดี'],
    [8, 'NORFLOXACIN 400 MG (นอร์ฟลอกซาซิน)', '400 mg', 'ED', 'แผง (10s)', 'ก', 'ยาอันตราย (ข.ย. 11)', 'ไม่มี', 'LOT-2026A08', '2027-06-18', 80, 0, 80, 28.00, 50.00, 'ภก.สมชาย ใจดี'],
    [9, 'AZITHROMYCIN 250 MG (อะซิโธรมัยซิน)', '250 mg', 'ED', 'กล่อง (6s)', 'ข', 'ยาอันตราย (ข.ย. 11)', 'DUE', 'LOT-2026A09', '2028-01-10', 40, 0, 40, 160.00, 240.00, 'ภก.สมชาย ใจดี'],
    [10, 'ATORVASTATIN 20 MG (อะทอร์วาสแตติน)', '20 mg', 'ED', 'กล่อง (30s)', 'ค', 'ยาอันตราย (ข.ย. 11)', 'ไม่มี', 'LOT-2026A10', '2028-04-25', 30, 0, 30, 220.00, 350.00, 'ภก.สมชาย ใจดี'],
    [11, 'DEXAMETHASONE 0.5 MG (เดกซาเมทาโซน)', '0.5 mg', 'ED', 'กล่อง (1000s)', 'ก', 'ยาควบคุมพิเศษ (ข.ย. 10)', 'DUE', 'LOT-2026B11', '2027-09-30', 10, 0, 10, 380.00, 550.00, 'ภก.สมชาย ใจดี'],
    [12, 'PREDNISOLONE 5 MG (เพรดนิโซโลน)', '5 mg', 'ED', 'กล่อง (500s)', 'ก', 'ยาควบคุมพิเศษ (ข.ย. 10)', 'DUE', 'LOT-2026B12', '2028-03-15', 15, 0, 15, 420.00, 600.00, 'ภก.สมชาย ใจดี'],
    [13, 'TRAMADOL 50 MG (ทรามาดอล แก้ปวดรุนแรง)', '50 mg', 'ED', 'แผง (10s)', 'ข', 'ยาควบคุมพิเศษ (ข.ย. 10)', 'DUE', 'LOT-2026B13', '2027-07-20', 50, 0, 50, 45.00, 80.00, 'ภก.สมชาย ใจดี'],
    [14, 'ALPRAZOLAM 0.5 MG (อัลปราโซแลม)', '0.5 mg', 'ED', 'แผง (10s)', 'ค', 'ยาควบคุมพิเศษ (ข.ย. 10)', 'DUE (บันทึกรายชื่อผู้ป่วย)', 'LOT-2026B14', '2027-05-12', 30, 0, 30, 90.00, 150.00, 'ภก.สมชาย ใจดี'],
    [15, 'CLONAZEPAM 2 MG (คลอนาซีแพม)', '2 mg', 'ED', 'แผง (10s)', 'ค', 'ยาควบคุมพิเศษ (ข.ย. 10)', 'DUE (บันทึกรายชื่อผู้ป่วย)', 'LOT-2026B15', '2028-06-30', 25, 0, 25, 110.00, 180.00, 'ภก.สมชาย ใจดี'],
    [16, 'SARA PARACETAMOL 500 MG (ซาร่า พาราเซตามอล)', '500 mg', 'ED', 'แผง (10s)', 'ก', 'ยาสามัญประจำบ้าน', 'ไม่มี', 'LOT-2026C16', '2029-01-01', 200, 0, 200, 10.00, 18.00, 'ภก.สมชาย ใจดี'],
    [17, 'BURRNY GEL (เบอร์นี่ เจล ทาแผลไฟไหม้)', '30 g', 'ED', 'หลอด', 'ก', 'ยาสามัญประจำบ้าน', 'ไม่มี', 'LOT-2026C17', '2028-08-15', 40, 0, 40, 40.00, 65.00, 'ภก.สมชาย ใจดี'],
    [18, 'KLEANDROP NORMAL SALINE (น้ำเกลือล้างแผล 500ml)', '500 ml', 'ED', 'ขวด', 'ก', 'ยาสามัญประจำบ้าน', 'ไม่มี', 'LOT-2026C18', '2028-11-30', 50, 0, 50, 28.00, 45.00, 'ภก.สมชาย ใจดี'],
    [19, 'POVIDONE IODINE 10% (เบตาดีน 30ml)', '30 ml', 'ED', 'ขวด', 'ก', 'ยาสามัญประจำบ้าน', 'ไม่มี', 'LOT-2026C19', '2028-10-10', 60, 0, 60, 32.00, 55.00, 'ภก.สมชาย ใจดี'],
    [20, 'AIR-X SIMETHICONE 80 MG (แอร์-เอ็กซ์ ขับลม)', '80 mg', 'ED', 'แผง (10s)', 'ก', 'ยาสามัญประจำบ้าน', 'ไม่มี', 'LOT-2026C20', '2029-03-20', 100, 0, 100, 16.00, 30.00, 'ภก.สมชาย ใจดี']
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
