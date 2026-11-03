import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import { CreditCard, CheckCircle2, AlertCircle, Clock, Plus, Search, DollarSign, X } from 'lucide-react';
import { FeeRecord } from '../../types';

export const AdminFees: React.FC = () => {
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Payment Recording Modal
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>('UPI');
  const [paymentRemarks, setPaymentRemarks] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const loadFees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/fees');
      setFees(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFees();
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFee || paymentAmount <= 0) return;

    setSubmitting(true);
    try {
      await api.put(`/admin/fees/${selectedFee.id}/record-payment`, {
        paidAmount: paymentAmount,
        paymentMode,
        remarks: paymentRemarks,
      });

      setSelectedFee(null);
      setPaymentAmount(0);
      setPaymentRemarks('');
      loadFees();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFees = fees.filter((f) => {
    const q = search.toLowerCase();
    return (
      f.invoiceNumber.toLowerCase().includes(q) ||
      f.student?.user.name.toLowerCase().includes(q) ||
      f.student?.rollNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Fee Management & Invoices</h1>
        <p className="text-xs text-slate-500">Track tuition installments, payment receipts, and balance status</p>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice, student or roll #..."
            className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs text-slate-700 focus:outline-none"
          />
        </div>
      </Card>

      {/* Fees Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-6">Invoice #</th>
                <th className="py-3.5 px-6">Student & Roll</th>
                <th className="py-3.5 px-6">Total Billed</th>
                <th className="py-3.5 px-6">Paid Amount</th>
                <th className="py-3.5 px-6">Balance Due</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading fee records...
                  </td>
                </tr>
              ) : filteredFees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No fee records found.
                  </td>
                </tr>
              ) : (
                filteredFees.map((fee) => {
                  const balance = fee.amount - fee.paidAmount;
                  return (
                    <tr key={fee.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-6 font-mono font-bold text-slate-700">
                        {fee.invoiceNumber}
                      </td>

                      <td className="py-3.5 px-6">
                        <p className="font-bold text-slate-800">{fee.student?.user.name}</p>
                        <p className="text-[10px] font-mono text-slate-400">{fee.student?.rollNumber}</p>
                      </td>

                      <td className="py-3.5 px-6 font-extrabold text-slate-800">
                        ₹{fee.amount.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-6 font-bold text-emerald-700">
                        ₹{fee.paidAmount.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-6 font-bold text-rose-600">
                        {balance > 0 ? `₹${balance.toLocaleString()}` : 'Cleared'}
                      </td>

                      <td className="py-3.5 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          fee.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : fee.status === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {fee.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-6">
                        {balance > 0 ? (
                          <button
                            onClick={() => {
                              setSelectedFee(fee);
                              setPaymentAmount(balance);
                            }}
                            className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all shadow-sm"
                          >
                            Collect Fee
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Fully Paid
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Record Payment Modal */}
      {selectedFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Record Fee Collection</h3>
                <p className="text-xs text-slate-400">Invoice: {selectedFee.invoiceNumber}</p>
              </div>
              <button
                onClick={() => setSelectedFee(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <p>Student: <strong>{selectedFee.student?.user.name}</strong> ({selectedFee.student?.rollNumber})</p>
              <p>Total Fee: ₹{selectedFee.amount.toLocaleString()} | Already Paid: ₹{selectedFee.paidAmount.toLocaleString()}</p>
              <p className="text-rose-600 font-bold">Outstanding Balance: ₹{(selectedFee.amount - selectedFee.paidAmount).toLocaleString()}</p>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Amount Received (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedFee.amount - selectedFee.paidAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-sm font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-semibold"
                >
                  <option value="UPI">UPI / QR Transfer</option>
                  <option value="ONLINE">Net Banking / Card</option>
                  <option value="CASH">Cash Desk</option>
                  <option value="CHEQUE">Bank Cheque</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Transaction ID / Remarks</label>
                <input
                  type="text"
                  value={paymentRemarks}
                  onChange={(e) => setPaymentRemarks(e.target.value)}
                  placeholder="e.g. UPI Ref #9812470123"
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedFee(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-500/20"
                >
                  {submitting ? 'Recording...' : 'Confirm Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

