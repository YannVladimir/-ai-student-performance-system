import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, GraduationCap, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { extractErrorMessage } from "../api/client";
import { homeFor } from "../routes/ProtectedRoute";
import { ErrorState } from "../components/States";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(homeFor(user.role), { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors duration-200">
      {/* Left panel: Branding / Visuals (only visible on md and up) */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-[radial-gradient(ellipse_at_top_right,_#2563eb,_#312e81,_#0a0a0a)] p-12 text-white md:flex">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="relative flex items-center gap-3">
          <div className="rounded-xl bg-white/10 p-2 backdrop-blur-md">
            <GraduationCap size={24} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight font-display">AISPS</span>
        </div>

        <div className="relative space-y-6">
          <h1 className="text-4xl font-extrabold tracking-tight font-display lg:text-5xl leading-tight">
            Predict academic risk.<br/>Empower student success.
          </h1>
          <p className="max-w-md text-base text-blue-100/90 font-medium leading-relaxed">
            University of Kigali's advanced analytics platform leverages machine learning to forecast academic performance, deliver personalized recommendations, and bridge the achievement gap.
          </p>
        </div>

        <div className="relative text-sm text-blue-200/50 font-medium">
          System By NTEZIRYAYO ALAIN FABRICE
        </div>
      </div>

      {/* Right panel: Login form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 md:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 text-left">
            {/* Small branding icon for mobile only */}
            <div className="mb-4 inline-flex rounded-xl bg-blue-600 p-2 text-white shadow-md shadow-blue-500/20 md:hidden dark:bg-blue-500">
              <GraduationCap size={24} />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-950 dark:text-white font-display">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 font-medium">
              Please enter your credentials to access your dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <ErrorState message={error} />}

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-medium outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-blue-500"
                placeholder="name@uok.ac.rw"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 pr-11 text-sm font-medium outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-blue-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 hover:shadow-xl active:scale-[0.98] disabled:opacity-60 disabled:hover:shadow-none"
            >
              {isSubmitting && <Loader2 className="animate-spin" size={16} />}
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
