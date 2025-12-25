
import React, { useState, useEffect } from 'react';
import Breadcrumbs from './Breadcrumbs';
import { Category, Language, AuditResponse } from '../types';
import { initialDataAr, initialDataEn } from '../constants';
import { GoogleGenAI, Type } from "@google/genai";

declare var XLSX: any;

const getApiKey = () => {
  try {
    return (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : '';
  } catch (e) {
    return '';
  }
};

const SEOChecklistTool: React.FC = () => {
  const [lang, setLang] = useState<Language>('ar');
  const [categories, setCategories] = useState<Category[]>(initialDataAr);
  const [activeTab, setActiveTab] = useState(initialDataAr[0]?.id || 'foundation');
  const [progress, setProgress] = useState(0);
  
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedData = localStorage.getItem(`ouj_seo_checklist_v4_${lang}`);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (Array.isArray(parsed)) setCategories(parsed);
      } catch (e) {
        setCategories(lang === 'ar' ? initialDataAr : initialDataEn);
      }
    } else {
      setCategories(lang === 'ar' ? initialDataAr : initialDataEn);
    }
  }, [lang]);

  useEffect(() => {
    let total = 0, completed = 0;
    categories.forEach(c => c.items.forEach(i => { total++; if (i.isCompleted) completed++; }));
    setProgress(total === 0 ? 0 : Math.round((completed / total) * 100));
    localStorage.setItem(`ouj_seo_checklist_v4_${lang}`, JSON.stringify(categories));
  }, [categories, lang]);

  const toggleItem = (catId: string, itemId: string) => {
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, isCompleted: !i.isCompleted } : i) } : c));
  };

  const runAutoAudit = async () => {
    if (!url || !url.trim().startsWith('http')) {
      setError(lang === 'ar' ? 'يرجى إدخال رابط صحيح (http/https)' : 'Valid URL required');
      return;
    }
    const apiKey = getApiKey();
    if (!apiKey) { setError(lang === 'ar' ? 'مفتاح API مفقود' : 'API Key missing'); return; }

    setIsAnalyzing(true);
    setError(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `Role: SEO Expert Audit Tool. Task: Audit URL ${url}. Match results with IDs f-1 to off-5. Output valid JSON only. Arabic language.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Analyze this site: ${url}`,
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overall_score: { type: Type.NUMBER },
              checklist_results: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { task_id: { type: Type.STRING }, status: { type: Type.STRING }, reason: { type: Type.STRING } }
                }
              },
              ai_recommendations: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, advice: { type: Type.STRING } } },
              content_gap: { type: Type.STRING },
              priority_action: { type: Type.STRING }
            }
          }
        }
      });

      const res = JSON.parse(response.text);
      setAuditResult(res);
      setCategories(prev => prev.map(cat => ({
        ...cat,
        items: cat.items.map(item => {
          const match = res.checklist_results.find((r: any) => r.task_id === item.id);
          return match ? { ...item, isCompleted: match.status === 'pass' } : item;
        })
      })));
    } catch (err) {
      setError(lang === 'ar' ? 'فشل الاتصال بالمحرك الذكي' : 'AI connection failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportToExcel = () => {
    const data: any[] = [];
    categories.forEach(cat => {
      cat.items.forEach(item => {
        const aiMatch = auditResult?.checklist_results.find(r => r.task_id === item.id);
        data.push({
          'القسم': cat.name,
          'المهمة': item.task,
          'الحالة': item.isCompleted ? 'مكتمل' : 'غير مكتمل',
          'الأولوية': item.priority,
          'تحليل الذكاء الاصطناعي': aiMatch?.reason || 'لا يوجد'
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SEO Audit");
    XLSX.writeFile(wb, `OujSEO_Audit_${new Date().toLocaleDateString()}.xlsx`);
  };

  const printReport = () => window.print();

  return (
    <section className={`bg-slate-950 min-h-screen text-slate-100 pb-20 selection:bg-emerald-500/30 ${lang === 'en' ? 'ltr' : 'rtl'}`} dir={lang === 'en' ? 'ltr' : 'rtl'}>
      {/* Print View Only */}
      <div className="print-only p-10 bg-white text-slate-900">
        <h1 className="text-4xl font-bold mb-4 text-emerald-600">OujSEO Audit Pro - تقرير التدقيق</h1>
        <p className="mb-8 text-slate-500 border-b pb-4">رابط الموقع: {url || 'يدوي'} | التاريخ: {new Date().toLocaleDateString()}</p>
        
        {auditResult && (
          <div className="mb-10 grid grid-cols-3 gap-4">
            <div className="p-4 border rounded"><strong>الدرجة الكلية:</strong> {auditResult.overall_score}%</div>
            <div className="p-4 border rounded"><strong>المهمة العاجلة:</strong> {auditResult.priority_action}</div>
            <div className="p-4 border rounded"><strong>فجوة المحتوى:</strong> {auditResult.content_gap}</div>
          </div>
        )}

        <table className="w-full border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100">
              <th className="border p-2">المهمة</th>
              <th className="border p-2">الحالة</th>
              <th className="border p-2">الأولوية</th>
            </tr>
          </thead>
          <tbody>
            {categories.flatMap(c => c.items).map(i => (
              <tr key={i.id}>
                <td className="border p-2">{i.task}</td>
                <td className="border p-2 text-center">{i.isCompleted ? '✅' : '❌'}</td>
                <td className="border p-2 text-center">{i.priority}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="no-print">
        <Breadcrumbs items={[{ label: lang === 'ar' ? 'أدوات السيو' : 'SEO Tools', path: '#' }, { label: lang === 'ar' ? 'تدقيق السيو الذكي' : 'AI SEO Audit' }]} />
        
        <div className="container mx-auto px-6">
          <div className="bg-[#0f172a] rounded-[2.5rem] p-6 lg:p-12 shadow-2xl border border-slate-800 max-w-7xl mx-auto relative overflow-hidden">
            
            {/* Animated BG Decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] -mr-48 -mt-48"></div>
            
            {/* Header section */}
            <div className="grid md:grid-cols-3 gap-8 mb-12 relative z-10">
              <div className="md:col-span-2">
                <div className="flex items-center gap-5 mb-6">
                  <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-[1.5rem] flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                    <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div>
                    <h2 className="text-4xl font-black text-white tracking-tight leading-none">OujSEO <span className="text-emerald-500">Pro</span></h2>
                    <p className="text-slate-500 text-sm mt-2 font-bold uppercase tracking-widest">{lang === 'ar' ? 'مدعوم بمحرك Gemini 3 Pro الذكي' : 'Powered by Gemini 3 Pro AI'}</p>
                  </div>
                </div>

                {/* Search Bar with Integrated Loading */}
                <div className="relative group max-w-2xl">
                  <div className={`absolute -inset-1 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-3xl blur opacity-20 transition duration-1000 ${isAnalyzing ? 'opacity-60 animate-pulse' : ''}`}></div>
                  <div className="relative flex flex-col sm:flex-row gap-2 p-3 bg-slate-900/80 backdrop-blur-md rounded-[2rem] border border-slate-700/50">
                    <input 
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder={lang === 'ar' ? "أدخل رابط موقعك للفحص العميق..." : "Enter URL for deep audit..."}
                      className="flex-grow bg-transparent border-none focus:ring-0 text-white px-5 py-3 text-base placeholder:text-slate-600"
                    />
                    <button 
                      onClick={runAutoAudit}
                      disabled={isAnalyzing}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white px-10 py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                          <span>{lang === 'ar' ? 'جاري الفحص...' : 'Auditing...'}</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          <span>{lang === 'ar' ? 'بدء الفحص الذكي' : 'Start AI Audit'}</span>
                        </>
                      )}
                    </button>
                  </div>
                  {error && <p className="text-red-400 text-xs mt-4 px-4 font-bold flex items-center gap-2"><span className="w-2 h-2 bg-red-400 rounded-full animate-ping"></span> {error}</p>}
                </div>
              </div>

              {/* Progress Radar Card */}
              <div className="bg-slate-900/50 rounded-[2.5rem] p-8 border border-slate-800 flex flex-col items-center justify-center text-center relative group">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364} strokeDashoffset={364 - (364 * (auditResult ? auditResult.overall_score : progress)) / 100} className="text-emerald-500 transition-all duration-1000 ease-out" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-white">{auditResult ? auditResult.overall_score : progress}%</span>
                  </div>
                </div>
                <p className="mt-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{lang === 'ar' ? 'الدرجة الكلية للسيو' : 'Overall SEO Score'}</p>
              </div>
            </div>

            {/* AI Insight Section */}
            {auditResult && !isAnalyzing && (
              <div className="grid md:grid-cols-3 gap-6 mb-12 animate-in fade-in slide-in-from-bottom-6">
                <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 p-8 rounded-[2.5rem]">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
                    <h4 className="font-black text-white uppercase text-xs tracking-widest">{lang === 'ar' ? 'توصيات الميتا' : 'Meta Recommendations'}</h4>
                  </div>
                  <p className="text-slate-300 text-sm font-bold bg-slate-950/50 p-4 rounded-2xl mb-3 border border-slate-800/50 leading-relaxed"><span className="text-emerald-500 block text-[10px] uppercase mb-1">TITLE:</span> {auditResult.ai_recommendations.title}</p>
                  <p className="text-slate-400 text-xs font-medium bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 leading-relaxed"><span className="text-emerald-500 block text-[10px] uppercase mb-1">META:</span> {auditResult.ai_recommendations.description}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 p-8 rounded-[2.5rem]">
                   <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
                    <h4 className="font-black text-white uppercase text-xs tracking-widest">{lang === 'ar' ? 'فجوة المحتوى' : 'Content Gap'}</h4>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed font-medium">{auditResult.content_gap}</p>
                </div>
                <div className="bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20 p-8 rounded-[2.5rem]">
                   <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-red-500/20 text-red-400 rounded-xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
                    <h4 className="font-black text-white uppercase text-xs tracking-widest">{lang === 'ar' ? 'أولوية التنفيذ' : 'Priority Action'}</h4>
                  </div>
                  <div className="bg-red-500/10 p-5 rounded-2xl border border-red-500/20">
                    <p className="text-red-200 text-sm font-black leading-relaxed">{auditResult.priority_action}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Checklist Tabs and Items */}
            <div className="grid lg:grid-cols-4 gap-10">
              <div className="lg:col-span-1 space-y-3">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id)}
                    className={`w-full flex items-center justify-between p-5 rounded-[1.5rem] font-bold text-sm transition-all border group ${activeTab === cat.id ? 'bg-emerald-600 border-emerald-500 text-white shadow-2xl shadow-emerald-900/40' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:bg-slate-800'}`}
                  >
                    <span className="truncate">{cat.name.split('. ')[1] || cat.name}</span>
                    <span className={`text-[10px] font-black px-3 py-1 rounded-lg ${activeTab === cat.id ? 'bg-white/20' : 'bg-slate-950'}`}>
                      {cat.items.filter(i => i.isCompleted).length}/{cat.items.length}
                    </span>
                  </button>
                ))}
              </div>
              <div className="lg:col-span-3">
                <div className="space-y-4">
                  {categories.find(c => c.id === activeTab)?.items.map(item => (
                    <div key={item.id} className={`p-6 rounded-[2rem] border transition-all flex items-start gap-6 relative group/item ${item.isCompleted ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-900/30 border-slate-800 hover:border-slate-600'}`}>
                      <button onClick={() => toggleItem(activeTab, item.id)} className={`mt-1 w-9 h-9 rounded-2xl border-2 flex items-center justify-center shrink-0 transition-all ${item.isCompleted ? 'bg-emerald-500 border-emerald-500 text-white rotate-0' : 'border-slate-700 text-transparent hover:border-emerald-500 hover:rotate-12'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                      <div className="flex-grow">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h3 className={`font-black text-xl tracking-tight transition-all ${item.isCompleted ? 'text-emerald-400 line-through' : 'text-white'}`}>{item.task}</h3>
                          <span className={`text-[9px] px-3 py-1 rounded-lg border font-black uppercase ${item.priority === 'High' ? 'bg-red-500/10 text-red-500 border-red-500/20' : item.priority === 'Medium' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>{item.priority}</span>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed font-medium">{item.description}</p>
                        {auditResult?.checklist_results.find(r => r.task_id === item.id) && (
                          <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-start gap-3">
                             <div className="text-[10px] font-black bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded uppercase shrink-0 tracking-tighter">AI Analysis</div>
                             <p className="text-[11px] font-bold text-slate-500 italic leading-relaxed">{auditResult.checklist_results.find(r => r.task_id === item.id)?.reason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="mt-16 pt-10 border-t border-slate-800 flex flex-wrap gap-5 justify-between items-center">
              <div className="flex flex-wrap gap-4">
                <button onClick={printReport} className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-2xl text-sm font-black flex items-center gap-3 transition-all shadow-xl active:scale-95">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {lang === 'ar' ? 'حفظ بصيغة PDF' : 'Save as PDF'}
                </button>
                <button onClick={exportToExcel} className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-2xl text-sm font-black flex items-center gap-3 transition-all shadow-xl active:scale-95">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {lang === 'ar' ? 'تصدير إلى Excel' : 'Export to Excel'}
                </button>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">{lang === 'ar' ? 'صُنع بواسطة' : 'Developed By'}</span>
                <span className="bg-emerald-500/10 text-emerald-500 px-4 py-1 rounded-lg font-black text-xs border border-emerald-500/20 shadow-lg shadow-emerald-500/5">OUJSEO CORE</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default SEOChecklistTool;
