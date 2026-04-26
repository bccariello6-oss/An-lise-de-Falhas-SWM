import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, ListChecks, BarChart3, PieChart as PieChartIcon, Search, ChevronDown, FileText, Trash2, FolderOpen, Bell, X } from 'lucide-react';
import { Analysis } from '../types';

interface DashboardProps {
  onLoad: (analysis: Analysis) => void;
  onDelete: (id: string) => void;
  onDeleteSuccess?: () => void;
  user: any;
  profile: any;
}

import * as db from '../services/supabaseService';

const COLORS = ['#171C8F', '#13aff0', '#10b981', '#5c6eb1'];

const Dashboard: React.FC<DashboardProps> = ({ onLoad, onDelete, onDeleteSuccess, user, profile }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState('Todas');
  const [history, setHistory] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [notifications, setNotifications] = useState<Analysis[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const lastCountRef = useRef(0);

  const isAdmin = profile?.role === 'ADMIN';

  const [periodFilter, setPeriodFilter] = useState('Todos');

  const verificationAlerts = useMemo(() => {
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
    const approachingMs = 75 * 24 * 60 * 60 * 1000; // 15 days before deadline
    const now = Date.now();
    
    let overdueCount = 0;
    let approachingCount = 0;

    history.forEach(item => {
      const noEvidenceText = !item.effectivenessEvidence || item.effectivenessEvidence.trim() === '';
      const noAttachments = !item.verificationAttachments || item.verificationAttachments.length === 0;
      const noChecklist = !item.verificationChecklist || !item.verificationChecklist.some(c => c.checked);
      
      const noEvidence = noEvidenceText && noAttachments && noChecklist;

      if (noEvidence) {
        const ageMs = now - new Date(item.failureDate).getTime();
        if (ageMs >= ninetyDaysMs) {
          overdueCount++;
        } else if (ageMs >= approachingMs) {
          approachingCount++;
        }
      }
    });

    return { overdueCount, approachingCount };
  }, [history]);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user, profile, refreshKey]);

  useEffect(() => {
    if (!isAdmin || !user?.id) return;
    
    const interval = setInterval(async () => {
      try {
        const data = await db.fetchAnalyses(user.id, true);
        if (data.length > lastCountRef.current) {
          const newAnalyses = data.slice(0, data.length - lastCountRef.current);
          setNotifications(prev => [...prev, ...newAnalyses].slice(-5));
          setShowNotification(true);
        }
        lastCountRef.current = data.length;
      } catch (error) {
        console.error('Error polling:', error);
      }
    }, 15000);
    
    return () => clearInterval(interval);
  }, [isAdmin, user]);

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
      const mainAuthor = item.team?.[0]?.name || '';
      const matchesSearch = 
        item.equipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mainAuthor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesArea = areaFilter === 'Todas' || item.area === areaFilter;
      
      let matchesPeriod = true;
      if (periodFilter !== 'Todos') {
        const itemDate = new Date(item.failureDate).getTime();
        const now = Date.now();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        const ninetyDays = 90 * 24 * 60 * 60 * 1000;
        if (periodFilter === 'Últimos 30 dias') {
           matchesPeriod = (now - itemDate) <= thirtyDays;
        } else if (periodFilter === 'Últimos 90 dias') {
           matchesPeriod = (now - itemDate) <= ninetyDays;
        } else if (periodFilter === 'Este Ano') {
           matchesPeriod = new Date(item.failureDate).getFullYear() === new Date().getFullYear();
        }
      }
      
      return matchesSearch && matchesArea && matchesPeriod;
    }).sort((a, b) => new Date(b.failureDate).getTime() - new Date(a.failureDate).getTime());
  }, [history, searchTerm, areaFilter, periodFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#171C8F]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn pb-20 relative">

      {/* Sticky Header with Filters */}
      <div className="sticky top-0 z-40 bg-[#fcfdff]/90 backdrop-blur-md pt-2 pb-4 border-b border-slate-200 mb-6 -mx-4 px-4 sm:-mx-6 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-white rounded-lg p-1 shadow-sm border border-slate-100 flex items-center justify-center">
                <img 
                  src="/opex-logo-final.png" 
                  alt="OPEX" 
                  className="w-full h-auto object-contain" 
                  style={{ filter: 'invert(11%) sepia(85%) saturate(3755%) hue-rotate(234deg) brightness(88%) contrast(98%)' }}
                />
             </div>
             <h2 className="text-xl font-bold text-[#171C8F]">Dashboard</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text"
                placeholder="Buscar (Ativo, Autor, ID)..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#13aff0] outline-none shadow-sm font-medium"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-32">
                <select 
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-[#13aff0] appearance-none shadow-sm"
                  value={areaFilter}
                  onChange={e => setAreaFilter(e.target.value)}
                >
                  {areas.map(area => <option key={area} value={area}>{area}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              </div>
              <div className="relative flex-1 sm:w-40">
                <select 
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-[#13aff0] appearance-none shadow-sm"
                  value={periodFilter}
                  onChange={e => setPeriodFilter(e.target.value)}
                >
                  {['Todos', 'Últimos 30 dias', 'Últimos 90 dias', 'Este Ano'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {(verificationAlerts.overdueCount > 0 || verificationAlerts.approachingCount > 0) && (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {verificationAlerts.overdueCount > 0 && (
            <div className="flex-1 bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-4 shadow-sm animate-slideDown">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                 <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <h4 className="text-red-800 font-black text-xs uppercase tracking-widest">Atenção: Verificações Atrasadas</h4>
                <p className="text-[10px] text-red-700 font-bold mt-1">Existem {verificationAlerts.overdueCount} análises com mais de 90 dias sem evidências de eficácia registradas.</p>
              </div>
            </div>
          )}
          {verificationAlerts.approachingCount > 0 && (
            <div className="flex-1 bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-4 shadow-sm animate-slideDown">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                 <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <div>
                <h4 className="text-amber-800 font-black text-xs uppercase tracking-widest">Atenção: Prazos se Aproximando</h4>
                <p className="text-[10px] text-amber-700 font-bold mt-1">Existem {verificationAlerts.approachingCount} análises faltando 15 dias ou menos para o limite de 90 dias (sem evidências de eficácia).</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Real-time Notification Toast for Admin */}
      {isAdmin && notifications.length > 0 && showNotification && (
        <div className="fixed top-4 right-4 z-50 animate-slideDown">
          <div className="bg-gradient-to-r from-[#171C8F] to-[#13aff0] text-white p-4 rounded-xl shadow-2xl max-w-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                  <Bell size={16} />
                </div>
                <div>
                  <p className="font-black text-xs uppercase">Nova Análise!</p>
                  <p className="text-[10px] opacity-90">{notifications[notifications.length - 1]?.equipment || 'Novo registro'}</p>
                  <p className="text-[9px] opacity-75">{notifications[notifications.length - 1]?.area || ''}</p>
                </div>
              </div>
              <button onClick={() => setShowNotification(false)} className="text-white/70 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <button 
              onClick={() => {
                const latest = notifications[notifications.length - 1];
                if (latest) onLoad(latest);
                setNotifications([]);
                setShowNotification(false);
              }}
              className="w-full mt-3 bg-white text-[#171C8F] py-2 rounded-lg text-[10px] font-black uppercase hover:bg-gray-50 transition-colors"
            >
              Ver Análise
            </button>
          </div>
        </div>
      )}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
      `}</style>

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-8">
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
      <section className="space-y-4 pt-4">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b pb-2">
          <FileText size={16} className="text-[#171C8F]" /> Histórico de Análises
        </h3>
        <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar pt-2">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((item: any) => {
              const mainAuthor = item.team?.[0]?.name || '';
              return (
              <div key={item.id} className="bg-white border border-slate-100 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:shadow-sm transition-all group">
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center flex-shrink-0 group-hover:border-[#171C8F] transition-all shadow-sm">
                    <span className="text-[9px] font-black text-[#171C8F]">
                      {mainAuthor.toUpperCase().includes('MANUT') || mainAuthor.toUpperCase().includes('MANUTENÇÃO') ? 'MANUT' : 
                       mainAuthor.substring(0, 2).toUpperCase() || 
                       item.area?.substring(0, 2).toUpperCase() || 
                       'US'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-[7px] font-black text-[#171C8F] bg-[#e5ebf7] px-1.5 py-0.5 rounded-md uppercase tracking-widest">{item.sequentialNumber ? `#${item.sequentialNumber}` : item.id}</span>
                      <time dateTime={item.failureDate} className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{new Date(item.failureDate).toLocaleDateString('pt-BR')}</time>
                    </div>
                    <h4 className="text-xs font-black text-slate-800 leading-tight truncate group-hover:text-[#171C8F] transition-colors">{item.equipment || "Equipamento s/ Nome"}</h4>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
                      {item.area || "Sem Área"} <span className="text-slate-200 mx-1">|</span> <span className="text-slate-400 font-black">{mainAuthor || "Sem Nome"}</span>
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
                    onClick={async () => {
                      await onDelete(item.id);
                      setRefreshKey(k => k + 1);
                      if (onDeleteSuccess) onDeleteSuccess();
                    }}
                    className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 transition-all bg-slate-50 hover:bg-red-50 rounded-lg border border-slate-100"
                    aria-label="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )})
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