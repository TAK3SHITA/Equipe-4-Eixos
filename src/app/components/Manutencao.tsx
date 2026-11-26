import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Plus, Search, ChevronLeft, X, CheckCircle, Printer, Calendar, AlertTriangle } from "lucide-react";

const parseValor = (valor: string | number | undefined) => {
  if (typeof valor === "number") return valor;
  const texto = String(valor ?? "0").replace(/R\$\s?/g, "").trim();
  const normalizado = texto.includes(",") ? texto.replace(/\./g, "").replace(",", ".") : texto;
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : 0;
};
const formatarMoeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type OrdServico = {
  id: string;
  bancoId?: string;
  veiculoId?: string;
  mecanicoId?: string;
  veiculo: string;
  quilometragem: string;
  dataSolicitacao: string;
  dataAgendamento?: string;
  mecanicoResponsavel?: string;
  tipoManutencao: "Preventiva" | "Corretiva";
  descricaoProblema: string;
  prioridade: "Alta" | "Média" | "Baixa" | "Não definida";
  status: "Aberta" | "Agendada" | "Em Andamento" | "Concluída" | "Na Concessionária";
  dataInicio?: string;
  dataConclusao?: string;
  custoMaoDeObra?: string;
  custoTotal?: string;
  observacoesFinais?: string;
  veiculoNaGarantia?: boolean;
  concessionariaVeiculo?: string;
  osConcessionaria?: string;
  servicos: { descricao: string; tipo: string; peca: string; qtd: number; valorUnit: string }[];
  pecasUsadas: { descricao: string; tipo: string; peca: string; qtd: number; valorUnit: string }[];
};

const osIniciais: OrdServico[] = [
  {
    id: "OS #1254",
    veiculo: "FTR4E07 - VW Delivery 11.180",
    quilometragem: "48.750 km",
    dataSolicitacao: "15/05/2024",
    dataAgendamento: "15/05/2024",
    mecanicoResponsavel: "Roberto Silva",
    tipoManutencao: "Preventiva",
    descricaoProblema: "",
    prioridade: "Alta",
    status: "Em Andamento",
    dataInicio: "15/05/2024",
    custoMaoDeObra: "250,00",
    custoTotal: "587,00",
    servicos: [
      { descricao: "Troca de filtro de ar", tipo: "Preventiva", peca: "Filtro de Ar", qtd: 1, valorUnit: "R$ 85,00" },
      { descricao: "Troca de óleo do motor", tipo: "Preventiva", peca: "Filtro de Óleo", qtd: 1, valorUnit: "R$ 42,00" },
      { descricao: "Verificação de freios", tipo: "Preventiva", peca: "Óleo 15W40 (20L)", qtd: 6, valorUnit: "R$ 35,00" },
    ],
    pecasUsadas: [],
  },
  {
    id: "OS #1253",
    veiculo: "BBX2F95 - MB Actros 2651",
    quilometragem: "92.300 km",
    dataSolicitacao: "14/05/2024",
    dataAgendamento: "16/05/2024",
    mecanicoResponsavel: "Carlos Mecânico",
    tipoManutencao: "Corretiva",
    descricaoProblema: "Veículo apresentou perda de potência e fumaça excessiva no escapamento.",
    prioridade: "Alta",
    status: "Agendada",
    servicos: [],
    pecasUsadas: [],
  },
  {
    id: "OS #1252",
    veiculo: "FTY8A11 - Volvo FH 460",
    quilometragem: "187.450 km",
    dataSolicitacao: "13/05/2024",
    tipoManutencao: "Preventiva",
    descricaoProblema: "Revisão preventiva padrão",
    prioridade: "Média",
    status: "Concluída",
    dataInicio: "13/05/2024",
    dataConclusao: "13/05/2024",
    custoMaoDeObra: "180,00",
    custoTotal: "450,00",
    servicos: [],
    pecasUsadas: [],
  },
  {
    id: "OS #1251",
    veiculo: "FTR4E07 - VW Delivery 11.180",
    quilometragem: "47.200 km",
    dataSolicitacao: "20/05/2024",
    tipoManutencao: "Corretiva",
    descricaoProblema: "Barulho alto nas rodas traseiras ao frear.",
    prioridade: "Não definida",
    status: "Aberta",
    veiculoNaGarantia: true,
    concessionariaVeiculo: "Concessionária VW",
    servicos: [],
    pecasUsadas: [],
  },
  {
    id: "OS #1250",
    veiculo: "FTR4E07 - VW Delivery 11.180",
    quilometragem: "42.100 km",
    dataSolicitacao: "02/05/2024",
    dataAgendamento: "03/05/2024",
    mecanicoResponsavel: "Concessionária VW",
    tipoManutencao: "Corretiva",
    descricaoProblema: "Luz de injeção acesa e perda de força.",
    prioridade: "Alta",
    status: "Concluída",
    dataInicio: "03/05/2024",
    dataConclusao: "05/05/2024",
    custoMaoDeObra: "0,00",
    custoTotal: "0,00",
    servicos: [
      { descricao: "Diagnóstico e atualização de software", tipo: "Corretiva", peca: "", qtd: 1, valorUnit: "R$ 0,00" },
      { descricao: "Substituição do sensor NOx", tipo: "Corretiva", peca: "Sensor NOx", qtd: 1, valorUnit: "R$ 0,00" }
    ],
    pecasUsadas: [],
    observacoesFinais: "Serviço realizado integralmente em garantia pela concessionária. Nenhuma cobrança gerada.",
  }
];

const statusColors: Record<string, { bg: string; text: string }> = {
  Aberta: { bg: "rgba(59,130,246,0.1)", text: "#3b82f6" },
  Agendada: { bg: "rgba(168,85,247,0.1)", text: "#a855f7" },
  "Em Andamento": { bg: "rgba(245,158,11,0.1)", text: "#f59e0b" },
  "Na Concessionária": { bg: "rgba(139,92,246,0.1)", text: "#8b5cf6" },
  Concluída: { bg: "rgba(16,185,129,0.1)", text: "#10b981" },
};

const prioridadeColors: Record<string, { bg: string; text: string }> = {
  Alta: { bg: "rgba(232,25,44,0.1)", text: "#e8192c" },
  Média: { bg: "rgba(245,158,11,0.1)", text: "#f59e0b" },
  Baixa: { bg: "rgba(16,185,129,0.1)", text: "#10b981" },
  "Não definida": { bg: "rgba(156,163,175,0.1)", text: "#6b7280" },
};

export function Manutencao() {
  const [ordens, setOrdens] = useState<OrdServico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erroBanco, setErroBanco] = useState("");
  const [veiculosBanco, setVeiculosBanco] = useState<any[]>([]);
  const [mecanicosBanco, setMecanicosBanco] = useState<any[]>([]);
  const [pecasBanco, setPecasBanco] = useState<any[]>([]);

  const carregarDados = async () => {
    setCarregando(true);
    setErroBanco("");
    const [osRes, veicRes, perfisRes, servRes, osPecasRes, pecasRes] = await Promise.all([
      supabase.from("ordens_servico").select("*").order("numero", { ascending: false }),
      supabase.from("veiculos").select("id,placa,marca,modelo,quilometragem_atual,possui_garantia,concessionaria").order("placa"),
      supabase.from("perfis").select("id,nome,perfil,ativo").eq("ativo", true),
      supabase.from("os_servicos").select("*"),
      supabase.from("os_pecas").select("*"),
      supabase.from("pecas").select("id,codigo,descricao,estoque,valor_unit").order("descricao")
    ]);
    const falha = osRes.error || veicRes.error || perfisRes.error || servRes.error || osPecasRes.error || pecasRes.error;
    if (falha) {
      console.error("Erro ao carregar manutenção:", falha);
      setErroBanco(`Não foi possível carregar os dados da manutenção: ${falha.message}`);
      setOrdens([]);
    } else {
      const veiculos = veicRes.data ?? [], perfis = perfisRes.data ?? [], pecas = pecasRes.data ?? [];
      const servicos = servRes.data ?? [], pecasOS = osPecasRes.data ?? [];
      setVeiculosBanco(veiculos);
      const somenteMecanicos = perfis
        .filter((p: any) => String(p.perfil ?? "").trim().toLocaleLowerCase("pt-BR") === "mecânico")
        .sort((a: any, b: any) =>
          String(a.nome ?? "").localeCompare(String(b.nome ?? ""), "pt-BR", {
            numeric: true,
            sensitivity: "base",
          })
        );
      setMecanicosBanco(somenteMecanicos);
      setPecasBanco(pecas);
      setOrdens((osRes.data ?? []).map((row: any) => {
        const v = veiculos.find((x: any) => x.id === row.veiculo_id);
        const m = perfis.find((x: any) => x.id === row.mecanico_id);
        const serv = servicos.filter((x: any) => x.os_id === row.id).map((x: any) => ({
          descricao: x.descricao ?? "", tipo: x.tipo ?? row.tipo_manutencao, peca: "", qtd: Number(x.quantidade ?? 1), valorUnit: formatarMoeda(Number(x.valor_unit ?? 0))
        }));
        const usadas = pecasOS.filter((x: any) => x.os_id === row.id).map((x: any) => {
          const p = pecas.find((y: any) => y.id === x.peca_id);
          const val = Number(x.valor_unit ?? 0);
          return { descricao: x.descricao ?? p?.descricao ?? "Peça", tipo: row.tipo_manutencao,
            peca: x.descricao ?? p?.descricao ?? "", qtd: Number(x.qtd ?? 1),
            valorUnit: `R$ ${val.toLocaleString("pt-BR", {minimumFractionDigits: 2})}` };
        });
        return {
          id: `OS #${row.numero}`, bancoId: row.id, veiculoId: row.veiculo_id, mecanicoId: row.mecanico_id ?? undefined,
          veiculo: v ? `${v.placa} - ${v.marca} ${v.modelo}` : "Veículo não encontrado",
          quilometragem: row.quilometragem == null ? "" : `${row.quilometragem} km`,
          dataSolicitacao: row.data_solicitacao ?? "", dataAgendamento: row.data_agendamento ?? "",
          mecanicoResponsavel: m?.nome ?? row.concessionaria ?? "",
          tipoManutencao: row.tipo_manutencao, descricaoProblema: row.descricao_problema ?? "",
          prioridade: row.prioridade ?? "Não definida", status: row.status ?? "Aberta",
          dataInicio: row.data_inicio ?? "", dataConclusao: row.data_conclusao ?? "",
          custoMaoDeObra: String(row.custo_mao_de_obra ?? "0"), custoTotal: String(row.custo_total ?? "0"),
          observacoesFinais: row.observacoes_finais ?? "", veiculoNaGarantia: row.veiculo_na_garantia ?? false,
          concessionariaVeiculo: row.concessionaria ?? "", osConcessionaria: row.os_concessionaria ?? "",
          servicos: serv, pecasUsadas: usadas
        } as OrdServico;
      }));
    }
    setCarregando(false);
  };
  useEffect(() => { void carregarDados(); }, []);
  const [busca, setBusca] = useState("");
  const [abaOrdens, setAbaOrdens] = useState<"pendentes" | "finalizadas">("pendentes");
  const [view, setView] = useState<"lista" | "nova" | "execucao" | "agendamento">("lista");
  const [osAtual, setOsAtual] = useState<OrdServico | null>(null);
  
  // Estado para Nova OS
  const [novaOS, setNovaOS] = useState<Partial<OrdServico>>({
    tipoManutencao: "Preventiva",
  });

  // Estado para Agendamento
  const [agendamento, setAgendamento] = useState<{ mecanico: string; data: string; prioridade: string; osConcessionaria?: string }>({
    mecanico: "",
    data: "",
    prioridade: "Média",
    osConcessionaria: "",
  });

  const [novoServico, setNovoServico] = useState({ descricao: "", tipo: "Preventiva", peca: "", qtd: 1, valorUnit: "R$ 0,00" });

  const ordensDaAba = ordens.filter((o) =>
    abaOrdens === "finalizadas" ? o.status === "Concluída" : o.status !== "Concluída"
  );

  const filtered = ordensDaAba.filter(
    (o) =>
      o.id.toLowerCase().includes(busca.toLowerCase()) ||
      o.veiculo.toLowerCase().includes(busca.toLowerCase())
  );

  const handleSalvarOS = async () => {
    if (!novaOS.veiculoId) { alert("Por favor, selecione um veículo cadastrado."); return; }
    const veiculo = veiculosBanco.find((v: any) => v.id === novaOS.veiculoId);
    if (!veiculo) { alert("Veículo não encontrado. Atualize a tela e tente novamente."); return; }
    setSalvando(true); setErroBanco("");
    const dataInformada = novaOS.dataSolicitacao || new Date().toISOString().slice(0, 10);
    const dataSolicitacao = /^\d{2}\/\d{2}\/\d{4}$/.test(dataInformada)
      ? `${dataInformada.slice(6, 10)}-${dataInformada.slice(3, 5)}-${dataInformada.slice(0, 2)}`
      : dataInformada.slice(0, 10);
    const km = Number(String(novaOS.quilometragem ?? "").replace(/[^0-9]/g, ""));
    const { error } = await supabase.from("ordens_servico").insert({
      veiculo_id: veiculo.id, quilometragem: Number.isFinite(km) && km > 0 ? km : null,
      data_solicitacao: dataSolicitacao, tipo_manutencao: novaOS.tipoManutencao || "Preventiva",
      descricao_problema: novaOS.descricaoProblema || null, prioridade: "Não definida", status: "Aberta",
      veiculo_na_garantia: Boolean(veiculo.possui_garantia), concessionaria: veiculo.concessionaria || null
    });
    if (error) { setErroBanco(`Não foi possível criar a solicitação: ${error.message}`); setSalvando(false); return; }
    await carregarDados(); setSalvando(false); setView("lista"); setNovaOS({ tipoManutencao: "Preventiva" });
  };

  const handleSalvarAgendamento = async () => {
    if (!osAtual?.bancoId) return;
    if (!agendamento.mecanico || !agendamento.data) { alert("Selecione o mecânico e a data de agendamento."); return; }
    const mecanico = mecanicosBanco.find((m: any) => m.id === agendamento.mecanico || m.nome === agendamento.mecanico);
    if (!mecanico) { alert("Mecânico não encontrado. Atualize a tela e tente novamente."); return; }
    setSalvando(true);
    const { error } = await supabase.from("ordens_servico").update({
      mecanico_id: mecanico.id, data_agendamento: agendamento.data.slice(0, 10), prioridade: agendamento.prioridade, status: "Agendada"
    }).eq("id", osAtual.bancoId);
    if (error) { setErroBanco(`Não foi possível agendar a manutenção: ${error.message}`); setSalvando(false); return; }
    await carregarDados(); setSalvando(false); setView("lista"); setOsAtual(null);
  };

  const handleEncaminharConcessionaria = async () => {
    if (!osAtual?.bancoId) return;
    setSalvando(true);
    const { error } = await supabase.from("ordens_servico").update({
      data_agendamento: agendamento.data ? agendamento.data.slice(0, 10) : new Date().toISOString().slice(0, 10),
      os_concessionaria: agendamento.osConcessionaria || null, prioridade: agendamento.prioridade, status: "Na Concessionária"
    }).eq("id", osAtual.bancoId);
    if (error) { setErroBanco(`Não foi possível encaminhar à concessionária: ${error.message}`); setSalvando(false); return; }
    await carregarDados(); setSalvando(false); setView("lista"); setOsAtual(null);
  };


  const calcularCustosOS = (os: OrdServico) => {
    const custoMaoDeObra = os.servicos.filter((item) => !item.peca)
      .reduce((total, item) => total + parseValor(item.valorUnit) * Number(item.qtd || 1), 0);
    const pecasNaListaDeServicos = os.servicos.filter((item) => item.peca)
      .reduce((total, item) => total + parseValor(item.valorUnit) * Number(item.qtd || 1), 0);
    const pecasSeparadas = os.pecasUsadas
      .reduce((total, item) => total + parseValor(item.valorUnit) * Number(item.qtd || 1), 0);
    const custoPecas = pecasNaListaDeServicos || pecasSeparadas;
    return { custoMaoDeObra, custoTotal: custoMaoDeObra + custoPecas };
  };

  const handleAdicionarServico = async () => {
    if (!osAtual?.bancoId) { setErroBanco("Não foi possível identificar a ordem de serviço."); return; }
    if (!novoServico.descricao.trim()) { alert("Informe a descrição do serviço."); return; }
    if (novoServico.qtd < 1) { alert("Informe uma quantidade válida."); return; }
    const pecaSelecionada = novoServico.peca ? pecasBanco.find((p: any) => p.descricao === novoServico.peca) : null;
    if (novoServico.peca && !pecaSelecionada) { setErroBanco("Peça não encontrada no estoque. Atualize a tela."); return; }

    setSalvando(true); setErroBanco("");
    const valor = parseValor(novoServico.valorUnit);
    const { error: servicoError } = await supabase.from("os_servicos").insert({
      os_id: osAtual.bancoId, descricao: novoServico.descricao.trim(),
      tipo: novoServico.tipo || osAtual.tipoManutencao,
      quantidade: Number(novoServico.qtd), valor_unit: pecaSelecionada ? 0 : valor,
    });
    if (servicoError) { setErroBanco(`Não foi possível salvar o serviço: ${servicoError.message}`); setSalvando(false); return; }

    if (pecaSelecionada) {
      const { error: pecaError } = await supabase.from("os_pecas").insert({
        os_id: osAtual.bancoId, peca_id: pecaSelecionada.id,
        descricao: pecaSelecionada.descricao, qtd: Number(novoServico.qtd), valor_unit: valor,
      });
      if (pecaError) {
        setErroBanco(`O serviço foi salvo, mas a peça não foi registrada: ${pecaError.message}. Confira a OS antes de tentar novamente.`);
        setSalvando(false); return;
      }
    }

    const item = { descricao: novoServico.descricao.trim(), tipo: novoServico.tipo || osAtual.tipoManutencao,
      peca: pecaSelecionada?.descricao ?? "", qtd: Number(novoServico.qtd), valorUnit: formatarMoeda(valor) };
    setOsAtual(prev => prev ? { ...prev, servicos: [...prev.servicos, item] } : prev);
    setNovoServico({ descricao: "", tipo: "Preventiva", peca: "", qtd: 1, valorUnit: "R$ 0,00" });
    setSalvando(false);
    await carregarDados();
  };

  const handleSalvarAndamento = async (finalizar = false) => {
    if (!osAtual?.bancoId) return;
    const { custoMaoDeObra, custoTotal } = calcularCustosOS(osAtual);
    setSalvando(true); setErroBanco("");
    const hoje = new Date().toISOString().slice(0, 10);
    const atualizacao: Record<string, any> = {
      observacoes_finais: osAtual.observacoesFinais || null,
      custo_mao_de_obra: custoMaoDeObra, custo_total: custoTotal,
      status: finalizar ? "Concluída" : "Em Andamento",
    };
    if (finalizar) atualizacao.data_conclusao = hoje;
    else if (!osAtual.dataInicio) atualizacao.data_inicio = hoje;
    const { error } = await supabase.from("ordens_servico").update(atualizacao).eq("id", osAtual.bancoId);
    if (error) { setErroBanco(`Não foi possível ${finalizar ? "finalizar" : "salvar"} a OS: ${error.message}`); setSalvando(false); return; }
    await carregarDados(); setSalvando(false);
    if (finalizar) { setView("lista"); setOsAtual(null); }
    else {
      setOsAtual(prev => prev ? { ...prev, status: "Em Andamento", dataInicio: prev.dataInicio || hoje,
        custoMaoDeObra: String(custoMaoDeObra), custoTotal: String(custoTotal) } : prev);
      alert("Andamento da OS salvo com sucesso.");
    }
  };

  // VIEWS ==========================================

  if (view === "execucao" && osAtual) {
    const isConcluida = osAtual.status === "Concluída";
    const hasPecasTrocadas = osAtual.servicos.some(s => s.peca && s.peca.trim() !== "");

    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setView("lista")} className="flex items-center gap-1.5 text-base text-gray-500 hover:text-gray-800 transition-colors">
            <ChevronLeft size={18} />
            Voltar
          </button>
          <h1 className="text-gray-800" style={{ fontSize: "1.75rem", fontWeight: 700 }}>
            {isConcluida ? "Detalhes da Manutenção" : "Execução da Manutenção"} - {osAtual.id}
          </h1>
        </div>

        {erroBanco && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erroBanco}</div>}
        <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Dados do Veículo</p>
              <p className="text-base font-semibold text-gray-800">{osAtual.veiculo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Quilometragem</p>
              <p className="text-base font-semibold text-gray-800">{osAtual.quilometragem}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Mecânico Responsável</p>
              <p className="text-base font-semibold text-gray-800">{osAtual.mecanicoResponsavel || "Não atribuído"}</p>
              <p className="text-sm text-gray-500">{osAtual.dataAgendamento || "Sem data agendada"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Tipo de Manutenção</p>
              <p className="text-base font-semibold text-gray-800">{osAtual.tipoManutencao}</p>
            </div>
          </div>

          {(osAtual.status === "Na Concessionária" || osAtual.osConcessionaria) && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
              <div className="mt-0.5 text-orange-600"><AlertTriangle size={20} /></div>
              <div>
                <h4 className="text-sm font-bold text-orange-800 mb-0.5">Serviço em Garantia / Concessionária</h4>
                <p className="text-sm text-orange-700">
                  Veículo encaminhado para <strong>{osAtual.concessionariaVeiculo || osAtual.mecanicoResponsavel}</strong>. 
                  {osAtual.osConcessionaria && <span> Nº da OS Externa: <strong>{osAtual.osConcessionaria}</strong></span>}
                </p>
              </div>
            </div>
          )}

          {(osAtual.status === "Na Concessionária" || osAtual.osConcessionaria) && (
            <div className="mb-6 p-5 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
              <div className="mt-0.5 text-orange-600"><AlertTriangle size={22} /></div>
              <div>
                <h4 className="text-base font-bold text-orange-800 mb-1">Serviço em Garantia / Concessionária</h4>
                <p className="text-sm text-orange-700">
                  Veículo encaminhado para <strong>{osAtual.concessionariaVeiculo || osAtual.mecanicoResponsavel}</strong> com referência à solicitação <strong>OS Interna {osAtual.id}</strong>.
                  {osAtual.osConcessionaria && <span> Nº da OS Externa: <strong>{osAtual.osConcessionaria}</strong>.</span>}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-5 bg-blue-50 border border-blue-100 rounded-xl">
              <h4 className="text-sm font-semibold text-blue-700 mb-2 uppercase tracking-wider">Problema Relatado (Solicitante)</h4>
              <p className="text-base text-blue-900">{osAtual.descricaoProblema || "Nenhuma descrição fornecida."}</p>
            </div>
            
            <div className="p-5 bg-gray-50 border border-gray-100 rounded-xl">
               <h4 className="text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wider">Troca de Peças</h4>
               <p className="text-base font-bold text-gray-800 mb-1">
                  {hasPecasTrocadas ? "Sim, peças substituídas:" : "Não houve troca de peças."}
               </p>
               {hasPecasTrocadas && (
                 <ul className="text-sm text-gray-600 list-disc list-inside">
                   {osAtual.servicos.filter(s => s.peca && s.peca.trim() !== "").map((s, idx) => (
                     <li key={idx}>{s.qtd}x {s.peca}</li>
                   ))}
                 </ul>
               )}
            </div>
          </div>
          
          <h3 className="text-gray-700 mb-4 pb-2 border-b border-gray-100 mt-2 text-lg" style={{ fontWeight: 600 }}>Serviços Realizados</h3>
          
          {!isConcluida && (
            <div className="bg-gray-50 p-5 rounded-xl mb-4 border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wider">Adicionar Serviço / Peça</h4>
              <div className="grid grid-cols-5 gap-3 mb-3">
                <div className="col-span-2">
                  <input type="text" placeholder="Descrição do Serviço" className="w-full px-4 py-3 text-base border border-gray-200 rounded-lg focus:outline-none focus:border-red-400" value={novoServico.descricao} onChange={e => setNovoServico(p => ({...p, descricao: e.target.value}))} />
                </div>
                <div>
                  <select className="w-full px-4 py-3 text-base border border-gray-200 rounded-lg focus:outline-none focus:border-red-400 bg-white" value={novoServico.tipo} onChange={e => setNovoServico(p => ({...p, tipo: e.target.value}))}>
                    <option>Preventiva</option>
                    <option>Corretiva</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <select className="w-full px-4 py-3 text-base border border-gray-200 rounded-lg focus:outline-none focus:border-red-400 bg-white" value={novoServico.peca} onChange={e => {
                    const val = e.target.value;
                    const pecaSelecionada = pecasBanco.find((p: any) => p.descricao === val);
                    const vUnit = pecaSelecionada ? `R$ ${Number(pecaSelecionada.valor_unit ?? 0).toLocaleString("pt-BR", {minimumFractionDigits: 2})}` : "R$ 0,00";
                    setNovoServico(p => ({...p, peca: val, valorUnit: vUnit}));
                  }}>
                    <option value="">Selecione a Peça (opcional)</option>
                    {pecasBanco.map((p: any) => <option key={p.id} value={p.descricao}>{p.codigo} - {p.descricao} (R$ {Number(p.valor_unit ?? 0).toLocaleString("pt-BR", {minimumFractionDigits: 2})})</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24">
                  <input type="number" placeholder="Qtd" className="w-full px-4 py-3 text-base border border-gray-200 rounded-lg focus:outline-none focus:border-red-400" value={novoServico.qtd} onChange={e => setNovoServico(p => ({...p, qtd: Number(e.target.value)}))} />
                </div>
                <div className="w-32">
                  <input type="text" placeholder="V. Unit" className="w-full px-4 py-3 text-base border border-gray-200 rounded-lg focus:outline-none focus:border-red-400" value={novoServico.valorUnit} onChange={e => setNovoServico(p => ({...p, valorUnit: e.target.value}))} />
                </div>
                <button 
                  onClick={handleAdicionarServico}
                  disabled={salvando}
                  className="ml-auto px-6 py-3 bg-gray-800 text-white rounded-lg text-base font-semibold hover:bg-gray-700 transition-colors"
                >
                  + Adicionar
                </button>
              </div>
            </div>
          )}

          <table className="w-full mb-6">
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {["Descrição do Serviço", "Tipo", "Peça", "Qtd.", "Valor Unit."].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-sm text-gray-500 border-b border-gray-100" style={{ fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {osAtual.servicos.map((s, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="px-4 py-4 text-base text-gray-700">{s.descricao}</td>
                  <td className="px-4 py-4 text-base text-gray-600">{s.tipo}</td>
                  <td className="px-4 py-4 text-base text-gray-600">{s.peca}</td>
                  <td className="px-4 py-4 text-base text-gray-600">{s.qtd}</td>
                  <td className="px-4 py-4 text-base text-gray-600">{s.valorUnit}</td>
                </tr>
              ))}
              {osAtual.servicos.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-base text-gray-500">Nenhum serviço registrado ainda.</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Observações Finais do Serviço / Laudo</label>
            {isConcluida ? (
              <div className="p-5 bg-gray-50 border border-gray-100 rounded-xl">
                <p className="text-base text-gray-800 whitespace-pre-wrap">{osAtual.observacoesFinais || "Nenhuma observação adicional registrada."}</p>
              </div>
            ) : (
              <textarea
                className="w-full text-base bg-white border border-gray-200 rounded-xl p-4 focus:border-red-400 focus:outline-none resize-none"
                rows={3}
                placeholder="Descreva o serviço feito, laudo do mecânico, se houve garantia, etc."
                value={osAtual.observacoesFinais || ""}
                onChange={(e) => setOsAtual(prev => prev ? {...prev, observacoesFinais: e.target.value} : prev)}
              />
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">Data da Conclusão</label>
              <input
                type="text"
                defaultValue={osAtual.dataConclusao || new Date().toLocaleDateString("pt-BR")}
                readOnly={isConcluida}
                className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-red-400 ${isConcluida ? 'bg-gray-50 text-gray-600' : 'bg-white'}`}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">Custo de Mão de Obra (R$)</label>
              <input
                type="text"
                value={formatarMoeda(osAtual.servicos.filter((item) => !item.peca).reduce((total, item) => total + parseValor(item.valorUnit) * Number(item.qtd || 1), 0))}
                readOnly
                className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-red-400 ${isConcluida ? 'bg-gray-50 text-gray-600' : 'bg-white'}`}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">Custo Total (R$)</label>
              <input
                type="text"
                value={formatarMoeda(osAtual.servicos.reduce((total, item) => total + parseValor(item.valorUnit) * Number(item.qtd || 1), 0) + osAtual.pecasUsadas.reduce((total, item) => total + parseValor(item.valorUnit) * Number(item.qtd || 1), 0))}
                readOnly
                className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-red-400 ${isConcluida ? 'bg-gray-50 text-gray-600' : 'bg-white'}`}
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => {
                alert("Documento gerado com sucesso! (Simulação de impressão de OS em PDF)");
                window.print();
              }}
              className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 text-base font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Printer size={18} />
              Emitir Documento de OS
            </button>
            {!isConcluida && (
              <div className="flex items-center gap-3">
              <button
                onClick={() => handleSalvarAndamento(false)}
                disabled={salvando}
                className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 text-base font-semibold hover:bg-gray-50 disabled:opacity-50"
              >
                {salvando ? "Salvando..." : "Salvar alterações"}
              </button>
              <button
                onClick={() => handleSalvarAndamento(true)}
              disabled={salvando}
                className="px-6 py-3 rounded-xl text-white text-base font-semibold transition-all hover:opacity-90 flex items-center gap-2 shadow-lg shadow-emerald-500/25"
                style={{ background: "#10b981" }}
              >
                <CheckCircle size={18} />
                {salvando ? "Processando..." : "Finalizar OS"}
              </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === "agendamento" && osAtual) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setView("lista")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ChevronLeft size={16} />
            Voltar
          </button>
          <h1 className="text-gray-800" style={{ fontSize: "1.3rem", fontWeight: 700 }}>
            Agendar Manutenção - {osAtual.id}
          </h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm max-w-3xl">
          
          <div className="mb-8 bg-blue-50 border border-blue-100 rounded-xl p-5">
            <h3 className="text-blue-900 font-semibold mb-4 border-b border-blue-200 pb-2">Detalhes da Solicitação</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-blue-700 font-medium mb-1">Veículo</p>
                <p className="text-sm text-blue-900 font-bold">{osAtual.veiculo}</p>
              </div>
              <div>
                <p className="text-xs text-blue-700 font-medium mb-1">Tipo e KM</p>
                <p className="text-sm text-blue-900 font-bold">{osAtual.tipoManutencao} - {osAtual.quilometragem}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-blue-700 font-medium mb-1">Problema Relatado</p>
                <p className="text-sm text-blue-900">{osAtual.descricaoProblema || "Não informado"}</p>
              </div>
            </div>
          </div>

          {osAtual.veiculoNaGarantia && (
            <div className="mb-8 p-5 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-orange-600"><AlertTriangle size={22} /></div>
                <div className="flex-1">
                  <h4 className="text-base font-bold text-orange-800 mb-1">Veículo na Garantia</h4>
                  <p className="text-sm text-orange-700 mb-4">
                    Este veículo ainda possui cobertura de garantia pela <strong>{osAtual.concessionariaVeiculo}</strong>. Para evitar perda de cobertura, é recomendado encaminhar o serviço à rede autorizada informando o número desta solicitação (<strong>OS Interna: {osAtual.id}</strong>).
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-orange-800 mb-1">Nº OS Concessionária (opcional)</label>
                      <input
                        type="text"
                        placeholder="Ex: 58992"
                        value={agendamento.osConcessionaria || ""}
                        onChange={(e) => setAgendamento(p => ({...p, osConcessionaria: e.target.value}))}
                        className="w-full px-4 py-2.5 text-sm border border-orange-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-orange-800 mb-1">Data/Hora Encaminhamento *</label>
                      <input
                        type="datetime-local"
                        value={agendamento.data}
                        onChange={(e) => setAgendamento((p) => ({ ...p, data: e.target.value }))}
                        className="w-full px-4 py-2.5 text-sm border border-orange-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white transition-all text-gray-700"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-4 pt-4 border-t border-orange-200/50">
                    <button 
                       onClick={() => handleEncaminharConcessionaria()}
                       className="px-6 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 transition-all shadow-md hover:shadow-lg"
                    >
                       Encaminhar p/ Concessionária
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!osAtual.veiculoNaGarantia && (
            <>
              <h3 className="text-gray-700 mb-4 pb-2 border-b border-gray-100" style={{ fontWeight: 600 }}>Atribuição de Serviço</h3>
              <div className="grid grid-cols-2 gap-5 mb-6">
                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-1.5">Mecânico Responsável *</label>
                  <select
                    value={agendamento.mecanico}
                    onChange={(e) => setAgendamento((p) => ({ ...p, mecanico: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 bg-white"
                  >
                    <option value="">Selecione o mecânico...</option>
                    {mecanicosBanco.map((m: any) => <option key={m.id} value={m.id}>{m.nome} — {m.perfil}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-1.5">Data/Hora Agendamento *</label>
                  <input
                    type="datetime-local"
                    value={agendamento.data}
                    onChange={(e) => setAgendamento((p) => ({ ...p, data: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 text-gray-600"
                  />
                </div>
              </div>
            </>
          )}

          <div className="mb-8">
            <label className="block text-sm text-gray-700 font-medium mb-2">Definir Prioridade</label>
            <div className="flex gap-4">
              {["Alta", "Média", "Baixa"].map((p) => (
                <label key={p} className="flex items-center gap-2 cursor-pointer bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                  <input
                    type="radio"
                    name="prioridade-agendamento"
                    checked={agendamento.prioridade === p}
                    onChange={() => setAgendamento((prev) => ({ ...prev, prioridade: p }))}
                    className="accent-red-600"
                  />
                  <span className="text-sm font-medium text-gray-700">{p}</span>
                </label>
              ))}
            </div>
          </div>

          {erroBanco && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erroBanco}</div>}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button onClick={() => setView("lista")} className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            {!osAtual.veiculoNaGarantia && (
              <button onClick={handleSalvarAgendamento} className="px-6 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 shadow-lg" style={{ background: "#e8192c" }}>
                Confirmar Agendamento
              </button>
            )}
          </div>

        </div>
      </div>
    );
  }

  if (view === "nova") {
    return (
      <div className="p-6">
        {erroBanco && (
          <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <strong>Não foi possível salvar a solicitação.</strong>
            <p className="mt-1">{erroBanco}</p>
          </div>
        )}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setView("lista")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ChevronLeft size={16} />
            Voltar
          </button>
          <h1 className="text-gray-800" style={{ fontSize: "1.3rem", fontWeight: 700 }}>
            Nova Solicitação de Manutenção
          </h1>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-100 p-6 max-w-3xl" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <p className="text-sm text-gray-500 mb-6">Preencha os dados abaixo para solicitar uma manutenção. Um responsável irá avaliar e realizar o agendamento posteriormente.</p>
          
          <h3 className="text-gray-700 mb-4 pb-2 border-b border-gray-100" style={{ fontWeight: 600 }}>Informações do Veículo</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Veículo *</label>
              <select
                value={novaOS.veiculoId || ""}
                onChange={(e) => {
                  const v = veiculosBanco.find((item: any) => item.id === e.target.value);
                  setNovaOS((p) => ({
                    ...p,
                    veiculoId: e.target.value,
                    veiculo: v ? `${v.placa} - ${v.marca} ${v.modelo}` : "",
                    quilometragem: v?.quilometragem_atual != null
                      ? `${Number(v.quilometragem_atual).toLocaleString("pt-BR")} km`
                      : "",
                  }));
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 bg-white"
              >
                <option value="">Selecione o veículo...</option>
                {veiculosBanco.map((v: any) => <option key={v.id} value={v.id}>{v.placa} - {v.marca} {v.modelo}{v.possui_garantia ? " (Na Garantia)" : ""}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Quilometragem Atual</label>
              <input
                type="text"
                value={novaOS.quilometragem || ""}
                onChange={(e) => setNovaOS((p) => ({ ...p, quilometragem: e.target.value }))}
                placeholder="Ex: 48.750 km"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400"
              />
            </div>
          </div>

          {novaOS.veiculoId && veiculosBanco.find((v: any) => v.id === novaOS.veiculoId)?.possui_garantia && (
            <div className="mb-6 p-4 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-purple-900">Atenção: Veículo na Garantia!</p>
                <p className="text-xs text-purple-700 mt-1">Sugerimos informar o envio para a concessionária na descrição.</p>
              </div>
            </div>
          )}

          <h3 className="text-gray-700 mb-4 pb-2 border-b border-gray-100" style={{ fontWeight: 600 }}>Detalhes da Solicitação</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Data da Solicitação</label>
              <input
                type="text"
                value={novaOS.dataSolicitacao || new Date().toLocaleDateString("pt-BR")}
                onChange={(e) => setNovaOS((p) => ({ ...p, dataSolicitacao: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de Manutenção</label>
              <div className="flex gap-4 mt-2">
                {["Preventiva", "Corretiva"].map((t) => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                    <input
                      type="radio"
                      name="tipo"
                      checked={novaOS.tipoManutencao === t}
                      onChange={() => setNovaOS((p) => ({ ...p, tipoManutencao: t as "Preventiva" | "Corretiva" }))}
                      className="accent-red-600"
                    />
                    <span className="text-sm font-medium text-gray-700">{t}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Problema Inicial / Observações</label>
            <textarea
              value={novaOS.descricaoProblema || ""}
              onChange={(e) => setNovaOS((p) => ({ ...p, descricaoProblema: e.target.value }))}
              placeholder="Descreva o motivo da solicitação, sintomas apresentados, etc..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button onClick={() => setView("lista")} className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button onClick={handleSalvarOS} disabled={salvando} className="px-6 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 shadow-lg disabled:opacity-60" style={{ background: "#e8192c" }}>
              {salvando ? "Salvando..." : "Criar Solicitação"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <h1 className="text-gray-800" style={{ fontSize: "1.4rem", fontWeight: 700 }}>
          Manutenção de Frota
        </h1>
        <button
          onClick={() => setView("nova")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 shadow-lg"
          style={{ background: "#e8192c" }}
        >
          <Plus size={16} />
          Nova Solicitação
        </button>
      </div>

      {erroBanco && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erroBanco}</div>}
      {carregando && <div className="mb-4 rounded-xl bg-white p-5 text-sm text-gray-500">Carregando ordens de serviço do Supabase...</div>}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setAbaOrdens("pendentes")}
          className="px-5 py-2.5 rounded-xl text-sm font-bold border transition-colors"
          style={abaOrdens === "pendentes" ? { background: "#e8192c", color: "#fff", borderColor: "#e8192c" } : { background: "#fff", color: "#6b7280", borderColor: "#e5e7eb" }}
        >
          Pendentes ({ordens.filter((o) => o.status !== "Concluída").length})
        </button>
        <button
          onClick={() => setAbaOrdens("finalizadas")}
          className="px-5 py-2.5 rounded-xl text-sm font-bold border transition-colors"
          style={abaOrdens === "finalizadas" ? { background: "#e8192c", color: "#fff", borderColor: "#e8192c" } : { background: "#fff", color: "#6b7280", borderColor: "#e5e7eb" }}
        >
          Finalizadas ({ordens.filter((o) => o.status === "Concluída").length})
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 shadow-sm">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            placeholder="Buscar OS, veículo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 transition-all"
          />
          {busca && (
            <button onClick={() => setBusca("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              {["OS", "Veículo", "Tipo", "Mecânico / Agenda", "Prioridade", "Status", "Ações"].map((h) => (
                <th key={h} className="text-left px-5 py-4 text-sm text-gray-500 border-b border-gray-100" style={{ fontWeight: 700 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((o, i) => {
              const sc = statusColors[o.status] || { bg: "#f3f4f6", text: "#4b5563" };
              const pc = prioridadeColors[o.prioridade] || { bg: "#f3f4f6", text: "#4b5563" };
              return (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <td className="px-5 py-4 text-base font-bold text-gray-800">{o.id}</td>
                  <td className="px-5 py-4 text-base text-gray-700">{o.veiculo}</td>
                  <td className="px-5 py-4">
                    <span className="text-sm px-3.5 py-1.5 rounded-full font-medium" style={{
                      background: o.tipoManutencao === "Preventiva" ? "rgba(16,185,129,0.1)" : "rgba(232,25,44,0.1)",
                      color: o.tipoManutencao === "Preventiva" ? "#10b981" : "#e8192c",
                    }}>
                      {o.tipoManutencao}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-base text-gray-800 font-bold">{o.mecanicoResponsavel || "Não atribuído"}</div>
                    <div className="text-sm text-gray-500">{o.dataAgendamento || `Solicitado em ${o.dataSolicitacao}`}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap" style={{ background: pc.bg, color: pc.text }}>
                      {o.prioridade}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap" style={{ background: sc.bg, color: sc.text }}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {o.status === "Aberta" && (
                      <button
                        onClick={() => { setOsAtual(o); setView("agendamento"); }}
                        className="text-sm px-4 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-bold transition-colors flex items-center gap-1"
                      >
                        <Calendar size={14} /> Agendar
                      </button>
                    )}
                    {(o.status === "Agendada" || o.status === "Em Andamento" || o.status === "Na Concessionária") && (
                      <button
                        onClick={async () => {
                          if (!o.bancoId) return;
                          setSalvando(true);
                          const hoje = new Date().toISOString().slice(0, 10);
                          const { error } = await supabase.from("ordens_servico").update({
                            status: "Em Andamento", data_inicio: o.dataInicio || hoje,
                          }).eq("id", o.bancoId);
                          if (error) { setErroBanco(`Não foi possível iniciar a execução: ${error.message}`); setSalvando(false); return; }
                          setOsAtual({ ...o, status: "Em Andamento", dataInicio: o.dataInicio || hoje });
                          setView("execucao"); setSalvando(false);
                          await carregarDados();
                        }}
                        className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 font-bold transition-colors"
                      >
                        Atender
                      </button>
                    )}
                    {o.status === "Concluída" && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-green-600 font-bold flex items-center gap-1.5 bg-green-50 px-3 py-2 rounded-lg w-fit">
                          <CheckCircle size={14} /> Finalizada
                        </span>
                        <button
                          onClick={() => { setOsAtual(o); setView("execucao"); }}
                          className="text-gray-500 hover:text-gray-800 p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                          title="Ver OS / Imprimir"
                        >
                          <Printer size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">
                {abaOrdens === "finalizadas" ? "Nenhuma manutenção finalizada encontrada." : "Nenhuma manutenção pendente encontrada."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}