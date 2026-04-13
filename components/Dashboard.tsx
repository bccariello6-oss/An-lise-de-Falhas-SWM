
import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, ListChecks, BarChart3, PieChart as PieChartIcon, Search, ChevronDown, FileText, Trash2, FolderOpen } from 'lucide-react';
import { Analysis } from '../types';

interface DashboardProps {
  onLoad: (analysis: Analysis) => void;
  onDelete: (id: string) => void;
  user: any;
  profile: any;
}

import * as db from '../services/supabaseService';

const COLORS = ['#171C8F', '#13aff0', '#10b981', '#5c6eb1'];

const Dashboard: React.FC<DashboardProps> = ({ onLoad, onDelete, user, profile }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState('Todas');
  const [history, setHistory] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = profile?.role === 'ADMIN';

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user, profile]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await db.fetchAnalyses(user.id, isAdmin);
      setHistory(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = history.length;
    const openActions = history.reduce((acc, curr) => acc + (curr.actions?.filter(a => a.status !== 'Concluída').length || 0), 0);
    const effective = history.filter(h => h.reoccurred === false).length;
    
    return {
      total,
      openActions,
    };
  }, [history]);

  const chartData = useMemo(() => {
    const areas: Record<string, number> = {};
    const causes: Record<string, number> = {};

    history.forEach(item => {
      if (item.area) areas[item.area] = (areas[item.area] || 0) + 1;
      // Simplified root cause categorization for the chart
      const cause = item.rootCause ? (item.rootCause.length > 15 ? item.rootCause.substring(0, 15) + '...' : item.rootCause) : 'Não definida';
      causes[cause] = (causes[cause] || 0) + 1;
    });

    return {
      byArea: Object.entries(areas).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5),
      byRootCause: Object.entries(causes).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 4)
    };
  }, [history]);

  const areas = useMemo(() => {
    const uniqueAreas = new Set(history.map(a => a.area).filter(Boolean));
    return ['Todas', ...Array.from(uniqueAreas)];
  }, [history]);

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const matchesSearch = 
        item.equipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesArea = areaFilter === 'Todas' || item.area === areaFilter;
      
      return matchesSearch && matchesArea;
    }).sort((a, b) => new Date(b.failureDate).getTime() - new Date(a.failureDate).getTime());
  }, [history, searchTerm, areaFilter]);

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: 'Total Falhas', val: stats.total.toString(), sub: 'Registradas', icon: <AlertTriangle size={14} />, color: 'text-slate-900' },
          { label: 'Ações Abertas', val: stats.openActions.toString(), sub: 'Pendentes', icon: <ListChecks size={14} />, color: 'text-[#171C8F]' },
        ].map((card, i) => (
          <div key={i} className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col justify-between h-[80px] shadow-sm">
            <div className="flex justify-between items-start">
              <h4 className="text-[8px] text-slate-400 font-black uppercase tracking-widest">{card.label}</h4>
              <div className={card.color}>{card.icon}</div>
            </div>
            <div className="flex items-baseline gap-2">
               <p className={`text-xl font-black ${card.color}`}>{card.val}</p>
               <span className="text-[7px] font-bold text-slate-300 uppercase tracking-tighter">{card.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
            <BarChart3 size={14} className="text-[#171C8F]" /> Falhas por Área
          </h3>
          <div className="h-[140px] -ml-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.byArea.length > 0 ? chartData.byArea : [{name: 'Sem dados', count: 0}]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 700, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 700, fill: '#cbd5e1'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 700, fontSize: '8px'}} />
                <Bar dataKey="count" fill="#171C8F" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-2 flex items-center gap-2">
            <PieChartIcon size={14} className="text-[#171C8F]" /> Causa Raiz
          </h3>
          <div className="h-[120px] flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={chartData.byRootCause.length > 0 ? chartData.byRootCause : [{name: 'Sem dados', value: 100}]} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={35} 
                  outerRadius={50} 
                  paddingAngle={5} 
                  dataKey="value" 
                  stroke="none"
                >
                  {chartData.byRootCause.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  {chartData.byRootCause.length === 0 && <Cell fill="#f1f5f9" />}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700, fontSize: '10px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {chartData.byRootCause.map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor: COLORS[i % COLORS.length]}}></span>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-tight truncate">{item.name}</span>
                <span className="ml-auto text-[8px] font-black text-slate-400">{item.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* History Table Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <FileText size={16} className="text-[#171C8F]" /> Histórico de Análises
            </h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text"
                placeholder="Buscar..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#13aff0] outline-none shadow-sm font-medium"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative flex-1 sm:w-48">
              <select 
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-[#13aff0] appearance-none shadow-sm"
                value={areaFilter}
                onChange={e => setAreaFilter(e.target.value)}
              >
                {areas.map(area => <option key={area} value={area}>{area}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredHistory.length > 0 ? (
            filteredHistory.map(item => (
              <div key={item.id} className="bg-white border border-slate-100 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:shadow-sm transition-all group">
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-100 p-1 flex items-center justify-center flex-shrink-0 group-hover:border-[#171C8F] transition-all shadow-sm">
                    <img src="/swm-logo.png" alt="SWM" className="w-full h-auto object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-[7px] font-black text-[#171C8F] bg-[#e5ebf7] px-1.5 py-0.5 rounded-md uppercase tracking-widest">{item.id}</span>
                      <time dateTime={item.failureDate} className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{new Date(item.failureDate).toLocaleDateString('pt-BR')}</time>
                    </div>
                    <h4 className="text-xs font-black text-slate-800 leading-tight truncate group-hover:text-[#171C8F] transition-colors">{item.equipment || "Equipamento s/ Nome"}</h4>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                      {item.area || "Sem Área"} <span className="text-slate-200 mx-1">|</span> <span className="text-slate-400 font-black">{item.tag || "Sem Tag"}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => onLoad(item)}
                    className="flex-1 sm:flex-initial bg-[#171C8F] text-white text-[8px] font-black uppercase tracking-widest px-6 py-2 rounded-lg hover:bg-black transition-all shadow-sm active:scale-95"
                  >
                    Abrir Relatório
                  </button>
                  <button 
                    onClick={() => onDelete(item.id)}
                    className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 transition-all bg-slate-50 hover:bg-red-50 rounded-lg border border-slate-100"
                    aria-label="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
              <FolderOpen size={24} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Nenhum registro encontrado</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
