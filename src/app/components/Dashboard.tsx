import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Truck, Wrench, FileText, DollarSign, AlertTriangle, ChevronRight, Calendar, TrendingUp, Plus, Package, ClipboardList, FilePlus, Info, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "../../lib/supabase";

type Veiculo = { id: string; placa: string; marca: string; modelo: string; status?: string | null };
type Ordem = {
  id: string; numero: number; veiculo_id: string; tipo_manutencao: string;
  status: string; data_solicitacao: string; data_conclusao?: string | null;
  custo_total?: number | string | null; quilometragem?: number | null;
};

const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const dataBR = (valor?: string | null) => valor ? new Date(`${valor.slice(0,10)}T12:00:00`).toLocaleDateString("pt-BR") : "—";

export function Dashboard() {
  const navigate = useNavigate();
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [ordens, setOrdens] = useState<Ordem[]>([]);
  const [documentos, setDocumentos] = useState<{ id: string; status: string; dias_restantes: number | null }[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const hoje = new Date();
  const dataAtual = hoje.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const carregarDashboard = async () => {
    setCarregando(true);
    setErro("");
    const [veicRes, osRes, docsRes] = await Promise.all([
      supabase.from("veiculos").select("id,placa,marca,modelo,status"),
      supabase.from("ordens_servico").select("id,numero,veiculo_id,tipo_manutencao,status,data_solicitacao,data_conclusao,custo_total,quilometragem").order("data_solicitacao", { ascending: false }),
      supabase.from("documentos_status").select("id,status,dias_restantes"),
    ]);
    if (veicRes.error || osRes.error || docsRes.error) {
      const msg = veicRes.error?.message || osRes.error?.message || docsRes.error?.message || "Erro desconhecido";
      setErro(`Não foi possível carregar todos os indicadores: ${msg}`);
    }
    setVeiculos(veicRes.data ?? []);
    setOrdens(osRes.data ?? []);
    setDocumentos(docsRes.data ?? []);
    setCarregando(false);
  };

  useEffect(() => { void carregarDashboard(); }, []);

  const emManutencao = ordens.filter(o => ["Agendada", "Em Andamento", "Na Concessionária"].includes(o.status)).length;
  const pendentes = ordens.filter(o => o.status !== "Concluída").length;
  const custosTotal = ordens.filter(o => o.status === "Concluída").reduce((s,o) => s + Number(o.custo_total ?? 0), 0);
  const ultimas = [...ordens].sort((a,b) => (b.data_solicitacao || "").localeCompare(a.data_solicitacao || "")).slice(0,4);
  const custosMensais = useMemo(() => {
    const meses = Array.from({length:6}, (_,i) => {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - (5-i), 1);
      return { key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`, mes: d.toLocaleDateString("pt-BR",{month:"short"}).replace(".",""), valor: 0 };
    });
    ordens.filter(o => o.status === "Concluída" && o.data_conclusao).forEach(o => {
      const key = String(o.data_conclusao).slice(0,7);
      const m = meses.find(x => x.key === key);
      if (m) m.valor += Number(o.custo_total ?? 0);
    });
    return meses;
  }, [ordens]);
  const cards = [
    { label: "Veículos", value: String(veiculos.length), icon: Truck, color: "#e8192c", bg: "rgba(232,25,44,0.08)", desc: "Total cadastrado na frota", path: "/app/veiculos" },
    { label: "Em Manutenção", value: String(emManutencao), icon: Wrench, color: "#f59e0b", bg: "rgba(245,158,11,0.08)", desc: "Agendadas ou em execução", path: "/app/manutencao" },
    { label: "OS Pendentes", value: String(pendentes), icon: FileText, color: "#3b82f6", bg: "rgba(59,130,246,0.08)", desc: "Aguardando conclusão", path: "/app/manutencao" },
    { label: "Custos registrados", value: moeda(custosTotal), icon: DollarSign, color: "#10b981", bg: "rgba(16,185,129,0.08)", desc: "Total das OS concluídas", path: "/app/manutencao" },
  ];
  const acoesRapidas = [
    { label: "Cadastrar veículo", description: "Adicionar um veículo à frota", icon: Truck, path: "/app/veiculos", color: "#e8192c" },
    { label: "Abrir solicitação", description: "Registrar uma manutenção", icon: ClipboardList, path: "/app/manutencao", color: "#f59e0b" },
    { label: "Cadastrar peça", description: "Atualizar o estoque", icon: Package, path: "/app/pecas", color: "#3b82f6" },
    { label: "Documentos", description: "Consultar vencimentos", icon: FilePlus, path: "/app/documentacao", color: "#10b981" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div><h1 className="text-gray-800" style={{ fontSize: "2rem", fontWeight: 800 }}>Painel Principal</h1><p className="text-gray-500 text-base mt-1">Visão geral da frota</p></div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm"><Calendar size={18} className="text-gray-400" /><span className="text-base font-medium text-gray-600 capitalize">{dataAtual}</span></div>
          <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-bold shadow-md" style={{ background: "#e8192c" }}>A</div><span className="text-base font-semibold text-gray-700">Administrador</span></div>
          <button onClick={carregarDashboard} disabled={carregando} className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50" title="Atualizar indicadores"><RefreshCw size={17} className={carregando ? "animate-spin" : ""}/></button>
        </div>
      </div>

      {erro && <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 mb-6 text-sm text-red-700"><AlertTriangle size={18}/>{erro}</div>}
      {carregando && <p className="text-sm text-gray-500 mb-4">Atualizando indicadores do Supabase...</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card,i) => { const Icon=card.icon; return (
          <div key={card.label} className="bg-white rounded-2xl p-6 border border-gray-100 transition-all duration-200 cursor-pointer" role="button" tabIndex={0} onClick={()=>navigate(card.path)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" ")navigate(card.path)}} style={{boxShadow:hoveredCard===i?"0 12px 32px rgba(0,0,0,0.12)":"0 4px 12px rgba(0,0,0,0.06)",transform:hoveredCard===i?"translateY(-4px)":"none"}} onMouseEnter={()=>setHoveredCard(i)} onMouseLeave={()=>setHoveredCard(null)}>
            <div className="flex items-center justify-between mb-4"><div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{background:card.bg}}><Icon size={28} style={{color:card.color}}/></div><TrendingUp size={20} className="text-green-500"/></div>
            <div className="text-gray-800 mb-1" style={{fontSize:i===3?"1.65rem":"2.5rem",fontWeight:800,lineHeight:1.15}}>{carregando?"—":card.value}</div>
            <div className="text-gray-600 text-lg font-bold">{card.label}</div><div className="text-gray-400 text-sm mt-1">{card.desc}</div>
          </div>
        )})}
      </div>

      <section className="bg-white rounded-2xl p-5 md:p-6 border border-gray-100 mb-8" style={{boxShadow:"0 4px 12px rgba(0,0,0,0.06)"}}>
        <div className="flex items-center justify-between mb-4"><div><h3 className="text-gray-800 text-lg font-bold">Ações rápidas</h3><p className="text-sm text-gray-500 mt-1">Atalhos para as tarefas mais comuns da operação.</p></div><Plus size={19} className="text-gray-400"/></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">{acoesRapidas.map(acao=>{const Icon=acao.icon;return <button key={acao.label} onClick={()=>navigate(acao.path)} className="flex items-center gap-3 text-left p-4 rounded-xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-colors"><span className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:`${acao.color}14`}}><Icon size={21} style={{color:acao.color}}/></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-gray-800">{acao.label}</span><span className="block text-xs text-gray-500 mt-0.5">{acao.description}</span></span><ChevronRight size={16} className="text-gray-400"/></button>})}</div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100" style={{boxShadow:"0 4px 12px rgba(0,0,0,0.06)"}}>
          <div className="flex items-center justify-between mb-6"><h3 className="text-gray-800 text-xl font-bold">Custos de Manutenção</h3><span className="text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">Últimos 6 meses</span></div>
          <ResponsiveContainer width="100%" height={320}><BarChart data={custosMensais} margin={{top:10,right:10,left:-10,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/><XAxis dataKey="mes" tick={{fontSize:13,fill:"#6b7280",fontWeight:500}} axisLine={false} tickLine={false} dy={10}/><YAxis tick={{fontSize:13,fill:"#6b7280",fontWeight:500}} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`} dx={-10}/><Tooltip contentStyle={{borderRadius:16,border:"none",boxShadow:"0 8px 24px rgba(0,0,0,0.15)",fontSize:14,fontWeight:600}} formatter={(value:number)=>[moeda(value),"Custo"]}/><Bar dataKey="valor" fill="#e8192c" radius={[4,4,0,0]} maxBarSize={50}/></BarChart></ResponsiveContainer>
          {ordens.filter(o=>o.status==="Concluída"&&o.data_conclusao).length===0 && <p className="text-center text-xs text-gray-400 mt-2">Ainda não há custos de OS concluídas nos últimos meses.</p>}
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100" style={{boxShadow:"0 4px 12px rgba(0,0,0,0.06)"}}>
          <div className="flex items-center justify-between mb-5"><h3 className="text-gray-800 text-lg font-bold">Últimas Manutenções</h3><button onClick={()=>navigate("/app/manutencao")} className="text-sm font-semibold flex items-center gap-1 hover:opacity-80" style={{color:"#e8192c"}}>Ver todas <ChevronRight size={16}/></button></div>
          <div className="space-y-4">
            {ultimas.map(o=>{const v=veiculos.find(x=>x.id===o.veiculo_id);return <div key={o.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer" onClick={()=>navigate("/app/manutencao")}><div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:o.tipo_manutencao==="Preventiva"?"rgba(16,185,129,0.1)":"rgba(232,25,44,0.1)"}}><Wrench size={19} style={{color:o.tipo_manutencao==="Preventiva"?"#10b981":"#e8192c"}}/></div><div className="min-w-0"><div className="text-sm font-bold text-gray-800">OS #{o.numero} · {v?.placa ?? "Veículo"}</div><div className="text-xs text-gray-500 mt-1">{o.tipo_manutencao} · {dataBR(o.data_solicitacao)}</div><div className="text-xs text-gray-500 mt-1">{o.status}</div></div></div>})}
            {ultimas.length===0&&!carregando&&<p className="text-sm text-gray-400">Nenhuma manutenção registrada.</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100" style={{boxShadow:"0 4px 12px rgba(0,0,0,0.06)"}}>
          <h3 className="text-gray-800 text-lg font-bold mb-2">Documentação</h3>
          <p className="text-sm text-gray-500">Documentos cadastrados: <strong>{carregando ? "—" : documentos.length}</strong></p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-lg bg-emerald-50 p-2"><strong className="block text-emerald-700">{documentos.filter(d => (d.status || "").toLowerCase().includes("válido") || (d.status || "").toLowerCase().includes("valido")).length}</strong><span className="text-gray-500">Válidos</span></div>
            <div className="rounded-lg bg-amber-50 p-2"><strong className="block text-amber-700">{documentos.filter(d => (d.status || "").toLowerCase().includes("vencer")).length}</strong><span className="text-gray-500">A vencer</span></div>
            <div className="rounded-lg bg-red-50 p-2"><strong className="block text-red-700">{documentos.filter(d => (d.status || "").toLowerCase().includes("vencid")).length}</strong><span className="text-gray-500">Vencidos</span></div>
          </div>
          <button onClick={()=>navigate("/app/documentacao")} className="mt-4 text-sm font-semibold" style={{color:"#e8192c"}}>Acessar documentação <ChevronRight size={15} className="inline"/></button>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100" style={{boxShadow:"0 4px 12px rgba(0,0,0,0.06)"}}>
          <h3 className="text-gray-800 text-lg font-bold mb-3">Situação das ordens</h3>
          <div className="space-y-3">{["Aberta","Agendada","Em Andamento","Na Concessionária","Concluída"].map(st=><div key={st} className="flex justify-between text-sm"><span className="text-gray-600">{st}</span><strong className="text-gray-800">{ordens.filter(o=>o.status===st).length}</strong></div>)}</div>
        </div>
      </div>
    </div>
  );
}
