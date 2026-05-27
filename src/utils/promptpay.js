const PROMPTPAY_APPLICATION_ID = 'A000000677010111';

function formatTlv(id, value) {
  const stringValue = String(value);
  return `${id}${String(stringValue.length).padStart(2, '0')}${stringValue}`;
}

export function normalizePromptPayId(promptPayId) {
  const digits = String(promptPayId).replace(/\D/g, '');

  if (digits.length === 10 && digits.startsWith('0')) {
    return {
      tag: '01',
      value: `0066${digits.slice(1)}`
    };
  }

  if (digits.length === 13) {
    return {
      tag: '02',
      value: digits
    };
  }

  if (digits.length === 15) {
    return {
      tag: '03',
      value: digits
    };
  }

  throw new Error('PromptPay ID must be a 10-digit phone number, 13-digit national ID, or 15-digit e-wallet ID');
}

function crc16Ccitt(payload) {
  let crc = 0xffff;

  for (let i = 0; i < payload.length; i += 1) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export class PromptPayPayloadBuilder {
  constructor({ applicationId = PROMPTPAY_APPLICATION_ID } = {}) {
    this.applicationId = applicationId;
  }

  createPayload(promptPayId, amount) {
    const normalized = normalizePromptPayId(promptPayId);
    const amountNumber = this.normalizeAmount(amount);

    const merchantAccount = [
      formatTlv('00', this.applicationId),
      formatTlv(normalized.tag, normalized.value)
    ].join('');

    const payloadWithoutCrc = [
      formatTlv('00', '01'),
      formatTlv('01', '12'),
      formatTlv('29', merchantAccount),
      formatTlv('53', '764'),
      formatTlv('54', amountNumber.toFixed(2)),
      formatTlv('58', 'TH'),
      '6304'
    ].join('');

    return `${payloadWithoutCrc}${crc16Ccitt(payloadWithoutCrc)}`;
  }

  normalizeAmount(amount) {
    const amountNumber = Number(amount);

    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      throw new Error('PromptPay amount must be greater than zero');
    }

    return amountNumber;
  }
}

export const promptPayPayloadBuilder = new PromptPayPayloadBuilder();

export function createPromptPayPayload(promptPayId, amount) {
  return promptPayPayloadBuilder.createPayload(promptPayId, amount);
}
