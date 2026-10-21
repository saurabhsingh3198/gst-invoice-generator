import React, { useState } from 'react';
import {
  X,
  Users,
  Search,
  Plus,
  Trash2,
  Phone,
  MapPin,
} from 'lucide-react';
import {
  getSavedCustomers,
  saveCustomerToDirectory,
  deleteCustomerFromDirectory,
} from '../utils/customerMaster';
import type { CustomerTemplate } from '../utils/customerMaster';

interface CustomerMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (cust: CustomerTemplate) => void;
  currentBuyerName?: string;
}

export const CustomerMasterModal: React.FC<CustomerMasterModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomer,
  currentBuyerName,
}) => {
  const [customers, setCustomers] = useState<CustomerTemplate[]>(() => getSavedCustomers());
  const [search, setSearch] = useState(currentBuyerName || '');
  const [showAddForm, setShowAddForm] = useState(false);

  // New customer form state
  const [newCust, setNewCust] = useState<Omit<CustomerTemplate, 'id'>>({
    name: currentBuyerName || '',
    phone: '',
    gstin: '',
    address: '',
    stateName: 'Uttar Pradesh',
    stateCode: '09',
  });

  if (!isOpen) return null;

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)) ||
      (c.gstin && c.gstin.toLowerCase().includes(search.toLowerCase())) ||
      (c.address && c.address.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCust.name.trim()) return;

    let code = newCust.stateCode;
    if (newCust.gstin && newCust.gstin.length >= 2) {
      const parsed = newCust.gstin.slice(0, 2);
      if (/^\d{2}$/.test(parsed)) {
        code = parsed;
      }
    }

    const createdCustomer: CustomerTemplate = {
      id: `cust-${Date.now()}`,
      ...newCust,
      stateCode: code,
    };

    saveCustomerToDirectory(createdCustomer);

    setCustomers(getSavedCustomers());
    setShowAddForm(false);
    setNewCust({
      name: '',
      phone: '',
      gstin: '',
      address: '',
      stateName: 'Uttar Pradesh',
      stateCode: '09',
    });

    onSelectCustomer(createdCustomer);
    onClose();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this customer?')) {
      const updated = deleteCustomerFromDirectory(id);
      setCustomers(updated);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-red-50 text-[#DC2626] border border-red-100">
              <Users className="w-5 h-5 text-[#DC2626]" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                Customer & Party Master
              </h3>
              <p className="text-xs text-slate-500">
                1-click customer selection and auto-fill into invoice
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search + Add */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer by name, phone or GSTIN..."
              className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white text-slate-900 border border-slate-200 focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/10 rounded-xl outline-none font-semibold placeholder-slate-400 shadow-2xs transition"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2.5 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>{showAddForm ? 'Cancel' : '+ New Customer'}</span>
          </button>
        </div>

        {/* Add Customer Inline Form */}
        {showAddForm && (
          <form onSubmit={handleSaveNew} className="p-4 bg-red-50/30 border-b border-red-100 space-y-3">
            <h4 className="text-xs font-bold text-[#DC2626]">Add New Customer to Directory</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                placeholder="Party / Customer Name *"
                value={newCust.name}
                onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                className="px-3.5 py-2 text-xs bg-white text-slate-900 border border-slate-200 rounded-xl focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/10 placeholder-slate-400 outline-none font-semibold shadow-2xs transition"
                required
              />
              <input
                type="tel"
                placeholder="Mobile / WhatsApp Number"
                value={newCust.phone}
                onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                className="px-3.5 py-2 text-xs bg-white text-slate-900 border border-slate-200 rounded-xl focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/10 placeholder-slate-400 outline-none font-semibold shadow-2xs transition"
              />
              <input
                type="text"
                placeholder="GSTIN (Optional for B2C)"
                value={newCust.gstin}
                onChange={(e) => setNewCust({ ...newCust, gstin: e.target.value.toUpperCase() })}
                className="px-3.5 py-2 text-xs bg-white text-slate-900 border border-slate-200 rounded-xl uppercase focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/10 placeholder-slate-400 outline-none font-mono font-bold shadow-2xs transition"
              />
              <input
                type="text"
                placeholder="State Name (e.g. Uttar Pradesh)"
                value={newCust.stateName}
                onChange={(e) => setNewCust({ ...newCust, stateName: e.target.value })}
                className="px-3.5 py-2 text-xs bg-white text-slate-900 border border-slate-200 rounded-xl focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/10 placeholder-slate-400 outline-none font-semibold shadow-2xs transition"
              />
              <input
                type="text"
                placeholder="Full Address (Town / City / Road)"
                value={newCust.address}
                onChange={(e) => setNewCust({ ...newCust, address: e.target.value })}
                className="sm:col-span-2 px-3.5 py-2 text-xs bg-white text-slate-900 border border-slate-200 rounded-xl focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/10 placeholder-slate-400 outline-none font-semibold shadow-2xs transition"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-[#DC2626] text-white hover:bg-red-700 rounded-xl cursor-pointer shadow-xs active:scale-95"
              >
                Save Customer
              </button>
            </div>
          </form>
        )}

        {/* Customer List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No customers found</p>
              <p className="text-xs mt-1 text-slate-500">Click the "+ New Customer" button above to add a party.</p>
            </div>
          ) : (
            filtered.map((cust) => (
              <div
                key={cust.id}
                onClick={() => {
                  onSelectCustomer(cust);
                  onClose();
                }}
                className="p-3.5 rounded-2xl border border-slate-200 hover:border-red-300 hover:bg-red-50/20 transition cursor-pointer flex items-center justify-between group shadow-2xs bg-white"
              >
                <div className="space-y-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-[#DC2626] transition truncate">
                      {cust.name}
                    </span>
                    <span
                      className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-[#DC2626] border border-red-100"
                    >
                      {cust.gstin ? 'B2B' : 'B2C'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                    {cust.phone && (
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {cust.phone}
                      </span>
                    )}
                    {cust.gstin && (
                      <span className="font-mono text-slate-700 font-semibold">
                        GST: {cust.gstin}
                      </span>
                    )}
                    <span className="flex items-center gap-1 truncate max-w-xs">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      {cust.address || cust.stateName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-bold text-[#DC2626] group-hover:underline hidden sm:inline">
                    Select & Fill
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(cust.id, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Total Saved Parties: {customers.length}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 font-semibold text-slate-700 rounded-xl cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
