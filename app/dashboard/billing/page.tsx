'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  Download,
  Printer,
  CreditCard,
  Ban,
  Edit3,
  X,
} from 'lucide-react';
import { useMedoraStore } from '@/stores/useMedoraStore';
import { Invoice, InvoiceStatus, PaymentMethod } from '@/types/medora';
import { InvoiceStatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency } from '@/lib/calculations/billing';
import { downloadInvoicePDF } from '@/lib/pdf/generator';
import { DEMO_TODAY } from '@/lib/seed/generator';

export default function ClinicBillingPage() {
  const {
    dataset,
    settings,
    setQuickDialog,
    recordPayment,
    voidInvoice,
    updateDraftInvoice,
  } = useMedoraStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceStatus>('all');
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Simulated Card');
  const [payNotes, setPayNotes] = useState('Simulated outpatient payment');

  const [editingDraft, setEditingDraft] = useState<Invoice | null>(null);
  const [draftDiscount, setDraftDiscount] = useState(0);
  const [draftTax, setDraftTax] = useState(0);

  const patientMap = useMemo(
    () => new Map(dataset.patients.map((p) => [p.id, p])),
    [dataset.patients]
  );

  const filteredInvoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return dataset.invoices.filter((inv) => {
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
      if (q) {
        const pat = patientMap.get(inv.patientId);
        const hay = `${inv.invoiceNumber} ${inv.id} ${pat?.fullName ?? ''} ${
          inv.lines[0]?.description ?? ''
        }`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [dataset.invoices, statusFilter, searchQuery, patientMap]);

  const financialTotals = useMemo(() => {
    let billed = 0;
    let collected = 0;
    let outstanding = 0;
    for (const inv of dataset.invoices) {
      if (inv.status !== 'Voided') {
        billed += inv.totalAmount;
        collected += inv.amountPaid;
        outstanding += inv.outstandingBalance;
      }
    }
    return { billed, collected, outstanding };
  }, [dataset.invoices]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#173042] dark:text-white">
            Clinic Billing Workspace
          </h1>
          <p className="text-xs text-[#64748B] dark:text-[#9BB0BE] mt-0.5">
            Powered by decimal.js calculation engine · Simulated non-financial demonstration records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-white dark:bg-[#172B39] text-xs font-medium"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Ledger</span>
          </button>
          <button
            onClick={() => setQuickDialog('create_invoice')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0891B2] hover:bg-cyan-700 text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B]">
          <div className="text-xs text-slate-500">
            Total Billed (Non-Voided)
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums mt-1">
            {formatCurrency(financialTotals.billed, settings.currency)}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B]">
          <div className="text-xs text-slate-500">
            Collected Simulated Payments
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 mt-1">
            {formatCurrency(financialTotals.collected, settings.currency)}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B]">
          <div className="text-xs text-slate-500">Outstanding Balance</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 mt-1">
            {formatCurrency(financialTotals.outstanding, settings.currency)}
          </div>
        </div>
      </div>

      {/* Search & Status Filter */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice number (INV-2026-...), patient, or service..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-slate-50 dark:bg-[#11202D]"
          />
        </div>

        <select
          aria-label="Filter by invoice status"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as 'all' | InvoiceStatus)
          }
          className="px-3 py-2 text-xs rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
        >
          <option value="all">All Invoice Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Issued">Issued</option>
          <option value="Partially Paid">Partially Paid</option>
          <option value="Paid">Paid</option>
          <option value="Voided">Voided</option>
        </select>
      </div>

      {/* Invoices Table */}
      <div className="rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2EAF0] dark:border-[#304B5B] bg-slate-50/70 dark:bg-[#11202D] text-[#64748B] dark:text-[#9BB0BE]">
                <th className="py-3 px-3 font-medium">Invoice #</th>
                <th className="py-3 px-3 font-medium">Patient</th>
                <th className="py-3 px-3 font-medium">Service Snapshot</th>
                <th className="py-3 px-3 font-medium">Issue / Due</th>
                <th className="py-3 px-3 font-medium text-right">Subtotal</th>
                <th className="py-3 px-3 font-medium text-right">Disc / Tax</th>
                <th className="py-3 px-3 font-medium text-right">Total</th>
                <th className="py-3 px-3 font-medium text-right">Paid</th>
                <th className="py-3 px-3 font-medium text-right">Balance</th>
                <th className="py-3 px-3 font-medium">Status</th>
                <th className="py-3 px-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#304B5B]">
              {filteredInvoices.slice(0, 40).map((inv) => {
                const pat = patientMap.get(inv.patientId);
                return (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#203847]/60"
                  >
                    <td className="py-2.5 px-3 font-mono font-semibold text-[#0891B2] dark:text-[#22D3EE]">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-2.5 px-3">
                      <Link
                        href={`/dashboard/patients/${inv.patientId}`}
                        className="font-medium text-slate-900 dark:text-white hover:text-[#0891B2]"
                      >
                        {pat?.fullName ?? inv.patientId}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 max-w-[180px] truncate text-slate-600 dark:text-slate-300">
                      {inv.lines[0]?.description ?? 'Outpatient Service'}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-[11px]">
                      <div>{inv.issueDate}</div>
                      <div className="text-slate-400">Due {inv.dueDate}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {formatCurrency(inv.subtotal, settings.currency)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[11px] text-slate-500">
                      -{formatCurrency(inv.discountTotal, settings.currency)} / +
                      {formatCurrency(inv.taxAmount, settings.currency)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold">
                      {formatCurrency(inv.totalAmount, settings.currency)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-600">
                      {formatCurrency(inv.amountPaid, settings.currency)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold">
                      {formatCurrency(inv.outstandingBalance, settings.currency)}
                    </td>
                    <td className="py-2.5 px-3">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {inv.outstandingBalance > 0 &&
                          inv.status !== 'Voided' && (
                            <button
                              onClick={() => {
                                setPayingInvoice(inv);
                                setPayAmount(inv.outstandingBalance);
                              }}
                              className="px-2 py-1 rounded bg-[#0891B2] text-white font-medium"
                              title="Record simulated payment"
                            >
                              Pay
                            </button>
                          )}

                        {(inv.status === 'Draft' ||
                          (inv.status === 'Issued' && inv.amountPaid === 0)) && (
                          <button
                            onClick={() => {
                              setEditingDraft(inv);
                              setDraftDiscount(
                                inv.lines[0]?.discountAmount ?? 0
                              );
                              setDraftTax(inv.taxRatePercent);
                            }}
                            className="p-1.5 rounded border border-slate-200 dark:border-[#304B5B]"
                            title="Edit invoice discount/tax"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {inv.amountPaid === 0 && inv.status !== 'Voided' && (
                          <button
                            onClick={() => {
                              const r = voidInvoice(inv.id);
                              if (r.success) {
                                toast.info(`Voided ${inv.invoiceNumber}`);
                              } else {
                                toast.error(r.error);
                              }
                            }}
                            className="p-1.5 rounded border border-slate-200 dark:border-[#304B5B] text-rose-600"
                            title="Void invoice"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            downloadInvoicePDF({
                              invoice: inv,
                              patient: pat,
                              payments: dataset.payments.filter(
                                (p) => p.invoiceId === inv.id
                              ),
                              settings,
                            });
                            toast.success(`Downloaded ${inv.invoiceNumber}.pdf`);
                          }}
                          className="p-1.5 rounded border border-slate-200 dark:border-[#304B5B]"
                          title="Download Invoice PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {payingInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-[#172B39] border border-slate-200 dark:border-[#304B5B] p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#304B5B]">
              <div>
                <span className="font-mono text-[#0891B2]">
                  {payingInvoice.invoiceNumber}
                </span>
                <h2 className="text-base font-bold">
                  Record Simulated Payment
                </h2>
              </div>
              <button onClick={() => setPayingInvoice(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const res = recordPayment({
                  invoiceId: payingInvoice.id,
                  amount: Number(payAmount),
                  paymentDate: DEMO_TODAY,
                  method: payMethod,
                  notes: payNotes,
                });
                if (!res.success) {
                  toast.error(res.error || 'Payment allocation failed.');
                  return;
                }
                toast.success(
                  `Recorded payment ${res.payment?.paymentReference} ($${Number(
                    payAmount
                  ).toFixed(2)})`
                );
                setPayingInvoice(null);
              }}
            >
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#11202D] flex justify-between">
                <span>Outstanding Balance:</span>
                <strong className="font-mono tabular-nums">
                  {formatCurrency(
                    payingInvoice.outstandingBalance,
                    settings.currency
                  )}
                </strong>
              </div>

              <div>
                <label className="block font-medium mb-1">
                  Payment Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0.01}
                  max={payingInvoice.outstandingBalance}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D] font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">
                  Simulated Payment Method
                </label>
                <select
                  value={payMethod}
                  onChange={(e) =>
                    setPayMethod(e.target.value as PaymentMethod)
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                >
                  <option value="Simulated Card">Simulated Card</option>
                  <option value="Simulated Bank Transfer">
                    Simulated Bank Transfer
                  </option>
                  <option value="Simulated Clinic Account">
                    Simulated Clinic Account
                  </option>
                  <option value="Simulated Cash Receipt">
                    Simulated Cash Receipt
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Receipt Notes</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setPayingInvoice(null)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0891B2] text-white font-semibold"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Confirm Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Draft Invoice Modal */}
      {editingDraft && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-[#172B39] border border-slate-200 dark:border-[#304B5B] p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#304B5B]">
              <h2 className="text-base font-bold">
                Edit Invoice ({editingDraft.invoiceNumber})
              </h2>
              <button onClick={() => setEditingDraft(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const updatedLines = editingDraft.lines.map((l, idx) =>
                  idx === 0 ? { ...l, discountAmount: Number(draftDiscount) } : l
                );
                const r = updateDraftInvoice(editingDraft.id, {
                  lines: updatedLines,
                  taxRatePercent: Number(draftTax),
                  status: 'Issued',
                });
                if (r.success) {
                  toast.success(`Updated ${editingDraft.invoiceNumber}`);
                  setEditingDraft(null);
                } else {
                  toast.error(r.error);
                }
              }}
            >
              <div>
                <label className="block font-medium mb-1">
                  Line Discount ($)
                </label>
                <input
                  type="number"
                  min={0}
                  value={draftDiscount}
                  onChange={(e) => setDraftDiscount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D] font-mono"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  min={0}
                  max={25}
                  step="0.5"
                  value={draftTax}
                  onChange={(e) => setDraftTax(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D] font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingDraft(null)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-lg bg-[#0891B2] text-white font-semibold"
                >
                  Recalculate &amp; Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
