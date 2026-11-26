import { useEffect, useMemo, useState } from "react";
import { Wrench, FileSpreadsheet, CalendarDays, RefreshCw, AlertTriangle, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "../../lib/supabase";

type Ordem = {
  id: string;
  numero: number;
  veiculo_id: string;
  data_solicitacao: string;
  data_conclusao: string | null;
  tipo_manutencao: string;
  status: string;
  custo_mao_de_obra: number | string | null;
  custo_total: number | string | null;
};
type Veiculo = { id: string; placa: string; marca: string; modelo: string };
type PecaOS = { id: string; os_id: string; descricao: string | null; qtd: number; valor_unit: number | string };

const hoje = new Date();
const primeiroDia = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
const ultimoDia = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBR = (valor?: string | null) => valor ? new Date(`${valor.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR") : "—";

export function Relatorios() {
  const [ordens, setOrdens] = useState<Ordem[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [pecasOS, setPecasOS] = useState<PecaOS[]>([]);
  const [inicio, setInicio] = useState(primeiroDia(hoje));
  const [fim, setFim] = useState(ultimoDia(hoje));
  const [carregando, setCarregando] = useState(true);
  const [gerado, setGerado] = useState(false);
  const [erro, setErro] = useState("");

  const carregarDados = async () => {
    setCarregando(true);
    setErro("");
    const [osRes, veicRes, pecasRes] = await Promise.all([
      supabase.from("ordens_servico").select("id,numero,veiculo_id,data_solicitacao,data_conclusao,tipo_manutencao,status,custo_mao_de_obra,custo_total").order("data_solicitacao", { ascending: false }),
      supabase.from("veiculos").select("id,placa,marca,modelo").order("placa"),
      supabase.from("os_pecas").select("id,os_id,descricao,qtd,valor_unit"),
    ]);
    if (osRes.error || veicRes.error || pecasRes.error) {
      const falha = osRes.error || veicRes.error || pecasRes.error;
      setErro(`Não foi possível carregar os relatórios: ${falha?.message}`);
      setOrdens([]);
      setVeiculos([]);
      setPecasOS([]);
    } else {
      setOrdens(osRes.data ?? []);
      setVeiculos(veicRes.data ?? []);
      setPecasOS((pecasRes.data ?? []) as PecaOS[]);
    }
    setCarregando(false);
  };

  useEffect(() => { void carregarDados(); }, []);

  const ordensNoPeriodo = useMemo(() => ordens.filter(o =>
    o.data_solicitacao >= inicio && o.data_solicitacao <= fim
  ), [ordens, inicio, fim]);

  // O valor financeiro usa custo_total da OS concluída, evitando somar novamente
  // os_servicos e os_pecas, que já compõem o total gravado na ordem.
  const concluidasNoPeriodo = useMemo(() => ordens.filter(o =>
    o.status === "Concluída" && !!o.data_conclusao &&
    o.data_conclusao >= inicio && o.data_conclusao <= fim
  ), [ordens, inicio, fim]);

  const totalMonetario = concluidasNoPeriodo.reduce((s, o) => s + Number(o.custo_total ?? 0), 0);

  // A mão de obra vem do total consolidado da OS; as peças vêm dos itens
  // registrados em os_pecas. Para OS antigas sem itens discriminados, o
  // restante do custo total é apresentado como peças/outros materiais.
  const custosPorOS = (os: Ordem) => {
    const maoDeObra = Number(os.custo_mao_de_obra ?? 0);
    const pecasRegistradas = pecasOS.filter(p => p.os_id === os.id)
      .reduce((s, p) => s + Number(p.qtd ?? 0) * Number(p.valor_unit ?? 0), 0);
    const total = Number(os.custo_total ?? 0);
    const custoPecas = pecasRegistradas;
    const naoDiscriminado = Math.max(0, total - maoDeObra - custoPecas);
    return { maoDeObra, custoPecas, naoDiscriminado, total };
  };

  const linhasPorVeiculo = useMemo(() => {
    const grupos = new Map<string, { veiculo: Veiculo | undefined; quantidade: number; maoDeObra: number; pecas: number; naoDiscriminado: number; total: number; ordens: Ordem[] }>();
    concluidasNoPeriodo.forEach(o => {
      const atual = grupos.get(o.veiculo_id) ?? {
        veiculo: veiculos.find(v => v.id === o.veiculo_id), quantidade: 0, maoDeObra: 0, pecas: 0, naoDiscriminado: 0, total: 0, ordens: []
      };
      atual.quantidade += 1;
      const custos = custosPorOS(o);
      atual.maoDeObra += custos.maoDeObra;
      atual.pecas += custos.custoPecas;
      atual.naoDiscriminado += custos.naoDiscriminado;
      atual.total += custos.total;
      atual.ordens.push(o);
      grupos.set(o.veiculo_id, atual);
    });
    return Array.from(grupos.values()).sort((a, b) => b.total - a.total);
  }, [concluidasNoPeriodo, veiculos, pecasOS]);

  const exportarExcel = () => {
    const detalhes = concluidasNoPeriodo.map(o => {
      const v = veiculos.find(x => x.id === o.veiculo_id);
      return {
        "Nº OS": o.numero,
        "Placa": v?.placa ?? "Veículo não identificado",
        "Marca/Modelo": `${v?.marca ?? ""} ${v?.modelo ?? ""}`.trim(),
        "Data da solicitação": dataBR(o.data_solicitacao),
        "Data da conclusão": dataBR(o.data_conclusao),
        "Tipo": o.tipo_manutencao,
        "Mão de obra (R$)": custosPorOS(o).maoDeObra,
        "Peças registradas (R$)": custosPorOS(o).custoPecas,
        "Valor não discriminado (R$)": custosPorOS(o).naoDiscriminado,
        "Custo total (R$)": Number(o.custo_total ?? 0),
      };
    });
    const resumo = linhasPorVeiculo.map(x => ({
      "Veículo": x.veiculo?.placa ?? "Veículo não identificado",
      "Marca/Modelo": `${x.veiculo?.marca ?? ""} ${x.veiculo?.modelo ?? ""}`.trim(),
      "OS concluídas": x.quantidade,
      "Mão de obra (R$)": x.maoDeObra,
      "Peças registradas (R$)": x.pecas,
      "Valor não discriminado (R$)": x.naoDiscriminado,
      "Custo total (R$)": x.total,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detalhes), "Detalhamento");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumo), "Por veículo");
    XLSX.writeFile(wb, `Custos_Manutencao_${inicio}_${fim}.xlsx`);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-gray-800" style={{ fontSize: "1.4rem", fontWeight: 700 }}>Relatórios</h1>
          <p className="text-gray-500 text-sm mt-0.5">Indicadores e custos de manutenção da frota</p>
        </div>
        <button onClick={carregarDados} disabled={carregando} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
          <RefreshCw size={16} className={carregando ? "animate-spin" : ""}/> Atualizar
        </button>
      </div>

      {erro && <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertTriangle size={18}/>{erro}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-100" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-2"><FileText size={16}/> Total de OSs no período</div>
          <div className="text-gray-800" style={{ fontSize: "1.7rem", fontWeight: 700 }}>{carregando ? "—" : ordensNoPeriodo.length}</div>
          <p className="text-gray-400 text-xs mt-1">Ordens solicitadas entre as datas selecionadas</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-2"><Wrench size={16}/> Total monetário gerado</div>
          <div className="text-gray-800" style={{ fontSize: "1.7rem", fontWeight: 700 }}>{carregando ? "—" : moeda(totalMonetario)}</div>
          <p className="text-gray-400 text-xs mt-1">Soma das OSs concluídas no período</p>
        </div>
      </div>

      <section className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(232,25,44,0.08)" }}><Wrench size={21} style={{ color: "#e8192c" }}/></div>
            <div><h2 className="text-gray-800 font-semibold">Custos de Manutenção</h2><p className="text-gray-500 text-sm">Custos por veículo e por período</p></div>
          </div>
          <button onClick={exportarExcel} disabled={carregando || concluidasNoPeriodo.length === 0} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-green-50 hover:text-green-700 disabled:opacity-40 disabled:cursor-not-allowed">
            <FileSpreadsheet size={17}/> Exportar Excel
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <label className="text-sm text-gray-600">Data inicial
            <div className="relative mt-1"><CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/><input type="date" value={inicio} max={fim} onChange={e => { setInicio(e.target.value); setGerado(false); }} className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-red-300"/></div>
          </label>
          <label className="text-sm text-gray-600">Data final
            <div className="relative mt-1"><CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/><input type="date" value={fim} min={inicio} onChange={e => { setFim(e.target.value); setGerado(false); }} className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-red-300"/></div>
          </label>
        </div>

        <button onClick={() => setGerado(true)} disabled={carregando} className="w-full rounded-xl py-2.5 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50" style={{ background: "#e8192c" }}>Gerar Relatório</button>

        {gerado && <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-gray-800 font-semibold mb-3">Resumo por veículo</h3>
            {linhasPorVeiculo.length === 0 ? <p className="text-sm text-gray-500 rounded-xl bg-gray-50 p-4">Não há OS concluídas com custos no período selecionado.</p> : (
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500"><tr><th className="text-left p-3 font-medium">Veículo</th><th className="text-right p-3 font-medium">OS concluídas</th><th className="text-right p-3 font-medium">Mão de obra</th><th className="text-right p-3 font-medium">Peças</th><th className="text-right p-3 font-medium">Não discriminado</th><th className="text-right p-3 font-medium">Custo total</th></tr></thead>
                  <tbody>{linhasPorVeiculo.map((x, i) => <tr key={x.veiculo?.id ?? i} className="border-t border-gray-100"><td className="p-3"><div className="font-semibold text-gray-800">{x.veiculo?.placa ?? "Veículo não identificado"}</div><div className="text-xs text-gray-500">{x.veiculo ? `${x.veiculo.marca} ${x.veiculo.modelo}` : ""}</div></td><td className="p-3 text-right">{x.quantidade}</td><td className="p-3 text-right">{moeda(x.maoDeObra)}</td><td className="p-3 text-right">{moeda(x.pecas)}</td><td className="p-3 text-right">{moeda(x.naoDiscriminado)}</td><td className="p-3 text-right font-semibold">{moeda(x.total)}</td></tr>)}</tbody>
                </table>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-gray-800 font-semibold mb-3">Detalhamento das ordens concluídas</h3>
            {concluidasNoPeriodo.length === 0 ? <p className="text-sm text-gray-500">Nenhuma ordem concluída no período.</p> : (
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500"><tr><th className="text-left p-3 font-medium">OS</th><th className="text-left p-3 font-medium">Veículo</th><th className="text-left p-3 font-medium">Conclusão</th><th className="text-left p-3 font-medium">Tipo</th><th className="text-right p-3 font-medium">Mão de obra</th><th className="text-right p-3 font-medium">Peças</th><th className="text-right p-3 font-medium">Não discriminado</th><th className="text-right p-3 font-medium">Total</th></tr></thead>
                  <tbody>{concluidasNoPeriodo.map(o => { const v = veiculos.find(x => x.id === o.veiculo_id); return <tr key={o.id} className="border-t border-gray-100"><td className="p-3 font-semibold">OS #{o.numero}</td><td className="p-3">{v?.placa ?? "—"}</td><td className="p-3">{dataBR(o.data_conclusao)}</td><td className="p-3">{o.tipo_manutencao}</td><td className="p-3 text-right">{moeda(custosPorOS(o).maoDeObra)}</td><td className="p-3 text-right">{moeda(custosPorOS(o).custoPecas)}</td><td className="p-3 text-right">{moeda(custosPorOS(o).naoDiscriminado)}</td><td className="p-3 text-right font-semibold">{moeda(Number(o.custo_total ?? 0))}</td></tr>; })}</tbody>
                </table>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500">Composição: mão de obra conforme custo registrado na OS; peças conforme itens vinculados em os_pecas. Valores que não estejam discriminados nesses registros aparecem separadamente como “Não discriminado”, sem serem atribuídos indevidamente a peças ou mão de obra.</p>
        </div>}
      </section>
      {carregando && <p className="text-sm text-gray-400 mt-4">Carregando dados do Supabase...</p>}
    </div>
  );
}
