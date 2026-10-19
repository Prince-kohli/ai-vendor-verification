'use client';

import { useEffect, useState, useCallback, Suspense } from "react";
import { useParams } from "next/navigation";

import Badge from "../../../../components/common/Badge";
import DocumentUpload from "../../../../components/document/DocumentUpload";
import VendorForm from "../../../../components/vendor/VendorForm";
import { useModal } from "../../../../context/ModalContext";
import { useToast } from "../../../../context/ToastContext";
import { useVendors } from "../../../../hooks/useVendors";
import api from "../../../../lib/api";

function VendorDetailContent() {
  const { id } = useParams();
  const { currentVendor, history, fetchVendorById, updateVendor, fetchHistory, restoreVersion } = useVendors();
  const { openModal, closeModal } = useModal();
  const toast = useToast();
  
  const [documents, setDocuments] = useState([]);
  const [editingDocId, setEditingDocId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Verification State
  const [verifyingExternal, setVerifyingExternal] = useState(false);
  const [externalData, setExternalData] = useState(null);

  // Email Trigger State
  const [sendingEmail, setSendingEmail] = useState(false);

  // Workflow & Task Management State
  const [tasks, setTasks] = useState([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);

  // Fetch AI Documents
  const fetchDocuments = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get(`/documents/vendor/${id}`);
      setDocuments(res.data || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  }, [id]);

  // Fetch Vendor Tasks
  const fetchTasks = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get(`/vendors/${id}/tasks`);
      setTasks(res.data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchVendorById(id);
      fetchHistory(id);
      fetchDocuments();
      fetchTasks();
    }
  }, [id, fetchVendorById, fetchHistory, fetchDocuments, fetchTasks]);

  // Set initial external verification if already saved
  useEffect(() => {
    if (currentVendor?.externalVerification?.details) {
      setExternalData({
        status: currentVendor.externalVerification.status,
        fetchedData: currentVendor.externalVerification.details,
        message: 'Saved external registry verification record.',
      });
    }
  }, [currentVendor]);

  // Handle Workflow Status Update
  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await api.patch(`/vendors/${id}/status`, { status: newStatus });
      toast.success(`Workflow status updated to ${newStatus}`);
      fetchVendorById(id);
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle Create Task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle) return toast.error("Please enter a task title");

    setCreatingTask(true);
    try {
      await api.post(`/vendors/${id}/tasks`, {
        title: taskTitle,
        priority: taskPriority,
        dueDate: taskDueDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      });
      toast.success("New task assigned!");
      setTaskTitle("");
      setTaskDueDate("");
      fetchTasks();
    } catch (err) {
      toast.error(err.message || "Failed to create task");
    } finally {
      setCreatingTask(false);
    }
  };

  // Toggle Task Completion
  const handleToggleTask = async (taskId) => {
    try {
      await api.patch(`/vendors/tasks/${taskId}/toggle`);
      toast.success("Task status updated");
      fetchTasks();
    } catch (err) {
      toast.error(err.message || "Failed to toggle task");
    }
  };

  // Trigger External OpenCorporates Verification
  const handleVerifyExternal = async () => {
    setVerifyingExternal(true);
    try {
      const res = await api.post(`/vendors/${id}/verify-external`);
      setExternalData(res.data);
      toast.success(res.message || "External verification completed!");
      fetchVendorById(id);
    } catch (err) {
      toast.error(err.message || "Verification failed");
    } finally {
      setVerifyingExternal(false);
    }
  };

  // Trigger Automated Email for Missing Documents
  const handleSendMissingEmail = async () => {
    setSendingEmail(true);
    try {
      const res = await api.post(`/vendors/${id}/notify-missing-docs`);
      toast.success(`Email sent to ${currentVendor.email}! 📩`);
      fetchVendorById(id);
    } catch (err) {
      toast.error(err.message || "Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  };

  // Edit extracted data handlers
  const handleStartEditDoc = (doc) => {
    setEditingDocId(doc._id);
    setEditFormData(doc.extractedData || {});
  };

  const handleSaveExtractedData = async (docId) => {
    try {
      await api.put(`/documents/${docId}/extracted-data`, {
        extractedData: editFormData
      });
      toast.success("Extracted information updated!");
      setEditingDocId(null);
      fetchDocuments();
    } catch (err) {
      toast.error(err.message || "Failed to update extracted data");
    }
  };

  const handleEditSubmit = async (formData) => {
    await updateVendor(id, formData);
    await fetchHistory(id);
    closeModal();
  };

  const handleOpenEditModal = () => {
    openModal({
      title: 'Edit Vendor Information',
      size: 'lg',
      content: <VendorForm initialData={currentVendor} onSubmit={handleEditSubmit} />,
    });
  };

  if (!currentVendor) {
    return <div className="text-center py-20 text-gray-500 font-medium">Loading vendor record...</div>;
  }

  // Compute Missing Document Checklist Engine
  const REQUIRED_DOCS = ['Registration Certificate', 'GST Certificate', 'Bank Document'];
  const uploadedTypes = documents.map(d => d.documentType);
  const checklist = REQUIRED_DOCS.map(docType => {
    const isUploaded = uploadedTypes.includes(docType);
    return {
      type: docType,
      status: isUploaded ? 'Available' : 'Missing',
    };
  });

  const missingDocsCount = checklist.filter(item => item.status === 'Missing').length;

  // AI Comparison Logic Engine
  const getComparisonResults = () => {
    const mismatches = [];
    const fieldMapping = [
      { key: 'companyName', label: 'Company Name' },
      { key: 'registrationNumber', label: 'Registration Number' },
      { key: 'gstNumber', label: 'GST Number' },
      { key: 'bankAccountNumber', label: 'Bank Account Number' },
      { key: 'ifscCode', label: 'IFSC Code' },
    ];

    fieldMapping.forEach(({ key, label }) => {
      const vendorVal = (currentVendor[key] || '').toString().trim().toLowerCase();
      
      documents.forEach((doc) => {
        const docExtracted = doc.extractedData || {};
        const docVal = (docExtracted[key] || '').toString().trim().toLowerCase();

        if (docVal && vendorVal && docVal !== vendorVal) {
          mismatches.push({
            field: label,
            documentType: doc.documentType,
            vendorValue: currentVendor[key],
            documentValue: docExtracted[key],
          });
        }
      });
    });

    return mismatches;
  };

  const mismatches = getComparisonResults();

  const detailsList = [
    { label: 'Company Name', value: currentVendor.companyName },
    { label: 'Contact Person', value: currentVendor.contactPerson },
    { label: 'Email Address', value: currentVendor.email },
    { label: 'Phone Number', value: currentVendor.phone },
    { label: 'Registration Number', value: currentVendor.registrationNumber },
    { label: 'GST Number', value: currentVendor.gstNumber },
    { label: 'Bank Account Number', value: currentVendor.bankAccountNumber },
    { label: 'IFSC Code', value: currentVendor.ifscCode },
    { label: 'Registered Address', value: currentVendor.address, colSpan: 2 },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Workflow Status Pipeline */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{currentVendor.companyName}</h1>
              <Badge status={currentVendor.status} />
            </div>
            <p className="text-sm text-gray-500">ID: {currentVendor._id}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenEditModal}
              className="px-4 py-2 bg-blue-600 text-white font-medium text-xs rounded-lg hover:bg-blue-700 transition"
            >
              Edit Vendor
            </button>
          </div>
        </div>

        {/* 🔄 REQUIREMENT 5: Workflow Control Bar */}
        <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Reviewer Workflow Control:
          </span>
          <div className="flex items-center gap-2">
            {['Draft', 'Under Review', 'Action Required', 'Approved', 'Rejected'].map((status) => (
              <button
                key={status}
                disabled={updatingStatus}
                onClick={() => handleStatusChange(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  currentVendor.status === status
                    ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 📌 REQUIREMENT 5: Action Required & Task Management Card */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-gray-800 pb-2 border-b border-gray-100 flex items-center justify-between">
          <span>📌 Vendor Action & Review Tasks</span>
          <span className="text-xs font-normal text-gray-400">{tasks.length} task(s) active</span>
        </h3>

        {/* Add Task Form */}
        <form onSubmit={handleCreateTask} className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Task Title</label>
            <input
              type="text"
              placeholder="e.g. Verify updated GST certificate..."
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="w-32">
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Priority</label>
            <select
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div className="w-36">
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Due Date</label>
            <input
              type="date"
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={creatingTask}
            className="px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-lg hover:bg-slate-800 disabled:opacity-50 transition"
          >
            {creatingTask ? "Adding..." : "+ Assign Task"}
          </button>
        </form>

        {/* Task List */}
        {tasks.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No tasks currently assigned to this vendor.</p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task._id}
                className={`p-3 rounded-lg border flex items-center justify-between transition ${
                  task.status === 'Completed'
                    ? 'bg-gray-50 border-gray-200 opacity-60'
                    : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={task.status === 'Completed'}
                    onChange={() => handleToggleTask(task._id)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <span className={`text-xs font-semibold block ${task.status === 'Completed' ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                      {task.title}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      task.priority === 'High'
                        ? 'bg-rose-100 text-rose-800'
                        : task.priority === 'Medium'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {task.priority} Priority
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      task.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 📋 REQUIREMENT 4: Required Document Checklist & Email Automation */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
              📋 Required Document Checklist
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Verify submitted mandatory compliance files and trigger automated requests.
            </p>
          </div>

          <button
            onClick={handleSendMissingEmail}
            disabled={missingDocsCount === 0 || sendingEmail}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg disabled:opacity-40 transition flex items-center gap-2"
          >
            <span>📩</span>
            <span>{sendingEmail ? "Sending Email..." : "Email Client Missing Docs"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {checklist.map((item, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex items-center justify-between ${
                item.status === 'Available'
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : 'bg-rose-50/50 border-rose-200'
              }`}
            >
              <div>
                <span className="text-xs font-bold text-gray-800 block">{item.type}</span>
                <span className="text-[11px] text-gray-500">
                  {item.status === 'Available' ? 'Document Uploaded' : 'Action Needed'}
                </span>
              </div>
              <span
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  item.status === 'Available'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>

        {missingDocsCount > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between">
            <span>
              ⚠️ <strong>{missingDocsCount} required document(s) missing.</strong> Requesting files will set vendor status to <strong>Action Required</strong>.
            </span>
          </div>
        )}
      </div>

      {/* 🌐 REQUIREMENT 3: External Company Verification Card (OpenCorporates) */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
              🌐 External Registry Verification (OpenCorporates)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Verify legal status & registration against official company registries.
            </p>
          </div>
          <button
            onClick={handleVerifyExternal}
            disabled={verifyingExternal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition"
          >
            {verifyingExternal ? "Searching Registry..." : "Verify with OpenCorporates"}
          </button>
        </div>

        {externalData ? (
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Verification Outcome:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  externalData.status === 'Verified'
                    ? 'bg-emerald-100 text-emerald-800'
                    : externalData.status === 'Mismatch'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {externalData.status}
              </span>
            </div>

            {externalData.fetchedData && (
              <div className="grid grid-cols-2 gap-4 bg-white p-3 rounded border border-gray-100 text-xs">
                <div>
                  <span className="text-gray-400 block mb-0.5">Registry Name</span>
                  <span className="font-bold text-gray-800">{externalData.fetchedData.companyName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Registry Reg Number</span>
                  <span className="font-bold text-gray-800">{externalData.fetchedData.registrationNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Jurisdiction</span>
                  <span className="font-medium text-gray-800">{externalData.fetchedData.jurisdiction || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Current Status</span>
                  <span className="font-medium text-emerald-600">{externalData.fetchedData.currentStatus || 'Active'}</span>
                </div>
                {externalData.fetchedData.opencorporatesUrl && (
                  <div className="col-span-2 pt-1 border-t border-gray-50">
                    <a
                      href={externalData.fetchedData.opencorporatesUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                    >
                      View on OpenCorporates Registry ↗
                    </a>
                  </div>
                )}
              </div>
            )}

            {externalData.mismatches && externalData.mismatches.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 space-y-1">
                <span className="font-bold block">Registry Discrepancies Found:</span>
                {externalData.mismatches.map((m, idx) => (
                  <div key={idx}>
                    • <strong>{m.field}</strong>: Form has &quot;{m.vendorValue}&quot; but OpenCorporates has &quot;{m.externalValue}&quot;
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">No external registry check performed yet. Click the button above to verify.</p>
        )}
      </div>

      {/* AI Comparison Summary Card */}
      {documents.length > 0 && (
        <div className={`p-5 rounded-xl border ${mismatches.length > 0 ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50 border-emerald-300'}`}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl">{mismatches.length > 0 ? '⚠️' : '✅'}</span>
            <h3 className={`font-bold text-base ${mismatches.length > 0 ? 'text-amber-900' : 'text-emerald-900'}`}>
              AI Cross-Verification Audit
            </h3>
          </div>
          {mismatches.length === 0 ? (
            <p className="text-sm text-emerald-700">All uploaded document fields match the registered vendor details perfectly.</p>
          ) : (
            <div className="space-y-2 mt-3">
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                Mismatch(es) Detected ({mismatches.length}):
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mismatches.map((m, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg border border-amber-200 text-xs space-y-1 shadow-sm">
                    <div className="font-bold text-gray-800 flex justify-between">
                      <span>{m.field}</span>
                      <span className="text-amber-600">{m.documentType}</span>
                    </div>
                    <div className="text-gray-600">
                      Form Record: <span className="font-semibold text-gray-900">{m.vendorValue}</span>
                    </div>
                    <div className="text-gray-600">
                      Document Extracted: <span className="font-semibold text-red-600">{m.documentValue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Details Grid */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-base font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">
          Vendor Details
        </h3>
        <div className="grid grid-cols-2 gap-6">
          {detailsList.map((item, idx) => (
            <div key={idx} className={item.colSpan === 2 ? 'col-span-2' : 'col-span-1'}>
              <span className="text-xs font-semibold uppercase text-gray-400 tracking-wider block mb-0.5">
                {item.label}
              </span>
              <p className="text-sm font-medium text-gray-800">{item.value || '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Document Upload & AI Analysis */}
      <div>
        <DocumentUpload vendorId={currentVendor._id} onUploadSuccess={fetchDocuments} />

        {documents.length > 0 && (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-4">
            <h3 className="text-base font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center justify-between">
              <span>🤖 AI Extracted Data</span>
              <span className="text-xs text-gray-400 font-normal">Click edit to fix incorrect extractions</span>
            </h3>
            <div className="space-y-4">
              {documents.map((doc) => {
                const isEditing = editingDocId === doc._id;

                return (
                  <div key={doc._id} className="p-4 border border-blue-100 bg-blue-50/50 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-900">{doc.documentType}</span>
                        <span className="text-xs text-gray-500">({doc.fileName})</span>
                      </div>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveExtractedData(doc._id)}
                            className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingDocId(null)}
                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-xs font-semibold hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEditDoc(doc)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                        >
                          ✏️ Edit Extracted Info
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {['companyName', 'registrationNumber', 'gstNumber', 'bankAccountNumber', 'ifscCode', 'address'].map((field) => (
                          <div key={field}>
                            <label className="text-xs text-gray-500 capitalize block mb-1">
                              {field.replace(/([A-Z])/g, ' $1').trim()}
                            </label>
                            <input
                              type="text"
                              value={editFormData[field] || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, [field]: e.target.value })}
                              className="w-full border border-gray-300 rounded p-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {Object.entries(doc.extractedData || {}).map(([key, val]) => (
                          val && (
                            <div key={key}>
                              <span className="text-gray-500 capitalize text-xs block mb-0.5">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              <span className="font-medium text-gray-900">{val}</span>
                            </div>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Version History Component */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-base font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">
          📜 Version Audit Log
        </h3>
        {history.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No previous revision records available.</p>
        ) : (
          <div className="space-y-4">
            {history.map((ver) => (
              <div key={ver._id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm text-gray-800">Version {ver.version}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">
                      {new Date(ver.changedAt).toLocaleString()}
                    </span>
                    <button
                      onClick={() => restoreVersion(currentVendor._id, ver._id)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                    >
                      Restore This Version
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  {ver.changes.map((change, i) => (
                    <div key={i} className="text-xs text-gray-600">
                      <span className="font-semibold text-gray-700">{change.field}:</span>{' '}
                      <span className="line-through text-red-500">{change.previousValue || 'empty'}</span>{' '}
                      ➔ <span className="text-emerald-600 font-medium">{change.newValue}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VendorDetail() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-500">Loading page...</div>}>
      <VendorDetailContent />
    </Suspense>
  );
}