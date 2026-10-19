'use client';
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const API = 'http://localhost:5000/api';

export default function NewVendor() {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    registrationNumber: '',
    gstNumber: '',
    bankAccountNumber: '',
    ifscCode: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API}/vendors`, form);
      alert('✅ Vendor created successfully!');
      router.push(`/vendors/${res.data._id}`);
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'companyName', label: 'Company Name *', type: 'text' },
    { name: 'contactPerson', label: 'Contact Person *', type: 'text' },
    { name: 'email', label: 'Email *', type: 'email' },
    { name: 'phone', label: 'Phone *', type: 'text' },
    { name: 'address', label: 'Address', type: 'text' },
    { name: 'registrationNumber', label: 'Company Registration Number', type: 'text' },
    { name: 'gstNumber', label: 'GST / Tax Number', type: 'text' },
    { name: 'bankAccountNumber', label: 'Bank Account Number', type: 'text' },
    { name: 'ifscCode', label: 'IFSC Code', type: 'text' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Add New Vendor</h2>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
        {fields.map(f => (
          <div key={f.name}>
            <label className="block text-sm font-medium mb-1">{f.label}</label>
            <input
              type={f.type}
              name={f.name}
              value={form[f.name]}
              onChange={handleChange}
              required={f.label.includes('*')}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        ))}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Saving...' : 'Save Vendor'}
        </button>
      </form>
    </div>
  );
}