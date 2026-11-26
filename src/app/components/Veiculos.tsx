import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Plus, Search, X, ChevronLeft, Truck, Fuel, AlertTriangle, Trash2 } from "lucide-react";

type Veiculo = {
  id: string;
  placa: string;
  renavam: string;
  chassi: string;
  marca: string;
  modelo: string;
  anoFab: string;
  anoModelo: string;
  tipoVeiculo: string;
  cor: string;
  dataAquisicao: string;
  valorAquisicao: string;
  concessionaria: string;
  possuiGarantia: boolean;
  inicioGarantia: string;
  terminoGarantia: string;
  quilometragemAtual: string;
  combustivel: string;
  status: string;
  consumoMedio?: string;
  metaConsumo?: string;
  alertaConsumo?: boolean;
};

function dataParaBanco(valor: string): string | null {
  if (!valor.trim()) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;
  const partes = valor.trim().split("/");
  if (partes.length !== 3) return null;
  const [dia, mes, ano] = partes;
  if (!dia || !mes || !ano) return null;
  return `${ano.padStart(4, "0")}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
}

function dataDaTela(valor: string | null): string {
  if (!valor) return "";
  const [ano, mes, dia] = valor.slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : "";
}

function inteiroPt(valor: string): number {
  const somenteDigitos = valor.replace(/\D/g, "");
  return somenteDigitos ? Number(somenteDigitos) : 0;
}

function decimalPt(valor: string): number | null {
  const limpo = valor.trim().replace(/R\$\s?/g, "");
  if (!limpo) return null;
  const normalizado = limpo.includes(",")
    ? limpo.replace(/\./g, "").replace(",", ".")
    : limpo;
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : null;
}

function formatarDecimal(valor: number | string | null): string {
  if (valor === null || valor === undefined || valor === "") return "";
  return Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

type VeiculoBanco = {
  id: string;
  placa: string;
  renavam: string | null;
  chassi: string | null;
  marca: string | null;
  modelo: string | null;
  ano_fab: number | null;
  ano_modelo: number | null;
  tipo_veiculo: string | null;
  cor: string | null;
  data_aquisicao: string | null;
  valor_aquisicao: number | null;
  concessionaria: string | null;
  possui_garantia: boolean;
  inicio_garantia: string | null;
  termino_garantia: string | null;
  quilometragem_atual: number;
  combustivel: string | null;
  status: string;
  meta_consumo: number | null;
};

function converterVeiculo(row: VeiculoBanco): Veiculo {
  return {
    id: row.id,
    placa: row.placa ?? "",
    renavam: row.renavam ?? "",
    chassi: row.chassi ?? "",
    marca: row.marca ?? "",
    modelo: row.modelo ?? "",
    anoFab: row.ano_fab?.toString() ?? "",
    anoModelo: row.ano_modelo?.toString() ?? "",
    tipoVeiculo: row.tipo_veiculo ?? "",
    cor: row.cor ?? "",
    dataAquisicao: dataDaTela(row.data_aquisicao),
    valorAquisicao: formatarDecimal(row.valor_aquisicao),
    concessionaria: row.concessionaria ?? "",
    possuiGarantia: row.possui_garantia,
    inicioGarantia: dataDaTela(row.inicio_garantia),
    terminoGarantia: dataDaTela(row.termino_garantia),
    quilometragemAtual: Number(row.quilometragem_atual ?? 0).toLocaleString("pt-BR"),
    combustivel: row.combustivel ?? "",
    status: row.status ?? "Disponível",
    // O consumo médio depende dos registros de abastecimento; não é inventado nesta etapa.
    consumoMedio: "",
    metaConsumo: row.meta_consumo?.toString() ?? "",
    alertaConsumo: false,
  };
}

function payloadVeiculo(form: Veiculo) {
  return {
    placa: form.placa.trim().toUpperCase(),
    renavam: form.renavam.trim() || null,
    chassi: form.chassi.trim() || null,
    marca: form.marca.trim() || null,
    modelo: form.modelo.trim() || null,
    ano_fab: form.anoFab ? inteiroPt(form.anoFab) : null,
    ano_modelo: form.anoModelo ? inteiroPt(form.anoModelo) : null,
    tipo_veiculo: form.tipoVeiculo || null,
    cor: form.cor.trim() || null,
    data_aquisicao: dataParaBanco(form.dataAquisicao),
    valor_aquisicao: decimalPt(form.valorAquisicao),
    concessionaria: form.concessionaria.trim() || null,
    possui_garantia: form.possuiGarantia,
    inicio_garantia: form.possuiGarantia ? dataParaBanco(form.inicioGarantia) : null,
    termino_garantia: form.possuiGarantia ? dataParaBanco(form.terminoGarantia) : null,
    quilometragem_atual: inteiroPt(form.quilometragemAtual),
    combustivel: form.combustivel || null,
    status: form.status || "Disponível",
    meta_consumo: decimalPt(form.metaConsumo || ""),
  };
}

const emptyVeiculo: Veiculo = {
  id: "",
  placa: "",
  renavam: "",
  chassi: "",
  marca: "",
  modelo: "",
  anoFab: "",
  anoModelo: "",
  tipoVeiculo: "",
  cor: "",
  dataAquisicao: "",
  valorAquisicao: "",
  concessionaria: "",
  possuiGarantia: false,
  inicioGarantia: "",
  terminoGarantia: "",
  quilometragemAtual: "",
  combustivel: "",
  status: "Disponível",
};

const statusColor: Record<string, { bg: string; text: string }> = {
  Disponível: { bg: "rgba(16,185,129,0.1)", text: "#10b981" },
  "Em Manutenção": { bg: "rgba(245,158,11,0.1)", text: "#f59e0b" },
  Indisponível: { bg: "rgba(232,25,44,0.1)", text: "#e8192c" },
};

export function Veiculos() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const carregarVeiculos = async () => {
    setCarregando(true);
    setErro("");
    const { data, error } = await supabase
      .from("veiculos")
      .select("id,placa,renavam,chassi,marca,modelo,ano_fab,ano_modelo,tipo_veiculo,cor,data_aquisicao,valor_aquisicao,concessionaria,possui_garantia,inicio_garantia,termino_garantia,quilometragem_atual,combustivel,status,meta_consumo")
      .order("placa", { ascending: true });
    if (error) {
      console.error("Erro ao carregar veículos:", error);
      setErro(`Não foi possível carregar os veículos: ${error.message}`);
      setVeiculos([]);
    } else {
      setVeiculos((data ?? []).map((row) => converterVeiculo(row as VeiculoBanco)));
    }
    setCarregando(false);
  };

  useEffect(() => {
    void carregarVeiculos();
  }, []);
  const [busca, setBusca] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Veiculo | null>(null);
  const [form, setForm] = useState<Veiculo>(emptyVeiculo);

  const filtered = veiculos.filter(
    (v) =>
      v.placa.toLowerCase().includes(busca.toLowerCase()) ||
      v.modelo.toLowerCase().includes(busca.toLowerCase()) ||
      v.marca.toLowerCase().includes(busca.toLowerCase())
  );

  const openNovo = () => {
    setForm(emptyVeiculo);
    setEditando(null);
    setShowForm(true);
  };

  const openEditar = (v: Veiculo) => {
    setForm({ ...v });
    setEditando(v);
    setShowForm(true);
  };

  const handleSalvar = async () => {
    setErro("");
    if (!form.placa.trim()) {
      setErro("Informe a placa do veículo.");
      return;
    }
    if (!form.quilometragemAtual.trim()) {
      setErro("Informe a quilometragem atual do veículo.");
      return;
    }

    setSalvando(true);
    const dados = payloadVeiculo(form);
    const resultado = editando
      ? await supabase.from("veiculos").update(dados).eq("id", editando.id).select("*").single()
      : await supabase.from("veiculos").insert({
          id: crypto.randomUUID(),
          ...dados,
          criado_em: new Date().toISOString(),
        }).select("*").single();

    if (resultado.error) {
      console.error("Erro ao salvar veículo:", resultado.error);
      setErro(`Não foi possível salvar o veículo: ${resultado.error.message}`);
      setSalvando(false);
      return;
    }

    await carregarVeiculos();
    setSalvando(false);
    setShowForm(false);
    setEditando(null);
    setForm(emptyVeiculo);
  };

  const handleExcluir = async (veiculo: Veiculo) => {
    const confirmar = window.confirm(`Deseja realmente excluir o veículo ${veiculo.placa}?`);
    if (!confirmar) return;
    setErro("");
    const { error } = await supabase.from("veiculos").delete().eq("id", veiculo.id);
    if (error) {
      console.error("Erro ao excluir veículo:", error);
      setErro(`Não foi possível excluir o veículo: ${error.message}`);
      return;
    }
    setVeiculos((prev) => prev.filter((v) => v.id !== veiculo.id));
  };

  const handleCancelar = () => setShowForm(false);

  const f = (field: keyof Veiculo, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  if (showForm) {
    return (
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleCancelar}
            className="flex items-center gap-1.5 text-base text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ChevronLeft size={18} />
            Voltar
          </button>
          <h1 className="text-gray-800" style={{ fontSize: "1.6rem", fontWeight: 700 }}>
            {editando ? "Editar Veículo" : "Cadastro de Veículo"}
          </h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          {/* Dados do Veículo */}
          <h3 className="text-gray-700 text-lg mb-4 pb-2 border-b border-gray-100" style={{ fontWeight: 600 }}>
            Dados do Veículo
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <InputField label="Placa *" value={form.placa} onChange={(v) => f("placa", v)} placeholder="FTR4E07" />
            <InputField label="Renavam *" value={form.renavam} onChange={(v) => f("renavam", v)} placeholder="01234567890" />
            <InputField label="Chassi" value={form.chassi} onChange={(v) => f("chassi", v)} placeholder="9BWAG45U..." />
            <InputField label="Marca *" value={form.marca} onChange={(v) => f("marca", v)} placeholder="Volkswagen" />
            <InputField label="Modelo *" value={form.modelo} onChange={(v) => f("modelo", v)} placeholder="Delivery 11.180" />
            <InputField label="Ano Fab." value={form.anoFab} onChange={(v) => f("anoFab", v)} placeholder="2023" />
            <InputField label="Ano Modelo" value={form.anoModelo} onChange={(v) => f("anoModelo", v)} placeholder="2024" />
            <SelectField
              label="Tipo de Veículo *"
              value={form.tipoVeiculo}
              onChange={(v) => f("tipoVeiculo", v)}
              options={["Caminhão Toco", "Caminhão Truck", "Bitruck", "Carreta", "Van", "Utilitário"]}
            />
            <InputField label="Cor" value={form.cor} onChange={(v) => f("cor", v)} placeholder="Branco" />
          </div>

          {/* Dados de Aquisição */}
          <h3 className="text-gray-700 text-lg mb-4 pb-2 border-b border-gray-100" style={{ fontWeight: 600 }}>
            Dados de Aquisição
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <InputField label="Data Aquisição" value={form.dataAquisicao} onChange={(v) => f("dataAquisicao", v)} placeholder="10/05/2023" />
            <InputField label="Valor Aquisição (R$)" value={form.valorAquisicao} onChange={(v) => f("valorAquisicao", v)} placeholder="265.000,00" />
            <InputField label="Concessionária" value={form.concessionaria} onChange={(v) => f("concessionaria", v)} placeholder="Nome da concessionária" />
            <div className="col-span-1">
              <label className="block text-sm text-gray-600 mb-1.5">Possui Garantia?</label>
              <div className="flex gap-4 mt-2">
                {["Sim", "Não"].map((op) => (
                  <label key={op} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="garantia"
                      checked={form.possuiGarantia === (op === "Sim")}
                      onChange={() => f("possuiGarantia", op === "Sim")}
                      className="accent-red-600 w-4 h-4"
                    />
                    <span className="text-base text-gray-700">{op}</span>
                  </label>
                ))}
              </div>
            </div>
            {form.possuiGarantia && (
              <>
                <InputField label="Início Garantia" value={form.inicioGarantia} onChange={(v) => f("inicioGarantia", v)} placeholder="10/05/2023" />
                <InputField label="Término Garantia" value={form.terminoGarantia} onChange={(v) => f("terminoGarantia", v)} placeholder="10/05/2026" />
              </>
            )}
          </div>

          {/* Dados Operacionais */}
          <h3 className="text-gray-700 text-lg mb-4 pb-2 border-b border-gray-100" style={{ fontWeight: 600 }}>
            Dados Operacionais
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <InputField label="Quilometragem Atual" value={form.quilometragemAtual} onChange={(v) => f("quilometragemAtual", v)} placeholder="48.750" />
            <SelectField
              label="Combustível"
              value={form.combustivel}
              onChange={(v) => f("combustivel", v)}
              options={["Diesel S10", "Diesel S500", "Gasolina", "Etanol", "GNV"]}
            />
            <InputField label="Meta Consumo (km/l)" value={form.metaConsumo || ""} onChange={(v) => f("metaConsumo", v)} placeholder="Ex: 4.5" />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-gray-600">Status operacional</label>
              <div className="px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700">{form.status || "Disponível"}</div>
              <span className="text-xs text-gray-400">Disponibilidade e manutenção são automáticas. A interdição é controlada pelo administrador no Monitoramento.</span>
            </div>
          </div>

          {erro && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</div>}

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={handleCancelar}
              className="px-6 py-3 rounded-xl border border-gray-200 text-base text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              disabled={salvando}
              className="px-6 py-3 rounded-xl text-white text-base font-semibold transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: "#e8192c" }}
            >
              {salvando ? "Salvando..." : "Salvar Veículo"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <h1 className="text-gray-800" style={{ fontSize: "1.75rem", fontWeight: 700 }}>
          Veículos
        </h1>
        <button
          onClick={openNovo}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-white text-base font-semibold transition-all hover:opacity-90"
          style={{ background: "#e8192c" }}
        >
          <Plus size={18} />
          + Nova Placa
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar placa, modelo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
          />
          {busca && (
            <button onClick={() => setBusca("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {erro && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</div>}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              {["Placa", "Marca / Modelo", "Ano", "Tipo", "Km Atual", "Consumo", "Status", "Ações"].map((h) => (
                <th key={h} className="text-left px-5 py-4 text-sm text-gray-500 border-b border-gray-100" style={{ fontWeight: 700 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {carregando && <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-gray-500">Carregando veículos do banco de dados...</td></tr>}
            {!carregando && filtered.map((v, i) => {
              const sc = statusColor[v.status] || statusColor["Disponível"];
              return (
                <tr
                  key={v.id}
                  className="hover:bg-gray-50 transition-colors"
                  style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f3f4f6" : "none" }}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(232,25,44,0.08)" }}
                      >
                        <Truck size={18} style={{ color: "#e8192c" }} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-base font-bold text-gray-800 leading-tight">{v.placa}</span>
                        {v.possuiGarantia && (
                          <span className="text-[10px] uppercase font-bold tracking-wider text-orange-600 mt-1 flex items-center gap-1">
                             <AlertTriangle size={10} /> Em Garantia
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-base font-medium text-gray-700">{v.marca} {v.modelo}</td>
                  <td className="px-5 py-4 text-base text-gray-600">{v.anoModelo || v.anoFab || "-"}</td>
                  <td className="px-5 py-4 text-base text-gray-600">{v.tipoVeiculo}</td>
                  <td className="px-5 py-4 text-base font-medium text-gray-700">{v.quilometragemAtual} km</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-base font-medium text-gray-700">{v.consumoMedio ? `${v.consumoMedio} km/l` : '-'}</span>
                      {v.alertaConsumo && (
                        <div className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded w-fit">
                          <Fuel size={14} /> Alto ({v.metaConsumo} meta)
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className="px-3.5 py-1.5 rounded-full text-sm font-bold"
                      style={{ background: sc.bg, color: sc.text }}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditar(v)}
                        className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 font-medium transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleExcluir(v)}
                        title={`Excluir veículo ${v.placa}`}
                        aria-label={`Excluir veículo ${v.placa}`}
                        className="p-2 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!carregando && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-sm text-gray-400">
                  Nenhum veículo encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all bg-white"
      >
        <option value="">Selecione...</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
