'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle } from 'lucide-react';
import {
    type Lang,
    T,
    LANG_CODES,
    PREF_LANG_CODES,
    LANG_NATIVE_LABELS,
    loadStoredLang,
    saveLang,
} from '@/lib/intake-translations';

const emptyForm = (): IntakeFormData => ({
    name: '', dob: '', phone: '', altPhone: '', email: '',
    address: '', borough: '', floor: '', basement: '', household: '',
    kinName: '', kinPhone: '', kinRel: '', kinAddr: '',
    disability: '', disabilityDesc: '', medical: '',
    preferredLang: null, contactMethod: '', bestTime: '',
    signature: '', consentDate: '',
    liaisonName: '', liaisonOrg: '',
    regDate: new Date().toISOString().split('T')[0],
    neighborhood: '', formId: generateFormId(),
});

interface IntakeFormData {
    name: string; dob: string; phone: string; altPhone: string; email: string;
    address: string; borough: string; floor: string; basement: string; household: string;
    kinName: string; kinPhone: string; kinRel: string; kinAddr: string;
    disability: string; disabilityDesc: string; medical: string;
    preferredLang: number | null; contactMethod: string; bestTime: string;
    signature: string; consentDate: string;
    liaisonName: string; liaisonOrg: string; regDate: string; neighborhood: string; formId: string;
}

function generateFormId(): string {
    const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const r = Math.floor(1000 + Math.random() * 9000);
    return `FV-${d}-${r}`;
}

// ─── Reusable styled sub-components ───────────────────────────────────────────
// Sizes tuned for tablet at arm's length: section headers and labels at 13px,
// inputs at 15px, tap targets at 20px. Inputs use py-2.5 so the touch zone is
// comfortably > 40px tall.
const inputCls = 'w-full text-[15px] px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-900 outline-none focus:border-[#378ADD] focus:ring-2 focus:ring-[#E6F1FB]';
const labelCls = 'block text-[13px] font-medium text-[#0C447C] mb-1';
const checkboxCls = 'w-5 h-5 accent-[#0C447C] cursor-pointer';
const checkItemCls = 'flex items-center gap-2 text-[14px] text-gray-800 cursor-pointer';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className={labelCls}>{label}</label>
            {children}
        </div>
    );
}

function SectionHeader({ text }: { text: string }) {
    return <div className="bg-[#0C447C] text-[#E6F1FB] text-[14px] font-medium px-3 py-2 rounded-t-lg tracking-wide">{text}</div>;
}

function SectionBody({ children }: { children: React.ReactNode }) {
    return <div className="border border-t-0 border-gray-300 rounded-b-lg p-3 bg-white space-y-3">{children}</div>;
}

function YesNo({ name, value, onChange, yesLabel, noLabel }: { name: string; value: string; onChange: (v: string) => void; yesLabel: string; noLabel: string }) {
    return (
        <div className="flex gap-5">
            {[['yes', yesLabel], ['no', noLabel]].map(([v, lbl]) => (
                <label key={v} className={checkItemCls}>
                    <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)}
                        className={checkboxCls} />
                    {lbl}
                </label>
            ))}
        </div>
    );
}

// ─── Main Page Component ──────────────────────────────────────────────────────
export default function IntakePage() {
    const [lang, setLangState] = useState<Lang>('en');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [form, setForm] = useState<IntakeFormData>(emptyForm);

    // Rehydrate the canvasser's last-used language on first mount so the form
    // opens in their language instead of always resetting to English. Reads
    // from window.localStorage, which is only available client-side — hence the
    // useEffect rather than a useState initializer (initial render is SSR'd).
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- canonical client-only persistence rehydration pattern
        setLangState(loadStoredLang());
    }, []);

    const setLang = (next: Lang) => {
        setLangState(next);
        saveLang(next);
    };

    const t = T[lang];
    const upd = (field: keyof IntakeFormData, val: IntakeFormData[keyof IntakeFormData]) =>
        setForm(p => ({ ...p, [field]: val }));

    // Picking a preferred-language radio in Section 1 also switches the form's
    // display language when the picked language is one of the supported tab langs.
    // Single-select — the resident has one primary preferred language.
    const selectPrefLang = (idx: number) => {
        setForm(prev => ({ ...prev, preferredLang: idx }));
        const code = PREF_LANG_CODES[idx];
        if ((LANG_CODES as readonly string[]).includes(code)) {
            setLang(code as Lang);
        }
    };

    const startNewRegistration = () => {
        setForm(emptyForm());
        setIsSuccess(false);
    };

    const handleSubmit = async () => {
        const missing = !form.name || !form.phone || !form.address || !form.signature;
        if (missing) {
            alert(t.validationMsg);
            return;
        }
        setIsSubmitting(true);
        const { data: { user } } = await supabase.auth.getUser();

        // Map the picked index into PREF_LANG_CODES so the language column gets a
        // real 2-letter code (en/es/bn/zh/ko/ht/other) instead of a slice of a label.
        const langCode = form.preferredLang !== null
            ? PREF_LANG_CODES[form.preferredLang]
            : lang;

        const { error } = await supabase.from('residents').insert({
            name: form.name,
            phone_number: form.phone,
            address: form.address,
            zip_code: form.borough,
            health_conditions: form.medical || null,
            language: langCode,
            status: 'pending',
            liaison_id: user?.id || '00000000-0000-0000-0000-000000000000',
            // New intake columns (require migration_intake_form.sql to be run first)
            date_of_birth: form.dob || null,
            alternate_phone: form.altPhone || null,
            email: form.email || null,
            floor_apt: form.floor || null,
            basement_apartment: form.basement === 'yes' ? true : form.basement === 'no' ? false : null,
            household_size: form.household ? parseInt(form.household) : null,
            next_of_kin_name: form.kinName || null,
            next_of_kin_phone: form.kinPhone || null,
            next_of_kin_relationship: form.kinRel || null,
            next_of_kin_address: form.kinAddr || null,
            has_disability: form.disability === 'yes' ? true : form.disability === 'no' ? false : null,
            disability_description: form.disabilityDesc || null,
            preferred_languages: langCode,
            contact_method: form.contactMethod || null,
            best_time_to_reach: form.bestTime || null,
            consent_signature: form.signature,
            consent_date: form.consentDate || null,
            liaison_name: form.liaisonName || null,
            liaison_org: form.liaisonOrg || null,
            registration_date: form.regDate || null,
            neighborhood: form.neighborhood || null,
            form_id: form.formId,
        });
        setIsSubmitting(false);
        if (!error) { setIsSuccess(true); }
        else { alert('Error saving registration: ' + error.message); }
    };

    return (
        <div className="max-w-xl mx-auto pb-10" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

            {/* ── Header ── */}
            <div className="bg-[#0C447C] px-4 py-3 rounded-t-xl">
                <h1 className="text-[#E6F1FB] text-[16px] font-medium">{t.title}</h1>
                <p className="text-[#85B7EB] text-[12px]">{t.sub}</p>
            </div>
            <div className="h-1 bg-[#EF9F27]" />

            {/* ── Privacy Notice ── */}
            <div className="mx-0 mt-3 px-3 py-2.5 bg-[#FFF8EC] border-l-4 border-[#EF9F27] rounded-r-md text-[12px] text-[#5C3000] leading-relaxed">
                {t.privacy}
            </div>

            <div className="space-y-3.5 mt-3.5">

                {/* ── Section 1: Preferred Language ── */}
                {/* Single-select. Picking a language also switches the form's */}
                {/* display language when it's a supported tab language.       */}
                <div>
                    <SectionHeader text={t.sPrefLang} />
                    <SectionBody>
                        {/* Slice to LANG_CODES.length so the picker shows only the */}
                        {/* languages we actually support in this phase. Phase 2     */}
                        {/* expands LANG_CODES to en/es/bn/zh/ko/ht and the picker   */}
                        {/* grows automatically. */}
                        <div className="flex flex-wrap gap-x-5 gap-y-2.5">
                            {LANG_NATIVE_LABELS.slice(0, LANG_CODES.length).map((nativeLbl, i) => (
                                <label key={i} className={checkItemCls}>
                                    <input type="radio" name="preferred_lang" checked={form.preferredLang === i} onChange={() => selectPrefLang(i)} className={checkboxCls} />
                                    {nativeLbl ?? t.other}
                                </label>
                            ))}
                        </div>
                    </SectionBody>
                </div>

                {/* ── Section 2: Personal Information ── */}
                <div>
                    <SectionHeader text={t.sPersonal} />
                    <SectionBody>
                        <Field label={t.name}><input className={inputCls} type="text" autoComplete="name" value={form.name} onChange={e => upd('name', e.target.value)} /></Field>
                        <div className="grid grid-cols-2 gap-2.5">
                            <Field label={t.dob}><input className={inputCls} type="date" value={form.dob} onChange={e => upd('dob', e.target.value)} /></Field>
                            <Field label={t.phone}><input className={inputCls} type="tel" autoComplete="tel" value={form.phone} onChange={e => upd('phone', e.target.value)} /></Field>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                            <Field label={t.altPhone}><input className={inputCls} type="tel" value={form.altPhone} onChange={e => upd('altPhone', e.target.value)} /></Field>
                            <Field label={t.email}><input className={inputCls} type="email" autoComplete="email" value={form.email} onChange={e => upd('email', e.target.value)} /></Field>
                        </div>
                    </SectionBody>
                </div>

                {/* ── Section 3: Household & Housing ── */}
                <div>
                    <SectionHeader text={t.sHousehold} />
                    <SectionBody>
                        <Field label={t.address}><input className={inputCls} type="text" autoComplete="street-address" value={form.address} onChange={e => upd('address', e.target.value)} /></Field>
                        <div className="grid grid-cols-2 gap-2.5">
                            <Field label={t.borough}><input className={inputCls} type="text" value={form.borough} onChange={e => upd('borough', e.target.value)} /></Field>
                            <Field label={t.floor}><input className={inputCls} type="text" value={form.floor} onChange={e => upd('floor', e.target.value)} /></Field>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className={labelCls + ' mb-0'}>{t.basement}</span>
                            <YesNo name="basement" value={form.basement} onChange={v => upd('basement', v)} yesLabel={t.yes} noLabel={t.no} />
                        </div>
                        <Field label={t.household}><input className={inputCls} type="number" min="1" max="20" style={{ width: 100 }} value={form.household} onChange={e => upd('household', e.target.value)} /></Field>
                    </SectionBody>
                </div>

                {/* ── Section 4: Emergency Contact ── */}
                <div>
                    <SectionHeader text={t.sKin} />
                    <SectionBody>
                        <div className="grid grid-cols-2 gap-2.5">
                            <Field label={t.kinName}><input className={inputCls} type="text" value={form.kinName} onChange={e => upd('kinName', e.target.value)} /></Field>
                            <Field label={t.kinPhone}><input className={inputCls} type="tel" value={form.kinPhone} onChange={e => upd('kinPhone', e.target.value)} /></Field>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                            <Field label={t.kinRel}><input className={inputCls} type="text" value={form.kinRel} onChange={e => upd('kinRel', e.target.value)} /></Field>
                            <Field label={t.kinAddr}><input className={inputCls} type="text" value={form.kinAddr} onChange={e => upd('kinAddr', e.target.value)} /></Field>
                        </div>
                    </SectionBody>
                </div>

                {/* ── Section 5: Health & Access Needs ── */}
                <div>
                    <SectionHeader text={t.sHealth} />
                    <SectionBody>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className={labelCls + ' mb-0'}>{t.disability}</span>
                            <YesNo name="disability" value={form.disability} onChange={v => upd('disability', v)} yesLabel={t.yes} noLabel={t.no} />
                        </div>
                        {form.disability === 'yes' && (
                            <Field label={t.disabilityDesc}><input className={inputCls} type="text" value={form.disabilityDesc} onChange={e => upd('disabilityDesc', e.target.value)} /></Field>
                        )}
                        <Field label={t.medical}>
                            <textarea className={inputCls + ' resize-none h-16'} value={form.medical} onChange={e => upd('medical', e.target.value)} />
                        </Field>
                    </SectionBody>
                </div>

                {/* ── Section 6: Contact Preferences (no longer holds language) ── */}
                <div>
                    <SectionHeader text={t.sContact} />
                    <SectionBody>
                        <div>
                            <label className={labelCls}>{t.contactPref}</label>
                            <div className="flex flex-wrap gap-x-5 gap-y-2.5 mt-1">
                                {[['call', t.call], ['sms', t.sms], ['both', t.both]].map(([v, lbl]) => (
                                    <label key={v} className={checkItemCls}>
                                        <input type="radio" name="contact_method" value={v} checked={form.contactMethod === v} onChange={() => upd('contactMethod', v)} className={checkboxCls} />
                                        {lbl}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>{t.bestTime}</label>
                            <div className="flex flex-wrap gap-x-5 gap-y-2.5 mt-1">
                                {[['morning', t.morning], ['afternoon', t.afternoon], ['evening', t.evening], ['anytime', t.anytime]].map(([v, lbl]) => (
                                    <label key={v} className={checkItemCls}>
                                        <input type="radio" name="best_time" value={v} checked={form.bestTime === v} onChange={() => upd('bestTime', v)} className={checkboxCls} />
                                        {lbl}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </SectionBody>
                </div>

                {/* ── Section 7: Consent ── */}
                <div>
                    <SectionHeader text={t.sConsent} />
                    <SectionBody>
                        <p className="text-[13px] text-gray-700 leading-relaxed">{t.consent}</p>
                        <div className="grid grid-cols-2 gap-2.5">
                            <Field label={t.signature}><input className={inputCls} type="text" placeholder={t.signaturePlaceholder} value={form.signature} onChange={e => upd('signature', e.target.value)} /></Field>
                            <Field label={t.date}><input className={inputCls} type="date" value={form.consentDate} onChange={e => upd('consentDate', e.target.value)} /></Field>
                        </div>
                    </SectionBody>
                </div>

                {/* ── Liaison Section ── */}
                <div className="bg-gray-50 rounded-xl border border-gray-300 overflow-hidden">
                    <div className="bg-[#185FA5] text-[#E6F1FB] text-[13px] font-medium px-3 py-2">{t.forLiaison}</div>
                    <div className="p-3 space-y-3">
                        <div className="grid grid-cols-3 gap-2.5">
                            <Field label={t.liaisonName}><input className={inputCls} type="text" value={form.liaisonName} onChange={e => upd('liaisonName', e.target.value)} /></Field>
                            <Field label={t.liaisonOrg}><input className={inputCls} type="text" value={form.liaisonOrg} onChange={e => upd('liaisonOrg', e.target.value)} /></Field>
                            <Field label={t.regDate}><input className={inputCls} type="date" value={form.regDate} onChange={e => upd('regDate', e.target.value)} /></Field>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                            <Field label={t.neighborhood}><input className={inputCls} type="text" value={form.neighborhood} onChange={e => upd('neighborhood', e.target.value)} /></Field>
                            <Field label={t.formId}><input className={inputCls} type="text" value={form.formId} onChange={e => upd('formId', e.target.value)} /></Field>
                        </div>
                    </div>
                </div>

                {/* ── Required Note + Submit ── */}
                <p className="text-[12px] text-red-600">{t.req}</p>

                {!isSuccess ? (
                    <button onClick={handleSubmit} disabled={isSubmitting}
                        className="w-full py-3.5 bg-[#0C447C] hover:bg-[#185FA5] text-[#E6F1FB] text-[15px] font-medium rounded-xl transition-colors disabled:opacity-60">
                        {isSubmitting ? '...' : t.submitBtn}
                    </button>
                ) : (
                    <div className="p-5 bg-[#E6F1FB] border border-[#378ADD] rounded-xl text-center">
                        <CheckCircle className="w-8 h-8 text-[#0C447C] mx-auto mb-2" />
                        <h3 className="text-[#0C447C] text-[16px] font-medium mb-1">{t.successTitle}</h3>
                        <p className="text-[14px] text-[#185FA5] mb-4">{t.successBody}</p>
                        <button onClick={startNewRegistration}
                            className="px-5 py-2.5 bg-[#0C447C] hover:bg-[#185FA5] text-[#E6F1FB] text-[14px] font-medium rounded-lg transition-colors">
                            {t.newRegistrationBtn}
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
