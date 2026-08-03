import { NextResponse } from 'next/server';

const FDA_RESOURCE_IDS = [
  { type: 'ผย1 (ยาแผนปัจจุบัน)', id: 'e73593c1-870e-4243-8397-80ef12b58e69' },
  { type: 'ผยบ (ยาโบราณ)', id: '43178d68-54cc-4db6-b76f-ef4e9252e43b' }
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();

    let allRecords = [];

    // Query live FDA API for both ผย1 and ผยบ
    for (const item of FDA_RESOURCE_IDS) {
      try {
        const fdaUrl = `https://catalog.fda.moph.go.th/api/3/action/datastore_search?resource_id=${item.id}&limit=50${q ? `&q=${encodeURIComponent(q)}` : ''}`;
        
        const res = await fetch(fdaUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (res.ok) {
          const json = await res.json();
          const records = json?.result?.records || [];
          records.forEach((r) => {
            allRecords.push({
              id: r._id,
              type: r['ประเภท'] || r['ประเภทคำขอ'] || item.type,
              license_no: r['เลขที่ใบอนุญาต'] || '-',
              company_name: r['ชื่อสถานที่'] || '-',
              address: `${r['แขวง'] || ''} ${r['เขต'] || ''} ${r['จังหวัด'] || ''}`.trim(),
              status: r['สถานะ'] || 'คงอยู่',
              expiry_year: r['ปีพ.ศ. ที่หมดอายุ'] || '2569',
              activity: r['กิจกรรม'] || 'ยาสำเร็จรูป'
            });
          });
        }
      } catch (err) {
        console.error(`Error querying FDA API for ${item.type}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      source: 'live_fda_api',
      count: allRecords.length,
      data: allRecords
    });

  } catch (error) {
    console.error('FDA Lookup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch FDA license data' },
      { status: 500 }
    );
  }
}
