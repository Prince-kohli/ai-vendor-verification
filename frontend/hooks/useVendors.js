'use client';
import { useState, useCallback } from 'react';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';

export function useVendors() {
  const [vendors, setVendors] = useState([]);
  const [currentVendor, setCurrentVendor] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/vendors');
      setVendors(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchVendorById = useCallback(async (id) => {
    setLoading(true);
    try {
      const res = await api.get(`/vendors/${id}`);
      setCurrentVendor(res.data);
      return res.data;
    } catch (err) {
      toast.error(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createVendor = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/vendors', data);
      toast.success(res.message);
      await fetchVendors();
      return res.data;
    } catch (err) {
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateVendor = async (id, data) => {
    setLoading(true);
    try {
      const res = await api.put(`/vendors/${id}`, data);
      toast.success(res.message);
      setCurrentVendor(res.data);
      return res.data;
    } catch (err) {
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteVendor = async (id) => {
    try {
      const res = await api.delete(`/vendors/${id}`);
      toast.success(res.message);
      await fetchVendors();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const fetchHistory = useCallback(async (id) => {
    try {
      const res = await api.get(`/vendors/${id}/history`);
      setHistory(res.data);
    } catch (err) {
      toast.error(err.message);
    }
  }, [toast]);

  const restoreVersion = async (vendorId, versionId) => {
    try {
      const res = await api.post(`/vendors/${vendorId}/restore/${versionId}`);
      toast.success(res.message);
      setCurrentVendor(res.data);
      await fetchHistory(vendorId);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return {
    vendors,
    currentVendor,
    history,
    loading,
    fetchVendors,
    fetchVendorById,
    createVendor,
    updateVendor,
    deleteVendor,
    fetchHistory,
    restoreVersion,
  };
}