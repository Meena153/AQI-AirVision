import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Leaf, Mail, Lock, User, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Link, useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";

export default function Signup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  const handleSignup = async () => {
    setErr("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ cookie auth
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErr(data?.message || "Signup failed");
        return;
      }

      // Force a full page refresh on signup to ensure all components properly reset their state
      window.location.href = "/";
    } catch (e) {
      setErr("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50 relative overflow-hidden">
      {/* Back to Home Button */}
      <div className="absolute top-6 left-6 z-20">
        <Link href="/">
          <Button variant="ghost" className="hover:bg-white/50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
      {/* Background blobs */}
      <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-300/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl" />

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-6 text-emerald-600">
              <Leaf className="w-8 h-8" />
            </div>

            <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">
              Create Account
            </h1>
            <p className="text-muted-foreground mb-8">
              Sign up to track AQI and save your favorite locations.
            </p>
          </div>

          {/* Name */}
          <label className="text-sm font-medium text-slate-700">Full Name</label>
          <div className="mt-2 mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <User className="w-5 h-5 text-slate-400" />
            <input
              className="w-full outline-none bg-transparent text-slate-900"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Email */}
          <label className="text-sm font-medium text-slate-700">Email</label>
          <div className="mt-2 mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <Mail className="w-5 h-5 text-slate-400" />
            <input
              className="w-full outline-none bg-transparent text-slate-900"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <label className="text-sm font-medium text-slate-700">Password</label>
          <div className="mt-2 mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
            <Lock className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type={showPassword ? "text" : "password"}
              className="w-full outline-none bg-transparent text-slate-900"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 hover:bg-slate-100 rounded-md transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-slate-400" />
              ) : (
                <Eye className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>

          {err && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {err}
            </div>
          )}

          <Button
            onClick={handleSignup}
            disabled={loading}
            className="w-full h-12 rounded-xl text-lg font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02]"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </Button>

          <div className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-slate-900 underline underline-offset-4">
              Login
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-muted-foreground">
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
