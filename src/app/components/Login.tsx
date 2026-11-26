import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { Eye, EyeOff, Mail, Lock, Headphones, User, UserPlus, ArrowLeft } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import logoImg from "../../imports/image-2.png";

export default function Login({ isShowcase = false }: { isShowcase?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, session, perfil, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [modoCadastro, setModoCadastro] = useState(false);
  const [nome, setNome] = useState("");
  const [usuario, setUsuario] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setMensagem("");
    setEnviando(true);
    const resultado = await signIn(email, senha);
    setEnviando(false);
    if (resultado.error) {
      setErro(resultado.error);
      return;
    }
    const destino = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/app";
    navigate(destino, { replace: true });
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setMensagem("");

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas não conferem.");
      return;
    }
    if (!nome.trim() || !usuario.trim()) {
      setErro("Preencha seu nome e usuário.");
      return;
    }

    setEnviando(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: {
        data: {
          nome: nome.trim(),
          usuario: usuario.trim(),
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    setEnviando(false);

    if (error) {
      const msg = error.message.toLowerCase().includes("already registered")
        ? "Este e-mail já possui uma conta. Volte ao login ou use a recuperação de senha."
        : "Não foi possível criar a conta. Confira os dados e tente novamente.";
      setErro(msg);
      return;
    }

    setMensagem("Cadastro enviado! Sua conta será criada como Motorista e ficará aguardando a aprovação de um administrador. Se a confirmação de e-mail estiver ativada, confirme pelo link enviado.");
    setModoCadastro(false);
    setSenha("");
    setConfirmarSenha("");
    setNome("");
    setUsuario("");
  };

  const handleRecuperarSenha = async () => {
    if (!email.trim()) {
      setErro("Informe seu e-mail no campo acima para receber o link de recuperação.");
      return;
    }
    setErro("");
    setMensagem("");
    setEnviando(true);
    const { supabase } = await import("../../lib/supabase");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/`,
    });
    setEnviando(false);
    if (error) setErro("Não foi possível enviar o e-mail de recuperação. Tente novamente.");
    else setMensagem("Se o e-mail estiver cadastrado, você receberá as instruções para redefinir a senha.");
  };

  useEffect(() => {
    if (!isShowcase && !loading && session && perfil?.ativo) navigate("/app", { replace: true });
  }, [isShowcase, loading, session, perfil, navigate]);

  return (
    <div className={isShowcase ? "relative w-full h-full flex flex-col items-center justify-between overflow-hidden bg-[#0a0f18]" : "relative min-h-screen w-full flex flex-col items-center justify-between overflow-hidden bg-[#0a0f18]"}>
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 z-0 flex justify-center">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1550774596-0a51e7cdf479?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaWdodCUyMGhpZ2h3YXklMjB0cnVjayUyMGhlYWRsaWdodHMlMjBmcm9udHxlbnwxfHx8fDE3NzczOTIyMDB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Night Highway"
          className="w-full h-full object-cover object-bottom opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f18] via-[#0a0f18]/60 to-[#0a0f18]/90 pointer-events-none" />
      </div>

      {/* Main Content Container */}
      <div className={isShowcase ? "relative z-10 w-full flex-1 flex flex-col px-4 pt-6 pb-4 overflow-y-auto overflow-x-hidden mx-auto" : "relative z-10 w-full h-full min-h-screen flex flex-col px-6 sm:px-12 pb-12 pt-12 md:pt-20 max-w-[500px] mx-auto"}>
        {/* Header Section */}
        <div className="flex flex-col items-center text-center">
          <img
            src={logoImg}
            alt="Equipe 4 Eixos"
            className={isShowcase ? "w-[200px] h-auto object-contain mb-6 drop-shadow-2xl" : "w-full max-w-[280px] md:max-w-[340px] h-auto object-contain mb-8 md:mb-12 drop-shadow-2xl"}
          />

          <h1 className={isShowcase ? "text-white font-black text-2xl leading-[1.15] tracking-tight mb-2 uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]" : "text-white font-black text-3xl md:text-4xl leading-[1.15] tracking-tight mb-4 uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"}>
            Sistema de<br />Gestão de Frota
          </h1>
          <p className="text-gray-300 text-base md:text-lg font-medium leading-relaxed max-w-[320px] drop-shadow-md">
            Controle completo da sua frota na palma da mão.
          </p>
        </div>

        {/* Spacer to push form to bottom */}
        <div className="flex-1 min-h-[60px]" />

        {/* Login Form Section */}
        <div className="w-full bg-[#0a0f18]/40 p-6 md:p-8 rounded-3xl backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          {modoCadastro ? (
            <form onSubmit={handleCadastro} className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="text-white text-xl font-bold">Criar conta</h2>
                <p className="text-gray-400 text-sm mt-1">Preencha seus dados para solicitar acesso.</p>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User size={20} className="text-gray-400" /></div>
                <input type="text" placeholder="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" className="w-full pl-12 pr-4 py-4 bg-white/5 hover:bg-white/10 focus:bg-white/15 border border-white/10 focus:border-red-500/50 rounded-2xl text-white placeholder-gray-400 focus:outline-none transition-all duration-300" required />
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><UserPlus size={20} className="text-gray-400" /></div>
                <input type="text" placeholder="Nome de usuário" value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" className="w-full pl-12 pr-4 py-4 bg-white/5 hover:bg-white/10 focus:bg-white/15 border border-white/10 focus:border-red-500/50 rounded-2xl text-white placeholder-gray-400 focus:outline-none transition-all duration-300" required />
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail size={20} className="text-gray-400" /></div>
                <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="w-full pl-12 pr-4 py-4 bg-white/5 hover:bg-white/10 focus:bg-white/15 border border-white/10 focus:border-red-500/50 rounded-2xl text-white placeholder-gray-400 focus:outline-none transition-all duration-300" required />
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock size={20} className="text-gray-400" /></div>
                <input type={showSenha ? "text" : "password"} placeholder="Senha (mínimo 6 caracteres)" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" className="w-full pl-12 pr-12 py-4 bg-white/5 hover:bg-white/10 focus:bg-white/15 border border-white/10 focus:border-red-500/50 rounded-2xl text-white placeholder-gray-400 focus:outline-none transition-all duration-300" required minLength={6} />
                <button type="button" onClick={() => setShowSenha(!showSenha)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white">{showSenha ? <EyeOff size={20} /> : <Eye size={20} />}</button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock size={20} className="text-gray-400" /></div>
                <input type={showConfirmarSenha ? "text" : "password"} placeholder="Confirmar senha" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} autoComplete="new-password" className="w-full pl-12 pr-12 py-4 bg-white/5 hover:bg-white/10 focus:bg-white/15 border border-white/10 focus:border-red-500/50 rounded-2xl text-white placeholder-gray-400 focus:outline-none transition-all duration-300" required />
                <button type="button" onClick={() => setShowConfirmarSenha(!showConfirmarSenha)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white">{showConfirmarSenha ? <EyeOff size={20} /> : <Eye size={20} />}</button>
              </div>
              <button type="submit" disabled={enviando} className="w-full mt-4 py-4 bg-[#e8192c] hover:bg-[#d01526] active:bg-[#b0101e] text-white rounded-2xl font-bold text-[16px] tracking-wide transition-all duration-300 disabled:opacity-60">
                {enviando ? "CRIANDO CONTA..." : "CRIAR CONTA"}
              </button>
              <button type="button" onClick={() => { setModoCadastro(false); setErro(""); setMensagem(""); }} className="w-full flex items-center justify-center gap-2 text-gray-300 hover:text-white text-sm font-medium py-2">
                <ArrowLeft size={16} /> Voltar para o login
              </button>
              {erro && <p role="alert" className="text-red-300 text-sm text-center">{erro}</p>}
              {mensagem && <p role="status" className="text-emerald-300 text-sm text-center">{mensagem}</p>}
            </form>
          ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Usuário Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail size={20} className="text-gray-400 group-focus-within:text-red-500 transition-colors" />
              </div>
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                className="w-full pl-12 pr-4 py-4 bg-white/5 hover:bg-white/10 focus:bg-white/15 border border-white/10 focus:border-red-500/50 rounded-2xl text-white placeholder-gray-400 focus:outline-none transition-all duration-300"
                required
              />
            </div>

            {/* Senha Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={20} className="text-gray-400 group-focus-within:text-red-500 transition-colors" />
              </div>
              <input
                type={showSenha ? "text" : "password"}
                placeholder="Senha"
                value={senha}
                autoComplete="current-password"
                onChange={(e) => setSenha(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-white/5 hover:bg-white/10 focus:bg-white/15 border border-white/10 focus:border-red-500/50 rounded-2xl text-white placeholder-gray-400 focus:outline-none transition-all duration-300"
                required
              />
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
              >
                {showSenha ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={enviando}
              className="w-full mt-6 py-4 bg-[#e8192c] hover:bg-[#d01526] active:bg-[#b0101e] text-white rounded-2xl font-bold text-[16px] tracking-wide transition-all duration-300 shadow-[0_4px_14px_0_rgba(232,25,44,0.39)] hover:shadow-[0_6px_20px_rgba(232,25,44,0.4)] hover:-translate-y-0.5"
            >
              {enviando ? "AGUARDE..." : "ENTRAR"}
            </button>
            {erro && <p role="alert" className="text-red-300 text-sm text-center">{erro}</p>}
            {mensagem && <p role="status" className="text-emerald-300 text-sm text-center">{mensagem}</p>}
          </form>
          )}

          {/* Links */}
          {!modoCadastro && <div className="mt-6 flex flex-col items-center gap-3">
            {!isShowcase && (
              <p className="text-gray-400 text-sm">
                Não tem uma conta?{" "}
                <button type="button" onClick={() => { setModoCadastro(true); setErro(""); setMensagem(""); }} className="text-white hover:text-[#e8192c] font-bold transition-colors">
                  Criar conta
                </button>
              </p>
            )}
            <button type="button" onClick={handleRecuperarSenha} disabled={enviando} className="text-gray-400 hover:text-[#e8192c] text-sm font-medium transition-colors disabled:opacity-50">
              Esqueci minha senha
            </button>
          </div>}

          {/* Central de Dúvidas */}
          <div className="mt-8 border border-white/10 rounded-2xl p-4 flex items-center gap-4 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 shadow-sm flex-shrink-0 group-hover:bg-[#e8192c]/20 transition-colors">
              <Headphones size={20} className="text-gray-300 group-hover:text-[#e8192c] transition-colors" />
            </div>
            <div>
              <p className="text-white text-[14px] font-bold group-hover:text-gray-100 transition-colors">Central de Dúvidas</p>
              <p className="text-gray-400 text-[12px] mt-0.5 group-hover:text-gray-300 transition-colors">Precisa de ajuda? Fale conosco.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}