'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import './landing.css';

function LandingPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ name: '', role: '', company: '', email: '', collaborate: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Password gate
  const [showGate, setShowGate] = useState(false);
  const [password, setPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const pwInputRef = useRef<HTMLInputElement>(null);

  // If redirected from middleware, pop the gate open automatically
  useEffect(() => {
    if (searchParams.get('locked') === '1') setShowGate(true);
  }, [searchParams]);

  useEffect(() => {
    if (showGate) setTimeout(() => pwInputRef.current?.focus(), 50);
  }, [showGate]);

  const handleLaunch = () => setShowGate(true);

  const handleUnlock = async () => {
    setPwError('');
    setPwLoading(true);
    try {
      const res = await fetch('/api/auth/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setPwError(data.error || 'Incorrect password.');
        setPwLoading(false);
        return;
      }
      router.push('/dashboard');
    } catch {
      setPwError('Something went wrong. Try again.');
      setPwLoading(false);
    }
  };

  const handleFormSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setSubmitError('Name and email are required.');
      return;
    }
    setSubmitError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setSubmitted(true);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fv-landing">
      <div className="fv-topo" />

      {/* Hero */}
      <div className="fv-hero">

        {/* Left column */}
        <div className="fv-left">
          <Image
            src="/logo-slate-teal.png"
            alt="FloodVoice"
            width={120}
            height={68}
            className="fv-logo"
            priority
          />
          <h1 className="fv-headline">
            Your neighborhood.<br />
            <em>Heard.</em> Protected.<br />
            Prioritized.
          </h1>
          <p className="fv-sub">
            FloodVoice converts qualitative voice calls from vulnerable residents
            into a structured, prioritized triage dataset — in real time, in 6 languages.
          </p>
          <div className="fv-cta-row">
            <button className="fv-btn-primary" onClick={handleLaunch}>
              Launch Dashboard →
            </button>
            <button className="fv-btn-ghost">Watch a demo →</button>
          </div>
        </div>

        {/* Form card */}
        <div className="fv-form-card">
          <div className="fv-form-top">
            <div className="fv-form-title">Collaborate with FloodVoice</div>
            <div className="fv-form-sub">Let's build this together</div>
          </div>
          <div className="fv-form-body">
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(26,107,124,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M4 11l5 5 9-9" stroke="#1A6B7C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p style={{ fontFamily: 'var(--font-jakarta, sans-serif)', fontSize: '15px', fontWeight: 700, color: '#1A6B7C', marginBottom: '6px' }}>
                  We&rsquo;ll be in touch
                </p>
                <p style={{ fontSize: '13px', color: 'rgba(61,79,88,.55)', lineHeight: 1.5 }}>
                  Thanks, {form.name.split(' ')[0]}. We&rsquo;ve received your message and will follow up at {form.email}.
                </p>
              </div>
            ) : (
              <>
                <div className="fv-field">
                  <label className="fv-label">Full Name</label>
                  <input
                    className="fv-input"
                    type="text"
                    placeholder="Maria Torres"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="fv-field-row">
                  <div className="fv-field">
                    <label className="fv-label">Role</label>
                    <input
                      className="fv-input"
                      type="text"
                      placeholder="Director, Researcher…"
                      value={form.role}
                      onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    />
                  </div>
                  <div className="fv-field">
                    <label className="fv-label">Company / Org</label>
                    <input
                      className="fv-input"
                      type="text"
                      placeholder="Organization"
                      value={form.company}
                      onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="fv-field">
                  <label className="fv-label">Email</label>
                  <input
                    className="fv-input"
                    type="email"
                    placeholder="you@organization.org"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div className="fv-field" style={{ marginBottom: '1.25rem' }}>
                  <label className="fv-label">How would you like to collaborate?</label>
                  <textarea
                    className="fv-input fv-textarea"
                    rows={3}
                    placeholder="Tell us about your organization and how you'd like to work with us…"
                    value={form.collaborate}
                    onChange={e => setForm(f => ({ ...f, collaborate: e.target.value }))}
                  />
                </div>
                {submitError && (
                  <p style={{ fontSize: '12px', color: '#C4622D', marginBottom: '8px' }}>{submitError}</p>
                )}
                <button
                  className="fv-submit"
                  onClick={handleFormSubmit}
                  disabled={submitting}
                  style={{ opacity: submitting ? 0.6 : 1 }}
                >
                  {submitting ? 'Sending…' : 'Get in Touch →'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Password gate modal */}
      {showGate && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(61,79,88,.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={() => { setShowGate(false); setPwError(''); setPassword(''); }}
        >
          <div
            style={{ background: '#fff', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '360px', margin: '0 1rem', boxShadow: '0 20px 60px rgba(61,79,88,.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ fontFamily: 'var(--font-jakarta, sans-serif)', fontSize: '16px', fontWeight: 800, color: '#3D4F58', marginBottom: '4px', letterSpacing: '-.02em' }}>
                Team access only
              </p>
              <p style={{ fontSize: '13px', color: 'rgba(61,79,88,.5)', lineHeight: 1.5 }}>
                Enter the event password to open the dashboard.
              </p>
            </div>
            <input
              ref={pwInputRef}
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUnlock()}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 14px', fontSize: '15px',
                border: `1px solid ${pwError ? '#C4622D' : 'rgba(61,79,88,.18)'}`,
                borderRadius: '8px', outline: 'none',
                fontFamily: 'var(--font-noto, sans-serif)',
                marginBottom: '8px',
              }}
            />
            {pwError && (
              <p style={{ fontSize: '12px', color: '#C4622D', marginBottom: '8px' }}>{pwError}</p>
            )}
            <button
              onClick={handleUnlock}
              disabled={pwLoading || !password}
              style={{
                width: '100%', padding: '11px', borderRadius: '8px',
                background: '#1A6B7C', color: '#fff', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-jakarta, sans-serif)', fontSize: '14px', fontWeight: 700,
                opacity: pwLoading || !password ? 0.6 : 1,
                transition: 'opacity .15s',
              }}
            >
              {pwLoading ? 'Checking…' : 'Enter Dashboard'}
            </button>
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="fv-stats">
        <div className="fv-stat">
          <div className="fv-stat-val">&lt; <span>2</span> min</div>
          <div className="fv-stat-lbl">Response Time</div>
        </div>
        <div className="fv-stat">
          <div className="fv-stat-val"><span>85</span>+</div>
          <div className="fv-stat-lbl">FloodNet Sensors</div>
        </div>
        <div className="fv-stat">
          <div className="fv-stat-val"><span>6</span></div>
          <div className="fv-stat-lbl">Languages Supported</div>
        </div>
        <div className="fv-stat">
          <div className="fv-stat-val"><span>7</span></div>
          <div className="fv-stat-lbl">Ida Priority Neighborhoods</div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense>
      <LandingPageInner />
    </Suspense>
  );
}
