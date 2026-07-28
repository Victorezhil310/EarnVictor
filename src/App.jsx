import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Globe, 
  Tv, 
  Layout, 
  Smartphone, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Clock, 
  Lock, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Layers, 
  ArrowRight, 
  HelpCircle, 
  BookOpen, 
  FileText, 
  Check, 
  ChevronRight, 
  Database,
  ArrowUpRight,
  User,
  CreditCard,
  Settings,
  RefreshCw,
  LogOut,
  Copy,
  Info
} from 'lucide-react';
import { supabase } from './supabaseClient';
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home'); // home, auth, dashboard, owner, owner-dashboard, legal-terms, legal-privacy, legal-dmca
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  // Publisher State
  const [properties, setProperties] = useState([]);
  const [newPropName, setNewPropName] = useState('');
  const [newPropUrl, setNewPropUrl] = useState('');
  const [newPropType, setNewPropType] = useState('website');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [zones, setZones] = useState([]);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneType, setNewZoneType] = useState('smartlink');
  
  // Wallet & Withdraw
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawCurrency, setWithdrawCurrency] = useState('USD');
  const [withdrawMethod, setWithdrawMethod] = useState('Bank Transfer');
  const [withdrawDetails, setWithdrawDetails] = useState('');
  const [usdToInrRate, setUsdToInrRate] = useState(83.50);
  const [ownerCommissionRate, setOwnerCommissionRate] = useState(0.20);
  const [withdrawMsg, setWithdrawMsg] = useState({ type: '', text: '' });

  // Owner State
  const [ownerPin, setOwnerPin] = useState('');
  const [ownerAuthenticated, setOwnerAuthenticated] = useState(false);
  const [ownerError, setOwnerError] = useState('');
  const [allProperties, setAllProperties] = useState([]);
  const [allWithdrawals, setAllWithdrawals] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [adEventsCount, setAdEventsCount] = useState(0);
  const [totalPlatformRev, setTotalPlatformRev] = useState(0);
  const [totalOwnerCommission, setTotalOwnerCommission] = useState(0);
  const [ownerMsg, setOwnerMsg] = useState({ type: '', text: '' });
  
  // Verification Guide State
  const [guideStep, setGuideStep] = useState(0);
  const [copiedToken, setCopiedToken] = useState(false);

  // Initialize Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        if (currentPage !== 'home' && !currentPage.startsWith('legal')) {
          setCurrentPage('home');
        }
      }
    });

    // Fetch exchange rate settings
    fetchSettings();

    return () => subscription.unsubscribe();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.table('settings').select('*');
      if (data) {
        const rates = {};
        data.forEach(item => {
          rates[item.key] = item.value;
        });
        if (rates.default_usd_to_inr) setUsdToInrRate(parseFloat(rates.default_usd_to_inr));
        if (rates.owner_commission_rate) setOwnerCommissionRate(parseFloat(rates.owner_commission_rate));
      }
    } catch (e) {
      console.log("Error loading settings:", e);
    }
  };

  const fetchProfile = async (uid) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.table('profiles').select('*').eq('id', uid).single();
      if (data) {
        setProfile(data);
        if (data.role === 'owner') {
          setOwnerAuthenticated(true);
        }
      } else if (error) {
        // Fallback profile if row trigger didn't fire yet
        const fallbackProfile = {
          id: uid,
          email: user?.email || '',
          role: 'publisher',
          balance_usd: 0.0,
          balance_inr: 0.0
        };
        setProfile(fallbackProfile);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch publisher properties, zones, and withdrawals
  useEffect(() => {
    if (user && profile) {
      fetchPublisherData();
    }
  }, [user, profile]);

  const fetchPublisherData = async () => {
    try {
      // Properties
      const { data: props } = await supabase.table('properties').select('*').eq('publisher_id', user.id).order('created_at', { ascending: false });
      setProperties(props || []);

      // Withdrawals
      const { data: wds } = await supabase.table('withdrawals').select('*').eq('publisher_id', user.id).order('created_at', { ascending: false });
      setWithdrawals(wds || []);

      if (props && props.length > 0) {
        if (!selectedProperty) setSelectedProperty(props[0]);
        fetchZones(props[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchZones = async (propertyId) => {
    if (!propertyId) return;
    const { data } = await supabase.table('zones').select('*').eq('property_id', propertyId).order('created_at', { ascending: false });
    setZones(data || []);
  };

  // Handle Auth
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        alert("Signup successful! You can now log in.");
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        setUser(data.user);
        await fetchProfile(data.user.id);
        setCurrentPage('dashboard');
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      setAuthError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setCurrentPage('home');
  };

  // Publisher Actions
  const handleAddProperty = async (e) => {
    e.preventDefault();
    if (!newPropName || !newPropUrl) return;

    try {
      const verificationToken = 'ev_verify_' + Math.random().toString(36).substring(2, 15);
      const { data, error } = await supabase.table('properties').insert({
        publisher_id: user.id,
        name: newPropName,
        url: newPropUrl,
        type: newPropType,
        verification_token: verificationToken,
        status: 'pending'
      }).select();

      if (error) throw error;
      setNewPropName('');
      setNewPropUrl('');
      fetchPublisherData();
      if (data && data[0]) {
        setSelectedProperty(data[0]);
        fetchZones(data[0].id);
      }
      alert('Site/App added successfully. Follow instructions to verify it.');
    } catch (err) {
      alert(err.message || 'Failed to add property');
    }
  };

  const handleVerifyProperty = async (propertyId, url) => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/verify-property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: propertyId, url: url })
      });
      const data = await response.json();
      if (data.status === 'success') {
        alert("Domain verified successfully!");
      } else {
        alert("Verification failed: " + (data.reason || data.message));
      }
      fetchPublisherData();
    } catch (err) {
      alert("Failed to reach verification backend: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateZone = async (e) => {
    e.preventDefault();
    if (!selectedProperty || !newZoneName) return;

    try {
      const defaultCpm = newZoneType === 'video' ? 3.50 : newZoneType === 'popunder' ? 2.50 : newZoneType === 'banner' ? 1.00 : 1.80;
      const { error } = await supabase.table('zones').insert({
        property_id: selectedProperty.id,
        name: newZoneName,
        type: newZoneType,
        cpm_rate: defaultCpm
      });

      if (error) throw error;
      setNewZoneName('');
      fetchZones(selectedProperty.id);
      alert('Ad zone generated successfully!');
    } catch (err) {
      alert(err.message || 'Failed to generate zone');
    }
  };

  const handleRequestWithdrawal = async (e) => {
    e.preventDefault();
    setWithdrawMsg({ type: '', text: '' });
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0 || !withdrawDetails) {
      setWithdrawMsg({ type: 'error', text: 'Please fill in all details with a valid amount.' });
      return;
    }

    if (amount > parseFloat(profile.balance_usd)) {
      setWithdrawMsg({ type: 'error', text: 'Insufficient balance.' });
      return;
    }

    try {
      const amountLocal = withdrawCurrency === 'INR' ? amount * usdToInrRate : amount;
      
      const { error } = await supabase.table('withdrawals').insert({
        publisher_id: user.id,
        amount_usd: amount,
        amount_local: amountLocal,
        currency: withdrawCurrency,
        payment_method: withdrawMethod,
        account_details: withdrawDetails,
        status: 'pending'
      });

      if (error) throw error;

      // Deduct from profile balance
      const newUsd = parseFloat(profile.balance_usd) - amount;
      const newInr = parseFloat(profile.balance_inr) - (amount * usdToInrRate);
      
      const { error: profileError } = await supabase.table('profiles').update({
        balance_usd: newUsd,
        balance_inr: newInr
      }).eq('id', user.id);

      if (profileError) throw profileError;

      setWithdrawAmount('');
      setWithdrawDetails('');
      setWithdrawMsg({ type: 'success', text: 'Withdrawal requested successfully! Processing takes up to 48 hours.' });
      fetchPublisherData();
      fetchProfile(user.id);
    } catch (err) {
      setWithdrawMsg({ type: 'error', text: err.message || 'Withdrawal request failed.' });
    }
  };

  // Owner Login
  const handleOwnerLogin = async (e) => {
    e.preventDefault();
    setOwnerError('');
    try {
      const response = await fetch('http://localhost:8000/api/owner-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: ownerPin })
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        setOwnerAuthenticated(true);
        setCurrentPage('owner-dashboard');
        fetchOwnerData();
      } else {
        setOwnerError(data.detail || 'Incorrect PIN code');
      }
    } catch (err) {
      setOwnerError('Cannot connect to backend: ' + err.message);
    }
  };

  // Fetch all platform details for Owner
  const fetchOwnerData = async () => {
    try {
      // All properties
      const { data: props } = await supabase.table('properties').select('*, profiles(email)').order('created_at', { ascending: false });
      setAllProperties(props || []);

      // All withdrawals
      const { data: wds } = await supabase.table('withdrawals').select('*, profiles(email)').order('created_at', { ascending: false });
      setAllWithdrawals(wds || []);

      // All profiles
      const { data: profs } = await supabase.table('profiles').select('*').order('created_at', { ascending: false });
      setAllProfiles(profs || []);

      // Global Stats from Ad events
      const { data: events } = await supabase.table('ad_events').select('revenue_usd, owner_commission_usd');
      if (events) {
        setAdEventsCount(events.length);
        let totalRev = 0;
        let totalComm = 0;
        events.forEach(ev => {
          totalRev += parseFloat(ev.revenue_usd || 0);
          totalComm += parseFloat(ev.owner_commission_usd || 0);
        });
        setTotalPlatformRev(totalRev);
        setTotalOwnerCommission(totalComm);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveProperty = async (propId) => {
    try {
      const { error } = await supabase.table('properties').update({
        status: 'verified',
        verified_at: 'now()'
      }).eq('id', propId);
      if (error) throw error;
      setOwnerMsg({ type: 'success', text: 'Property approved successfully!' });
      fetchOwnerData();
    } catch (err) {
      setOwnerMsg({ type: 'error', text: err.message });
    }
  };

  const handleRejectProperty = async (propId, reason) => {
    if (!reason) {
      alert("Please provide a rejection reason.");
      return;
    }
    try {
      const { error } = await supabase.table('properties').update({
        status: 'rejected',
        rejection_reason: reason
      }).eq('id', propId);
      if (error) throw error;
      setOwnerMsg({ type: 'success', text: 'Property marked as rejected.' });
      fetchOwnerData();
    } catch (err) {
      setOwnerMsg({ type: 'error', text: err.message });
    }
  };

  const handleApproveWithdrawal = async (withdrawId) => {
    try {
      const { error } = await supabase.table('withdrawals').update({
        status: 'approved',
        processed_at: 'now()'
      }).eq('id', withdrawId);
      if (error) throw error;
      setOwnerMsg({ type: 'success', text: 'Withdrawal marked as approved!' });
      fetchOwnerData();
    } catch (err) {
      setOwnerMsg({ type: 'error', text: err.message });
    }
  };

  const handleRejectWithdrawal = async (wd) => {
    try {
      const { error } = await supabase.table('withdrawals').update({
        status: 'rejected',
        processed_at: 'now()'
      }).eq('id', wd.id);
      if (error) throw error;

      // Refund the user balance
      const userProfile = allProfiles.find(p => p.id === wd.publisher_id);
      if (userProfile) {
        const refundedUsd = parseFloat(userProfile.balance_usd) + parseFloat(wd.amount_usd);
        const refundedInr = parseFloat(userProfile.balance_inr) + (parseFloat(wd.amount_usd) * usdToInrRate);
        
        await supabase.table('profiles').update({
          balance_usd: refundedUsd,
          balance_inr: refundedInr
        }).eq('id', wd.publisher_id);
      }

      setOwnerMsg({ type: 'success', text: 'Withdrawal rejected and balance refunded.' });
      fetchOwnerData();
    } catch (err) {
      setOwnerMsg({ type: 'error', text: err.message });
    }
  };

  const handleUpdateRates = async (e) => {
    e.preventDefault();
    try {
      await supabase.table('settings').upsert({ key: 'default_usd_to_inr', value: usdToInrRate.toString() });
      await supabase.table('settings').upsert({ key: 'owner_commission_rate', value: ownerCommissionRate.toString() });
      setOwnerMsg({ type: 'success', text: 'Exchange and commission settings updated successfully!' });
      fetchSettings();
    } catch (err) {
      setOwnerMsg({ type: 'error', text: err.message });
    }
  };

  // Helper copy text
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-logo" onClick={() => setCurrentPage('home')} style={{ cursor: 'pointer' }}>
          <Shield size={28} color="#10b981" />
          Earn<span style={{ color: '#8b5cf6' }}>Victor</span>
        </div>
        <ul className="nav-links">
          <li className="nav-link" onClick={() => setCurrentPage('home')}>Home</li>
          <li className="nav-link" onClick={() => {
            if (user) setCurrentPage('dashboard');
            else setCurrentPage('auth');
          }}>Publisher Dashboard</li>
          <li className="nav-link" onClick={() => setCurrentPage('legal-terms')}>Terms</li>
          <li className="nav-link" onClick={() => setCurrentPage('legal-privacy')}>Privacy</li>
          <li className="nav-link" onClick={() => setCurrentPage('donate')} style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
            <DollarSign size={14} /> Donate
          </li>
          <li className="nav-link" onClick={() => setCurrentPage('owner')} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Lock size={14} /> Admin
          </li>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '13px', color: '#9ca3af' }}>{user.email}</span>
              <button className="btn btn-secondary" onClick={handleSignOut} style={{ padding: '8px 16px', fontSize: '13px' }}>
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={() => setCurrentPage('auth')} style={{ padding: '8px 18px', fontSize: '14px' }}>
              Get Started
            </button>
          )}
        </ul>
      </nav>

      {/* Main Content Pages */}
      <main style={{ flex: 1, padding: '40px 20px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        
        {/* PAGE 1: LANDING PAGE */}
        {currentPage === 'home' && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '80px' }}>
            {/* Hero Section */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', margin: '40px 0' }}>
              <span className="badge badge-verified" style={{ padding: '6px 12px', fontSize: '12px' }}>
                🚀 Monetize 100% of your Web & Mobile traffic
              </span>
              <h1 style={{ fontSize: '56px', lineHeight: 1.1, fontWeight: 800, maxWidth: '800px', background: 'linear-gradient(135deg, #ffffff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Unlock Your Real Ad Revenue Stream
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '18px', maxWidth: '600px', lineHeight: 1.6 }}>
                Integrate websites, android APKs, Telegram mini-games, and apps in 3 steps. Earn higher payouts in USD and INR with the industry's lowest owner commission.
              </p>
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                <button className="btn btn-primary" onClick={() => {
                  if (user) setCurrentPage('dashboard');
                  else setCurrentPage('auth');
                }}>
                  Start Earning Now <ArrowRight size={18} />
                </button>
                <button className="btn btn-secondary" onClick={() => {
                  if (user) {
                    setCurrentPage('dashboard');
                  } else {
                    setCurrentPage('auth');
                  }
                }}>
                  Connect Site/App
                </button>
              </div>
            </div>

            {/* Ad Format Selection */}
            <div>
              <h2 style={{ fontSize: '32px', marginBottom: '16px' }}>Supported Ad Placements</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>Premium, hand-picked formats designed not to disrupt user UX.</p>
              
              <div className="grid-4">
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Tv size={40} color="#8b5cf6" />
                  <h3>SmartLink</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Auto-optimizing URL redirect links directing traffic to high-paying offers.</p>
                </div>
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Globe size={40} color="#10b981" />
                  <h3>Popunder Ads</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Invisible underlying popup pages triggered by user clicks yielding maximum CPM.</p>
                </div>
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Layout size={40} color="#ec4899" />
                  <h3>Vignette Banner</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Responsive responsive banner layouts overlaying cleanly on margins.</p>
                </div>
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Smartphone size={40} color="#f59e0b" />
                  <h3>Auto-Videos</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Premium video placements that explain monetization and increase interaction rates.</p>
                </div>
              </div>
            </div>

            {/* Integration Steps */}
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'left' }}>
              <h2 style={{ fontSize: '32px', marginBottom: '10px', textAlign: 'center' }}>Deploy in 3 Simple Steps</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', textAlign: 'center' }}>Start running clean, safe ads on your assets in minutes.</p>
              
              <div className="grid-3">
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ background: 'var(--accent-purple)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>1</div>
                  <div>
                    <h4 style={{ fontSize: '18px', marginBottom: '8px' }}>Register Property</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Submit your site link or app details. We generate a secure verification HTML metadata tag.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ background: 'var(--accent-emerald)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>2</div>
                  <div>
                    <h4 style={{ fontSize: '18px', marginBottom: '8px' }}>Verify Ownership</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Place the token tag in the index homepage head. Verify to gain full approval in 48 hours.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ background: 'var(--accent-pink)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>3</div>
                  <div>
                    <h4 style={{ fontSize: '18px', marginBottom: '8px' }}>Run Live Ads</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Generate ad codes, paste code scripts on your site/app, and watch your earnings multiply.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Why choose us */}
            <div className="grid-2" style={{ textAlign: 'left', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '36px', marginBottom: '20px' }}>Clean & Verified Ad Delivery</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.6, marginBottom: '24px' }}>
                  Unlike typical platform systems, EarnVictor implements real ad event logging via Python endpoint crawlers, filtering out bot traffic to keep earnings accurate.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle size={20} color="#10b981" />
                    <span>100% Fill Rate in 195+ regions</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle size={20} color="#10b981" />
                    <span>Real-time dashboard payouts without fake statistics</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle size={20} color="#10b981" />
                    <span>Full withdrawal capability to USD, INR and regional banks</span>
                  </div>
                </div>
              </div>
              <div className="glass-card" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(236, 72, 153, 0.05))', borderColor: 'rgba(139, 92, 246, 0.2)' }}>
                <TrendingUp size={48} color="#8b5cf6" />
                <h3 style={{ fontSize: '24px' }}>Highest Revenue Share</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
                  Earn up to 80% to 90% direct publisher split, with only 10-20% commission routed to the owner. Withdrawals convert automatically using our system settings exchange rate.
                </p>
                <div style={{ display: 'flex', gap: '30px', marginTop: '10px' }}>
                  <div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981' }}>0.01s</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>Ad Latency</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#8b5cf6' }}>80%+</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>RevShare</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#ec4899' }}>48h</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>Payout Verification</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 2: AUTHENTICATION */}
        {currentPage === 'auth' && (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '40px 0' }}>
            <div className="glass-panel" style={{ padding: '40px', maxWidth: '450px', width: '100%', textAlign: 'center' }}>
              <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>
                {isSignUp ? 'Create Publisher Account' : 'Publisher Login'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                {isSignUp ? 'Sign up to start running high commission ads.' : 'Sign in to access your properties and balance.'}
              </p>

              {authError && (
                <div className="badge badge-rejected" style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '6px', textTransform: 'none', justifyContent: 'center' }}>
                  {authError}
                </div>
              )}

              <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    placeholder="name@example.com" 
                    value={authEmail} 
                    onChange={e => setAuthEmail(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    placeholder="••••••••" 
                    value={authPassword} 
                    onChange={e => setAuthPassword(e.target.value)} 
                    required 
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
                  {loading ? 'Authenticating...' : isSignUp ? 'Sign Up' : 'Sign In'}
                </button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: 'var(--text-muted)' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }}></div>
                <span style={{ padding: '0 10px', fontSize: '11px', fontWeight: 600 }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }}></div>
              </div>

              <button 
                type="button" 
                onClick={handleGoogleLogin} 
                className="btn btn-secondary" 
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px' }}
                disabled={loading}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" style={{ display: 'block' }}>
                  <path fill="#EA4335" d="M12 5.04c1.76 0 3.32.61 4.56 1.79l3.4-3.4C17.9 1.54 15.17.92 12 .92 7.37.92 3.39 3.58 1.43 7.48l3.99 3.1A6.98 6.98 0 0 1 12 5.04z"/>
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.45h6.45c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-1.99 3.4-4.92 3.4-8.55z"/>
                  <path fill="#FBBC05" d="M5.42 14.58a6.93 6.93 0 0 1 0-5.16l-3.99-3.1a11.95 11.95 0 0 0 0 11.36l3.99-3.1z"/>
                  <path fill="#34A853" d="M12 23.08c3.24 0 5.97-1.07 7.96-2.91l-3.7-2.87c-1.03.69-2.35 1.1-4.26 1.1-3.28 0-6.07-2.22-7.06-5.2l-3.99 3.1c1.96 3.9 5.94 6.56 10.57 6.56z"/>
                </svg>
                Continue with Google
              </button>

              <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  {isSignUp ? 'Already have an account?' : "Don't have a publisher account?"}{' '}
                </span>
                <span 
                  onClick={() => setIsSignUp(!isSignUp)} 
                  style={{ color: 'var(--accent-purple)', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 3: PUBLISHER DASHBOARD */}
        {currentPage === 'dashboard' && profile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {/* Dashboard Welcome Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.08), transparent)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
              <div>
                <span style={{ fontSize: '14px', color: 'var(--accent-purple)', fontWeight: 600 }}>PUBLISHER PANEL</span>
                <h1 style={{ fontSize: '32px', margin: '4px 0' }}>Welcome, {profile.email}</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Add domains, configure video/smartlink placements, and track live payouts.</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '13px', color: '#9ca3af' }}>Current Balance</span>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <DollarSign size={24} /> {parseFloat(profile.balance_usd).toFixed(4)} USD
                </div>
                <div style={{ fontSize: '14px', color: '#9ca3af', fontWeight: 500 }}>
                  ≈ ₹{(parseFloat(profile.balance_usd) * usdToInrRate).toFixed(2)} INR
                </div>
              </div>
            </div>

            {/* Quick stats grid */}
            <div className="grid-4">
              <div className="glass-card" style={{ padding: '20px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>PROPERTIES</span>
                <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0' }}>{properties.length} Active</div>
                <span style={{ color: 'var(--accent-emerald)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={12} /> Live monetization
                </span>
              </div>
              <div className="glass-card" style={{ padding: '20px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>AD PLACEMENTS</span>
                <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0' }}>{zones.length} Zones</div>
                <span style={{ color: 'var(--accent-purple)', fontSize: '11px' }}>SmartLink & Popunders</span>
              </div>
              <div className="glass-card" style={{ padding: '20px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>CPM RATE</span>
                <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0' }}>$1.80 Avg</div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Based on last 1000 events</span>
              </div>
              <div className="glass-card" style={{ padding: '20px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>WITHDRAWAL TOTALS</span>
                <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0' }}>
                  ₹{(withdrawals.filter(w => w.status === 'approved').reduce((acc, w) => acc + parseFloat(w.amount_local), 0)).toFixed(2)}
                </div>
                <span style={{ color: 'var(--accent-amber)', fontSize: '11px' }}>Approved withdrawals</span>
              </div>
            </div>

            {/* Main Section: split into side nav tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '30px' }}>
              
              {/* Dashboard Tabs Sidebar */}
              <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', alignSelf: 'start' }}>
                <button 
                  className="btn" 
                  onClick={() => setSelectedProperty(properties[0] || null)}
                  style={{ 
                    justifyContent: 'flex-start', 
                    background: selectedProperty ? 'rgba(255,255,255,0.03)' : 'transparent',
                    color: selectedProperty ? '#fff' : 'var(--text-secondary)',
                    borderLeft: selectedProperty ? '3px solid var(--accent-purple)' : 'none',
                    borderRadius: '0 8px 8px 0',
                    width: '100%'
                  }}
                >
                  <Globe size={18} /> Properties & Zones
                </button>
                <button 
                  className="btn" 
                  onClick={() => setSelectedProperty(null)}
                  style={{ 
                    justifyContent: 'flex-start', 
                    background: !selectedProperty ? 'rgba(255,255,255,0.03)' : 'transparent',
                    color: !selectedProperty ? '#fff' : 'var(--text-secondary)',
                    borderLeft: !selectedProperty ? '3px solid var(--accent-purple)' : 'none',
                    borderRadius: '0 8px 8px 0',
                    width: '100%'
                  }}
                >
                  <CreditCard size={18} /> Wallet & Payouts
                </button>
                
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '15px 0', paddingTop: '15px' }} />
                
                {/* Integration Guide Snippet widget */}
                <div style={{ padding: '12px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
                  <h4 style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#a78bfa' }}>
                    <HelpCircle size={14} /> Quick Video Guide
                  </h4>
                  <p style={{ fontSize: '11px', color: '#9ca3af', lineHeight: 1.4, marginBottom: '10px' }}>
                    Learn how to connect your domains and verify metadata tags.
                  </p>
                  <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px', width: '100%' }} onClick={() => setGuideStep(0)}>
                    Open Tutorial
                  </button>
                </div>
              </div>

              {/* Tab Display Area */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                
                {/* Tutorial Modal overlay/accordion */}
                {guideStep !== null && (
                  <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, #1b102f 0%, #0c0817 100%)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h3 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen size={20} color="#8b5cf6" />
                        How to Connect & Verify Your Properties
                      </h3>
                      <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => setGuideStep(null)}>
                        Hide Guide
                      </button>
                    </div>

                    {/* Tutorial Slides */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'center' }}>
                      <div>
                        {guideStep === 0 && (
                          <div>
                            <h4 style={{ color: '#a78bfa', marginBottom: '10px' }}>Step 1: Add Property link</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                              Enter the URL of your site (e.g., `https://mywebsite.com`) or app package name under the Properties input form. Select the correct type (website, APK, bot, mini-game).
                            </p>
                          </div>
                        )}
                        {guideStep === 1 && (
                          <div>
                            <h4 style={{ color: '#a78bfa', marginBottom: '10px' }}>Step 2: Embed Metadata Verification Tag</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                              Copy the generated verification tag meta script. Open your website's main HTML layout (usually `index.html` or header file) and paste the meta tag inside the &lt;head&gt; section.
                            </p>
                          </div>
                        )}
                        {guideStep === 2 && (
                          <div>
                            <h4 style={{ color: '#a78bfa', marginBottom: '10px' }}>Step 3: Verification & Approvals</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                              Once the tag is live, click the <b>Verify</b> button. Our crawler immediately checks the page for the verification code. Approved domains display status "Verified" and are ready to run ads.
                            </p>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                          <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }} disabled={guideStep === 0} onClick={() => setGuideStep(prev => prev - 1)}>
                            Back
                          </button>
                          <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }} disabled={guideStep === 2} onClick={() => setGuideStep(prev => prev + 1)}>
                            Next Step
                          </button>
                        </div>
                      </div>

                      {/* Mock Interactive video-box */}
                      <div style={{ background: '#07050d', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', textAlign: 'center', minHeight: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Visual Explanation</span>
                        {guideStep === 0 && (
                          <div style={{ border: '2px dashed rgba(139,92,246,0.3)', borderRadius: '8px', padding: '15px', color: '#a78bfa' }}>
                            <Plus size={28} style={{ margin: '0 auto 8px' }} />
                            <span>Input Form Input URL</span>
                          </div>
                        )}
                        {guideStep === 1 && (
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', fontSize: '10px', textAlign: 'left', fontFamily: 'monospace' }}>
                            &lt;head&gt;<br />
                            &nbsp;&nbsp;&lt;meta name="earnvictor-verification" content="ev_verify_token..." /&gt;<br />
                            &lt;/head&gt;
                          </div>
                        )}
                        {guideStep === 2 && (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle size={32} color="#10b981" />
                            <span style={{ color: '#10b981', fontSize: '13px', fontWeight: 'bold' }}>Status: Verified</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 1: PROPERTIES & ZONES */}
                {selectedProperty ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    
                    {/* Add property & list panel */}
                    <div className="glass-panel" style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3>Manage Properties</h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <select 
                            className="form-control" 
                            style={{ padding: '6px 12px', fontSize: '13px' }}
                            value={selectedProperty.id} 
                            onChange={(e) => {
                              const found = properties.find(p => p.id === e.target.value);
                              setSelectedProperty(found);
                              fetchZones(found.id);
                            }}
                          >
                            {properties.map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Details of selected property */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Domain / App URL</span>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {selectedProperty.url}
                              <span className={`badge badge-${selectedProperty.status}`}>
                                {selectedProperty.status}
                              </span>
                            </div>
                          </div>
                          {selectedProperty.status !== 'verified' && (
                            <button 
                              className="btn btn-emerald" 
                              onClick={() => handleVerifyProperty(selectedProperty.id, selectedProperty.url)}
                              style={{ padding: '8px 16px', fontSize: '13px' }}
                            >
                              <RefreshCw size={14} /> Verify Ownership
                            </button>
                          )}
                        </div>

                        {selectedProperty.status !== 'verified' && (
                          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#a78bfa', display: 'block', marginBottom: '8px' }}>
                              Verification Instructions
                            </span>
                            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
                              To verify ownership and start running ads, paste the following tag inside the <code>&lt;head&gt;</code> section of your HTML index file:
                            </p>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#0a0814', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                              <code style={{ fontSize: '12px', color: '#34d399', wordBreak: 'break-all', flex: 1 }}>
                                {`<meta name="earnvictor-verification" content="${selectedProperty.verification_token}" />`}
                              </code>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 10px', fontSize: '12px', flexShrink: 0 }}
                                onClick={() => copyToClipboard(`<meta name="earnvictor-verification" content="${selectedProperty.verification_token}" />`)}
                              >
                                {copiedToken ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Zone list & zone creator */}
                    <div className="glass-panel" style={{ padding: '24px' }}>
                      <h3 style={{ marginBottom: '20px' }}>Ad Zones for {selectedProperty.name}</h3>

                      {selectedProperty.status !== 'verified' ? (
                        <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(0,0,0,0.1)', borderRadius: '12px' }}>
                          <Lock size={32} style={{ color: 'var(--accent-amber)', marginBottom: '12px' }} />
                          <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                            Please verify ownership of this site or application to create ad placement codes.
                          </p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                          
                          {/* Create Zone Form */}
                          <form onSubmit={handleCreateZone} style={{ display: 'grid', gridTemplateColumns: '1fr 200px auto', gap: '15px', alignItems: 'end' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label">Zone Name</label>
                              <input 
                                type="text" 
                                className="form-control" 
                                placeholder="e.g. Header Popunder, Side Banner" 
                                value={newZoneName} 
                                onChange={e => setNewZoneName(e.target.value)} 
                                required 
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label">Ad Type</label>
                              <select 
                                className="form-control" 
                                value={newZoneType} 
                                onChange={e => setNewZoneType(e.target.value)}
                              >
                                <option value="smartlink">SmartLink</option>
                                <option value="popunder">Popunder</option>
                                <option value="banner">Banner Placement</option>
                                <option value="video">Auto-Video ad</option>
                              </select>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px' }}>
                              <Plus size={16} /> Create Code
                            </button>
                          </form>

                          {/* Zones List */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {zones.length === 0 ? (
                              <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center' }}>No ad zones generated yet. Create one above.</p>
                            ) : (
                              zones.map(zone => (
                                <div key={zone.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
                                  <div>
                                    <h4 style={{ fontSize: '15px', color: '#fff' }}>{zone.name}</h4>
                                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>Type: {zone.type.toUpperCase()} | Base CPM: ${parseFloat(zone.cpm_rate).toFixed(2)}</span>
                                  </div>
                                  <div>
                                    <button 
                                      className="btn btn-secondary" 
                                      style={{ padding: '6px 12px', fontSize: '12px' }}
                                      onClick={() => {
                                        const code = `<script src="http://localhost:8000/api/ad-serve?zone_id=${zone.id}" data-zone="${zone.id}"></script>`;
                                        copyToClipboard(code);
                                        alert("Integration script copied! Paste it in your HTML.");
                                      }}
                                    >
                                      Copy Tag Script
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Form to add a new site */}
                    <div className="glass-panel" style={{ padding: '24px' }}>
                      <h3 style={{ marginBottom: '20px' }}>Add Another Website or App</h3>
                      <form onSubmit={handleAddProperty} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 180px auto', gap: '15px', alignItems: 'end' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Property Name</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="e.g. My Arcade Game" 
                            value={newPropName} 
                            onChange={e => setNewPropName(e.target.value)} 
                            required 
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Homepage URL</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="e.g. game.mywebsite.com" 
                            value={newPropUrl} 
                            onChange={e => setNewPropUrl(e.target.value)} 
                            required 
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Property Type</label>
                          <select 
                            className="form-control" 
                            value={newPropType} 
                            onChange={e => setNewPropType(e.target.value)}
                          >
                            <option value="website">Website</option>
                            <option value="app">Mobile App</option>
                            <option value="mini_game">Mini Game</option>
                            <option value="telegram_bot">Telegram Bot</option>
                            <option value="apk">Android APK</option>
                          </select>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ padding: '12px 20px' }}>
                          Add Property
                        </button>
                      </form>
                    </div>

                  </div>
                ) : (
                  
                  /* TAB 2: WALLET & payout requests */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    
                    {/* Wallet balance cards */}
                    <div className="grid-2">
                      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <span style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 600 }}>USD Account Balance</span>
                        <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                          ${parseFloat(profile.balance_usd).toFixed(4)} USD
                        </div>
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>Minimum withdrawal threshold: $5.00 USD</span>
                      </div>
                      
                      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <span style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 600 }}>INR Account Balance</span>
                        <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--accent-purple)' }}>
                          ₹{(parseFloat(profile.balance_usd) * usdToInrRate).toFixed(2)} INR
                        </div>
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>1 USD = {usdToInrRate.toFixed(2)} INR (Dynamic conversion)</span>
                      </div>
                    </div>

                    {/* Withdrawal Request Form */}
                    <div className="glass-panel" style={{ padding: '24px' }}>
                      <h3 style={{ marginBottom: '20px' }}>Request Balance Withdrawal</h3>

                      {withdrawMsg.text && (
                        <div className={`badge badge-${withdrawMsg.type === 'success' ? 'verified' : 'rejected'}`} style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '6px', textTransform: 'none', justifyContent: 'center' }}>
                          {withdrawMsg.text}
                        </div>
                      )}

                      <form onSubmit={handleRequestWithdrawal} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                        <div className="form-group">
                          <label className="form-label">Withdraw Amount (USD)</label>
                          <input 
                            type="number" 
                            step="0.0001"
                            className="form-control" 
                            placeholder="0.00" 
                            value={withdrawAmount} 
                            onChange={e => setWithdrawAmount(e.target.value)} 
                            required 
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Withdrawal Currency</label>
                          <select 
                            className="form-control" 
                            value={withdrawCurrency} 
                            onChange={e => setWithdrawCurrency(e.target.value)}
                          >
                            <option value="USD">USD ($)</option>
                            <option value="INR">INR (₹)</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Payment Mode</label>
                          <select 
                            className="form-control" 
                            value={withdrawMethod} 
                            onChange={e => setWithdrawMethod(e.target.value)}
                          >
                            <option value="Bank Transfer">Local Bank Transfer</option>
                            <option value="UPI">UPI (India)</option>
                            <option value="PayPal">PayPal</option>
                            <option value="USDT">Crypto USDT</option>
                          </select>
                        </div>
                      </form>

                      <div className="form-group">
                        <label className="form-label">Account details (Bank account/UPI id/Email info)</label>
                        <textarea 
                          className="form-control" 
                          rows="3" 
                          placeholder="e.g. Bank name, Account number, IFSC code or UPI ID details..." 
                          value={withdrawDetails} 
                          onChange={e => setWithdrawDetails(e.target.value)}
                          required
                        />
                      </div>

                      <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                        Submit Withdrawal Request
                      </button>
                    </div>

                    {/* Withdrawal logs */}
                    <div className="glass-panel" style={{ padding: '24px' }}>
                      <h3 style={{ marginBottom: '20px' }}>Transaction History</h3>
                      {withdrawals.length === 0 ? (
                        <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center' }}>No withdrawals recorded yet.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                          {withdrawals.map(w => (
                            <div key={w.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
                              <div>
                                <h4 style={{ fontSize: '15px' }}>
                                  {w.currency === 'INR' ? `₹${parseFloat(w.amount_local).toFixed(2)} INR` : `$${parseFloat(w.amount_usd).toFixed(4)} USD`}
                                </h4>
                                <span style={{ fontSize: '12px', color: '#9ca3af' }}>Method: {w.payment_method} | Date: {new Date(w.created_at).toLocaleDateString()}</span>
                              </div>
                              <span className={`badge badge-${w.status}`}>
                                {w.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PAGE 4: SECURE OWNER GATE */}
        {currentPage === 'owner' && (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '40px 0' }}>
            <div className="glass-panel" style={{ padding: '40px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
              <Lock size={36} color="#f59e0b" style={{ margin: '0 auto 15px' }} />
              <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>Owner Administration</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                Please key in the secure PIN code to unlock the admin settings.
              </p>

              {ownerError && (
                <div className="badge badge-rejected" style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '6px', textTransform: 'none', justifyContent: 'center' }}>
                  {ownerError}
                </div>
              )}

              <form onSubmit={handleOwnerLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Verification PIN</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    placeholder="••••••••" 
                    style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '8px' }}
                    value={ownerPin} 
                    onChange={e => setOwnerPin(e.target.value)} 
                    required 
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Unlock Dashboard
                </button>
              </form>
            </div>
          </div>
        )}

        {/* PAGE 5: OWNER DASHBOARD */}
        {currentPage === 'owner-dashboard' && ownerAuthenticated && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            
            {/* Owner Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.08), transparent)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
              <div>
                <span style={{ fontSize: '14px', color: 'var(--accent-amber)', fontWeight: 600 }}>PLATFORM ADMINISTRATION</span>
                <h1 style={{ fontSize: '32px', margin: '4px 0' }}>EarnVictor Controller</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Monitor platform traffic, payouts, commissions, and site approvals.</p>
              </div>
              <button className="btn btn-secondary" onClick={() => {
                setOwnerAuthenticated(false);
                setOwnerPin('');
                setCurrentPage('home');
              }}>
                Exit Admin
              </button>
            </div>

            {/* Owner stats cards */}
            <div className="grid-4">
              <div className="glass-card" style={{ padding: '20px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>PLATFORM LOG EVENTS</span>
                <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0' }}>{adEventsCount} Events</div>
                <span style={{ color: 'var(--accent-emerald)', fontSize: '11px' }}>Impressions & Clicks</span>
              </div>
              <div className="glass-card" style={{ padding: '20px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>TOTAL PLATFORM GROSS</span>
                <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0' }}>${totalPlatformRev.toFixed(6)} USD</div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Gross publisher payout</span>
              </div>
              <div className="glass-card" style={{ padding: '20px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>OWNER COMMISSION EARNED</span>
                <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0' }}>${totalOwnerCommission.toFixed(6)} USD</div>
                <span style={{ color: 'var(--accent-emerald)', fontSize: '11px' }}>{(ownerCommissionRate * 100).toFixed(0)}% Platform cut</span>
              </div>
              <div className="glass-card" style={{ padding: '20px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>REGISTERED PUBLISHERS</span>
                <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0' }}>{allProfiles.length} Users</div>
                <span style={{ color: 'var(--accent-purple)', fontSize: '11px' }}>Active publishers</span>
              </div>
            </div>

            {ownerMsg.text && (
              <div className={`badge badge-${ownerMsg.type === 'success' ? 'verified' : 'rejected'}`} style={{ width: '100%', padding: '12px', borderRadius: '8px', textTransform: 'none', justifyContent: 'center' }}>
                {ownerMsg.text}
              </div>
            )}

            {/* Split layout: App verification queue & settings controller */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
              
              {/* Approval queues */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                
                {/* 1. Property approval center */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ marginBottom: '20px' }}>Property Verification Queue</h3>
                  {allProperties.filter(p => p.status === 'pending' || p.status === 'verifying').length === 0 ? (
                    <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center' }}>No properties currently awaiting approval.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {allProperties.filter(p => p.status === 'pending' || p.status === 'verifying').map(prop => (
                        <div key={prop.id} className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                            <div>
                              <h4 style={{ fontSize: '16px' }}>{prop.name}</h4>
                              <a href={prop.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: 'var(--accent-purple)', textDecoration: 'underline' }}>{prop.url}</a>
                              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Publisher: {prop.profiles?.email || 'Unknown'} | Type: {prop.type.toUpperCase()}</div>
                            </div>
                            <span className="badge badge-pending">{prop.status}</span>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              onClick={() => {
                                const reason = prompt("Enter rejection reason:");
                                if (reason) handleRejectProperty(prop.id, reason);
                              }}
                            >
                              Reject
                            </button>
                            <button 
                              className="btn btn-emerald" 
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              onClick={() => handleApproveProperty(prop.id)}
                            >
                              Approve / Verify
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Withdrawal Request Manager */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ marginBottom: '20px' }}>Withdrawals Processing Queue</h3>
                  {allWithdrawals.filter(w => w.status === 'pending').length === 0 ? (
                    <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center' }}>No pending withdrawal requests.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {allWithdrawals.filter(w => w.status === 'pending').map(wd => (
                        <div key={wd.id} className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                            <div>
                              <h4 style={{ fontSize: '16px', color: 'var(--accent-emerald)' }}>
                                {wd.currency === 'INR' ? `₹${parseFloat(wd.amount_local).toFixed(2)} INR` : `$${parseFloat(wd.amount_usd).toFixed(4)} USD`}
                              </h4>
                              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Method: {wd.payment_method} | Publisher: {wd.profiles?.email}</div>
                              <div style={{ fontSize: '12px', background: '#0a0814', padding: '10px', borderRadius: '6px', marginTop: '8px', color: '#fff', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <b>Details:</b> {wd.account_details}
                              </div>
                            </div>
                            <span className="badge badge-pending">{wd.status}</span>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              onClick={() => handleRejectWithdrawal(wd)}
                            >
                              Reject & Refund
                            </button>
                            <button 
                              className="btn btn-emerald" 
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              onClick={() => handleApproveWithdrawal(wd.id)}
                            >
                              Confirm Payment
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Settings Panel */}
              <div className="glass-panel" style={{ padding: '24px', alignSelf: 'start' }}>
                <h3 style={{ marginBottom: '20px' }}>Global Settings</h3>
                
                <form onSubmit={handleUpdateRates} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">USD to INR Exchange Rate (₹)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="form-control" 
                      value={usdToInrRate} 
                      onChange={e => setUsdToInrRate(parseFloat(e.target.value))} 
                      required 
                    />
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>Used to calculate local currency payouts dynamically</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Platform Commission Rate</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0.0" 
                      max="1.0" 
                      className="form-control" 
                      value={ownerCommissionRate} 
                      onChange={e => setOwnerCommissionRate(parseFloat(e.target.value))} 
                      required 
                    />
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>e.g. 0.20 = 20% commission routed to owner account</span>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Save Settings
                  </button>
                </form>
              </div>

            </div>

          </div>
        )}

        {/* LEGAL PAGES: TERMS, PRIVACY, DMCA */}
        {currentPage === 'legal-terms' && (
          <div className="glass-panel" style={{ padding: '40px' }}>
            <h1 style={{ marginBottom: '20px', fontSize: '32px' }}>Terms & Conditions</h1>
            <p style={{ color: '#9ca3af', marginBottom: '24px' }}>Last updated: July 28, 2026. Effective duration: 2026 - 2100</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', lineHeight: 1.6 }}>
              <h3>1. Agreement to Terms</h3>
              <p>Welcome to EarnVictor. By accessing or using our ad monetization dashboard, script endpoints, and billing portals, you agree to comply with these Publisher Terms and Conditions. If you do not agree, you are prohibited from utilizing the services.</p>
              
              <h3>2. Publisher Account Audits</h3>
              <p>Publishers must submit property URLs (websites, APKs, bots) representing domains they fully own. Embedding fake code, generating automated bot views, or spoofing ad request headers is strictly prohibited. Violators will face immediate ban and balance forfeiture.</p>
              
              <h3>3. Rates, Commissions, and Payments</h3>
              <p>All stats are tracked transparently. EarnVictor routes a custom platform commission fee to the owner. Withdrawals are processed in USD or converted to INR based on the dynamic exchange rate defined in Settings. Payments are processed within 48 hours.</p>

              <h3>4. Agreement Lifespan</h3>
              <p>These terms remain legally binding and active from the year 2026 through the year 2100 unless revised or replaced by the board directors.</p>
            </div>
          </div>
        )}

        {currentPage === 'legal-privacy' && (
          <div className="glass-panel" style={{ padding: '40px' }}>
            <h1 style={{ marginBottom: '20px', fontSize: '32px' }}>Privacy Policy</h1>
            <p style={{ color: '#9ca3af', marginBottom: '24px' }}>Last updated: July 28, 2026. Active protection span: 2026 - 2100</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', lineHeight: 1.6 }}>
              <h3>1. Data We Collect</h3>
              <p>We collect publisher details (email address), payout accounts, property URLs, and basic ad delivery metrics (IP address, user agent, impressions count) to verify views and guard against invalid clicks.</p>
              
              <h3>2. Data Protection and Encryption</h3>
              <p>All sensitive credentials and database rows are protected via Row Level Security (RLS) on Supabase. Owner PIN codes and database connections are stored strictly server-side.</p>
              
              <h3>3. Analytics Auditing</h3>
              <p>Our Python backend crawler audits sites without reading cookies or scanning personal visitor details, keeping traffic analysis compliant with modern GDPR mandates.</p>
            </div>
          </div>
        )}

        {currentPage === 'legal-dmca' && (
          <div className="glass-panel" style={{ padding: '40px' }}>
            <h1 style={{ marginBottom: '20px', fontSize: '32px' }}>DMCA & Intellectual Property Certification</h1>
            <p style={{ color: '#9ca3af', marginBottom: '24px' }}>Registered filing certificate code: EV-DMCA-2026</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', lineHeight: 1.6 }}>
              <p>EarnVictor respects copyright laws and operates in full compliance with the Digital Millennium Copyright Act. We mandate that all connected apps, websites, and APKs monetizing through our network represent original or fully-licensed intellectual property.</p>
              <h3>Filing a Copyright Takedown</h3>
              <p>If you identify properties running ads on our network that infringe on your copyright, submit a formal claim including the property URL, proof of ownership, and signature to our support mail. We execute review checks within 48 hours.</p>
            </div>
          </div>
        )}

        {/* PAGE: DONATE SECTION */}
        {currentPage === 'donate' && (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '40px 0' }}>
            <div className="glass-panel" style={{ padding: '40px', maxWidth: '500px', width: '100%', textAlign: 'center', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
              <div style={{ background: 'rgba(251, 191, 36, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <DollarSign size={32} color="#fbbf24" />
              </div>
              <h2 style={{ fontSize: '28px', marginBottom: '12px' }}>Support EarnVictor</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
                We are building a clean, transparent, and secure ad network with the lowest platform commissions. Support our hosting and developer costs to help us keep payouts high for everyone!
              </p>

              <div className="glass-card" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '24px' }}>
                <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Direct UPI Donation</span>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', margin: '12px 0 6px', wordBreak: 'break-all' }}>
                  arasu9629hf@okhdfcbank
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Minimum: ₹50 | Maximum: Unlimited
                </div>
                
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ marginTop: '16px', width: '100%', fontSize: '13px' }}
                  onClick={() => {
                    navigator.clipboard.writeText("arasu9629hf@okhdfcbank");
                    alert("UPI ID copied to clipboard!");
                  }}
                >
                  Copy UPI ID
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'start', fontSize: '13px' }}>
                  <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>Your support directly funds verification API servers and server hosting costs.</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'start', fontSize: '13px' }}>
                  <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>Allows us to lower the owner commission rate even further!</span>
                </div>
              </div>

              <button 
                type="button" 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '24px' }} 
                onClick={() => setCurrentPage('home')}
              >
                Return to Home
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Vercel Analytics */}
      <Analytics />

      {/* Footer */}
      <footer style={{ background: '#07050d', borderTop: '1px solid var(--border-color)', padding: '40px 20px', textAlign: 'center', fontSize: '13px', color: '#9ca3af', marginTop: '60px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div>© Copyright EarnVictor 2026 - 2100. All Rights Reserved.</div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Certified Safe & Verified Ad Network</div>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setCurrentPage('legal-dmca')}>DMCA Certificate</span>
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setCurrentPage('owner')}>Owner Panel</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
