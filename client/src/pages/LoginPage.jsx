import React, { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import chat from "../assets/chat.avif";

const LoginPage = () => {
  const [currentState, setCurrentState] = useState("Sign Up");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

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
    <div className="min-h-screen bg-[#f5f6ff] flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-5xl flex rounded-3xl overflow-hidden shadow-2xl bg-white max-md:flex-col">
        <div className="w-1/2 max-md:hidden bg-[#ad46ff] flex items-center justify-center p-12">
          <img
            src={chat}
            alt="Chat"
            className="w-full h-auto max-w-sm object-contain"
          />
        </div>

        <form
          onSubmit={onSubmitHandler}
          className="w-1/2 max-md:w-full p-12 flex flex-col justify-center gap-6"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-gray-800">{currentState}</h2>
            <button
              type="button"
              onClick={toggleForm}
              className="text-sm text-[#ad46ff] underline hover:text-[#9c39f0]"
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
              className="p-3 bg-gray-100 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ad46ff] focus:outline-none"
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
                className="p-3 bg-gray-100 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ad46ff] focus:outline-none"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="p-3 bg-gray-100 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ad46ff] focus:outline-none"
              />
            </>
          )}

          {currentState === "Sign Up" && isDataSubmitted && (
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Write something about yourself..."
              className="p-3 bg-gray-100 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ad46ff] focus:outline-none"
            ></textarea>
          )}

          {currentState === "Sign Up" && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="accent-[#ad46ff] w-4 h-4"
                required
              />
              I agree to the{" "}
              <span className="underline text-[#ad46ff] hover:text-[#9c39f0] cursor-pointer">
                Terms & Conditions
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={currentState === "Sign Up" && !agreeTerms}
            className={`py-3 rounded-xl font-semibold text-lg transition-all ${
              currentState === "Sign Up" && !agreeTerms
                ? "bg-[#e6c8ff] text-white cursor-not-allowed"
                : "bg-[#ad46ff] text-white hover:bg-[#9c39f0] shadow-md"
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
                  className="text-[#ad46ff] underline cursor-pointer hover:text-[#9c39f0]"
                >
                  Login
                </span>
              </>
            ) : (
              <>
                Don’t have an account?{" "}
                <span
                  onClick={toggleForm}
                  className="text-[#ad46ff] underline cursor-pointer hover:text-[#9c39f0]"
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
