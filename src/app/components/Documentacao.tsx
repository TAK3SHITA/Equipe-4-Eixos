import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Plus, Search, X, ChevronLeft, FileText, Pencil, Trash2, RefreshCw, AlertTriangle } from "lucide-react";

type Veiculo = { id: string; placa: string; marca: string; modelo: string };
type Documento = {
  id: string;
  veiculo_id: string;
  tipo_documento: string;
  vencimento: string;
  dias_restantes: number | null;
  status: string;
  placa?: string;
};
const tiposDoc = ["Licenciamento", "Seguro", "Vistoria", "Tacógrafo", "ANTT", "Outros"];
const statusStyle: Record<string, { bg: string; color: string; border: string }> = {
  "Válido": { bg: "rgba(16,185,129,.1)", color: "#10b981", border: "rgba(16,185,129,.2)" },
  "A Vencer": { bg: "rgba(245,158,11,.1)", color: "#d97706", border: "rgba(245,158,11,.2)" },
  "Vencido": { bg: "rgba(232,25,44,.1)", color: "#e8192c", border: "rgba(232,25,44,.2)" },
};
function formatarData(v: string) {
  if (!v) return "";
  const [a,m,d] = v.slice(0,10).split("-");
  return `${d}/${m}/${a}`;
}
function classificar(status: string | null, dias: number | null) {
  if (status) {
    if (status.toLowerCase().includes("vencid")) return "Vencido";
    if (status.toLowerCase().includes("vencer")) return "A Vencer";
    if (status.toLowerCase().includes("válido") || status.toLowerCase().includes("valido")) return "Válido";
  }
  if (dias !== null && dias < 0) return "Vencido";
  if (dias !== null && dias <= 30) return "A Vencer";
  return "Válido";
}
export function Documentacao() {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [busca, setBusca] = useState("");
  const [tipoSel, setTipoSel] = useState("Todos");
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm] = useState({ veiculo_id: "", tipo_documento: "", vencimento: "" });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = async () => {
    setCarregando(true); setErro("");
    const [docsRes, statusRes, veicRes] = await Promise.all([
      supabase.from("documentos").select("id,veiculo_id,tipo_documento,vencimento").order("vencimento"),
      supabase.from("documentos_status").select("id,veiculo_id,tipo_documento,vencimento,dias_restantes,status"),
      supabase.from("veiculos").select("id,placa,marca,modelo").order("placa"),
    ]);
    const falha = docsRes.error || statusRes.error || veicRes.error;
    if (falha) { setErro(`Não foi possível carregar os documentos: ${falha.message}`); setCarregando(false); return; }
    const veics = veicRes.data ?? [];
    const statusRows = statusRes.data ?? [];
    setVeiculos(veics);
    setDocumentos((docsRes.data ?? []).map((d: any) => {
      const st = statusRows.find((x: any) => x.id === d.id);
      return { ...d, dias_restantes: st?.dias_restantes ?? null, status: classificar(st?.status ?? null, st?.dias_restantes ?? null), placa: veics.find(v => v.id === d.veiculo_id)?.placa ?? "Veículo não encontrado" };
    }));
    setCarregando(false);
  };
  useEffect(() => { void carregar(); }, []);

  const filtrados = useMemo(() => documentos.filter(d =>
    (d.placa ?? "").toLowerCase().includes(busca.toLowerCase()) ||
    d.tipo_documento.toLowerCase().includes(busca.toLowerCase())
  ).filter(d => tipoSel === "Todos" || d.tipo_documento === tipoSel), [documentos,busca,tipoSel]);

  const abrirNovo = () => { setEditando(null); setForm({veiculo_id:"",tipo_documento:"",vencimento:""}); setErro(""); setShowForm(true); };
  const abrirEdicao = (d: Documento) => { setEditando(d.id); setForm({veiculo_id:d.veiculo_id,tipo_documento:d.tipo_documento,vencimento:d.vencimento}); setErro(""); setShowForm(true); };
  const salvar = async () => {
    if (!form.veiculo_id || !form.tipo_documento || !form.vencimento) { setErro("Preencha veículo, tipo de documento e vencimento."); return; }
    setSalvando(true); setErro("");
    const payload = { veiculo_id: form.veiculo_id, tipo_documento: form.tipo_documento, vencimento: form.vencimento };
    const result = editando
      ? await supabase.from("documentos").update(payload).eq("id", editando)
      : await supabase.from("documentos").insert(payload);
    if (result.error) setErro(`Não foi possível salvar: ${result.error.message}`);
    else { setShowForm(false); setForm({veiculo_id:"",tipo_documento:"",vencimento:""}); await carregar(); }
    setSalvando(false);
  };
  const excluir = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este documento?")) return;
    const { error } = await supabase.from("documentos").delete().eq("id", id);
    if (error) setErro(`Não foi possível excluir: ${error.message}`); else await carregar();
  };
  const totais = {
    total: documentos.length,
    validos: documentos.filter(d => d.status === "Válido").length,
    vencer: documentos.filter(d => d.status === "A Vencer").length,
    vencidos: documentos.filter(d => d.status === "Vencido").length,
  };

  if (showForm) return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setShowForm(false)} className="flex items-center gap-1.5 text-base text-gray-500 hover:text-gray-800"><ChevronLeft size={18}/>Voltar</button>
        <h1 className="text-gray-800" style={{fontSize:"1.6rem",fontWeight:700}}>{editando ? "Editar Documento" : "Novo Documento"}</h1>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 max-w-3xl">
        {erro && <div role="alert" className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{erro}</div>}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div><label className="block text-sm text-gray-600 mb-1.5">Veículo *</label>
            <select value={form.veiculo_id} onChange={e=>setForm(p=>({...p,veiculo_id:e.target.value}))} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white">
              <option value="">Selecione...</option>{veiculos.map(v=><option key={v.id} value={v.id}>{v.placa} - {v.marca} {v.modelo}</option>)}
            </select>
          </div>
          <div><label className="block text-sm text-gray-600 mb-1.5">Tipo de Documento *</label>
            <select value={form.tipo_documento} onChange={e=>setForm(p=>({...p,tipo_documento:e.target.value}))} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white">
              <option value="">Selecione...</option>{tiposDoc.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label className="block text-sm text-gray-600 mb-1.5">Vencimento *</label>
            <input type="date" value={form.vencimento} onChange={e=>setForm(p=>({...p,vencimento:e.target.value}))} className="w-full px-4 py-3 border border-gray-200 rounded-xl"/>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={()=>setShowForm(false)} className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600">Cancelar</button>
          <button disabled={salvando} onClick={()=>void salvar()} className="px-6 py-3 rounded-xl text-white font-semibold disabled:opacity-60" style={{background:"#e8192c"}}>{salvando?"Salvando...":"Salvar"}</button>
        </div>
      </div>
    </div>
  );

  return <div className="p-6">
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-gray-800" style={{fontSize:"1.75rem",fontWeight:700}}>Controle de Documentação</h1>
      <div className="flex gap-2">
        <button onClick={()=>void carregar()} className="p-3 rounded-xl border border-gray-200 text-gray-600" title="Atualizar"><RefreshCw size={18}/></button>
        <button onClick={abrirNovo} className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold" style={{background:"#e8192c"}}><Plus size={18}/> Novo Documento</button>
      </div>
    </div>
    {erro && <div role="alert" className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700"><AlertTriangle className="inline mr-2" size={16}/>{erro}</div>}
    <div className="grid grid-cols-4 gap-3 mb-4">
      {[{label:"Total",value:totais.total,color:"#6b7280"},{label:"Válidos",value:totais.validos,color:"#10b981"},{label:"A Vencer",value:totais.vencer,color:"#d97706"},{label:"Vencidos",value:totais.vencidos,color:"#e8192c"}].map(c=><div key={c.label} className="bg-white rounded-xl p-5 border border-gray-100"><div className="text-3xl font-bold" style={{color:c.color}}>{carregando?"—":c.value}</div><div className="text-sm text-gray-500 mt-1">{c.label}</div></div>)}
    </div>
    <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex items-center gap-4 flex-wrap">
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15}/><input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar documento ou veículo..." className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm w-64"/>{busca&&<button onClick={()=>setBusca("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={14}/></button>}</div>
      <select value={tipoSel} onChange={e=>setTipoSel(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white"><option>Todos</option>{tiposDoc.map(t=><option key={t}>{t}</option>)}</select>
    </div>
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <table className="w-full"><thead><tr style={{background:"#f9fafb"}}>{["Veículo","Tipo de Documento","Vencimento","Dias restantes","Status","Ações"].map(h=><th key={h} className="text-left px-5 py-3.5 text-sm text-gray-500 border-b border-gray-100 font-semibold">{h}</th>)}</tr></thead>
        <tbody>
          {filtrados.map((d,i)=>{const sc=statusStyle[d.status]??statusStyle["Válido"];return <tr key={d.id} className="hover:bg-gray-50" style={{borderBottom:i<filtrados.length-1?"1px solid #f3f4f6":"none"}}>
            <td className="px-5 py-4"><div className="flex items-center gap-2"><FileText size={16} className="text-blue-500"/><span className="font-semibold text-gray-800">{d.placa}</span></div></td>
            <td className="px-5 py-4 text-gray-700">{d.tipo_documento}</td><td className="px-5 py-4 text-gray-600">{formatarData(d.vencimento)}</td>
            <td className="px-5 py-4 text-gray-600">{d.dias_restantes ?? "—"}</td>
            <td className="px-5 py-4"><span className="text-sm px-3 py-1 rounded-full font-semibold" style={{background:sc.bg,color:sc.color,border:`1px solid ${sc.border}`}}>{d.status}</span></td>
            <td className="px-5 py-4"><div className="flex gap-2"><button onClick={()=>abrirEdicao(d)} className="p-2 rounded-lg border border-gray-200 text-gray-600" title="Editar"><Pencil size={15}/></button><button onClick={()=>void excluir(d.id)} className="p-2 rounded-lg border border-gray-200 text-red-600" title="Excluir"><Trash2 size={15}/></button></div></td>
          </tr>})}
          {!carregando&&filtrados.length===0&&<tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">Nenhum documento encontrado.</td></tr>}
          {carregando&&<tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">Carregando documentos...</td></tr>}
        </tbody>
      </table>
    </div>
  </div>;
}
