
import React, { useState, useEffect } from 'react';
import { Analysis, StepId, Action, Ishikawa, IshikawaCategory } from './types';
import { STEPS, TIPS } from './constants';
import IshikawaComponent from './components/IshikawaComponent';
import Dashboard from './components/Dashboard';
import KanbanView from './components/KanbanView';
import Login from './components/Login';
import { supabase } from './lib/supabase';
import * as db from './services/supabaseService';
import { generateSummary, suggestRootCause } from './services/geminiService';
import { 
  LogOut,
  ThumbsDown, 
  ThumbsUp, 
  Loader2, 
  Brain, 
  FileDown, 
  Check, 
  Quote, 
  Bot, 
  AlertTriangle, 
  X, 
  Cpu, 
  ArrowLeft, 
  ArrowRight,
  Eraser,
  Calendar,
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
  Share2,
  Factory,
  Info,
  Target,
  ShieldCheck,
  Download,
  CheckCircle2
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
  tag: '',
  failureDate: new Date().toISOString().split('T')[0],
  shift: '',
  responsible: '',
  description: '',
  what: '',
  where: '',
  when: '',
  who: '',
  howMuch: '',
  how: '',
  symptom: '',
  condition: '',
  history: '',
  frequency: 'Eventual',
  whys: ['', '', '', '', ''],
  rootCause: '',
  ishikawa: INITIAL_ISHIKAWA,
  actions: [],
  reoccurred: null,
  effectivenessEvidence: '',
  needsRevision: false,
  needsTraining: false,
});

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [analysis, setAnalysis] = useState<Analysis>(getInitialState);
  const [currentStep, setCurrentStep] = useState<StepId>(StepId.IDENTIFICATION);
  const [showSummary, setShowSummary] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{step: string, errors: string[]}[]>([]);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

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
    if (profile && profile.role !== 'ADMIN' && profile.full_name) {
      setAnalysis(prev => ({ ...prev, area: profile.full_name }));
    }
  }, [profile]);

  const updateAnalysis = (data: Partial<Analysis>) => {
    setAnalysis(prev => ({ ...prev, ...data }));
  };

  const validateAllSteps = (): { step: string, errors: string[] }[] => {
    const allErrors: { step: string, errors: string[] }[] = [];

    const step1Errors: string[] = [];
    if (!analysis.area.trim()) step1Errors.push("Área / Setor");
    if (!analysis.equipment.trim()) step1Errors.push("Nome do Equipamento");
    if (!analysis.tag.trim()) step1Errors.push("Tag do Ativo");
    if (!analysis.description.trim()) step1Errors.push("Descrição do problema");
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
    if (!analysis.whys[0].trim()) step4Errors.push("1º Porquê fundamental");
    if (!analysis.rootCause.trim()) step4Errors.push("Causa Raiz fundamental");
    if (step4Errors.length > 0) allErrors.push({ step: "4. Matriz dos 5 Porquês", errors: step4Errors });

    const step6Errors: string[] = [];
    if (analysis.actions.length === 0) {
      step6Errors.push("Nenhuma ação cadastrada");
    } else {
      if (analysis.actions.some(a => !a.description.trim())) step6Errors.push("Ações sem descrição");
      if (analysis.actions.some(a => !a.responsible.trim())) step6Errors.push("Ações sem responsável");
    }
    if (step6Errors.length > 0) allErrors.push({ step: "6. Plano de Ação", errors: step6Errors });

    const step7Errors: string[] = [];
    if (analysis.reoccurred === null) step7Errors.push("Informar se a falha voltou a ocorrer");
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
    
    const preservedArea = (profile?.role !== 'ADMIN' && profile?.full_name) ? profile.full_name : '';
    setAnalysis({ ...getInitialState(), area: preservedArea });
    setCurrentStep(StepId.IDENTIFICATION);
    setShowSummary(false);
  };

  const fillDemoData = () => {
    const demoData: Analysis = {
      id: 'AN-DEMO-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
      area: 'Utilidades - Caldeiras',
      equipment: 'Bomba de Alimentação B-102',
      tag: 'B-102A',
      failureDate: new Date().toISOString().split('T')[0],
      shift: 'Turno A',
      responsible: 'Eng. Roberto Silva',
      description: 'A bomba parou repentinamente durante a operação normal. Foi observado fumaça saindo do motor elétrico e o disjuntor de proteção desarmou por sobrecorrente.',
      what: 'Queima do enrolamento do motor elétrico da bomba de alimentação de água da caldeira.',
      where: 'Casa de Máquinas - Setor de Utilidades.',
      when: '08/04/2026 às 14:30 durante o pico de demanda.',
      who: 'Operador de utilidades e equipe de manutenção elétrica.',
      howMuch: 'Parada total da caldeira por 2 horas, impactando 100% da produção de vapor.',
      how: 'Alarme de baixa pressão de água e desarme do disjuntor no CCM.',
      symptom: 'Cheiro de queimado, fumaça e alta temperatura na carcaça do motor.',
      condition: 'Operação em regime de carga máxima devido à alta demanda de vapor.',
      history: 'Motor rebobinado há 6 meses. Rolamentos trocados na última preventiva.',
      frequency: 'Eventual',
      whys: [
        'O motor queimou por sobreaquecimento.',
        'Houve um aumento súbito na corrente elétrica.',
        'A bomba trabalhou em regime de cavitação severa.',
        'O nível do tanque de alimentação baixou além do limite crítico.',
        'A boia de controle de nível travou devido ao acúmulo de incrustações.'
      ],
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
          description: 'Revisar plano de manutenção preventiva para incluir limpeza quinzenal dos sensores de nível.',
          type: 'Preventiva',
          responsible: 'Planejamento de Manutenção',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'Aberta'
        },
        {
          id: Math.random().toString(36).substr(2, 9),
          description: 'Treinar operadores para identificação precoce de ruídos de cavitação.',
          type: 'Melhoria',
          responsible: 'Coordenação de Operação',
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'Aberta'
        }
      ],
      reoccurred: false,
      effectivenessEvidence: 'Monitoramento de 30 dias sem novas ocorrências de travamento de boia.',
      needsRevision: true,
      needsTraining: true,
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
      setIsGeneratingSummary(true);
      await db.saveAnalysis(session.user.id, analysis);
      setCurrentStep(StepId.DASHBOARD);
      setShowSummary(false);
    } catch (error) {
      console.error('Error saving analysis:', error);
      alert('Erro ao salvar no banco de dados corporativo.');
    } finally {
      setIsGeneratingSummary(false);
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
    setShowSummary(!!loadedAnalysis.summary);
  };

  const deleteFromHistory = async (id: string) => {
    if (!confirm("Excluir esta análise permanentemente?")) return;
    try {
      await db.deleteAnalysis(id);
      setCurrentStep(StepId.DASHBOARD);
    } catch (error) {
      console.error('Error deleting:', error);
      alert("Erro ao excluir do banco de dados.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const addAction = () => {
    const newAction: Action = { id: Date.now().toString(), description: '', type: 'Corretiva', responsible: '', dueDate: '', status: 'Aberta' };
    updateAnalysis({ actions: [newAction, ...analysis.actions] });
  };

  const updateAction = (id: string, data: Partial<Action>) => {
    const updated = analysis.actions.map(a => a.id === id ? { ...a, ...data } : a);
    updateAnalysis({ actions: updated });
  };

  const removeAction = (id: string) => {
    updateAnalysis({ actions: analysis.actions.filter(a => a.id !== id) });
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    const summary = await generateSummary(analysis);
    updateAnalysis({ summary });
    setIsGeneratingSummary(false);
    setShowSummary(true);
  };

  const handleSuggestCause = async () => {
    const cause = await suggestRootCause(analysis);
    updateAnalysis({ rootCause: cause });
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    if (!session?.user) return;
    const toEmail = session.user.email || 'bccariello_6@hotmail.com';
    
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; color: #333; line-height: 1.5; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 800px; margin: 0 auto; background: white; padding: 24px; border-radius: 8px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #171C8F; padding-bottom: 16px; margin-bottom: 20px; }
    .header-left h1 { color: #171C8F; margin: 0; font-size: 22px; }
    .header-left p { color: #13aff0; margin: 4px 0 0; font-size: 11px; font-weight: bold; letter-spacing: 1px; }
    .signature { color: #666 !important; font-size: 10px !important; font-weight: normal !important; letter-spacing: 0 !important; margin-top: 8px !important; }
    .protocol { text-align: right; }
    .protocol .label { font-size: 9px; color: #666; text-transform: uppercase; }
    .protocol .value { font-size: 18px; color: #171C8F; font-weight: bold; }
    .section { margin-bottom: 20px; }
    .section h2 { color: #171C8F; font-size: 14px; border-left: 3px solid #171C8F; padding-left: 8px; margin-bottom: 12px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .info-box { background: #f8f9fa; padding: 12px; border-radius: 6px; border: 1px solid #e0e0e0; }
    .info-box .label { font-size: 8px; color: #666; text-transform: uppercase; margin-bottom: 4px; }
    .info-box .value { font-size: 11px; font-weight: bold; }
    .description { background: #f8f9fa; padding: 12px; border-radius: 6px; border: 1px solid #e0e0e0; }
    .why-list { margin: 12px 0; }
    .why-item { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .why-number { background: #171C8F; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; }
    .root-cause { background: #171C8F; color: white; padding: 16px; border-radius: 8px; }
    .root-cause .label { font-size: 9px; opacity: 0.7; margin-bottom: 4px; }
    .root-cause .value { font-size: 14px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th { background: #171C8F; color: white; padding: 10px; text-align: left; font-size: 9px; }
    td { padding: 10px; border-bottom: 1px solid #e0e0e0; font-size: 10px; }
    .type-tag { font-size: 8px; padding: 2px 6px; border-radius: 4px; }
    .type-corretiva { background: #fee2e2; color: #991b1b; }
    .type-preventiva { background: #dbeafe; color: #1e40af; }
    .type-melhoria { background: #fef3c7; color: #92400e; }
    .status-tag { font-size: 8px; padding: 2px 6px; border-radius: 4px; }
    .status-concluida { background: #d1fae5; color: #065f46; }
    .status-andamento { background: #fef3c7; color: #92400e; }
    .status-aberta { background: #fee2e2; color: #991b1b; }
    .footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid #e0e0e0; font-size: 9px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-left">
        <h1>${greeting}! Segue Análise de Falha - ${analysis.area || 'Área'} para conhecimento e tratativa.</h1>
        <p>Obrigado!</p>
        <p class="signature">Liderança Opex SWM Brasil</p>
      </div>
      <div class="protocol">
        <div class="label">Protocolo</div>
        <div class="value">${analysis.id}</div>
      </div>
    </div>

    <div class="section">
      <h2>1. Identificação</h2>
      <div class="grid-2">
        <div class="info-box"><div class="label">Equipamento</div><div class="value">${analysis.equipment || '—'}</div></div>
        <div class="info-box"><div class="label">Tag / Ativo</div><div class="value">${analysis.tag || '—'}</div></div>
        <div class="info-box"><div class="label">Área</div><div class="value">${analysis.area || '—'}</div></div>
        <div class="info-box"><div class="label">Data Ocorrência</div><div class="value">${analysis.failureDate || '—'}</div></div>
        <div class="info-box"><div class="label">Turno</div><div class="value">${analysis.shift || '—'}</div></div>
        <div class="info-box"><div class="label">Responsável</div><div class="value">${analysis.responsible || '—'}</div></div>
      </div>
      <div class="description" style="margin-top: 12px;">
        <div class="info-box"><div class="label">Descrição da Falha</div><div class="value">${analysis.description || '—'}</div></div>
      </div>
    </div>

    <div class="section">
      <h2>2. 5W1H</h2>
      <div class="grid-2">
        <div class="info-box"><div class="label">O Que</div><div class="value">${analysis.what || '—'}</div></div>
        <div class="info-box"><div class="label">Onde</div><div class="value">${analysis.where || '—'}</div></div>
        <div class="info-box"><div class="label">Quando</div><div class="value">${analysis.when || '—'}</div></div>
        <div class="info-box"><div class="label">Quem</div><div class="value">${analysis.who || '—'}</div></div>
        <div class="info-box"><div class="label">Quanto Custo</div><div class="value">${analysis.howMuch || '—'}</div></div>
        <div class="info-box"><div class="label">Como</div><div class="value">${analysis.how || '—'}</div></div>
      </div>
    </div>

    <div class="section">
      <h2>3. Detalhes</h2>
      <div class="grid-3">
        <div class="info-box"><div class="label">Sintoma</div><div class="value">${analysis.symptom || '—'}</div></div>
        <div class="info-box"><div class="label">Frequência</div><div class="value">${analysis.frequency || '—'}</div></div>
        <div class="info-box"><div class="label">Condição</div><div class="value">${analysis.condition || '—'}</div></div>
      </div>
      <div class="info-box" style="margin-top: 12px;"><div class="label">Histórico</div><div class="value">${analysis.history || '—'}</div></div>
    </div>

    <div class="section">
      <h2>4. Causa Raiz (5 Porquês)</h2>
      <div class="why-list">
        ${analysis.whys.filter(w => w.trim()).map((w, i) => `<div class="why-item"><span class="why-number">${i + 1}</span><span>${w}</span></div>`).join('')}
      </div>
      <div class="root-cause">
        <div class="label">Causa Raiz</div>
        <div class="value">${analysis.rootCause || 'NÃO IDENTIFICADA'}</div>
      </div>
    </div>

    <div class="section">
      <h2>5. Ishikawa (6M)</h2>
      <div class="grid-2">
        ${Object.entries(analysis.ishikawa).map(([cat, data]) => `<div class="info-box"><div class="label">${cat === 'manpower' ? 'Mão de Obra' : cat === 'measurement' ? 'Medição' : cat === 'environment' ? 'Meio Ambiente' : cat.charAt(0).toUpperCase() + cat.slice(1)}</div><div class="value">${data.causes.filter(c => c.trim()).join(', ') || '—'}</div></div>`).join('')}
      </div>
    </div>

    <div class="section">
      <h2>6. Plano de Ação</h2>
      <table>
        <thead><tr><th>Tipo</th><th>Descrição</th><th>Responsável</th><th>Prazo</th><th>Status</th></tr></thead>
        <tbody>
          ${analysis.actions.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:#666;">Nenhuma ação registrada</td></tr>' : analysis.actions.map(a => `
            <tr>
              <td><span class="type-tag ${a.type === 'Corretiva' ? 'type-corretiva' : a.type === 'Preventiva' ? 'type-preventiva' : 'type-melhoria'}">${a.type}</span></td>
              <td>${a.description || '—'}</td>
              <td>${a.responsible || '—'}</td>
              <td>${a.dueDate ? new Date(a.dueDate).toLocaleDateString('pt-BR') : '—'}</td>
              <td><span class="status-tag ${a.status === 'Concluída' ? 'status-concluida' : a.status === 'Em andamento' ? 'status-andamento' : 'status-aberta'}">${a.status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>7. Verificação</h2>
      <div class="grid-2">
        <div class="info-box"><div class="label">Reincidência?</div><div class="value">${analysis.reoccurred === true ? 'SIM' : analysis.reoccurred === false ? 'NÃO' : '—'}</div></div>
        <div class="info-box"><div class="label">Precisa Revisão?</div><div class="value">${analysis.needsRevision ? 'SIM' : 'NÃO'}</div></div>
      </div>
      <div class="info-box" style="margin-top: 12px;"><div class="label">Evidências de Eficácia</div><div class="value">${analysis.effectivenessEvidence || '—'}</div></div>
    </div>

    <div class="footer">
      <p>Gerado em ${new Date().toLocaleString('pt-BR')} via SWM Análise de Falhas - LIDERANÇA OPEX</p>
    </div>
  </div>
</body>
</html>
`;
    try {
      console.log('Iniciando envio para:', toEmail);
      
      const functionUrl = `${supabase.supabaseUrl}/functions/v1/send-report-email`;
      console.log('Function URL:', functionUrl);
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabase.supabaseKey,
          'Authorization': `Bearer ${supabase.supabaseKey}`,
        },
        body: JSON.stringify({
          to: toEmail,
          subject: `[SWM] Análise de Falha - ${analysis.area || 'N/A'} (${analysis.id})`,
          html: htmlContent,
        }),
      });
      
      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response:', result);
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar email');
      }
      
      alert('Relatório enviado com sucesso para ' + toEmail);
    } catch (e) {
      console.error('Erro ao enviar e-mail:', e);
      console.error('Detalhes:', e.message, e.context);
      alert('Erro ao enviar e-mail: ' + (e.message || e));
    }
  };

  const renderStepContent = () => {
    const inputClasses = "w-full border-[#dce4f5] bg-[#e5ebf7] text-[#171C8F] rounded-xl px-4 py-3.5 text-base md:text-sm focus:ring-2 focus:ring-[#13aff0] focus:border-transparent outline-none border transition-all shadow-sm placeholder:text-[#171C8F]/40 min-h-[48px] font-medium";
    
    switch (currentStep) {
      case StepId.IDENTIFICATION:
        return (
          <div className="space-y-4 animate-fadeIn">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3">
               <div>
                  <h2 className="text-lg font-bold text-[#171C8F]">1. Identificação Geral</h2>
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Ativo e Contexto</p>
               </div>
               <div className="flex gap-2 w-full sm:w-auto">
                 <button onClick={fillDemoData} className="flex-1 sm:flex-initial bg-[#e5ebf7] hover:bg-blue-100 text-[#171C8F] text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border border-blue-100 transition-all shadow-sm flex items-center justify-center gap-2">
                    <Bot size={12} /> Preencher Demo
                 </button>
                 <button onClick={() => setAnalysis(getInitialState())} className="flex-1 sm:flex-initial bg-slate-50 hover:bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border border-slate-200 transition-all shadow-sm flex items-center justify-center gap-2">
                    <Eraser size={12} /> Limpar
                 </button>
               </div>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Área / Setor <span className="text-red-500" aria-hidden="true">*</span></label>
                <input type="text" value={analysis.area} onChange={e => updateAnalysis({ area: e.target.value })} className={inputClasses} placeholder="Ex: Produção" aria-required="true" />
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Equipamento <span className="text-red-500" aria-hidden="true">*</span></label>
                <input type="text" value={analysis.equipment} onChange={e => updateAnalysis({ equipment: e.target.value })} className={inputClasses} placeholder="Ex: Bomba de recalque" aria-required="true" />
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Tag do Ativo <span className="text-red-500" aria-hidden="true">*</span></label>
                <input type="text" value={analysis.tag} onChange={e => updateAnalysis({ tag: e.target.value })} className={inputClasses} placeholder="Ex: B-001" aria-required="true" />
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Data da Falha <span className="text-red-500" aria-hidden="true">*</span></label>
                <div className="relative">
                  <input type="date" value={analysis.failureDate} onChange={e => updateAnalysis({ failureDate: e.target.value })} className={`${inputClasses} pl-10`} aria-required="true" />
                  <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#13aff0] pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Turno</label>
                <input type="text" value={analysis.shift} onChange={e => updateAnalysis({ shift: e.target.value })} className={inputClasses} placeholder="Ex: B - Noturno" />
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Responsável</label>
                <input type="text" value={analysis.responsible} onChange={e => updateAnalysis({ responsible: e.target.value })} className={inputClasses} placeholder="Seu nome" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Descrição do Problema <span className="text-red-500" aria-hidden="true">*</span></label>
              <textarea value={analysis.description} onChange={e => updateAnalysis({ description: e.target.value })} className={`${inputClasses} h-20 md:h-24 resize-none`} placeholder="Relate o ocorrido tecnicamente..." aria-required="true" />
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
              ].map((item) => (
                <div key={item.field} className="space-y-1">
                  <label className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    {item.icon}
                    {item.label} {item.required && <span className="text-red-500">*</span>}
                  </label>
                  <textarea value={(analysis as any)[item.field]} onChange={e => updateAnalysis({ [item.field]: e.target.value })} className={`${inputClasses} h-16 md:h-20 resize-none`} />
                </div>
              ))}
            </div>
          </div>
        );

      case StepId.DETAILS:
        return (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-lg font-bold border-b pb-3 text-[#171C8F]">3. Detalhamento e Contexto</h2>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Frequência</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Eventual', 'Recorrente', 'Crônica'].map(f => (
                    <button key={f} onClick={() => updateAnalysis({ frequency: f as any })} className={`py-1.5 rounded-lg border-2 transition-all font-bold text-[10px] uppercase ${analysis.frequency === f ? 'bg-[#171C8F] border-[#171C8F] text-white shadow-sm' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Condições do Ativo</label>
                <input type="text" value={analysis.condition} onChange={e => updateAnalysis({ condition: e.target.value })} className={inputClasses + " h-9"} placeholder="Ex: Sobrecarga, alta umidade..." />
              </div>
            </div>
          </div>
        );

      case StepId.FIVE_WHYS:
        return (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-lg font-bold border-b pb-3 text-[#171C8F]">4. Os 5 Porquês (Causa Raiz)</h2>
            <div className="bg-[#e5ebf7] p-3 rounded-xl border border-blue-100 flex items-start gap-3">
              <Info size={16} className="text-[#171C8F] mt-0.5" />
              <p className="text-[10px] text-[#171C8F] font-medium leading-relaxed">Responda a cada pergunta com base na resposta anterior para chegar à causa física final.</p>
            </div>
            
            <div className="space-y-2">
              {analysis.whys.map((why, idx) => (
                <div key={idx} className="flex gap-4 items-center animate-fadeIn" style={{ animationDelay: `${idx * 100}ms` }}>
                  <div className="w-6 h-6 rounded-full bg-white border-2 border-[#13aff0] flex items-center justify-center text-[10px] font-black text-[#171C8F] flex-shrink-0 shadow-sm">{idx + 1}</div>
                  <input
                    type="text"
                    value={why}
                    onChange={(e) => {
                      const newWhys = [...analysis.whys];
                      newWhys[idx] = e.target.value;
                      updateAnalysis({ whys: newWhys });
                    }}
                    className={`${inputClasses} py-2`}
                    placeholder={`Por que o problema ${idx === 0 ? 'ocorreu' : 'anterior aconteceu'}?`}
                  />
                </div>
              ))}
            </div>

            <div className="pt-3 border-t">
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Causa Raiz Identificada</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={analysis.rootCause} 
                  onChange={e => updateAnalysis({ rootCause: e.target.value })} 
                  className={`${inputClasses} pl-10 bg-[#e5ebf7] border-[#171C8F]/20 border-2 font-bold text-[#171C8F]`} 
                  placeholder="A falha final foi causada por..." 
                />
                <Target size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#171C8F]" />
              </div>
            </div>
          </div>
        );

      case StepId.ISHIKAWA:
        return <IshikawaComponent analysis={analysis} updateAnalysis={updateAnalysis} />;

      case StepId.ACTIONS:
        return (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-[#171C8F]">6. Plano de Ação (5W2H)</h2>
              <button 
                onClick={addAction}
                className="bg-[#171C8F] text-white text-[9px] font-black uppercase tracking-widest px-6 py-2 rounded-xl hover:bg-black transition-all shadow-md flex items-center gap-2"
              >
                <Plus size={14} /> Nova Ação
              </button>
            </div>

            <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#e5ebf7] text-[#171C8F] text-[9px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-3 py-2 border-b border-blue-100">Tipo</th>
                    <th className="px-3 py-2 border-b border-blue-100">Descrição</th>
                    <th className="px-3 py-2 border-b border-blue-100">Resp.</th>
                    <th className="px-3 py-2 border-b border-blue-100">Prazo</th>
                    <th className="px-3 py-2 border-b border-blue-100 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {analysis.actions.map((action) => (
                    <tr key={action.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-1.5">
                        <select 
                          value={action.type} 
                          onChange={e => updateAction(action.id, { type: e.target.value as any })}
                          className="bg-transparent border-none text-[10px] font-bold focus:ring-0 p-0 text-slate-600 uppercase"
                        >
                          <option>Corretiva</option>
                          <option>Preventiva</option>
                          <option>Melhoria</option>
                        </select>
                      </td>
                      <td className="px-3 py-1.5">
                        <input 
                          type="text" 
                          value={action.description} 
                          onChange={e => updateAction(action.id, { description: e.target.value })}
                          className="w-full bg-transparent border-none text-xs p-0 focus:ring-0 placeholder:text-slate-300 font-medium"
                          placeholder="O que fazer?"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input 
                          type="text" 
                          value={action.responsible} 
                          onChange={e => updateAction(action.id, { responsible: e.target.value })}
                          className="w-full bg-transparent border-none text-[10px] p-0 focus:ring-0 placeholder:text-slate-300 font-bold text-slate-500 uppercase"
                          placeholder="Quem?"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input 
                          type="date" 
                          value={action.dueDate} 
                          onChange={e => updateAction(action.id, { dueDate: e.target.value })}
                          className="bg-transparent border-none text-[10px] p-0 focus:ring-0 text-slate-400 font-bold"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <button onClick={() => removeAction(action.id)} className="text-slate-300 hover:text-red-500 transition-colors">
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
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-lg font-bold border-b pb-3 text-[#171C8F]">7. Verificação e Padronização</h2>
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
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Evidências de Eficácia</label>
                  <textarea value={analysis.effectivenessEvidence} onChange={e => updateAnalysis({ effectivenessEvidence: e.target.value })} className={inputClasses + " h-20 resize-none"} placeholder="Indicadores de melhoria..." />
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
                <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Ações Finais</h3>
                <div className="grid grid-cols-2 gap-2">
                   <button onClick={handleGenerateSummary} disabled={isGeneratingSummary} className="bg-slate-900 text-white font-black py-3 rounded-lg flex items-center justify-center gap-2 text-[10px] uppercase tracking-tighter hover:bg-black transition-all">
                    {isGeneratingSummary ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />} IA
                  </button>
                  <button onClick={handlePrintPDF} className="bg-[#171C8F] text-white font-black py-3 rounded-lg flex items-center justify-center gap-2 text-[10px] uppercase tracking-tighter hover:bg-blue-700 transition-all">
                    <FileDown size={14} /> PDF
                  </button>
                  <button onClick={handleSendEmail} className="col-span-2 bg-emerald-600 text-white font-black py-3 rounded-lg flex items-center justify-center gap-2 text-[10px] uppercase tracking-tighter hover:bg-emerald-700 transition-all">
                    <Share2 size={14} /> Enviar por E-mail
                  </button>
                </div>
                <div className="space-y-2">
                  <button onClick={() => updateAnalysis({ needsRevision: !analysis.needsRevision })} className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all ${analysis.needsRevision ? 'bg-[#e5ebf7] border-blue-200' : 'bg-white border-slate-50'}`}>
                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${analysis.needsRevision ? 'bg-[#171C8F] border-[#171C8F] text-white' : 'border-slate-200'}`}>
                      {analysis.needsRevision && <Check size={8} />}
                    </div>
                    <span className="text-[11px] font-bold text-slate-700">Revisar procedimento técnico</span>
                  </button>
                  <button onClick={() => updateAnalysis({ needsTraining: !analysis.needsTraining })} className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all ${analysis.needsTraining ? 'bg-[#e5ebf7] border-blue-200' : 'bg-white border-slate-50'}`}>
                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${analysis.needsTraining ? 'bg-[#171C8F] border-[#171C8F] text-white' : 'border-slate-200'}`}>
                      {analysis.needsTraining && <Check size={8} />}
                    </div>
                    <span className="text-[11px] font-bold text-slate-700">Necessita treinamento</span>
                  </button>
                </div>
              </div>
            </div>
            {showSummary && analysis.summary && (
              <div className="p-4 bg-[#171C8F] text-white rounded-2xl shadow-xl animate-slideUp relative overflow-hidden">
                <Quote size={32} className="absolute top-2 left-2 opacity-10" />
                <h2 className="text-sm font-black mb-1 flex items-center gap-2 relative z-10"><Bot size={16} className="text-[#13aff0]" /> Parecer da IA</h2>
                <p className="text-[11px] italic leading-tight opacity-95 relative z-10 font-medium whitespace-pre-wrap">"{analysis.summary}"</p>
              </div>
            )}
          </div>
        );
      
      case StepId.DASHBOARD: return <Dashboard onLoad={loadFromHistory} onDelete={deleteFromHistory} user={session?.user} profile={profile} />;
      case StepId.KANBAN: return <KanbanView analysis={analysis} onUpdateAction={updateAction} user={session?.user} profile={profile} />;
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

      {/* PDF PRINT LAYOUT (Hidden on UI) */}
      <div className="print-only bg-white p-8 text-slate-900 font-sans">
        <header className="flex justify-between items-center border-b-4 border-[#171C8F] pb-8 mb-10">
          <div className="flex items-center gap-6">
            <img src="/swm-logo.png" alt="SWM Logo" className="h-16 w-auto" />
            <div>
              <h1 className="text-3xl font-black uppercase text-[#171C8F]">Relatório de Análise de Falha</h1>
              <p className="text-[#13aff0] font-extrabold uppercase tracking-[0.15em] text-sm">SWM Brasil - LIDERANÇA OPEX</p>
            </div>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black text-slate-400 uppercase">Protocolo</p>
             <p className="text-xl font-black text-[#171C8F]">{analysis.id}</p>
          </div>
        </header>

        <section className="mb-8 break-inside-avoid">
          <h2 className="text-lg font-black border-l-4 border-[#171C8F] pl-4 uppercase mb-4">1. Identificação</h2>
          <section className="grid grid-cols-2 gap-x-12 gap-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-4">
             <div><p className="text-[9px] font-black text-slate-400 uppercase">Equipamento</p><p className="text-sm font-bold">{analysis.equipment || '—'}</p></div>
             <div><p className="text-[9px] font-black text-slate-400 uppercase">Tag / Ativo</p><p className="text-sm font-bold">{analysis.tag || '—'}</p></div>
             <div><p className="text-[9px] font-black text-slate-400 uppercase">Área</p><p className="text-sm font-bold">{analysis.area || '—'}</p></div>
             <div><p className="text-[9px] font-black text-slate-400 uppercase">Data Ocorrência</p><p className="text-sm font-bold">{analysis.failureDate || '—'}</p></div>
             <div><p className="text-[9px] font-black text-slate-400 uppercase">Turno</p><p className="text-sm font-bold">{analysis.shift || '—'}</p></div>
             <div><p className="text-[9px] font-black text-slate-400 uppercase">Responsável</p><p className="text-sm font-bold">{analysis.responsible || '—'}</p></div>
          </section>
          <div className="bg-white p-4 border rounded-xl">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Descrição da Falha</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{analysis.description || '—'}</p>
          </div>
        </section>

        <section className="mb-8 break-inside-avoid">
          <h2 className="text-lg font-black border-l-4 border-[#171C8F] pl-4 uppercase mb-4">2. 5W1H</h2>
          <div className="grid grid-cols-2 gap-3">
            {[['O Que', analysis.what], ['Onde', analysis.where], ['Quando', analysis.when], ['Quem', analysis.who], ['Quanto Custo', analysis.howMuch], ['Como', analysis.how]].map(([label, value]) => (
              <div key={label} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[8px] font-black text-slate-400 uppercase">{label as string}</p>
                <p className="text-xs font-medium">{value || '—'}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8 break-inside-avoid">
          <h2 className="text-lg font-black border-l-4 border-[#171C8F] pl-4 uppercase mb-4">3. Detalhes</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
               <p className="text-[8px] font-black text-slate-400 uppercase">Sintoma</p>
               <p className="text-xs font-bold">{analysis.symptom || '—'}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
               <p className="text-[8px] font-black text-slate-400 uppercase">Frequência</p>
               <p className="text-xs font-bold">{analysis.frequency || '—'}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 col-span-2">
               <p className="text-[8px] font-black text-slate-400 uppercase">Condição</p>
               <p className="text-xs font-bold">{analysis.condition || '—'}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 col-span-2">
               <p className="text-[8px] font-black text-slate-400 uppercase">Histórico</p>
               <p className="text-xs font-bold">{analysis.history || '—'}</p>
            </div>
          </div>
        </section>

        <section className="mb-8 break-inside-avoid">
          <h2 className="text-lg font-black border-l-4 border-[#171C8F] pl-4 uppercase mb-4">4. Causa Raiz (5 Porquês)</h2>
          <div className="space-y-3 mb-4">
            {analysis.whys.map((w, i) => w.trim() && (
              <div key={i} className="flex gap-3 items-center">
                <span className="w-6 h-6 rounded-full bg-[#171C8F] text-white flex items-center justify-center text-[10px] font-black">{i+1}</span>
                <p className="text-sm font-medium">{w}</p>
              </div>
            ))}
          </div>
          <div className="bg-[#171C8F] text-white p-6 rounded-2xl">
             <p className="text-[9px] font-black uppercase opacity-60 mb-1">Causa Raiz</p>
             <p className="text-xl font-black">{analysis.rootCause || 'NÃO IDENTIFICADA'}</p>
          </div>
        </section>

        <section className="mb-8 break-inside-avoid">
          <h2 className="text-lg font-black border-l-4 border-[#171C8F] pl-4 uppercase mb-4">5. Ishikawa (6M)</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(analysis.ishikawa).map(([category, data]) => (
              <div key={category} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">{category === 'manpower' ? 'Mão de Obra' : category === 'measurement' ? 'Medição' : category === 'environment' ? 'Meio Ambiente' : category.charAt(0).toUpperCase() + category.slice(1)}</p>
                <p className="text-[10px] font-medium">{data.causes.filter(c => c.trim()).join(', ') || '—'}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10 page-break-before">
          <h2 className="text-lg font-black border-l-4 border-[#171C8F] pl-4 uppercase mb-4">6. Plano de Ação</h2>
          <table className="w-full text-left border-collapse border border-slate-200">
             <thead className="bg-[#171C8F] text-white text-[9px] font-black uppercase">
                <tr>
                   <th className="p-3 border-r border-slate-700">Tipo</th>
                   <th className="p-3 border-r border-slate-700">Descrição</th>
                   <th className="p-3 border-r border-slate-700">Responsável</th>
                   <th className="p-3 border-r border-slate-700">Prazo</th>
                   <th className="p-3">Status</th>
                </tr>
             </thead>
             <tbody className="text-[10px]">
                {analysis.actions.length === 0 ? (
                  <tr><td colSpan={5} className="p-4 text-center text-slate-400">Nenhuma ação registrada</td></tr>
                ) : analysis.actions.map(a => (
                  <tr key={a.id} className="border-b border-slate-100">
                    <td className="p-3"><span className={`text-[8px] px-2 py-0.5 rounded-full ${a.type === 'Corretiva' ? 'bg-red-100 text-red-700' : a.type === 'Preventiva' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{a.type}</span></td>
                    <td className="p-3 font-medium">{a.description || '—'}</td>
                    <td className="p-3">{a.responsible || '—'}</td>
                    <td className="p-3">{a.dueDate ? new Date(a.dueDate).toLocaleDateString('pt-BR') : '—'}</td>
                    <td className="p-3"><span className={`text-[8px] px-2 py-0.5 rounded-full ${a.status === 'Concluída' ? 'bg-green-100 text-green-700' : a.status === 'Em andamento' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{a.status}</span></td>
                  </tr>
                ))}
             </tbody>
          </table>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-black border-l-4 border-[#171C8F] pl-4 uppercase mb-4">7. Verificação</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
               <p className="text-[8px] font-black text-slate-400 uppercase">Reincidência?</p>
               <p className="text-sm font-bold">{analysis.reoccurred === true ? 'SIM' : analysis.reoccurred === false ? 'NÃO' : '—'}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
               <p className="text-[8px] font-black text-slate-400 uppercase">Precisa Revisão?</p>
               <p className="text-sm font-bold">{analysis.needsRevision ? 'SIM' : 'NÃO'}</p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
             <p className="text-[8px] font-black text-slate-400 uppercase">Evidências de Eficácia</p>
             <p className="text-sm font-medium whitespace-pre-wrap">{analysis.effectivenessEvidence || '—'}</p>
          </div>
        </section>

        <footer className="mt-16 pt-8 border-t border-slate-200 flex justify-between items-end">
           <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Gerado em {new Date().toLocaleString('pt-BR')}</div>
           <div className="w-64 border-t-2 border-slate-900 text-center pt-2">
              <p className="text-[9px] font-black uppercase">{analysis.responsible || 'Responsável Técnico'}</p>
              <p className="text-[8px] font-bold text-slate-400">Assinatura Digital</p>
           </div>
        </footer>
      </div>

      {/* WEB UI */}
      <div className="no-print h-full flex flex-col">
        <header className="bg-white text-[#171C8F] shadow-md h-20 md:h-24 flex-shrink-0 z-50 border-b-4 border-[#171C8F]">
          <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
            <div className="flex items-center gap-6">
              <img src="/swm-logo.png" alt="SWM Logo" className="h-12 md:h-14 w-auto" />
              <div className="hidden lg:block h-10 w-px bg-slate-200"></div>
              <div className="hidden sm:block">
                <h1 className="font-black text-lg tracking-tight uppercase leading-none text-[#171C8F]">Análise de Falhas</h1>
                <p className="text-[11px] text-[#13aff0] font-bold tracking-[0.2em] uppercase mt-1">LIDERANÇA OPEX</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-6">
              <nav className="flex gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                <button onClick={startNewAnalysis} className={`px-4 md:px-6 py-3 rounded-xl transition-all font-black uppercase text-[10px] tracking-wider ${currentStep < StepId.DASHBOARD ? 'bg-[#171C8F] text-white shadow-lg' : 'text-[#171C8F]/50 hover:text-[#171C8F] hover:bg-white'}`}>Novo</button>
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
                      {currentStep > step.id ? <Check size={16} /> : step.icon}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${currentStep === step.id ? 'text-[#171C8F]' : 'text-slate-400'}`}>{step.label}</span>
                  </button>
                  {idx < STEPS.length - 1 && <div className={`w-12 h-1 rounded-full ${currentStep > idx ? 'bg-[#171C8F]' : 'bg-slate-100'}`} aria-hidden="true"></div>}
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

          {currentStep < StepId.DASHBOARD && (
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

export default App;
