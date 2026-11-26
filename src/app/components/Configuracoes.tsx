import { Settings, Bell, Shield, Database, Palette } from "lucide-react";

const sections = [
  {
    icon: Settings,
    title: "Configurações Gerais",
    desc: "Nome da empresa, fuso horário, idioma e configurações básicas do sistema.",
    color: "#6b7280",
    bg: "#f9fafb",
  },
  {
    icon: Bell,
    title: "Notificações",
    desc: "Configure alertas de vencimento de documentos, manutenções e estoque mínimo.",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.08)",
  },
  {
    icon: Shield,
    title: "Segurança",
    desc: "Senhas, permissões de acesso e autenticação em dois fatores.",
    color: "#e8192c",
    bg: "rgba(232,25,44,0.08)",
  },
  {
    icon: Database,
    title: "Backup e Dados",
    desc: "Configurações de backup automático e exportação de dados.",
    color: "#10b981",
    bg: "rgba(16,185,129,0.08)",
  },
  {
    icon: Palette,
    title: "Aparência",
    desc: "Temas, cores e personalização da interface do sistema.",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
  },
];

export function Configuracoes() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-gray-800" style={{ fontSize: "1.75rem", fontWeight: 700 }}>
          Configurações
        </h1>
        <p className="text-gray-500 text-base mt-0.5">Gerencie as configurações do sistema</p>
      </div>

      {/* Company info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <h3 className="text-gray-800 text-lg mb-4" style={{ fontWeight: 600 }}>Informações da Empresa</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Nome da Empresa", value: "Equipe 4 Eixos" },
            { label: "CNPJ", value: "12.345.678/0001-90" },
            { label: "Responsável", value: "Carlos Oliveira" },
            { label: "Telefone", value: "(11) 99999-9999" },
          ].map((f) => (
            <div key={f.label}>
              <label className="block text-sm text-gray-500 mb-1.5">{f.label}</label>
              <input
                type="text"
                defaultValue={f.value}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
              />
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <button
            className="px-6 py-3 rounded-xl text-white text-base font-semibold transition-all hover:opacity-90"
            style={{ background: "#e8192c" }}
          >
            Salvar Alterações
          </button>
        </div>
      </div>

      {/* Config sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.title}
              className="bg-white rounded-2xl border border-gray-100 p-6 flex items-start gap-5 text-left hover:shadow-md transition-all group"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: s.bg }}
              >
                <Icon size={24} style={{ color: s.color }} />
              </div>
              <div>
                <h3 className="text-gray-800 mb-1.5 group-hover:text-red-600 transition-colors text-lg" style={{ fontWeight: 600 }}>
                  {s.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
