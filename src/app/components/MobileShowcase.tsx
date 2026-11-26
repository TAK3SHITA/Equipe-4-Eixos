import { Smartphone, Menu, Bell, User } from "lucide-react";
import Login from "./Login";
import { MotoristaApp } from "./MotoristaApp";
import { Dashboard } from "./Dashboard";
import { Veiculos } from "./Veiculos";
import { Manutencao } from "./Manutencao";
import { Relatorios } from "./Relatorios";

function MobileWrapper({ children, title }: { children: React.ReactNode, title: string }) {
  return (
    <div className="w-full h-full bg-gray-50 flex flex-col overflow-hidden">
      {/* Fake Mobile Header */}
      <header className="bg-[#0b1329] text-white px-4 py-3 flex items-center justify-between shadow-md z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <Menu size={20} />
          </button>
          <span className="font-semibold text-[15px] tracking-wide">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <Bell size={18} />
          </button>
          <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-white/20 overflow-hidden">
            <User size={14} className="text-white" />
          </div>
        </div>
      </header>
      
      {/* Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-white" style={{ height: "calc(100% - 54px)" }}>
        <div className="w-full flex flex-col [&>div]:min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}

export function MobileShowcase() {
  const screens = [
    { title: "Login App", component: <Login /> },
    { title: "App Motorista", component: <MotoristaApp isShowcase /> },
    { title: "Painel Principal", component: <MobileWrapper title="Dashboard"><Dashboard /></MobileWrapper> },
    { title: "Gestão de Veículos", component: <MobileWrapper title="Veículos"><Veiculos /></MobileWrapper> },
    { title: "Manutenção", component: <MobileWrapper title="Manutenções"><Manutencao /></MobileWrapper> },
    { title: "Relatórios da Frota", component: <MobileWrapper title="Relatórios"><Relatorios /></MobileWrapper> },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 overflow-auto flex flex-col" style={{ backgroundImage: "radial-gradient(circle at 50% 0%, #1a2942 0%, #030712 60%)" }}>
      <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col">
        <div className="flex flex-col items-center mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4 flex items-center gap-3 tracking-tight text-white">
            <Smartphone className="text-emerald-500" size={48} />
            Showcase Mobile
          </h1>
          <p className="text-gray-400 max-w-2xl text-lg md:text-xl">
            Visão geral de todas as telas adaptadas para dispositivos móveis. 
            Você pode ajustar o zoom no seu navegador.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-10 xl:gap-16 pb-20">
          {screens.map((screen, index) => (
            <div key={index} className="flex flex-col items-center">
              <h2 className="text-xl font-bold mb-6 text-gray-200 tracking-wide bg-gray-900/50 px-6 py-2 rounded-full border border-gray-800">
                {screen.title}
              </h2>
              
              {/* Mobile Device Mockup */}
              <div className="relative border-gray-800 bg-gray-800 border-[12px] rounded-[3rem] h-[812px] w-[375px] shadow-2xl overflow-hidden ring-1 ring-white/10">
                {/* Notch */}
                <div className="absolute top-0 inset-x-0 h-7 bg-gray-800 rounded-b-3xl w-40 mx-auto z-50 flex items-center justify-center gap-2">
                   <div className="w-12 h-1.5 bg-gray-900 rounded-full"></div>
                   <div className="w-2.5 h-2.5 bg-blue-900 rounded-full border border-blue-950/50 relative overflow-hidden"><div className="absolute inset-0 bg-blue-500/20 rounded-full"></div></div>
                </div>
                
                {/* Screen Content directly rendered instead of iframe */}
                <div className="w-full h-full bg-white relative overflow-hidden flex flex-col rounded-[2.5rem]">
                  {screen.component}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}