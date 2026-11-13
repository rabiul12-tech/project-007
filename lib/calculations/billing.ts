import Decimal from 'decimal.js';
import { Invoice, InvoiceLine, InvoiceStatus, Payment } from '@/types/medora';

/**
 * Billing Calculation Engine powered by decimal.js.
 *
 * Formulas:
 * - Line Amount = Quantity × Unit Price
 * - Taxable Amount = Line Amount − Applicable Discount
 * - Tax = Taxable Amount × (Configured Tax Rate / 100)
 * - Invoice Total = Sum of Taxable Amounts + Taxes
 * - Valid Payments = Sum of non-reversed Payments allocated to the Invoice
 * - Outstanding Balance = max(0, Invoice Total − Valid Payments)
 */

export interface ComputedLineMetrics {
  lineAmount: number;
  discountAmount: number;
  taxableAmount: number;
}

export interface ComputedInvoiceSummary {
  subtotal: number;
  discountTotal: number;
  taxableSubtotal: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  outstandingBalance: number;
  status: InvoiceStatus;
}

export function calculateLineMetrics(line: InvoiceLine): ComputedLineMetrics {
  const qty = new Decimal(Math.max(0, line.quantity || 0));
  const unitPrice = new Decimal(Math.max(0, line.unitPrice || 0));
  const rawDiscount = new Decimal(Math.max(0, line.discountAmount || 0));

  const lineAmount = qty.mul(unitPrice).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const discountAmount = Decimal.min(lineAmount, rawDiscount).toDecimalPlaces(
    2,
    Decimal.ROUND_HALF_UP
  );
  const taxableAmount = lineAmount
    .minus(discountAmount)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  return {
    lineAmount: lineAmount.toNumber(),
    discountAmount: discountAmount.toNumber(),
    taxableAmount: taxableAmount.toNumber(),
  };
}

export function calculateInvoiceSummary(params: {
  lines: InvoiceLine[];
  taxRatePercent: number;
  payments: Payment[];
  currentStatus?: InvoiceStatus;
}): ComputedInvoiceSummary {
  let subtotalDec = new Decimal(0);
  let discountTotalDec = new Decimal(0);
  let taxableSubtotalDec = new Decimal(0);

  for (const line of params.lines) {
    const metrics = calculateLineMetrics(line);
    subtotalDec = subtotalDec.plus(metrics.lineAmount);
    discountTotalDec = discountTotalDec.plus(metrics.discountAmount);
    taxableSubtotalDec = taxableSubtotalDec.plus(metrics.taxableAmount);
  }

  const taxRate = new Decimal(Math.max(0, params.taxRatePercent || 0)).div(100);
  const taxAmountDec = taxableSubtotalDec
    .mul(taxRate)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const totalAmountDec = taxableSubtotalDec
    .plus(taxAmountDec)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  // Sum only valid (non-reversed) payments
  let paidDec = new Decimal(0);
  for (const payment of params.payments) {
    if (!payment.isReversed && payment.amount > 0) {
      paidDec = paidDec.plus(new Decimal(payment.amount));
    }
  }
  paidDec = paidDec.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const rawBalance = totalAmountDec.minus(paidDec);
  const outstandingDec = Decimal.max(new Decimal(0), rawBalance).toDecimalPlaces(
    2,
    Decimal.ROUND_HALF_UP
  );

  let status: InvoiceStatus = params.currentStatus ?? 'Issued';

  if (params.currentStatus === 'Voided') {
    status = 'Voided';
  } else if (params.currentStatus === 'Draft' && paidDec.eq(0)) {
    status = 'Draft';
  } else if (totalAmountDec.gt(0) && outstandingDec.eq(0)) {
    status = 'Paid';
  } else if (paidDec.gt(0) && outstandingDec.gt(0)) {
    status = 'Partially Paid';
  } else {
    status = 'Issued';
  }

  return {
    subtotal: subtotalDec.toNumber(),
    discountTotal: discountTotalDec.toNumber(),
    taxableSubtotal: taxableSubtotalDec.toNumber(),
    taxAmount: taxAmountDec.toNumber(),
    totalAmount: totalAmountDec.toNumber(),
    amountPaid: paidDec.toNumber(),
    outstandingBalance: params.currentStatus === 'Voided' ? 0 : outstandingDec.toNumber(),
    status,
  };
}

/**
 * Validates whether a new payment can be recorded against an invoice.
 */
export function validatePaymentAllocation(
  invoice: Invoice,
  existingPayments: Payment[],
  paymentAmount: number
): { valid: boolean; error?: string } {
  if (invoice.status === 'Voided') {
    return { valid: false, error: 'Cannot record a payment on a voided invoice.' };
  }
  if (paymentAmount <= 0 || Number.isNaN(paymentAmount)) {
    return { valid: false, error: 'Payment amount must be greater than zero.' };
  }

  const summary = calculateInvoiceSummary({
    lines: invoice.lines,
    taxRatePercent: invoice.taxRatePercent,
    payments: existingPayments.filter((p) => p.invoiceId === invoice.id),
    currentStatus: invoice.status,
  });

  const payDec = new Decimal(paymentAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const balanceDec = new Decimal(summary.outstandingBalance).toDecimalPlaces(
    2,
    Decimal.ROUND_HALF_UP
  );

  if (payDec.gt(balanceDec)) {
    return {
      valid: false,
      error: `Payment amount ($${payDec.toFixed(2)}) exceeds the invoice outstanding balance ($${balanceDec.toFixed(2)}).`,
    };
  }

  return { valid: true };
}

export function formatCurrency(
  amount: number,
  currency = 'USD'
): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}
