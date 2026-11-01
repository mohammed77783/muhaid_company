import { plural } from './plural';

// Arabic is the source of truth: en.ts must match this shape exactly. Copy follows
// muhaid-design-system/writing-and-tone.md: formal MSA, verbs on buttons, no
// exclamation marks, and the real verb (nothing in Muhaid deletes).
// Each feature adds its own section as it is built.

export const ar = {
  app: {
    tagline: 'تفتيش المواقع الإنشائية',
  },

  common: {
    save: 'حفظ',
    cancel: 'إلغاء',
    close: 'إغلاق',
    back: 'رجوع',
    retry: 'إعادة المحاولة',
    refresh: 'تحديث',
    edit: 'تعديل',
    confirm: 'تأكيد',
    search: 'بحث',
    clear: 'مسح',
    remove: 'إزالة',
    logout: 'تسجيل الخروج',
    loading: 'جارٍ التحميل',
    required: 'مطلوب',
    optional: 'اختياري',
    all: 'الكل',
    none: 'لا يوجد',
    noEndDate: 'بلا تاريخ انتهاء',
    noResults: 'لا نتائج',
  },

  language: {
    label: 'اللغة',
    switchTo: 'English',
    switchToLabel: 'Switch to English',
  },

  nav: {
    main: 'التنقل الرئيسي',
    breadcrumbs: 'مسار التنقل',
  },

  pagination: {
    label: 'التنقل بين الصفحات',
    previous: 'الصفحة السابقة',
    next: 'الصفحة التالية',
    perPage: 'عدد الصفوف في الصفحة',
  },

  filters: {
    remove: 'إزالة عامل التصفية',
    clearAll: 'مسح عوامل التصفية',
  },

  answer: {
    groupLabel: 'الإجابة',
    noteLabel: 'ملاحظة على هذه المخالفة',
    notePlaceholder: 'اكتب ما لاحظته',
    noteRequired: 'مطلوبة مع كل إجابة «لا».',
    addNote: 'إضافة ملاحظة',
    optionalNoteLabel: 'ملاحظة (اختيارية)',
  },

  photo: {
    alt: 'صورة التفتيش',
    take: 'التقاط صورة',
    helper: 'صورة واحدة، حتى 5 م.ب',
    errorTitle: 'تعذر استخدام هذه الصورة',
    errorBody: 'الحد الأقصى 5 م.ب. أعد التقاط الصورة.',
    remove: 'إزالة الصورة',
    unavailable: 'الصورة غير متوفرة. تعذر العثور على ملفها على الخادم.',
    unreachable: 'تعذر تحميل الصورة. تحقق من الاتصال.',
    open: 'عرض الصورة بالحجم الكامل',
    viewerTitle: 'صورة التفتيش',
    download: 'تنزيل الصورة',
  },

  outboxEntry: {
    uploading: 'جارٍ الرفع',
  },

  questionRow: {
    reorder: (n: number): string => `إعادة ترتيب السؤال ${n}`,
    remove: (n: number): string => `إزالة السؤال ${n}`,
    locked: 'مقفل',
  },

  offline: {
    banner:
      'لا يوجد اتصال. ما تحفظه يبقى على هذا الجهاز ويُرسل عند توفر الاتصال.',
  },

  login: {
    title: 'تسجيل الدخول',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    submit: 'تسجيل الدخول',
    submitting: 'جارٍ تسجيل الدخول',
    emailInvalid: 'اكتب بريداً إلكترونياً صحيحاً، مثل name@example.com.',
    passwordRequired: 'اكتب كلمة المرور.',
    passwordTooLong: 'كلمة المرور أطول من 200 حرف.',
    invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    sessionEnded:
      'انتهت جلستك. سجّل الدخول للمتابعة. ما حفظته على هذا الجهاز لم يُفقد.',
  },

  session: {
    expiring: (minutes: number): string =>
      plural('ar', minutes, {
        zero: 'تنتهي جلستك خلال أقل من دقيقة. ما حفظته على هذا الجهاز لن يُفقد.',
        one: 'تنتهي جلستك بعد دقيقة واحدة. ما حفظته على هذا الجهاز لن يُفقد.',
        two: 'تنتهي جلستك بعد دقيقتين. ما حفظته على هذا الجهاز لن يُفقد.',
        few: 'تنتهي جلستك بعد {n} دقائق. ما حفظته على هذا الجهاز لن يُفقد.',
        other: 'تنتهي جلستك بعد {n} دقيقة. ما حفظته على هذا الجهاز لن يُفقد.',
      }),
    loginAgain: 'تسجيل الدخول من جديد',
  },

  wrongRole: {
    inspectorTitle: 'هذه الصفحات مخصصة للمفتشين',
    inspectorBody: 'حسابك حساب مسؤول، وصفحاته في لوحة التحكم.',
    inspectorAction: 'الانتقال إلى لوحة التحكم',
    adminTitle: 'هذه الصفحات مخصصة للمسؤولين',
    adminBody: 'حسابك حساب مفتش، وصفحاته في تطبيق التفتيش.',
    adminAction: 'الانتقال إلى تطبيق التفتيش',
  },

  inspector: {
    sectionsLabel: 'الأقسام',
    forms: 'النماذج',
    outbox: 'الصادر',
    sent: 'المُرسل',
    formsTitle: 'النماذج المعيّنة',
    outboxTitle: 'الصادر',
    sentTitle: 'التفتيشات المُرسلة',
  },

  forms: {
    emptyTitle: 'لا توجد نماذج معيّنة لك',
    emptyBody: 'اطلب من مسؤول الموقع تعيين نموذج تفتيش لك.',
    expiredTitle: 'انتهت صلاحية النماذج المحفوظة على هذا الجهاز',
    expiredBody: 'اتصل بالإنترنت لتحديث قائمة النماذج.',
    downloadFirst: 'اتصل بالإنترنت مرة واحدة لتنزيل نماذجك.',
    lastUpdated: (when: string): string => `آخر تحديث للنماذج: ${when}`,
    refreshFailed: 'تعذر تحديث النماذج. النسخة المحفوظة ما زالت متاحة.',
  },

  outbox: {
    sentCount: (n: number): string =>
      plural('ar', n, {
        one: 'تم إرسال تفتيش واحد',
        two: 'تم إرسال تفتيشين',
        few: 'تم إرسال {n} تفتيشات',
        other: 'تم إرسال {n} تفتيشاً',
      }),
    failedOne: (workOrder: string): string => `فشل إرسال ${workOrder}`,
    failedCount: (n: number): string =>
      plural('ar', n, {
        two: 'فشل إرسال تفتيشين',
        few: 'فشل إرسال {n} تفتيشات',
        other: 'فشل إرسال {n} تفتيشاً',
      }),
    view: 'عرض الصادر',
    emptyTitle: 'لا توجد تفتيشات في الانتظار',
    emptyBody: 'كل ما حفظته على هذا الجهاز تم إرساله.',
    waitingCount: (n: number): string =>
      plural('ar', n, {
        one: 'تفتيش واحد في الانتظار',
        two: 'تفتيشان في الانتظار',
        few: '{n} تفتيشات في الانتظار',
        other: '{n} تفتيشاً في الانتظار',
      }),
    sendNow: 'إرسال الآن',
    stuck: (n: number): string =>
      plural('ar', n, {
        one: 'تعذر إرسال تفتيش واحد. راجع السبب أدناه واتبع الخطوة المقترحة.',
        two: 'تعذر إرسال تفتيشين. راجع السبب أدناه واتبع الخطوة المقترحة.',
        few: 'تعذر إرسال {n} تفتيشات. راجع السبب أدناه واتبع الخطوة المقترحة.',
        other:
          'تعذر إرسال {n} تفتيشاً. راجع السبب أدناه واتبع الخطوة المقترحة.',
      }),
    reasonFormChanged:
      'تغيّرت أسئلة هذا النموذج بعد تعبئته. أعد تعبئته بأحدث نسخة.',
    reasonPhoto: 'رفض الخادم الصورة. التقط صورة جديدة ثم أعد الإرسال.',
    reasonTooLarge: 'الصورة أكبر من الحد المسموح (5 م.ب). التقط صورة جديدة.',
    reasonValidation: (message: string): string =>
      `رفض الخادم بعض البيانات: ${message}`,
    reasonUnassigned:
      'لم يعد هذا النموذج معيّناً لك. اطلب من مسؤول الموقع تعيينه ثم أعد المحاولة.',
    reasonDuplicateId:
      'رقم هذا التفتيش مستخدم في سجل آخر. أعد إرساله كتفتيش جديد.',
    reasonCompleted: 'أُرسل بالفعل نموذج لأمر العمل هذا. تخلَّ عن هذا الإدخال.',
    reasonOutOfDates:
      'لم يكن النموذج ساري المفعول في تاريخ التعبئة. راجع مسؤول الموقع.',
    reasonOther: (message: string): string => `تعذر الإرسال: ${message}`,
    correct: 'تصحيح البيانات',
    takeNewPhoto: 'التقاط صورة جديدة',
    refill: 'إعادة التعبئة',
    resubmitAsNew: 'إرسال كتفتيش جديد',
    discard: 'تجاهل',
    discardTitle: 'تجاهل هذا التفتيش؟',
    discardBody: (workOrder: string): string =>
      `لن يُرسل التفتيش ${workOrder}، ولا يمكن استرجاع إجاباته وصورته بعد ذلك.`,
    discardConfirm: 'تجاهل التفتيش',
    editTitle: 'تصحيح التفتيش',
    editSave: 'حفظ وإعادة الإرسال',
    editSaved: 'حُفظ التصحيح على هذا الجهاز',
    entryGoneTitle: 'لم يعد هذا التفتيش في الصادر',
    entryGoneBody: 'ربما أُرسل أو تم تجاهله. راجع قائمة الصادر.',
    backToOutbox: 'العودة إلى الصادر',
    refillNotice:
      'حُفظ رقم أمر العمل والصورة من النسخة السابقة. أجب عن الأسئلة بأحدث نسخة من النموذج.',
    logoutTitle: (n: number): string =>
      plural('ar', n, {
        one: 'لم يُرسل تفتيش واحد بعد. هل تريد تسجيل الخروج؟',
        two: 'لم يُرسل تفتيشان بعد. هل تريد تسجيل الخروج؟',
        few: 'لم تُرسل {n} تفتيشات بعد. هل تريد تسجيل الخروج؟',
        other: 'لم يُرسل {n} تفتيشاً بعد. هل تريد تسجيل الخروج؟',
      }),
    logoutBody:
      'تبقى محفوظة على هذا الجهاز، ولن تُرسل حتى تسجّل الدخول بحسابك من جديد.',
  },

  fillForm: {
    loadingTitle: 'تعبئة النموذج',
    workOrder: 'رقم أمر العمل',
    answered: 'تمت الإجابة',
    progress: 'التقدم',
    unanswered: 'اختر إجابة لهذا السؤال.',
    noteRequired: 'اكتب ملاحظة مع كل إجابة «لا».',
    noteTooLong: 'الملاحظة أطول من 1000 حرف.',
    photoLabel: 'صورة التفتيش',
    photoRequiredTitle: 'الصورة مطلوبة',
    photoTooLarge: (size: string): string =>
      `الحد الأقصى 5 م.ب. حجم الملف ${size}. أعد التقاط الصورة.`,
    photoType: 'الملف ليس صورة مدعومة. استخدم صورة JPEG أو PNG أو WebP.',
    preparingPhoto: 'جارٍ تجهيز الصورة',
    save: 'حفظ التفتيش',
    saveHint: 'يُحفظ على هذا الجهاز ويُرسل عند توفر الاتصال.',
    fixErrors: 'أكمل الحقول المحددة قبل الحفظ.',
    saved: 'حُفظ التفتيش على هذا الجهاز',
    saveFailed: 'تعذر حفظ التفتيش على هذا الجهاز. إجاباتك ما زالت في النموذج.',
    formChanged:
      'حدّث المسؤول هذا النموذج. راجع الأسئلة وأجب عن الأسئلة الجديدة قبل الحفظ.',
    unavailableTitle: 'هذا النموذج لم يعد متاحاً لك',
    unavailableBody: 'اطلب من مسؤول الموقع التحقق من تعيين النموذج.',
    outOfDateTitle: 'هذا النموذج خارج فترة صلاحيته',
    outOfDateBody: 'لا يمكن تعبئته اليوم. اختر نموذجاً آخر من القائمة.',
    backToForms: 'العودة إلى النماذج',
    leaveTitle: 'تجاهل الإجابات؟',
    leaveBody:
      'لن تُحفظ إجابات هذا النموذج. النماذج المحفوظة في الصادر لن تتأثر.',
    leaveConfirm: 'تجاهل الإجابات',
    keepFilling: 'متابعة التعبئة',
  },

  sent: {
    searchLabel: 'البحث برقم أمر العمل',
    searchHelp: 'اكتب الرقم كاملاً ثم اضغط بحث.',
    syncedLater: (delay: string): string => `أُرسل بعد ${delay}`,
    columnWorkOrder: 'أمر العمل',
    columnTemplate: 'النموذج',
    columnProject: 'المشروع',
    columnFilledAt: 'تاريخ التعبئة',
    columnSync: 'الإرسال',
    onTime: 'في وقته',
    emptyTitle: 'لم تُرسل أي تفتيشات بعد',
    emptyBody: 'ما ترسله يظهر هنا. ما لم يُرسل بعد موجود في الصادر.',
    noMatchTitle: 'لا يوجد تفتيش بهذا الرقم',
    noMatchBody:
      'يطابق البحث رقم أمر العمل كاملاً. تحقق من الرقم أو امسح البحث.',
    pastEndTitle: 'لا توجد نتائج في هذه الصفحة',
    pastEndBody: 'عدد الصفحات أقل من الرقم في الرابط.',
    firstPage: 'الانتقال إلى الصفحة الأولى',
    downloadFirst:
      'اتصل بالإنترنت لعرض هذه الصفحة. ما عرضته سابقاً يبقى متاحاً.',
    notFoundTitle: 'لم يُعثر على هذا التفتيش',
    notFoundBody: 'قد يكون الرابط غير صحيح، أو أن التفتيش لم يُرسل من حسابك.',
    backToList: 'العودة إلى التفتيشات المُرسلة',
  },

  record: {
    workOrder: 'أمر العمل',
    template: 'النموذج',
    project: 'المشروع',
    inspector: 'المفتش',
    filledAt: 'تاريخ التعبئة',
    receivedAt: 'تاريخ الاستلام',
    syncDelay: 'مدة الانتظار قبل الإرسال',
    photo: 'الصورة',
    answers: 'الإجابات',
    note: 'ملاحظة',
    onlyFindings: 'عرض المخالفات فقط',
    noFindings: 'لا توجد مخالفات في هذا التفتيش.',
    summaryCount: (label: string, n: number): string => `${label} ${n}`,
  },

  admin: {
    inspections: 'التفتيشات',
    projects: 'المشاريع',
    templates: 'النماذج',
    users: 'المستخدمون',
    openMenu: 'فتح القائمة',
    closeMenu: 'إغلاق القائمة',
    backTo: {
      inspections: 'العودة إلى التفتيشات',
      projects: 'العودة إلى المشاريع',
      templates: 'العودة إلى النماذج',
      users: 'العودة إلى المستخدمين',
    },
    created: 'تاريخ الإنشاء',
  },

  users: {
    add: 'إضافة مستخدم',
    addTitle: 'إضافة مستخدم',
    editTitle: 'تعديل المستخدم',
    name: 'الاسم',
    email: 'البريد الإلكتروني',
    emailReadOnly: 'لا يمكن تغيير البريد الإلكتروني.',
    password: 'كلمة المرور',
    passwordHelp: 'من 8 إلى 200 حرف.',
    generate: 'إنشاء كلمة مرور',
    generatedHelp: 'انسخ كلمة المرور الآن وسلّمها للمستخدم. لن تظهر بعد الحفظ.',
    role: 'الدور',
    status: 'الحالة',
    filterAll: 'الكل',
    filterActive: 'نشط',
    filterInactive: 'موقوف',
    emptyTitle: 'لا يوجد مستخدمون بعد',
    emptyBody: 'أضف مستخدماً ليبدأ العمل.',
    noMatchTitle: 'لا يوجد مستخدمون بهذه التصفية',
    noMatchBody: 'جرّب تصفية أوسع أو امسح عوامل التصفية.',
    notFoundTitle: 'لم يُعثر على هذا المستخدم',
    notFoundBody: 'قد يكون الرابط غير صحيح. راجع قائمة المستخدمين.',
    create: 'إنشاء المستخدم',
    created: (name: string): string => `أُنشئ حساب ${name}`,
    updated: 'حُفظت التغييرات',
    nameRequired: 'اكتب الاسم.',
    nameTooLong: 'الاسم أطول من 200 حرف.',
    emailInvalid: 'اكتب بريداً إلكترونياً صحيحاً، مثل name@example.com.',
    emailTaken: 'يوجد مستخدم بهذا البريد الإلكتروني.',
    passwordInvalid: 'كلمة المرور من 8 إلى 200 حرف.',
    promoteWarning:
      'سيبقى ما عُيّن له من نماذج، لكنه لن يتمكن من استخدام تطبيق التفتيش بعد تحويله إلى مسؤول.',
    selfRole: 'لا يمكنك إزالة دور المسؤول عن حسابك.',
    selfActive: 'لا يمكنك إيقاف حسابك.',
    accountActive: 'الحساب نشط',
    resetPassword: 'إعادة تعيين كلمة المرور',
    resetTitle: 'إعادة تعيين كلمة المرور',
    resetSave: 'حفظ كلمة المرور',
    resetDone: 'حُفظت كلمة المرور الجديدة',
    deactivateTitle: (name: string): string => `إيقاف حساب ${name}؟`,
    deactivateBody:
      'سيُسجَّل خروجه فوراً ولن يمكن تعيين نماذج جديدة له. التفتيشات التي أرسلها والنماذج المعيّنة له تبقى محفوظة، وما لم يُرسل من جهازه لن يصل حتى يُعاد تفعيل حسابه.',
    deactivateConfirm: 'إيقاف الحساب',
    reactivateTitle: (name: string): string => `إعادة تفعيل حساب ${name}؟`,
    reactivateBody: 'سيتمكن من تسجيل الدخول من جديد.',
    reactivateConfirm: 'إعادة تفعيل الحساب',
    assignedTemplates: 'النماذج المعيّنة',
    noTemplatesTitle: 'لا توجد نماذج معيّنة لهذا المفتش',
    noTemplatesBody: 'عيّن المفتشين من صفحة النموذج.',
    columnProject: 'المشروع',
    columnTemplate: 'النموذج',
    columnValidity: 'فترة الصلاحية',
    columnAssigned: 'تاريخ التعيين',
    columnStatus: 'الحالة',
  },

  projects: {
    add: 'مشروع جديد',
    addTitle: 'مشروع جديد',
    editTitle: 'تعديل المشروع',
    code: 'رمز المشروع',
    codeHelp: 'أحرف إنجليزية وأرقام و - و _ فقط.',
    name: 'اسم المشروع',
    create: 'إنشاء المشروع',
    created: 'أُنشئ المشروع',
    updated: 'حُفظت التغييرات',
    codeRequired: 'اكتب رمز المشروع.',
    codeTooLong: 'رمز المشروع أطول من 50 حرفاً.',
    codeInvalid: 'استخدم أحرفاً إنجليزية وأرقاماً و - و _ فقط.',
    codeTaken: 'يوجد مشروع بهذا الرمز.',
    nameRequired: 'اكتب اسم المشروع.',
    nameTooLong: 'اسم المشروع أطول من 200 حرف.',
    codeChangeNote:
      'تبقى الصور المرفوعة سابقاً في المجلد الذي يحمل الرمز القديم، وتُحفظ الصور الجديدة باسم الرمز الجديد.',
    emptyTitle: 'لا توجد مشاريع بعد',
    emptyBody: 'أنشئ مشروعاً ثم أضف إليه نماذج التفتيش.',
    notFoundTitle: 'لم يُعثر على هذا المشروع',
    notFoundBody: 'قد يكون الرابط غير صحيح. راجع قائمة المشاريع.',
    templates: 'نماذج المشروع',
    newTemplate: 'نموذج جديد',
    viewInspections: 'عرض التفتيشات',
    noTemplatesTitle: 'لا توجد نماذج في هذا المشروع',
    noTemplatesBody: 'أنشئ أول نموذج تفتيش لهذا المشروع.',
    selectLabel: 'المشروع',
    selectPlaceholder: 'ابحث بالرمز أو الاسم',
  },

  templates: {
    add: 'نموذج جديد',
    project: 'المشروع',
    allProjects: 'كل المشاريع',
    name: 'اسم النموذج',
    validFrom: 'صالح من',
    validTo: 'صالح إلى',
    noEndDate: 'بلا تاريخ انتهاء',
    status: 'الحالة',
    questions: 'الأسئلة',
    questionLabel: (n: number): string => `نص السؤال ${n}`,
    addQuestion: 'إضافة سؤال',
    pasteHint: 'الصق قائمة من عدة أسطر في أي حقل لتقسيمها إلى أسئلة.',
    pasteTruncated: (n: number): string =>
      `يقبل النموذج 50 سؤالاً كحد أقصى، لذلك لم يُضف ${n} من الأسطر الملصقة.`,
    questionRequired: 'اكتب نص السؤال أو أزل هذا الصف.',
    questionTooLong: 'نص السؤال أطول من 500 حرف.',
    nameRequired: 'اكتب اسم النموذج.',
    nameTooLong: 'اسم النموذج أطول من 200 حرف.',
    projectRequired: 'اختر مشروعاً.',
    validFromRequired: 'اختر تاريخ بدء الصلاحية.',
    validToRequired: 'اختر تاريخ الانتهاء أو حدد «بلا تاريخ انتهاء».',
    validToOrder: 'تاريخ الانتهاء لا يسبق تاريخ البدء.',
    replaceValidFrom:
      'يجب أن يبدأ النموذج الجديد بعد تاريخ بدء النموذج القديم.',
    emptyTitle: 'لا توجد نماذج بعد',
    emptyBody: 'أنشئ نموذج تفتيش ثم عيّن له المفتشين.',
    noMatchTitle: 'لا توجد نماذج في هذا المشروع',
    noMatchBody: 'أنشئ نموذجاً لهذا المشروع أو اختر مشروعاً آخر.',
    notFoundTitle: 'لم يُعثر على هذا النموذج',
    notFoundBody: 'قد يكون الرابط غير صحيح. راجع قائمة النماذج.',
    createTitle: 'نموذج جديد',
    editTitle: 'تعديل النموذج',
    replaceTitle: 'استبدال بنسخة جديدة',
    create: 'إنشاء النموذج',
    created: 'أُنشئ النموذج',
    updated: 'حُفظت التغييرات',
    nextAssign: 'الخطوة التالية: عيّن المفتشين. لا يظهر النموذج لأحد قبل ذلك.',
    lockedNote: 'الأسئلة مقفلة لوجود تفتيشات مسجلة على هذا النموذج.',
    lockedBanner: (n: number): string =>
      plural('ar', n, {
        one: 'الأسئلة مقفلة: تم تسجيل تفتيش واحد على هذا النموذج. لتغييرها أنشئ نسخة جديدة.',
        two: 'الأسئلة مقفلة: تم تسجيل تفتيشين على هذا النموذج. لتغييرها أنشئ نسخة جديدة.',
        few: 'الأسئلة مقفلة: تم تسجيل {n} تفتيشات على هذا النموذج. لتغييرها أنشئ نسخة جديدة.',
        other:
          'الأسئلة مقفلة: تم تسجيل {n} تفتيشاً على هذا النموذج. لتغييرها أنشئ نسخة جديدة.',
      }),
    lockedRace:
      'وصل تفتيش أثناء التعديل، فلم يُحفظ شيء وقُفلت الأسئلة. احفظ من جديد دون تغيير الأسئلة، أو أنشئ نسخة جديدة.',
    duplicate: 'إنشاء نسخة',
    replace: 'استبدال بنسخة جديدة',
    replaceNote:
      'سيُنشأ نموذج جديد، ويُعيَّن له المفتشون النشطون، وينتهي النموذج القديم في اليوم السابق لبدء الجديد.',
    replaceSubmit: 'إنشاء النسخة والاستبدال',
    stepCreate: 'إنشاء النموذج الجديد',
    stepAssign: 'تعيين المفتشين النشطين',
    stepEndOld: 'إنهاء النموذج القديم',
    stepDone: 'تم',
    stepFailed: 'لم يكتمل',
    stepWaiting: 'لم يبدأ',
    replaceFailed: 'لم تكتمل كل الخطوات. أعد المحاولة لإكمال ما تبقى.',
    replaceContinue: 'إكمال الخطوات المتبقية',
    replaced: 'استُبدل النموذج بالنسخة الجديدة',
    riskTitle: 'حفظ هذه التغييرات؟',
    riskQuestions:
      'على المفتشين الذين فتحوا النموذج تحديثه، وستُرفض النماذج غير المرسلة المبنية على الأسئلة القديمة.',
    riskDates: 'ستُرفض عند الإرسال النماذج المعبأة خارج التواريخ الجديدة.',
    riskConfirm: 'حفظ التغييرات',
    inspectionsCount: (n: number): string =>
      plural('ar', n, {
        zero: 'لم يُسجل أي تفتيش',
        one: 'تم تسجيل تفتيش واحد',
        two: 'تم تسجيل تفتيشين',
        few: 'تم تسجيل {n} تفتيشات',
        other: 'تم تسجيل {n} تفتيشاً',
      }),
    viewInspections: 'عرض التفتيشات',
    assignees: 'المفتشون المعيّنون',
    submittedAt: (date: string): string => `أُرسل ${date}`,
    assign: 'تعيين مفتشين',
    assignTitle: 'تعيين المفتشين',
    assignSubmit: (n: number): string =>
      plural('ar', n, {
        zero: 'تعيين',
        one: 'تعيين مفتش واحد',
        two: 'تعيين مفتشين',
        few: 'تعيين {n} مفتشين',
        other: 'تعيين {n} مفتشاً',
      }),
    assignSearch: 'تصفية بالاسم أو البريد',
    alreadyAssigned: 'معيّن',
    noCandidates: 'لا يوجد مفتشون نشطون.',
    invalidAssignee: 'موقوف أو لم يعد مفتشاً',
    invalidAssignees:
      'لم يُعيَّن أحد: بعض من اخترتهم موقوفون أو لم يعودوا مفتشين، وقد أُلغي تحديدهم. أعد المحاولة.',
    assigned: 'حُفظ التعيين',
    noAssigneesTitle: 'لم يُعيَّن أي مفتش',
    noAssigneesBody: 'لن يظهر هذا النموذج لأحد حتى تعيّن مفتشين.',
    removeAssignee: (name: string): string => `إزالة ${name} من هذا النموذج`,
    removeTitle: (name: string): string => `إزالة ${name} من هذا النموذج؟`,
    removeBody:
      'ستُرفض النماذج التي عبّأها ولم يرسلها بعد. التفتيشات التي أرسلها تبقى محفوظة.',
    removeConfirm: 'إزالة من النموذج',
  },

  inspections: {
    workOrder: 'أمر العمل',
    project: 'المشروع',
    template: 'النموذج',
    inspector: 'المفتش',
    from: 'من تاريخ',
    to: 'إلى تاريخ',
    filledAt: 'تاريخ التعبئة',
    receivedAt: 'تاريخ الاستلام',
    syncDelay: 'الإرسال',
    onTime: 'في وقته',
    late: (delay: string): string => `متأخر ${delay}`,
    allFilter: 'الكل',
    searchPlaceholder: 'ابحث بالاسم',
    workOrderHelp: 'الرقم كاملاً ثم Enter.',
    toBeforeFrom: 'هذا التاريخ يسبق «من تاريخ».',
    emptyTitle: 'لا توجد تفتيشات بعد',
    emptyBody: 'تظهر هنا التفتيشات التي يرسلها المفتشون.',
    noMatchTitle: 'لا توجد تفتيشات بهذه التصفية',
    noMatchBody: 'جرّب تصفية أوسع أو امسح عوامل التصفية.',
    notFoundTitle: 'لم يُعثر على هذا التفتيش',
    notFoundBody: 'قد يكون الرابط غير صحيح. راجع قائمة التفتيشات.',
    print: 'طباعة',
    tagProject: (value: string): string => `المشروع: ${value}`,
    tagTemplate: (value: string): string => `النموذج: ${value}`,
    tagInspector: (value: string): string => `المفتش: ${value}`,
    tagWorkOrder: (value: string): string => `أمر العمل: ${value}`,
  },

  // The system's whole status vocabulary: a word for every colour.
  status: {
    yes: 'نعم',
    no: 'لا',
    na: 'لا ينطبق',
    pending: 'في الانتظار',
    sending: 'جارٍ الإرسال',
    sent: 'تم الإرسال',
    failed: 'فشل الإرسال',
    upcoming: 'قادم',
    active: 'نشط',
    ended: 'منتهي',
    userActive: 'نشط',
    deactivated: 'موقوف',
  },

  roles: {
    admin: 'مسؤول',
    inspector: 'مفتش',
  },

  errors: {
    network: 'تعذر الوصول إلى الخادم. تحقق من الاتصال ثم أعد المحاولة.',
    server: 'تعذر إكمال الطلب بسبب خطأ في الخادم. أعد المحاولة بعد قليل.',
    forbidden: 'لا تملك صلاحية لهذا الإجراء.',
    unexpected: 'تعذر إكمال الطلب.',
    notFoundTitle: 'لم يُعثر على الصفحة',
    notFoundBody: 'قد يكون الرابط غير صحيح أو أن السجل لم يعد متاحاً لك.',
    loadFailedTitle: 'تعذر تحميل هذه الصفحة',
    goHome: 'العودة إلى الصفحة الرئيسية',
  },

  counts: {
    results: (n: number): string =>
      plural('ar', n, {
        zero: 'لا نتائج',
        one: 'نتيجة واحدة',
        two: 'نتيجتان',
        few: '{n} نتائج',
        many: '{n} نتيجة',
        other: '{n} نتيجة',
      }),
    questions: (n: number): string =>
      plural('ar', n, {
        zero: 'لا أسئلة',
        one: 'سؤال واحد',
        two: 'سؤالان',
        few: '{n} أسئلة',
        many: '{n} سؤالاً',
        other: '{n} سؤال',
      }),
  },
};

export type Messages = typeof ar;
