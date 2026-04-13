
import React from 'react';
import { Action, Status, Analysis } from '../types';
import { Columns, FolderOpen, Loader2, CheckCircle2, Inbox, ArrowLeft, ArrowRight, UserCircle, Calendar, Lightbulb } from 'lucide-react';

interface KanbanViewProps {
  analysis: Analysis;
  onUpdateAction: (id: string, data: Partial<Action>) => void;
  user?: any;
  profile?: any;
}

const KanbanView: React.FC<KanbanViewProps> = ({ analysis, onUpdateAction }) => {
  const columns: { title: string; status: Status; color: string; icon: React.ReactNode }[] = [
    { title: 'Abertas', status: 'Aberta', color: 'bg-slate-50 border-slate-200', icon: <FolderOpen size={18} className="text-slate-500" /> },
    { title: 'Em Andamento', status: 'Em andamento', color: 'bg-[#e5ebf7] border-[#dce4f5]', icon: <Loader2 size={18} className="text-[#171C8F] animate-spin" /> },
    { title: 'Concluídas', status: 'Concluída', color: 'bg-emerald-50 border-emerald-100', icon: <CheckCircle2 size={18} className="text-emerald-500" /> },
  ];

  const getActionsByStatus = (status: Status) => {
    return analysis.actions.filter(action => action.status === status);
  };

  const handleStatusChange = (id: string, newStatus: Status) => {
    onUpdateAction(id, { status: newStatus });
  };

  return (
    <div className="flex flex-col h-full animate-fadeIn">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Columns size={20} className="text-[#171C8F]" />
          Quadro Kanban de Ações
        </h2>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Gerencie o progresso das ações desta análise.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-[400px]">
        {columns.map((column) => (
          <div 
            key={column.status} 
            className={`flex flex-col rounded-xl border-2 ${column.color} p-3 transition-all duration-300`}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                {column.icon}
                <h3 className="font-bold text-slate-700 uppercase tracking-wider text-sm">{column.title}</h3>
              </div>
              <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-slate-500 border border-slate-200 shadow-sm">
                {getActionsByStatus(column.status).length}
              </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
              {getActionsByStatus(column.status).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm">
                  <Inbox size={24} className="mb-2 opacity-20" />
                  Vazio
                </div>
              ) : (
                getActionsByStatus(column.status).map((action) => (
                  <div 
                    key={action.id} 
                    className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 hover:shadow-lg hover:border-[#171C8F]/30 transition-all group relative"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        action.type === 'Corretiva' ? 'bg-red-100 text-red-700' : 
                        action.type === 'Preventiva' ? 'bg-[#e5ebf7] text-[#171C8F]' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {action.type}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {column.status !== 'Aberta' && (
                          <button 
                            onClick={() => handleStatusChange(action.id, 'Aberta')}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                            title="Mover para Aberta"
                          >
                            <ArrowLeft size={14} />
                          </button>
                        )}
                        {column.status !== 'Concluída' && (
                          <button 
                            onClick={() => handleStatusChange(action.id, column.status === 'Aberta' ? 'Em andamento' : 'Concluída')}
                            className="p-1 hover:bg-[#e5ebf7] rounded text-[#13aff0] hover:text-[#171C8F]"
                            title="Avançar"
                          >
                            <ArrowRight size={14} />
                          </button>
                        )}
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

                    {/* Quick Move Select for Mobile */}
                    <select 
                      className="absolute top-0 right-0 w-full h-full opacity-0 cursor-pointer md:hidden"
                      value={action.status}
                      onChange={(e) => handleStatusChange(action.id, e.target.value as Status)}
                    >
                      <option value="Aberta">Aberta</option>
                      <option value="Em andamento">Em andamento</option>
                      <option value="Concluída">Concluída</option>
                    </select>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-4 bg-[#171C8F] rounded-xl text-white shadow-lg overflow-hidden relative">
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold mb-0.5">Dica de Gestão</h3>
            <p className="text-blue-100 text-[10px] max-w-xl">
              Mantenha o Kanban atualizado diariamente. Ações longas sugerem bloqueios técnicos.
            </p>
          </div>
          <Lightbulb size={32} className="text-blue-300/30 rotate-12" />
        </div>
      </div>
    </div>
  );
};

export default KanbanView;
