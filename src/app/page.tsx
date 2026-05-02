'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import './landing.css';

export default function LandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    role: '',
    company: '',
    email: '',
    collaborate: '',
  });

  const handleLogin = () => {
    setIsLoading(true);
    setTimeout(() => router.push('/dashboard'), 800);
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
            <button
              className="fv-btn-primary"
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? 'Loading…' : 'Launch Dashboard →'}
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
            <button className="fv-submit">Get in Touch →</button>
          </div>
        </div>
      </div>

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
