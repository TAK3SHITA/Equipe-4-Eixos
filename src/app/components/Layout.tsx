import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import {
  Home,
  Truck,
  Wrench,
  Package,
  FileText,
  BarChart3,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  MapPin
} from "lucide-react";
import logoImg from "../../imports/image-2.png";
import { useAuth } from "../contexts/AuthContext";

const navItems = [
  { label: "Início", icon: Home, path: "/app" },
  { label: "Monitoramento", icon: MapPin, path: "/app/monitoramento" },
  { label: "Veículos", icon: Truck, path: "/app/veiculos" },
  { label: "Manutenção", icon: Wrench, path: "/app/manutencao" },
  { label: "Peças", icon: Package, path: "/app/pecas" },
  { label: "Documentação", icon: FileText, path: "/app/documentacao" },
  { label: "Relatórios", icon: BarChart3, path: "/app/relatorios" },
  { label: "Usuários", icon: Users, path: "/app/usuarios" },
  { label: "Configurações", icon: Settings, path: "/app/configuracoes" },
];

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, perfil } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) => {
    if (path === "/app") return location.pathname === "/app";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside
        className="flex flex-col transition-all duration-300 relative"
        style={{
          width: collapsed ? 68 : 220,
          background: "#0d1b2a",
          minHeight: "100vh",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-center gap-2 px-3 py-4 border-b min-h-[72px]"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          {collapsed ? (
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "#e8192c" }}
            >
              <span className="text-white font-black text-base">4</span>
            </div>
          ) : (
            <img
              src={logoImg}
              alt="Equipe 4 Eixos"
              className="w-full max-w-[160px] h-auto object-contain"
            />
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 overflow-y-auto">
          {navItems.filter((item) => item.path !== "/app/usuarios" || perfil?.perfil === "Administrador").map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                title={collapsed ? item.label : undefined}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all text-left"
                style={{
                  background: active ? "#e8192c" : "transparent",
                  color: active ? "#fff" : "rgba(255,255,255,0.65)",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)";
                    (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.65)";
                  }
                }}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-2 pb-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)", paddingTop: 12 }}>
          <button
            onClick={() => navigate("/apresentacao")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all mb-2"
            style={{ color: "rgba(16, 185, 129, 0.8)", background: "rgba(16, 185, 129, 0.1)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(16, 185, 129, 0.2)";
              (e.currentTarget as HTMLButtonElement).style.color = "#10b981";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(16, 185, 129, 0.1)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(16, 185, 129, 0.8)";
            }}
          >
            <Smartphone size={18} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm font-semibold">Ver Mobile</span>}
          </button>

          <button
            onClick={async () => { await signOut(); navigate("/", { replace: true }); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
            style={{ color: "rgba(255,255,255,0.5)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)";
              (e.currentTarget as HTMLButtonElement).style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)";
            }}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm">Sair</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-16 w-6 h-6 rounded-full flex items-center justify-center shadow-md z-10"
          style={{ background: "#e8192c", color: "#fff" }}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}