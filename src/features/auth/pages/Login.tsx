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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950 font-sans selection:bg-indigo-500/30">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        {/* Blob 1 */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" />
        {/* Blob 2 */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-violet-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-pulse delay-1000" />
        {/* Blob 3 */}
        <div className="absolute top-[40%] left-[60%] w-80 h-80 bg-fuchsia-600/20 rounded-full mix-blend-screen filter blur-[90px] animate-pulse delay-700" />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md p-8 mx-4 transition-all duration-500 hover:shadow-[0_0_40px_rgba(99,102,241,0.2)]">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl" />
        
        <div className="relative flex flex-col items-center justify-center space-y-10 py-6">
          {/* Logo / Icon Area */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="text-white w-8 h-8" />
            </div>
            <div className="text-center space-y-1">
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
                Welcome Back
              </h1>
              <p className="text-sm font-medium text-slate-400">
                Sign in to access your dashboard
              </p>
            </div>
          </div>

          {/* Action Area */}
          <div className="w-full space-y-4">
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="group relative flex items-center justify-center w-full gap-3 px-6 py-4 rounded-xl font-bold text-white bg-white/5 border border-white/10 overflow-hidden transition-all duration-300 hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-500/20 to-violet-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
              )}
              <span className="relative z-10">{loading ? "Connecting..." : "Sign in to continue"}</span>
            </button>
            
            <p className="text-xs text-center text-slate-500 font-medium">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
