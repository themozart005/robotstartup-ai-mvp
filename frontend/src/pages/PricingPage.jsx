// frontend/src/pages/PricingPage.jsx
// LevelUp Ventures Platform — Institutional License Pricing Page
// v3 — Matches app's blue-purple gradient + glass-morphism aesthetic

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { color: #fff; font-family: 'DM Sans', sans-serif; }

  .pricing-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #1e3a8a 0%, #4c1d95 50%, #312e81 100%);
    padding: 0 0 80px;
    position: relative;
    overflow-x: hidden;
  }

  .blob {
    position: fixed;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.2;
    pointer-events: none;
    animation: blobMove 8s ease-in-out infinite;
  }
  .blob-1 { width: 500px; height: 500px; background: #7c3aed; top: -100px; right: -100px; }
  .blob-2 { width: 400px; height: 400px; background: #1d4ed8; bottom: -80px; left: -80px; animation-delay: 3s; }
  .blob-3 { width: 300px; height: 300px; background: #ec4899; top: 40%; left: 50%; animation-delay: 5s; opacity: 0.1; }

  @keyframes blobMove {
    0%, 100% { transform: scale(1) translate(0,0); }
    33%       { transform: scale(1.08) translate(15px,-15px); }
    66%       { transform: scale(0.94) translate(-15px,10px); }
  }

  .pricing-header {
    text-align: center;
    padding: 72px 24px 48px;
    position: relative;
    z-index: 1;
  }

  .pricing-label {
    display: inline-block;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #67e8f9;
    border: 1px solid rgba(103,232,249,0.4);
    border-radius: 100px;
    padding: 6px 16px;
    margin-bottom: 24px;
    background: rgba(103,232,249,0.08);
    backdrop-filter: blur(10px);
  }

  .pricing-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(36px, 5vw, 58px);
    font-weight: 800;
    line-height: 1.1;
    color: #fff;
    margin-bottom: 16px;
  }
  .pricing-title span { color: #67e8f9; }

  .pricing-subtitle {
    font-size: 17px;
    color: rgba(255,255,255,0.7);
    max-width: 480px;
    margin: 0 auto 8px;
    line-height: 1.6;
  }

  .pricing-note { font-size: 13px; color: #a5f3fc; margin-top: 8px; }

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
    max-width: 1080px;
    margin: 0 auto;
    padding: 0 24px;
    align-items: start;
    position: relative;
    z-index: 1;
  }

  .tier-card {
    background: rgba(255,255,255,0.1);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 20px;
    padding: 36px 32px;
    position: relative;
    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease, background 0.25s ease;
  }

  .tier-card:hover {
    transform: translateY(-4px);
    background: rgba(255,255,255,0.15);
    border-color: rgba(103,232,249,0.4);
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  }

  .tier-card.highlighted {
    background: rgba(103,232,249,0.12);
    border-color: #67e8f9;
    box-shadow: 0 0 0 1px #67e8f9, 0 24px 80px rgba(103,232,249,0.15);
  }

  .tier-card.highlighted:hover {
    transform: translateY(-6px);
    box-shadow: 0 0 0 1px #67e8f9, 0 32px 100px rgba(103,232,249,0.22);
  }

  .popular-badge {
    position: absolute;
    top: -14px; left: 50%;
    transform: translateX(-50%);
    background: #67e8f9;
    color: #1e3a8a;
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    padding: 5px 18px;
    border-radius: 100px;
    white-space: nowrap;
  }

  .tier-name {
    font-family: 'Syne', sans-serif;
    font-size: 22px; font-weight: 800;
    color: #fff; margin-bottom: 6px;
  }

  .tier-desc { font-size: 14px; color: rgba(255,255,255,0.6); margin-bottom: 24px; line-height: 1.5; }

  .tier-price { display: flex; align-items: baseline; gap: 4px; margin-bottom: 4px; }

  .price-dollar {
    font-family: 'Syne', sans-serif;
    font-size: 42px; font-weight: 800;
    color: #fff; line-height: 1;
  }
  .highlighted .price-dollar { color: #67e8f9; }
  .price-period { font-size: 14px; color: rgba(255,255,255,0.6); }
  .tier-billing { font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 28px; }

  .capacity-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; }

  .cap-pill {
    font-size: 12px; font-weight: 500;
    color: #67e8f9;
    background: rgba(103,232,249,0.12);
    border: 1px solid rgba(103,232,249,0.25);
    border-radius: 6px; padding: 4px 10px;
  }

  .feature-list { list-style: none; margin-bottom: 32px; display: flex; flex-direction: column; gap: 10px; }

  .feature-list li {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: 14px; color: rgba(255,255,255,0.8); line-height: 1.4;
  }
  .feature-list li::before { content: '✓'; color: #34d399; font-weight: 700; font-size: 13px; flex-shrink: 0; margin-top: 1px; }

  .btn-trial {
    width: 100%; padding: 14px 24px; border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600;
    cursor: pointer; transition: all 0.2s ease; border: none; margin-bottom: 10px;
  }

  .btn-trial-outline {
    background: rgba(255,255,255,0.12);
    border: 1.5px solid rgba(255,255,255,0.3);
    color: #fff; backdrop-filter: blur(8px);
  }
  .btn-trial-outline:hover { background: rgba(255,255,255,0.2); border-color: #67e8f9; color: #67e8f9; }

  .btn-trial-primary { background: #67e8f9; color: #1e3a8a; font-weight: 700; }
  .btn-trial-primary:hover { background: #a5f3fc; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(103,232,249,0.4); }

  .btn-buy {
    width: 100%; padding: 12px 24px; border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
    cursor: pointer; transition: all 0.2s ease;
    background: transparent; border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.6);
  }
  .btn-buy:hover { border-color: rgba(255,255,255,0.4); color: #fff; background: rgba(255,255,255,0.08); }

  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.6); backdrop-filter: blur(12px);
    display: flex; align-items: center; justify-content: center;
    z-index: 100; padding: 24px; animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

  .modal {
    background: rgba(255,255,255,0.12);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.25);
    border-radius: 20px; padding: 40px; max-width: 440px; width: 100%;
    animation: slideUp 0.25s ease;
  }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }

  .modal-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: #fff; margin-bottom: 8px; }
  .modal-sub { font-size: 14px; color: rgba(255,255,255,0.65); margin-bottom: 28px; line-height: 1.5; }

  .modal label {
    display: block; font-size: 12px; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: rgba(255,255,255,0.6); margin-bottom: 8px;
  }

  .modal input {
    width: 100%; background: rgba(255,255,255,0.1);
    border: 1.5px solid rgba(255,255,255,0.2); border-radius: 10px;
    padding: 12px 16px; font-family: 'DM Sans', sans-serif; font-size: 15px;
    color: #fff; outline: none; margin-bottom: 24px; transition: border-color 0.2s;
  }
  .modal input::placeholder { color: rgba(255,255,255,0.4); }
  .modal input:focus { border-color: #67e8f9; }

  .modal-actions { display: flex; gap: 12px; }

  .btn-cancel {
    flex: 1; padding: 12px; background: transparent;
    border: 1.5px solid rgba(255,255,255,0.2); border-radius: 10px;
    color: rgba(255,255,255,0.7); font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;
  }
  .btn-cancel:hover { border-color: rgba(255,255,255,0.4); color: #fff; }

  .btn-confirm {
    flex: 2; padding: 12px; background: #67e8f9; border: none; border-radius: 10px;
    color: #1e3a8a; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700;
    cursor: pointer; transition: all 0.2s;
  }
  .btn-confirm:hover { background: #a5f3fc; }
  .btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

  .faq-strip {
    max-width: 780px; margin: 60px auto 0; padding: 0 24px;
    display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 24px; position: relative; z-index: 1;
  }

  .faq-item {
    background: rgba(255,255,255,0.08); backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.15); border-radius: 14px; padding: 20px;
  }
  .faq-item h4 { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 6px; }
  .faq-item p { font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.6; }

  .toast {
    position: fixed; bottom: 24px; right: 24px;
    background: rgba(255,255,255,0.12); backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.2); border-radius: 12px;
    padding: 14px 20px; font-size: 14px; color: #fff;
    z-index: 200; animation: slideUp 0.25s ease; max-width: 320px;
  }
  .toast.error   { border-color: #f87171; }
  .toast.success { border-color: #34d399; }
`;

const TIERS = [
  {
    id: 'classroom', name: 'Classroom', desc: 'Perfect for a single CTE teacher',
    price: 499, teachers: '1 teacher', students: '35 students', modules: ['RoboStartup AI'],
    features: ['1 teacher account','Up to 35 students','RoboStartup AI module','14-day free trial — no card required','Email support'],
    highlighted: false,
  },
  {
    id: 'school', name: 'School', desc: 'For CTE departments & whole schools',
    price: 1999, teachers: '10 teachers', students: '300 students', modules: ['All modules'],
    features: ['Up to 10 teacher accounts','Up to 300 students','All current modules','Student data reports & analytics','14-day free trial — no card required','Priority support'],
    highlighted: true,
  },
  {
    id: 'district', name: 'District', desc: 'District-wide deployment & reporting',
    price: 6999, teachers: 'Unlimited teachers', students: 'Unlimited students', modules: ['All modules + future'],
    features: ['Unlimited teachers & students','All current + future modules','Admin dashboard','Behavioral decision-sequence data reports','Professional development support','Custom school branding','Dedicated onboarding call','Phone + email support'],
    highlighted: false,
  },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const [modal, setModal]     = useState(null);
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast]     = useState(null);

  const API   = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('authToken');

  function showToast(msg, type = 'error') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  function openModal(tier, mode) {
    if (!token) { navigate('/login?redirect=/pricing'); return; }
    setOrgName('');
    setModal({ tier, mode });
  }

  async function handleConfirm() {
    if (!orgName.trim()) { showToast('Please enter your school or district name.'); return; }
    setLoading(true);
    try {
      const endpoint = modal.mode === 'trial' ? '/api/payments/start-trial' : '/api/payments/create-checkout';
      const res  = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ tier: modal.tier.id, orgName: orgName.trim() }),
      });
      const data = await res.json();
      if (!data.success) { showToast(data.message || 'Something went wrong.'); return; }
      if (modal.mode === 'trial') {
        setModal(null);
        showToast('14-day trial activated! Welcome to LevelUp.', 'success');
        setTimeout(() => navigate('/account'), 1500);
      } else {
        window.location.href = data.url;
      }
    } catch (err) {
      showToast('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('activated')) showToast('License activated! Welcome to LevelUp.', 'success');
    if (p.get('cancelled'))  showToast('Checkout cancelled — no charge was made.');
  }, []);

  return (
    <>
      <style>{styles}</style>
      <div className="pricing-page">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />

        <div className="pricing-header">
          <div className="pricing-label">School & District Licensing</div>
          <h1 className="pricing-title">One price.<br /><span>Every student.</span></h1>
          <p className="pricing-subtitle">Annual flat-rate licenses — no per-seat math, no surprise bills. Built for school purchase orders.</p>
          <p className="pricing-note">✦ 14-day free trial on every tier — no credit card required</p>
        </div>

        <div className="cards-grid">
          {TIERS.map((tier) => (
            <div key={tier.id} className={`tier-card ${tier.highlighted ? 'highlighted' : ''}`}>
              {tier.highlighted && <div className="popular-badge">Most Popular</div>}
              <div className="tier-name">{tier.name}</div>
              <div className="tier-desc">{tier.desc}</div>
              <div className="tier-price">
                <span className="price-dollar">${tier.price.toLocaleString()}</span>
                <span className="price-period">/year</span>
              </div>
              <div className="tier-billing">Annual billing • No monthly option</div>
              <div className="capacity-row">
                <span className="cap-pill">{tier.teachers}</span>
                <span className="cap-pill">{tier.students}</span>
                <span className="cap-pill">{tier.modules[0]}</span>
              </div>
              <ul className="feature-list">{tier.features.map((f) => <li key={f}>{f}</li>)}</ul>
              <button className={`btn-trial ${tier.highlighted ? 'btn-trial-primary' : 'btn-trial-outline'}`} onClick={() => openModal(tier, 'trial')}>
                Start 14-Day Free Trial
              </button>
              <button className="btn-buy" onClick={() => openModal(tier, 'buy')}>Purchase license →</button>
            </div>
          ))}
        </div>

        <div className="faq-strip">
          <div className="faq-item"><h4>How does billing work?</h4><p>Annual flat rate — billed once per year. Fits standard school PO and budget cycles.</p></div>
          <div className="faq-item"><h4>Can I upgrade mid-year?</h4><p>Yes. Upgrading from Classroom to School or District is prorated through your renewal date.</p></div>
          <div className="faq-item"><h4>What counts as a student seat?</h4><p>Nothing — all tiers are flat rate. No per-student math, ever.</p></div>
          <div className="faq-item"><h4>Is there a district quote process?</h4><p>Yes. Email us for a custom PO quote with multi-year pricing and district-specific onboarding.</p></div>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-title">{modal.mode === 'trial' ? `Start Free Trial — ${modal.tier.name}` : `Purchase ${modal.tier.name} License`}</div>
            <p className="modal-sub">{modal.mode === 'trial' ? `14 days free. No credit card required. Full ${modal.tier.name} access.` : `$${modal.tier.price.toLocaleString()}/year. You'll be taken to secure checkout.`}</p>
            <label>School or District Name</label>
            <input type="text" placeholder="e.g. Lincoln High School" value={orgName} onChange={(e) => setOrgName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleConfirm()} autoFocus />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-confirm" onClick={handleConfirm} disabled={loading}>
                {loading ? 'Loading...' : modal.mode === 'trial' ? 'Activate Trial' : 'Go to Checkout →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </>
  );
}
