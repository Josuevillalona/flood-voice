// Shared translations for the resident intake form.
//
// Used by:
//   - src/app/dashboard/intake/page.tsx        (standalone intake page)
//   - src/components/resident-intake-dialog.tsx (modal version on the residents page)
//
// All text is static and pre-written. No runtime translation, no API calls — just
// labels stored once instead of duplicated across both screens.

export type Lang = 'en' | 'es' | 'bn' | 'zh';

export type IntakeStrings = {
    title: string; sub: string; privacy: string; req: string;
    // Section headings — semantic names so reordering doesn't require renaming keys.
    sPrefLang: string; sPersonal: string; sHousehold: string; sKin: string;
    sHealth: string; sContact: string; sConsent: string;
    name: string; dob: string; phone: string; altPhone: string; email: string;
    address: string; borough: string; floor: string; basement: string; household: string;
    yes: string; no: string;
    kinName: string; kinPhone: string; kinRel: string; kinAddr: string;
    disability: string; disabilityDesc: string; medical: string;
    // Note: language option labels are NOT in this dict — they always render in
    // their own native script (see LANG_NATIVE_LABELS below) so a Bengali speaker
    // can find "বাংলা" even when the form is currently in English. The trailing
    // "Other" option does translate per form language.
    language: string; other: string;
    contactPref: string; call: string; sms: string; both: string;
    bestTime: string; morning: string; afternoon: string; evening: string; anytime: string;
    consent: string; signature: string; signaturePlaceholder: string; date: string;
    forLiaison: string; liaisonName: string; liaisonOrg: string; regDate: string;
    neighborhood: string; formId: string;
    submitBtn: string; successTitle: string; successBody: string;
    newRegistrationBtn: string; closeBtn: string;
    validationMsg: string;
};

export const T: Record<Lang, IntakeStrings> = {
    en: {
        title: 'FloodVoice AI — Resident Registration', sub: 'Flood Emergency Early Warning System',
        privacy: 'PRIVACY NOTICE: Information collected is used solely for flood emergency response. Data is NOT shared with immigration authorities or any government agency. This program serves all residents regardless of immigration status.',
        req: '* Required field',
        sPrefLang: 'Section 1 — Preferred language',
        sPersonal: 'Section 2 — Personal information',
        sHousehold: 'Section 3 — Household & housing',
        sKin: 'Section 4 — Emergency contact',
        sHealth: 'Section 5 — Health & access needs',
        sContact: 'Section 6 — Contact preferences',
        sConsent: 'Section 7 — Consent',
        name: 'Full name *', dob: 'Date of birth *', phone: 'Phone number *',
        altPhone: 'Alternate phone', email: 'Email (optional)',
        address: 'Home address *', borough: 'Borough / ZIP code *', floor: 'Floor / apt #',
        basement: 'Basement apartment?', household: '# people in household *',
        yes: 'Yes', no: 'No',
        kinName: 'Next of kin — full name *', kinPhone: 'Next of kin — phone *',
        kinRel: 'Relationship', kinAddr: 'Next of kin address (if different)',
        disability: 'Disability affecting evacuation?', disabilityDesc: 'Please describe',
        medical: 'Medical conditions relevant to emergency response (optional)',
        language: 'Preferred language *', other: 'Other',
        contactPref: 'Preferred contact method *',
        call: 'Voice call', sms: 'SMS / text', both: 'Both',
        bestTime: 'Best time to reach you',
        morning: 'Morning (8am–12pm)', afternoon: 'Afternoon (12–5pm)', evening: 'Evening (5–8pm)', anytime: 'Anytime',
        consent: 'I consent to be contacted by FloodVoice AI during flood warnings for welfare checks. I understand that pressing 2 during a call will alert emergency responders to my location. Data is used only for flood emergency response.',
        signature: 'Signature (type full name) *', signaturePlaceholder: 'Full name', date: 'Date *',
        forLiaison: 'For liaison use only',
        liaisonName: 'Liaison name', liaisonOrg: 'Organization', regDate: 'Registration date',
        neighborhood: 'Neighborhood / pilot site', formId: 'Form ID',
        submitBtn: 'Submit registration',
        successTitle: 'Registration submitted',
        successBody: 'This resident has been enrolled in FloodVoice AI flood emergency alerts.',
        newRegistrationBtn: 'Start new registration',
        closeBtn: 'Done',
        validationMsg: 'Please complete all required fields (*).',
    },
    es: {
        title: 'FloodVoice AI — Registro de Residente', sub: 'Sistema de Alerta Temprana de Emergencias por Inundaciones',
        privacy: 'AVISO DE PRIVACIDAD: La información recopilada se utiliza únicamente para la respuesta a emergencias por inundaciones. Los datos NO se comparten con autoridades de inmigración. Este programa sirve a todos los residentes independientemente de su estatus migratorio.',
        req: '* Campo obligatorio',
        sPrefLang: 'Sección 1 — Idioma preferido',
        sPersonal: 'Sección 2 — Información personal',
        sHousehold: 'Sección 3 — Hogar y vivienda',
        sKin: 'Sección 4 — Contacto de emergencia',
        sHealth: 'Sección 5 — Salud y necesidades de acceso',
        sContact: 'Sección 6 — Preferencias de contacto',
        sConsent: 'Sección 7 — Consentimiento',
        name: 'Nombre completo *', dob: 'Fecha de nacimiento *', phone: 'Teléfono *',
        altPhone: 'Teléfono alternativo', email: 'Correo electrónico (opcional)',
        address: 'Dirección *', borough: 'Borough / código postal *', floor: 'Piso / apto',
        basement: '¿Apartamento en sótano?', household: '# de personas en el hogar *',
        yes: 'Sí', no: 'No',
        kinName: 'Familiar de emergencia — nombre *', kinPhone: 'Familiar — teléfono *',
        kinRel: 'Parentesco', kinAddr: 'Dirección del familiar (si es diferente)',
        disability: '¿Discapacidad que afecte la evacuación?', disabilityDesc: 'Por favor describa',
        medical: 'Condiciones médicas relevantes (opcional)',
        language: 'Idioma preferido *', other: 'Otro',
        contactPref: 'Método de contacto preferido *',
        call: 'Llamada de voz', sms: 'SMS / texto', both: 'Ambos',
        bestTime: 'Mejor hora para comunicarse',
        morning: 'Mañana (8–12)', afternoon: 'Tarde (12–17)', evening: 'Noche (17–20)', anytime: 'Cualquier hora',
        consent: 'Doy mi consentimiento para ser contactado/a por FloodVoice AI durante alertas de inundación. Entiendo que al presionar 2 durante una llamada alertará a los servicios de emergencia sobre mi ubicación.',
        signature: 'Firma (escriba nombre completo) *', signaturePlaceholder: 'Nombre completo', date: 'Fecha *',
        forLiaison: 'Solo para uso del enlace comunitario',
        liaisonName: 'Nombre del enlace', liaisonOrg: 'Organización', regDate: 'Fecha de registro',
        neighborhood: 'Vecindario / sitio piloto', formId: 'ID del formulario',
        submitBtn: 'Enviar registro',
        successTitle: 'Registro enviado',
        successBody: 'Este residente ha sido inscrito en las alertas de emergencia de FloodVoice AI.',
        newRegistrationBtn: 'Iniciar nuevo registro',
        closeBtn: 'Hecho',
        validationMsg: 'Por favor complete todos los campos obligatorios (*).',
    },
    bn: {
        title: 'FloodVoice AI — বাসিন্দা নিবন্ধন', sub: 'বন্যা জরুরি প্রাথমিক সতর্কতা ব্যবস্থা',
        privacy: 'গোপনীয়তার নোটিশ: তথ্য শুধুমাত্র বন্যা জরুরি সাড়ার জন্য ব্যবহার করা হয়। অভিবাসন কর্তৃপক্ষের সাথে শেয়ার করা হয় না। অভিবাসন মর্যাদা নির্বিশেষে সকলকে সেবা দেওয়া হয়।',
        req: '* প্রয়োজনীয় তথ্য',
        sPrefLang: 'বিভাগ ১ — পছন্দের ভাষা',
        sPersonal: 'বিভাগ ২ — ব্যক্তিগত তথ্য',
        sHousehold: 'বিভাগ ৩ — পরিবার ও আবাসন',
        sKin: 'বিভাগ ৪ — জরুরি যোগাযোগ',
        sHealth: 'বিভাগ ৫ — স্বাস্থ্য ও প্রবেশাধিকার',
        sContact: 'বিভাগ ৬ — যোগাযোগের পছন্দ',
        sConsent: 'বিভাগ ৭ — সম্মতি',
        name: 'পুরো নাম *', dob: 'জন্ম তারিখ *', phone: 'ফোন নম্বর *',
        altPhone: 'বিকল্প ফোন', email: 'ইমেইল (ঐচ্ছিক)',
        address: 'বাড়ির ঠিকানা *', borough: 'বরো / জিপ কোড *', floor: 'তলা / অ্যাপার্টমেন্ট',
        basement: 'বেসমেন্ট অ্যাপার্টমেন্ট?', household: 'পরিবারের সদস্য সংখ্যা *',
        yes: 'হ্যাঁ', no: 'না',
        kinName: 'নিকটতম স্বজন — নাম *', kinPhone: 'নিকটতম স্বজন — ফোন *',
        kinRel: 'সম্পর্ক', kinAddr: 'স্বজনের ঠিকানা (যদি আলাদা হয়)',
        disability: 'সরিয়ে নেওয়াকে প্রভাবিত করে এমন প্রতিবন্ধিতা?', disabilityDesc: 'বর্ণনা করুন',
        medical: 'জরুরি সাড়ার জন্য চিকিৎসা অবস্থা (ঐচ্ছিক)',
        language: 'পছন্দের ভাষা *', other: 'অন্যান্য',
        contactPref: 'পছন্দের যোগাযোগ পদ্ধতি *',
        call: 'ভয়েস কল', sms: 'এসএমএস', both: 'উভয়',
        bestTime: 'যোগাযোগের সেরা সময়',
        morning: 'সকাল (৮–১২)', afternoon: 'বিকেল (১২–৫)', evening: 'সন্ধ্যা (৫–৮)', anytime: 'যেকোনো সময়',
        consent: 'আমি বন্যার সতর্কতার সময় FloodVoice AI দ্বারা যোগাযোগের অনুমতি দিচ্ছি। কলের সময় ২ চাপলে জরুরি সেবাকারীদের কাছে আমার অবস্থান জানানো হবে।',
        signature: 'স্বাক্ষর (পুরো নাম লিখুন) *', signaturePlaceholder: 'পুরো নাম', date: 'তারিখ *',
        forLiaison: 'শুধুমাত্র কমিউনিটি লিয়াজোঁর ব্যবহারের জন্য',
        liaisonName: 'লিয়াজোঁর নাম', liaisonOrg: 'সংস্থা', regDate: 'নিবন্ধনের তারিখ',
        neighborhood: 'এলাকা / পাইলট সাইট', formId: 'ফর্ম আইডি',
        submitBtn: 'নিবন্ধন জমা দিন',
        successTitle: 'নিবন্ধন সম্পন্ন',
        successBody: 'এই বাসিন্দাকে FloodVoice AI বন্যা জরুরি সতর্কতায় নথিভুক্ত করা হয়েছে।',
        newRegistrationBtn: 'নতুন নিবন্ধন শুরু করুন',
        closeBtn: 'সম্পন্ন',
        validationMsg: 'অনুগ্রহ করে সমস্ত প্রয়োজনীয় ক্ষেত্র পূরণ করুন।',
    },
    zh: {
        title: 'FloodVoice AI — 居民登记', sub: '洪水紧急预警系统',
        privacy: '隐私声明：收集的信息仅用于洪水紧急响应，不与移民局共享。本项目为所有居民服务，无论移民身份如何。',
        req: '* 必填项',
        sPrefLang: '第一部分 — 首选语言',
        sPersonal: '第二部分 — 个人信息',
        sHousehold: '第三部分 — 家庭与住房',
        sKin: '第四部分 — 紧急联系人',
        sHealth: '第五部分 — 健康与无障碍需求',
        sContact: '第六部分 — 联系偏好',
        sConsent: '第七部分 — 同意书',
        name: '姓名 *', dob: '出生日期 *', phone: '电话号码 *',
        altPhone: '备用电话', email: '电子邮件（可选）',
        address: '家庭地址 *', borough: '行政区 / 邮编 *', floor: '楼层 / 公寓号',
        basement: '地下室公寓？', household: '家庭成员人数 *',
        yes: '是', no: '否',
        kinName: '紧急联系人 — 姓名 *', kinPhone: '紧急联系人 — 电话 *',
        kinRel: '关系', kinAddr: '紧急联系人地址（如不同）',
        disability: '是否有影响疏散的残疾？', disabilityDesc: '请描述',
        medical: '与紧急响应相关的病情（可选）',
        language: '首选语言 *', other: '其他',
        contactPref: '首选联系方式 *',
        call: '语音电话', sms: '短信', both: '两者均可',
        bestTime: '最佳联系时间',
        morning: '上午（8–12时）', afternoon: '下午（12–17时）', evening: '傍晚（17–20时）', anytime: '任何时间',
        consent: '本人同意在洪水预警期间接受 FloodVoice AI 的联系进行安全确认。通话中按 2 将向急救人员发送位置信息。数据仅用于洪水紧急响应。',
        signature: '签名（请输入全名）*', signaturePlaceholder: '全名', date: '日期 *',
        forLiaison: '仅供社区联络员使用',
        liaisonName: '联络员姓名', liaisonOrg: '所属机构', regDate: '注册日期',
        neighborhood: '社区 / 试点地点', formId: '表格编号',
        submitBtn: '提交登记',
        successTitle: '登记已提交',
        successBody: '该居民已成功注册 FloodVoice AI 洪水紧急警报。',
        newRegistrationBtn: '开始新登记',
        closeBtn: '完成',
        validationMsg: '请填写所有必填项 (*)。',
    },
};

// Native-script labels for the language-switcher tabs.
export const TAB_LABEL: Record<Lang, string> = {
    en: 'English',
    es: 'Español',
    bn: 'বাংলা',
    zh: '中文',
};

// Order of the canvasser-facing language tabs at the top of the form.
export const LANG_CODES: readonly Lang[] = ['en', 'es', 'bn', 'zh'];

// Order of the resident-facing "Preferred language" radio buttons in Section 1.
// Indices into this array are stored in the form state so submission can map
// back to a 2-letter code that matches the schema, instead of slicing labels.
export const PREF_LANG_CODES = ['en', 'es', 'bn', 'zh', 'ko', 'ht', 'other'] as const;
export type PrefLangCode = typeof PREF_LANG_CODES[number];

// Display labels for the language options in Section 1. Each language is shown
// in its OWN native script regardless of the form's current display language —
// so a resident speaking only Bengali can still recognize "বাংলা" even if the
// canvasser opened the form in English. Index 6 ("Other") is null because it's
// not a language and falls back to the per-form-language `t.other` translation.
export const LANG_NATIVE_LABELS: readonly (string | null)[] = [
    'English',         // en
    'Español',         // es
    'বাংলা',           // bn
    '中文',             // zh
    '한국어',           // ko
    'Kreyòl Ayisyen',  // ht
    null,              // "Other" — translated per form language
];

// Persistence: remember the canvasser's last-used form language on this device,
// so the form opens in their language instead of resetting to English between
// residents. Saved as a single short string in window.localStorage.
const STORAGE_KEY = 'floodvoice.intakeLang';

export function loadStoredLang(): Lang {
    if (typeof window === 'undefined') return 'en';
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && (LANG_CODES as readonly string[]).includes(stored)) {
        return stored as Lang;
    }
    return 'en';
}

export function saveLang(lang: Lang): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, lang);
}
