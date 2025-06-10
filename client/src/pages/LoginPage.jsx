import React, { useState, useContext } from "react";
import assets from "../assets/assets.js";
import { AuthContext } from "../../context/AuthContext.jsx";

const LoginPage = () => {
  const [currentState, setCurrentState] = useState("Sign Up");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const { login } = useContext(AuthContext);

  const toggleForm = () => {
    setCurrentState(currentState === "Sign Up" ? "Login" : "Sign Up");
    setIsDataSubmitted(false);
    setFullName("");
    setEmail("");
    setPassword("");
    setBio("");
    setAgreeTerms(false);
  };

  const onSubmitHandler = (event) => {
    event.preventDefault();
    if (currentState === "Sign Up" && !isDataSubmitted) {
      setIsDataSubmitted(true);
      return;
    }

    login(currentState === "Sign Up" ? "signup" : "login", {
      fullName,
      email,
      password,
      bio,
    });
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl px-4"
      style={{ backgroundImage: 'url("/your-bg.jpg")' }}
    >
      <img
        src={assets.logo_big}
        alt="Logo"
        className="w-[150px] sm:w-[180px] md:w-[200px] lg:w-[220px] xl:w-[250px]"
      />

      <form
        onSubmit={onSubmitHandler}
        className="border border-gray-500 bg-white/10 text-white p-6 flex flex-col rounded-xl shadow-2xl w-full max-w-sm gap-5"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">{currentState}</h2>
          <button
            type="button"
            onClick={toggleForm}
            className="text-sm text-blue-300 underline hover:text-blue-400"
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
            className="p-3 bg-transparent border border-gray-500 rounded-md placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Full Name"
            required
          />
        )}

        {!isDataSubmitted && (
          <>
            <input
              type="email"
              value={email}
              placeholder="Enter your email"
              required
              onChange={(e) => setEmail(e.target.value)}
              className="p-3 bg-transparent border border-gray-500 rounded-md placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <input
              type="password"
              value={password}
              placeholder="Enter your password"
              required
              onChange={(e) => setPassword(e.target.value)}
              className="p-3 bg-transparent border border-gray-500 rounded-md placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </>
        )}

        {currentState === "Sign Up" && isDataSubmitted && (
          <textarea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Write something about yourself..."
            className="p-3 bg-transparent border border-gray-500 rounded-md placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          ></textarea>
        )}

        {currentState === "Sign Up" && (
          <label className="flex items-center gap-2 text-sm text-white">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="accent-violet-500 w-4 h-4"
              required
            />
            I agree to the{" "}
            <span className="underline cursor-pointer text-blue-300 hover:text-blue-400">
              Terms & Conditions
            </span>
          </label>
        )}

        <button
          type="submit"
          disabled={currentState === "Sign Up" && !agreeTerms}
          className={`py-3 rounded-md font-medium transition-all ${
            currentState === "Sign Up" && !agreeTerms
              ? "bg-purple-300 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-90"
          }`}
        >
          {currentState === "Sign Up" ? "Create Account" : "Login Now"}
        </button>

        <p className="text-center text-sm text-gray-200">
          {currentState === "Sign Up" ? (
            <>
              Already have an account?{" "}
              <span
                onClick={toggleForm}
                className="text-blue-300 underline cursor-pointer hover:text-blue-400"
              >
                Login
              </span>
            </>
          ) : (
            <>
              Don’t have an account?{" "}
              <span
                onClick={toggleForm}
                className="text-blue-300 underline cursor-pointer hover:text-blue-400"
              >
                Sign Up
              </span>
            </>
          )}
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
