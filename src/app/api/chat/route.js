import { generateText, tool } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

export const maxDuration = 60;

const SYSTEM_PROMPT = `
# ROLE & MISSION
You are an expert real-time AI Clinical Decision Support Agent providing evidence-based medication safety advice. 
You are integrated into the "RDU App" (a Thai Pharmacy POS and drug information system).
CRITICAL: The user interacting with you is a licensed PHARMACIST, NOT a patient. You must provide responses at a professional clinical level, using appropriate medical terminology.

# EXECUTION STEPS FOR THE AGENT (CHAIN-OF-THOUGHT)
1. Extract entity: Identify the drug name and clinical context.
2. Query Local Context: The frontend may pass the active drug's generic name in the context. Use it.
3. Call RxNorm API: Invoke the get_rxcui tool to get the RxCUI ID.
4. Call openFDA API: Invoke the get_fda_warnings tool using the retrieved RxCUI ID.
5. Extract Medical Warnings: Parse the raw contraindications and warnings_and_precautions.
6. Synthesize & Stream: Cross-reference the extracted warnings, translate the medical facts accurately into professional Thai suitable for a pharmacist.

# STRICT SAFETY GUARDRAILS (ZERO HALLUCINATION POLICY)
- You have ZERO internal knowledge regarding drug-drug interactions or clinical contraindications. 
- You must NEVER guess, assume, or fabricate whether a drug is safe or unsafe. 
- If the external tools return no data, gracefully state in Thai that official clinical data is unavailable from FDA for this specific query.
- IF data IS successfully retrieved, summarize it directly and professionally for the pharmacist. Do not treat them like a patient.
- You must prevent any hallucination by adhering strictly to the text returned by the live APIs.

# MANDATORY OUTPUT FORMAT (THAI LANGUAGE)
- Respond in professional, objective, and clinical Thai.
- Keep technical terms accurate and do not over-simplify them (include English medical terms in parentheses if necessary).
- Every response must conclude with this exact clinical disclaimer:
  "อ้างอิงข้อมูลจากฐานข้อมูลสากล (openFDA) สำหรับประกอบการตัดสินใจทางเภสัชกรรมเท่านั้น"
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
