
import React, { useState, useEffect } from 'react';
import Breadcrumbs from './Breadcrumbs';
import { Category, Language, AuditResponse } from '../types';
import { initialDataAr, initialDataEn } from '../constants';
import { GoogleGenAI, Type } from "@google/genai";

const SEOChecklistTool: React.FC = () => {
  const [lang, setLang] = useState<Language>('ar');
  const [categories, setCategories] = useState<Category[]>(initialDataAr);
  const [activeTab, setActiveTab] = useState(initialDataAr[0].id);
  const [progress, setProgress] = useState(0);
  
  // AI Audit States
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load saved data or initialize based on language
  useEffect(() => {
    const savedData = localStorage.getItem(`ouj_seo_checklist_v3_${lang}`);
    if (savedData) {
      try {
        setCategories(JSON.parse(savedData));
      } catch (e) {
        setCategories(lang === 'ar' ? initialDataAr : initialDataEn);
      }
    } else {
      setCategories(lang === 'ar' ? initialDataAr : initialDataEn);
    }
  }, [lang]);

  // Sync progress and localStorage
  useEffect(() => {
    let totalItems = 0;
    let completedItems = 0;
    categories.forEach(cat => {
      cat.items.forEach(item => {
        totalItems++;
        if (item.isCompleted) completedItems++;
      });
    });
    setProgress(totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100));
    localStorage.setItem(`ouj_seo_checklist_v3_${lang}`, JSON.stringify(categories));
  }, [categories, lang]);

  const toggleItem = (categoryId: string, itemId: string) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat;
      return {
        ...cat,
        items: cat.items.map(item => item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item)
      };
    }));
  };

  const runAutoAudit = async () => {
    if (!url || !url.trim().startsWith('http')) {
      setError(lang === 'ar' ? 'يرجى إدخال رابط صحيح يبدأ بـ http' : 'Please enter a valid URL starting with http');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAuditResult(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const systemInstruction = `
        Role: أنت المحرك البرمجي لأداة "OujSEO Audit Pro". مهمتك هي العمل كخبير سيو تقني (Technical SEO Auditor) ومحلل استراتيجي للمحتوى.
        
        Task: قم بإجراء فحص شامل للموقع الموجود في الرابط المقدم. استخدم أداة البحث (googleSearch) للوصول إلى بيانات الموقع الحالية، العناوين، الأوصاف، وبنية الصفحة.
        
        Analysis Logic:
        1. التحقق الهيكلي: فحص (Title, Meta Description, H1, Alt Text, HTTPS, Sitemap, Robots.txt).
        2. جودة المحتوى: تحليل نية البحث (Search Intent) والكلمات المفتاحية.
        3. السيو التقني: فحص السرعة والتوافق مع الجوال.
        
        Required Output (JSON Format Only):
        يجب أن تكون النتيجة بتنسيق JSON حصراً ويتضمن:
        - overall_score: درجة من 100.
        - checklist_results: مصفوفة تحتوي على (task_id, status: "pass"/"fail", reason).
          *ملاحظة: استخدم المعرفات التالية فقط للـ task_id: (f-1, f-2, f-3, f-4, f-5, f-6, t-1, t-2, t-3, t-4, t-5, t-6, t-7, op-1, op-2, op-3, op-4, op-5, op-6, op-7, c-1, c-2, c-3, c-4, c-5, c-6, off-1, off-2, off-3, off-4).*
        - ai_recommendations: { title: "العنوان المقترح", description: "وصف ميتا مقترح", advice: "نصيحة عامة" }.
        - content_gap: موضوع واحد مفقود يغطيه المنافسون.
        - priority_action: أهم مهمة عاجلة.

        Tone: احترافي، تقني، ومباشر باللغة العربية.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `قم بفحص وتدقيق الرابط التالي فوراً: ${url}`,
        config: {
          systemInstruction: systemInstruction,
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
                  properties: {
                    task_id: { type: Type.STRING },
                    status: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  },
                  required: ["task_id", "status", "reason"]
                }
              },
              ai_recommendations: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  advice: { type: Type.STRING }
                },
                required: ["title", "description", "advice"]
              },
              content_gap: { type: Type.STRING },
              priority_action: { type: Type.STRING }
            },
            required: ["overall_score", "checklist_results", "ai_recommendations", "content_gap", "priority_action"]
          }
        }
      });

      const responseText = response.text;
      if (responseText) {
        const result: AuditResponse = JSON.parse(responseText);
        setAuditResult(result);

        // Update checklist based on AI findings
        setCategories(prev => prev.map(cat => ({
          ...cat,
          items: cat.items.map(item => {
            const aiMatch = result.checklist_results.find(r => r.task_id === item.id);
            if (aiMatch) {
              return { ...item, isCompleted: aiMatch.status === 'pass' };
            }
            return item;
          })
        })));
      } else {
        throw new Error("Empty AI response");
      }

    } catch (err) {
      console.error("Audit Error:", err);
      setError(lang === 'ar' ? 'حدث خطأ أثناء فحص الموقع. تأكد من صحة الرابط أو حاول مرة أخرى لاحقاً.' : 'Error auditing the site. Check the URL or try again later.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetProgress = () => {
    if (window.confirm(lang === 'ar' ? 'هل أنت متأكد من إعادة تعيين كافة البيانات؟' : 'Are you sure you want to reset all data?')) {
      setCategories(lang === 'ar' ? initialDataAr : initialDataEn);
      setAuditResult(null);
      setUrl('');
      localStorage.removeItem(`ouj_seo_checklist_v3_${lang}`);
    }
  };

  const printList = () => {
    window.print();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'Medium': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'Low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-500';
    }
  };

  return (
    <section className={`bg-slate-950 min-h-screen text-slate-100 pb-20 transition-all duration-500 ${lang === 'en' ? 'ltr' : 'rtl'}`} dir={lang === 'en' ? 'ltr' : 'rtl'}>
      <div className="print:hidden">
        <Breadcrumbs items={[{ label: lang === 'ar' ? 'أدوات السيو' : 'SEO Tools', path: '#' }, { label: lang === 'ar' ? 'تدقيق السيو الذكي' : 'AI SEO Audit' }]} />
      </div>
      
      <div className="container mx-auto px-6 print:p-0">
        
        {/* Main Tool Card */}
        <div className="bg-[#1e293b] rounded-[2.5rem] p-6 lg:p-12 shadow-2xl border border-slate-700 max-w-7xl mx-auto print:shadow-none print:border-none print:bg-white print:p-0">
          
          {/* Dashboard Header */}
          <div className="grid md:grid-cols-3 gap-8 mb-12 print:hidden">
            <div className="md:col-span-2">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-emerald-500/20 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div className="flex-grow">
                  <h2 className="text-4xl font-black text-white tracking-tight">
                    OujSEO Audit Pro
                  </h2>
                  <p className="text-slate-400 text-sm mt-1 font-medium">
                    {lang === 'ar' ? 'فحص تقني وتحليل محتوى فوري مدعوم بالذكاء الاصطناعي.' : 'Instant AI-powered technical and content audit.'}
                  </p>
                </div>
                <button 
                  onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')}
                  className="w-12 h-12 bg-slate-800 rounded-xl text-lg font-black text-white border border-slate-700 hover:border-emerald-500 transition-all flex items-center justify-center shadow-xl"
                >
                  {lang === 'ar' ? 'E' : 'ع'}
                </button>
              </div>

              {/* URL Input Area */}
              <div className="relative group max-w-2xl">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex flex-col sm:flex-row gap-2 p-2 bg-slate-900 rounded-2xl border border-slate-700">
                  <input 
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={lang === 'ar' ? "أدخل رابط الموقع كاملاً (https://...)" : "Enter full URL (https://...)"}
                    className="flex-grow bg-transparent border-none focus:ring-0 text-white px-4 py-3 text-sm"
                  />
                  <button 
                    onClick={runAutoAudit}
                    disabled={isAnalyzing}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40"
                  >
                    {isAnalyzing ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    )}
                    {lang === 'ar' ? 'ابدأ الفحص' : 'Start Audit'}
                  </button>
                </div>
                {error && <p className="text-red-400 text-xs mt-3 px-2 font-bold flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  {error}
                </p>}
              </div>
            </div>

            {/* Progress / Score Card */}
            <div className="bg-slate-900 rounded-[2rem] p-8 border border-slate-700 flex flex-col justify-center items-center text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent"></div>
              <div className="relative z-10 w-full">
                {auditResult ? (
                  <>
                    <div className="text-6xl font-black text-emerald-400 mb-2 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)] animate-in zoom-in duration-500">{auditResult.overall_score}</div>
                    <div className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">{lang === 'ar' ? 'الدرجة الكلية للسيو' : 'Overall SEO Score'}</div>
                  </>
                ) : (
                  <>
                    <div className="text-4xl font-black text-white mb-2">{progress}%</div>
                    <div className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">{lang === 'ar' ? 'اكتمال المهام اليدوية' : 'Manual Task Progress'}</div>
                  </>
                )}
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                    style={{ width: `${auditResult ? auditResult.overall_score : progress}%` }}
                  ></div>
                </div>
                <button onClick={resetProgress} className="mt-4 text-[9px] text-slate-500 font-bold uppercase tracking-widest hover:text-red-400 transition-colors">
                  {lang === 'ar' ? 'إعادة ضبط كافة البيانات' : 'Reset All Audit Data'}
                </button>
              </div>
            </div>
          </div>

          {/* AI Audit Insights Dashboard */}
          {auditResult && !isAnalyzing && (
            <div className="grid md:grid-cols-3 gap-6 mb-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="bg-emerald-500/5 border border-emerald-500/10 p-7 rounded-[2rem] hover:border-emerald-500/30 transition-all group/card">
                <div className="flex items-center gap-4 mb-4">
                  <span className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl group-hover/card:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                  <h4 className="font-black text-white text-base">{lang === 'ar' ? 'توصيات الميتا' : 'Meta Recommendations'}</h4>
                </div>
                <div className="space-y-3">
                  <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                    <p className="text-[10px] text-emerald-400 font-bold uppercase mb-1">{lang === 'ar' ? 'العنوان المقترح' : 'Suggested Title'}</p>
                    <p className="text-white text-xs leading-relaxed font-medium">{auditResult.ai_recommendations.title}</p>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                    <p className="text-[10px] text-emerald-400 font-bold uppercase mb-1">{lang === 'ar' ? 'الوصف المقترح' : 'Suggested Meta'}</p>
                    <p className="text-white text-xs leading-relaxed font-medium">{auditResult.ai_recommendations.description}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-500/5 border border-blue-500/10 p-7 rounded-[2rem] hover:border-blue-500/30 transition-all group/card">
                <div className="flex items-center gap-4 mb-4">
                  <span className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl group-hover/card:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                  <h4 className="font-black text-white text-base">{lang === 'ar' ? 'فجوة المحتوى' : 'Content Gap'}</h4>
                </div>
                <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-700/50 h-32 overflow-y-auto custom-scrollbar">
                  <p className="text-slate-300 text-sm leading-relaxed">{auditResult.content_gap}</p>
                </div>
                <p className="mt-4 text-[10px] text-blue-400/60 font-bold italic">* {lang === 'ar' ? 'موضوع يغطيه المنافسون بكثافة' : 'Topic heavily covered by competitors'}</p>
              </div>

              <div className="bg-red-500/5 border border-red-500/10 p-7 rounded-[2rem] hover:border-red-500/30 transition-all group/card">
                <div className="flex items-center gap-4 mb-4">
                  <span className="p-3 bg-red-500/20 text-red-400 rounded-2xl group-hover/card:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                  <h4 className="font-black text-white text-base">{lang === 'ar' ? 'أولوية قصوى' : 'Critical Fix'}</h4>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl">
                  <p className="text-red-100 text-sm font-bold leading-relaxed">{auditResult.priority_action}</p>
                </div>
                <p className="mt-4 text-[10px] text-red-400/60 font-bold italic uppercase tracking-widest">{lang === 'ar' ? 'يجب البدء بهذا فوراً' : 'Start working on this immediately'}</p>
              </div>
            </div>
          )}

          {/* Main Checklist View */}
          <div className="grid lg:grid-cols-4 gap-10">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1 space-y-3 print:hidden">
              {categories.map(cat => {
                const total = cat.items.length;
                const completed = cat.items.filter(i => i.isCompleted).length;
                const isDone = completed === total && total > 0;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id)}
                    className={`w-full flex items-center justify-between p-5 rounded-[1.5rem] font-bold text-sm transition-all border group ${
                      activeTab === cat.id 
                        ? 'bg-blue-600 border-blue-500 text-white shadow-2xl shadow-blue-900/40 translate-x-1' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className="truncate">{cat.name.split('.')[1] || cat.name}</span>
                    <span className={`text-[10px] px-3 py-1 rounded-full font-black min-w-[3rem] text-center transition-colors ${isDone ? 'bg-white text-emerald-600' : 'bg-slate-800 text-slate-500'}`}>
                      {isDone ? '✓' : `${completed}/${total}`}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Checklist Items */}
            <div className="lg:col-span-3">
              <div className="space-y-4">
                {categories.find(c => c.id === activeTab)?.items.map(item => (
                  <div 
                    key={item.id} 
                    className={`group p-6 rounded-[2rem] border transition-all duration-300 flex items-start gap-6 relative overflow-hidden ${
                      item.isCompleted 
                        ? 'bg-emerald-500/10 border-emerald-500/20' 
                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    {item.isCompleted && <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 -mr-12 -mt-12 rounded-full blur-2xl"></div>}
                    
                    <button 
                      onClick={() => toggleItem(activeTab, item.id)}
                      className={`mt-1 w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all shrink-0 z-10 ${
                        item.isCompleted 
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30 rotate-0' 
                          : 'border-slate-700 text-transparent hover:border-emerald-500 hover:rotate-12'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>

                    <div className="flex-grow z-10">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className={`font-black text-xl tracking-tight transition-colors ${item.isCompleted ? 'text-emerald-400 line-through decoration-emerald-500/50' : 'text-white'}`}>
                          {item.task}
                        </h3>
                        <span className={`text-[9px] px-2.5 py-1 rounded-lg border font-black uppercase tracking-widest ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                      </div>
                      <p className={`text-sm leading-relaxed transition-colors font-medium max-w-2xl ${item.isCompleted ? 'text-emerald-200/40' : 'text-slate-400'}`}>
                        {item.description}
                      </p>
                      
                      {/* AI Reasoning Text */}
                      {auditResult && auditResult.checklist_results.find(r => r.task_id === item.id) && (
                        <div className={`mt-4 pt-3 border-t text-[11px] font-bold flex items-start gap-2 ${item.isCompleted ? 'border-emerald-500/10 text-emerald-400/60' : 'border-slate-800 text-slate-500'}`}>
                          <span className="shrink-0 uppercase tracking-widest text-[9px] mt-0.5 opacity-70">AI Context:</span>
                          <span>{auditResult.checklist_results.find(r => r.task_id === item.id)?.reason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="mt-16 pt-10 border-t border-slate-800 flex flex-wrap gap-5 justify-between items-center print:hidden">
            <div className="flex gap-4">
               <button onClick={printList} className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-2xl text-sm font-black flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {lang === 'ar' ? 'تحميل التقرير الكامل' : 'Download Full Report'}
              </button>
            </div>
            <div className="flex items-center gap-4 text-slate-500">
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">{lang === 'ar' ? 'مدعوم بواسطة' : 'Powered By'}</span>
               <div className="flex gap-2">
                 <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-lg text-[10px] font-black">GEMINI 3 PRO</span>
                 <span className="bg-blue-500/10 text-blue-500 px-3 py-1 rounded-lg text-[10px] font-black">OUJSEO CORE</span>
               </div>
            </div>
          </div>

        </div>
      </div>

      {/* Futuristic Loading Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="text-center max-w-sm px-6">
            <div className="relative w-32 h-32 mx-auto mb-10">
               <div className="absolute inset-0 border-[6px] border-emerald-500/10 rounded-full"></div>
               <div className="absolute inset-0 border-[6px] border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
               <div className="absolute inset-8 bg-emerald-500/20 rounded-full animate-pulse blur-xl"></div>
               <div className="absolute inset-10 bg-emerald-500 rounded-full shadow-[0_0_40px_rgba(52,211,153,0.8)]"></div>
            </div>
            <h3 className="text-3xl font-black text-white mb-4 tracking-tight">
              {lang === 'ar' ? 'جاري الفحص العميق...' : 'Deep Audit in Progress...'}
            </h3>
            <div className="space-y-3">
              <p className="text-slate-400 text-sm font-medium animate-pulse">
                {lang === 'ar' ? 'نقوم الآن بالولوج إلى بيانات الموقع وفحص العناوين والمحتوى' : 'Currently accessing site data and auditing titles and content'}
              </p>
              <div className="flex justify-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(52,211,153,0.3); border-radius: 10px; }
        @media print {
          @page { margin: 1cm; size: A4; }
          body { background: white !important; color: black !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print\\:hidden { display: none !important; }
          nav, footer, .fixed, .breadcrumbs-nav { display: none !important; }
        }
      `}</style>
    </section>
  );
};

export default SEOChecklistTool;
