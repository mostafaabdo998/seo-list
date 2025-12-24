
import { Category } from './types';

export const initialDataAr: Category[] = [
  {
    id: 'foundation',
    name: '1. الأساسيات والزحف',
    items: [
      { id: 'f-1', task: 'تثبيت Google Analytics 4', description: 'التأكد من جمع البيانات بشكل صحيح واستبعاد الزيارات الداخلية.', priority: 'High', isCompleted: false },
      { id: 'f-2', task: 'إعداد Google Search Console', description: 'التحقق من الملكية وربط خريطة الموقع (Sitemap).', priority: 'High', isCompleted: false },
      { id: 'f-3', task: 'فحص ملف Robots.txt', description: 'التأكد من عدم حظر صفحات هامة عن عناكب البحث.', priority: 'High', isCompleted: false },
      { id: 'f-4', task: 'صلاحية خريطة الموقع (XML Sitemap)', description: 'يجب أن تكون خالية من الأخطاء والروابط المعطلة.', priority: 'High', isCompleted: false },
      { id: 'f-5', task: 'تفعيل بروتوكول HTTPS', description: 'تشفير الموقع بشهادة SSL سارية المفعول.', priority: 'High', isCompleted: false },
      { id: 'f-6', task: 'إصلاح أخطاء الزحف (Crawl Errors)', description: 'مراجعة تقرير التغطية في GSC وإصلاح أخطاء 5xx.', priority: 'High', isCompleted: false },
      { id: 'f-7', task: 'إعداد Bing Webmaster Tools', description: 'لضمان الظهور في محرك بحث Bing و Yahoo.', priority: 'Low', isCompleted: false },
    ]
  },
  {
    id: 'technical',
    name: '2. السيو التقني (Technical)',
    items: [
      { id: 't-1', task: 'تحسين سرعة الموقع (Core Web Vitals)', description: 'تحقيق درجة نجاح في LCP, FID, CLS.', priority: 'High', isCompleted: false },
      { id: 't-2', task: 'التوافق مع الجوال (Mobile-Friendly)', description: 'اختبار الموقع على شاشات مختلفة وإصلاح مشاكل اللمس.', priority: 'High', isCompleted: false },
      { id: 't-3', task: 'إصلاح الروابط المكسورة (404)', description: 'عمل Redirect 301 للروابط القديمة أو حذفها.', priority: 'Medium', isCompleted: false },
      { id: 't-4', task: 'استخدام Canonical Tags', description: 'منع المحتوى المكرر بتحديد الصفحة الأصلية.', priority: 'High', isCompleted: false },
      { id: 't-5', task: 'بنية الروابط (URL Structure)', description: 'روابط قصيرة، مقروءة، وتحتوي على الكلمة المفتاحية.', priority: 'Medium', isCompleted: false },
      { id: 't-6', task: 'تفعيل Breadcrumbs', description: 'لتحسين تجربة المستخدم وفهم جوجل لهيكلية الموقع.', priority: 'Medium', isCompleted: false },
      { id: 't-7', task: 'إعداد Schema Markup', description: 'إضافة البيانات المنظمة (Organization, Product, Article).', priority: 'Medium', isCompleted: false },
      { id: 't-8', task: 'إصلاح سلاسل إعادة التوجيه (Redirect Chains)', description: 'تجنب القفزات المتعددة (A > B > C).', priority: 'Low', isCompleted: false },
    ]
  },
  {
    id: 'onpage',
    name: '3. السيو الداخلي (On-Page)',
    items: [
      { id: 'op-1', task: 'عنوان الصفحة (Title Tag)', description: 'فريد، جذاب، يبدأ بالكلمة المفتاحية (50-60 حرف).', priority: 'High', isCompleted: false },
      { id: 'op-2', task: 'وصف الميتا (Meta Description)', description: 'نص تسويقي محفز للنقر (CTR) يتضمن الكلمة المفتاحية.', priority: 'Medium', isCompleted: false },
      { id: 'op-3', task: 'ترويسة H1 واحدة فقط', description: 'يجب أن تحتوي كل صفحة على H1 واحد يعبر عن محتواها.', priority: 'High', isCompleted: false },
      { id: 'op-4', task: 'تنسيق العناوين الفرعية (H2, H3)', description: 'تقسيم المحتوى بشكل منطقي للقراء وعناكب البحث.', priority: 'Medium', isCompleted: false },
      { id: 'op-5', task: 'النص البديل للصور (Alt Text)', description: 'وصف الصور بكلمات دلالية لظهورها في بحث الصور.', priority: 'Medium', isCompleted: false },
      { id: 'op-6', task: 'الربط الداخلي (Internal Linking)', description: 'ربط الصفحات ذات الصلة ببعضها بـ Anchor Text وصفي.', priority: 'High', isCompleted: false },
      { id: 'op-7', task: 'تحسين الصور (WebP & Compression)', description: 'ضغط الصور لتقليل حجم الصفحة دون فقدان الجودة.', priority: 'High', isCompleted: false },
    ]
  },
  {
    id: 'content',
    name: '4. جودة المحتوى (Content)',
    items: [
      { id: 'c-1', task: 'بحث الكلمات المفتاحية', description: 'استهداف كلمات ذات حجم بحث ونية واضحة.', priority: 'High', isCompleted: false },
      { id: 'c-2', task: 'محتوى حصري (Originality)', description: 'تجنب النسخ واللصق، وفحص المحتوى بأدوات كشف النسخ.', priority: 'High', isCompleted: false },
      { id: 'c-3', task: 'تلبية نية البحث (Search Intent)', description: 'هل المحتوى يجيب فعلاً على سؤال الباحث؟', priority: 'High', isCompleted: false },
      { id: 'c-4', task: 'تحديث المحتوى القديم', description: 'إضافة معلومات جديدة وتواريخ حديثة للمقالات القديمة.', priority: 'Medium', isCompleted: false },
      { id: 'c-5', task: 'قابلية القراءة (Readability)', description: 'فقرات قصيرة، قوائم نقطية، خط واضح.', priority: 'Medium', isCompleted: false },
      { id: 'c-6', task: 'معايير E-E-A-T', description: 'إظهار الخبرة، المصداقية، والموثوقية (صفحة من نحن، المؤلف).', priority: 'Medium', isCompleted: false },
    ]
  },
  {
    id: 'offpage',
    name: '5. السيو الخارجي والمحلي',
    items: [
      { id: 'off-1', task: 'Google My Business', description: 'إنشاء وتوثيق وتحديث النشاط التجاري بالكامل.', priority: 'High', isCompleted: false },
      { id: 'off-2', task: 'توحيد بيانات NAP', description: 'الاسم، العنوان، والهاتف يجب أن يتطابقوا في كل الويب.', priority: 'High', isCompleted: false },
      { id: 'off-3', task: 'تحليل ملف الروابط (Backlink Audit)', description: 'التنصل من الروابط السامة (Disavow Toxic Links).', priority: 'Medium', isCompleted: false },
      { id: 'off-4', task: 'بناء روابط الجودة', description: 'الحصول على روابط من مواقع ذات صلة وسلطة عالية.', priority: 'High', isCompleted: false },
      { id: 'off-5', task: 'الإشارات الاجتماعية', description: 'ربط الموقع بحسابات التواصل الاجتماعي النشطة.', priority: 'Low', isCompleted: false },
    ]
  }
];

export const initialDataEn: Category[] = [
  {
    id: 'foundation',
    name: '1. Fundamentals & Crawling',
    items: [
      { id: 'f-1', task: 'Setup Google Analytics 4', description: 'Ensure data collection is correct and exclude internal traffic.', priority: 'High', isCompleted: false },
      { id: 'f-2', task: 'Setup Google Search Console', description: 'Verify ownership and submit your XML Sitemap.', priority: 'High', isCompleted: false },
      { id: 'f-3', task: 'Check Robots.txt', description: 'Ensure no important pages are blocked from search engines.', priority: 'High', isCompleted: false },
      { id: 'f-4', task: 'XML Sitemap Validity', description: 'Must be error-free and contain no 404 links.', priority: 'High', isCompleted: false },
      { id: 'f-5', task: 'Enable HTTPS', description: 'Encrypt website with a valid SSL certificate.', priority: 'High', isCompleted: false },
      { id: 'f-6', task: 'Fix Crawl Errors', description: 'Review coverage report in GSC and fix 5xx errors.', priority: 'High', isCompleted: false },
      { id: 'f-7', task: 'Setup Bing Webmaster Tools', description: 'Ensure visibility on Bing and Yahoo search engines.', priority: 'Low', isCompleted: false },
    ]
  },
  {
    id: 'technical',
    name: '2. Technical SEO',
    items: [
      { id: 't-1', task: 'Improve Core Web Vitals', description: 'Achieve passing scores in LCP, FID, and CLS.', priority: 'High', isCompleted: false },
      { id: 't-2', task: 'Mobile-Friendly Check', description: 'Test on various screens and fix touch target issues.', priority: 'High', isCompleted: false },
      { id: 't-3', task: 'Fix Broken Links (404)', description: '301 Redirect old links or remove them.', priority: 'Medium', isCompleted: false },
      { id: 't-4', task: 'Use Canonical Tags', description: 'Prevent duplicate content by defining the original page.', priority: 'High', isCompleted: false },
      { id: 't-5', task: 'URL Structure', description: 'Short, readable URLs containing the target keyword.', priority: 'Medium', isCompleted: false },
      { id: 't-6', task: 'Enable Breadcrumbs', description: 'Improve UX and help Google understand site structure.', priority: 'Medium', isCompleted: false },
      { id: 't-7', task: 'Setup Schema Markup', description: 'Add structured data (Organization, Product, Article).', priority: 'Medium', isCompleted: false },
      { id: 't-8', task: 'Fix Redirect Chains', description: 'Avoid multiple hops (A > B > C).', priority: 'Low', isCompleted: false },
    ]
  },
  {
    id: 'onpage',
    name: '3. On-Page SEO',
    items: [
      { id: 'op-1', task: 'Title Tag Optimization', description: 'Unique, catchy, starts with keyword (50-60 chars).', priority: 'High', isCompleted: false },
      { id: 'op-2', task: 'Meta Description', description: 'Marketing copy stimulating CTR, includes keyword.', priority: 'Medium', isCompleted: false },
      { id: 'op-3', task: 'Single H1 Tag', description: 'Each page must have exactly one descriptive H1.', priority: 'High', isCompleted: false },
      { id: 'op-4', task: 'Subheadings (H2, H3)', description: 'Logically divide content for readers and crawlers.', priority: 'Medium', isCompleted: false },
      { id: 'op-5', task: 'Image Alt Text', description: 'Describe images with keywords for Image Search.', priority: 'Medium', isCompleted: false },
      { id: 'op-6', task: 'Internal Linking', description: 'Link related pages using descriptive Anchor Text.', priority: 'High', isCompleted: false },
      { id: 'op-7', task: 'Image Optimization', description: 'Compress images (WebP) to reduce load time.', priority: 'High', isCompleted: false },
    ]
  },
  {
    id: 'content',
    name: '4. Content Quality',
    items: [
      { id: 'c-1', task: 'Keyword Research', description: 'Target keywords with sufficient volume and clear intent.', priority: 'High', isCompleted: false },
      { id: 'c-2', task: 'Original Content', description: 'Avoid copy-paste; use plagiarism checkers.', priority: 'High', isCompleted: false },
      { id: 'c-3', task: 'Satisfy Search Intent', description: 'Does the content actually answer the user query?', priority: 'High', isCompleted: false },
      { id: 'c-4', task: 'Update Old Content', description: 'Add new info and fresh dates to older articles.', priority: 'Medium', isCompleted: false },
      { id: 'c-5', task: 'Readability', description: 'Short paragraphs, bullet points, clear font.', priority: 'Medium', isCompleted: false },
      { id: 'c-6', task: 'E-E-A-T Standards', description: 'Demonstrate Experience, Expertise, Authoritativeness, Trust.', priority: 'Medium', isCompleted: false },
    ]
  },
  {
    id: 'offpage',
    name: '5. Off-Page & Local SEO',
    items: [
      { id: 'off-1', task: 'Google My Business', description: 'Create, verify, and fully update business profile.', priority: 'High', isCompleted: false },
      { id: 'off-2', task: 'NAP Consistency', description: 'Name, Address, Phone must match across the web.', priority: 'High', isCompleted: false },
      { id: 'off-3', task: 'Backlink Audit', description: 'Identify and Disavow toxic links.', priority: 'Medium', isCompleted: false },
      { id: 'off-4', task: 'Quality Link Building', description: 'Acquire links from relevant, high-authority sites.', priority: 'High', isCompleted: false },
      { id: 'off-5', task: 'Social Signals', description: 'Link website to active social media profiles.', priority: 'Low', isCompleted: false },
    ]
  }
];
