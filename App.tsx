
import React, { useState, useEffect } from 'react';
import { Analysis, StepId, Action, Ishikawa, IshikawaCategory, WhysMatrix, WhysRow, WhyCell, isNewWhysMatrix, createEmptyRow, createInitialWhysMatrix, ROW_IDS } from './types';
import { STEPS, TIPS } from './constants';
import IshikawaComponent from './components/IshikawaComponent';
import Dashboard from './components/Dashboard';
import KanbanView from './components/KanbanView';
import Login from './components/Login';
import { supabase } from './lib/supabase';
import * as db from './services/supabaseService';
import { generatePhenomenon } from './services/geminiService';
import { notifyNewAnalysis } from './services/notificationService';
import { 
  LogOut,
  ThumbsDown, 
  ThumbsUp, 
  Loader2, 
  FileDown, 
  Check, 
  AlertTriangle, 
  X, 
  Zap, 
  ArrowLeft, 
  ArrowRight,
  Eraser,
  Calendar,
  Filter,
  HelpCircle,
  MapPin,
  Clock,
  Users,
  LineChart,
  Eye,
  Plus,
  ClipboardList,
  Trash2,
  FileText,
  Printer,
  Factory,
  Info,
  Target,
  ShieldCheck,
  Download,
  CheckCircle2,
  Upload
} from 'lucide-react';

const INITIAL_ISHIKAWA: Ishikawa = {
  machine: { causes: [], attachments: [] },
  method: { causes: [], attachments: [] },
  material: { causes: [], attachments: [] },
  manpower: { causes: [], attachments: [] },
  measurement: { causes: [], attachments: [] },
  environment: { causes: [], attachments: [] },
};

const getInitialState = (): Analysis => ({
  id: 'AN-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
  area: '',
  equipment: '',
  team: [],
  failureDate: new Date().toISOString().split('T')[0],
  description: '',
  theme: '',
  failureLocation: '',
  what: '',
  where: '',
  when: '',
  who: '',
  howMuch: '',
  how: '',
  phenomenon: '',
  symptom: '',
  history: '',
  attachmentUrl: '',
  frequency: 'Eventual',
  whys: createInitialWhysMatrix(),
  rootCause: '',
  ishikawa: INITIAL_ISHIKAWA,
  actions: [],
  reoccurred: null,
  effectivenessEvidence: '',
  needsRevision: false,
  needsTraining: false,
  verificationChecklist: [
    { id: '1', text: 'Monitoramento por 30 dias sem falhas', checked: false },
    { id: '2', text: 'Treinamento realizado com todos os envolvidos', checked: false },
    { id: '3', text: 'Documentação e POPs atualizados no sistema', checked: false }
  ],
  verificationAttachments: [],
});

const getSavedStep = (): StepId => {
  if (typeof window === 'undefined') return StepId.IDENTIFICATION;
  const saved = localStorage.getItem('swm_current_step');
  return saved ? parseInt(saved, 10) : StepId.IDENTIFICATION;
};

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [analysis, setAnalysis] = useState<Analysis>(getInitialState);
  const [currentStep, setCurrentStep] = useState<StepId>(getSavedStep);
  const [isGeneratingPhenomenon, setIsGeneratingPhenomenon] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{step: string, errors: string[]}[]>([]);
  const [newTeamMemberName, setNewTeamMemberName] = useState('');
  const [newTeamMemberRole, setNewTeamMemberRole] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      db.getProfile(session.user.id).then(setProfile).catch(console.error);
    } else {
      setProfile(null);
    }
  }, [session]);

  useEffect(() => {
    if (profile) {
      const getShortAuthorName = (name: string) => {
        const n = name.toUpperCase();
        if (n === 'ADMINISTRADOR') return 'ADMIN';
        if (n === 'MANUTENÇÃO') return 'MANUT';
        return n;
      };

      setAnalysis(prev => ({ 
        ...prev, 
        authorName: getShortAuthorName(profile.full_name || profile.username || 'Usuário'),
        ...(profile.role !== 'ADMIN' && profile.full_name ? { area: profile.full_name } : {})
      }));
    }
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('swm_current_step', currentStep.toString());
  }, [currentStep]);

  useEffect(() => {
    localStorage.setItem('swm_current_step', currentStep.toString());
  }, [currentStep]);

  const updateAnalysis = (data: Partial<Analysis>) => {
    setAnalysis(prev => ({ ...prev, ...data }));
  };

  const validateAllSteps = (): { step: string, errors: string[] }[] => {
    const allErrors: { step: string, errors: string[] }[] = [];

    const step1Errors: string[] = [];
    if (!analysis.area.trim()) step1Errors.push("Área");
    if (!analysis.equipment.trim()) step1Errors.push("Nome do Equipamento");
    if (analysis.team.length === 0) step1Errors.push("Equipe (mínimo 1 integrante)");
    if (!analysis.description.trim()) step1Errors.push("Descrição do problema");
    if (!analysis.theme.trim()) step1Errors.push("Tema");
    if (step1Errors.length > 0) allErrors.push({ step: "1. Identificação Geral", errors: step1Errors });

    const step2Errors: string[] = [];
    if (!analysis.what.trim()) step2Errors.push("O QUE aconteceu");
    if (!analysis.where.trim()) step2Errors.push("ONDE ocorreu");
    if (!analysis.when.trim()) step2Errors.push("QUANDO ocorreu");
    if (!analysis.how.trim()) step2Errors.push("COMO foi percebido");
    if (step2Errors.length > 0) allErrors.push({ step: "2. Entendendo o Problema (5W1H)", errors: step2Errors });

    const step3Errors: string[] = [];
    if (!analysis.symptom.trim()) step3Errors.push("Sintoma observado");
    if (step3Errors.length > 0) allErrors.push({ step: "3. Detalhamento", errors: step3Errors });

    const step4Errors: string[] = [];
    if (isNewWhysMatrix(analysis.whys)) {
      const firstRow = analysis.whys.rows[0];
      if (!firstRow?.rounds[0]?.answer?.trim()) step4Errors.push("1º Round da linha A");
    } else if (Array.isArray(analysis.whys)) {
      if (!analysis.whys[0]?.trim()) step4Errors.push("1º Porquê fundamental (Legado)");
    }
    if (step4Errors.length > 0) allErrors.push({ step: "4. Tabela Porque Porque", errors: step4Errors });

    const step6Errors: string[] = [];
    if (analysis.actions.length === 0) {
      step6Errors.push("Nenhuma ação cadastrada");
    } else {
      if (analysis.actions.some(a => !a.what.trim())) step6Errors.push("Ações sem o preenchimento de O Quê");
      if (analysis.actions.some(a => !a.who.trim())) step6Errors.push("Ações sem responsável (Quem)");
    }
    if (step6Errors.length > 0) allErrors.push({ step: "6. Plano de Ação", errors: step6Errors });

    const step7Errors: string[] = [];
    // Removida obrigatoriedade de reincidência conforme solicitação
    if (step7Errors.length > 0) allErrors.push({ step: "7. Verificação e Padronização", errors: step7Errors });

    return allErrors;
  };

  const handleNext = () => {
    if (currentStep < StepId.VERIFICATION) {
      setCurrentStep(prev => prev + 1);
      document.getElementById('step-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > StepId.IDENTIFICATION) {
      setCurrentStep(prev => prev - 1);
      document.getElementById('step-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const startNewAnalysis = () => {
    const hasSignificantData = analysis.equipment.trim() !== '' || 
                               analysis.description.trim() !== '' || 
                               analysis.area.trim() !== '';
                               
    if (hasSignificantData && currentStep < StepId.DASHBOARD) {
      if (!confirm("Deseja iniciar uma NOVA análise? Os dados atuais não salvos serão perdidos.")) return;
    }
    
    const getShortAuthorName = (name: string) => {
      const n = name.toUpperCase();
      if (n === 'ADMINISTRADOR') return 'ADMIN';
      if (n === 'MANUTENÇÃO') return 'MANUT';
      return n;
    };

    const preservedArea = (profile?.role !== 'ADMIN' && profile?.full_name) ? profile.full_name : '';
    setAnalysis({ 
      ...getInitialState(), 
      area: preservedArea,
      authorName: profile ? getShortAuthorName(profile.full_name || profile.username || 'Usuário') : 'Usuário'
    });
    setCurrentStep(StepId.IDENTIFICATION);
  };

  const fillDemoData = () => {
    const getShortAuthorName = (name: string) => {
      const n = name.toUpperCase();
      if (n === 'ADMINISTRADOR') return 'ADMIN';
      if (n === 'MANUTENÇÃO') return 'MANUT';
      return n;
    };

    const demoData: Analysis = {
      id: 'AN-DEMO-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
      authorName: profile ? getShortAuthorName(profile.full_name || profile.username || 'Usuário') : 'Usuário',
      area: 'Utilidades - Caldeiras',
      equipment: 'Bomba de Alimentação B-102',
      team: [{ name: 'Eng. Roberto Silva', role: 'Engenheiro de Manutenção' }],
      failureDate: (() => {
        const d = new Date();
        d.setDate(d.getDate() - 80);
        return d.toISOString().split('T')[0];
      })(),
      description: 'A bomba parou repentinamente durante a operação normal. Foi observado fumaça saindo do motor elétrico e o disjuntor de proteção desarmou por sobrecorrente.',
      theme: 'Falha do sistema de bombeamento de água para a caldeira',
      failureLocation: 'Casa de Máquinas - Setor de Utilidades',
      what: 'Queima do enrolamento do motor elétrico da bomba de alimentação de água da caldeira.',
      where: 'Casa de Máquinas - Setor de Utilidades.',
      when: '08/04/2026 às 14:30 durante o pico de demanda.',
      who: 'Operador de utilidades e equipe de manutenção elétrica.',
      howMuch: 'Parada total da caldeira por 2 horas, impactando 100% da produção de vapor.',
      how: 'Alarme de baixa pressão de água e desarme do disjuntor no CCM.',
      phenomenon: 'Sobreaquecimento e desarme por sobrecorrente.',
      symptom: 'Cheiro de queimado, fumaça e alta temperatura na carcaça do motor.',
      history: 'Motor rebobinado há 6 meses. Rolamentos trocados na última preventiva.',
      attachmentUrl: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=500&q=80',
      frequency: 'Eventual',
      whys: {
        rows: [
          {
            id: 'A',
            rounds: [
              { question: 'Por que ocorre alto índice de falhas no motor?', answer: 'Motor queimou por sobreaquecimento', validated: 'V' },
              { question: 'Por que o motor sobreaqueceu?', answer: 'Aumento súbito de corrente elétrica', validated: 'V' },
              { question: 'Por que a corrente aumentou?', answer: 'Cavitação severa na bomba', validated: 'V' },
              { question: 'Por que ocorreu cavitação?', answer: 'Nível do tanque abaixou além do limite', validated: 'V' },
              { question: 'Por que o nível baixou?', answer: 'Boia de controle travou por incrustações', validated: 'V' }
            ],
            improvement: 'Implementar limpeza quinzenal dos sensores de boia'
          },
          {
            id: 'B',
            rounds: [
              { question: 'Por que há vibração na carcaça?', answer: 'Vibração excessiva na carcaça', validated: 'V' },
              { question: 'Por que ocorre vibração excessiva?', answer: 'Rolamento com desgaste prematuro', validated: 'V' },
              { question: 'Por que o rolamento desgastou?', answer: 'Lubrificação insuficiente', validated: 'F' },
              { question: '', answer: '', validated: null },
              { question: '', answer: '', validated: null }
            ],
            improvement: ''
          },
          {
            id: 'C',
            rounds: [
              { question: 'Por que temperatura está elevada?', answer: 'Temperatura elevada na carcaça', validated: 'V' },
              { question: 'Por que a temperatura subiu?', answer: 'Refrigeração inadequada', validated: 'F' },
              { question: '', answer: '', validated: null },
              { question: '', answer: '', validated: null },
              { question: '', answer: '', validated: null }
            ],
            improvement: ''
          },
          {
            id: 'D',
            rounds: [
              { question: '', answer: '', validated: null },
              { question: '', answer: '', validated: null },
              { question: '', answer: '', validated: null },
              { question: '', answer: '', validated: null },
              { question: '', answer: '', validated: null }
            ],
            improvement: ''
          },
          {
            id: 'E',
            rounds: [
              { question: '', answer: '', validated: null },
              { question: '', answer: '', validated: null },
              { question: '', answer: '', validated: null },
              { question: '', answer: '', validated: null },
              { question: '', answer: '', validated: null }
            ],
            improvement: ''
          }
        ]
      },
      rootCause: 'Falha no sistema de controle de nível por falta de limpeza preventiva nos sensores de boia.',
      ishikawa: {
        machine: { causes: ['Desgaste prematuro dos rolamentos', 'Falta de refrigeração adequada'], attachments: [] },
        method: { causes: ['Procedimento de limpeza de sensores inexistente'], attachments: [] },
        material: { causes: ['Qualidade da água com alta dureza'], attachments: [] },
        manpower: { causes: ['Equipe não treinada para identificar cavitação'], attachments: [] },
        measurement: { causes: ['Sensor de nível sem calibração'], attachments: [] },
        environment: { causes: ['Alta temperatura ambiente na casa de máquinas'], attachments: [] },
      },
      actions: [
        {
          id: Math.random().toString(36).substr(2, 9),
          what: 'Revisar plano de manutenção preventiva para incluir limpeza quinzenal dos sensores de nível.',
          type: 'Definitiva',
          who: 'Planejamento de Manutenção',
          when: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          where: 'Sistema Sap',
          how: 'Revisando planos de trabalho',
          howMuch: '0',
          status: 'Aberta'
        },
        {
          id: Math.random().toString(36).substr(2, 9),
          what: 'Treinar operadores para identificação precoce de ruídos de cavitação.',
          type: 'Contenção',
          who: 'Coordenação de Operação',
          when: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          where: 'Sala de Treinamentos',
          how: 'Apresentação e prova oral',
          howMuch: '0',
          howMuch: '0',
          status: 'Aberta'
        },
        {
          id: Math.random().toString(36).substr(2, 9),
          what: 'Substituição preventiva do contator principal.',
          type: 'Definitiva',
          who: 'Eletricista Lider',
          when: (() => { const d = new Date(); d.setDate(d.getDate() - 70); return d.toISOString().split('T')[0]; })(),
          where: 'Painel Elétrico',
          how: 'Desmontagem e montagem',
          howMuch: 'R$ 500',
          status: 'Fechada',
          evidence: 'Substituição realizada com sucesso, equipamento em teste.',
          evidenceImage: 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=500&q=80'
        }
      ],
      reoccurred: null,
      effectivenessEvidence: '',
      needsRevision: false,
      needsTraining: false,
      verificationChecklist: [
        { id: '1', text: 'Monitoramento por 30 dias sem falhas', checked: false },
        { id: '2', text: 'Treinamento realizado com todos os envolvidos', checked: false },
        { id: '3', text: 'Documentação e POPs atualizados no sistema', checked: false }
      ],
      verificationAttachments: []
    };
    setAnalysis(demoData);
  };

  const finalizeAnalysis = async () => {
    const allStepErrors = validateAllSteps();
    if (allStepErrors.length > 0) {
      setValidationErrors(allStepErrors);
      setShowValidationModal(true);
      return;
    }

    if (!session?.user) return;
    
    try {
      const seqNum = await db.fetchNextSequentialNumber();
      const analysisWithSeq = { ...analysis, sequentialNumber: seqNum };
      await db.saveAnalysis(session.user.id, analysisWithSeq);
      
      if (profile?.role === 'ADMIN') {
        await notifyNewAnalysis(analysisWithSeq, analysis.authorName || 'Usuário');
      }
      
      setCurrentStep(StepId.DASHBOARD);
    } catch (error) {
      console.error('Error saving analysis:', error);
      alert('Erro ao salvar no banco de dados corporativo.');
    }
  };

  const saveDraft = async () => {
    if (!session?.user) return;
    try {
      await db.saveAnalysis(session.user.id, analysis);
      alert("Rascunho salvo com sucesso no Supabase!");
    } catch (error) {
      console.error('Error saving draft:', error);
      alert("Erro ao salvar rascunho.");
    }
  };

  const loadFromHistory = (loadedAnalysis: Analysis) => {
    setAnalysis(loadedAnalysis);
    setCurrentStep(StepId.IDENTIFICATION);
  };

  const deleteFromHistory = async (id: string) => {
    try {
      await db.deleteAnalysis(id);
    } catch (error) {
      console.error('Error deleting:', error);
      alert("Erro ao excluir do banco de dados.");
      throw error;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const addAction = () => {
    const newAction: Action = { id: Date.now().toString(), what: '', who: '', when: '', where: '', how: '', howMuch: '', type: 'Contenção', status: 'Aberta' };
    updateAnalysis({ actions: [newAction, ...analysis.actions] });
  };

  const updateAction = (id: string, data: Partial<Action>) => {
    const updated = analysis.actions.map(a => a.id === id ? { ...a, ...data } : a);
    updateAnalysis({ actions: updated });
  };

  const removeAction = (id: string) => {
    updateAnalysis({ actions: analysis.actions.filter(a => a.id !== id) });
  };



  const handleViewReport = () => {
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) return;

    // Build the printable HTML
    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>SWM_AF_${analysis.sequentialNumber || analysis.id}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; line-height: 1.4; margin: 0; padding: 0; background: white; font-size: 10pt; }
          .container { max-width: 210mm; margin: 0 auto; }
          header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #171C8F; padding-bottom: 10px; margin-bottom: 20px; }
          .logo-area { display: flex; items-center: center; gap: 15px; }
          .logo-area img { height: 45px; width: auto; }
          .protocol-box { text-align: right; }
          .protocol-box p { margin: 0; font-weight: 900; color: #171C8F; }
          .section { margin-bottom: 20px; page-break-inside: avoid; }
          .section-title { font-size: 12pt; font-weight: 900; color: #171C8F; border-left: 5px solid #171C8F; padding-left: 10px; text-transform: uppercase; margin-bottom: 10px; background: #f8fafc; padding-top: 5px; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; table-layout: fixed; }
          th, td { border: 1px solid #e2e8f0; padding: 6px; text-align: left; vertical-align: top; word-wrap: break-word; }
          th { background: #171C8F; color: white; font-size: 8pt; text-transform: uppercase; }
          .label { font-size: 7pt; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 2px; }
          .value { font-size: 9pt; font-weight: 700; color: #0f172a; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .bg-slate { background: #f8fafc; }
          .bg-blue { background: #eff6ff; }
          .whys-row td { font-size: 8pt; }
          .whys-question { font-size: 7pt; font-style: italic; color: #64748b; margin-bottom: 3px; }
          .status-concluido { color: #16a34a; font-weight: 900; }
          .status-andamento { color: #d97706; font-weight: 900; }
          .status-atrasado { color: #dc2626; font-weight: 900; }
          .evidence-img { max-width: 100%; max-height: 250px; object-fit: contain; border-radius: 8px; border: 1px solid #e2e8f0; display: block; }
          .attachment-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
          .attachment-card { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #f8fafc; page-break-inside: avoid; }
          .attachment-card img { width: 100%; height: auto; max-height: 300px; object-fit: contain; display: block; padding: 5px; }
          .attachment-card .att-label { font-size: 7pt; font-weight: 700; color: #64748b; text-align: center; padding: 4px; background: #f1f5f9; border-top: 1px solid #e2e8f0; text-transform: uppercase; }
          .checklist-item { display: flex; align-items: center; gap: 6px; font-size: 9pt; margin-bottom: 4px; }
          .checklist-icon { width: 14px; height: 14px; border-radius: 3px; display: inline-flex; align-items: center; justify-content: center; font-size: 8pt; font-weight: 900; color: white; flex-shrink: 0; }
          .checklist-icon.checked { background: #171C8F; }
          .checklist-icon.unchecked { background: #cbd5e1; }
          footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          .signature { border-top: 2px solid #171C8F; width: 200px; text-align: center; padding-top: 5px; }
          @media print {
            .no-print { display: none; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #171C8F; color: white; padding: 15px; text-align: center; font-weight: bold; font-size: 14px; position: sticky; top: 0; z-index: 1000;">
          MODO DE VISUALIZAÇÃO - Pressione Ctrl+P (ou Cmd+P) para salvar como PDF ou Imprimir
          <button onclick="window.print()" style="margin-left: 20px; padding: 8px 20px; background: white; color: #171C8F; border: none; border-radius: 6px; font-weight: 900; cursor: pointer;">IMPRIMIR AGORA</button>
        </div>
        
        <div class="container">
          <header>
            <div class="logo-area">
              <img src="${window.location.origin}/swm-logo.png" alt="SWM">
              <div>
                <p style="margin:0; font-size: 14pt; font-weight: 900; color: #171C8F;">ANÁLISE DE FALHA - AF</p>
                <p style="margin:0; font-size: 8pt; font-weight: 900; color: #13aff0;">SWM BRASIL - LIDERANÇA OPEX</p>
              </div>
            </div>
            <div class="protocol-box">
              <p style="font-size: 7pt; opacity: 0.6;">PROTOCOLO</p>
              <p style="font-size: 12pt;">${analysis.id}</p>
              <p style="font-size: 8pt; margin-top: 5px;">Nº SEQ: ${analysis.sequentialNumber || '-'}</p>
            </div>
          </header>

          <div class="section">
            <div class="section-title">1. Identificação Geral</div>
            <table>
              <tr>
                <td colspan="2" class="bg-slate"><div class="label">Equipamento</div><div class="value">${analysis.equipment || '—'}</div></td>
                <td class="bg-slate"><div class="label">Área</div><div class="value">${analysis.area || '—'}</div></td>
                <td class="bg-slate"><div class="label">Data</div><div class="value">${analysis.failureDate ? new Date(analysis.failureDate).toLocaleDateString('pt-BR') : '—'}</div></td>
              </tr>
              <tr>
                <td colspan="2"><div class="label">Local da Falha</div><div class="value">${analysis.failureLocation || '—'}</div></td>
                <td colspan="2"><div class="label">Tema da Análise</div><div class="value">${analysis.theme || '—'}</div></td>
              </tr>
              <tr>
                <td colspan="4">
                  <div class="label">Equipe</div>
                  <div class="value">${(analysis.team || []).map(m => `${m.name} (${m.role})`).join(', ') || '—'}</div>
                </td>
              </tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">2. Entendendo o Problema (5W1H)</div>
            <table>
              <tr>
                <td class="bg-slate"><div class="label">O QUE aconteceu?</div><div class="value">${analysis.what || '—'}</div></td>
                <td class="bg-slate"><div class="label">ONDE ocorreu?</div><div class="value">${analysis.where || '—'}</div></td>
              </tr>
              <tr>
                <td class="bg-slate"><div class="label">QUANDO ocorreu?</div><div class="value">${analysis.when || '—'}</div></td>
                <td class="bg-slate"><div class="label">QUEM identificou?</div><div class="value">${analysis.who || '—'}</div></td>
              </tr>
              <tr>
                <td class="bg-slate"><div class="label">QUANTO impacto?</div><div class="value">${analysis.howMuch || '—'}</div></td>
                <td class="bg-slate"><div class="label">COMO percebido?</div><div class="value">${analysis.how || '—'}</div></td>
              </tr>
              <tr>
                <td colspan="2" class="bg-blue"><div class="label">FENÔMENO</div><div class="value">${analysis.phenomenon || '—'}</div></td>
              </tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">3. Detalhes Técnicos</div>
            <div class="grid-2">
              <div style="border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px;">
                <div class="label">Sintoma</div><div class="value">${analysis.symptom || '—'}</div>
                <div class="label" style="margin-top:10px">Frequência</div><div class="value">${analysis.frequency || '—'}</div>
                <div class="label" style="margin-top:10px">Histórico</div><div class="value">${analysis.history || '—'}</div>
              </div>
              <div style="text-align: center; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                ${analysis.attachmentUrl ? `<img src="${analysis.attachmentUrl}" class="evidence-img">` : '<p style="color:#cbd5e1; font-style:italic">Sem evidência fotográfica</p>'}
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">4. Tabela de Análise Porque Porque</div>
            ${isNewWhysMatrix(analysis.whys) ? `
              <table>
                <thead>
                  <tr>
                    <th style="width: 25px">#</th>
                    <th>1º Round</th>
                    <th>2º Round</th>
                    <th>3º Round</th>
                    <th>4º Round</th>
                    <th>5º Round</th>
                    <th style="width: 100px">Melhoria</th>
                  </tr>
                </thead>
                <tbody>
                  ${(analysis.whys as WhysMatrix).rows.filter(r => r.rounds.some(c => c.answer.trim())).map(row => `
                    <tr class="whys-row">
                      <td style="text-align:center; font-weight:900; background:#f8fafc;">${row.id}</td>
                      ${row.rounds.map(cell => `
                        <td style="background: ${cell.validated === 'V' ? '#f0fdf4' : cell.validated === 'F' ? '#fef2f2' : 'transparent'}">
                          ${cell.question ? `<div class="whys-question">${cell.question}</div>` : ''}
                          <div style="font-weight: 700;">${cell.answer || '-'}</div>
                          ${cell.validated ? `<div style="text-align:right; font-weight:900; color: ${cell.validated === 'V' ? '#16a34a' : '#dc2626'}">${cell.validated}</div>` : ''}
                        </td>
                      `).join('')}
                      <td style="font-style: italic; background: #eff6ff;">${row.improvement || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p>Matriz não disponível</p>'}
            <div style="background: #171C8F; color: white; padding: 15px; border-radius: 8px; margin-top: 10px;">
              <div class="label" style="color: rgba(255,255,255,0.7)">Conclusão: Causa Raiz</div>
              <div style="font-size: 12pt; font-weight: 900;">${analysis.rootCause || 'NÃO IDENTIFICADA'}</div>
            </div>
          </div>

          <div style="page-break-before: always;"></div>

          <div class="section">
            <div class="section-title">5. Plano de Ação (5W2H)</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 60px">Tipo</th>
                  <th>O que fazer?</th>
                  <th style="width: 80px">Quem?</th>
                  <th style="width: 70px">Prazo</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${analysis.actions.map(a => `
                  <tr>
                    <td style="font-weight: 900; font-size: 7pt;">${a.type}</td>
                    <td style="font-weight: 700;">${a.what || '—'}</td>
                    <td>${a.who || '—'}</td>
                    <td>${a.when ? new Date(a.when).toLocaleDateString('pt-BR') : '—'}</td>
                    <td class="${a.status === 'Concluída' ? 'status-concluido' : a.status === 'Em andamento' ? 'status-andamento' : 'status-atrasado'}">${a.status}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">6. Verificação e Eficácia</div>
            <div class="grid-2">
              <div class="bg-slate" style="padding:10px; border-radius:8px; text-align:center;">
                <div class="label">Reincidência?</div>
                <div class="value" style="font-size: 14pt; color: ${analysis.reoccurred ? '#dc2626' : '#16a34a'}">${analysis.reoccurred ? 'SIM' : 'NÃO'}</div>
              </div>
              <div class="bg-slate" style="padding:10px; border-radius:8px; text-align:center;">
                <div class="label">Treinamento Equipe?</div>
                <div class="value" style="font-size: 14pt;">${analysis.needsTraining ? 'SIM' : 'NÃO'}</div>
              </div>
            </div>
            <div class="grid-2" style="margin-top: 10px;">
              <div class="bg-slate" style="padding:10px; border-radius:8px; text-align:center;">
                <div class="label">Revisão de Procedimento (POP/Manual)?</div>
                <div class="value" style="font-size: 14pt; color: ${analysis.needsRevision ? '#171C8F' : '#64748b'}">${analysis.needsRevision ? 'SIM' : 'NÃO'}</div>
              </div>
            </div>

            ${(analysis.verificationChecklist || []).length > 0 ? `
              <div style="margin-top: 15px; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px;">
                <div class="label" style="margin-bottom: 8px;">Checklist de Efetividade</div>
                ${(analysis.verificationChecklist || []).map(item => `
                  <div class="checklist-item">
                    <span class="checklist-icon ${item.checked ? 'checked' : 'unchecked'}">${item.checked ? '✓' : ''}</span>
                    <span class="value">${item.text || '—'}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <div style="margin-top: 15px; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px;">
              <div class="label">Evidências da Eficácia (Descrição)</div>
              <div class="value" style="white-space: pre-wrap;">${analysis.effectivenessEvidence || 'Nenhuma evidência registrada.'}</div>
            </div>

            ${(analysis.verificationAttachments || []).length > 0 ? `
              <div style="margin-top: 15px;">
                <div class="label" style="margin-bottom: 8px;">Anexos de Verificação (${(analysis.verificationAttachments || []).length} imagens)</div>
                <div class="attachment-grid">
                  ${(analysis.verificationAttachments || []).map((att, idx) => `
                    <div class="attachment-card">
                      <img src="${att.url}" alt="Evidência ${idx + 1}">
                      <div class="att-label">${att.name || 'Evidência ' + (idx + 1)}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>

          ${(() => {
            const categories = [
              { key: 'machine', label: 'Máquina' },
              { key: 'method', label: 'Método' },
              { key: 'material', label: 'Material' },
              { key: 'manpower', label: 'Mão de Obra' },
              { key: 'measurement', label: 'Medição' },
              { key: 'environment', label: 'Meio Ambiente' }
            ];
            const allAttachments = categories.flatMap(cat => {
              const category = (analysis.ishikawa as any)?.[cat.key];
              if (!category?.attachments?.length) return [];
              return category.attachments.map((att: any, idx: number) => ({
                ...att,
                categoryLabel: cat.label,
                index: idx
              }));
            });
            if (allAttachments.length === 0) return '';
            return `
              <div style="page-break-before: always;"></div>
              <div class="section">
                <div class="section-title">7. Anexos do Diagrama de Ishikawa (6M)</div>
                <div class="attachment-grid">
                  ${allAttachments.map((att: any) => `
                    <div class="attachment-card">
                      <img src="${att.dataUrl}" alt="${att.categoryLabel} - ${att.name || 'Anexo'}">
                      <div class="att-label">${att.categoryLabel}: ${att.name || 'Anexo ' + (att.index + 1)}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          })()}

          ${(() => {
            const actionsWithEvidence = analysis.actions.filter(a => a.evidenceImage);
            if (actionsWithEvidence.length === 0) return '';
            return `
              <div class="section" style="page-break-inside: avoid;">
                <div class="section-title">8. Evidências das Ações (Kanban)</div>
                <div class="attachment-grid">
                  ${actionsWithEvidence.map(a => `
                    <div class="attachment-card">
                      <img src="${a.evidenceImage}" alt="Evidência - ${a.what}">
                      <div class="att-label">${a.type}: ${a.what || 'Ação sem título'}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          })()}

          <footer>
            <div style="font-size: 7pt; color: #94a3b8;">
              Gerado em ${new Date().toLocaleString('pt-BR')}<br>
              SWM Brasil - Sistema de Análise de Falha
            </div>
            <div class="signature">
              <div class="value" style="text-transform: uppercase;">${analysis.authorName || 'Responsável Técnico'}</div>
              <div class="label">Assinatura Digital</div>
            </div>
          </footer>
        </div>
      </body>
      </html>
    `;

    reportWindow.document.write(html);
    reportWindow.document.close();
  };

  const renderStepContent = () => {
    const inputClasses = "w-full border-[#dce4f5] bg-[#e5ebf7] text-[#171C8F] rounded-xl px-4 py-3.5 text-base md:text-sm focus:ring-2 focus:ring-[#13aff0] focus:border-transparent outline-none border transition-all shadow-sm placeholder:text-[#171C8F]/40 min-h-[48px] font-medium";
    
    switch (currentStep) {
      case StepId.IDENTIFICATION:
        return (
          <div className="space-y-4 animate-fadeIn">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3">
               <div>
                  <h2 className="text-lg font-bold text-[#171C8F]">1. Identificação Geral e Seleção do Tema</h2>
               </div>
               <div className="flex gap-2 w-full sm:w-auto">
                 <button onClick={fillDemoData} className="flex-1 sm:flex-initial bg-[#e5ebf7] hover:bg-blue-100 text-[#171C8F] text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border border-blue-100 transition-all shadow-sm flex items-center justify-center gap-2">
                    <Zap size={12} /> Preencher Demo
                 </button>
                 <button onClick={() => setAnalysis(getInitialState())} className="flex-1 sm:flex-initial bg-slate-50 hover:bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border border-slate-200 transition-all shadow-sm flex items-center justify-center gap-2">
                    <Eraser size={12} /> Limpar
                 </button>
               </div>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Área <span className="text-red-500" aria-hidden="true">*</span></label>
                <input type="text" value={analysis.area} onChange={e => updateAnalysis({ area: e.target.value })} className={inputClasses} placeholder="Ex: Produção" aria-required="true" />
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Equipamento <span className="text-red-500" aria-hidden="true">*</span></label>
                <input type="text" value={analysis.equipment} onChange={e => updateAnalysis({ equipment: e.target.value })} className={inputClasses} placeholder="Ex: Bomba de recalque" aria-required="true" />
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Local da Falha</label>
                <input type="text" value={analysis.failureLocation || ''} onChange={e => updateAnalysis({ failureLocation: e.target.value })} className={inputClasses} placeholder="Ex: Linha 1, Setor B" />
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Data da Falha <span className="text-red-500" aria-hidden="true">*</span></label>
                <div className="relative">
                  <input type="date" value={analysis.failureDate} onChange={e => updateAnalysis({ failureDate: e.target.value })} className={`${inputClasses} pl-10`} aria-required="true" />
                  <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#13aff0] pointer-events-none" />
                </div>
              </div>
              <div className="col-span-1 sm:col-span-2 lg:col-span-3 space-y-2 mt-2">
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Equipe <span className="text-red-500" aria-hidden="true">*</span></label>
                <div className="flex flex-wrap gap-2 mb-2 empty:hidden">
                  {analysis.team.map((member, idx) => (
                    <div key={idx} className="bg-[#171C8F] text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                      {member.name} {member.role ? `(${member.role})` : ''}
                      <button onClick={() => updateAnalysis({ team: analysis.team.filter((_, i) => i !== idx) })} className="hover:text-red-300 transition-colors"><X size={12}/></button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input type="text" value={newTeamMemberName} onChange={e => setNewTeamMemberName(e.target.value)} className={inputClasses + " flex-1"} placeholder="Nome do integrante" />
                  <input type="text" value={newTeamMemberRole} onChange={e => setNewTeamMemberRole(e.target.value)} className={inputClasses + " flex-1"} placeholder="Função" />
                  <button onClick={() => {
                    if(newTeamMemberName.trim()){
                      updateAnalysis({ team: [...analysis.team, { name: newTeamMemberName, role: newTeamMemberRole }] });
                      setNewTeamMemberName('');
                      setNewTeamMemberRole('');
                    }
                  }} className="bg-[#e5ebf7] hover:bg-blue-100 text-[#171C8F] px-4 py-2 sm:py-0 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center min-h-[48px]"><Plus size={16}/> Adicionar</button>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Descrição do Problema <span className="text-red-500" aria-hidden="true">*</span></label>
              <textarea value={analysis.description} onChange={e => updateAnalysis({ description: e.target.value })} className={`${inputClasses} h-20 md:h-24 resize-none`} placeholder="Relate o ocorrido tecnicamente..." aria-required="true" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Tema <span className="text-red-500" aria-hidden="true">*</span></label>
              <input type="text" value={analysis.theme} onChange={e => updateAnalysis({ theme: e.target.value })} className={inputClasses} placeholder="Frase breve que resume o assunto da análise" aria-required="true" />
            </div>
          </div>
        );

      case StepId.W5H1:
        return (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-lg font-bold border-b pb-3 text-[#171C8F]">2. Entendendo o Problema (5W1H)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { field: 'what', label: 'O QUE aconteceu?', required: true, icon: <HelpCircle size={12} className="text-[#13aff0]/50" /> },
                { field: 'where', label: 'ONDE ocorreu?', required: true, icon: <MapPin size={12} className="text-[#13aff0]/50" /> },
                { field: 'when', label: 'QUANDO ocorreu?', required: true, icon: <Clock size={12} className="text-[#13aff0]/50" /> },
                { field: 'who', label: 'QUEM estava envolvido?', required: false, icon: <Users size={12} className="text-[#13aff0]/50" /> },
                { field: 'howMuch', label: 'QUANTO impacto?', required: false, icon: <LineChart size={12} className="text-[#13aff0]/50" /> },
                { field: 'how', label: 'COMO percebido?', required: true, icon: <Eye size={12} className="text-[#13aff0]/50" /> },
                { field: 'phenomenon', label: 'FENÔMENO (O que se observou)?', required: false, icon: <AlertTriangle size={12} className="text-[#13aff0]/50" /> },
              ].map(item => (
                <div key={item.field} className="space-y-1 relative group">
                  <label className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    {item.icon}
                    {item.label} {item.required && <span className="text-red-500">*</span>}
                    {item.field === 'phenomenon' && (
                      <button 
                        onClick={async () => {
                          const filledFields = [analysis.what, analysis.where, analysis.when, analysis.who, analysis.how, analysis.howMuch].filter(f => f?.trim()).length;
                          if (filledFields < 3) {
                            alert("Por favor, preencha pelo menos 3 campos do 5W1H para gerar um fenômeno coeso.");
                            return;
                          }
                          setIsGeneratingPhenomenon(true);
                          const result = await generatePhenomenon(analysis);
                          if (result) updateAnalysis({ phenomenon: result });
                          setIsGeneratingPhenomenon(false);
                        }}
                        disabled={isGeneratingPhenomenon}
                        className="ml-auto bg-[#171C8F] text-white px-2 py-1 rounded text-[8px] font-black uppercase tracking-tighter flex items-center gap-1 hover:bg-black transition-all disabled:opacity-30"
                      >
                        {isGeneratingPhenomenon ? <Loader2 size={8} className="animate-spin" /> : <Zap size={8} />}
                        Gerar com IA
                      </button>
                    )}
                    <span className="hidden group-focus-within:inline-flex text-[7px] text-[#13aff0] font-black uppercase ml-auto">Modo Leitura Expandida</span>
                  </label>
                  <textarea 
                    value={(analysis as any)[item.field]} 
                    onChange={e => updateAnalysis({ [item.field]: e.target.value })} 
                    className={`${inputClasses} h-16 md:h-20 focus:h-40 resize-none transition-all duration-300 shadow-sm focus:shadow-xl focus:border-[#13aff0] focus:ring-4 focus:ring-[#13aff0]/10 ${
                      item.field === 'phenomenon' ? 'bg-white border-blue-200 text-[#171C8F] font-bold' : 'bg-white'
                    }`} 
                    placeholder={item.field === 'phenomenon' ? "Descreva o fenômeno ou use o botão 'Gerar com IA'..." : ""}
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case StepId.DETAILS:
        return (
          <div className="space-y-4 animate-fadeIn flex flex-col relative pb-8">
            <h2 className="text-lg font-bold border-b pb-3 text-[#171C8F]">3. Verificação da Situação Atual</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Sintoma Observado <span className="text-red-500">*</span></label>
                <input type="text" value={analysis.symptom} onChange={e => updateAnalysis({ symptom: e.target.value })} className={inputClasses + " h-9"} placeholder="Ex: Vibração acima de 5mm/s" />
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Histórico Recente</label>
                <input type="text" value={analysis.history} onChange={e => updateAnalysis({ history: e.target.value })} className={inputClasses + " h-9"} placeholder="Intervenções anteriores?" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Frequência</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { f: 'Eventual', tooltip: 'Ocorre raramente ou pela primeira vez' },
                    { f: 'Recorrente', tooltip: 'Acontece com certa periodicidade conhecida' },
                    { f: 'Crônica', tooltip: 'Acontece repetidamente sem solução definitiva' }
                  ].map(({f, tooltip}) => (
                    <button key={f} title={tooltip} onClick={() => updateAnalysis({ frequency: f as any })} className={`py-1.5 rounded-lg border-2 transition-all font-bold text-[10px] uppercase ${analysis.frequency === f ? 'bg-[#171C8F] border-[#171C8F] text-white shadow-sm' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1 flex flex-col justify-start">
                <div className="mt-1 flex items-center gap-2">
                  <label className="bg-[#171C8F] hover:bg-black transition-all text-white text-[10px] font-bold uppercase py-2 px-4 rounded-xl cursor-pointer shadow-sm flex items-center gap-2 h-9 w-full justify-center">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            updateAnalysis({ attachmentUrl: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }} 
                    />
                    <Plus size={14} /> Anexar Imagem
                  </label>
                </div>
                {analysis.attachmentUrl && (
                  <div className="mt-2 text-xs text-slate-500 flex items-center gap-2 font-medium">
                    <CheckCircle2 size={14} className="text-green-500" /> Imagem anexada com sucesso
                    <button onClick={() => updateAnalysis({ attachmentUrl: '' })} className="ml-2 text-red-500 hover:text-red-700 underline text-[10px]">Remover</button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-auto pt-6 border-t border-slate-100">
               <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-start gap-3">
                 <Info size={16} className="text-[#13aff0] shrink-0 mt-0.5" />
                 <div className="text-[10px] text-slate-600 font-medium">
                   <p><strong className="text-[#171C8F]">Eventual:</strong> Ocorre raramente ou pela primeira vez.</p>
                   <p><strong className="text-[#171C8F]">Recorrente:</strong> Acontece com certa periodicidade conhecida.</p>
                   <p><strong className="text-[#171C8F]">Crônica:</strong> Acontece repetidamente sem solução definitiva.</p>
                 </div>
               </div>
            </div>
          </div>
        );

      case StepId.FIVE_WHYS: {
        // Ensure whys is the new matrix format
        const whysMatrix: WhysMatrix = isNewWhysMatrix(analysis.whys) 
          ? analysis.whys 
          : createInitialWhysMatrix();

        const updateWhysCell = (rowId: string, roundIdx: number, field: 'question' | 'answer' | 'validated', value: any) => {
          const newRows = whysMatrix.rows.map(row => {
            if (row.id !== rowId) return row;
            const newRounds = row.rounds.map((cell, idx) => {
              if (idx !== roundIdx) return cell;
              return { ...cell, [field]: value };
            });
            return { ...row, rounds: newRounds };
          });
          updateAnalysis({ whys: { rows: newRows } });
        };

        const updateWhysImprovement = (rowId: string, value: string) => {
          const newRows = whysMatrix.rows.map(row => 
            row.id === rowId ? { ...row, improvement: value } : row
          );
          updateAnalysis({ whys: { rows: newRows } });
        };

        const addWhysRow = () => {
          const usedIds = whysMatrix.rows.map(r => r.id);
          const nextId = ROW_IDS.find(id => !usedIds.includes(id));
          if (!nextId) return;
          updateAnalysis({ whys: { rows: [...whysMatrix.rows, createEmptyRow(nextId)] } });
        };

        const removeWhysRow = (rowId: string) => {
          if (whysMatrix.rows.length <= 1) return;
          updateAnalysis({ whys: { rows: whysMatrix.rows.filter(r => r.id !== rowId) } });
        };

        const toggleValidation = (rowId: string, roundIdx: number) => {
          const row = whysMatrix.rows.find(r => r.id === rowId);
          if (!row) return;
          const cell = row.rounds[roundIdx];
          const next = cell.validated === null ? 'V' : cell.validated === 'V' ? 'F' : null;
          updateWhysCell(rowId, roundIdx, 'validated', next);
        };

        return (
          <div className="space-y-4 animate-fadeIn">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3">
              <div>
                <h2 className="text-lg font-bold text-[#171C8F]">5. Tabela de Análise Porque Porque</h2>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Análise de causa raiz por hipóteses</p>
              </div>
              <button 
                onClick={addWhysRow}
                disabled={whysMatrix.rows.length >= ROW_IDS.length}
                className="bg-[#171C8F] text-white text-[9px] font-black uppercase tracking-widest px-5 py-2 rounded-lg hover:bg-black transition-all shadow-sm flex items-center gap-2 disabled:opacity-30"
              >
                <Plus size={12} /> Nova Linha
              </button>
            </header>

            <div className="bg-[#171C8F] p-4 rounded-xl shadow-lg border-l-8 border-[#13aff0] mb-4">
              <label className="block text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-1">Fenômeno Investigado</label>
              <p className="text-white text-sm font-bold leading-relaxed">{analysis.phenomenon || "Não definido na Aba 2"}</p>
            </div>

            <div className="bg-[#e5ebf7] p-3 rounded-xl border border-blue-100 flex items-start gap-3">
              <Info size={16} className="text-[#171C8F] mt-0.5 shrink-0" />
              <div className="text-[10px] text-[#171C8F] font-medium leading-relaxed">
                <p className="mb-1"><strong>(V)</strong> Verdadeiro — a hipótese foi confirmada e a análise terá prosseguimento.</p>
                <p><strong>(F)</strong> Falso — a hipótese não se confirmou. Clique no badge V/F para alternar.</p>
              </div>
            </div>
            
            <div className="overflow-x-auto pb-4">
              <div className="min-w-[900px] border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                {/* Header */}
                <div className="grid grid-cols-[40px_1fr_1fr_1fr_1fr_1fr_minmax(120px,1fr)_36px] bg-[#171C8F] text-white text-[9px] font-black uppercase tracking-widest text-center divide-x divide-white/20">
                  <div className="p-2.5 flex items-center justify-center"></div>
                  <div className="p-2.5 flex items-center justify-center">1º Round</div>
                  <div className="p-2.5 flex items-center justify-center">2º Round</div>
                  <div className="p-2.5 flex items-center justify-center">3º Round</div>
                  <div className="p-2.5 flex items-center justify-center">4º Round</div>
                  <div className="p-2.5 flex items-center justify-center">5º Round</div>
                  <div className="p-2.5 flex items-center justify-center text-[8px]">Ideias de Melhorias</div>
                  <div className="p-2.5"></div>
                </div>
                
                {/* Rows */}
                <div className="divide-y divide-slate-100">
                  {whysMatrix.rows.map((row) => (
                    <div key={row.id} className="grid grid-cols-[40px_1fr_1fr_1fr_1fr_1fr_minmax(120px,1fr)_36px] divide-x divide-slate-100 hover:bg-slate-50/50 transition-colors group">
                      {/* Row Label */}
                      <div className="p-2 flex items-center justify-center bg-slate-50">
                        <span className="w-6 h-6 rounded-lg bg-[#171C8F] text-white font-black text-[10px] flex items-center justify-center shadow-sm">
                          {row.id}
                        </span>
                      </div>
                      
                      {/* 5 Rounds */}
                      {row.rounds.map((cell, roundIdx) => (
                        <div
                          key={roundIdx}
                          className={`flex flex-col divide-y divide-slate-100 ${
                            cell.validated === 'V' ? 'bg-green-50/40' : cell.validated === 'F' ? 'bg-red-50/40' : ''
                          }`}
                        >
                          {/* Linha 1: Pergunta */}
                          <div className="px-1.5 py-1">
                            <textarea
                              rows={2}
                              value={cell.question}
                              onChange={(e) => updateWhysCell(row.id, roundIdx, 'question', e.target.value)}
                              className="w-full bg-transparent text-[9px] text-slate-500 outline-none resize-none focus:bg-blue-50/60 rounded transition-colors placeholder-slate-300 font-medium italic leading-snug"
                              placeholder="Por que ocorre...?"
                            />
                          </div>
                          {/* Linha 2: Resposta + Badge V/F */}
                          <div className="px-1.5 py-1 flex items-start gap-1">
                            <textarea
                              rows={2}
                              value={cell.answer}
                              onChange={(e) => updateWhysCell(row.id, roundIdx, 'answer', e.target.value)}
                              className="flex-1 bg-transparent text-[10px] text-slate-800 outline-none resize-none focus:bg-[#e5ebf7] rounded transition-colors placeholder-slate-300 font-semibold leading-snug"
                              placeholder="Resposta..."
                            />
                            {cell.answer.trim() && (
                              <button
                                onClick={() => toggleValidation(row.id, roundIdx)}
                                className={`shrink-0 mt-0.5 text-[8px] font-black w-6 h-6 rounded border transition-all flex items-center justify-center ${
                                  cell.validated === 'V'
                                    ? 'bg-green-100 border-green-400 text-green-700 hover:bg-green-200'
                                    : cell.validated === 'F'
                                      ? 'bg-red-100 border-red-400 text-red-700 hover:bg-red-200'
                                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                                }`}
                              >
                                {cell.validated === 'V' ? 'V' : cell.validated === 'F' ? 'F' : '?'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {/* Improvement Ideas */}
                      <div className="p-1">
                        <input
                          type="text"
                          value={row.improvement}
                          onChange={(e) => updateWhysImprovement(row.id, e.target.value)}
                          className="w-full min-h-[32px] bg-transparent text-[10px] text-slate-600 outline-none px-1.5 py-1 focus:bg-blue-50 rounded transition-colors placeholder-slate-300 font-medium italic"
                          placeholder="Melhoria..."
                        />
                      </div>
                      
                      {/* Remove */}
                      <div className="p-1 flex items-center justify-center">
                        <button 
                          onClick={() => removeWhysRow(row.id)} 
                          disabled={whysMatrix.rows.length <= 1}
                          className="text-slate-300 hover:text-red-500 transition-colors disabled:opacity-20"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        );
      }

      case StepId.ISHIKAWA:
        return <IshikawaComponent analysis={analysis} updateAnalysis={updateAnalysis} />;

      case StepId.ACTIONS:
        return (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-[#171C8F]">6. Plano de Ação</h2>
              <button 
                onClick={addAction}
                className="bg-[#171C8F] text-white text-[9px] font-black uppercase tracking-widest px-6 py-2 rounded-xl hover:bg-black transition-all shadow-md flex items-center gap-2"
              >
                <Plus size={14} /> Nova Ação
              </button>
            </div>

            <div className="border border-slate-100 rounded-xl overflow-x-auto shadow-sm">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-[#e5ebf7] text-[#171C8F] text-[9px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-2 py-2 border-b border-blue-100">Tipo</th>
                    <th className="px-2 py-2 border-b border-blue-100">O Quê</th>
                    <th className="px-2 py-2 border-b border-blue-100">Quem</th>
                    <th className="px-2 py-2 border-b border-blue-100">Quando</th>
                    <th className="px-2 py-2 border-b border-blue-100">Onde</th>
                    <th className="px-2 py-2 border-b border-blue-100">Como</th>
                    <th className="px-2 py-2 border-b border-blue-100">Quanto</th>
                    <th className="px-2 py-2 border-b border-blue-100">Status</th>
                    <th className="px-2 py-2 border-b border-blue-100 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {analysis.actions.map((action) => (
                    <tr key={action.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-2 py-1.5">
                        <select 
                          value={action.type} 
                          onChange={e => updateAction(action.id, { type: e.target.value as any })}
                          className="bg-transparent border-none text-[9px] font-bold focus:ring-0 p-0 text-[#171C8F] uppercase"
                        >
                          <option>Contenção</option>
                          <option>Definitiva</option>
                        </select>
                      </td>
                      <td className="px-2 py-1.5 cursor-text focus-within:bg-white"><input type="text" value={action.what} onChange={e => updateAction(action.id, { what: e.target.value })} className="w-full min-w-[120px] bg-transparent border-none text-[10px] p-0 focus:ring-0 placeholder:text-slate-300 font-medium" placeholder="O que fazer?"/></td>
                      <td className="px-2 py-1.5 cursor-text focus-within:bg-white"><input type="text" value={action.who} onChange={e => updateAction(action.id, { who: e.target.value })} className="w-full bg-transparent border-none text-[9px] p-0 focus:ring-0 placeholder:text-slate-300 font-bold text-slate-500 uppercase" placeholder="Quem?"/></td>
                      <td className="px-2 py-1.5"><input type="date" value={action.when} onChange={e => updateAction(action.id, { when: e.target.value })} className="bg-transparent border-none text-[9px] p-0 focus:ring-0 text-slate-400 font-bold w-[90px]"/></td>
                      <td className="px-2 py-1.5 cursor-text focus-within:bg-white"><input type="text" value={action.where} onChange={e => updateAction(action.id, { where: e.target.value })} className="w-full bg-transparent border-none text-[10px] p-0 focus:ring-0 placeholder:text-slate-300 font-medium" placeholder="Onde?"/></td>
                      <td className="px-2 py-1.5 cursor-text focus-within:bg-white"><input type="text" value={action.how} onChange={e => updateAction(action.id, { how: e.target.value })} className="w-full bg-transparent border-none text-[10px] p-0 focus:ring-0 placeholder:text-slate-300 font-medium" placeholder="Como?"/></td>
                      <td className="px-2 py-1.5 cursor-text focus-within:bg-white">
                        <input 
                          type="text" 
                          value={action.howMuch} 
                          onChange={e => updateAction(action.id, { howMuch: formatCurrency(e.target.value) })} 
                          className="w-full bg-transparent border-none text-[10px] p-0 focus:ring-0 placeholder:text-slate-300 font-medium w-24" 
                          placeholder="R$ 0,00"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <select 
                          value={action.status} 
                          onChange={e => updateAction(action.id, { status: e.target.value as any })}
                          className={`bg-transparent border-none text-[9px] font-bold focus:ring-0 p-0 uppercase ${action.status === 'Aberta' ? 'text-red-500' : action.status === 'Em andamento' ? 'text-amber-500' : 'text-green-500'}`}
                        >
                          <option className="text-red-500 bg-white font-bold uppercase" value="Aberta">Aberta</option>
                          <option className="text-amber-500 bg-white font-bold uppercase" value="Em andamento">Em andamento</option>
                          <option className="text-green-500 bg-white font-bold uppercase" value="Concluída">Concluída</option>
                        </select>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button onClick={() => removeAction(action.id)} className="text-slate-300 hover:text-red-500 transition-colors flex items-center justify-center">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case StepId.VERIFICATION:
        return (
          <div className="space-y-4 animate-fadeIn flex flex-col relative">
            <h2 className="text-lg font-bold border-b pb-3 text-[#171C8F]">7. Verificação dos Resultados</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-[#e5ebf7] p-4 rounded-xl border border-blue-100 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                   <h3 className="font-black text-[#171C8F] uppercase text-[10px] tracking-widest">Reincidência? <span className="text-red-500" aria-hidden="true">*</span></h3>
                   <div className="flex gap-2">
                    <button onClick={() => updateAnalysis({ reoccurred: true })} className={`px-4 py-1.5 border rounded-lg font-black text-[10px] transition-all flex items-center gap-2 ${analysis.reoccurred === true ? 'bg-red-600 border-red-600 text-white shadow-sm' : 'bg-white text-slate-300 border-slate-50'}`}>
                      <ThumbsDown size={14} /> SIM
                    </button>
                    <button onClick={() => updateAnalysis({ reoccurred: false })} className={`px-4 py-1.5 border rounded-lg font-black text-[10px] transition-all flex items-center gap-2 ${analysis.reoccurred === false ? 'bg-green-600 border-green-600 text-white shadow-sm' : 'bg-white text-slate-300 border-slate-50'}`}>
                      <ThumbsUp size={14} /> NÃO
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3 pt-2 border-t border-blue-200">
                  <h3 className="font-black text-[#171C8F] uppercase text-[10px] tracking-widest">Checklist de Efetividade</h3>
                  <div className="space-y-2">
                    {(analysis.verificationChecklist || []).map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <button onClick={() => {
                          const newList = [...(analysis.verificationChecklist || [])];
                          newList[idx].checked = !newList[idx].checked;
                          updateAnalysis({ verificationChecklist: newList });
                        }} className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-all ${item.checked ? 'bg-[#171C8F] border-[#171C8F] text-white' : 'bg-white border-blue-300'}`}>
                          {item.checked && <Check size={12} />}
                        </button>
                        <input type="text" value={item.text} onChange={e => {
                          const newList = [...(analysis.verificationChecklist || [])];
                          newList[idx].text = e.target.value;
                          updateAnalysis({ verificationChecklist: newList });
                        }} className="flex-1 bg-transparent border-b border-transparent focus:border-blue-300 outline-none text-[11px] font-bold text-[#171C8F]" />
                        <button onClick={() => {
                          const newList = (analysis.verificationChecklist || []).filter((_, i) => i !== idx);
                          updateAnalysis({ verificationChecklist: newList });
                        }} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
                      </div>
                    ))}
                    <button onClick={() => {
                      const newList = [...(analysis.verificationChecklist || []), { id: Date.now().toString(), text: '', checked: false }];
                      updateAnalysis({ verificationChecklist: newList });
                    }} className="flex items-center gap-2 text-[#13aff0] hover:text-[#171C8F] text-[10px] font-black uppercase transition-colors pt-1">
                      <Plus size={12} /> Adicionar Item
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-blue-200">
                  <h3 className="font-black text-[#171C8F] uppercase text-[10px] tracking-widest">Evidências e Anexos</h3>
                  <textarea value={analysis.effectivenessEvidence} onChange={e => updateAnalysis({ effectivenessEvidence: e.target.value })} className={inputClasses + " h-16 resize-none bg-white"} placeholder="Descreva os indicadores ou resultados alcançados..." />
                  
                  <div className="flex flex-col gap-2 mt-2">
                    <label className="inline-flex w-fit items-center gap-2 cursor-pointer bg-[#13aff0] hover:bg-[#171C8F] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors shadow-sm">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const newAttachments = [...(analysis.verificationAttachments || []), { id: Date.now().toString(), url: reader.result as string }];
                              updateAnalysis({ verificationAttachments: newAttachments });
                            };
                            reader.readAsDataURL(file);
                          }
                        }} 
                      />
                      <Upload size={14} /> Anexar Gráfico ou Imagem
                    </label>

                    {(analysis.verificationAttachments || []).length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {(analysis.verificationAttachments || []).map((att) => (
                          <div key={att.id} className="relative group border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm h-24">
                            <img src={att.url} alt="Evidência" className="w-full h-full object-cover" />
                            <button onClick={() => {
                              updateAnalysis({ verificationAttachments: (analysis.verificationAttachments || []).filter(a => a.id !== att.id) });
                            }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-2 rounded-lg flex items-start gap-2 mt-2 shadow-sm">
                  <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[9px] text-amber-700 font-bold uppercase">As evidências definitivas devem ser informadas no prazo máximo de 3 meses para encerramento adequado da análise.</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
                <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-widest leading-tight">Ações contra recorrência do problema</h3>
                <div className="space-y-2 pb-2">
                  <button onClick={() => updateAnalysis({ needsRevision: !analysis.needsRevision })} className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all ${analysis.needsRevision ? 'bg-[#e5ebf7] border-blue-200' : 'bg-white border-slate-50 hover:bg-slate-50'}`}>
                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${analysis.needsRevision ? 'bg-[#171C8F] border-[#171C8F] text-white' : 'border-slate-200'}`}>
                      {analysis.needsRevision && <Check size={8} />}
                    </div>
                    <span className="text-[11px] font-bold text-slate-700">Revisar procedimento técnico (POP / Manual)</span>
                  </button>
                  <button onClick={() => updateAnalysis({ needsTraining: !analysis.needsTraining })} className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all ${analysis.needsTraining ? 'bg-[#e5ebf7] border-blue-200' : 'bg-white border-slate-50 hover:bg-slate-50'}`}>
                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${analysis.needsTraining ? 'bg-[#171C8F] border-[#171C8F] text-white' : 'border-slate-200'}`}>
                      {analysis.needsTraining && <Check size={8} />}
                    </div>
                    <span className="text-[11px] font-bold text-slate-700">Necessita treinamento para equipe / OPL</span>
                  </button>
                </div>
                <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-widest border-t pt-3">Ações Compartilhadas</h3>
                <div>
                  <button onClick={handleViewReport} className="w-full bg-[#171C8F] text-white font-black py-3 rounded-lg flex items-center justify-center gap-2 text-[10px] uppercase tracking-tighter hover:bg-blue-700 transition-all shadow-sm">
                    <FileText size={14} /> Visualizar Relatório (PDF)
                  </button>
                </div>
              </div>
            </div>

          </div>
        );
      
      case StepId.DASHBOARD: return <Dashboard onLoad={loadFromHistory} onDelete={deleteFromHistory} user={session?.user} profile={profile} onDeleteSuccess={() => setCurrentStep(StepId.DASHBOARD)} />;
      case StepId.KANBAN: return <KanbanView user={session?.user} profile={profile} />;
      default: return null;
    }
  };

  if (!session) {
    return <Login onSuccess={() => {}} />;
  }

  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC] overflow-hidden">
      {showValidationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn" role="alert" aria-modal="true">
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-slideUp">
            <div className="bg-red-600 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <AlertTriangle size={24} />
                <h3 className="font-black uppercase tracking-widest text-sm">Pendências de Preenchimento</h3>
              </div>
              <button onClick={() => setShowValidationModal(false)} className="w-10 h-10 flex items-center justify-center text-white hover:opacity-60" aria-label="Fechar"><X size={24} /></button>
            </div>
            <div className="p-8">
              <p className="text-slate-600 text-sm font-medium mb-6 leading-relaxed">Não é possível finalizar sem completar os seguintes campos:</p>
              <div className="space-y-6 mb-8 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {validationErrors.map((group, i) => (
                  <div key={i} className="space-y-3 border-l-4 border-slate-100 pl-4 py-1">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{group.step}</h4>
                    <div className="flex flex-wrap gap-2">
                      {group.errors.map((err, j) => (
                        <span key={j} className="inline-flex items-center gap-2 text-red-600 text-[10px] font-bold bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                          {err}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowValidationModal(false)} className="w-full bg-slate-900 text-white py-4.5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl transition-all hover:bg-black active:scale-95">
                Entendi, vou revisar
              </button>
            </div>
          </div>
        </div>
      )}



      {/* WEB UI */}
      <div className="no-print h-full flex flex-col">
        <header className="bg-white text-[#171C8F] shadow-md h-20 md:h-24 flex-shrink-0 z-50 border-b-4 border-[#171C8F]">
          <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/swm-logo.png" alt="SWM Logo" className="h-10 md:h-12 w-auto" />
              <div className="w-px h-8 bg-slate-100"></div>
              <div className="h-10 md:h-12 bg-white rounded-xl p-1.5 shadow-sm border border-slate-100 flex items-center justify-center">
                <img 
                  src="/opex-logo-final.png" 
                  alt="OPEX" 
                  className="h-full w-auto object-contain" 
                  style={{ filter: 'invert(11%) sepia(85%) saturate(3755%) hue-rotate(234deg) brightness(88%) contrast(98%)' }}
                />
              </div>
              <div className="hidden lg:block h-10 w-px bg-slate-200 ml-2"></div>
              <div className="hidden sm:block">
                <h1 className="font-black text-lg tracking-tight uppercase leading-none text-[#171C8F]">Análise de Falha - AF</h1>
                <p className="text-[9px] text-[#13aff0] font-bold tracking-[0.25em] uppercase mt-1">SWM Brasil</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-6">
              <nav className="flex gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                <button onClick={startNewAnalysis} className={`px-4 md:px-6 py-3 rounded-xl transition-all font-black uppercase text-[10px] tracking-wider ${(currentStep !== StepId.DASHBOARD && currentStep !== StepId.KANBAN) ? 'bg-[#171C8F] text-white shadow-lg' : 'text-[#171C8F]/50 hover:text-[#171C8F] hover:bg-white'}`}>Novo</button>
                <button onClick={() => setCurrentStep(StepId.DASHBOARD)} className={`px-4 md:px-6 py-3 rounded-xl transition-all font-black uppercase text-[10px] tracking-wider ${currentStep === StepId.DASHBOARD ? 'bg-[#171C8F] text-white shadow-lg' : 'text-[#171C8F]/50 hover:text-[#171C8F] hover:bg-white'}`}>Dashboard</button>
                <button onClick={() => setCurrentStep(StepId.KANBAN)} className={`px-4 md:px-6 py-3 rounded-xl transition-all font-black uppercase text-[10px] tracking-wider ${currentStep === StepId.KANBAN ? 'bg-[#171C8F] text-white shadow-lg' : 'text-[#171C8F]/50 hover:text-[#171C8F] hover:bg-white'}`}>Kanban</button>
              </nav>
              <div className="hidden md:flex items-center gap-3 pl-6 border-l border-slate-100">
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{profile?.role === 'ADMIN' ? 'Administrador' : 'Responsável'}</p>
                  <p className="text-[11px] font-black text-[#171C8F]">{profile?.full_name || profile?.username || session?.user?.email?.split('@')[0]}</p>
                </div>
                <button onClick={handleLogout} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all border border-slate-100" title="Sair">
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {currentStep < StepId.DASHBOARD && (
          <nav className="bg-white border-b flex-shrink-0 z-40 overflow-x-auto no-scrollbar shadow-sm" aria-label="Passos da análise">
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-6 min-w-max">
              {STEPS.map((step, idx) => (
                <React.Fragment key={step.id}>
                  <button onClick={() => setCurrentStep(step.id)} className={`flex flex-col items-center gap-2 transition-all px-2 ${currentStep === step.id ? 'scale-110 opacity-100' : 'opacity-30 hover:opacity-60'}`} aria-current={currentStep === step.id ? 'step' : undefined}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs transition-all ${currentStep === step.id ? 'bg-[#171C8F] text-white shadow-xl shadow-blue-200' : 'bg-slate-100 text-slate-500'}`}>
                      {(currentStep > step.id && currentStep !== StepId.KANBAN) ? <Check size={16} /> : step.icon}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${currentStep === step.id ? 'text-[#171C8F]' : 'text-slate-400'}`}>{step.label}</span>
                  </button>
                  {idx < STEPS.length - 1 && <div className={`w-12 h-1 rounded-full ${(currentStep > idx && currentStep !== StepId.KANBAN) ? 'bg-[#171C8F]' : 'bg-slate-100'}`} aria-hidden="true"></div>}
                </React.Fragment>
              ))}
            </div>
          </nav>
        )}

        <main id="main-content" className="flex-1 flex flex-col overflow-hidden relative">
          <div id="step-scroll-container" className="flex-1 overflow-y-auto px-2 md:px-4 py-1 md:py-2 custom-scrollbar">
            <div className="max-w-[1600px] mx-auto flex flex-col">
              <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/50 border border-slate-100 p-3 md:p-5 mb-3 mt-1 md:mt-2">
                {renderStepContent()}
              </div>
            </div>
          </div>

          {currentStep < StepId.KANBAN && (
            <div className="bg-white/90 backdrop-blur-xl border-t border-slate-100 p-3 md:p-4 z-50">
              <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <button onClick={handleBack} disabled={currentStep === StepId.IDENTIFICATION} className="flex items-center justify-center gap-2 text-slate-400 font-black uppercase text-[10px] hover:text-[#171C8F] disabled:opacity-20 transition-all px-4 py-2 min-h-[44px]">
                  <ArrowLeft size={14} /> Voltar
                </button>
                <div className="flex gap-3 flex-1 sm:flex-initial">
                  <button onClick={saveDraft} className="hidden sm:flex items-center justify-center text-slate-600 bg-slate-100 hover:bg-slate-200 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest border border-slate-200 min-h-[44px]">Salvar Rascunho</button>
                  {currentStep < StepId.VERIFICATION ? (
                    <button onClick={handleNext} className="flex-1 sm:flex-initial bg-[#171C8F] hover:bg-blue-700 text-white px-10 py-3 rounded-xl font-black uppercase text-[10px] shadow-xl shadow-blue-200/50 transition-all flex items-center justify-center gap-3 min-h-[44px]">
                      Próximo <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button onClick={finalizeAnalysis} className="flex-1 sm:flex-initial bg-slate-900 hover:bg-black text-white px-10 py-3 rounded-xl font-black uppercase text-[10px] shadow-xl transition-all min-h-[44px]">Finalizar Relatório</button>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const formatCurrency = (value: string) => {
  const cleanValue = value.replace(/\D/g, '');
  if (!cleanValue) return '';
  const amount = (parseInt(cleanValue, 10) / 100).toFixed(2);
  const [integers, decimals] = amount.split('.');
  const formattedIntegers = integers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${formattedIntegers},${decimals}`;
};

export default App;
