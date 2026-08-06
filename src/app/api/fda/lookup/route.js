import { NextResponse } from 'next/server';

async function fetchFdaSingleQuery(queryKeyword) {
  const model = {
    SEARCH_VALUE: queryKeyword,
    RADIO_TYPE: 'ผลิตภัณฑ์ทั้งหมด',
    RADIO_TYPE_ETC_FOOD: null,
    RADIO_TYPE_ETC_DRUG: null,
    RADIO_TYPE_ETC_HERB: null,
    RADIO_TYPE_ETC_TXC: null,
    RADIO_TYPE_ETC_CMT: null,
    RADIO_TYPE_ETC_NCT: null,
    RADIO_TYPE_ETC_MDC: null,
    RADIO_TYPE_ETC_ADVER: null,
    RADIO_TYPE_LOCATION: null
  };

  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const bodyStr = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="MODEL"',
    '',
    JSON.stringify(model),
    `--${boundary}`,
    'Content-Disposition: form-data; name="search_input"',
    '',
    queryKeyword,
    `--${boundary}--\r\n`
  ].join('\r\n');

  const res = await fetch('http://porta.fda.moph.go.th/FDA_SEARCH_CENTER_BACKEND/SEACH_ALL/GET_SEARCH', {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    },
    body: bodyStr,
    cache: 'no-store'
  });

  if (!res.ok) return [];

  const json = await res.json();
  const records = Array.isArray(json) ? json : [];

  return records.map((r, index) => ({
    id: r.IDA || r.Newcode || `${queryKeyword}-${index}`,
    type: r.typepro || 'ผลิตภัณฑ์สุขภาพ',
    license_no: r.lcnno || '-',
    company_name: r.licen || r.thanm || '-',
    product_name_th: r.productha || '-',
    product_name_en: r.produceng || '-',
    address: r.Addr || '-',
    status: r.cncnm || 'คงอยู่',
    newcode: r.Newcode || '',
    detail_url: r.URLs_NEW || '',
    type_allow: r.typeallow || '',
    query_keyword: queryKeyword
  }));
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQ = (searchParams.get('q') || '').trim();

    if (!rawQ) {
      return NextResponse.json({
        success: true,
        source: 'porta_fda_api',
        count: 0,
        data: []
      });
    }

    // Support multi-keyword search separated by comma or semicolon (e.g. "G762/47, 1A 1289/28" or "BENZAC, SARA")
    const keywords = rawQ.split(/[,;]+/).map((k) => k.trim()).filter(Boolean);

    // Fetch all keywords in parallel
    const resultsArray = await Promise.all(
      keywords.map((kw) => fetchFdaSingleQuery(kw).catch(() => []))
    );

    // Flatten and deduplicate by newcode or license_no
    const seen = new Set();
    const combinedData = [];

    for (const subList of resultsArray) {
      for (const item of subList) {
        const key = item.newcode || item.license_no || `${item.product_name_th}-${item.company_name}`;
        if (!seen.has(key)) {
          seen.add(key);
          combinedData.push(item);
        }
      }
    }

    return NextResponse.json({
      success: true,
      source: 'porta_fda_api',
      count: combinedData.length,
      data: combinedData
    });

  } catch (error) {
    console.error('FDA Lookup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch FDA data from porta.fda.moph.go.th', message: error.message },
      { status: 500 }
    );
  }
}
