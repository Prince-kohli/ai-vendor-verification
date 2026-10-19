"use client";
import { useState } from "react";
import api from "../../lib/api";
import { useToast } from "../../context/ToastContext";

export default function DocumentUpload({ vendorId, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState("GST Certificate");
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please select a file");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("vendorId", vendorId);
    formData.append("documentType", docType);

    setUploading(true);
    try {
      // Axios natively handles FormData headers
      const res = await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Document Analyzed with AI! 🤖");
      setFile(null);
      onUploadSuccess(); // Refresh doc list
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form
      onSubmit={handleUpload}
      className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm mb-6"
    >
      <h3 className="font-bold text-gray-800 mb-4">
        📄 Upload & AI Verification
      </h3>
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
            Document Type
          </label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-full border-gray-300 rounded-lg p-2 text-sm border focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option>GST Certificate</option>
            <option>Registration Certificate</option>
            <option>Bank Document</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
            Select File (PDF/Image)
          </label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            accept=".pdf,.png,.jpg,.jpeg,.txt"
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <button
          type="submit"
          disabled={uploading || !file}
          className="bg-slate-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition"
        >
          {uploading ? "Analyzing AI..." : "Upload & Scan"}
        </button>
      </div>
    </form>
  );
}
