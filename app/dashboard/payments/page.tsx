'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Search, Download, RotateCcw } from 'lucide-react';
import { useMedoraStore } from '@/stores/useMedoraStore';
import { formatCurrency } from '@/lib/calculations/billing';
import { downloadCSVFile } from '@/lib/export/csv';

export default function PaymentRecordsPage() {
  const { dataset, settings, reversePayment } = useMedoraStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');

  const patientMap = useMemo(
    () => new Map(dataset.patients.map((p) => [p.id, p])),
    [dataset.patients]
  );
  const invoiceMap = useMemo(
    () => new Map(dataset.invoices.map((i) => [i.id, i])),
    [dataset.invoices]
  );

  const filteredPayments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return dataset.payments.filter((p) => {
      if (methodFilter !== 'all' && p.method !== methodFilter) return false;
      if (q) {
        const pat = patientMap.get(p.patientId);
        const inv = invoiceMap.get(p.invoiceId);
        const hay = `${p.paymentReference} ${p.id} ${
          inv?.invoiceNumber ?? ''
        } ${pat?.fullName ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [dataset.payments, methodFilter, searchQuery, patientMap, invoiceMap]);

  const handleExportCSV = () => {
    downloadCSVFile(
      'medora-payments.csv',
      [
        'Payment Reference',
        'Date',
        'Invoice Number',
        'Patient ID',
        'Patient Name',
        'Method',
        'Amount',
        'Status',
      ],
      filteredPayments.map((p) => [
        p.paymentReference,
        p.paymentDate,
        invoiceMap.get(p.invoiceId)?.invoiceNumber ?? p.invoiceId,
        p.patientId,
        patientMap.get(p.patientId)?.fullName ?? p.patientId,
        p.method,
        p.amount,
        p.isReversed ? 'Reversed' : 'Valid',
      ])
    );
    toast.success(`Exported ${filteredPayments.length} payment receipts to CSV.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#173042] dark:text-white">
            Simulated Payment Records
          </h1>
          <p className="text-xs text-[#64748B] dark:text-[#9BB0BE] mt-0.5">
            {filteredPayments.length} payment receipts · Reversing a payment immediately recalculates the linked invoice balance
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-white dark:bg-[#172B39] text-xs font-medium"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search receipt reference (RCPT-...), invoice number, or patient..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-slate-50 dark:bg-[#11202D]"
          />
        </div>

        <select
          aria-label="Filter by payment method"
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
        >
          <option value="all">All Payment Methods</option>
          <option value="Simulated Card">Simulated Card</option>
          <option value="Simulated Bank Transfer">
            Simulated Bank Transfer
          </option>
          <option value="Simulated Clinic Account">
            Simulated Clinic Account
          </option>
          <option value="Simulated Cash Receipt">Simulated Cash Receipt</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2EAF0] dark:border-[#304B5B] bg-slate-50/70 dark:bg-[#11202D] text-[#64748B] dark:text-[#9BB0BE]">
                <th className="py-3 px-3.5 font-medium">Reference</th>
                <th className="py-3 px-3.5 font-medium">Payment Date</th>
                <th className="py-3 px-3.5 font-medium">Related Invoice</th>
                <th className="py-3 px-3.5 font-medium">Fictional Patient</th>
                <th className="py-3 px-3.5 font-medium">Method Label</th>
                <th className="py-3 px-3.5 font-medium text-right">Amount</th>
                <th className="py-3 px-3.5 font-medium">State</th>
                <th className="py-3 px-3.5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#304B5B]">
              {filteredPayments.slice(0, 50).map((pay) => {
                const pat = patientMap.get(pay.patientId);
                const inv = invoiceMap.get(pay.invoiceId);
                return (
                  <tr
                    key={pay.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#203847]/60"
                  >
                    <td className="py-2.5 px-3.5 font-mono font-semibold text-[#0891B2] dark:text-[#22D3EE]">
                      {pay.paymentReference}
                    </td>
                    <td className="py-2.5 px-3.5 font-mono tabular-nums">
                      {pay.paymentDate}
                    </td>
                    <td className="py-2.5 px-3.5 font-mono">
                      <Link
                        href="/dashboard/billing"
                        className="hover:underline text-slate-800 dark:text-slate-200"
                      >
                        {inv?.invoiceNumber ?? pay.invoiceId}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3.5">
                      <Link
                        href={`/dashboard/patients/${pay.patientId}`}
                        className="font-medium text-slate-900 dark:text-white hover:text-[#0891B2]"
                      >
                        {pat?.fullName ?? pay.patientId}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3.5">{pay.method}</td>
                    <td
                      className={`py-2.5 px-3.5 text-right font-mono tabular-nums font-semibold ${
                        pay.isReversed
                          ? 'line-through text-slate-400'
                          : 'text-emerald-600'
                      }`}
                    >
                      {formatCurrency(pay.amount, settings.currency)}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          pay.isReversed
                            ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                      >
                        {pay.isReversed ? 'Reversed' : 'Posted'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      {!pay.isReversed && (
                        <button
                          onClick={() => {
                            const res = reversePayment(
                              pay.id,
                              'Reversed via Payment Workspace'
                            );
                            if (res.success) {
                              toast.info(
                                `Reversed payment ${pay.paymentReference} and updated invoice balance.`
                              );
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reverse</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
