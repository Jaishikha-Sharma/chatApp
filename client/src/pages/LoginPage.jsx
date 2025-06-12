import React, { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react"; // ✅ import Lucide icons

const LoginPage = () => {
  const [currentState, setCurrentState] = useState("Sign Up");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 👁️ toggle state

  const { login, signup } = useContext(AuthContext);
  const navigate = useNavigate();

  const toggleForm = () => {
    setCurrentState(currentState === "Sign Up" ? "Login" : "Sign Up");
    setIsDataSubmitted(false);
    setFullName("");
    setEmail("");
    setPassword("");
    setBio("");
    setAgreeTerms(false);
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (currentState === "Sign Up" && !isDataSubmitted) {
      setIsDataSubmitted(true);
      return;
    }
    if (currentState === "Sign Up") {
      await signup({ fullName, email, password, bio });
      toggleForm();
    } else {
      await login("login", { email, password });
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-5xl flex rounded-3xl overflow-hidden shadow-2xl bg-white max-md:flex-col">
        {/* Left Side - Welcome Text */}
        <div className="w-1/2 max-md:hidden bg-[#225EA8] text-white flex flex-col items-center justify-center p-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to ChatVerse</h1>
          <p className="text-lg opacity-90">
            Connect. Converse. Collaborate.
            <br />
            Join thousands of users chatting in real-time.
          </p>
        </div>

        {/* Right Side - Form */}
        <form
          onSubmit={onSubmitHandler}
          className="w-1/2 max-md:w-full p-12 flex flex-col justify-center gap-6"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-gray-800">{currentState}</h2>
            <button
              type="button"
              onClick={toggleForm}
              className="text-sm text-[#225EA8] underline hover:text-[#174a93]"
            >
              {currentState === "Sign Up"
                ? "Switch to Login"
                : "Switch to Sign Up"}
            </button>
          </div>

          {currentState === "Sign Up" && !isDataSubmitted && (
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full Name"
              required
              className="p-3 bg-gray-100 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#225EA8] focus:outline-none"
            />
          )}

          {!isDataSubmitted && (
            <>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="p-3 bg-gray-100 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#225EA8] focus:outline-none"
              />

              {/* Password Field with Eye Toggle */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="p-3 pr-12 w-full bg-gray-100 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#225EA8] focus:outline-none"
                />
                <span
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-3 cursor-pointer text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </span>
              </div>
            </>
          )}

          {currentState === "Sign Up" && isDataSubmitted && (
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Write something about yourself..."
              className="p-3 bg-gray-100 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#225EA8] focus:outline-none"
            ></textarea>
          )}

          {currentState === "Sign Up" && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="accent-[#225EA8] w-4 h-4"
                required
              />
              I agree to the{" "}
              <span className="underline text-[#225EA8] hover:text-[#174a93] cursor-pointer">
                Terms & Conditions
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={currentState === "Sign Up" && !agreeTerms}
            className={`py-3 rounded-xl font-semibold text-lg transition-all ${
              currentState === "Sign Up" && !agreeTerms
                ? "bg-[#b0cffa] text-white cursor-not-allowed"
                : "bg-[#225EA8] text-white hover:bg-[#174a93] shadow-md"
            }`}
          >
            {currentState === "Sign Up" ? "Create Account" : "Login Now"}
          </button>

          <p className="text-center text-sm text-gray-600">
            {currentState === "Sign Up" ? (
              <>
                Already have an account?{" "}
                <span
                  onClick={toggleForm}
                  className="text-[#225EA8] underline cursor-pointer hover:text-[#174a93]"
                >
                  Login
                </span>
              </>
            ) : (
              <>
                Don’t have an account?{" "}
                <span
                  onClick={toggleForm}
                  className="text-[#225EA8] underline cursor-pointer hover:text-[#174a93]"
                >
                  Sign Up
                </span>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
