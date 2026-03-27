"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Link from "next/link";
import { Droplets, Mail, Lock, User, Shield, ArrowLeft } from "lucide-react";

export function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("login");
  const router = useRouter();

  const allowedDomain = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || "";

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/");
      }
    });
  }, [router]);

  const validateEmailDomain = (emailToValidate: string): boolean => {
    if (!allowedDomain) return true;
    const emailDomain = emailToValidate.split("@")[1];
    return emailDomain === allowedDomain;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = getSupabase();

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast.success("Login realizado com sucesso!");
      router.push("/");
    } catch (error: any) {
      let message = error.message || "Erro ao fazer login";
      if (message.includes("Email not confirmed")) {
        message = "Email não confirmado. Verifique sua caixa de entrada e confirme seu email.";
      } else if (message.includes("Invalid login credentials")) {
        message = "Email ou senha incorretos";
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = getSupabase();

    try {
      if (!validateEmailDomain(email)) {
        toast.error(`Apenas emails ${allowedDomain} são permitidos para cadastro.`);
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        toast.error("As senhas não coincidem");
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        toast.error("A senha deve ter pelo menos 6 caracteres");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      if (error) throw error;
      toast.success("Conta criada! Verifique seu email para confirmar.");
      setTab("login");
    } catch (error: any) {
      let message = error.message || "Erro ao criar conta";
      if (message.includes("already registered")) {
        message = "Este email já está cadastrado";
      } else if (message.includes("Password should be at least")) {
        message = "A senha deve ter pelo menos 6 caracteres";
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-red-50/30 to-slate-100 p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
      </div>

      {/* Logo & Brand */}
      <div className="relative z-10 mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-3 mb-2">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#54c0eb' }}>
            <Droplets className="w-8 h-8 text-white" />
          </div>
        </Link>
        <h1 className="text-2xl font-bold text-[#ff5959]">Hidrantes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerenciamento de hidrantes de incêndio
        </p>
      </div>

      {/* Auth Card */}
      <Card className="relative z-10 w-full max-w-md shadow-xl border-0 bg-card/80 backdrop-blur">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl font-semibold text-center">
            {tab === "login" ? "Bem-vindo de volta" : "Criar sua conta"}
          </CardTitle>
          <CardDescription className="text-center">
            {tab === "login"
              ? "Entre com suas credenciais para continuar"
              : allowedDomain
              ? `Cadastro limitado a emails @${allowedDomain}`
              : "Preencha os dados abaixo para se cadastrar"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="text-sm">
                Entrar
              </TabsTrigger>
              <TabsTrigger value="signup" className="text-sm">
                Cadastrar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-sm font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 h-12"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm font-medium">
                    Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⟳</span>
                      Entrando...
                    </span>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-sm font-medium">
                    Nome completo
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="pl-10 h-12"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-medium">
                    Email {allowedDomain && `(use @${allowedDomain})`}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder={allowedDomain ? `seu@${allowedDomain}` : "seu@email.com"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 h-12"
                    />
                  </div>
                  {allowedDomain && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Shield className="w-3 h-3" />
                      Apenas emails @{allowedDomain} são permitidos
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-medium">
                    Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm" className="text-sm font-medium">
                    Confirmar senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-confirm"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⟳</span>
                      Criando conta...
                    </span>
                  ) : (
                    "Criar conta"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Back to Home */}
      <Link
        href="/"
        className="relative z-10 mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para o mapa
      </Link>
    </div>
  );
}
