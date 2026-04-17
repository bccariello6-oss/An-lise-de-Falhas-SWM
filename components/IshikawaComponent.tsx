
import React, { useRef } from 'react';
import { Analysis, Attachment } from '../types';
import { ISHIKAWA_QUESTIONS } from '../constants';
import { Settings, Book, Users, Box, Ruler, Leaf, XCircle, Paperclip, Plus } from 'lucide-react';

interface Props {
  analysis: Analysis;
  updateAnalysis: (data: Partial<Analysis>) => void;
}

const IshikawaComponent: React.FC<Props> = ({ analysis, updateAnalysis }) => {
  const fileInputRefs = {
    machine: useRef<HTMLInputElement>(null),
    method: useRef<HTMLInputElement>(null),
    material: useRef<HTMLInputElement>(null),
    manpower: useRef<HTMLInputElement>(null),
    measurement: useRef<HTMLInputElement>(null),
    environment: useRef<HTMLInputElement>(null),
  };

  const handleCauseChange = (category: keyof Analysis['ishikawa'], index: number, value: string) => {
    const newIshikawa = { ...analysis.ishikawa };
    newIshikawa[category].causes[index] = value;
    updateAnalysis({ ishikawa: newIshikawa });
  };

  const addCause = (category: keyof Analysis['ishikawa']) => {
    const newIshikawa = { ...analysis.ishikawa };
    newIshikawa[category].causes.push("");
    updateAnalysis({ ishikawa: newIshikawa });
  };

  const removeCause = (category: keyof Analysis['ishikawa'], index: number) => {
    const newIshikawa = { ...analysis.ishikawa };
    newIshikawa[category].causes.splice(index, 1);
    updateAnalysis({ ishikawa: newIshikawa });
  };

  const handleFileUpload = (category: keyof Analysis['ishikawa'], e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const newAttachment: Attachment = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: event.target?.result as string,
      };
      const newIshikawa = { ...analysis.ishikawa };
      newIshikawa[category].attachments = [...(newIshikawa[category].attachments || []), newAttachment];
      updateAnalysis({ ishikawa: newIshikawa });
      if (fileInputRefs[category].current) fileInputRefs[category].current!.value = "";
    };
    reader.readAsDataURL(file);
  };

  const renderCategory = (category: keyof Analysis['ishikawa'], label: string, Icon: React.ElementType) => (
    <section className="bg-[#fcfdff] p-2 md:p-3 rounded-2xl border border-[#dce4f5] flex flex-col gap-1 md:gap-2 shadow-sm h-full hover:shadow-md transition-all">
      <div className="flex items-center gap-2 md:gap-3 pb-1 md:pb-2 border-b border-[#e5ebf7]">
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-[#e5ebf7] flex items-center justify-center text-[#171C8F] shadow-sm"><Icon size={14} /></div>
        <h3 className="font-black text-slate-800 uppercase text-[8px] md:text-[9px] tracking-widest">{label}</h3>
      </div>
      <p className="text-[7px] md:text-[8px] text-slate-400 italic leading-tight px-1 font-medium">{ISHIKAWA_QUESTIONS[category]}</p>
      
      <div className="space-y-1 md:space-y-2 flex-1">
        {analysis.ishikawa[category].causes.map((cause, idx) => (
          <div key={idx} className="flex gap-1 md:gap-2 items-center group animate-fadeIn">
            <input
              type="text"
              value={cause}
              onChange={(e) => handleCauseChange(category, idx, e.target.value)}
              className="flex-1 text-[10px] md:text-[11px] bg-[#e5ebf7] border border-[#dce4f5] text-[#171C8F] rounded-lg px-2 md:px-3 py-1 md:py-1.5 focus:ring-1 focus:ring-[#13aff0] outline-none font-medium placeholder:text-[#171C8F]/30 min-h-[28px] md:min-h-[32px] shadow-sm transition-all"
              placeholder="Digite..."
            />
            <button onClick={() => removeCause(category, idx)} className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors bg-white rounded-lg border border-slate-50" aria-label="Remover">
              <XCircle size={14} />
            </button>
          </div>
        ))}
        {analysis.ishikawa[category].attachments?.length > 0 && (
          <div className="pt-2 md:pt-3 flex flex-wrap gap-1 md:gap-2">
            {analysis.ishikawa[category].attachments.map(file => (
              <span key={file.id} className="text-[8px] md:text-[9px] font-black bg-[#e5ebf7] text-[#171C8F] px-2 md:px-3 py-1 md:py-1.5 rounded-lg flex items-center gap-1 md:gap-2 border border-[#171C8F]">
                <Paperclip size={10} /> {file.name.slice(0, 12)}...
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1 md:gap-2 pt-1 md:pt-2 border-t border-white">
        <button onClick={() => addCause(category)} className="text-[7px] md:text-[8px] text-[#171C8F] font-black bg-white border border-[#dce4f5] py-1.5 md:py-2 rounded-xl hover:bg-[#e5ebf7] transition-all uppercase tracking-widest shadow-sm flex items-center justify-center gap-1">
          <Plus size={10} /> Causa
        </button>
        <button onClick={() => fileInputRefs[category].current?.click()} className="text-[7px] md:text-[8px] text-[#171C8F] font-black bg-white border border-slate-100 py-1.5 md:py-2 rounded-xl hover:bg-slate-50 transition-all uppercase tracking-widest shadow-sm flex items-center justify-center gap-1">
          <Paperclip size={10} /> Anexar
        </button>
        <input type="file" ref={fileInputRefs[category]} onChange={(e) => handleFileUpload(category, e)} className="hidden" />
      </div>
    </section>
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-lg md:text-xl font-bold border-b pb-2 md:pb-4 text-slate-800">5. Diagrama de Ishikawa (Causa e Efeito)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
        {renderCategory('machine', 'Máquina', Settings)}
        {renderCategory('method', 'Método', Book)}
        {renderCategory('manpower', 'Mão de Obra', Users)}
        {renderCategory('material', 'Material', Box)}
        {renderCategory('measurement', 'Medição', Ruler)}
        {renderCategory('environment', 'Meio Ambiente', Leaf)}
      </div>
    </div>
  );
};

export default IshikawaComponent;
