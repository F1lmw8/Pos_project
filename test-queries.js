import { mapThaiToEnglishGeneric, getBotResponse } from './src/utils/safetyEngine.js';

const testQueries = [
  "กิน เซเลค็อกสิบ กับไอบรูโพเฟนได้่ไหม ก็ไม่ได้",
  "เซเลค็อกสิบ กับไอบรูโพเฟน",
  "กิน เซเลค็อกสิบ กับไอบรูโพเฟนได้่ไหม",
  "กิน เซเลค็อกสิบ กับไอบรูโพเฟน"
];

for (const q of testQueries) {
  console.log(`Query: "${q}"`);
  const matches = mapThaiToEnglishGeneric(q);
  console.log(`  Matches:`, matches);
  const response = getBotResponse(q, null);
  console.log(`  Response length: ${response ? response.length : 0}`);
  console.log(`  Is contraindication warning? ${response && response.includes('ไม่ควรรับประทานร่วมกันเด็ดขาด')}`);
  console.log('---');
}
