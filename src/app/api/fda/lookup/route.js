import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();

    if (!q) {
      return NextResponse.json({
        success: true,
        source: 'porta_fda_api',
        count: 0,
        data: []
      });
    }

    const model = {
      SEARCH_VALUE: q,
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
      q,
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

    if (!res.ok) {
      throw new Error(`FDA backend responded with status: ${res.status}`);
    }

    const json = await res.json();
    const records = Array.isArray(json) ? json : [];

    const mappedData = records.map((r, index) => ({
      id: r.IDA || r.Newcode || index,
      type: r.typepro || 'ผลิตภัณฑ์สุขภาพ',
      license_no: r.lcnno || '-',
      company_name: r.licen || r.thanm || '-',
      product_name_th: r.productha || '-',
      product_name_en: r.produceng || '-',
      address: r.Addr || '-',
      status: r.cncnm || 'คงอยู่',
      newcode: r.Newcode || '',
      detail_url: r.URLs_NEW || '',
      type_allow: r.typeallow || ''
    }));

    return NextResponse.json({
      success: true,
      source: 'porta_fda_api',
      count: mappedData.length,
      data: mappedData
    });

  } catch (error) {
    console.error('FDA Lookup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch FDA data from porta.fda.moph.go.th', message: error.message },
      { status: 500 }
    );
  }
}
