import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Eye, EyeOff } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Email dan password harus diisi.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F6FBF7] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo & Title */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <img src="/logo-pemprov.png" alt="Logo Pemprov Kaltim" className="h-20 w-auto" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1B6B35]">TP PKK Kaltim</h1>
            <p className="text-sm text-gray-500">
              Sistem Monitoring Rencana & Realisasi Kegiatan
            </p>
          </div>
        </div>

        <Card className="shadow-md border-[#d1e8d5]">
          <CardHeader className="pb-4">
            <CardTitle className="text-[#1B6B35] text-lg">
              Masuk ke Sistem
            </CardTitle>
            <CardDescription>
              Gunakan akun yang diberikan oleh Administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@pkk-kaltim.go.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="border-[#d1e8d5] focus-visible:ring-[#52B788]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="border-[#d1e8d5] focus-visible:ring-[#52B788] pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-transparent"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-200">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-[#1B6B35] hover:bg-[#134D26] text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  "Masuk"
                )}
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t border-[#EAF5EC]">
              <p className="text-xs text-gray-400 text-center">
                Lupa password? Hubungi Administrator sistem.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400">
          &copy; 2026 Pemerintah Provinsi Kalimantan Timur
        </p>
      </div>
    </div>
  );
}
