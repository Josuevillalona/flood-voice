'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import {
    type Lang,
    T,
    LANG_CODES,
    PREF_LANG_CODES,
    LANG_NATIVE_LABELS,
    loadStoredLang,
    saveLang,
} from '@/lib/intake-translations';

const emptyForm = () => ({
    name: '', dob: '', phone: '', altPhone: '', email: '',
    address: '', borough: '', floor: '', basement: '', household: '',
    kinName: '', kinPhone: '', kinRel: '', kinAddr: '',
    disability: '', disabilityDesc: '', medical: '',
    prefLang: null as number | null,
    contactPref: '', bestTime: '',
    signature: '', signDate: '',
    liaisonName: '', liaisonOrg: '', regDate: new Date().toISOString().split('T')[0],
    neighborhood: '', formId: '',
});

type FormState = ReturnType<typeof emptyForm>;

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved?: () => void;
};

export function ResidentIntakeDialog({ open, onOpenChange, onSaved }: Props) {
    const [lang, setLangState] = useState<Lang>('en');
    const [form, setForm] = useState<FormState>(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const t = T[lang];

    // On every dialog open: clear the form, but keep the canvasser's last-used
    // language (rehydrated from device storage) instead of resetting to English.
    // The reset-on-prop-change pattern; React's textbook alternative is a `key`
    // on the parent, which would force a full remount and lose other state.
    useEffect(() => {
        if (open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate reset-on-open pattern
            setForm(emptyForm());
            setSuccess(false);
            setLangState(loadStoredLang());
        }
    }, [open]);

    const setLang = (next: Lang) => {
        setLangState(next);
        saveLang(next);
    };

    const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
        setForm(prev => ({ ...prev, [k]: v }));

    // Picking a preferred-language radio in Section 1 also switches the form's
    // display language when the picked language is one of the supported tab langs.
    // Single-select — the resident has one primary preferred language.
    const selectPrefLang = (idx: number) => {
        setForm(prev => ({ ...prev, prefLang: idx }));
        const code = PREF_LANG_CODES[idx];
        if ((LANG_CODES as readonly string[]).includes(code)) {
            setLang(code as Lang);
        }
    };

    const startNewRegistration = () => {
        setForm(emptyForm());
        setSuccess(false);
    };

    const ageFromDob = (dob: string): number | null => {
        if (!dob) return null;
        const d = new Date(dob);
        if (isNaN(d.getTime())) return null;
        const diff = Date.now() - d.getTime();
        const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
        return age >= 0 && age < 130 ? age : null;
    };

    const handleSubmit = async () => {
        if (!form.name.trim() || !form.phone.trim() || !form.address.trim() || !form.signature.trim()) {
            alert(t.validationMsg);
            return;
        }
        setSubmitting(true);

        const { data: { user } } = await supabase.auth.getUser();

        // Compose the fields that don't have dedicated columns into health_conditions
        // so nothing is silently dropped.
        const extras: string[] = [];
        if (form.medical.trim()) extras.push(`Medical: ${form.medical.trim()}`);
        if (form.disability === 'yes') {
            extras.push(`Disability affecting evacuation${form.disabilityDesc ? `: ${form.disabilityDesc}` : ''}`);
        }
        if (form.kinName || form.kinPhone) {
            extras.push(`Emergency contact: ${form.kinName}${form.kinPhone ? ` (${form.kinPhone})` : ''}${form.kinRel ? ` — ${form.kinRel}` : ''}`);
        }
        if (form.basement === 'yes') extras.push('Basement apartment');
        if (form.household) extras.push(`Household size: ${form.household}`);
        if (form.contactPref) extras.push(`Contact: ${form.contactPref}`);
        if (form.bestTime) extras.push(`Best time: ${form.bestTime}`);
        if (form.altPhone) extras.push(`Alt phone: ${form.altPhone}`);
        if (form.email) extras.push(`Email: ${form.email}`);
        if (form.floor) extras.push(`Floor/apt: ${form.floor}`);

        const firstPrefLang = form.prefLang !== null ? PREF_LANG_CODES[form.prefLang] : lang;

        // Pull any 5-digit ZIP out of the borough/zip field for our zip_code column
        const zipMatch = form.borough.match(/\b\d{5}\b/);
        const zip = zipMatch ? zipMatch[0] : form.borough.trim();

        const fullAddress = [form.address, form.floor].filter(Boolean).join(', ');

        const payload = {
            name: form.name.trim(),
            phone_number: form.phone.trim(),
            age: ageFromDob(form.dob),
            address: fullAddress || form.address,
            zip_code: zip,
            health_conditions: extras.join(' | ') || null,
            language: firstPrefLang,
            liaison_id: user?.id || '00000000-0000-0000-0000-000000000000',
            status: 'pending' as const,
        };

        const { error } = await supabase.from('residents').insert(payload);
        setSubmitting(false);

        if (error) {
            alert('Error saving resident: ' + error.message);
            return;
        }

        setSuccess(true);
        onSaved?.();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-xl p-0 overflow-hidden bg-[#f4f6f9] text-[#1a1a1a] border-0 max-h-[92vh]"
            >
                <DialogTitle className="sr-only">{t.title}</DialogTitle>
                <DialogDescription className="sr-only">{t.sub}</DialogDescription>
                <div className="max-h-[92vh] overflow-y-auto">
                    {/* Header */}
                    <div className="bg-[#0C447C] px-4 py-3">
                        <h1 className="text-[#E6F1FB] text-[16px] font-medium leading-tight">{t.title}</h1>
                        <p className="text-[#85B7EB] text-[12px] mt-0.5">{t.sub}</p>
                    </div>
                    <div className="h-1 bg-[#EF9F27]" />

                    {/* Privacy notice */}
                    <div className="mx-3 mt-3 p-2.5 bg-[#FFF8EC] border-l-[3px] border-[#EF9F27] rounded-r text-[12px] text-[#5C3000] leading-relaxed">
                        {t.privacy}
                    </div>

                    {/* Form body */}
                    {success ? (
                        <div className="px-3 pb-5">
                            <div className="mt-4 p-4 bg-[#E6F1FB] border border-[#378ADD] rounded-xl text-center">
                                <h3 className="text-[#0C447C] text-[16px] font-medium mb-1.5">{t.successTitle}</h3>
                                <p className="text-[14px] text-[#185FA5] mb-4">{t.successBody}</p>
                                <div className="flex flex-wrap justify-center gap-2.5">
                                    <button
                                        type="button"
                                        onClick={startNewRegistration}
                                        className="px-5 py-2.5 bg-[#0C447C] hover:bg-[#185FA5] text-[#E6F1FB] text-[14px] font-medium rounded-lg"
                                    >
                                        {t.newRegistrationBtn}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onOpenChange(false)}
                                        className="px-5 py-2.5 bg-white hover:bg-gray-50 text-[#0C447C] text-[14px] font-medium border border-[#0C447C] rounded-lg"
                                    >
                                        {t.closeBtn}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="px-3 pb-3">
                            {/* Section 1 — Preferred Language */}
                            {/* Picking a checkbox here also switches the form's display */}
                            {/* language (when supported), so the canvasser asks once.    */}
                            <Section title={t.sPrefLang}>
                                {/* Slice to LANG_CODES.length so the picker shows only */}
                                {/* the languages we actually support in this phase.    */}
                                <div className="flex flex-wrap gap-x-5 gap-y-2.5">
                                    {LANG_NATIVE_LABELS.slice(0, LANG_CODES.length).map((nativeLbl, i) => (
                                        <label key={i} className={checkItem}>
                                            <input
                                                type="radio"
                                                name="preferred_lang"
                                                className={checkbox}
                                                checked={form.prefLang === i}
                                                onChange={() => selectPrefLang(i)}
                                            />
                                            <span>{nativeLbl ?? t.other}</span>
                                        </label>
                                    ))}
                                </div>
                            </Section>

                            {/* Section 2 — Personal */}
                            <Section title={t.sPersonal}>
                                <Field label={t.name}>
                                    <input type="text" autoComplete="name" className={fieldInput}
                                        value={form.name} onChange={e => update('name', e.target.value)} />
                                </Field>
                                <Row2>
                                    <Field label={t.dob}>
                                        <input type="date" className={fieldInput}
                                            value={form.dob} onChange={e => update('dob', e.target.value)} />
                                    </Field>
                                    <Field label={t.phone}>
                                        <input type="tel" autoComplete="tel" className={fieldInput}
                                            value={form.phone} onChange={e => update('phone', e.target.value)} />
                                    </Field>
                                </Row2>
                                <Row2>
                                    <Field label={t.altPhone}>
                                        <input type="tel" className={fieldInput}
                                            value={form.altPhone} onChange={e => update('altPhone', e.target.value)} />
                                    </Field>
                                    <Field label={t.email}>
                                        <input type="email" autoComplete="email" className={fieldInput}
                                            value={form.email} onChange={e => update('email', e.target.value)} />
                                    </Field>
                                </Row2>
                            </Section>

                            {/* Section 3 — Household & housing */}
                            <Section title={t.sHousehold}>
                                <Field label={t.address}>
                                    <input type="text" autoComplete="street-address" className={fieldInput}
                                        value={form.address} onChange={e => update('address', e.target.value)} />
                                </Field>
                                <Row2>
                                    <Field label={t.borough}>
                                        <input type="text" className={fieldInput}
                                            value={form.borough} onChange={e => update('borough', e.target.value)} />
                                    </Field>
                                    <Field label={t.floor}>
                                        <input type="text" className={fieldInput}
                                            value={form.floor} onChange={e => update('floor', e.target.value)} />
                                    </Field>
                                </Row2>
                                <YesNoRow
                                    label={t.basement} yesLabel={t.yes} noLabel={t.no}
                                    name="basement" value={form.basement}
                                    onChange={v => update('basement', v)}
                                />
                                <Field label={t.household}>
                                    <input type="number" min={1} max={20} className={`${fieldInput} max-w-[120px]`}
                                        value={form.household} onChange={e => update('household', e.target.value)} />
                                </Field>
                            </Section>

                            {/* Section 4 — Emergency contact */}
                            <Section title={t.sKin}>
                                <Row2>
                                    <Field label={t.kinName}>
                                        <input type="text" className={fieldInput}
                                            value={form.kinName} onChange={e => update('kinName', e.target.value)} />
                                    </Field>
                                    <Field label={t.kinPhone}>
                                        <input type="tel" className={fieldInput}
                                            value={form.kinPhone} onChange={e => update('kinPhone', e.target.value)} />
                                    </Field>
                                </Row2>
                                <Row2>
                                    <Field label={t.kinRel}>
                                        <input type="text" className={fieldInput}
                                            value={form.kinRel} onChange={e => update('kinRel', e.target.value)} />
                                    </Field>
                                    <Field label={t.kinAddr}>
                                        <input type="text" className={fieldInput}
                                            value={form.kinAddr} onChange={e => update('kinAddr', e.target.value)} />
                                    </Field>
                                </Row2>
                            </Section>

                            {/* Section 5 — Health & access */}
                            <Section title={t.sHealth}>
                                <YesNoRow
                                    label={t.disability} yesLabel={t.yes} noLabel={t.no}
                                    name="disability" value={form.disability}
                                    onChange={v => update('disability', v)}
                                />
                                {form.disability === 'yes' && (
                                    <Field label={t.disabilityDesc}>
                                        <input type="text" className={fieldInput}
                                            value={form.disabilityDesc} onChange={e => update('disabilityDesc', e.target.value)} />
                                    </Field>
                                )}
                                <Field label={t.medical}>
                                    <textarea className={`${fieldInput} h-[64px] resize-none`}
                                        value={form.medical} onChange={e => update('medical', e.target.value)} />
                                </Field>
                            </Section>

                            {/* Section 6 — Contact preferences (no longer holds language) */}
                            <Section title={t.sContact}>
                                <Field label={t.contactPref}>
                                    <div className="flex flex-wrap gap-x-5 gap-y-2.5 mt-1">
                                        {[['call', t.call], ['sms', t.sms], ['both', t.both]].map(([v, label]) => (
                                            <label key={v} className={checkItem}>
                                                <input
                                                    type="radio" name="contact_pref" value={v}
                                                    className={checkbox}
                                                    checked={form.contactPref === v}
                                                    onChange={e => update('contactPref', e.target.value)}
                                                />
                                                <span>{label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </Field>
                                <Field label={t.bestTime}>
                                    <div className="flex flex-wrap gap-x-5 gap-y-2.5 mt-1">
                                        {[['morning', t.morning], ['afternoon', t.afternoon], ['evening', t.evening], ['anytime', t.anytime]].map(([v, label]) => (
                                            <label key={v} className={checkItem}>
                                                <input
                                                    type="radio" name="best_time" value={v}
                                                    className={checkbox}
                                                    checked={form.bestTime === v}
                                                    onChange={e => update('bestTime', e.target.value)}
                                                />
                                                <span>{label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </Field>
                            </Section>

                            {/* Section 7 — Consent */}
                            <Section title={t.sConsent}>
                                <p className="text-[13px] text-[#555] leading-relaxed mb-3">{t.consent}</p>
                                <Row2>
                                    <Field label={t.signature}>
                                        <input type="text" className={fieldInput} placeholder={t.signaturePlaceholder}
                                            value={form.signature} onChange={e => update('signature', e.target.value)} />
                                    </Field>
                                    <Field label={t.date}>
                                        <input type="date" className={fieldInput}
                                            value={form.signDate} onChange={e => update('signDate', e.target.value)} />
                                    </Field>
                                </Row2>
                            </Section>

                            {/* Liaison section */}
                            <div className="mt-3.5 bg-[#F4F6F9] rounded-xl border border-[#ccc] overflow-hidden">
                                <div className="bg-[#185FA5] text-[#E6F1FB] text-[13px] font-medium px-2.5 py-2">
                                    {t.forLiaison}
                                </div>
                                <div className="p-3 space-y-2.5">
                                    <div className="grid grid-cols-3 gap-2.5">
                                        <Field label={t.liaisonName}>
                                            <input type="text" className={fieldInput}
                                                value={form.liaisonName} onChange={e => update('liaisonName', e.target.value)} />
                                        </Field>
                                        <Field label={t.liaisonOrg}>
                                            <input type="text" className={fieldInput}
                                                value={form.liaisonOrg} onChange={e => update('liaisonOrg', e.target.value)} />
                                        </Field>
                                        <Field label={t.regDate}>
                                            <input type="date" className={fieldInput}
                                                value={form.regDate} onChange={e => update('regDate', e.target.value)} />
                                        </Field>
                                    </div>
                                    <Row2>
                                        <Field label={t.neighborhood}>
                                            <input type="text" className={fieldInput}
                                                value={form.neighborhood} onChange={e => update('neighborhood', e.target.value)} />
                                        </Field>
                                        <Field label={t.formId}>
                                            <input type="text" className={fieldInput} placeholder="FV-"
                                                value={form.formId} onChange={e => update('formId', e.target.value)} />
                                        </Field>
                                    </Row2>
                                </div>
                            </div>

                            <p className="text-[12px] text-[#CC0000] mt-2">{t.req}</p>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="block w-full mt-4 py-3.5 bg-[#0C447C] hover:bg-[#185FA5] text-[#E6F1FB] text-[15px] font-medium rounded-xl disabled:opacity-60"
                            >
                                {submitting ? '...' : t.submitBtn}
                            </button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Small subcomponents ───
//
// Sizes tuned for tablet at arm's length: labels 13px, inputs 15px with py-2.5
// padding (touch zone ~44px), tap targets 20px.

const fieldInput = 'w-full text-[15px] px-3 py-2.5 border border-[#ccc] rounded-md bg-white text-[#1a1a1a] outline-none focus:border-[#378ADD] focus:ring-2 focus:ring-[#E6F1FB]';
const checkItem = 'flex items-center gap-2 text-[14px] text-[#1a1a1a] cursor-pointer';
const checkbox = 'w-5 h-5 cursor-pointer accent-[#0C447C]';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="mt-3.5">
            <div className="bg-[#0C447C] text-[#E6F1FB] text-[14px] font-medium px-3 py-2 rounded-t-lg tracking-[0.02em]">
                {title}
            </div>
            <div className="border border-t-0 border-[#ccc] rounded-b-lg p-3 bg-white space-y-3">
                {children}
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-[13px] text-[#0C447C] font-medium mb-1">{label}</label>
            {children}
        </div>
    );
}

function Row2({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-2 gap-2.5">{children}</div>;
}

function YesNoRow({
    label, yesLabel, noLabel, name, value, onChange,
}: {
    label: string; yesLabel: string; noLabel: string; name: string;
    value: string; onChange: (v: string) => void;
}) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-[#eee]">
            <label className="text-[13px] text-[#0C447C] font-medium">{label}</label>
            <div className="flex gap-5">
                <label className={checkItem}>
                    <input type="radio" name={name} value="yes" className={checkbox}
                        checked={value === 'yes'} onChange={() => onChange('yes')} />
                    <span>{yesLabel}</span>
                </label>
                <label className={checkItem}>
                    <input type="radio" name={name} value="no" className={checkbox}
                        checked={value === 'no'} onChange={() => onChange('no')} />
                    <span>{noLabel}</span>
                </label>
            </div>
        </div>
    );
}
