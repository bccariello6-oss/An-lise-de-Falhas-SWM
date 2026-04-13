import React, { useState } from 'react';
import { Action, Status, Analysis } from '../types';
import { Columns, FolderOpen, Loader2, CheckCircle2, Inbox, ArrowLeft, ArrowRight, UserCircle, Calendar, Lightbulb, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface KanbanViewProps {
  analysis: Analysis;
  onUpdateAction: (id: string, data: Partial<Action>) => void;
  user?: any;
  profile?: any;
}

const columns: { title: string; status: Status; color: string; icon: React.ReactNode }[] = [
  { title: 'Abertas', status: 'Aberta', color: 'bg-slate-50 border-slate-200', icon: <FolderOpen size={18} className="text-slate-500" /> },
  { title: 'Em Andamento', status: 'Em andamento', color: 'bg-[#e5ebf7] border-[#dce4f5]', icon: <Loader2 size={18} className="text-[#171C8F] animate-spin" /> },
  { title: 'Concluídas', status: 'Concluída', color: 'bg-emerald-50 border-emerald-100', icon: <CheckCircle2 size={18} className="text-emerald-500" /> },
];

interface KanbanCardProps {
  action: Action;
  isDragging?: boolean;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ action, isDragging }) => {
  return (
    <div 
      className={`bg-white p-3 rounded-xl shadow-sm border border-slate-100 transition-all group relative ${
        isDragging ? 'shadow-xl border-[#171C8F] opacity-90 rotate-2 scale-105 z-50' : 'hover:shadow-lg hover:border-[#171C8F]/30'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
          action.type === 'Corretiva' ? 'bg-red-100 text-red-700' : 
          action.type === 'Preventiva' ? 'bg-[#e5ebf7] text-[#171C8F]' : 'bg-amber-100 text-amber-700'
        }`}>
          {action.type}
        </span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical size={14} className="text-slate-400 cursor-grab" />
        </div>
      </div>
      
      <h4 className="text-sm font-semibold text-slate-800 mb-3 line-clamp-3 leading-relaxed">
        {action.description || <span className="italic text-slate-400 font-normal">Sem descrição</span>}
      </h4>
      
      <div className="flex flex-col gap-2 pt-3 border-t border-slate-50">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <UserCircle size={14} className="opacity-70" />
          <span className="font-medium">{action.responsible || 'Não atribuído'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar size={14} className="opacity-70" />
          <span>{action.dueDate ? new Date(action.dueDate).toLocaleDateString('pt-BR') : 'Sem data'}</span>
        </div>
      </div>
    </div>
  );
};

interface SortableCardProps {
  action: Action;
  onStatusChange: (id: string, newStatus: Status) => void;
  columnStatus: Status;
}

const SortableCard: React.FC<SortableCardProps> = ({ action, onStatusChange, columnStatus }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: action.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard action={action} isDragging={isDragging} />
      <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        {columnStatus !== 'Aberta' && (
          <button 
            onClick={() => onStatusChange(action.id, 'Aberta')}
            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
            title="Mover para Aberta"
          >
            <ArrowLeft size={14} />
          </button>
        )}
        {columnStatus !== 'Concluída' && (
          <button 
            onClick={() => onStatusChange(action.id, columnStatus === 'Aberta' ? 'Em andamento' : 'Concluída')}
            className="p-1 hover:bg-[#e5ebf7] rounded text-[#13aff0] hover:text-[#171C8F]"
            title="Avançar"
          >
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

interface KanbanColumnProps {
  title: string;
  status: Status;
  color: string;
  icon: React.ReactNode;
  actions: Action[];
  onStatusChange: (id: string, newStatus: Status) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, status, color, icon, actions, onStatusChange }) => {
  const getNextStatus = (current: Status): Status => {
    if (current === 'Aberta') return 'Em andamento';
    if (current === 'Em andamento') return 'Concluída';
    return 'Concluída';
  };

  return (
    <div className={`flex flex-col rounded-xl border-2 ${color} p-3 transition-all duration-300`}>
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-bold text-slate-700 uppercase tracking-wider text-sm">{title}</h3>
        </div>
        <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-slate-500 border border-slate-200 shadow-sm">
          {actions.length}
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar min-h-[200px]">
        {actions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm">
            <Inbox size={24} className="mb-2 opacity-20" />
            Arraste cards aqui
          </div>
        ) : (
          <SortableContext items={actions.map(a => a.id)} strategy={verticalListSortingStrategy}>
            {actions.map((action) => (
              <div key={action.id} className="group">
                <SortableCard 
                  action={action} 
                  onStatusChange={onStatusChange} 
                  columnStatus={status}
                />
                <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  {status !== 'Aberta' && (
                    <button 
                      onClick={() => onStatusChange(action.id, 'Aberta')}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                      title="Mover para Aberta"
                    >
                      <ArrowLeft size={14} />
                    </button>
                  )}
                  {status !== 'Concluída' && (
                    <button 
                      onClick={() => onStatusChange(action.id, getNextStatus(status))}
                      className="p-1 hover:bg-[#e5ebf7] rounded text-[#13aff0] hover:text-[#171C8F]"
                      title="Avançar"
                    >
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
};

const KanbanView: React.FC<KanbanViewProps> = ({ analysis, onUpdateAction }) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getActionsByStatus = (status: Status) => {
    return analysis.actions.filter(action => action.status === status);
  };

  const handleStatusChange = (id: string, newStatus: Status) => {
    onUpdateAction(id, { status: newStatus });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const actionId = active.id as string;
    const action = analysis.actions.find(a => a.id === actionId);
    
    if (!action) return;

    const overId = over.id as string;
    
    let newStatus: Status | null = null;
    
    if (columns.some(col => col.status === overId)) {
      newStatus = overId as Status;
    } else {
      const overAction = analysis.actions.find(a => a.id === overId);
      if (overAction) {
        newStatus = overAction.status;
      }
    }

    if (newStatus && newStatus !== action.status) {
      onUpdateAction(actionId, { status: newStatus });
    }
  };

  const activeAction = activeId ? analysis.actions.find(a => a.id === activeId) : null;

  return (
    <div className="flex flex-col h-full animate-fadeIn">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Columns size={20} className="text-[#171C8F]" />
          Quadro Kanban de Ações
        </h2>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
          Arraste os cards entre as colunas ou clique nas setas. Use o clique para dispositivos táteis.
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-[400px]">
          {columns.map((column) => (
            <KanbanColumn
              key={column.status}
              title={column.title}
              status={column.status}
              color={column.color}
              icon={column.icon}
              actions={getActionsByStatus(column.status)}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>

        <DragOverlay>
          {activeAction ? <KanbanCard action={activeAction} isDragging /> : null}
        </DragOverlay>
      </DndContext>
      
      <div className="mt-4 p-4 bg-[#171C8F] rounded-xl text-white shadow-lg overflow-hidden relative">
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold mb-0.5">Dica de Gestão</h3>
            <p className="text-blue-100 text-[10px] max-w-xl">
              Arraste os cards para mover entre colunas. Ações longas sugerem bloqueios técnicos.
            </p>
          </div>
          <Lightbulb size={32} className="text-blue-300/30 rotate-12" />
        </div>
      </div>
    </div>
  );
};

export default KanbanView;