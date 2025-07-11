import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import assets from "../assets/assets.js";
import { AuthContext } from "../../context/AuthContext.jsx";

const ProfilePage = () => {
  const { authUser, updateProfile } = useContext(AuthContext);
  const [selectedImg, setSelectedImg] = useState(null);
  const navigate = useNavigate();
  const [name, setName] = useState(authUser.fullName);
  const [bio, setBio] = useState(authUser.bio);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedImg) {
      await updateProfile({ fullName: name, bio });
      navigate("/");
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(selectedImg);
    reader.onload = async () => {
      const base64Image = reader.result;
      await updateProfile({ profilePic: base64Image, fullName: name, bio });
      navigate("/");
    };
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-8 relative">
      
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 bg-white text-[oklch(0.48_0.13_255.73)] px-4 py-2 rounded-full shadow hover:bg-gray-100 transition-all text-sm font-medium"
      >
        ← Back
      </button>

      <div className="w-full max-w-3xl flex flex-col-reverse md:flex-row items-center justify-between rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-white">
        
        {/* Profile Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 w-full md:w-3/5 p-6 sm:p-8 bg-gradient-to-br from-[oklch(0.48_0.13_255.73)] to-[oklch(0.6_0.2_255.73)] text-white rounded-none md:rounded-l-2xl"
        >
          <h2 className="text-2xl font-bold mb-2 text-center md:text-left">
            Profile Details
          </h2>

          <label
            htmlFor="avatar"
            className="flex items-center gap-4 cursor-pointer text-sm"
          >
            <input
              type="file"
              id="avatar"
              accept=".png,.jpg,.jpeg"
              hidden
              onChange={(e) => setSelectedImg(e.target.files[0])}
            />
            <img
              src={
                selectedImg
                  ? URL.createObjectURL(selectedImg)
                  : assets.avatar_icon
              }
              alt="Avatar"
              className="w-12 h-12 object-cover rounded-full border-2 border-white shadow"
            />
            <span>Upload profile image</span>
          </label>

          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
            className="p-3 rounded-md bg-white text-black border border-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
          />

          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Write profile bio"
            rows={4}
            className="p-3 rounded-md bg-white text-black border border-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
            required
          ></textarea>

          <button
            type="submit"
            className="mt-2 bg-white text-[oklch(0.48_0.13_255.73)] hover:bg-gray-100 transition-all font-semibold p-3 rounded-full text-lg"
          >
            Save
          </button>
        </form>

        {/* Profile Picture */}
        <div className="w-full md:w-2/5 flex justify-center items-center p-6 sm:p-8 bg-gray-50 md:rounded-r-2xl">
          <img
            src={authUser?.profilePic || assets.logo_icon}
            alt="Profile"
            className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-full border-4 border-[oklch(0.48_0.13_255.73)] shadow-md"
          />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
