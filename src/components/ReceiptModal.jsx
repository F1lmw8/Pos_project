'use client';

import React from 'react';
import { Printer, CheckCircle2, X } from 'lucide-react';

export default function ReceiptModal({ transaction, onClose }) {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = transaction.date
    ? new Date(transaction.date).toLocaleString('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : new Date().toLocaleString('th-TH');

  const paymentText =
    transaction.payment_method === 'cash'
      ? 'เงินสด'
      : transaction.payment_method === 'qr_promptpay'
      ? 'สแกน QR PromptPay'
      : 'บัตรเครดิต/เดบิต';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:bg-white">
      <div className="bg-white text-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 print:shadow-none print:border-none print:w-full">
        {/* Header (Hidden on Print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-600 text-white print:hidden">
          <div className="flex items-center gap-2 font-bold text-lg">
            <CheckCircle2 className="w-6 h-6 text-emerald-200" />
            <span>ชำระเงินสำเร็จ</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-emerald-700 transition-colors text-white"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 print:p-4 space-y-4">
          <div className="text-center pb-3 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">ร้านยารู้เรื่องยา RDU</h2>
            <p className="text-xs text-slate-500 mt-1">ใบรับเงิน / ใบกำกับภาษีอย่างย่อ</p>
            <p className="text-xs text-slate-500">เลขประจำตัวผู้เสียภาษี: 0105569000123</p>
            <p className="text-xs text-slate-400 mt-1">โทร: 02-123-4567 | มาตรฐาน GPP</p>
          </div>

          <div className="text-xs space-y-1 text-slate-600 border-b border-slate-200 pb-3">
            <div className="flex justify-between">
              <span className="font-medium">เลขที่บิล:</span>
              <span className="font-mono text-slate-900 font-bold">{transaction.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">วันที่-เวลา:</span>
              <span>{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">ชำระด้วย:</span>
              <span className="font-semibold text-emerald-700">{paymentText}</span>
            </div>
            {transaction.patient_name && (
              <div className="flex justify-between text-blue-700 font-medium pt-1">
                <span>ผู้ป่วย/ลูกค้า:</span>
                <span>{transaction.patient_name}</span>
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div className="py-2">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-2">รายการยา (Lot / Exp)</th>
                  <th className="pb-2 text-center">จำนวน</th>
                  <th className="pb-2 text-right">รวม (฿)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transaction.items?.map((item, idx) => (
                  <tr key={idx} className="py-1">
                    <td className="py-2 pr-2">
                      <div className="font-semibold text-slate-800">{item.trade_name}</div>
                      <div className="text-[10px] text-slate-400">
                        {item.lot_number ? `Lot: ${item.lot_number}` : ''} {item.unit ? `(${item.unit})` : ''}
                      </div>
                    </td>
                    <td className="py-2 text-center text-slate-700 font-medium">
                      x{item.quantity}
                    </td>
                    <td className="py-2 text-right font-semibold text-slate-900">
                      {Number(item.subtotal).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown */}
          <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>รวมเงินสุทธิ (Subtotal):</span>
              <span>฿{Number(transaction.subtotal || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>ภาษีมูลค่าเพิ่ม (VAT 7%):</span>
              <span>฿{Number(transaction.vat || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-300">
              <span>ยอดเงินรวมทั้งสิ้น:</span>
              <span className="text-emerald-700">฿{Number(transaction.total || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="text-center pt-4 text-[11px] text-slate-400 border-t border-dashed border-slate-200">
            <p>ขอบคุณที่ใช้บริการร้านยารู้เรื่องยา RDU</p>
            <p className="mt-0.5">กรุณาตรวจสอบรายการยาและคำแนะนำการใช้ยาก่อนออกจากร้าน</p>
          </div>
        </div>

        {/* Printable Footer Actions (Hidden on Print) */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ปิดหน้าต่าง
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์ใบเสร็จ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
