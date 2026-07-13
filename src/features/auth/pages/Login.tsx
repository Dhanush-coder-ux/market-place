import { useState } from "react";
import { LogIn, Sparkles } from "lucide-react";
import { authApi } from "@/services/api/auth";
import { useToast } from "@/context/ToastContext";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const response = await authApi.getLoginUrl();
      // Assuming response.data or response is the URL or contains a URL property
      const url = response?.data?.url || response?.url || response; 
      
      if (typeof url === 'string' && url.startsWith('http')) {
        window.location.href = url;
      } else {
        showToast("Invalid login URL received.", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to initialize login. Please try again later.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-50 font-sans selection:bg-blue-500/30">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        {/* Blob 1 */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse" />
        {/* Blob 2 */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-sky-400/20 rounded-full mix-blend-multiply filter blur-[120px] animate-pulse delay-1000" />
        {/* Blob 3 */}
        <div className="absolute top-[40%] left-[60%] w-80 h-80 bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-[90px] animate-pulse delay-700" />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md p-8 mx-4 transition-all duration-500 hover:shadow-[0_0_40px_rgba(59,130,246,0.1)]">
        <div className="absolute inset-0 bg-white/70 backdrop-blur-xl rounded-3xl border border-white shadow-xl shadow-blue-900/5" />
        
        <div className="relative flex flex-col items-center justify-center space-y-10 py-6">
          {/* Logo / Icon Area */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Sparkles className="text-white w-8 h-8" />
            </div>
            <div className="text-center space-y-1">
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                Welcome Back
              </h1>
              <p className="text-sm font-medium text-slate-500">
                Sign in to access your dashboard
              </p>
            </div>
          </div>

          {/* Action Area */}
          <div className="w-full space-y-4">
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="group relative flex items-center justify-center w-full gap-3 px-6 py-4 rounded-xl font-bold text-white bg-blue-600 border border-blue-500 overflow-hidden transition-all duration-300 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-blue-600/20"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {loading ? (
                <div className="relative z-10 w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn className="relative z-10 w-5 h-5 text-blue-100 group-hover:text-white transition-colors" />
              )}
              <span className="relative z-10">{loading ? "Connecting..." : "Sign in to continue"}</span>
            </button>
            
            <p className="text-xs text-center text-slate-400 font-medium">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
