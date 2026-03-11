"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";
import { Bot } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setToken } = useAppStore();
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName]       = useState("");

  const submit = async () => {
    if (!email || !password) { toast.error("Please fill all fields"); return; }
    setLoading(true);
    try {
      const res = isRegister
        ? await authApi.register(email, password, name)
        : await authApi.login(email, password);
      const d = res.data.data;
      setToken(d.access_token);
      setUser({ id:d.user_id, email:d.email, name:d.name, plan:d.plan, createdAt:new Date().toISOString() });
      toast.success(`Welcome, ${d.name}!`);
      router.push("/upload");
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Authentication failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-dark-600 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand to-purple-500 flex items-center justify-center mx-auto mb-4">
            <Bot size={24} className="text-dark-600" />
          </div>
          <h1 className="text-dark-50 text-2xl font-extrabold">AI Business Analyst</h1>
          <p className="text-dark-200 text-sm mt-1">{isRegister ? "Create your account" : "Sign in to your account"}</p>
        </div>
        <div className="bg-dark-400 border border-dark-300 rounded-2xl p-6 space-y-4">
          {isRegister && (
            <div>
              <label className="text-dark-200 text-xs font-semibold uppercase tracking-wide block mb-1.5">Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                className="w-full bg-dark-500 border border-dark-300 rounded-lg px-3 py-2.5 text-dark-50 text-sm outline-none focus:border-brand/40 transition-colors" />
            </div>
          )}
          <div>
            <label className="text-dark-200 text-xs font-semibold uppercase tracking-wide block mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com"
              className="w-full bg-dark-500 border border-dark-300 rounded-lg px-3 py-2.5 text-dark-50 text-sm outline-none focus:border-brand/40 transition-colors" />
          </div>
          <div>
            <label className="text-dark-200 text-xs font-semibold uppercase tracking-wide block mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
              onKeyDown={e => e.key === "Enter" && submit()}
              className="w-full bg-dark-500 border border-dark-300 rounded-lg px-3 py-2.5 text-dark-50 text-sm outline-none focus:border-brand/40 transition-colors" />
          </div>
          <Button onClick={submit} loading={loading} size="lg" className="w-full">
            {isRegister ? "Create Account" : "Sign In"}
          </Button>
          <p className="text-center text-dark-200 text-xs">
            {isRegister ? "Already have an account? " : "No account yet? "}
            <button onClick={() => setIsRegister(!isRegister)} className="text-brand font-semibold hover:underline">
              {isRegister ? "Sign In" : "Register"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
