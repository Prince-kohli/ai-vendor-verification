'use client';
import { useEffect } from 'react';



import { useVendors } from '../../hooks/useVendors';
import Badge from '../../components/common/Badge';
import VendorForm from '../../components/vendor/VendorForm';
import { useModal } from '../../context/ModalContext';

export default function Dashboard() {
  const { vendors, loading, fetchVendors, createVendor, deleteVendor } = useVendors();
  const { openModal, closeModal } = useModal();

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleCreateSubmit = async (formData) => {
    try {
      await createVendor(formData);
      closeModal();
    } catch (error) {
      // Error handles inside Toast Context via Hook
    }
  };

  const handleOpenAddModal = () => {
    openModal({
      title: 'Register New Vendor',
      size: 'lg',
      content: <VendorForm onSubmit={handleCreateSubmit} isLoading={loading} />,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Vendor Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage, verify and monitor vendor verification workflows</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-blue-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow hover:shadow-md"
        >
          + Add New Vendor
        </button>
      </div>

      {loading && vendors.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <p className="text-gray-500 font-medium animate-pulse">Loading Vendors...</p>
        </div>
      ) : vendors.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
          <h3 className="text-base font-semibold text-gray-800">No Vendors Found</h3>
          <p className="text-sm text-gray-500 mt-1">Get started by creating your first vendor profile.</p>
          <button
            onClick={handleOpenAddModal}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
          >
            Create Vendor
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-medium">
              <tr>
                <th className="py-3.5 px-4">Company Name</th>
                <th className="py-3.5 px-4">Contact Person</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">GST Number</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vendors.map((vendor) => (
                <tr key={vendor._id} className="hover:bg-gray-50/80 transition">
                  <td className="py-3.5 px-4 font-semibold text-gray-900">{vendor.companyName}</td>
                  <td className="py-3.5 px-4 text-gray-600">{vendor.contactPerson}</td>
                  <td className="py-3.5 px-4 text-gray-600">{vendor.email}</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-gray-500">{vendor.gstNumber || '—'}</td>
                  <td className="py-3.5 px-4">
                    <Badge status={vendor.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-3">
                    <a
                      href={`/vendors/${vendor._id}`}
                      className="text-blue-600 font-medium hover:text-blue-800 transition"
                    >
                      View Details
                    </a>
                    <button
                      onClick={() => deleteVendor(vendor._id)}
                      className="text-red-600 font-medium hover:text-red-800 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}