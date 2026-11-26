import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Plus, Search, X, ChevronLeft, Package, Pencil, Trash2 } from "lucide-react";

type Peca = {
  id: string;
  codigo: string;
  descricao: string;
  categoria: string;
  estoque: number;
  estoqueMinimo: number;
  unidade: string;
  valorUnit: string;
};

type PecaBanco = {
  id: string;
  codigo: string;
  descricao: string;
  categoria: string | null;
  estoque: number;
  estoque_minimo: number;
  unidade: string | null;
  valor_unit: number | string;
};

function converterPeca(row: PecaBanco): Peca {
  return {
    id: row.id,
    codigo: row.codigo,
    descricao: row.descricao,
    categoria: row.categoria ?? "",
    estoque: Number(row.estoque ?? 0),
    estoqueMinimo: Number(row.estoque_minimo ?? 0),
    unidade: row.unidade ?? "Un",
    valorUnit: Number(row.valor_unit ?? 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  };
}

function decimalPt(valor: string): number | null {
  const limpo = valor.trim().replace(/R\$\s?/g, "").replace(/\s/g, "");
  if (!limpo) return null;
  const normalizado = limpo.includes(",")
    ? limpo.replace(/\./g, "").replace(",", ".")
    : limpo;
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : null;
}

function payloadPeca(form: Omit<Peca, "id">) {
  return {
    codigo: form.codigo.trim().toUpperCase(),
    descricao: form.descricao.trim(),
    categoria: form.categoria || null,
    estoque: Math.max(0, Math.trunc(Number(form.estoque) || 0)),
    estoque_minimo: Math.max(0, Math.trunc(Number(form.estoqueMinimo) || 0)),
    unidade: form.unidade.trim() || "Un",
    valor_unit: decimalPt(form.valorUnit) ?? 0,
  };
}

const categorias = ["Todos", "Filtros", "Lubrificantes", "Freios", "Elétrico", "Motor", "Suspensão", "Outros"];

const emptyPeca: Omit<Peca, "id"> = {
  codigo: "",
  descricao: "",
  categoria: "",
  estoque: 0,
  estoqueMinimo: 0,
  unidade: "Un",
  valorUnit: "",
};

export function Pecas() {
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const carregarPecas = async () => {
    setCarregando(true);
    setErro("");
    const { data, error } = await supabase
      .from("pecas")
      .select("id,codigo,descricao,categoria,estoque,estoque_minimo,unidade,valor_unit")
      .order("codigo", { ascending: true });

    if (error) {
      console.error("Erro ao carregar peças:", error);
      setErro(`Não foi possível carregar as peças: ${error.message}`);
      setPecas([]);
    } else {
      setPecas((data ?? []).map((row) => converterPeca(row as PecaBanco)));
    }
    setCarregando(false);
  };

  useEffect(() => {
    void carregarPecas();
  }, []);
  const [busca, setBusca] = useState("");
  const [categoriaSel, setCategoriaSel] = useState("Todos");
  const [showForm, setShowForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Peca, "id">>(emptyPeca);
  const [page, setPage] = useState(1);

  const filtered = pecas.filter((p) => {
    const matchBusca =
      p.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      p.codigo.toLowerCase().includes(busca.toLowerCase());
    const matchCat = categoriaSel === "Todos" || p.categoria === categoriaSel;
    return matchBusca && matchCat;
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) setPage(totalPages);
    if (totalPages === 0 && page !== 1) setPage(1);
  }, [page, totalPages]);

  const abrirNova = () => {
    setEditandoId(null);
    setForm(emptyPeca);
    setShowForm(true);
  };

  const abrirEdicao = (peca: Peca) => {
    setEditandoId(peca.id);
    setForm({ codigo: peca.codigo, descricao: peca.descricao, categoria: peca.categoria, estoque: peca.estoque, estoqueMinimo: peca.estoqueMinimo, unidade: peca.unidade, valorUnit: peca.valorUnit });
    setShowForm(true);
  };

  const handleExcluir = async (peca: Peca) => {
    if (!window.confirm(`Deseja realmente excluir a peça ${peca.codigo} - ${peca.descricao}?`)) return;
    setErro("");
    const { error } = await supabase.from("pecas").delete().eq("id", peca.id);
    if (error) {
      console.error("Erro ao excluir peça:", error);
      setErro(`Não foi possível excluir a peça ${peca.codigo}: ${error.message}`);
      return;
    }
    setPecas((prev) => prev.filter((item) => item.id !== peca.id));
    setPage(1);
  };

  const handleSalvar = async () => {
    setErro("");
    if (!form.codigo.trim() || !form.descricao.trim()) {
      setErro("Preencha o código e a descrição da peça.");
      return;
    }
    if (!Number.isInteger(Number(form.estoque)) || Number(form.estoque) < 0 ||
        !Number.isInteger(Number(form.estoqueMinimo)) || Number(form.estoqueMinimo) < 0) {
      setErro("Estoque e estoque mínimo devem ser números inteiros iguais ou maiores que zero.");
      return;
    }
    const valor = decimalPt(form.valorUnit);
    if (valor === null || valor < 0) {
      setErro("Informe um valor unitário válido, igual ou maior que zero.");
      return;
    }

    setSalvando(true);
    const dados = payloadPeca(form);
    const resultado = editandoId
      ? await supabase.from("pecas").update(dados).eq("id", editandoId).select("*").single()
      : await supabase.from("pecas").insert(dados).select("*").single();

    if (resultado.error) {
      console.error("Erro ao salvar peça:", resultado.error);
      setErro(`Não foi possível salvar a peça: ${resultado.error.message}`);
      setSalvando(false);
      return;
    }

    await carregarPecas();
    setSalvando(false);
    setForm(emptyPeca);
    setEditandoId(null);
    setShowForm(false);
    setPage(1);
  };

  const f = (field: keyof typeof form, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const estoqueColor = (qtd: number, minimo: number) => {
    if (qtd <= minimo) return { bg: "rgba(232,25,44,0.1)", text: "#e8192c" };
    if (qtd <= Math.max(minimo + 5, minimo * 1.5)) return { bg: "rgba(245,158,11,0.1)", text: "#f59e0b" };
    return { bg: "rgba(16,185,129,0.1)", text: "#10b981" };
  };

  if (showForm) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setShowForm(false)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ChevronLeft size={16} />
            Voltar
          </button>
          <h1 className="text-gray-800" style={{ fontSize: "1.3rem", fontWeight: 700 }}>
            {editandoId ? "Editar Peça" : "Nova Peça"}
          </h1>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {[
              { label: "Código *", key: "codigo", placeholder: "PEC006" },
              { label: "Descrição *", key: "descricao", placeholder: "Filtro de Óleo" },
              { label: "Valor de Saída *", key: "valorUnit", placeholder: "R$ 42,00" },
              { label: "Estoque Físico", key: "estoque", placeholder: "0", type: "number" },
              { label: "Estoque Mínimo", key: "estoqueMinimo", placeholder: "0", type: "number" },
              { label: "Unidade", key: "unidade", placeholder: "Un" },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-xs text-gray-600 mb-1.5">{field.label}</label>
                <input
                  type={field.type || "text"}
                  value={String(form[field.key as keyof typeof form])}
                  onChange={(e) => f(field.key as keyof typeof form, field.type === "number" ? Number(e.target.value) : e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs text-gray-600 mb-1.5">Categoria *</label>
              <select
                value={form.categoria}
                onChange={(e) => f("categoria", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 bg-white"
              >
                <option value="">Selecione...</option>
                {categorias.filter(c => c !== "Todos").map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          {erro && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</div>}
          <div className="flex justify-end gap-3">
            <button onClick={() => { setShowForm(false); setErro(""); }} className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button onClick={handleSalvar} disabled={salvando} className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60" style={{ background: "#e8192c" }}>
              {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-gray-800" style={{ fontSize: "1.4rem", fontWeight: 700 }}>
            Controle de Estoque
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gerenciamento interno de peças (sem controle logístico ou compras).</p>
        </div>
        <button
          onClick={abrirNova}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: "#e8192c" }}
        >
          <Plus size={16} />
          + Nova Peça
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex items-center gap-4 flex-wrap" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            placeholder="Buscar peça..."
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setPage(1); }}
            className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 w-52"
          />
          {busca && (
            <button onClick={() => { setBusca(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Categoria</span>
          <select
            value={categoriaSel}
            onChange={(e) => { setCategoriaSel(e.target.value); setPage(1); }}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 bg-white"
          >
            {categorias.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {erro && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</div>}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              {["Código", "Descrição", "Categoria", "Estoque Físico", "Unidade", "Valor de Saída", "Ações"].map((h) => (
                <th key={h} className="text-left px-5 py-4 text-sm text-gray-500 border-b border-gray-100" style={{ fontWeight: 700 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {carregando && <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-500">Carregando peças do banco de dados...</td></tr>}
            {!carregando && paginated.map((p, i) => {
              const ec = estoqueColor(p.estoque, p.estoqueMinimo);
              return (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: i < paginated.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(232,25,44,0.08)" }}>
                        <Package size={18} style={{ color: "#e8192c" }} />
                      </div>
                      <span className="text-base font-bold text-gray-800">{p.codigo}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-base font-medium text-gray-700">{p.descricao}</td>
                  <td className="px-5 py-4 text-base text-gray-600">{p.categoria}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col items-start gap-1">
                      <span title={`Estoque mínimo: ${p.estoqueMinimo}`} className="text-sm px-3.5 py-1.5 rounded-full font-bold" style={{ background: ec.bg, color: ec.text }}>
                        {p.estoque}
                      </span>
                      {p.estoque <= p.estoqueMinimo && (
                        <span className="text-xs font-semibold" style={{ color: "#e8192c" }}>Estoque baixo</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-base text-gray-600">{p.unidade}</td>
                  <td className="px-5 py-4 text-base text-gray-800 font-bold">{p.valorUnit}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => abrirEdicao(p)} title={`Editar ${p.codigo}`} aria-label={`Editar ${p.codigo}`} className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleExcluir(p)} title={`Excluir ${p.codigo}`} aria-label={`Excluir ${p.codigo}`} className="p-2 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">
                  Nenhuma peça encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-100">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className="w-8 h-8 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: page === p ? "#e8192c" : "transparent",
                  color: page === p ? "#fff" : "#6b7280",
                  border: page === p ? "none" : "1px solid #e5e7eb",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
