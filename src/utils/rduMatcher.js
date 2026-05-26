import { RDU_MONOGRAPHS } from '../data/monographs.js';

// ฟังก์ชันแปลงรูปแบบยา (Dosage Form) เป็นไอคอนสุดเจ๋ง
export const getDosageIcon = (form) => {
  if (!form) return '💊';
  const f = form.toLowerCase();
  if (f.includes('tablet') || f.includes('cap') || f.includes('pill')) return '💊';
  if (f.includes('cream') || f.includes('ointment') || f.includes('gel') || f.includes('lotion')) return '🧴';
  if (f.includes('inject') || f.includes('solution') || f.includes('infusion')) return '💉';
  if (f.includes('drop') || f.includes('eye') || f.includes('ophthalmic')) return '👁️';
  if (f.includes('syrup') || f.includes('suspension') || f.includes('liquid') || f.includes('mixture')) return '🧪';
  if (f.includes('spray') || f.includes('inhal') || f.includes('aerosol')) return '💨';
  return '💊';
};

// ฟังก์ชันจับคู่/แปลงข้อมูลยาทั่วไปเป็นคำอธิบายฉลากยา RDU ภาษาไทย (RDU Leaflet Matcher)
export const getRduDetails = (drug) => {
  if (!drug) return null;
  
  const activeIng = drug.a ? drug.a.toLowerCase() : '';
  const dosageForm = drug.d ? drug.d.toLowerCase() : '';
  
  // ค้นหาคำสำคัญในสารออกฤทธิ์ว่าตรงกับฐานข้อมูลหลัก RDU_MONOGRAPHS หรือไม่
  let matchedKey = null;
  if (activeIng.includes('clobetasol')) matchedKey = 'clobetasol';
  else if (activeIng.includes('paracetamol') || activeIng.includes('acetaminophen')) matchedKey = 'paracetamol';
  else if (activeIng.includes('amoxicillin')) matchedKey = 'amoxicillin';
  else if (activeIng.includes('ibuprofen')) matchedKey = 'ibuprofen';
  else if (activeIng.includes('atorvastatin')) matchedKey = 'atorvastatin';
  else if (activeIng.includes('metformin')) matchedKey = 'metformin';
  else if (activeIng.includes('omeprazole')) matchedKey = 'omeprazole';

  if (matchedKey && RDU_MONOGRAPHS[matchedKey]) {
    return {
      ...RDU_MONOGRAPHS[matchedKey],
      isFallback: false
    };
  }

  // Fallback Engine: สร้างข้อมูลคำแนะนำการใช้ยาอัตโนมัติตามรูปแบบยาและสารออกฤทธิ์
  let dynamicCategory = "ยารักษาโรค / ยาแผนปัจจุบัน";
  let dynamicInstructions = "ใช้ยานี้ตามคำสั่งของแพทย์หรือเภสัชกรอย่างเคร่งครัด";
  let dynamicPrecautions = "ห้ามแบ่งยาให้ผู้อื่นรับประทาน และเก็บให้พ้นมือเด็ก";
  let dynamicStorage = "ควรเก็บยาไว้ในที่แห้ง อุณหภูมิต่ำกว่า 30°C ป้องกันแสงแดดและความร้อน";
  
  // วิเคราะห์ประเภท/รูปแบบยา
  if (dosageForm.includes('tablet') || dosageForm.includes('capsule') || dosageForm.includes('pill')) {
    dynamicCategory = "ยารับประทาน (Oral Medicine)";
    dynamicInstructions = "รับประทานพร้อมน้ำสะอาดตามขนาดและเวลาที่ระบุบนฉลากยาอย่างสม่ำเสมอ";
  } else if (dosageForm.includes('cream') || dosageForm.includes('ointment') || dosageForm.includes('gel') || dosageForm.includes('lotion')) {
    dynamicCategory = "ยาใช้ภายนอก (Topical External Medicine)";
    dynamicInstructions = "ทาบางๆ บริเวณผิวหนังที่มีอาการตามความถี่ที่ระบุบนฉลากยา สำหรับใช้ภายนอกเท่านั้น ห้ามรับประทาน";
    dynamicPrecautions = "ระวังอย่าให้เข้าตา ปาก หรือทาบนแผลเปิดกว้าง หากมีอาการระคายเคืองให้หยุดใช้ทันที";
  } else if (dosageForm.includes('injection') || dosageForm.includes('solution for injection') || dosageForm.includes('infusion')) {
    dynamicCategory = "ยาฉีด (Injectable Medicine)";
    dynamicInstructions = "บริหารยาโดยบุคลากรทางการแพทย์หรือภายใต้การควบคุมตามมาตรฐานทางการแพทย์เท่านั้น";
  } else if (dosageForm.includes('eye drop') || dosageForm.includes('ophthalmic')) {
    dynamicCategory = "ยาหยอดตา (Eye Drops)";
    dynamicInstructions = "หยอดตาตามจำนวนหยดที่กำหนด ระวังอย่าให้ปลายหลอดหยดสัมผัสดวงตาหรือนิ้วมือ";
    dynamicStorage = "เก็บในที่แห้ง ป้องกันแสง และหลังจากเปิดขวดแล้วมักเก็บได้ไม่เกิน 30 วัน";
  }

  // ค้นหาสารสำคัญเพื่อแปลงเป็นข้อบ่งใช้และสรรพคุณอัจฉริยะภาษาไทย (Smart Fallback Translator)
  let matchedIndication = "";
  let matchedInstructions = "";
  let matchedAdverse = "";
  let matchedContra = "";

  if (activeIng.includes('dextromethorphan') || activeIng.includes('guaifenesin') || activeIng.includes('terpin hydrate') || activeIng.includes('bromhexine')) {
    matchedIndication = "ใช้บรรเทาอาการไอ ลดอาการระคายเคืองคอ และช่วยขับเสมหะ/ละลายเสมหะในระบบทางเดินหายใจ (ยาแก้ไอและขับเสมหะ)";
    matchedInstructions = `${dynamicInstructions}\n• รับประทานตามขนาดที่ระบุบนฉลากยา ทุกๆ 4-6 ชั่วโมงเมื่อมีอาการไอ\n• แนะนำให้ดื่มน้ำอุ่นตามมากๆ เพื่อช่วยเพิ่มประสิทธิภาพในการละลายและขับเสมหะ`;
    matchedAdverse = "อาจมีอาการง่วงซึม มึนงง ปากแห้ง คลื่นไส้ หรือท้องผูกได้ในบางราย";
    matchedContra = "หลีกเลี่ยงในผู้ที่แพ้ส่วนประกอบของยานี้ หรือผู้ที่ใช้ยากลุ่มต้านโรคซึมเศร้า MAOIs (Monoamine Oxidase Inhibitors) และควรระมัดระวังเป็นพิเศษในสตรีมีครรภ์หรือเด็กเล็ก";
  } else if (activeIng.includes('bismuth subsalicylate')) {
    matchedIndication = "ใช้บรรเทาอาการท้องเสียเฉียบพลัน ท้องร่วง แน่นท้อง ท้องอืด ท้องเฟ้อ อาหารไม่ย่อย หรือมีอาการแสบร้อนกลางอก (ยาลดกรดและเคลือบกระเพาะอาหาร/บรรเทาท้องเสีย)";
    matchedInstructions = `${dynamicInstructions}\n• สำหรับยารับประทานชนิดเม็ด: ควรเคี้ยวเม็ดยาให้ละเอียดก่อนกลืน\n• สำหรับยารับประทานชนิดยาน้ำ: ควรเขย่าขวดให้ตัวยาเข้ากันดีก่อนรินยารับประทาน\n• รับประทานตามขนาดที่ระบุบนฉลากทุกๆ 30 นาทีถึง 1 ชั่วโมงเมื่อมีอาการ (สูงสุดไม่เกิน 8 ครั้งใน 24 ชั่วโมง)`;
    matchedAdverse = "อาจทำให้ลิ้นหรืออุจจาระเปลี่ยนเป็นสีดำคล้ำชั่วคราว ซึ่งเกิดจากปฏิกิริยาของตัวยากับกำมะถันในระบบทางเดินอาหาร เป็นอาการปกติและไม่เป็นอันตราย จะหายไปเองหลังหยุดยา";
    matchedContra = "ห้ามใช้ในเด็กหรือวัยรุ่นที่มีไข้หรือมีอาการของไข้หวัดใหญ่/ไข้อีสุกอีใส (เนื่องจากเสี่ยงต่อการเกิดภาวะ Reye's Syndrome ซึ่งเป็นอันตรายต่อสมองและตับ)\n• ห้ามใช้ในผู้ที่มีประวัติแพ้ยาแอสไพริน (Aspirin) หรือสารกลุ่มซาลิไซเลต (Salicylates)";
  } else if (activeIng.includes('alginic acid') || activeIng.includes('sodium alginate') || activeIng.includes('aluminium hydroxide') || activeIng.includes('magnesium carbonate')) {
    matchedIndication = "ใช้บรรเทาอาการแสบร้อนกลางอกและอาหารไม่ย่อยอันเนื่องมาจากโรคกรดไหลย้อน (GERD) หรือลดกรดเคลือบกระเพาะอาหาร";
    matchedInstructions = `${dynamicInstructions}\n• ยาชนิดเม็ดเคี้ยว: ต้องเคี้ยวเม็ดยาให้ละเอียดทุกครั้งก่อนกลืน\n• ยาชนิดน้ำแขวนตะกอน: ควรรับประทานหลังอาหารทันทีและก่อนนอน หรือตามความถี่ที่แพทย์กำหนด`;
    matchedAdverse = "อาจเกิดอาการท้องผูกหรือท้องเสียชั่วคราวจากการออกฤทธิ์ของเกลืออะลูมิเนียมและแมกนีเซียม";
    matchedContra = "หลีกเลี่ยงในผู้ที่แพ้ส่วนประกอบของยานี้ และควรเพิ่มความระมัดระวังในผู้ป่วยโรคไตหรือโรคหัวใจที่ต้องจำกัดปริมาณโซเดียมในอาหาร";
  } else if (activeIng.includes('chlorpheniramine') || activeIng.includes('cetirizine') || activeIng.includes('loratadine') || activeIng.includes('fexofenadine')) {
    matchedIndication = "ยาลดน้ำมูกและแก้แพ้ บรรเทาอาการแพ้ เช่น จาม น้ำมูกไหล ผื่นคัน ลมพิษ หรือคันตาจากอาการแพ้";
    matchedInstructions = `${dynamicInstructions}\n• รับประทานตามขนาดยาที่ระบุบนฉลาก (ยาแก้แพ้กลุ่มเก่าอาจทำให้ง่วงซึมมาก ควรหลีกเลี่ยงการขับรถขณะทาน)`;
    matchedAdverse = "อาจทำให้เกิดอาการง่วงซึม ปากแห้ง คอแห้ง ตาพร่ามัว หรือปัสสาวะขัด";
    matchedContra = "ห้ามใช้ในผู้ที่แพ้ยากลุ่มนี้ และควรระมัดระวังในผู้ป่วยโรคต้อหิน ต่อมลูกหมากโต หรือมีปัญหาระบบทางเดินปัสสาวะ";
  } else if (activeIng.includes('amoxicillin') || activeIng.includes('roxithromycin') || activeIng.includes('azithromycin') || activeIng.includes('cephalexin')) {
    matchedIndication = "ยาปฏิชีวนะ (ฆ่าเชื้อแบคทีเรีย) รักษาการติดเชื้อแบคทีเรีย เช่น การติดเชื้อทางเดินหายใจ ผิวหนัง หรือทางเดินปัสสาวะ (ไม่ใช่ยาแก้ปากอักเสบจากไวรัส)";
    matchedInstructions = `${dynamicInstructions}\n• ต้องรับประทานยาติดต่อกันจนครบกำหนดตามแพทย์หรือเภสัชกรสั่งอย่างเคร่งครัด แม้อาการจะดีขึ้นแล้ว เพื่อป้องกันการดื้อยาของเชื้อแบคทีเรีย`;
    matchedAdverse = "อาจมีอาการท้องเสีย ถ่ายเหลว คลื่นไส้ อาเจียน หรือมีผื่นคันตามผิวหนัง";
    matchedContra = "ห้ามใช้ในผู้ที่มีประวัติเคยแพ้ยาในกลุ่มเพนิซิลลิน (Penicillins) หรือยากลุ่มเซฟาโลสปอริน (Cephalosporins) อย่างเด็ดขาด";
  } else if (activeIng.includes('ibuprofen') || activeIng.includes('diclofenac') || activeIng.includes('mefenamic') || activeIng.includes('naproxen') || activeIng.includes('celecoxib')) {
    matchedIndication = "ยาบรรเทาอาการปวดและลดการอักเสบที่ไม่ใช่สเตียรอยด์ (NSAIDs) บรรเทาอาการปวดระดับปานกลาง เช่น ปวดข้อ ปวดฟัน ปวดกล้ามเนื้อ หรือปวดประจำเดือน และช่วยลดไข้";
    matchedInstructions = `${dynamicInstructions}\n• ควรรับประทานทันทีหลังอาหารทันที (หรือพร้อมอาหาร) และดื่มน้ำตามมากๆ เพื่อช่วยป้องกันการระคายเคืองหรือเกิดแผลในกระเพาะอาหาร`;
    matchedAdverse = "ระคายเคืองกระเพาะอาหาร ปวดท้อง แน่นท้อง ท้องอืด หรืออาจเกิดแผลในกระเพาะอาหารหากรับประทานติดต่อกันเป็นเวลานาน";
    matchedContra = "ห้ามใช้ในผู้ที่เป็นโรคแผลในกระเพาะอาหารขั้นรุนแรง มีภาวะเลือดออกง่าย และระวังห้ามใช้ปะปนกับยาแก้ปวดกลุ่ม NSAIDs ตัวอื่น";
  } else if (activeIng.includes('omeprazole') || activeIng.includes('pantoprazole') || activeIng.includes('rabeprazole') || activeIng.includes('ranitidine') || activeIng.includes('cimetidine') || activeIng.includes('famotidine')) {
    matchedIndication = "ยาลดการหลั่งกรดในกระเพาะอาหาร รักษาแผลในกระเพาะอาหารและลำไส้เล็ก บรรเทาอาการและรักษาโรคกรดไหลย้อน (GERD)";
    matchedInstructions = `${dynamicInstructions}\n• แนะนำให้รับประทานตอนท้องว่าง (ดีที่สุดคือช่วงเช้าก่อนอาหาร 30 นาทีถึง 1 ชั่วโมง) เพื่อการดูดซึมยาที่มีประสิทธิภาพสูงสุด`;
    matchedAdverse = "อาจมีอาการปวดศีรษะ เวียนศีรษะ ท้องเสีย หรือท้องผูกชั่วคราว";
    matchedContra = "ห้ามใช้ในผู้ที่มีประวัติแพ้ยาในกลุ่มยาลดกรดประเภท PPIs (Proton Pump Inhibitors) หรือ H2-Blockers";
  } else if (activeIng.includes('clobetasol') || activeIng.includes('triamcinolone') || activeIng.includes('hydrocortisone') || activeIng.includes('betamethasone')) {
    matchedIndication = "ยาทาสเตียรอยด์ภายนอก บรรเทาอาการอักเสบ คัน บวมแดง ของผิวหนังจากผื่นแพ้ ผิวหนังอักเสบ หรือผื่นสะเก็ดเงิน";
    matchedInstructions = `${dynamicInstructions}\n• ทาบางๆ บริเวณผิวหนังที่มีอาการ วันละ 1-2 ครั้ง ไม่ควรทาหนาหรือปิดแผลโดยไม่ได้รับคำสั่งจากแพทย์\n• ห้ามทาติดต่อกันยาวนานเกิน 2 สัปดาห์เว้นแต่แพทย์สั่ง`;
    matchedAdverse = "หากใช้ต่อเนื่องยาวนานอาจทำให้ผิวหนังบริเวณที่ทาบางลง เกิดรอยแตก เส้นเลือดฝอยขยายตัว หรือเกิดสิวสเตียรอยด์";
    matchedContra = "ห้ามทาบนแผลเปิด แผลมีหนองติดเชื้อแบคทีเรีย เชื้อรา หรือโรคผิวหนังจากไวรัส (เช่น เริม งูสวัด) และหลีกเลี่ยงการทาบริเวณใบหน้า";
  } else if (activeIng.includes('warfarin') || activeIng.includes('clopidogrel') || activeIng.includes('heparin') || activeIng.includes('aspirin')) {
    matchedIndication = "ยาต้านการแข็งตัวของเลือด หรือยาต้านเกล็ดเลือด ป้องกันการอุดตันของลิ่มเลือดในหลอดเลือดและหัวใจ ลดความเสี่ยงภาวะหัวใจขาดเลือดหรือโรคหลอดเลือดสมองอุดตัน";
    matchedInstructions = `${dynamicInstructions}\n• ต้องรับประทานยาในปริมาณและตามเวลาที่แพทย์กำหนดอย่างเคร่งครัด ห้ามปรับขนาดยา หรือหยุดรับประทานยาด้วยตนเองเด็ดขาด`;
    matchedAdverse = "อาจเกิดภาวะเลือดออกง่ายและหยุดไหลช้ากว่าปกติ เช่น เลือดกำเดาไหล จ้ำเลือดตามผิวหนัง หรือมีเลือดปนในปัสสาวะ/อุจจาระ หากมีเลือดออกรุนแรงควรรีบพบแพทย์";
    matchedContra = "ห้ามใช้ในผู้ที่มีภาวะเลือดออกในสมองหรืออวัยวะภายในอย่างรุนแรง มีประวัติแพ้ยานี้ หรือสตรีมีครรภ์ (สำหรับยาวาร์ฟาริน)";
  } else if (activeIng.includes('amlodipine') || activeIng.includes('nifedipine') || activeIng.includes('diltiazem') || activeIng.includes('verapamil') || activeIng.includes('felodipine') || activeIng.includes('enalapril') || activeIng.includes('lisinopril') || activeIng.includes('captopril')) {
    matchedIndication = "ยารักษาโรคความดันโลหิตสูง บรรเทาอาการเจ็บแน่นหน้าอก หรือควบคุมจังหวะการเต้นของหัวใจให้สม่ำเสมอ";
    matchedInstructions = `${dynamicInstructions}\n• ควรรับประทานอย่างต่อเนื่องสม่ำเสมอทุกวันตามขนาดแพทย์กำหนด ห้ามหยุดยาเองกะทันหันเนื่องจากอาจเกิดภาวะความดันโลหิตสูงขึ้นอย่างเฉียบพลัน (Rebound Hypertension)`;
    matchedAdverse = "อาจมีอาการปวดศีรษะ เวียนศีรษะชั่วคราว หน้าแดงร้อนวูบวาบ อาการข้อเท้าบวมน้ำ (กลุ่มแคลเซียมแชนแนลบล็อกเกอร์) หรืออาการไอแห้งไม่มีเสมหะ (กลุ่ม ACE-Inhibitors)";
    matchedContra = "ห้ามใช้ในผู้ที่มีประวัติแพ้ยากลุ่มนี้ หรือผู้ที่มีภาวะช็อกการทำงานของหัวใจ หรือสตรีมีครรภ์";
  }

  const cleanGeneric = drug.a ? drug.a : 'ไม่ระบุชื่อยาสามัญ';

  return {
    thaiGeneric: `${cleanGeneric} (รหัสมาตรฐาน TMT)`,
    category: dynamicCategory,
    indications: matchedIndication || `ใช้บรรเทาหรือรักษาโรคตามข้อบ่งชี้ทางเภสัชกรรมของตัวยา ${cleanGeneric} ภายใต้การควบคุมของแพทย์หรือเภสัชกร`,
    instructions: matchedInstructions || dynamicInstructions,
    adverseEffects: matchedAdverse || `อาจเกิดอาการไม่พึงประสงค์เฉพาะบุคคล เช่น ผื่นคัน คลื่นไส้ หรือวิงเวียนศีรษะ หากมีอาการรุนแรงควรหยุดยาและพบแพทย์ทันที`,
    contraindications: matchedContra || `ห้ามใช้ในผู้ที่มีประวัติเคยแพ้ยา ${cleanGeneric} หรือส่วนประกอบของยานี้ หรือมีข้อห้ามใช้ทางการแพทย์อื่นๆ`,
    precautions: dynamicPrecautions,
    storage: dynamicStorage,
    isFallback: true
  };
};
