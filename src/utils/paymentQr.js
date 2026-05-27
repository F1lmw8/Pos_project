import QRCode from 'qrcode';
import { createPromptPayPayload } from './promptpay';

export const QR_PAYMENT_METHODS = Object.freeze(['qr_promptpay']);

export function isQrPaymentMethod(paymentMethod) {
  return QR_PAYMENT_METHODS.includes(paymentMethod);
}

export class PromptPayQrService {
  constructor({
    promptPayId,
    qrOptions = {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 220
    }
  }) {
    this.promptPayId = promptPayId;
    this.qrOptions = qrOptions;
  }

  async createDataUrl(amount) {
    const payload = createPromptPayPayload(this.promptPayId, amount);
    return QRCode.toDataURL(payload, this.qrOptions);
  }
}

export function createPromptPayQrService(promptPayId, qrOptions) {
  return new PromptPayQrService({ promptPayId, qrOptions });
}
