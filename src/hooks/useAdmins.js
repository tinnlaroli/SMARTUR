import { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi"

export function useAdmins() {
  const [admins, setAdmin] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAll();
      setAdmin(data);
    } finally {
      setLoading(false);
    }
  };

  const createAdmin = async (userData) => {
    await adminApi.create(userData);
    await loadAdmins();
  };

  const removeAdmin = async (id) => {
    await adminApi.delete(id);
    await loadAdmins();
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  return { admins, loading, removeAdmin, createAdmin };
}
