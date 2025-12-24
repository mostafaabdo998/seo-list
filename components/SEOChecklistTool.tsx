
import React, { useState, useEffect } from 'react';
import Breadcrumbs from './Breadcrumbs';
import { Category, Language, AuditResponse } from '../types';
import { initialDataAr, initialDataEn } from '../constants';
import { GoogleGenAI, Type } from "@google/genai";

// حماية لمتغيرات البيئة لمنع الانهيار في الاستضافات المختلفة
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
  
  // AI Audit States
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // تحميل البيانات المحفوظة
  useEffect(() => {
    const savedData = localStorage.getItem(`ouj_seo_checklist_v3_${lang}`);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories(parsed);
        } else {
          setCategories(lang === 'ar' ? initialDataAr : initialDataEn);
        }
      } catch (e) {
        setCategories(lang === 'ar' ? initialDataAr : initialDataEn);
      }
    } else {
      setCategories(lang === 'ar' ? initialDataAr : initialDataEn);
    }
  }, [lang]);

  // تحديث النسبة المئوية
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

    const apiKey = getApiKey();
    if (!apiKey) {
      setError(lang === 'ar' ? 'مفتاح الـ API غير متوفر. يرجى مراجعة إعدادات الاستضافة.' : 'API Key is missing. Please check hosting settings.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAuditResult(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const systemInstruction = `
        Role: أنت المحرك البرمجي لأداة "OujSEO Audit Pro". مهمتك هي العمل كخبير سيو تقني (Technical SEO Auditor) ومحلل استراتيجي للمحتوى.
        
        Task: قم بإجراء فحص شامل للموقع الموجود في الرابط المقدم. استخدم أداة البحث (googleSearch) للوصول إلى بيانات الموقع الحالية.
        
        Required Output (JSON Format Only):
        يجب أن تكون النتيجة بتنسيق JSON ويتضمن:
        - overall_score: رقم من 100.
        - checklist_results: مصفوفة تحتوي على (task_id, status: "pass"/"fail", reason).
          المعرفات المسموحة: f-1, f-2, f-3, f-4, f-5, f-6, t-1, t-2, t-3, t-4, t-5, t-6, t-7, op-1, op-2, op-3, op-4, op-5, op-6, op-7, c-1, c-2, c-3, c-4, c-5, c-6, off-1, off-2, off-3, off-4.
        - ai_recommendations: { title: "العنوان المقترح", description: "وصف ميتا مقترح", advice: "نصيحة" }.
        - content_gap: فجوة المحتوى.
        - priority_action: المهمة العاجلة.

        اللغة: العربية.
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
      }
    } catch (err: any) {
      console.error("Audit Error:", err);
      setError(lang === 'ar' ? `خطأ: ${err.message || 'فشل الاتصال بالذكاء الاصطناعي'}` : `Error: ${err.message || 'AI Connection failed'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetProgress = () => {
    if (window.confirm(lang === 'ar' ? 'إعادة تعيين كافة البيانات؟' : 'Reset all data?')) {
      setCategories(lang === 'ar' ? initialDataAr : initialDataEn);
      setAuditResult(null);
      setUrl('');
      localStorage.removeItem(`ouj_seo_checklist_v3_${lang}`);
    }
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
        <div className="bg-[#1e293b] rounded-[2.5rem] p-6 lg:p-12 shadow-2xl border border-slate-700 max-w-7xl mx-auto print:shadow-none print:border-none print:bg-white print:p-0">
          
          {/* Header */}
          <div className="grid md:grid-cols-3 gap-8 mb-12 print:hidden">
            <div className="md:col-span-2">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-emerald-500/20 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div className="flex-grow">
                  <h2 className="text-4xl font-black text-white tracking-tight">OujSEO Audit Pro</h2>
                  <p className="text-slate-400 text-sm mt-1">{lang === 'ar' ? 'فحص تقني وتحليل محتوى فوري.' : 'Instant technical and content audit.'}</p>
                </div>
                <button 
                  onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')}
                  className="w-12 h-12 bg-slate-800 rounded-xl text-lg font-black text-white border border-slate-700 hover:border-emerald-500 transition-all flex items-center justify-center"
                >
                  {lang === 'ar' ? 'E' : 'ع'}
                </button>
              </div>

              {/* URL Input */}
              <div className="relative group max-w-2xl">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-2xl blur opacity-25"></div>
                <div className="relative flex flex-col sm:flex-row gap-2 p-2 bg-slate-900 rounded-2xl border border-slate-700">
                  <input 
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={lang === 'ar' ? "أدخل رابط الموقع كاملاً" : "Enter full URL"}
                    className="flex-grow bg-transparent border-none focus:ring-0 text-white px-4 py-3 text-sm"
                  />
                  <button 
                    onClick={runAutoAudit}
                    disabled={isAnalyzing}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all"
                  >
                    {isAnalyzing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (lang === 'ar' ? 'ابدأ الفحص' : 'Start Audit')}
                  </button>
                </div>
                {error && <p className="text-red-400 text-xs mt-3 px-2 font-bold">{error}</p>}
              </div>
            </div>

            {/* Score */}
            <div className="bg-slate-900 rounded-[2rem] p-8 border border-slate-700 flex flex-col justify-center items-center text-center">
              <div className="text-6xl font-black text-emerald-400 mb-2">{auditResult ? auditResult.overall_score : progress}</div>
              <div className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">{lang === 'ar' ? 'الدرجة الكلية' : 'Overall Score'}</div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${auditResult ? auditResult.overall_score : progress}%` }}></div>
              </div>
              <button onClick={resetProgress} className="mt-4 text-[9px] text-slate-500 font-bold uppercase hover:text-red-400">
                {lang === 'ar' ? 'إعادة ضبط' : 'Reset'}
              </button>
            </div>
          </div>

          {/* AI Results */}
          {auditResult && !isAnalyzing && (
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-emerald-500/5 border border-emerald-500/10 p-7 rounded-[2rem]">
                <h4 className="font-black text-white text-base mb-4">{lang === 'ar' ? 'توصيات الميتا' : 'Meta Recommendations'}</h4>
                <p className="text-white text-xs font-medium bg-slate-900/50 p-3 rounded-xl mb-2">{auditResult.ai_recommendations.title}</p>
                <p className="text-white text-xs font-medium bg-slate-900/50 p-3 rounded-xl">{auditResult.ai_recommendations.description}</p>
              </div>
              <div className="bg-blue-500/5 border border-blue-500/10 p-7 rounded-[2rem]">
                <h4 className="font-black text-white text-base mb-4">{lang === 'ar' ? 'فجوة المحتوى' : 'Content Gap'}</h4>
                <p className="text-slate-300 text-sm leading-relaxed">{auditResult.content_gap}</p>
              </div>
              <div className="bg-red-500/5 border border-red-500/10 p-7 rounded-[2rem]">
                <h4 className="font-black text-white text-base mb-4">{lang === 'ar' ? 'أولوية قصوى' : 'Critical Fix'}</h4>
                <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl">
                  <p className="text-red-100 text-sm font-bold">{auditResult.priority_action}</p>
                </div>
              </div>
            </div>
          )}

          {/* Checklist */}
          <div className="grid lg:grid-cols-4 gap-10">
            <div className="lg:col-span-1 space-y-3 print:hidden">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`w-full flex items-center justify-between p-5 rounded-[1.5rem] font-bold text-sm transition-all border ${activeTab === cat.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                >
                  <span>{cat.name.split('.')[1] || cat.name}</span>
                </button>
              ))}
            </div>
            <div className="lg:col-span-3">
              <div className="space-y-4">
                {categories.find(c => c.id === activeTab)?.items.map(item => (
                  <div key={item.id} className={`p-6 rounded-[2rem] border transition-all flex items-start gap-6 ${item.isCompleted ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-900/40 border-slate-800'}`}>
                    <button onClick={() => toggleItem(activeTab, item.id)} className={`mt-1 w-8 h-8 rounded-xl border-2 flex items-center justify-center shrink-0 ${item.isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-700 text-transparent'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`font-black text-xl ${item.isCompleted ? 'text-emerald-400 line-through' : 'text-white'}`}>{item.task}</h3>
                        <span className={`text-[9px] px-2 py-1 rounded-lg border font-black uppercase ${getPriorityColor(item.priority)}`}>{item.priority}</span>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
                      {auditResult && auditResult.checklist_results.find(r => r.task_id === item.id) && (
                        <p className="mt-3 text-[11px] font-bold text-emerald-400/60 border-t border-slate-800 pt-2">
                          AI: {auditResult.checklist_results.find(r => r.task_id === item.id)?.reason}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl">
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-10 border-[6px] border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <h3 className="text-3xl font-black text-white mb-4 tracking-tight">{lang === 'ar' ? 'جاري الفحص العميق...' : 'Deep Audit in Progress...'}</h3>
          </div>
        </div>
      )}
    </section>
  );
};

export default SEOChecklistTool;
