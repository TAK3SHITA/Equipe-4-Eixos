import { createBrowserRouter } from "react-router";
import Login from "./components/Login";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { Veiculos } from "./components/Veiculos";
import { Manutencao } from "./components/Manutencao";
import { Pecas } from "./components/Pecas";
import { Documentacao } from "./components/Documentacao";
import { Relatorios } from "./components/Relatorios";
import { Usuarios } from "./components/Usuarios";
import { Configuracoes } from "./components/Configuracoes";
import { MotoristaApp } from "./components/MotoristaApp";
import { MobileShowcase } from "./components/MobileShowcase";
import { MonitoramentoDiario } from "./components/MonitoramentoDiario";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/motorista",
    Component: MotoristaApp,
  },
  {
    path: "/apresentacao",
    Component: MobileShowcase,
  },
  {
    path: "/app",
    Component: ProtectedRoute,
    children: [
      {
        Component: Layout,
        children: [
          { index: true, Component: Dashboard },
          { path: "veiculos", Component: Veiculos },
          { path: "manutencao", Component: Manutencao },
          { path: "pecas", Component: Pecas },
          { path: "documentacao", Component: Documentacao },
          { path: "relatorios", Component: Relatorios },
          { path: "usuarios", Component: Usuarios },
          { path: "configuracoes", Component: Configuracoes },
          { path: "monitoramento", Component: MonitoramentoDiario },
        ],
      },
    ],
  },
], { basename: import.meta.env.BASE_URL });
