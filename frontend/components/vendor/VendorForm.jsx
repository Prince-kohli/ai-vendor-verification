'use client';
import { useState } from 'react';

export default function VendorForm({ initialData = null, onSubmit, isLoading = false }) {
  const [formData, setFormData] = useState({
    companyName: initialData?.companyName || '',
    contactPerson: initialData?.contactPerson || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    registrationNumber: initialData?.registrationNumber || '',
    gstNumber: initialData?.gstNumber || '',
    bankAccountNumber: initialData?.bankAccountNumber || '',
    ifscCode: initialData?.ifscCode || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const formFields = [
    { name: 'companyName', label: 'Company Name *', type: 'text', required: true, colSpan: 1 },
    { name: 'contactPerson', label: 'Contact Person *', type: 'text', required: true, colSpan: 1 },
    { name: 'email', label: 'Email *', type: 'email', required: true, colSpan: 1 },
    { name: 'phone', label: 'Phone Number *', type: 'text', required: true, colSpan: 1 },
    { name: 'registrationNumber', label: 'Company Registration Number', type: 'text', colSpan: 1 },
    { name: 'gstNumber', label: 'GST / Tax Number', type: 'text', colSpan: 1 },
    { name: 'bankAccountNumber', label: 'Bank Account Number', type: 'text', colSpan: 1 },
    { name: 'ifscCode', label: 'IFSC Code', type: 'text', colSpan: 1 },
    { name: 'address', label: 'Company Registered Address', type: 'text', colSpan: 2 },
  ];

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
      {formFields.map(field => (
        <div key={field.name} className={field.colSpan === 2 ? 'col-span-2' : 'col-span-1'}>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
            {field.label}
          </label>
          <input
            type={field.type}
            name={field.name}
            value={formData[field.name]}
            onChange={handleChange}
            required={field.required}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition"
          />
        </div>
      ))}

      <div className="col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : initialData ? 'Update Vendor' : 'Create Vendor'}
        </button>
      </div>
    </form>
  );
}