import { generateText, tool } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import pool from '../../../utils/db';

export const maxDuration = 60;

const SYSTEM_PROMPT = `
# ROLE & MISSION
You are an expert real-time AI Clinical Decision Support Agent providing evidence-based medication safety advice. 
You are integrated into the "RDU App" (a Thai Pharmacy POS and drug information system).
CRITICAL: The user interacting with you is a licensed PHARMACIST, NOT a patient. You must provide responses at a professional clinical level, using appropriate medical terminology.

# EXECUTION STEPS FOR THE AGENT (CHAIN-OF-THOUGHT)
1. Extract entity: Identify the drug name, symptoms, or clinical query.
2. Query Local Store Inventory: Refer to the REAL-TIME STORE INVENTORY list injected below.
3. Priority Recommendation: Always prioritize recommending medications THAT ARE CURRENTLY IN STOCK in the pharmacy store! State the Trade Name, Active Ingredient, dosage, and stock quantity available.
4. Call RxNorm / openFDA when checking specific drug safety or warnings.
5. Synthesize & Stream: Translate medical facts accurately into professional Thai suitable for a pharmacist.

# STRICT SAFETY GUARDRAILS
- Always provide evidence-based clinical rationale.
- When recommending drugs for symptoms (e.g. burns, fever, pain, GERD, allergies), check the store inventory list first and highlight matching in-stock products.
`;

export async function POST(req) {
  try {
    const { messages, drugContext } = await req.json();

    let initialMessages = messages;
    if (drugContext && drugContext.a && messages.length > 0) {
      const lastMsg = initialMessages[initialMessages.length - 1];
      if (lastMsg.role === 'user') {
        lastMsg.content = `[System Note: The user is currently viewing the drug Trade Name: "${drugContext.t}", Generic Name/Active Ingredient: "${drugContext.a}". Focus the safety checks on this drug if not otherwise specified in their query.]\n\nUser Query: ${lastMsg.content}`;
      }
    }
    let systemPromptToUse = SYSTEM_PROMPT;

    // Fetch Live Store Inventory Stock from PostgreSQL Database
    try {
      const stockRes = await pool.query(`
        SELECT d.tmt_id, d.trade_name, d.active_ingredient, d.strength, d.unit, d.dosage_form, d.drug_type,
               COALESCE(i.stock_quantity, 0) as stock_quantity, COALESCE(i.price, 0) as price
        FROM drugs d
        LEFT JOIN inventory i ON d.tmt_id = i.drug_id
        WHERE d.fda_status <> 'deleted'
        ORDER BY i.stock_quantity DESC
      `);

      if (stockRes.rows.length > 0) {
        const stockSummaryText = stockRes.rows.map(item =>
          `- ${item.trade_name} (ตัวยา: ${item.active_ingredient} ${item.strength || ''}) [คงเหลือ: ${item.stock_quantity} ${item.unit || 'ชิ้น'}, ราคา: ฿${parseFloat(item.price).toFixed(2)}]`
        ).join('\n');

        systemPromptToUse += `\n\n# REAL-TIME PHARMACY STORE INVENTORY (รายการยาและสินค้าที่มีจริงในคลังร้าน ณ ปัจจุบัน):\n` +
          `เมื่อเภสัชกรสอบถามข้อแนะนำการจ่ายยา อาการป่วย หรือเคสผู้ป่วย (เช่น โดนน้ำร้อนลวก, ปวดศีรษะ, กรดไหลย้อน, ผื่นคัน ฯลฯ) ` +
          `ให้ทำการวิเคราะห์เคสและแนะนำยารักษาที่เหมาะสม "โดยเลือกแนะนำยาที่มีอยู่ในคลังร้านตามรายการข้างล่างนี้เป็นอันดับแรกเสมอ" ` +
          `ระบุชื่อทางการค้า (Trade Name), ตัวยาสำคัญ (Active Ingredient), ขนาด/ความแรง, และจำนวนคงเหลือที่มีในคลังอย่างชัดเจน:\n\n` +
          stockSummaryText;
      }
    } catch (dbErr) {
      console.error('Failed to query store inventory for AI:', dbErr);
    }

    // Pre-fetch FDA data to bypass AI tool-calling bugs in Gemini 3.1 Flash Lite
    if (drugContext && drugContext.a) {
      const nameToSearch = drugContext.a;
      console.log(`Pre-fetching RxCUI for ${nameToSearch}...`);
      try {
        const rxcuiRes = await fetch(`https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(nameToSearch)}`);
        if (rxcuiRes.ok) {
          const rxcuiData = await rxcuiRes.json();
          const conceptGroup = rxcuiData.approximateGroup?.candidate;
          if (conceptGroup && conceptGroup.length > 0) {
            const rxcui = conceptGroup[0].rxcui;
            let stdName = nameToSearch;
            
            try {
              const propRes = await fetch(`https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/properties.json`);
              if (propRes.ok) {
                const propData = await propRes.json();
                if (propData.properties && propData.properties.name) {
                  stdName = propData.properties.name;
                }
              }
            } catch (e) { console.error('Prop fetch error', e); }

            console.log(`Pre-fetching FDA warnings for RxCUI: ${rxcui} / ${stdName}...`);
            let fdaRes = await fetch(`https://api.fda.gov/drug/label.json?search=openfda.rxcui:${rxcui}`);
            if (!fdaRes.ok && stdName) {
              console.log(`RxCUI failed, falling back to generic_name: ${stdName}`);
              fdaRes = await fetch(`https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(stdName)}"`);
            }
            if (fdaRes.ok) {
              const fdaData = await fdaRes.json();
              if (fdaData.results && fdaData.results.length > 0) {
                const fdaResult = fdaData.results[0];
                const warningsData = {
                  contraindications: fdaResult.contraindications || [],
                  warnings_and_precautions: fdaResult.warnings_and_precautions || [],
                  boxed_warning: fdaResult.boxed_warning || [],
                  indications_and_usage: fdaResult.indications_and_usage || []
                };
                
                // Inject into system prompt
                systemPromptToUse += `\n\n# CLINICAL DATA FOR CURRENT DRUG (${stdName}):\n` +
                  `Below is the official FDA data retrieved for this drug. Use this to answer the user's queries:\n` +
                  JSON.stringify(warningsData, null, 2);
              }
            }
          }
        }
      } catch (err) {
        console.error('Pre-fetch error:', err);
      }
    }

    const result = await generateText({
      model: google('gemini-3.1-flash-lite-preview'),
      system: systemPromptToUse,
      messages: initialMessages,
    });

    return new Response(JSON.stringify({ text: result.text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
