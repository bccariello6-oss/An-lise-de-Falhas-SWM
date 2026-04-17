import React, { useState, useEffect } from 'react';
import { X, FileText, Save, AlertCircle } from 'lucide-react';

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (evidence: string) => void;
  initialEvidence?: string;
  title?: string;
  mode?: 'add' | 'complete';
}

const EvidenceModal: React.FC<EvidenceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEvidence = '',
  title = 'Adicionar Evidência',
  mode = 'add'
}) => {
  const [evidence, setEvidence] = useState(initialEvidence);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setEvidence(initialEvidence);
      setError('');
    }
  }, [isOpen, initialEvidence]);

  const handleSave = () => {
    if (!evidence.trim()) {
      setError('É obrigatória a inserção de uma evidência.');
      return;
    }
    onSave(evidence.trim());
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fadeIn"
      style={{ 
        background: 'rgba(23, 28, 143, 0.4)',
        backdropFilter: 'blur(4px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={handleKeyDown}
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
          style={{ background: '#171C8F' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <FileText size={18} className="text-white" />
            </div>
            <h2 className="text-white font-black text-sm uppercase tracking-wide">
              {title}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X size={18} className="text-white" />
          </button>
        </div>

        <div className="p-6">
          {mode === 'complete' && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] font-medium text-amber-800">
                Para mover esta tarefa para <strong>Concluídas</strong>, é necessário fornecer a evidência da ação executada.
              </p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Evidência da Ação
            </label>
            <textarea
              value={evidence}
              onChange={(e) => {
                setEvidence(e.target.value);
                if (error) setError('');
              }}
              placeholder="Descreva a evidência da ação executada (foto, documento, registro, etc.)..."
              className={`w-full h-32 p-4 rounded-xl border-2 text-sm font-medium text-slate-700 outline-none resize-none transition-all ${
                error 
                  ? 'border-red-300 bg-red-50 focus:border-red-500' 
                  : 'border-slate-100 bg-slate-50 focus:border-[#13aff0] focus:bg-white'
              }`}
              autoFocus
            />
            {error && (
              <p className="mt-2 text-[10px] font-bold text-red-600 flex items-center gap-1">
                <AlertCircle size={12} />
                {error}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border-2 border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-wider hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2"
              style={{ background: '#13aff0', color: '#171C8F' }}
            >
              <Save size={14} />
              <span className="font-black text-[10px] uppercase tracking-wider">Salvar</span>
            </button>
          </div>

          <p className="mt-4 text-[9px] text-slate-400 text-center font-medium">
            Pressione <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">Enter</kbd> para salvar
          </p>
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
  );
};

export default EvidenceModal;