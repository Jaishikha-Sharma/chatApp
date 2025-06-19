import React, { useState } from "react";
import axios from "axios";
import { X, CheckCircle2 } from "lucide-react";

const CreateUserModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "",
    bio: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccess(false);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "/api/auth/admin/create-user",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSuccess(true);
      setMessage("User created successfully!");
      setFormData({
        fullName: "",
        email: "",
        password: "",
        role: "",
        bio: "",
      });

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error creating user");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative animate-fadeIn">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition"
          onClick={onClose}
        >
          <X size={22} />
        </button>

        <h2 className="text-2xl font-bold text-center text-blue-700 mb-5">Create New User</h2>

        {success && (
          <div className="flex items-center gap-2 justify-center mb-4 bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg shadow-sm text-sm">
            <CheckCircle2 className="w-5 h-5" />
            {message}
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Full Name"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-400 transition placeholder:text-gray-500"
            />

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-400 transition placeholder:text-gray-500"
            />

            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-400 transition placeholder:text-gray-500"
            />

            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            >
              <option value="">Select Role</option>
              <option value="Employee">Employee</option>
              <option value="Project Coordinator">Project Coordinator</option>
              <option value="Freelancer">Freelancer</option>
              <option value="Customer">Customer</option>
            </select>

            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Short bio about the user..."
              rows="3"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-400 transition placeholder:text-gray-500"
            ></textarea>

            {message && (
              <p className="text-center text-sm text-red-600">{message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create User"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateUserModal;
