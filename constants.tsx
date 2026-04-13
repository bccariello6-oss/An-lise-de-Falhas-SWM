
import React from 'react';
import { StepId } from './types';
import { 
  IdCard, 
  HelpCircle, 
  Search, 
  ListOrdered, 
  Fish, 
  CheckSquare, 
  CheckCircle2, 
  LayoutDashboard, 
  Columns 
} from 'lucide-react';

export const STEPS = [
  { id: StepId.IDENTIFICATION, label: 'Identificação', icon: <IdCard size={18} /> },
  { id: StepId.W5H1, label: '5W1H', icon: <HelpCircle size={18} /> },
  { id: StepId.DETAILS, label: 'Detalhamento', icon: <Search size={18} /> },
  { id: StepId.FIVE_WHYS, label: '5 Porquês', icon: <ListOrdered size={18} /> },
  { id: StepId.ISHIKAWA, label: 'Ishikawa', icon: <Fish size={18} /> },
  { id: StepId.ACTIONS, label: 'Plano de Ação', icon: <CheckSquare size={18} /> },
  { id: StepId.VERIFICATION, label: 'Verificação', icon: <CheckCircle2 size={18} /> },
  { id: StepId.DASHBOARD, label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: StepId.KANBAN, label: 'Kanban', icon: <Columns size={18} /> }
];

export const TIPS = {
  what: "O que aconteceu exatamente? Seja específico sobre a falha técnica.",
  where: "Onde no equipamento ocorreu a falha? (Ex: Rolamento do motor principal)",
  when: "Qual o momento exato? Início do turno, durante a rampa de carga?",
  howMuch: "Qual o impacto em horas paradas, custo de peças ou perda de produção?",
  how: "Como a falha foi detectada? Alarme, ruído, inspeção visual, parada súbita?",
  why: "Tente aprofundar a cada nível. Evite respostas como 'quebrou' sem explicar a causa física imediata."
};

export const ISHIKAWA_QUESTIONS = {
  machine: "O equipamento estava em dia com a manutenção? Houve desgaste natural?",
  method: "O procedimento de operação foi seguido? Existe um padrão escrito?",
  material: "A matéria-prima estava conforme? As peças de reposição eram originais?",
  manpower: "A equipe está treinada? Houve falta de atenção ou cansaço?",
  measurement: "Os sensores estão calibrados? A leitura dos instrumentos é confiável?",
  environment: "A temperatura, umidade ou iluminação afetaram o desempenho?"
};
