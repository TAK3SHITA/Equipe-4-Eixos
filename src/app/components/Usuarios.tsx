import { useCallback, useEffect, useState } from "react";
import { Check, X, RefreshCw, Users, Shield, Clock, UserX, Save, Lock } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

type Usuario = {
  id: string;
  nome: string;
  usuario: string;
  email: string | null;
  perfil: string;
  ativo: boolean;
  status_aprovacao?: string | null;
};

const EMAIL_ADMIN_PRINCIPAL = "takeshitabr@gmail.com";
const FUNCOES = ["Motorista", "Mecânico", "Administrador"] as const;

const perfilColors: Record<string, { bg: string; text: string }> = {
  Administrador: { bg: "rgba(232,25,44,0.1)", text: "#e8192c" },
  Gerente: { bg: "rgba(59,130,246,0.1)", text: "#3b82f6" },
  Motorista: { bg: "rgba(16,185,129,0.1)", text: "#10b981" },
  Mecânico: { bg: "rgba(245,158,11,0.1)", text: "#f59e0b" },
};

export function Usuarios() {
  const { perfil, user } = useAuth();
  const emailLogado = (user?.email ?? "").trim().toLowerCase();
  const isAdminPrincipal = emailLogado === EMAIL_ADMIN_PRINCIPAL;
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState<string | null>(null);
  const [funcoesSelecionadas, setFuncoesSelecionadas] = useState<Record<string, string>>({});
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const carregarUsuarios = useCallback(async () => {
    setCarregando(true);
    setErro("");
    const { data, error } = await supabase
      .from("perfis")
      .select("id,nome,usuario,email,perfil,ativo,status_aprovacao")
      .order("nome", { ascending: true });
    if (error) {
      setErro("Não foi possível carregar os usuários. Verifique as permissões do Supabase.");
      console.error("Erro ao carregar usuários:", error.message);
    } else {
      const lista = (data ?? []) as Usuario[];
      setUsuarios(lista);
      setFuncoesSelecionadas(Object.fromEntries(lista.map((u) => [u.id, u.perfil])));
    }
    setCarregando(false);
  }, []);

  useEffect(() => { carregarUsuarios(); }, [carregarUsuarios]);

  const decidirCadastro = async (id: string, aprovar: boolean) => {
    setProcessando(id);
    setMensagem("");
    setErro("");
    const { error } = await supabase.rpc(aprovar ? "aprovar_usuario" : "rejeitar_usuario", { p_usuario_id: id });
    if (error) {
      setErro("Não foi possível concluir a ação. Confira se o script SQL de aprovação foi executado.");
      console.error("Erro ao decidir cadastro:", error.message);
    } else {
      setMensagem(aprovar ? "Usuário aprovado e ativado com sucesso." : "Cadastro rejeitado. O usuário continuará sem acesso ao sistema.");
      await carregarUsuarios();
    }
    setProcessando(null);
  };

  const salvarFuncao = async (alvo: Usuario) => {
    const novaFuncao = funcoesSelecionadas[alvo.id] ?? alvo.perfil;
    if (!FUNCOES.includes(novaFuncao as typeof FUNCOES[number])) {
      setErro("Selecione uma função válida.");
      return;
    }
    if (novaFuncao === alvo.perfil) return;

    if (alvo.perfil === "Administrador" && !isAdminPrincipal) {
      setErro("Somente o administrador principal pode alterar a função de outro administrador.");
      return;
    }
    if (novaFuncao === "Administrador" && !isAdminPrincipal) {
      setErro("Somente o administrador principal pode promover usuários a Administrador.");
      return;
    }
    if (novaFuncao === "Administrador") {
      const confirmar = window.confirm(
        `Confirma a promoção de ${alvo.nome} para Administrador? Essa função concede acesso administrativo ao sistema.`
      );
      if (!confirmar) {
        setFuncoesSelecionadas((atual) => ({ ...atual, [alvo.id]: alvo.perfil }));
        return;
      }
    } else {
      const confirmar = window.confirm(`Confirma a alteração da função de ${alvo.nome} para ${novaFuncao}?`);
      if (!confirmar) {
        setFuncoesSelecionadas((atual) => ({ ...atual, [alvo.id]: alvo.perfil }));
        return;
      }
    }

    setProcessando(alvo.id);
    setMensagem("");
    setErro("");
    const { error } = await supabase.rpc("alterar_perfil_usuario", {
      p_usuario_id: alvo.id,
      p_novo_perfil: novaFuncao,
    });
    if (error) {
      setErro(error.message.includes("ADMIN_ALVO_PROTEGIDO")
        ? "Este administrador está protegido. Somente o administrador principal pode alterar sua função."
        : error.message.includes("PROMOCAO_ADMIN_NAO_AUTORIZADA")
          ? "Somente o administrador principal pode promover usuários a Administrador."
          : `Não foi possível alterar a função: ${error.message}`);
      setFuncoesSelecionadas((atual) => ({ ...atual, [alvo.id]: alvo.perfil }));
      console.error("Erro ao alterar função:", error.message);
    } else {
      setMensagem(`Função de ${alvo.nome} alterada para ${novaFuncao}.`);
      await carregarUsuarios();
    }
    setProcessando(null);
  };

  if (perfil?.perfil !== "Administrador") {
    return <div className="p-8"><div className="bg-white rounded-2xl p-6 border border-gray-100"><h1 className="text-xl font-bold text-gray-800">Acesso restrito</h1><p className="text-gray-500 mt-2">Somente administradores podem gerenciar usuários.</p></div></div>;
  }

  const pendentes = usuarios.filter((u) => u.status_aprovacao === "pendente" && u.perfil !== "Administrador");
  const ativos = usuarios.filter((u) => u.ativo && u.status_aprovacao === "aprovado");

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-gray-800" style={{ fontSize: "1.75rem", fontWeight: 700 }}>Usuários</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie os acessos, as funções e aprove novos cadastros.</p>
          <p className="text-xs text-gray-500 mt-1">{isAdminPrincipal ? "Administrador principal: controle completo das funções." : "Administrador: pode alterar Motorista e Mecânico. Contas Administrador são protegidas."}</p>
        </div>
        <button onClick={carregarUsuarios} disabled={carregando} className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50">
          <RefreshCw size={17} className={carregando ? "animate-spin" : ""} /> Atualizar
        </button>
      </div>

      {mensagem && <div role="status" className="p-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">{mensagem}</div>}
      {erro && <div role="alert" className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-100">{erro}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-4"><Clock className="text-amber-500" size={25}/><div><p className="text-gray-500 text-sm">Aguardando aprovação</p><p className="text-2xl font-bold text-gray-800">{pendentes.length}</p></div></div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-4"><Users className="text-emerald-500" size={25}/><div><p className="text-gray-500 text-sm">Usuários ativos</p><p className="text-2xl font-bold text-gray-800">{ativos.length}</p></div></div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-4"><UserX className="text-gray-400" size={25}/><div><p className="text-gray-500 text-sm">Cadastros sem acesso</p><p className="text-2xl font-bold text-gray-800">{usuarios.filter(u => u.status_aprovacao === "rejeitado" || (!u.ativo && u.status_aprovacao !== "pendente")).length}</p></div></div>
      </div>

      <section className="bg-white rounded-2xl border border-amber-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2"><Clock size={18} className="text-amber-500"/><h2 className="font-bold text-gray-800">Cadastros pendentes</h2></div>
        {carregando ? <p className="p-6 text-gray-500">Carregando usuários...</p> : pendentes.length === 0 ? <p className="p-6 text-gray-500">Não há cadastros aguardando aprovação.</p> : (
          <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr>{["Nome","Usuário","E-mail","Perfil","Ações"].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead><tbody>
            {pendentes.map(u=><tr key={u.id} className="border-t border-gray-100"><td className="px-5 py-4 font-semibold text-gray-800">{u.nome}</td><td className="px-5 py-4 text-gray-600">{u.usuario}</td><td className="px-5 py-4 text-gray-600">{u.email ?? "—"}</td><td className="px-5 py-4"><span className="text-sm px-3 py-1 rounded-full" style={{background:perfilColors[u.perfil]?.bg ?? "#f3f4f6",color:perfilColors[u.perfil]?.text ?? "#6b7280"}}><Shield size={13} className="inline mr-1"/>{u.perfil}</span></td><td className="px-5 py-4"><div className="flex gap-2"><button onClick={()=>decidirCadastro(u.id,true)} disabled={processando===u.id} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-50"><Check size={15}/> Aprovar</button><button onClick={()=>decidirCadastro(u.id,false)} disabled={processando===u.id} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm hover:bg-red-100 disabled:opacity-50"><X size={15}/> Rejeitar</button></div></td></tr>)}
          </tbody></table></div>
        )}
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100"><h2 className="font-bold text-gray-800">Usuários ativos</h2></div>
        <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr>{["Nome","Usuário","E-mail","Perfil","Status","Alterar função"].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead><tbody>
          {ativos.map(u => {
            const ehAdminAlvo = u.perfil === "Administrador";
            const bloqueado = ehAdminAlvo && !isAdminPrincipal;
            const podePromover = isAdminPrincipal;
            return <tr key={u.id} className="border-t border-gray-100">
              <td className="px-5 py-4 font-semibold text-gray-800">{u.nome}</td>
              <td className="px-5 py-4 text-gray-600">{u.usuario}</td>
              <td className="px-5 py-4 text-gray-600">{u.email ?? "—"}</td>
              <td className="px-5 py-4"><span className="text-sm px-3 py-1 rounded-full" style={{background:perfilColors[u.perfil]?.bg ?? "#f3f4f6",color:perfilColors[u.perfil]?.text ?? "#6b7280"}}>{u.perfil}</span></td>
              <td className="px-5 py-4"><span className="text-sm px-3 py-1 rounded-full bg-emerald-50 text-emerald-700">Ativo</span></td>
              <td className="px-5 py-4">
                {bloqueado ? <span className="inline-flex items-center gap-1 text-xs text-gray-500"><Lock size={14}/> Protegido</span> : (
                  <div className="flex items-center gap-2 min-w-[230px]">
                    <select value={funcoesSelecionadas[u.id] ?? u.perfil} onChange={(e) => setFuncoesSelecionadas((atual) => ({ ...atual, [u.id]: e.target.value }))} disabled={processando === u.id} className="border border-gray-200 rounded-lg px-2 py-2 text-sm bg-white disabled:opacity-50">
                      {FUNCOES.filter((f) => f !== "Administrador" || podePromover || u.perfil === "Administrador").map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <button onClick={() => salvarFuncao(u)} disabled={processando === u.id || (funcoesSelecionadas[u.id] ?? u.perfil) === u.perfil} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-gray-700 disabled:opacity-40"><Save size={14}/> Salvar</button>
                  </div>
                )}
              </td>
            </tr>;
          })}
          {ativos.length===0 && !carregando && <tr><td colSpan={6} className="p-6 text-gray-500">Nenhum usuário ativo encontrado.</td></tr>}
        </tbody></table></div>
      </section>
    </div>
  );
}
