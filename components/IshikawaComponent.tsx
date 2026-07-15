
import React, { useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { Analysis, Attachment } from '../types';
import { getIshikawaQuestions } from '../constants';
import { Settings, Book, Users, Box, Ruler, Leaf, XCircle, Paperclip, Plus } from 'lucide-react';

interface Props {
  analysis: Analysis;
  updateAnalysis: (data: Partial<Analysis>) => void;
}

const IshikawaComponent: React.FC<Props> = ({ analysis, updateAnalysis }) => {
  const { t } = useI18n();

  const [activeCauseIndex, setActiveCauseIndex] = useState<{ [cat: string]: number | undefined }>({});
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
    if (newIshikawa[category].attachments) {
      newIshikawa[category].attachments = newIshikawa[category].attachments
        .filter(a => a.causeIndex !== index)
        .map(a => {
          if (a.causeIndex !== undefined && a.causeIndex > index) {
            return { ...a, causeIndex: a.causeIndex - 1 };
          }
          return a;
        });
    }
    updateAnalysis({ ishikawa: newIshikawa });
  };

  const removeAttachment = (category: keyof Analysis['ishikawa'], attId: string) => {
    const newIshikawa = { ...analysis.ishikawa };
    newIshikawa[category].attachments = (newIshikawa[category].attachments || []).filter(a => a.id !== attId);
    updateAnalysis({ ishikawa: newIshikawa });
  };

  const handleFileUpload = (category: keyof Analysis['ishikawa'], e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const causeIdx = activeCauseIndex[category];
    const reader = new FileReader();
    reader.onload = (event) => {
      const newAttachment: Attachment = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: event.target?.result as string,
        causeIndex: causeIdx,
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
      <p className="text-[7px] md:text-[8px] text-slate-400 italic leading-tight px-1 font-medium">{getIshikawaQuestions(t)[category]}</p>
      
      <div className="space-y-2 flex-1 my-1">
        {analysis.ishikawa[category].causes.map((cause, idx) => {
          const causeAttachments = (analysis.ishikawa[category].attachments || []).filter(a => a.causeIndex === idx);
          return (
            <div key={idx} className="flex flex-col gap-1.5 group animate-fadeIn bg-white p-1.5 md:p-2 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex gap-1 md:gap-2 items-center">
                <input
                  type="text"
                  value={cause}
                  onChange={(e) => handleCauseChange(category, idx, e.target.value)}
                  className="flex-1 text-[10px] md:text-[11px] bg-[#e5ebf7] border border-[#dce4f5] text-[#171C8F] rounded-lg px-2 md:px-3 py-1 md:py-1.5 focus:ring-1 focus:ring-[#13aff0] outline-none font-medium placeholder:text-[#171C8F]/30 min-h-[28px] md:min-h-[32px] shadow-sm transition-all"
                  placeholder={t('step4.typeCause')}
                />
                <button
                  onClick={() => {
                    setActiveCauseIndex(prev => ({ ...prev, [category]: idx }));
                    fileInputRefs[category].current?.click();
                  }}
                  title="Anexar evidência para esta causa"
                  className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center text-[#171C8F] hover:bg-[#e5ebf7] transition-all bg-slate-50 rounded-lg border border-slate-200 shadow-xs shrink-0 cursor-pointer"
                >
                  <Paperclip size={14} />
                </button>
                <button onClick={() => removeCause(category, idx)} className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors bg-white rounded-lg border border-slate-50 shrink-0 cursor-pointer" aria-label="Remover">
                  <XCircle size={14} />
                </button>
              </div>
              {causeAttachments.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1 pl-1 border-t border-slate-50">
                  {causeAttachments.map(file => (
                    <span key={file.id} className="text-[8px] md:text-[9px] font-black bg-[#e5ebf7] text-[#171C8F] px-2 py-1 rounded-md flex items-center gap-1 border border-[#171C8F]/30 shadow-xs">
                      <Paperclip size={10} /> {file.name.slice(0, 15)}...
                      <button onClick={() => removeAttachment(category, file.id)} className="text-red-500 hover:text-red-700 ml-1 cursor-pointer" title="Remover anexo">
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {(() => {
          const legacyAttachments = (analysis.ishikawa[category].attachments || []).filter(a => a.causeIndex === undefined);
          if (legacyAttachments.length === 0) return null;
          return (
            <div className="pt-2 md:pt-3 flex flex-wrap gap-1 md:gap-2 border-t border-slate-100 mt-2">
              <span className="text-[8px] font-bold text-slate-400 block w-full">{t('step4.categoryAttachments')}</span>
              {legacyAttachments.map(file => (
                <span key={file.id} className="text-[8px] md:text-[9px] font-black bg-[#e5ebf7] text-[#171C8F] px-2 md:px-3 py-1 md:py-1.5 rounded-lg flex items-center gap-1 md:gap-2 border border-[#171C8F]">
                  <Paperclip size={10} /> {file.name.slice(0, 12)}...
                  <button onClick={() => removeAttachment(category, file.id)} className="text-red-500 hover:text-red-700 ml-1 cursor-pointer" title="Remover anexo">
                    &times;
                  </button>
                </span>
              ))}
            </div>
          );
        })()}
      </div>

      <div className="pt-1 md:pt-2 border-t border-white mt-auto">
        <button onClick={() => addCause(category)} className="w-full text-[7px] md:text-[8px] text-[#171C8F] font-black bg-white border border-[#dce4f5] py-1.5 md:py-2 rounded-xl hover:bg-[#e5ebf7] transition-all uppercase tracking-widest shadow-sm flex items-center justify-center gap-1 cursor-pointer">
          <Plus size={10} />{t('step4.addCause')}</button>
        <input type="file" ref={fileInputRefs[category]} onChange={(e) => handleFileUpload(category, e)} className="hidden" />
      </div>
    </section>
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-lg md:text-xl font-bold border-b pb-2 md:pb-4 text-[#171C8F]">{t('step4.title')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
        {renderCategory('machine', t('step4.machine'), Settings)}
        {renderCategory('method', t('step4.method'), Book)}
        {renderCategory('manpower', t('step4.manpower'), Users)}
        {renderCategory('material', t('step4.material'), Box)}
        {renderCategory('measurement', t('step4.measurement'), Ruler)}
        {renderCategory('environment', t('step4.environment'), Leaf)}
      </div>
    </div>
  );
};

export default IshikawaComponent;
