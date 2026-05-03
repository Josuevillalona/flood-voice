'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2 } from 'lucide-react';
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

// ─── Shared style constants ────────────────────────────────────────────────────
const inputCls = [
    'w-full text-[15px] px-3 py-2.5 rounded-md bg-white text-[#3D4F58] outline-none',
    'border border-[rgba(61,79,88,.18)]',
    'focus:border-[#1A6B7C] focus:ring-2 focus:ring-[rgba(26,107,124,.12)]',
].join(' ');

const labelCls = 'block text-[13px] font-medium text-[#1A6B7C] mb-1';
const checkboxCls = 'w-5 h-5 accent-[#1A6B7C] cursor-pointer';
const checkItemCls = 'flex items-center gap-2 text-[14px] text-[#3D4F58] cursor-pointer';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className={labelCls}>{label}</label>
            {children}
        </div>
    );
}

function SectionHeader({ text }: { text: string }) {
    return (
        <div className="px-3 py-2 rounded-t-lg tracking-wide text-[14px] font-medium"
            style={{ background: '#1A6B7C', color: '#fff', fontFamily: 'var(--font-jakarta)' }}>
            {text}
        </div>
    );
}

function SectionBody({ children }: { children: React.ReactNode }) {
    return (
        <div className="border border-t-0 rounded-b-lg p-3 bg-white space-y-3"
            style={{ borderColor: 'rgba(61,79,88,.15)' }}>
            {children}
        </div>
    );
}

function YesNo({ name, value, onChange, yesLabel, noLabel }: {
    name: string; value: string; onChange: (v: string) => void; yesLabel: string; noLabel: string;
}) {
    return (
        <div className="flex gap-5">
            {[['yes', yesLabel], ['no', noLabel]].map(([v, lbl]) => (
                <label key={v} className={checkItemCls}>
                    <input type="radio" name={name} value={v} checked={value === v}
                        onChange={() => onChange(v)} className={checkboxCls} />
                    {lbl}
                </label>
            ))}
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function IntakePage() {
    const [lang, setLangState] = useState<Lang>('en');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [form, setForm] = useState<IntakeFormData>(emptyForm);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- canonical client-only persistence rehydration pattern
        setLangState(loadStoredLang());
    }, []);

    const setLang = (next: Lang) => { setLangState(next); saveLang(next); };
    const t = T[lang];
    const upd = (field: keyof IntakeFormData, val: IntakeFormData[keyof IntakeFormData]) =>
        setForm(p => ({ ...p, [field]: val }));

    const selectPrefLang = (idx: number) => {
        setForm(prev => ({ ...prev, preferredLang: idx }));
        const code = PREF_LANG_CODES[idx];
        if ((LANG_CODES as readonly string[]).includes(code)) setLang(code as Lang);
    };

    const startNewRegistration = () => { setForm(emptyForm()); setIsSuccess(false); };

    const handleSubmit = async () => {
        if (!form.name || !form.phone || !form.address || !form.signature) {
            alert(t.validationMsg);
            return;
        }
        setIsSubmitting(true);
        const { data: { user } } = await supabase.auth.getUser();
        const langCode = form.preferredLang !== null ? PREF_LANG_CODES[form.preferredLang] : lang;

        const { error } = await supabase.from('residents').insert({
            name: form.name,
            phone_number: form.phone,
            address: form.address,
            zip_code: form.borough,
            health_conditions: form.medical || null,
            language: langCode,
            status: 'pending',
            liaison_id: user?.id || '00000000-0000-0000-0000-000000000000',
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
        if (!error) setIsSuccess(true);
        else alert('Error saving registration: ' + error.message);
    };

    return (
        <div style={{ fontFamily: 'var(--font-noto), sans-serif' }}>
            {/* Page header */}
            <div className="db-ph">
                <div>
                    <h1 className="db-ph-title">Intake Form</h1>
                    <p className="db-ph-sub">Register residents for emergency check-in monitoring.</p>
                </div>
                {/* Form ID chip */}
                <span style={{
                    fontFamily: 'var(--font-plex-mono)', fontSize: '11px', letterSpacing: '.06em',
                    color: 'rgba(61,79,88,.45)', background: 'rgba(61,79,88,.06)',
                    padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(61,79,88,.1)',
                }}>
                    {form.formId}
                </span>
            </div>

            {/* Form document */}
            <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '3rem' }}>

                {/* Document header */}
                <div style={{ background: '#1A6B7C', padding: '14px 16px', borderRadius: '10px 10px 0 0' }}>
                    <h2 style={{ fontFamily: 'var(--font-jakarta)', fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>
                        {t.title}
                    </h2>
                    <p style={{ fontFamily: 'var(--font-noto)', fontSize: '12px', color: 'rgba(255,255,255,.65)', marginTop: '2px' }}>
                        {t.sub}
                    </p>
                </div>
                {/* Amber accent stripe */}
                <div style={{ height: '3px', background: '#E8A030' }} />

                {/* Privacy notice */}
                <div style={{
                    margin: '12px 0',
                    padding: '10px 12px',
                    background: 'rgba(232,160,48,.08)',
                    borderLeft: '3px solid #E8A030',
                    borderRadius: '0 6px 6px 0',
                    fontFamily: 'var(--font-noto)',
                    fontSize: '12px',
                    color: '#3D4F58',
                    lineHeight: 1.6,
                }}>
                    {t.privacy}
                </div>

                <div className="space-y-3.5">

                    {/* Section 1 — Preferred Language */}
                    <div>
                        <SectionHeader text={t.sPrefLang} />
                        <SectionBody>
                            <div className="flex flex-wrap gap-x-5 gap-y-2.5">
                                {LANG_NATIVE_LABELS.slice(0, LANG_CODES.length).map((nativeLbl, i) => (
                                    <label key={i} className={checkItemCls}>
                                        <input type="radio" name="preferred_lang" checked={form.preferredLang === i}
                                            onChange={() => selectPrefLang(i)} className={checkboxCls} />
                                        {nativeLbl ?? t.other}
                                    </label>
                                ))}
                            </div>
                        </SectionBody>
                    </div>

                    {/* Section 2 — Personal Information */}
                    <div>
                        <SectionHeader text={t.sPersonal} />
                        <SectionBody>
                            <Field label={t.name}>
                                <input className={inputCls} type="text" autoComplete="name" value={form.name} onChange={e => upd('name', e.target.value)} />
                            </Field>
                            <div className="grid grid-cols-2 gap-2.5">
                                <Field label={t.dob}>
                                    <input className={inputCls} type="date" value={form.dob} onChange={e => upd('dob', e.target.value)} />
                                </Field>
                                <Field label={t.phone}>
                                    <input className={inputCls} type="tel" autoComplete="tel" value={form.phone} onChange={e => upd('phone', e.target.value)} />
                                </Field>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                                <Field label={t.altPhone}>
                                    <input className={inputCls} type="tel" value={form.altPhone} onChange={e => upd('altPhone', e.target.value)} />
                                </Field>
                                <Field label={t.email}>
                                    <input className={inputCls} type="email" autoComplete="email" value={form.email} onChange={e => upd('email', e.target.value)} />
                                </Field>
                            </div>
                        </SectionBody>
                    </div>

                    {/* Section 3 — Household & Housing */}
                    <div>
                        <SectionHeader text={t.sHousehold} />
                        <SectionBody>
                            <Field label={t.address}>
                                <input className={inputCls} type="text" autoComplete="street-address" value={form.address} onChange={e => upd('address', e.target.value)} />
                            </Field>
                            <div className="grid grid-cols-2 gap-2.5">
                                <Field label={t.borough}>
                                    <input className={inputCls} type="text" value={form.borough} onChange={e => upd('borough', e.target.value)} />
                                </Field>
                                <Field label={t.floor}>
                                    <input className={inputCls} type="text" value={form.floor} onChange={e => upd('floor', e.target.value)} />
                                </Field>
                            </div>
                            <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(61,79,88,.08)' }}>
                                <span className={labelCls + ' mb-0'}>{t.basement}</span>
                                <YesNo name="basement" value={form.basement} onChange={v => upd('basement', v)} yesLabel={t.yes} noLabel={t.no} />
                            </div>
                            <Field label={t.household}>
                                <input className={inputCls} type="number" min="1" max="20" style={{ width: 100 }}
                                    value={form.household} onChange={e => upd('household', e.target.value)} />
                            </Field>
                        </SectionBody>
                    </div>

                    {/* Section 4 — Emergency Contact */}
                    <div>
                        <SectionHeader text={t.sKin} />
                        <SectionBody>
                            <div className="grid grid-cols-2 gap-2.5">
                                <Field label={t.kinName}>
                                    <input className={inputCls} type="text" value={form.kinName} onChange={e => upd('kinName', e.target.value)} />
                                </Field>
                                <Field label={t.kinPhone}>
                                    <input className={inputCls} type="tel" value={form.kinPhone} onChange={e => upd('kinPhone', e.target.value)} />
                                </Field>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                                <Field label={t.kinRel}>
                                    <input className={inputCls} type="text" value={form.kinRel} onChange={e => upd('kinRel', e.target.value)} />
                                </Field>
                                <Field label={t.kinAddr}>
                                    <input className={inputCls} type="text" value={form.kinAddr} onChange={e => upd('kinAddr', e.target.value)} />
                                </Field>
                            </div>
                        </SectionBody>
                    </div>

                    {/* Section 5 — Health & Access Needs */}
                    <div>
                        <SectionHeader text={t.sHealth} />
                        <SectionBody>
                            <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(61,79,88,.08)' }}>
                                <span className={labelCls + ' mb-0'}>{t.disability}</span>
                                <YesNo name="disability" value={form.disability} onChange={v => upd('disability', v)} yesLabel={t.yes} noLabel={t.no} />
                            </div>
                            {form.disability === 'yes' && (
                                <Field label={t.disabilityDesc}>
                                    <input className={inputCls} type="text" value={form.disabilityDesc} onChange={e => upd('disabilityDesc', e.target.value)} />
                                </Field>
                            )}
                            <Field label={t.medical}>
                                <textarea className={inputCls + ' resize-none h-16'} value={form.medical} onChange={e => upd('medical', e.target.value)} />
                            </Field>
                        </SectionBody>
                    </div>

                    {/* Section 6 — Contact Preferences */}
                    <div>
                        <SectionHeader text={t.sContact} />
                        <SectionBody>
                            <div>
                                <label className={labelCls}>{t.contactPref}</label>
                                <div className="flex flex-wrap gap-x-5 gap-y-2.5 mt-1">
                                    {[['call', t.call], ['sms', t.sms], ['both', t.both]].map(([v, lbl]) => (
                                        <label key={v} className={checkItemCls}>
                                            <input type="radio" name="contact_method" value={v}
                                                checked={form.contactMethod === v} onChange={() => upd('contactMethod', v)} className={checkboxCls} />
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
                                            <input type="radio" name="best_time" value={v}
                                                checked={form.bestTime === v} onChange={() => upd('bestTime', v)} className={checkboxCls} />
                                            {lbl}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </SectionBody>
                    </div>

                    {/* Section 7 — Consent */}
                    <div>
                        <SectionHeader text={t.sConsent} />
                        <SectionBody>
                            <p style={{ fontFamily: 'var(--font-noto)', fontSize: '13px', color: 'rgba(61,79,88,.7)', lineHeight: 1.6 }}>
                                {t.consent}
                            </p>
                            <div className="grid grid-cols-2 gap-2.5">
                                <Field label={t.signature}>
                                    <input className={inputCls} type="text" placeholder={t.signaturePlaceholder}
                                        value={form.signature} onChange={e => upd('signature', e.target.value)} />
                                </Field>
                                <Field label={t.date}>
                                    <input className={inputCls} type="date" value={form.consentDate} onChange={e => upd('consentDate', e.target.value)} />
                                </Field>
                            </div>
                        </SectionBody>
                    </div>

                    {/* Liaison Section */}
                    <div style={{ background: 'rgba(61,79,88,.03)', borderRadius: '10px', border: '1px solid rgba(61,79,88,.1)', overflow: 'hidden' }}>
                        <div style={{ background: '#2A8FA4', color: '#fff', fontFamily: 'var(--font-jakarta)', fontSize: '13px', fontWeight: 600, padding: '8px 12px' }}>
                            {t.forLiaison}
                        </div>
                        <div className="p-3 space-y-3">
                            <div className="grid grid-cols-3 gap-2.5">
                                <Field label={t.liaisonName}>
                                    <input className={inputCls} type="text" value={form.liaisonName} onChange={e => upd('liaisonName', e.target.value)} />
                                </Field>
                                <Field label={t.liaisonOrg}>
                                    <input className={inputCls} type="text" value={form.liaisonOrg} onChange={e => upd('liaisonOrg', e.target.value)} />
                                </Field>
                                <Field label={t.regDate}>
                                    <input className={inputCls} type="date" value={form.regDate} onChange={e => upd('regDate', e.target.value)} />
                                </Field>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                                <Field label={t.neighborhood}>
                                    <input className={inputCls} type="text" value={form.neighborhood} onChange={e => upd('neighborhood', e.target.value)} />
                                </Field>
                                <Field label={t.formId}>
                                    <input className={inputCls} type="text" value={form.formId} onChange={e => upd('formId', e.target.value)} />
                                </Field>
                            </div>
                        </div>
                    </div>

                    {/* Required note */}
                    <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '11px', color: '#C4622D', letterSpacing: '.04em' }}>
                        {t.req}
                    </p>

                    {/* Submit / Success */}
                    {!isSuccess ? (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="db-ph-btn"
                            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px', borderRadius: '10px', opacity: isSubmitting ? 0.6 : 1 }}
                        >
                            {isSubmitting ? '...' : t.submitBtn}
                        </button>
                    ) : (
                        <div style={{
                            padding: '1.5rem',
                            background: 'rgba(26,107,124,.08)',
                            border: '1px solid rgba(26,107,124,.2)',
                            borderRadius: '12px',
                            textAlign: 'center',
                        }}>
                            <CheckCircle2 size={32} style={{ color: '#1A6B7C', margin: '0 auto 8px' }} />
                            <h3 style={{ fontFamily: 'var(--font-jakarta)', fontSize: '16px', fontWeight: 700, color: '#1A6B7C', marginBottom: '4px' }}>
                                {t.successTitle}
                            </h3>
                            <p style={{ fontFamily: 'var(--font-noto)', fontSize: '14px', color: '#2A8FA4', marginBottom: '1rem' }}>
                                {t.successBody}
                            </p>
                            <button
                                onClick={startNewRegistration}
                                className="db-ph-btn"
                                style={{ margin: '0 auto', padding: '10px 24px' }}
                            >
                                {t.newRegistrationBtn}
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
