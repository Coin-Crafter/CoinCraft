// src/components/Users.js
import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase.jsx";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    walletAddress: "",
    role: "client", // default role
  });

  const usersCollectionRef = collection(db, "profiles");

  // Fetch Users
  const fetchUsers = async () => {
    const data = await getDocs(usersCollectionRef);
    setUsers(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Add User
  const addUser = async () => {
    await addDoc(usersCollectionRef, form);
    fetchUsers(); // Refresh list
    setForm({ name: "", email: "", walletAddress: "", role: "client" });
  };

  // Update User
  const updateUser = async (id, updatedRole) => {
    const userDoc = doc(db, "users", id);
    await updateDoc(userDoc, { role: updatedRole });
    fetchUsers();
  };

  // Delete User
  const deleteUser = async (id) => {
    const userDoc = doc(db, "users", id);
    await deleteDoc(userDoc);
    fetchUsers();
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <h1>Users</h1>
      </div>
      <div className="form-container">
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          type="text"
          placeholder="Wallet Address"
          value={form.walletAddress}
          onChange={(e) =>
            setForm({ ...form, walletAddress: e.target.value })
          }
        />
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="client">Client</option>
          <option value="verifier">Verifier</option>
          <option value="freelancer">Freelancer</option>
        </select>
        <button onClick={addUser}>Add User</button>
      </div>

      <ul className="users-list">
        {users.map((user) => (
          <li key={user.id} className="user-card">
            <div className="user-details">
              <p>{user.name} ({user.email}) - {user.role}</p>
            </div>
            <div className="user-actions">
              <button onClick={() => updateUser(user.id, "verifier")}>
                Make Verifier
              </button>
              <button onClick={() => deleteUser(user.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Users;