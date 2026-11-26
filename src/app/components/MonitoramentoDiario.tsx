import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, Truck, Wrench, Ban, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

type Veiculo = {
  id: string;
  placa: string;
  marca: string | null;
  modelo: string | null;
  quilometragem_atual: number | null;
  status: string | null;
};
type Ordem = {
  id: string;
  numero: number;
  veiculo_id: string;
  status: string;
  tipo_manutencao: string;
  descricao_problema: string | null;
  data_agendamento: string | null;
};

const STATUS_ATIVOS = ["Em Andamento", "Na Concessionária"];
const normalizar = (valor: string | null | undefined) => (valor ?? "").trim().toLocaleLowerCase("pt-BR");
const formatarKm = (valor: number | null) => `${Number(valor ?? 0).toLocaleString("pt-BR")} km`;

export function MonitoramentoDiario() {
  const { perfil } = useAuth();
  const ehAdmin = normalizar(perfil?.perfil) === "administrador";
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [ordens, setOrdens] = useState<Ordem[]>([]);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("Todos");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [processando, setProcessando] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    const [vRes, oRes] = await Promise.all([
      supabase.from("veiculos").select("id,placa,marca,modelo,quilometragem_atual,status").order("placa"),
      supabase.from("ordens_servico").select("id,numero,veiculo_id,status,tipo_manutencao,descricao_problema,data_agendamento").in("status", STATUS_ATIVOS),
    ]);
    if (vRes.error || oRes.error) {
      const falha = vRes.error || oRes.error;
      setErro(`Não foi possível carregar o monitoramento: ${falha?.message ?? "Erro desconhecido"}`);
      setVeiculos([]);
      setOrdens([]);
    } else {
      setVeiculos(vRes.data ?? []);
      setOrdens(oRes.data ?? []);
    }
    setCarregando(false);
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  const ordensPorVeiculo = useMemo(() => {
    const mapa = new Map<string, Ordem[]>();
    for (const ordem of ordens) mapa.set(ordem.veiculo_id, [...(mapa.get(ordem.veiculo_id) ?? []), ordem]);
    return mapa;
  }, [ordens]);

  const statusEfetivo = (veiculo: Veiculo) => {
    if (normalizar(veiculo.status) === "interditado" || normalizar(veiculo.status) === "indisponível") return "Interditado";
    return (ordensPorVeiculo.get(veiculo.id) ?? []).length > 0 ? "Em manutenção" : "Disponível";
  };

  const filtrados = veiculos.filter((v) => {
    const termo = busca.toLocaleLowerCase("pt-BR");
    const texto = `${v.placa} ${v.marca ?? ""} ${v.modelo ?? ""}`.toLocaleLowerCase("pt-BR");
    return texto.includes(termo) && (filtro === "Todos" || statusEfetivo(v) === filtro);
  });

  const alternarInterdicao = async (veiculo: Veiculo) => {
    if (!ehAdmin) return;
    const interditado = statusEfetivo(veiculo) === "Interditado";
    const acao = interditado ? "retirar a interdição" : "interditar";
    if (!window.confirm(`Deseja ${acao} o veículo ${veiculo.placa}?`)) return;
    setProcessando(veiculo.id);
    setErro("");
    const { error } = await supabase.rpc("definir_interdicao_veiculo", {
      p_veiculo_id: veiculo.id,
      p_interditado: !interditado,
    });
    if (error) setErro(`Não foi possível atualizar o status: ${error.message}`);
    else await carregar();
    setProcessando(null);
  };

  const contagem = (status: string) => veiculos.filter((v) => statusEfetivo(v) === status).length;
  const badge = (status: string) => status === "Disponível"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : status === "Em manutenção"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-red-50 text-red-700 border-red-200";

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-gray-800" style={{ fontSize: "1.4rem", fontWeight: 700 }}>Monitoramento da Frota</h1>
          <p className="text-sm text-gray-500 mt-1">Disponibilidade operacional dos veículos.</p>
        </div>
        <button onClick={() => void carregar()} disabled={carregando} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
          <RefreshCw size={15} className={carregando ? "animate-spin" : ""}/> Atualizar
        </button>
      </div>

      {erro && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm"><div className="text-2xl font-bold text-emerald-600">{contagem("Disponível")}</div><div className="text-sm text-gray-500">Disponíveis</div></div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm"><div className="text-2xl font-bold text-amber-600">{contagem("Em manutenção")}</div><div className="text-sm text-gray-500">Em manutenção</div></div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm"><div className="text-2xl font-bold text-red-600">{contagem("Interditado")}</div><div className="text-sm text-gray-500">Interditados</div></div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15}/><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar placa, marca ou modelo..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-400"/></div>
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"><option>Todos</option><option>Disponível</option><option>Em manutenção</option><option>Interditado</option></select>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500"><tr><th className="text-left font-medium p-4">Veículo</th><th className="text-left font-medium p-4">Quilometragem</th><th className="text-left font-medium p-4">Status operacional</th><th className="text-left font-medium p-4">Ordem ativa</th>{ehAdmin && <th className="text-right font-medium p-4">Ação do administrador</th>}</tr></thead>
            <tbody>
              {carregando ? <tr><td colSpan={ehAdmin ? 5 : 4} className="p-8 text-center text-gray-400">Carregando veículos...</td></tr>
              : filtrados.length === 0 ? <tr><td colSpan={ehAdmin ? 5 : 4} className="p-8 text-center text-gray-400">Nenhum veículo encontrado.</td></tr>
              : filtrados.map((v) => {
                const status = statusEfetivo(v);
                const osAtivas = ordensPorVeiculo.get(v.id) ?? [];
                return <tr key={v.id} className="border-t border-gray-100 hover:bg-gray-50/60">
                  <td className="p-4"><div className="flex items-center gap-2 font-semibold text-gray-800"><Truck size={17} className="text-gray-400"/>{v.placa}</div><div className="text-xs text-gray-500 ml-6">{[v.marca, v.modelo].filter(Boolean).join(" ") || "Modelo não informado"}</div></td>
                  <td className="p-4 text-gray-600">{formatarKm(v.quilometragem_atual)}</td>
                  <td className="p-4"><span className={`inline-flex items-center gap-1.5 border rounded-full px-3 py-1 text-xs font-semibold ${badge(status)}`}>{status === "Disponível" ? <CheckCircle2 size={13}/> : status === "Em manutenção" ? <Wrench size={13}/> : <Ban size={13}/>} {status}</span></td>
                  <td className="p-4 text-gray-600">{osAtivas.length ? osAtivas.map((o) => <div key={o.id} className="mb-1"><span className="font-semibold">OS #{o.numero}</span> · {o.status}</div>) : <span className="text-gray-400">Nenhuma</span>}</td>
                  {ehAdmin && <td className="p-4 text-right"><button onClick={() => void alternarInterdicao(v)} disabled={processando === v.id} className={`px-3 py-2 rounded-lg text-xs font-semibold border disabled:opacity-50 ${status === "Interditado" ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50" : "border-red-200 text-red-700 hover:bg-red-50"}`}>{processando === v.id ? "Salvando..." : status === "Interditado" ? "Retirar interdição" : "Interditar veículo"}</button></td>}
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-4 flex items-start gap-2 text-xs text-gray-500"><AlertTriangle size={14} className="mt-0.5 shrink-0"/><p>O status Em manutenção é automático quando existe OS Em Andamento ou Na Concessionária. Solicitações abertas ou agendadas não bloqueiam o veículo. A interdição é manual e exclusiva do administrador.</p></div>
    </div>
  );
}
