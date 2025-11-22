import { useEffect, useState } from "react";
import { usersApi } from "../api/usersApi";

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await usersApi.getAll();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData) => {
    await usersApi.create(userData);
    await loadUsers();
  };

  const removeUser = async (id) => {
    await usersApi.delete(id);
    await loadUsers();
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return { users, loading, removeUser, createUser };
}
