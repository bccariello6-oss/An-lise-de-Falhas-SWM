import React, { useState, useEffect } from 'react';
import { Action, Status, Analysis } from '../types';
import { Columns, FolderOpen, Loader2, CheckCircle2, Inbox, ArrowLeft, ArrowRight, UserCircle, Calendar, Lightbulb, GripVertical, FileText, AlertTriangle } from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, useDroppable, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as db from '../services/supabaseService';
import EvidenceModal from './EvidenceModal';

interface KanbanViewProps {
  user?: any;
  profile?: any;
}

interface KanbanAction extends Action {
  analysisId: string;
  analysisEquipment: string;
  analysisArea: string;
  analysisUserId: string;
}

const columns: { title: string; status: Status; color: string; icon: React.ReactNode }[] = [
  { title: 'Abertas', status: 'Aberta', color: 'bg-red-50/60 border-red-200', icon: <FolderOpen size={16} className="text-red-600" /> },
  { title: 'Em Andamento', status: 'Em andamento', color: 'bg-amber-50/60 border-amber-200', icon: <Loader2 size={16} className="text-amber-600 animate-spin" /> },
  { title: 'Concluídas', status: 'Concluída', color: 'bg-emerald-50/60 border-emerald-200', icon: <CheckCircle2 size={16} className="text-emerald-600" /> },
];

const CardItem: React.FC<{ action: KanbanAction; isDragging?: boolean; onAskEvidence?: () => void }> = ({ action, isDragging, onAskEvidence }) => (
  <div onClick={onAskEvidence} className={`cursor-pointer bg-white p-2 md:p-3 rounded-xl shadow-sm border border-slate-100 transition-all group ${
    isDragging ? 'shadow-xl border-[#171C8F] opacity-90 rotate-2 scale-105 z-50' : 'hover:shadow-lg hover:border-[#171C8F]/30'
  }`}>
    <div className="flex justify-between items-start mb-1 md:mb-2">
      <span className={`text-[8px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded-full uppercase ${
        action.type === 'Corretiva' ? 'bg-red-100 text-red-700' : 
        action.type === 'Preventiva' ? 'bg-[#e5ebf7] text-[#171C8F]' : 'bg-amber-100 text-amber-700'
      }`}>
        {action.type}
      </span>
      <GripVertical size={12} className="text-slate-400 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
    <div className="mb-2 flex flex-col gap-0.5">
      <span className="text-[9px] font-black uppercase text-[#171C8F] tracking-widest">{action.analysisEquipment || 'S/ EQUIPAMENTO'}</span>
      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{action.analysisArea || 'S/ ÁREA'}</span>
    </div>
    <h4 className="text-[11px] md:text-sm font-semibold text-slate-800 mb-2 md:mb-3 line-clamp-2 md:line-clamp-3 leading-relaxed">
      {action.description || <span className="italic text-slate-400 font-normal">Sem descrição</span>}
    </h4>
    {action.evidence && (
      <div className="mb-2 p-2 bg-green-50 rounded border border-green-100 text-[10px] text-green-800 font-medium break-words">
        <strong>Evidência:</strong> {action.evidence}
      </div>
    )}
    <div className="flex flex-col gap-1 md:gap-2 pt-2 md:pt-3 border-t border-slate-50">
      <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs text-slate-500">
        <UserCircle size={12} className="opacity-70" />
        <span className="font-medium">{action.responsible || 'Não atribuído'}</span>
      </div>
      <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs text-slate-500">
        <Calendar size={12} className="opacity-70" />
        <span>{action.dueDate ? new Date(action.dueDate).toLocaleDateString('pt-BR') : 'Sem data'}</span>
      </div>
    </div>
  </div>
);

const SortableItem: React.FC<{ action: KanbanAction; onStatusChange: (id: string, newStatus: Status) => void; columnStatus: Status; onAskEvidence: () => void }> = ({ action, onStatusChange, columnStatus, onAskEvidence }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: action.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const nextStatus = columnStatus === 'Aberta' ? 'Em andamento' : columnStatus === 'Em andamento' ? 'Concluída' : 'Concluída';

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CardItem action={action} isDragging={isDragging} onAskEvidence={onAskEvidence} />
      <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        {columnStatus !== 'Aberta' && (
          <button onClick={() => onStatusChange(action.id, 'Aberta')} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600" title="Mover para Aberta">
            <ArrowLeft size={14} />
          </button>
        )}
        {columnStatus !== 'Concluída' && (
          <button onClick={() => onStatusChange(action.id, nextStatus)} className="p-1 hover:bg-[#e5ebf7] rounded text-[#13aff0] hover:text-[#171C8F]" title="Avançar">
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

const DroppableColumn: React.FC<{ status: Status; title: string; color: string; icon: React.ReactNode; actions: KanbanAction[]; onStatusChange: (id: string, newStatus: Status) => void; onAskEvidence: (id: string) => void }> = ({ status, title, color, icon, actions, onStatusChange, onAskEvidence }) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div 
      ref={setNodeRef}
      className={`flex flex-col rounded-xl border-2 ${color} p-2 md:p-3 transition-all duration-300 ${
        isOver ? 'ring-2 ring-[#171C8F] ring-opacity-50 bg-[#e5ebf7]' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2 md:mb-3 px-1">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] md:text-sm">{title}</h3>
        </div>
        <span className="bg-white px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold text-slate-500 border border-slate-200 shadow-sm">
          {actions.length}
        </span>
      </div>
      <div className="flex-1 space-y-2 md:space-y-3 overflow-y-auto pr-1 custom-scrollbar min-h-[180px] md:min-h-[250px]">
        {actions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 md:h-32 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-[10px] md:text-sm">
            <Inbox size={20} className="mb-2 opacity-20" />
            Solte aqui
          </div>
        ) : (
          <SortableContext items={actions.map(a => a.id)} strategy={verticalListSortingStrategy}>
            {actions.map((action) => (
              <div key={action.id} className="group">
                <SortableItem action={action} onStatusChange={onStatusChange} columnStatus={status} onAskEvidence={() => onAskEvidence(action.id)} />
              </div>
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
};

const KanbanView: React.FC<KanbanViewProps> = ({ user, profile }) => {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'complete'>('add');
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user, profile, refreshKey]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await db.fetchAnalyses(user.id, profile?.role === 'ADMIN');
      setAnalyses(data);
    } catch (error) {
      console.error('Error fetching kanban data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAllActions = (): KanbanAction[] => {
    const actions: KanbanAction[] = [];
    analyses.forEach(analysis => {
      analysis.actions?.forEach(action => {
        actions.push({
          ...action,
          analysisId: analysis.id,
          analysisEquipment: analysis.equipment,
          analysisArea: analysis.area,
          analysisUserId: (analysis as any).user_id
        });
      });
    });
    return actions;
  };

  const allActions = getAllActions();

  const getActionsByStatus = (status: Status) => allActions.filter(action => action.status === status);

  const handleStatusChange = async (id: string, newStatus: Status, promptEvidence: boolean = true) => {
    const action = allActions.find(a => a.id === id);
    if (!action) return;

    if (newStatus === 'Concluída' && promptEvidence && !action.evidence?.trim()) {
      setModalMode('complete');
      setSelectedActionId(id);
      setAlertMessage('Para mover esta tarefa para Concluídas, é necessário adicionar uma evidência.');
      setAlertOpen(true);
      return;
    }

    const parentAnalysis = analyses.find(a => String(a.id) === String(action.analysisId));
    if (!parentAnalysis) {
      console.error('Parent analysis not found', { analysesIds: analyses.map(a => a.id), actionAnalysisId: action.analysisId });
      return;
    }

    const updatedAnalysis = {
      ...parentAnalysis,
      actions: parentAnalysis.actions.map(a => 
        a.id === id ? { ...a, status: newStatus } : a
      )
    };

    const tempActions = allActions.map(a => a.id === id ? { ...a, status: newStatus } : a);
    
    setAnalyses(prev => {
      const newAnalyses = prev.map(a => String(a.id) === String(updatedAnalysis.id) ? updatedAnalysis : a);
      return newAnalyses;
    });

    try {
      await db.saveAnalysis(action.analysisUserId, updatedAnalysis);
    } catch (error) {
      console.error('Failed to save status change:', error);
      alert('Houve um erro ao atualizar a ação no servidor.');
      loadData();
    }
  };

  const handleAskEvidence = async (id: string) => {
    setModalMode('add');
    setSelectedActionId(id);
    setModalOpen(true);
  };

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const actionId = active.id as string;
    const action = allActions.find(a => a.id === actionId);
    if (!action) return;

    const overId = over.id as string;
    let newStatus: Status | null = null;

    const col = columns.find(c => c.status === overId);
    if (col) {
      newStatus = col.status;
    } else {
      const overAction = allActions.find(a => a.id === overId);
      if (overAction) newStatus = overAction.status;
    }

    if (newStatus && newStatus !== action.status) {
      if (newStatus === 'Concluída' && !action.evidence?.trim()) {
        setModalMode('complete');
        setSelectedActionId(actionId);
        setAlertMessage('Para mover esta tarefa para Concluídas, é necessário adicionar uma evidência.');
        setAlertOpen(true);
        return;
      }
      handleStatusChange(actionId, newStatus);
    }
  };

  const activeAction = activeId ? allActions.find(a => a.id === activeId) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#171C8F]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fadeIn">
      <div className="mb-2 md:mb-4">
        <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2">
          <Columns size={18} className="text-[#171C8F]" />
          Quadro Kanban Corporativo
        </h2>
        <p className="text-[8px] md:text-[10px] text-slate-500 font-bold uppercase tracking-wide">
          Visão de {profile?.role === 'ADMIN' ? 'todas as ações registradas' : 'suas ações'} - Arraste para mover
        </p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 flex-1 min-h-[300px] md:min-h-[400px]">
          {columns.map((column) => (
            <DroppableColumn
              key={column.status}
              status={column.status}
              title={column.title}
              color={column.color}
              icon={column.icon}
              actions={getActionsByStatus(column.status)}
              onStatusChange={handleStatusChange}
              onAskEvidence={handleAskEvidence}
            />
          ))}
        </div>
        <DragOverlay>{activeAction ? <CardItem action={activeAction} isDragging /> : null}</DragOverlay>
      </DndContext>
      
      <div className="mt-3 md:mt-4 p-3 md:p-4 bg-[#171C8F] rounded-xl text-white shadow-lg overflow-hidden relative">
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-[10px] md:text-sm font-bold mb-0.5">Dica de Gestão</h3>
            <p className="text-blue-100 text-[8px] md:text-[10px] max-w-xl">
              Clique numa task para alterar sua evidência! Evidência é obrigatória para finalizar uma atividade.
            </p>
          </div>
          <Lightbulb size={24} className="text-blue-300/30 rotate-12" />
        </div>
      </div>

      <EvidenceModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedActionId(null);
        }}
        onSave={(evidence) => {
          if (selectedActionId) {
            const action = allActions.find(a => a.id === selectedActionId);
            if (!action) return;
            
            const parentAnalysis = analyses.find(a => String(a.id) === String(action.analysisId));
            if (!parentAnalysis) {
              console.error('Parent analysis not found in modal', { analysesIds: analyses.map(a => a.id), actionAnalysisId: action.analysisId });
              return;
            }

            const updatedAnalysis = {
              ...parentAnalysis,
              actions: parentAnalysis.actions.map(a => 
                a.id === selectedActionId ? { ...a, evidence } : a
              )
            };

            setAnalyses(prev => prev.map(a => String(a.id) === String(updatedAnalysis.id) ? updatedAnalysis : a));

            if (modalMode === 'complete') {
              const updatedAnalysisWithStatus = {
                ...updatedAnalysis,
                actions: updatedAnalysis.actions.map(a => 
                  a.id === selectedActionId ? { ...a, status: 'Concluída' as Status } : a
                )
              };
              
              setAnalyses(prev => prev.map(a => String(a.id) === String(updatedAnalysisWithStatus.id) ? updatedAnalysisWithStatus : a));
              
              db.saveAnalysis(action.analysisUserId, updatedAnalysisWithStatus).catch(err => {
                console.error('Failed to save:', err);
              });
            } else {
              db.saveAnalysis(action.analysisUserId, updatedAnalysis).catch(err => {
                console.error('Failed to save:', err);
              });
            }
          }
        }}
        initialEvidence={selectedActionId ? allActions.find(a => a.id === selectedActionId)?.evidence || '' : ''}
        title={modalMode === 'complete' ? 'Finalizar Tarefa' : 'Adicionar Evidência'}
        mode={modalMode}
      />

      {alertOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fadeIn"
          style={{ 
            background: 'rgba(23, 28, 143, 0.4)',
            backdropFilter: 'blur(4px)'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setAlertOpen(false);
          }}
        >
          <div 
            className="bg-white rounded-[20px] shadow-2xl w-full max-w-md animate-scaleIn overflow-hidden"
            style={{
              border: '1px solid rgba(23, 28, 143, 0.1)',
              boxShadow: '0 25px 50px -12px rgba(23, 28, 143, 0.25)'
            }}
          >
            <div 
              className="px-6 py-4 flex items-center justify-between"
              style={{ background: '#eab308' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <AlertTriangle size={18} className="text-white" />
                </div>
                <h2 className="text-white font-black text-sm uppercase tracking-wide">
                  Atenção
                </h2>
              </div>
              <button 
                onClick={() => setAlertOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <FileText size={18} className="text-white" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm font-medium text-slate-700 mb-6">
                {alertMessage}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setAlertOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl border-2 border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-wider hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setAlertOpen(false);
                    setModalOpen(true);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2"
                  style={{ background: '#13aff0', color: '#171C8F' }}
                >
                  <FileText size={14} />
                  <span className="font-black text-[10px] uppercase tracking-wider">Adicionar Evidência</span>
                </button>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes scaleIn {
              from { 
                opacity: 0;
                transform: scale(0.95) translateY(10px);
              }
              to { 
                opacity: 1;
                transform: scale(1) translateY(0);
              }
            }
            .animate-fadeIn {
              animation: fadeIn 0.2s ease-out;
            }
            .animate-scaleIn {
              animation: scaleIn 0.25s ease-out;
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default KanbanView;
