import { useState } from "react";
import { Menu, Home, Clock, User as UserIcon, MapPin, CheckCircle, Fuel, X, Activity } from "lucide-react";

interface AbastecimentoRegistro {
  id: string;
  litros: number;
  valor: number;
  km: number;
}

export function MotoristaApp({ isShowcase = false }: { isShowcase?: boolean }) {
  const [veiculo, setVeiculo] = useState("FTR4E07 - VW Delivery 11.180");
  const [kmAtual, setKmAtual] = useState("48750");
  
  // Status da viagem diária
  const [statusViagem, setStatusViagem] = useState<"pendente" | "em_curso" | "finalizada">("pendente");
  const [kmSaida, setKmSaida] = useState("");
  const [kmRetorno, setKmRetorno] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // Abastecimento
  const [showAbastecimento, setShowAbastecimento] = useState(false);
  const [litros, setLitros] = useState("");
  const [valorAbastecimento, setValorAbastecimento] = useState("");
  
  // Registros de abastecimento do dia
  const [abastecimentosRegistrados, setAbastecimentosRegistrados] = useState<AbastecimentoRegistro[]>([]);

  const handleIniciarViagem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kmAtual) return alert("Informe a quilometragem atual!");
    setKmSaida(kmAtual);
    setStatusViagem("em_curso");
  };

  const handleFinalizarViagem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kmAtual || Number(kmAtual) <= Number(kmSaida)) {
      return alert("A quilometragem de retorno deve ser maior que a de saída!");
    }
    setKmRetorno(kmAtual);
    setStatusViagem("finalizada");
  };

  const handleAbastecer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!litros || !valorAbastecimento || !kmAtual) {
      return alert("Preencha todos os campos do abastecimento!");
    }
    
    const novoAbastecimento: AbastecimentoRegistro = {
      id: Date.now().toString(),
      litros: Number(litros),
      valor: Number(valorAbastecimento),
      km: Number(kmAtual)
    };

    setAbastecimentosRegistrados([...abastecimentosRegistrados, novoAbastecimento]);

    alert(`Abastecimento registrado!\nLitros: ${litros}L | R$ ${valorAbastecimento}\nKM: ${kmAtual}`);
    setShowAbastecimento(false);
    setLitros("");
    setValorAbastecimento("");
  };

  const totalLitros = abastecimentosRegistrados.reduce((acc, curr) => acc + curr.litros, 0);
  const totalValor = abastecimentosRegistrados.reduce((acc, curr) => acc + curr.valor, 0);
  const totalRodado = statusViagem === "finalizada" ? Number(kmRetorno) - Number(kmSaida) : 0;
  const consumoMedio = totalLitros > 0 && totalRodado > 0 ? (totalRodado / totalLitros).toFixed(2) : "0.00";

  return (
    <div className={isShowcase ? "w-full h-full bg-white flex flex-col relative" : "min-h-screen bg-gray-900 flex justify-center"}>
      {/* Mobile Simulator Container */}
      <div className={isShowcase ? "w-full h-full flex flex-col" : "w-full max-w-[400px] bg-white h-[100dvh] flex flex-col relative shadow-2xl sm:rounded-3xl sm:h-[800px] sm:my-auto overflow-hidden"}>
        
        {/* Header */}
        <header className="bg-[#0b1329] text-white px-4 py-4 flex items-center gap-3 shrink-0">
          <button className="p-1 hover:bg-white/10 rounded-lg">
            <Menu size={24} />
          </button>
          <h1 className="font-semibold text-lg">Diário de Bordo</h1>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5 bg-gray-50 flex flex-col relative">
          
          <div className="flex-1">
            {statusViagem === "finalizada" ? (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col space-y-5">
                <div className="flex flex-col items-center justify-center text-center pb-4 border-b border-gray-100">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle size={32} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Turno Finalizado!</h2>
                  <p className="text-gray-500 text-sm mt-1">Dados de operação sincronizados.</p>
                </div>
                
                {/* Resumo da Quilometragem */}
                <div className="bg-blue-50/50 rounded-xl p-4 text-left border border-blue-100/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity size={18} className="text-blue-600" />
                    <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wide">Quilometragem</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Km Saída:</span>
                      <span className="text-sm font-medium text-gray-800">{kmSaida} km</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Km Retorno:</span>
                      <span className="text-sm font-medium text-gray-800">{kmRetorno} km</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-blue-100 mt-2">
                      <span className="text-base font-bold text-gray-800">Total Rodado:</span>
                      <span className="text-base font-bold text-blue-600">{totalRodado} km</span>
                    </div>
                  </div>
                </div>

                {/* Resumo de Abastecimentos */}
                <div className="bg-red-50/50 rounded-xl p-4 text-left border border-red-100/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Fuel size={18} className="text-red-600" />
                    <h3 className="text-sm font-semibold text-red-900 uppercase tracking-wide">Consumo & Abastecimento</h3>
                  </div>
                  
                  {abastecimentosRegistrados.length > 0 ? (
                    <div className="space-y-3 mb-4">
                      {abastecimentosRegistrados.map((abast, idx) => (
                        <div key={abast.id} className="flex justify-between items-center text-sm bg-white p-3 rounded-lg border border-red-100 shadow-sm">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-800">Posto #{idx + 1}</span>
                            <span className="text-xs text-gray-500">Hodômetro: {abast.km} km</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="font-semibold text-gray-800">{abast.litros} L</span>
                            <span className="text-xs text-red-600 font-medium">R$ {abast.valor.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mb-4 italic text-center py-3 bg-white rounded-lg border border-red-100 border-dashed">
                      Nenhum abastecimento neste turno.
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Abastecido:</span>
                      <span className="text-sm font-bold text-gray-800">{totalLitros.toFixed(1)} L</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Custo Total:</span>
                      <span className="text-sm font-bold text-red-600">R$ {totalValor.toFixed(2)}</span>
                    </div>
                    {totalLitros > 0 && totalRodado > 0 && (
                      <div className="flex justify-between items-center pt-3 border-t border-red-100 mt-2">
                        <span className="text-base text-gray-800 font-bold">Média:</span>
                        <span className="text-base font-bold text-green-600">{consumoMedio} km/L</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <button onClick={() => { 
                  setStatusViagem("pendente"); 
                  setKmAtual(kmRetorno); 
                  setAbastecimentosRegistrados([]); 
                }} className="w-full py-4 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-200 transition-colors">
                  Iniciar Novo Turno
                </button>
              </div>
            ) : (
              <form onSubmit={statusViagem === "pendente" ? handleIniciarViagem : handleFinalizarViagem} className="space-y-6 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                
                {/* Header Card Status */}
                <div className={`p-4 rounded-xl mb-2 flex items-center gap-3 ${statusViagem === "pendente" ? "bg-blue-50 text-blue-800 border border-blue-100" : "bg-orange-50 text-orange-800 border border-orange-100"}`}>
                  <MapPin size={24} className={statusViagem === "pendente" ? "text-blue-500" : "text-orange-500"} />
                  <div>
                    <h3 className="font-semibold text-sm">{statusViagem === "pendente" ? "Saída de Veículo" : "Retorno de Veículo"}</h3>
                    <p className="text-xs opacity-80 mt-0.5">{statusViagem === "pendente" ? "Informe o KM antes de iniciar sua rota." : "Sua viagem está em curso. Informe o KM de retorno."}</p>
                  </div>
                </div>

                {/* Veículo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Veículo
                  </label>
                  <select
                    value={veiculo}
                    disabled={statusViagem !== "pendente"}
                    onChange={(e) => setVeiculo(e.target.value)}
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors disabled:opacity-70 font-medium text-gray-800"
                  >
                    <option value="FTR4E07 - VW Delivery 11.180">FTR4E07 - VW Delivery 11.180</option>
                    <option value="BBX2F95 - Volvo FH 540">BBX2F95 - Volvo FH 540</option>
                  </select>
                </div>

                {/* Km Atual */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Odômetro Atual (km)
                  </label>
                  <input
                    type="number"
                    value={kmAtual}
                    onChange={(e) => setKmAtual(e.target.value)}
                    className="w-full p-4 text-center text-3xl font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                  {statusViagem === "em_curso" && (
                    <p className="text-sm text-center text-gray-500 mt-3 bg-gray-50 py-2 rounded-lg border border-gray-100">
                      Km de Saída: <span className="font-bold text-gray-700">{kmSaida} km</span>
                    </p>
                  )}
                </div>

                {/* Observações */}
                {statusViagem === "em_curso" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ocorrências na viagem (Opcional)
                    </label>
                    <textarea
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Barulho no freio, pneu furado, etc."
                      rows={3}
                      className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
                    />
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    className={`w-full py-4 text-white rounded-xl font-bold text-base transition-all shadow-lg ${
                      statusViagem === "pendente" 
                        ? "bg-blue-600 hover:bg-blue-500 shadow-blue-500/25" 
                        : "bg-orange-500 hover:bg-orange-400 shadow-orange-500/25"
                    }`}
                  >
                    {statusViagem === "pendente" ? "Iniciar Viagem" : "Registrar Retorno"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Botão de Abastecimento sempre visível fora do form */}
          {!showAbastecimento && (
            <div className="mt-6 shrink-0">
              <button
                type="button"
                onClick={() => setShowAbastecimento(true)}
                className="w-full py-4 flex justify-center items-center gap-2 text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 rounded-xl font-bold text-sm transition-colors shadow-sm"
              >
                <Fuel size={20} />
                Registrar Abastecimento
              </button>
            </div>
          )}

          {/* Form Modal de Abastecimento */}
          {showAbastecimento && (
            <div className="absolute inset-0 bg-black/60 z-50 flex flex-col justify-end backdrop-blur-sm">
              <div className="bg-white rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10">
                <div className="flex justify-between items-center mb-5">
                  <div className="flex items-center gap-3 text-red-600">
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                      <Fuel size={24} />
                    </div>
                    <h3 className="font-bold text-xl text-gray-800">Novo Abastecimento</h3>
                  </div>
                  <button onClick={() => setShowAbastecimento(false)} className="p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200">
                    <X size={20} />
                  </button>
                </div>
                
                <p className="text-sm text-gray-500 mb-6">
                  Preencha os dados do cupom fiscal para alimentar o sistema de controle de consumo da frota.
                </p>

                <form onSubmit={handleAbastecer} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Odômetro no Posto (km)
                    </label>
                    <input
                      type="number"
                      value={kmAtual}
                      onChange={(e) => setKmAtual(e.target.value)}
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-lg font-semibold text-center text-gray-800"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total de Litros
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 120.5"
                        value={litros}
                        onChange={(e) => setLitros(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-lg font-semibold text-center text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valor Total (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 750.00"
                        value={valorAbastecimento}
                        onChange={(e) => setValorAbastecimento(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-lg font-semibold text-center text-gray-800"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 mt-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-red-600/25 transition-all"
                  >
                    Salvar Abastecimento
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>

        {/* Bottom Tab Bar */}
        <nav className="bg-white border-t border-gray-100 flex justify-around items-center py-2 px-4 pb-safe shrink-0">
          <button className="flex flex-col items-center p-2 text-gray-400 hover:text-[#0b1329] transition-colors">
            <Home size={22} />
            <span className="text-[10px] mt-1 font-medium">Início</span>
          </button>
          <button className="flex flex-col items-center p-2 text-[#0b1329]">
            <Clock size={22} />
            <span className="text-[10px] mt-1 font-medium">Diário</span>
          </button>
          <button className="flex flex-col items-center p-2 text-gray-400 hover:text-[#0b1329] transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <span className="text-[10px] mt-1 font-medium">Histórico</span>
          </button>
          <button className="flex flex-col items-center p-2 text-gray-400 hover:text-[#0b1329] transition-colors">
            <UserIcon size={22} />
            <span className="text-[10px] mt-1 font-medium">Perfil</span>
          </button>
        </nav>
      </div>
    </div>
  );
}