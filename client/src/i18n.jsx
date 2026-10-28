import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Interface text in English and Arabic. Each key holds [english, arabic];
// a value can be a string with {placeholders} or a function of the variables.

const STORAGE_KEY = 'gapper_lang';
const LOCALE = { en: 'en-GB', ar: 'ar-u-nu-latn' };
const YEAR_AR = ['', 'الأولى', 'الثانية', 'الثالثة', 'الرابعة'];
const SEM_AR = ['', 'الأول', 'الثاني'];

const rules = new Intl.PluralRules('ar');
// Arabic plural forms: one, two, few (3–10), many (11–99), other.
function arPlural(n, forms) {
  const form = forms[rules.select(n)] ?? forms.other;
  return form.replace('{n}', n);
}
const enPlural = (n, one, other) => (n === 1 ? one : other).replace('{n}', n);

const M = {
  'app.tagline': ['Bridge the gap. Unlock your potential.', 'سُدّ الفجوة. أطلق إمكاناتك.'],
  'app.title': ['Gapper — Bridge the gap. Unlock your potential.', 'Gapper — سُدّ الفجوة. أطلق إمكاناتك.'],
  'app.home': ['Gapper home', 'Gapper — الصفحة الرئيسية'],

  'common.loading': ['Loading…', 'جارٍ التحميل…'],
  'common.error': ['Something went wrong.', 'حدث خطأ ما.'],
  'common.retry': ['Try again', 'حاول مجددًا'],
  'common.dismiss': ['Dismiss', 'إغلاق'],
  'common.close': ['Close', 'إغلاق'],
  'common.cancel': ['Cancel', 'إلغاء'],
  'common.save': ['Save changes', 'حفظ التغييرات'],
  'common.saving': ['Saving…', 'جارٍ الحفظ…'],
  'common.guest': ['Guest', 'ضيف'],
  'common.newTab': ['(opens in a new tab)', '(يفتح في تبويب جديد)'],
  'common.free': ['Free', 'مجاني'],
  'common.listSep': [', ', '، '],
  'common.min': [
    ({ n }) => `${n} min`,
    ({ n }) => arPlural(n, { one: 'دقيقة واحدة', two: 'دقيقتان', few: '{n} دقائق', many: '{n} دقيقة', other: '{n} دقيقة' }),
  ],
  'common.skills': [
    ({ n }) => enPlural(n, '{n} skill', '{n} skills'),
    ({ n }) => arPlural(n, { zero: 'لا توجد مهارات', one: 'مهارة واحدة', two: 'مهارتان', few: '{n} مهارات', many: '{n} مهارة', other: '{n} مهارة' }),
  ],

  'api.offline': ['Could not reach the server. Check your connection and try again.', 'تعذّر الوصول إلى الخادم. تحقّق من اتصالك وحاول مجددًا.'],
  'api.failed': ['Something went wrong. Please try again.', 'حدث خطأ ما. يُرجى المحاولة مجددًا.'],

  'lang.other': ['العربية', 'English'],
  'lang.switch': ['Switch to Arabic', 'التبديل إلى الإنجليزية'],
  'lang.en': ['English', 'English'],
  'lang.ar': ['العربية', 'العربية'],

  'status.not_started': ['Not started', 'لم تبدأ'],
  'status.in_progress': ['In progress', 'قيد التقدم'],
  'status.completed': ['Completed', 'مكتملة'],
  'level.Beginner': ['Beginner', 'مبتدئ'],
  'level.Intermediate': ['Intermediate', 'متوسط'],
  'level.Advanced': ['Advanced', 'متقدم'],

  'type.video': ['Video', 'فيديو'], 'types.video': ['Videos', 'فيديوهات'],
  'type.article': ['Article', 'مقال'], 'types.article': ['Articles', 'مقالات'],
  'type.course': ['Course', 'دورة'], 'types.course': ['Courses', 'دورات'],
  'type.book': ['Book', 'كتاب'], 'types.book': ['Books', 'كتب'],
  'type.tool': ['Tool', 'أداة'], 'types.tool': ['Tools', 'أدوات'],
  'type.template': ['Template', 'قالب'], 'types.template': ['Templates', 'قوالب'],

  'stage.year': [({ n }) => `Year ${n}`, ({ n }) => `السنة ${YEAR_AR[n] || n}`],
  'stage.semester': [({ n }) => `Semester ${n}`, ({ n }) => `الفصل ${SEM_AR[n] || n}`],
  'stage.label': [
    ({ year, semester }) => `Year ${year} · Semester ${semester}`,
    ({ year, semester }) => `السنة ${YEAR_AR[year] || year} · الفصل ${SEM_AR[semester] || semester}`,
  ],
  'stage.short': [({ year, semester }) => `Y${year} · S${semester}`, ({ year, semester }) => `س${year} · ف${semester}`],
  'stage.program': ['Program', 'التخصص'],
  'stage.yearField': ['Year', 'السنة'],
  'stage.semesterField': ['Semester', 'الفصل'],
  'stage.update': ['Update my stage', 'حدّث مرحلتي'],
  'stage.change': ['Change your stage', 'غيّر مرحلتك'],

  'nav.home': ['Home', 'الرئيسية'],
  'nav.roadmap': ['My Roadmap', 'خريطة المسار'],
  'nav.roadmapShort': ['Roadmap', 'المسار'],
  'nav.library': ['Skill Library', 'مكتبة المهارات'],
  'nav.libraryShort': ['Library', 'المكتبة'],
  'nav.progress': ['Progress', 'التقدّم'],
  'nav.resources': ['Resources', 'المصادر'],
  'nav.settings': ['Settings', 'الإعدادات'],
  'nav.journey': ['Your journey', 'رحلتك'],
  'nav.more': ['More', 'المزيد'],
  'nav.logout': ['Log out', 'تسجيل الخروج'],
  'nav.skip': ['Skip to content', 'انتقل إلى المحتوى'],
  'nav.search': ['Search skills…', 'ابحث عن مهارة…'],
  'nav.searchLabel': ['Search skills', 'البحث في المهارات'],
  'nav.main': ['Main navigation', 'التنقل الرئيسي'],
  'nav.student': [({ code, year }) => `${code} Student · Year ${year}`, ({ name, year }) => `${name} · السنة ${YEAR_AR[year] || year}`],
  'nav.guestAccount': ['Guest account', 'حساب ضيف'],
  'guest.bar': ['You’re exploring as a guest. Create an account to keep your progress safe.', 'أنت تتصفح كضيف. أنشئ حسابًا لتحفظ تقدمك بأمان.'],
  'guest.save': ['Save my progress', 'احفظ تقدمي'],

  'landing.features': ['Features', 'المميزات'],
  'landing.how': ['How it works', 'كيف يعمل'],
  'landing.about': ['About', 'من نحن'],
  'landing.sections': ['Page sections', 'أقسام الصفحة'],
  'landing.openDashboard': ['Open dashboard', 'افتح لوحتك'],
  'landing.getStarted': ['Get Started', 'ابدأ الآن'],
  'landing.eyebrow': ['For Computer Science & Engineering students', 'لطلاب علم الحاسوب وهندسة الحاسوب'],
  'landing.h1a': ['Bridge the gap.', 'سُدّ الفجوة.'],
  'landing.h1b': ['Unlock your potential.', 'أطلق إمكاناتك.'],
  'landing.lead': [
    'A guided skill-development platform that shows you what to learn, why it matters, when it helps, and how to practise it — from your first year to graduation.',
    'منصة موجّهة لتطوير المهارات، تُريك ماذا تتعلم، ولماذا يهم، ومتى يفيدك، وكيف تتدرّب عليه — من سنتك الأولى حتى التخرج.',
  ],
  'landing.tryGuest': ['Try it without an account', 'جرّبها دون حساب'],
  'landing.settingUp': ['Setting things up…', 'جارٍ التجهيز…'],
  'landing.categories': ['Skill categories', 'فئات المهارات'],
  'landing.featuresEyebrow': ['What Gapper gives you', 'ماذا يقدّم لك Gapper'],
  'landing.featuresTitle': ['More than a list of courses', 'أكثر من مجرد قائمة دورات'],
  'landing.featuresText': [
    'University teaches subjects. Gapper helps with the skills around them — the ones that are often learned late, or by chance.',
    'الجامعة تعلّمك المواد، وGapper يساعدك في المهارات المحيطة بها — تلك التي كثيرًا ما تُتعلَّم متأخرًا أو بالصدفة.',
  ],
  'landing.f1': ['A roadmap for every year', 'مسار لكل سنة'],
  'landing.f1Text': [
    'See which skills are worth building in each year and semester — from note-taking in your first week to interview prep before graduation.',
    'اعرف المهارات التي تستحق أن تبنيها في كل سنة وفصل — من تدوين الملاحظات في أسبوعك الأول حتى التحضير للمقابلات قبل التخرج.',
  ],
  'landing.f2': ['Skills you can act on', 'مهارات قابلة للتطبيق'],
  'landing.f2Text': [
    'Every skill explains why it matters, when it helps, how to learn it, and gives you a real task to practise.',
    'كل مهارة تشرح لماذا تهم ومتى تفيد وكيف تتعلمها، وتمنحك مهمة حقيقية لتتدرّب عليها.',
  ],
  'landing.f3': ['Progress you can see', 'تقدّم تراه بعينك'],
  'landing.f3Text': [
    'Mark skills as not started, in progress or completed, and see your journey across categories and semesters.',
    'حدّد حالة كل مهارة: لم تبدأ أو قيد التقدم أو مكتملة، وتابع رحلتك عبر الفئات والفصول.',
  ],
  'landing.f4': ['Trusted resources', 'مصادر موثوقة'],
  'landing.f4Text': [
    'A curated list of free courses, articles, tools and templates — each one linked to the skill it supports.',
    'قائمة مختارة من الدورات والمقالات والأدوات والقوالب المجانية — كل منها مرتبط بالمهارة التي يدعمها.',
  ],
  'landing.howTitle': ['Small steps, one skill at a time', 'خطوات صغيرة، مهارة تلو الأخرى'],
  'landing.s1': ['Tell us where you are', 'أخبرنا أين أنت'],
  'landing.s1Text': [
    'Choose your program, year and semester. Gapper suggests the skills that fit your stage.',
    'اختر تخصصك وسنتك وفصلك، وسيقترح عليك Gapper المهارات المناسبة لمرحلتك.',
  ],
  'landing.s2': ['Learn and practise', 'تعلّم وتدرّب'],
  'landing.s2Text': [
    'Follow short learning steps, then try a practical task in a real lecture, project or assignment.',
    'اتبع خطوات تعلّم قصيرة، ثم جرّب مهمة عملية في محاضرة أو مشروع أو واجب حقيقي.',
  ],
  'landing.s3': ['Reflect and keep going', 'تأمّل وواصل'],
  'landing.s3Text': [
    'Update your progress, write a short reflection, and pick your next step.',
    'حدّث تقدمك، واكتب تأملًا قصيرًا، واختر خطوتك التالية.',
  ],
  'landing.aboutTitle': ['Every student deserves a clear path', 'كل طالب يستحق طريقًا واضحًا'],
  'landing.aboutP1': [
    'Some students discover skills like independent learning, research, teamwork or portfolio building early. Others — especially those whose education was disrupted or who had limited access to guidance — find them late. That is a difference in access, not in ability.',
    'بعض الطلاب يكتشفون مبكرًا مهارات مثل التعلّم الذاتي والبحث والعمل الجماعي وبناء ملف الأعمال، وآخرون — خاصة من تعطّل تعليمهم أو قلّت فرص الإرشاد أمامهم — يكتشفونها متأخرين. هذا فرق في الوصول، لا في القدرة.',
  ],
  'landing.aboutP2': [
    'Gapper’s mission is to give Computer Science and Engineering students structured, practical and accessible guidance, from their first university year to graduation.',
    'رسالة Gapper أن يقدّم لطلاب علم الحاسوب وهندسة الحاسوب إرشادًا منظّمًا وعمليًا وفي متناول الجميع، من السنة الجامعية الأولى حتى التخرج.',
  ],
  'landing.p1': ['Practical', 'عملي'],
  'landing.p1Text': ['Every skill leads to a concrete next step.', 'كل مهارة تقودك إلى خطوة تالية ملموسة.'],
  'landing.p2': ['Evidence-informed', 'مبني على الأدلة'],
  'landing.p2Text': ['Roadmaps are researched and reviewed, not assumed to be universal.', 'المسارات مدروسة وتخضع للمراجعة، ولا نفترض أنها تناسب الجميع.'],
  'landing.p3': ['Accessible', 'في متناول الجميع'],
  'landing.p3Text': ['Clear language, free resources, and a design that works on any phone.', 'لغة واضحة ومصادر مجانية وتصميم يعمل على أي هاتف.'],
  'landing.p4': ['Honest', 'صادق'],
  'landing.p4Text': ['Completing a skill here is your own judgement, not a certificate of mastery.', 'إكمال المهارة هنا تقديرك الشخصي، لا شهادة إتقان.'],
  'landing.futureEyebrow': ['Coming later', 'لاحقًا'],
  'landing.futureTitle': ['A platform that can grow with students', 'منصة تنمو مع الطلاب'],
  'landing.futureText': [
    'These are ideas for the future, shaped by student feedback — not features available today.',
    'هذه أفكار للمستقبل تتشكّل من ملاحظات الطلاب، وليست ميزات متاحة اليوم.',
  ],
  'future.1': ['Expanded pathways', 'مسارات أوسع'],
  'future.1Text': ['More degrees and university-specific roadmaps.', 'تخصصات أكثر ومسارات خاصة بكل جامعة.'],
  'future.2': ['Personalised suggestions', 'اقتراحات مخصّصة'],
  'future.2Text': ['Recommendations based on your goals and progress.', 'توصيات مبنية على أهدافك وتقدمك.'],
  'future.3': ['Portfolio & opportunities', 'ملف الأعمال والفرص'],
  'future.3Text': ['A record of what you have built and practised.', 'سجلّ لما بنيته وتدرّبت عليه.'],
  'future.4': ['Gentle reminders', 'تذكيرات لطيفة'],
  'future.4Text': ['Optional learning plans that fit your schedule.', 'خطط تعلّم اختيارية تناسب جدولك.'],
  'landing.ctaTitle': ['Small steps today, big opportunities tomorrow.', 'خطوات صغيرة اليوم، فرص كبيرة غدًا.'],
  'landing.ctaButton': ['Start your journey', 'ابدأ رحلتك'],
  'landing.footer': [
    'Gapper is an early-stage project. Its content and roadmap are provisional and will be refined through student feedback and expert review.',
    'Gapper مشروع في مراحله الأولى. محتواه ومساره مبدئيان، وسيتطوّران بناءً على ملاحظات الطلاب ومراجعة المختصين.',
  ],
  'landing.vision': ['Our vision', 'رؤيتنا'],

  'auth.login': ['Log in', 'تسجيل الدخول'],
  'auth.loginTitle': ['Log in', 'تسجيل الدخول'],
  'auth.welcomeBack': ['Welcome back!', 'أهلًا بعودتك!'],
  'auth.loginSub': ['Log in to continue your journey', 'سجّل دخولك لتكمل رحلتك'],
  'auth.email': ['Email address', 'البريد الإلكتروني'],
  'auth.password': ['Password', 'كلمة المرور'],
  'auth.passwordPh': ['Enter your password', 'أدخل كلمة المرور'],
  'auth.remember': ['Remember me', 'تذكّرني'],
  'auth.loggingIn': ['Logging in…', 'جارٍ تسجيل الدخول…'],
  'auth.or': ['or', 'أو'],
  'auth.guest': ['Continue as a guest', 'المتابعة كضيف'],
  'auth.noAccount': ['Don’t have an account?', 'ليس لديك حساب؟'],
  'auth.signup': ['Sign up', 'أنشئ حسابًا'],
  'auth.createTitle': ['Create your account', 'أنشئ حسابك'],
  'auth.createSub': ['Start building your future', 'ابدأ ببناء مستقبلك'],
  'auth.fullName': ['Full name', 'الاسم الكامل'],
  'auth.namePh': ['Enter your name', 'أدخل اسمك'],
  'auth.newPasswordPh': ['At least 8 characters', '8 أحرف على الأقل'],
  'auth.creating': ['Creating your account…', 'جارٍ إنشاء حسابك…'],
  'auth.privacy': [
    'We only store your name, email and learning progress — to save your journey. We never share them.',
    'نحفظ اسمك وبريدك وتقدمك التعليمي فقط لنحفظ رحلتك، ولا نشاركها مع أحد أبدًا.',
  ],
  'auth.haveAccount': ['Already have an account?', 'لديك حساب بالفعل؟'],
  'auth.showPassword': ['Show password', 'إظهار كلمة المرور'],
  'auth.hidePassword': ['Hide password', 'إخفاء كلمة المرور'],
  'auth.welcomeToast': ['Welcome to Gapper! Let’s set up your roadmap.', 'أهلًا بك في Gapper! لنجهّز مسارك.'],

  'onb.title': ['Set up your roadmap', 'جهّز مسارك'],
  'onb.welcome': ['Welcome!', 'أهلًا بك!'],
  'onb.welcomeName': ['Welcome, {name}!', 'أهلًا {name}!'],
  'onb.question': ['Where are you in your journey?', 'أين أنت في رحلتك؟'],
  'onb.sub': [
    'We’ll suggest the skills that fit your stage. You can change this anytime in Settings.',
    'سنقترح عليك المهارات المناسبة لمرحلتك، ويمكنك تغيير ذلك في أي وقت من الإعدادات.',
  ],
  'onb.program': ['Your program', 'تخصصك'],
  'onb.year': ['Your year', 'سنتك الدراسية'],
  'onb.semester': ['Your semester', 'فصلك الدراسي'],
  'onb.submit': ['Show my roadmap', 'اعرض مساري'],
  'onb.submitting': ['Building your roadmap…', 'جارٍ تجهيز مسارك…'],

  'dash.morning': ['Good morning', 'صباح الخير'],
  'dash.afternoon': ['Good afternoon', 'مساء الخير'],
  'dash.evening': ['Good evening', 'مساء الخير'],
  'dash.greetName': ['{greet}, {name}!', '{greet} يا {name}!'],
  'dash.greet': ['{greet}!', '{greet}!'],
  'dash.sub': ['Small steps today, big achievements tomorrow.', 'خطوات صغيرة اليوم، إنجازات كبيرة غدًا.'],
  'dash.glance': ['Your roadmap at a glance', 'مسارك في لمحة'],
  'dash.total': ['Total Skills', 'إجمالي المهارات'],
  'dash.completed': ['Completed', 'مكتملة'],
  'dash.inProgress': ['In Progress', 'قيد التقدم'],
  'dash.notStarted': ['Not Started', 'لم تبدأ'],
  'dash.overdue': [
    ({ n }) => `${enPlural(n, '{n} skill', '{n} skills')} from earlier semesters ${n === 1 ? 'is' : 'are'} still open. It’s never too late — pick one up when you have time.`,
    ({ n }) => `${arPlural(n, {
      one: 'ما زالت مهارة واحدة من الفصول السابقة غير مكتملة.',
      two: 'ما زالت مهارتان من الفصول السابقة غير مكتملتين.',
      few: 'ما زالت {n} مهارات من الفصول السابقة غير مكتملة.',
      many: 'ما زالت {n} مهارة من الفصول السابقة غير مكتملة.',
      other: 'ما زالت {n} مهارة من الفصول السابقة غير مكتملة.',
    })} لم يفت الأوان، ابدأ بإحداها حين يتسع وقتك.`,
  ],
  'dash.continue': ['Continue Learning', 'تابع التعلّم'],
  'dash.seeAll': ['See all', 'عرض الكل'],
  'dash.suggested': ['Suggested first step', 'خطوة أولى مقترحة'],
  'dash.start': ['Start', 'ابدأ'],
  'dash.caughtUp': ['You’re all caught up!', 'أنجزت كل شيء!'],
  'dash.caughtUpText': ['Explore the library for something new.', 'استكشف المكتبة لتجد شيئًا جديدًا.'],
  'dash.continueBtn': ['Continue', 'تابع'],
  'dash.upcoming': ['Upcoming Skills', 'المهارات القادمة'],
  'dash.viewAll': ['View all', 'عرض الكل'],
  'dash.nothingLeft': ['Nothing left to start in your roadmap', 'لم يبقَ ما تبدأ به في مسارك'],
  'dash.nothingLeftText': ['Great work. Check your progress or explore other skills.', 'عمل رائع! راجع تقدمك أو استكشف مهارات أخرى.'],
  'dash.thisSemester': ['This semester', 'هذا الفصل'],
  'dash.noneThisStage': ['No skills planned for this stage.', 'لا توجد مهارات مخططة لهذه المرحلة.'],
  'dash.semesterDone': ['Semester skills completed — well done!', 'أكملت مهارات هذا الفصل، أحسنت!'],
  'dash.left': [
    ({ n }) => `${enPlural(n, '{n} skill', '{n} skills')} left this semester.`,
    ({ n }) => arPlural(n, { one: 'بقيت مهارة واحدة هذا الفصل.', two: 'بقيت مهارتان هذا الفصل.', few: 'بقيت {n} مهارات هذا الفصل.', many: 'بقيت {n} مهارة هذا الفصل.', other: 'بقيت {n} مهارة هذا الفصل.' }),
  ],
  'dash.quick': ['Quick Access', 'وصول سريع'],
  'dash.qRoadmap': ['View Roadmap', 'عرض المسار'],
  'dash.qLibrary': ['Browse Skills', 'تصفّح المهارات'],
  'dash.qProgress': ['Your Progress', 'تقدّمك'],
  'dash.qResources': ['Learning Resources', 'مصادر التعلّم'],
  'dash.saved': ['Saved skills', 'المهارات المحفوظة'],
  'dash.recent': ['Recently viewed', 'شوهدت مؤخرًا'],

  'road.title': ['My Roadmap', 'خريطة مساري'],
  'road.sub': ['Your journey through university, step by step.', 'رحلتك في الجامعة، خطوة بخطوة.'],
  'road.provA': ['This roadmap is ', 'هذا المسار '],
  'road.provB': ['provisional', 'مبدئي'],
  'road.provC': [
    '. It is a suggested order, reviewed with students and experts over time — every university and student is different.',
    '، أي أنه ترتيب مقترح تتم مراجعته مع الطلاب والمختصين باستمرار، فكل جامعة وكل طالب مختلف.',
  ],
  'road.buildsOn': ['Builds on {list}', 'يعتمد على: {list}'],
  'road.here': ['You are here', 'أنت هنا'],
  'road.completedOf': ['{done}/{total} completed', 'أُكمل {done} من {total}'],
  'road.emptySem': ['No skills planned for this semester yet.', 'لا توجد مهارات مخططة لهذا الفصل بعد.'],

  'skill.fallback': ['Skill', 'مهارة'],
  'skill.breadcrumb': ['Breadcrumb', 'مسار التنقل'],
  'skill.guide': ['{min} guide', 'دليل مدته {min}'],
  'skill.save': ['Save this skill', 'احفظ هذه المهارة'],
  'skill.unsave': ['Remove from saved skills', 'أزلها من المهارات المحفوظة'],
  'skill.sections': ['Skill sections', 'أقسام المهارة'],
  'skill.tabOverview': ['Overview', 'نظرة عامة'],
  'skill.tabLearn': ['How to Learn', 'كيف تتعلّمها'],
  'skill.tabPractice': ['Practice', 'تدرّب'],
  'skill.tabResources': ['Resources', 'المصادر'],
  'skill.why': ['Why is it important?', 'لماذا هي مهمة؟'],
  'skill.when': ['When to learn?', 'متى تتعلّمها؟'],
  'skill.inRoadmap': ['In your roadmap: {stage}', 'في مسارك: {stage}'],
  'skill.how': ['How to learn?', 'كيف تتعلّمها؟'],
  'skill.openSteps': ['Open the learning steps', 'افتح خطوات التعلّم'],
  'skill.mastery': ['How to know you mastered it?', 'كيف تعرف أنك أتقنتها؟'],
  'skill.buildsOn': ['Builds on', 'تعتمد على'],
  'skill.learnIntro': [
    'Work through the steps at your own pace. Tick a step when you have done it — your progress updates automatically.',
    'اتبع الخطوات بالسرعة التي تناسبك، وضع علامة على الخطوة عندما تنجزها، وسيتحدّث تقدمك تلقائيًا.',
  ],
  'skill.step': ['Step {n}', 'الخطوة {n}'],
  'skill.nextPractice': ['Next: practise it', 'التالي: تدرّب عليها'],
  'skill.task': ['Practical task', 'مهمة عملية'],
  'skill.reflection': ['Reflection', 'تأمّلك'],
  'skill.private': ['(only you can see this)', '(لا يراه أحد غيرك)'],
  'skill.reflectionPh': [
    'What did you try? What worked, and what will you do differently next time?',
    'ماذا جرّبت؟ ما الذي نجح، وماذا ستفعل بشكل مختلف في المرة القادمة؟',
  ],
  'skill.unsaved': ['Unsaved changes', 'تغييرات غير محفوظة'],
  'skill.saveReflection': ['Save reflection', 'احفظ التأمّل'],
  'skill.noResources': ['No resources linked to this skill yet. Browse the', 'لا توجد مصادر مرتبطة بهذه المهارة بعد. تصفّح'],
  'skill.resourceLibrary': ['resource library', 'مكتبة المصادر'],
  'skill.reviewed': [
    'External resources are reviewed for relevance and accessibility. Last reviewed {date}.',
    'تتم مراجعة المصادر الخارجية للتأكد من صلتها وسهولة الوصول إليها. آخر مراجعة: {date}.',
  ],
  'skill.englishNote': ['', 'معظم المصادر الخارجية باللغة الإنجليزية.'],
  'skill.yourProgress': ['Your progress', 'تقدّمك'],
  'skill.progressAria': ['Your progress on this skill', 'تقدمك في هذه المهارة'],
  'skill.start': ['Start learning', 'ابدأ التعلّم'],
  'skill.complete': ['Mark as completed', 'حدّدها كمكتملة'],
  'skill.completedOn': ['Completed on {date}', 'اكتملت في {date}'],
  'skill.disclaimer': [
    'Marking a skill as completed is your own judgement — it is not a test or a certificate of mastery.',
    'تحديد المهارة كمكتملة تقديرك الشخصي، وليس اختبارًا ولا شهادة إتقان.',
  ],
  'skill.keepWorking': ['Keep working on it', 'واصل العمل عليها'],
  'skill.reset': ['Reset', 'إعادة ضبط'],
  'skill.relatedResources': ['Related resources', 'مصادر ذات صلة'],
  'skill.related': ['Related skills', 'مهارات ذات صلة'],
  'skill.toastDone': ['Nice work! Skill marked as completed.', 'عمل رائع! حُدّدت المهارة كمكتملة.'],
  'skill.toastStarted': ['Skill started — follow the steps below.', 'بدأت المهارة، اتبع الخطوات أدناه.'],
  'skill.toastSaved': ['Saved to your dashboard.', 'حُفظت في لوحتك.'],
  'skill.toastUnsaved': ['Removed from saved skills.', 'أُزيلت من المهارات المحفوظة.'],
  'skill.toastReflection': ['Reflection saved.', 'تم حفظ التأمّل.'],

  'prog.sub': ['Track your journey and keep going!', 'تابع رحلتك وواصل التقدم!'],
  'prog.filter': ['Filter skills', 'تصفية المهارات'],
  'prog.all': ['All Skills', 'كل المهارات'],
  'prog.overall': ['Overall Progress', 'التقدم الكلي'],
  'prog.inRoadmap': ['In your roadmap', 'في مسارك'],
  'prog.extra': [
    ({ n }) => `Plus ${enPlural(n, '{n} skill', '{n} skills')} you explored outside your roadmap.`,
    ({ n }) => arPlural(n, {
      one: 'إضافةً إلى مهارة واحدة استكشفتها خارج مسارك.',
      two: 'إضافةً إلى مهارتين استكشفتهما خارج مسارك.',
      few: 'إضافةً إلى {n} مهارات استكشفتها خارج مسارك.',
      many: 'إضافةً إلى {n} مهارة استكشفتها خارج مسارك.',
      other: 'إضافةً إلى {n} مهارة استكشفتها خارج مسارك.',
    }),
  ],
  'prog.bySemester': ['By semester', 'حسب الفصل'],
  'prog.categories': ['Skill Categories', 'فئات المهارات'],
  'prog.recent': ['Recent activity', 'آخر النشاطات'],
  'prog.noActivity': ['No activity yet', 'لا يوجد نشاط بعد'],
  'prog.noActivityText': ['Start a skill from your roadmap and it will show up here.', 'ابدأ مهارة من مسارك وستظهر هنا.'],
  'prog.empty': ['Nothing here yet', 'لا شيء هنا بعد'],
  'prog.emptyCompleted': ['Complete your first skill and it will appear here.', 'أكمل أول مهارة لك وستظهر هنا.'],
  'prog.emptyOther': ['Try another filter.', 'جرّب تصفية أخرى.'],
  'prog.bigPicture': ['Look at the bigger picture', 'انظر إلى الصورة الأكبر'],

  'lib.sub': ['Explore all skills and find what you need.', 'استكشف كل المهارات وجد ما تحتاجه.'],
  'lib.search': ['Search for a skill…', 'ابحث عن مهارة…'],
  'lib.searchLabel': ['Search for a skill', 'ابحث عن مهارة'],
  'lib.allLevels': ['All levels', 'كل المستويات'],
  'lib.level': ['Level', 'المستوى'],
  'lib.all': ['All', 'الكل'],
  'lib.category': ['Category', 'الفئة'],
  'lib.none': ['No skills match your search', 'لا توجد مهارات مطابقة لبحثك'],
  'lib.noneText': ['Try a different word or clear the filters.', 'جرّب كلمة أخرى أو امسح عوامل التصفية.'],
  'lib.forYou': ['For you now', 'مناسبة لك الآن'],

  'res.sub': ['Helpful resources to support your learning.', 'مصادر مفيدة تدعم تعلّمك.'],
  'res.type': ['Resource type', 'نوع المصدر'],
  'res.search': ['Search resources, sources or skills…', 'ابحث في المصادر أو الجهات أو المهارات…'],
  'res.searchLabel': ['Search resources', 'البحث في المصادر'],
  'res.none': ['No resources found', 'لم يُعثر على مصادر'],
  'res.noneText': ['Try another type or search term.', 'جرّب نوعًا آخر أو كلمة بحث أخرى.'],
  'res.note': [
    'Gapper links to external sources and credits their authors. Links are reviewed periodically (last review: {date}). Found a broken or outdated link?',
    'يربط Gapper بمصادر خارجية وينسبها إلى أصحابها، وتتم مراجعة الروابط دوريًا (آخر مراجعة: {date}). وجدت رابطًا معطلًا أو قديمًا؟',
  ],
  'res.tellUs': ['Tell us', 'أخبرنا'],

  'set.sub': ['Manage your profile, account and feedback.', 'أدِر ملفك وحسابك وملاحظاتك.'],
  'set.stage': ['Your stage', 'مرحلتك'],
  'set.stageDesc': ['Your program, year and semester decide which skills Gapper suggests.', 'يحدد تخصصك وسنتك وفصلك المهارات التي يقترحها Gapper.'],
  'set.language': ['Language', 'اللغة'],
  'set.languageDesc': ['Choose the language of the interface and the learning content.', 'اختر لغة الواجهة ومحتوى التعلّم.'],
  'set.account': ['Account', 'الحساب'],
  'set.accountGuest': ['Keep your progress by adding a login.', 'احفظ تقدمك بإضافة بيانات دخول.'],
  'set.signedInAs': ['Signed in as {email}', 'مسجّل الدخول باسم {email}'],
  'set.feedback': ['Feedback', 'ملاحظاتك'],
  'set.feedbackDesc': [
    'Gapper is early-stage. Your feedback directly shapes the content and the roadmap.',
    'Gapper في مراحله الأولى، وملاحظاتك تشكّل المحتوى والمسار مباشرة.',
  ],
  'set.privacy': ['Privacy', 'الخصوصية'],
  'set.privacyDesc': ['What we keep, and why.', 'ما الذي نحفظه، ولماذا.'],
  'set.privacy1': ['Your name and email — to identify your account.', 'اسمك وبريدك الإلكتروني، للتعرّف على حسابك.'],
  'set.privacy2': ['Your program, year and progress on skills — to show your roadmap and dashboard.', 'تخصصك وسنتك وتقدمك في المهارات، لعرض مسارك ولوحتك.'],
  'set.privacy3': ['Feedback you choose to send — to improve Gapper.', 'الملاحظات التي تختار إرسالها، لتحسين Gapper.'],
  'set.privacyNote': ['Passwords are stored as secure hashes. We don’t sell or share your data.', 'تُخزَّن كلمات المرور بصيغة مشفّرة آمنة، ولا نبيع بياناتك ولا نشاركها.'],
  'set.session': ['Session', 'الجلسة'],
  'set.sessionDesc': ['Log out of this device, or delete your account and data.', 'سجّل الخروج من هذا الجهاز، أو احذف حسابك وبياناتك.'],
  'set.yearOption': ['{title} — {subtitle}', '{title}، {subtitle}'],
  'set.profileUpdated': ['Profile updated.', 'تم تحديث ملفك.'],
  'set.upgradeText': [
    'You’re using a guest account. Add your details to keep your progress and log in from any device.',
    'أنت تستخدم حساب ضيف. أضف بياناتك لتحفظ تقدمك وتدخل من أي جهاز.',
  ],
  'set.createAccount': ['Create my account', 'أنشئ حسابي'],
  'set.creating': ['Creating…', 'جارٍ الإنشاء…'],
  'set.accountCreated': ['Account created — your progress is saved.', 'تم إنشاء حسابك، وتقدمك محفوظ.'],
  'set.currentPassword': ['Current password', 'كلمة المرور الحالية'],
  'set.newPassword': ['New password', 'كلمة المرور الجديدة'],
  'set.changePassword': ['Change password', 'غيّر كلمة المرور'],
  'set.passwordChanged': ['Password changed.', 'تم تغيير كلمة المرور.'],
  'set.howUseful': ['How useful is Gapper for you so far?', 'ما مدى فائدة Gapper لك حتى الآن؟'],
  'set.stars': ['{n} out of 5', '{n} من 5'],
  'set.message': ['Your message', 'رسالتك'],
  'set.messagePh': [
    'What helped? What was confusing? Is a skill missing, or a link broken?',
    'ما الذي ساعدك؟ ما الذي كان مربكًا؟ هل تنقص مهارة أو يوجد رابط معطّل؟',
  ],
  'set.send': ['Send feedback', 'أرسل ملاحظاتك'],
  'set.sending': ['Sending…', 'جارٍ الإرسال…'],
  'set.thanks': ['Thank you! Your feedback helps shape Gapper.', 'شكرًا لك! ملاحظاتك تساعد في تطوير Gapper.'],
  'set.delete': ['Delete my account', 'احذف حسابي'],
  'set.deleteWarnA': ['This permanently deletes your account and all your progress.', 'سيؤدي هذا إلى حذف حسابك وكل تقدمك نهائيًا.'],
  'set.deleteWarnB': ['It cannot be undone.', 'ولا يمكن التراجع عن ذلك.'],
  'set.confirmPassword': ['Enter your password to confirm', 'أدخل كلمة المرور للتأكيد'],
  'set.confirmDelete': ['Yes, delete everything', 'نعم، احذف كل شيء'],
  'set.deleting': ['Deleting…', 'جارٍ الحذف…'],

  'jour.back': ['Back to dashboard', 'العودة إلى لوحتك'],
  'jour.home': ['Back home', 'العودة إلى الرئيسية'],
  'jour.q1': ['Small steps', 'خطوات صغيرة'],
  'jour.q2': ['today,', 'اليوم،'],
  'jour.q3': ['big opportunities', 'فرص كبيرة'],
  'jour.q4': ['tomorrow.', 'غدًا.'],
  'jour.completed': ['skills completed', 'مكتملة'],
  'jour.inProgress': ['in progress', 'قيد التقدم'],
  'jour.ahead': ['still ahead', 'ما زالت أمامك'],
  'jour.heading': ['Where Gapper is heading', 'إلى أين يتجه Gapper'],
  'jour.note': ['Future ideas, shaped by student feedback — not available yet.', 'أفكار مستقبلية تتشكّل من ملاحظات الطلاب، وغير متاحة بعد.'],

  'nf.title': ['Page not found', 'الصفحة غير موجودة'],
  'nf.heading': ['This path doesn’t lead anywhere yet.', 'هذا الطريق لا يقود إلى أي مكان بعد.'],
  'nf.text': ['The page you’re looking for doesn’t exist or has moved.', 'الصفحة التي تبحث عنها غير موجودة أو نُقلت.'],

  'ill.hero': ['A student standing on stepping stones along a winding path that leads toward a city', 'طالب يقف على حجارة في طريق متعرّج يؤدي إلى مدينة'],
  'ill.hills': ['Rolling hills with a small sprout growing on top', 'تلال متموّجة تنمو فوقها نبتة صغيرة'],
};

// ---------- Language state ----------

let currentLang = 'en';
export const getLang = () => currentLang;

function initialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'ar' || saved === 'en') return saved;
  } catch { /* storage unavailable */ }
  return (navigator.language || '').toLowerCase().startsWith('ar') ? 'ar' : 'en';
}

export function translate(lang, key, vars) {
  const pair = M[key];
  if (!pair) return key;
  const value = pair[lang === 'ar' ? 1 : 0];
  if (typeof value === 'function') return value(vars || {});
  return vars ? value.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? '')) : value;
}

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    currentLang = initialLang();
    return currentLang;
  });

  useEffect(() => {
    currentLang = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* storage unavailable */ }
  }, [lang]);

  const setLang = useCallback((next) => {
    currentLang = next;
    setLangState(next);
  }, []);

  const value = useMemo(() => {
    const t = (key, vars) => translate(lang, key, vars);
    return {
      lang,
      setLang,
      toggle: () => setLang(lang === 'ar' ? 'en' : 'ar'),
      t,
      locale: LOCALE[lang],
      stage: (year, semester) => t('stage.label', { year, semester }),
      minutes: (n) => t('common.min', { n }),
      list: (items) => items.join(t('common.listSep')),
    };
  }, [lang, setLang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useI18n() {
  return useContext(LangContext);
}

// ---------- Formatting ----------

export function parseDate(value) {
  if (!value) return null;
  return new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`);
}

export function formatDate(value, lang) {
  const date = parseDate(value);
  return date ? date.toLocaleDateString(LOCALE[lang], { day: 'numeric', month: 'long', year: 'numeric' }) : '';
}

// "2026-10" → "October 2026"
export function formatMonth(value, lang) {
  if (!value) return '';
  const [y, m] = value.split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, 1)).toLocaleDateString(LOCALE[lang], { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function timeAgo(value, lang) {
  const date = parseDate(value);
  if (!date) return '';
  const rtf = new Intl.RelativeTimeFormat(LOCALE[lang], { numeric: 'auto' });
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return rtf.format(0, 'second');
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), 'hour');
  if (abs < 7 * 86400) return rtf.format(Math.round(seconds / 86400), 'day');
  return date.toLocaleDateString(LOCALE[lang], { day: 'numeric', month: 'short' });
}

// Loose matching for search: ignores case, Arabic diacritics and common letter variants.
export function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');
}

// Light Arabic stemming so "المقابلة" also finds "المقابلات": drops a leading "ال" and one common suffix.
function stem(word) {
  let w = word;
  if (/^(وال|بال|كال|فال)/.test(w) && w.length > 5) w = w.slice(3);
  else if (w.startsWith('ال') && w.length > 4) w = w.slice(2);
  for (const suffix of ['ات', 'ون', 'ين', 'ه', 'ي']) {
    if (w.endsWith(suffix) && w.length - suffix.length >= 3) { w = w.slice(0, -suffix.length); break; }
  }
  return w;
}

export function searchTerms(query) {
  return normalize(query).split(/\s+/).filter(Boolean).map(stem);
}

export function matchesSearch(text, terms) {
  return terms.every((term) => text.includes(term));
}
