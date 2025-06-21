import React, { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader } from "lucide-react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login, authUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await login("login", { email, password });

    setTimeout(() => {
      const role = authUser?.role;
      setIsLoading(false);
      if (role === "Admin") navigate("/admin-dashboard");
      else if (role === "Employee") navigate("/employee-panel");
      else if (role === "Project Coordinator") navigate("/coordinator-panel");
      else if (role === "Freelancer") navigate("/freelancer-panel");
      else if (role === "Customer") navigate("/customer-panel");
      else navigate("/");
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      <div className="w-full max-w-6xl h-auto md:h-[90vh] flex flex-col md:flex-row bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
        {/* Left: Animated Welcome Block */}
        <div className="md:w-1/2 bg-[#225EA8] text-white flex flex-col justify-center items-center p-10 relative overflow-hidden">
          <div className="text-5xl font-extrabold mb-3 animate-pulse">
            ChatVerse 🚀
          </div>
          <p className="text-lg text-center max-w-xs leading-relaxed opacity-90">
            Chat. Collaborate. Create.
            <br />
            <span className="text-sm opacity-70">
              Where teams thrive together 💬💡
            </span>
          </p>

          {/* Floating emojis */}
          <div className="absolute top-4 left-4 text-2xl animate-bounce">💬</div>
          <div className="absolute bottom-4 right-6 text-3xl animate-spin-slow">💡</div>
          <div className="absolute bottom-12 left-12 text-xl animate-float">👥</div>
          <div className="absolute top-10 right-10 text-2xl animate-float">🔥</div>
        </div>

        {/* Right: Login Form */}
        <form
          onSubmit={onSubmitHandler}
          className="md:w-1/2 w-full p-10 flex flex-col justify-center gap-6 bg-white backdrop-blur-lg"
        >
          <h3 className="text-3xl font-bold text-[#225EA8] text-center">
            Log In
          </h3>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            required
            className="p-3 bg-gray-100 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#225EA8] focus:outline-none"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="p-3 pr-12 w-full bg-gray-100 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#225EA8] focus:outline-none"
            />
            <span
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-3 cursor-pointer text-gray-500"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`py-3 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all duration-300 ${
              isLoading
                ? "bg-[#1d4ca1] cursor-not-allowed"
                : "bg-[#225EA8] hover:bg-[#1d4ca1]"
            } text-white shadow-md`}
          >
            {isLoading ? (
              <>
                <Loader className="animate-spin" size={20} /> Logging in...
              </>
            ) : (
              "Login Now"
            )}
          </button>
        </form>
      </div>

      {/* Floating animation */}
      <style>{`
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
