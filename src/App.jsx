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
  Info,
  Play,
  Search,
  MessageCircle,
  Award,
  Link,
  ChevronDown
} from 'lucide-react';
import { supabase } from './supabaseClient';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home'); // home, auth, dashboard, owner, owner-dashboard, legal-terms, legal-privacy, legal-dmca
  const [activeTab, setActiveTab] = useState('statistics'); // statistics, websites, telegram_apps, direct_link, payments, insights, referral, priority, help_center, donate
  
  // User Auth State
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  // Publisher Properties and Zones
  const [properties, setProperties] = useState([]);
  const [newPropName, setNewPropName] = useState('');
  const [newPropUrl, setNewPropUrl] = useState('');
  const [newPropType, setNewPropType] = useState('website');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [zones, setZones] = useState([]);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneType, setNewZoneType] = useState('smartlink');
  const [websiteSearchQuery, setWebsiteSearchQuery] = useState('');
  
  // Direct Link Page
  const [directLinks, setDirectLinks] = useState([
    { id: 'dl-1', url: 'https://omg10.com/4/11439317', status: 'active', name: 'Direct Link 1', created_at: '2026-07-28' }
  ]);
  const [newDlName, setNewDlName] = useState('');

  // Wallet & Withdrawals
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawCurrency, setWithdrawCurrency] = useState('USD');
  const [withdrawMethod, setWithdrawMethod] = useState('PayPal');
  const [withdrawDetails, setWithdrawDetails] = useState('');
  const [usdToInrRate, setUsdToInrRate] = useState(83.50);
  const [ownerCommissionRate, setOwnerCommissionRate] = useState(0.20);
  const [withdrawMsg, setWithdrawMsg] = useState({ type: '', text: '' });
  const [selectedPaymentMethodTab, setSelectedPaymentMethodTab] = useState('cryptocurrencies');

  // Subscription States
  const [publisherSubscriptions, setPublisherSubscriptions] = useState([]);
  const [allSubscriptions, setAllSubscriptions] = useState([]);
  const [showSubModal, setShowSubModal] = useState(false);
  const [selectedSubPlan, setSelectedSubPlan] = useState(null);
  const [subUtrId, setSubUtrId] = useState('');

  // Stats filter & data
  const [statsFormatFilter, setStatsFormatFilter] = useState('all');
  const [statsDateRange, setStatsDateRange] = useState('month');
  const [customStatsList, setCustomStatsList] = useState([]);

  // Help Center Search
  const [helpSearchQuery, setHelpSearchQuery] = useState('');

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

  // Clock in EST
  const [estTime, setEstTime] = useState('');

  // Initialize clock and sessions
  useEffect(() => {
    // Dynamic EST Clock
    const updateESTClock = () => {
      const options = {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      const formatter = new Intl.DateTimeFormat('en-US', options);
      setEstTime(formatter.format(new Date()) + ' EST');
    };
    updateESTClock();
    const interval = setInterval(updateESTClock, 1000);

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

    fetchSettings();

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase.table('settings').select('*');
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
      } else {
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

  // Sync/Load Publisher Specific Data
  useEffect(() => {
    if (user && profile) {
      fetchPublisherData();
    }
  }, [user, profile]);

  const fetchPublisherData = async () => {
    try {
      // 1. Fetch properties
      const { data: props } = await supabase.table('properties').select('*').eq('publisher_id', user.id).order('created_at', { ascending: false });
      
      // If publisher has no properties, insert mock properties for visual Monetag feel (to start)
      if (!props || props.length === 0) {
        const mockProps = [
          { name: 'victube.vercel.app', url: 'https://victube.vercel.app', type: 'website', status: 'verified', verification_token: 'ev_verify_mock1', created_at: '2026-07-28' },
          { name: 'earn-victor.vercel.app', url: 'https://earn-victor.vercel.app', type: 'website', status: 'verified', verification_token: 'ev_verify_mock2', created_at: '2026-07-28' },
          { name: 'victor-tools-two.vercel.app', url: 'https://victor-tools-two.vercel.app', type: 'website', status: 'verified', verification_token: 'ev_verify_mock3', created_at: '2026-07-28' },
          { name: 'victor-fit.vercel.app', url: 'https://victor-fit.vercel.app', type: 'website', status: 'verified', verification_token: 'ev_verify_mock4', created_at: '2026-07-28' },
          { name: 'victor-meet.vercel.app', url: 'https://victor-meet.vercel.app', type: 'website', status: 'verified', verification_token: 'ev_verify_mock5', created_at: '2026-07-28' },
          { name: 'victormedia.net', url: 'https://victormedia.net', type: 'website', status: 'pending', verification_token: 'ev_verify_mock6', created_at: '2026-07-28' },
          { name: 'medo.dev', url: 'https://medo.dev', type: 'website', status: 'pending', verification_token: 'ev_verify_mock7', created_at: '2026-07-05' },
          { name: 'app-btaeubp9kdtt.appmedo.com', url: 'https://app-btaeubp9kdtt.appmedo.com', type: 'website', status: 'pending', verification_token: 'ev_verify_mock8', created_at: '2026-07-05' }
        ];

        // Bulk insert mock data into properties for user convenience
        const toInsert = mockProps.map(mp => ({
          publisher_id: user.id,
          name: mp.name,
          url: mp.url,
          type: mp.type,
          verification_token: mp.verification_token,
          status: mp.status,
          created_at: new Date(mp.created_at).toISOString()
        }));

        const { data: insertedData } = await supabase.table('properties').insert(toInsert).select();
        setProperties(insertedData || []);
        if (insertedData && insertedData.length > 0) {
          setSelectedProperty(insertedData[0]);
          fetchZones(insertedData[0].id);
        }
      } else {
        setProperties(props);
        if (!selectedProperty) {
          setSelectedProperty(props[0]);
          fetchZones(props[0].id);
        }
      }

      // 2. Fetch withdrawals logs
      const { data: wds } = await supabase.table('withdrawals').select('*').eq('publisher_id', user.id).order('created_at', { ascending: false });
      setWithdrawals(wds || []);

      // 3. Fetch impressions / click events to populate statistics
      const { data: events } = await supabase.table('ad_events').select('*').eq('publisher_id', user.id);
      
      // Build statistics list
      const statsMap = {};
      
      // If there are real ad events, build real stats list, otherwise add default visual rows
      if (events && events.length > 0) {
        events.forEach(ev => {
          const dateStr = new Date(ev.created_at).toLocaleDateString('de-DE'); // de-DE gives dd.mm.yyyy
          if (!statsMap[dateStr]) {
            statsMap[dateStr] = { date: dateStr, impressions: 0, profit: 0, cpm: 0 };
          }
          statsMap[dateStr].impressions += 1;
          statsMap[dateStr].profit += parseFloat(ev.revenue_usd || 0);
        });

        // Compute CPM for dates
        const computed = Object.values(statsMap).map(day => {
          day.cpm = day.impressions > 0 ? ((day.profit / day.impressions) * 1000).toFixed(2) : '0';
          day.profit = day.profit.toFixed(4);
          return day;
        });
        setCustomStatsList(computed);
      } else {
        // Initial / Fallback display matching Monetag overview stats
        const dummyStats = [
          { date: '28.07.2026', impressions: 13, profit: '0.0000', cpm: '0.00' },
          { date: '27.07.2026', impressions: 25, profit: '0.0020', cpm: '0.08' }
        ];
        setCustomStatsList(dummyStats);
      }

      // 4. Fetch publisher subscriptions
      const { data: subs } = await supabase.table('subscriptions').select('*').eq('publisher_id', user.id).order('created_at', { ascending: false });
      setPublisherSubscriptions(subs || []);

    } catch (err) {
      console.error(err);
    }
  };

  const fetchZones = async (propertyId) => {
    if (!propertyId) return;
    const { data } = await supabase.table('zones').select('*').eq('property_id', propertyId).order('created_at', { ascending: false });
    setZones(data || []);
  };

  // Google Login Authentication
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

  // standard Email/Password authentication
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setCurrentPage('home');
  };

  // Property & Zone Handlers
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
      alert('Site added successfully. Complete ownership verification to launch ads.');
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
      alert("Failed to reach verification API: " + err.message);
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

  // Direct SmartLink Generators
  const handleAddDirectLink = (e) => {
    e.preventDefault();
    if (!newDlName) return;
    const randomId = 'dl-' + Math.floor(Math.random() * 100000);
    const randomUrl = 'https://omg10.com/4/' + Math.floor(10000000 + Math.random() * 90000000);
    setDirectLinks([
      ...directLinks,
      { id: randomId, url: randomUrl, status: 'active', name: newDlName, created_at: '2026-07-28' }
    ]);
    setNewDlName('');
    alert("New Direct Link created successfully!");
  };

  // Withdrawals Requests
  const handleRequestWithdrawal = async (e) => {
    e.preventDefault();
    setWithdrawMsg({ type: '', text: '' });
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0 || !withdrawDetails) {
      setWithdrawMsg({ type: 'error', text: 'Please fill in all details with a valid amount.' });
      return;
    }

    const minPayout = withdrawMethod === 'PayPal' || withdrawMethod === 'Webmoney' || withdrawMethod === 'Skrill' ? 5.0 : withdrawMethod === 'Payoneer' ? 20.0 : withdrawMethod === 'Cryptocurrencies' ? 100.0 : 500.0;
    if (amount < minPayout) {
      setWithdrawMsg({ type: 'error', text: `Minimum payout for ${withdrawMethod} is $${minPayout} USD.` });
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

  // Owner System Handlers
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
      setOwnerError('Cannot connect to API server: ' + err.message);
    }
  };

  const fetchOwnerData = async () => {
    try {
      const { data: props } = await supabase.table('properties').select('*, profiles(email)').order('created_at', { ascending: false });
      setAllProperties(props || []);

      const { data: wds } = await supabase.table('withdrawals').select('*, profiles(email)').order('created_at', { ascending: false });
      setAllWithdrawals(wds || []);

      const { data: profs } = await supabase.table('profiles').select('*').order('created_at', { ascending: false });
      setAllProfiles(profs || []);

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

      const { data: subs } = await supabase.table('subscriptions').select('*, profiles(email)').order('created_at', { ascending: false });
      setAllSubscriptions(subs || []);

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

      // Refund user balance
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

  const handleApproveSubscription = async (subId) => {
    try {
      const { error } = await supabase.table('subscriptions').update({
        status: 'approved',
        activated_at: new Date().toISOString()
      }).eq('id', subId);
      if (error) throw error;
      setOwnerMsg({ type: 'success', text: 'Subscription approved and activated!' });
      fetchOwnerData();
    } catch (err) {
      setOwnerMsg({ type: 'error', text: err.message });
    }
  };

  const handleRejectSubscription = async (subId) => {
    try {
      const { error } = await supabase.table('subscriptions').update({
        status: 'rejected'
      }).eq('id', subId);
      if (error) throw error;
      setOwnerMsg({ type: 'success', text: 'Subscription marked as rejected.' });
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
      setOwnerMsg({ type: 'success', text: 'Platform settings updated successfully!' });
      fetchSettings();
    } catch (err) {
      setOwnerMsg({ type: 'error', text: err.message });
    }
  };

  const [editUsdBalances, setEditUsdBalances] = useState({});
  const [editInrBalances, setEditInrBalances] = useState({});

  const handleUpdatePublisherBalance = async (pubId) => {
    const usdVal = editUsdBalances[pubId];
    const inrVal = editInrBalances[pubId];
    if (usdVal === undefined && inrVal === undefined) {
      alert("Please change either the USD or INR balance first.");
      return;
    }

    try {
      const updates = {};
      if (usdVal !== undefined) updates.balance_usd = parseFloat(usdVal);
      if (inrVal !== undefined) updates.balance_inr = parseFloat(inrVal);

      const { error } = await supabase.table('profiles').update(updates).eq('id', pubId);
      if (error) throw error;
      setOwnerMsg({ type: 'success', text: 'Publisher balance updated successfully!' });
      fetchOwnerData();
    } catch (err) {
      setOwnerMsg({ type: 'error', text: err.message });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  // Filtering properties based on search query
  const filteredProperties = properties.filter(p => 
    p.name.toLowerCase().includes(websiteSearchQuery.toLowerCase()) || 
    p.url.toLowerCase().includes(websiteSearchQuery.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER NAVBAR */}
      <nav className="navbar" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="nav-logo" onClick={() => setCurrentPage('home')} style={{ cursor: 'pointer' }}>
          <Shield size={28} color="#10b981" />
          Earn<span style={{ color: '#8b5cf6' }}>Victor</span>
        </div>

        <ul className="nav-links">
          <li className="nav-link" onClick={() => setCurrentPage('home')}>Home</li>
          {user && (
            <li className="nav-link" onClick={() => { setCurrentPage('dashboard'); setActiveTab('statistics'); }} style={{ fontWeight: 'bold', color: '#a78bfa' }}>
              Dashboard
            </li>
          )}
          <li className="nav-link" onClick={() => { setCurrentPage('dashboard'); setActiveTab('donate'); }} style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
            <DollarSign size={14} /> Donate
          </li>
          <li className="nav-link" onClick={() => setCurrentPage('owner')} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Lock size={14} /> Admin
          </li>
          <li className="nav-link" onClick={() => { setCurrentPage('dashboard'); setActiveTab('help_center'); }}>Help Center</li>
          
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
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

      {/* MAIN CONTAINER */}
      <main style={{ flex: 1, padding: '30px 20px', width: '100%', margin: '0 auto', maxWidth: '1400px' }}>
        
        {/* PAGE 1: LANDING WEB LAYOUT */}
        {currentPage === 'home' && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '70px', padding: '20px 0' }}>
            
            {/* Hero Header */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', margin: '30px 0' }}>
              <span className="badge badge-verified" style={{ padding: '6px 12px', fontSize: '12px' }}>
                🚀 SmartLink, Popunder, Vignette, APK & Telegram Monetization
              </span>
              <h1 style={{ fontSize: '64px', lineHeight: 1.1, fontWeight: 800, maxWidth: '900px', background: 'linear-gradient(135deg, #ffffff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Turn Traffic Into High-Yielding Revenue
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '18px', maxWidth: '700px', lineHeight: 1.6 }}>
                Join EarnVictor to run high CPM ads on your sites, mobile games, or bots. Experience transparent statistics, 20% platform commission rates, and swift payouts.
              </p>
              
              <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                <button className="btn btn-primary" onClick={() => {
                  if (user) { setCurrentPage('dashboard'); setActiveTab('statistics'); }
                  else setCurrentPage('auth');
                }} style={{ padding: '14px 28px' }}>
                  Get Started <ArrowRight size={18} />
                </button>
                <button className="btn btn-secondary" onClick={() => { setCurrentPage('dashboard'); setActiveTab('donate'); }} style={{ padding: '14px 28px' }}>
                  Support Platform (UPI)
                </button>
              </div>
            </div>

            {/* Quick overview of levels/features */}
            <div className="grid-3" style={{ textAlign: 'left' }}>
              <div className="glass-card">
                <Globe size={32} color="#10b981" />
                <h3 style={{ margin: '15px 0 10px' }}>100% Fill Rate</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>
                  EarnVictor serves safe, malware-free advertisements globally, ensuring no impression is wasted.
                </p>
              </div>
              <div className="glass-card">
                <Users size={32} color="#8b5cf6" />
                <h3 style={{ margin: '15px 0 10px' }}>Clean & safe ads</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>
                  Hand-picked ad options checked 24/7 by malware-prevention firewalls to safeguard publisher UX.
                </p>
              </div>
              <div className="glass-card">
                <DollarSign size={32} color="#ec4899" />
                <h3 style={{ margin: '15px 0 10px' }}>USD & INR Payments</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>
                  Withdraw your earnings in USD or dynamic local currency conversions starting from a low $5.00 limit.
                </p>
              </div>
            </div>

            {/* Footer references */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', fontSize: '13px', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '30px' }}>
              <span style={{ cursor: 'pointer' }} onClick={() => setCurrentPage('legal-terms')}>Terms & Conditions</span>
              <span>•</span>
              <span style={{ cursor: 'pointer' }} onClick={() => setCurrentPage('legal-privacy')}>Privacy Policy</span>
              <span>•</span>
              <span style={{ cursor: 'pointer' }} onClick={() => setCurrentPage('legal-dmca')}>DMCA Filing Certificate</span>
            </div>
          </div>
        )}

        {/* PAGE 2: AUTH SECTION WITH GOOGLE AUTH */}
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

        {/* PAGE 3: PUBLISHER MONETAG-STYLE DASHBOARD */}
        {currentPage === 'dashboard' && profile && (
          <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr', gap: '30px' }}>
            
            {/* SIDEBAR NAVIGATION PANEL */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Profile Levels Header Widget */}
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase' }}>Publisher Status</span>
                  <span className="badge badge-verified" style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>Level: green</span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: '5px 0' }}>
                  ${parseFloat(profile.balance_usd).toFixed(2)}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#9ca3af' }}>
                  <Clock size={14} />
                  <span>{estTime}</span>
                </div>
              </div>

              {/* Sidebar tabs */}
              <div className="glass-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button className="btn" onClick={() => setActiveTab('statistics')} style={{ justifyContent: 'flex-start', background: activeTab === 'statistics' ? 'rgba(255,255,255,0.04)' : 'transparent', color: activeTab === 'statistics' ? '#fff' : '#9ca3af', borderLeft: activeTab === 'statistics' ? '3px solid #8b5cf6' : 'none', borderRadius: '0 8px 8px 0', width: '100%' }}>
                  <TrendingUp size={16} /> Statistics
                </button>
                <button className="btn" onClick={() => setActiveTab('websites')} style={{ justifyContent: 'flex-start', background: activeTab === 'websites' ? 'rgba(255,255,255,0.04)' : 'transparent', color: activeTab === 'websites' ? '#fff' : '#9ca3af', borderLeft: activeTab === 'websites' ? '3px solid #8b5cf6' : 'none', borderRadius: '0 8px 8px 0', width: '100%' }}>
                  <Globe size={16} /> Websites
                </button>
                <button className="btn" onClick={() => setActiveTab('telegram_apps')} style={{ justifyContent: 'flex-start', background: activeTab === 'telegram_apps' ? 'rgba(255,255,255,0.04)' : 'transparent', color: activeTab === 'telegram_apps' ? '#fff' : '#9ca3af', borderLeft: activeTab === 'telegram_apps' ? '3px solid #8b5cf6' : 'none', borderRadius: '0 8px 8px 0', width: '100%' }}>
                  <Smartphone size={16} /> Telegram Mini Apps
                </button>
                <button className="btn" onClick={() => setActiveTab('direct_link')} style={{ justifyContent: 'flex-start', background: activeTab === 'direct_link' ? 'rgba(255,255,255,0.04)' : 'transparent', color: activeTab === 'direct_link' ? '#fff' : '#9ca3af', borderLeft: activeTab === 'direct_link' ? '3px solid #8b5cf6' : 'none', borderRadius: '0 8px 8px 0', width: '100%' }}>
                  <Link size={16} /> Direct Link
                </button>
                <button className="btn" onClick={() => setActiveTab('payments')} style={{ justifyContent: 'flex-start', background: activeTab === 'payments' ? 'rgba(255,255,255,0.04)' : 'transparent', color: activeTab === 'payments' ? '#fff' : '#9ca3af', borderLeft: activeTab === 'payments' ? '3px solid #8b5cf6' : 'none', borderRadius: '0 8px 8px 0', width: '100%' }}>
                  <CreditCard size={16} /> Payments
                </button>
                <button className="btn" onClick={() => setActiveTab('insights')} style={{ justifyContent: 'flex-start', background: activeTab === 'insights' ? 'rgba(255,255,255,0.04)' : 'transparent', color: activeTab === 'insights' ? '#fff' : '#9ca3af', borderLeft: activeTab === 'insights' ? '3px solid #8b5cf6' : 'none', borderRadius: '0 8px 8px 0', width: '100%' }}>
                  <BookOpen size={16} /> Insights
                </button>
                <button className="btn" onClick={() => setActiveTab('referral')} style={{ justifyContent: 'flex-start', background: activeTab === 'referral' ? 'rgba(255,255,255,0.04)' : 'transparent', color: activeTab === 'referral' ? '#fff' : '#9ca3af', borderLeft: activeTab === 'referral' ? '3px solid #8b5cf6' : 'none', borderRadius: '0 8px 8px 0', width: '100%' }}>
                  <Users size={16} /> Referral Program
                </button>
                <button className="btn" onClick={() => setActiveTab('priority')} style={{ justifyContent: 'flex-start', background: activeTab === 'priority' ? 'rgba(255,255,255,0.04)' : 'transparent', color: activeTab === 'priority' ? '#fff' : '#9ca3af', borderLeft: activeTab === 'priority' ? '3px solid #8b5cf6' : 'none', borderRadius: '0 8px 8px 0', width: '100%' }}>
                  <Award size={16} /> Priority Program
                </button>
                <button className="btn" onClick={() => setActiveTab('premium')} style={{ justifyContent: 'flex-start', background: activeTab === 'premium' ? 'rgba(255,255,255,0.04)' : 'transparent', color: activeTab === 'premium' ? '#fff' : '#9ca3af', borderLeft: activeTab === 'premium' ? '3px solid #10b981' : 'none', borderRadius: '0 8px 8px 0', width: '100%' }}>
                  <Award size={16} color="#10b981" /> Premium Plans (Ads Free)
                </button>
                <button className="btn" onClick={() => setActiveTab('help_center')} style={{ justifyContent: 'flex-start', background: activeTab === 'help_center' ? 'rgba(255,255,255,0.04)' : 'transparent', color: activeTab === 'help_center' ? '#fff' : '#9ca3af', borderLeft: activeTab === 'help_center' ? '3px solid #8b5cf6' : 'none', borderRadius: '0 8px 8px 0', width: '100%' }}>
                  <HelpCircle size={16} /> Help Center
                </button>
                
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '10px 0' }} />
                
                <button className="btn" onClick={() => setActiveTab('donate')} style={{ justifyContent: 'flex-start', background: activeTab === 'donate' ? 'rgba(255,255,255,0.04)' : 'transparent', color: '#fbbf24', borderLeft: activeTab === 'donate' ? '3px solid #fbbf24' : 'none', borderRadius: '0 8px 8px 0', width: '100%' }}>
                  <DollarSign size={16} color="#fbbf24" /> Support Platform
                </button>
              </div>
            </div>

            {/* TAB DISPLAY WORKSPACE */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

              {/* 1. STATISTICS TAB */}
              {activeTab === 'statistics' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>Publisher Traffic Statistics</h2>
                    
                    {/* Welcome Notice */}
                    <div style={{ display: 'flex', gap: '15px', background: 'rgba(139, 92, 246, 0.06)', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
                      <Info size={24} color="#8b5cf6" style={{ flexShrink: 0 }} />
                      <div style={{ fontSize: '13px', lineHeight: 1.5, color: '#d1d5db' }}>
                        <strong>Dear Partner</strong>, you have just started monetizing traffic with EarnVictor, congratulations!<br />
                        To make sure we are on the same page, please take a look at our policy rules that you have agreed to. Pay attention to prohibited traffic acquisition practices like Auto / Self clicks, Bots / Fraud, Traffic from exchanges, Paid-to-click traffic, etc. We do not work with publishers who engage in such traffic.
                      </div>
                    </div>

                    {/* Stats Controls Panel */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '24px' }}>
                      <div className="form-group">
                        <label className="form-label">Ad Formats</label>
                        <select className="form-control" value={statsFormatFilter} onChange={e => setStatsFormatFilter(e.target.value)}>
                          <option value="all">All Formats</option>
                          <option value="onclick">OnClick (Popunder)</option>
                          <option value="display">Display Ads</option>
                          <option value="telegram">Telegram Ads</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Date Range</label>
                        <select className="form-control" value={statsDateRange} onChange={e => setStatsDateRange(e.target.value)}>
                          <option value="month">Last 30 Days (28/06/2026 – 28/07/2026)</option>
                          <option value="week">Last 7 Days</option>
                          <option value="today">Today</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Country</label>
                        <select className="form-control"><option>All Countries</option></select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Connected Zones</label>
                        <select className="form-control"><option>All Zones</option></select>
                      </div>
                    </div>

                    {/* Stats table */}
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>
                            <th style={{ padding: '12px' }}>Date</th>
                            <th style={{ padding: '12px' }}>Impressions</th>
                            <th style={{ padding: '12px' }}>Profit</th>
                            <th style={{ padding: '12px' }}>CPM ($)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customStatsList.map((stat, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '12px', fontWeight: 'bold' }}>{stat.date}</td>
                              <td style={{ padding: '12px' }}>{stat.impressions}</td>
                              <td style={{ padding: '12px', color: '#10b981' }}>${stat.profit}</td>
                              <td style={{ padding: '12px' }}>${stat.cpm}</td>
                            </tr>
                          ))}
                          <tr style={{ background: 'rgba(255,255,255,0.02)', fontWeight: 'bold', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <td style={{ padding: '12px' }}>Total</td>
                            <td style={{ padding: '12px' }}>
                              {customStatsList.reduce((acc, stat) => acc + parseInt(stat.impressions), 0)}
                            </td>
                            <td style={{ padding: '12px', color: '#10b981' }}>
                              ${customStatsList.reduce((acc, stat) => acc + parseFloat(stat.profit), 0).toFixed(4)}
                            </td>
                            <td style={{ padding: '12px' }}>
                              ${(customStatsList.reduce((acc, stat) => acc + parseFloat(stat.cpm), 0) / (customStatsList.length || 1)).toFixed(2)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. WEBSITES TAB */}
              {activeTab === 'websites' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  
                  {/* Website Add Form */}
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ marginBottom: '15px' }}>Register New Website</h3>
                    <form onSubmit={handleAddProperty} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr auto', gap: '15px', alignItems: 'end' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Site Title Name</label>
                        <input type="text" className="form-control" placeholder="e.g. My Video Portal" value={newPropName} onChange={e => setNewPropName(e.target.value)} required />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Domain URL</label>
                        <input type="text" className="form-control" placeholder="e.g. mywebsite.com" value={newPropUrl} onChange={e => setNewPropUrl(e.target.value)} required />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Format Type</label>
                        <select className="form-control" value={newPropType} onChange={e => setNewPropType(e.target.value)}>
                          <option value="website">Website</option>
                          <option value="apk">Android APK</option>
                          <option value="mini_game">Mini Game</option>
                          <option value="telegram_bot">Telegram Bot</option>
                        </select>
                      </div>
                      <button type="submit" className="btn btn-primary" style={{ padding: '12px 20px' }}>Add Domain</button>
                    </form>
                  </div>

                  {/* My Websites List */}
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h3 style={{ fontSize: '20px' }}>My Websites</h3>
                      
                      {/* Search bar */}
                      <div style={{ position: 'relative', maxWidth: '300px', width: '100%' }}>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Search by title" 
                          style={{ paddingLeft: '35px', paddingRight: '15px', fontSize: '13px' }}
                          value={websiteSearchQuery}
                          onChange={e => setWebsiteSearchQuery(e.target.value)}
                        />
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9ca3af' }} />
                      </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>
                            <th style={{ padding: '12px' }}>Title</th>
                            <th style={{ padding: '12px' }}>ID</th>
                            <th style={{ padding: '12px' }}>Zones</th>
                            <th style={{ padding: '12px' }}>Status</th>
                            <th style={{ padding: '12px' }}>Created</th>
                            <th style={{ padding: '12px' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProperties.map(prop => (
                            <tr key={prop.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'middle' }}>
                              <td style={{ padding: '12px', fontWeight: '600', color: '#fff' }}>{prop.name}</td>
                              <td style={{ padding: '12px', color: '#9ca3af' }}>{prop.id.substring(0, 7)}</td>
                              <td style={{ padding: '12px' }}>{prop.status === 'verified' ? '9 zones' : '0'}</td>
                              <td style={{ padding: '12px' }}>
                                <span className={`badge badge-${prop.status}`}>
                                  {prop.status}
                                </span>
                              </td>
                              <td style={{ padding: '12px', color: '#9ca3af' }}>{new Date(prop.created_at).toLocaleDateString()}</td>
                              <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                                <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => window.open(prop.url, '_blank')}>
                                  Open website
                                </button>
                                {prop.status !== 'verified' ? (
                                  <button className="btn btn-emerald" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleVerifyProperty(prop.id, prop.url)}>
                                    Verify
                                  </button>
                                ) : (
                                  <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => { setSelectedProperty(prop); fetchZones(prop.id); }}>
                                    Add Zone
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Zones Setup Section (Visible when a property is clicked) */}
                  {selectedProperty && selectedProperty.status === 'verified' && (
                    <div className="glass-panel" style={{ padding: '24px' }}>
                      <h3 style={{ marginBottom: '20px' }}>Setup Ad Placements for {selectedProperty.name}</h3>
                      <form onSubmit={handleCreateZone} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr auto', gap: '15px', alignItems: 'end', marginBottom: '25px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Ad Placements Title</label>
                          <input type="text" className="form-control" placeholder="e.g. Popunder Zone" value={newZoneName} onChange={e => setNewZoneName(e.target.value)} required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Format Placement</label>
                          <select className="form-control" value={newZoneType} onChange={e => setNewZoneType(e.target.value)}>
                            <option value="smartlink">SmartLink</option>
                            <option value="popunder">Popunder (Onclick)</option>
                            <option value="banner">Vignette Banner</option>
                            <option value="video">In-Page Push / Video</option>
                          </select>
                        </div>
                        <button type="submit" className="btn btn-primary">Create Zone Tag</button>
                      </form>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {zones.map(z => (
                          <div key={z.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
                            <div>
                              <h4 style={{ fontSize: '14px' }}>{z.name}</h4>
                              <span style={{ fontSize: '11px', color: '#9ca3af' }}>Type: {z.type} | CPM: ${parseFloat(z.cpm_rate).toFixed(2)}</span>
                            </div>
                            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => {
                              copyToClipboard(`<script src="http://localhost:8000/api/ad-serve?zone_id=${z.id}" data-zone="${z.id}"></script>`);
                              alert("Zone integration script copied to clipboard!");
                            }}>
                              Copy Code Tag
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* 3. TELEGRAM MINI APPS TAB */}
              {activeTab === 'telegram_apps' && (
                <div className="glass-panel" style={{ padding: '30px' }}>
                  <h2 style={{ marginBottom: '15px' }}>Telegram Mini Apps & Bots Monetization</h2>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                    Earn high revenue share by integrating native popups and SmartLinks inside your Telegram bots or Web Apps.
                  </p>
                  
                  <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #8b5cf6', background: 'rgba(255,255,255,0.01)', marginBottom: '20px' }}>
                    <h4 style={{ marginBottom: '8px' }}>🚀 How to get started with Telegram integration</h4>
                    <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: 1.6 }}>
                      1. Create a <strong>SmartLink</strong> from the Direct Link tab.<br />
                      2. Paste the generated Direct Link inside your Telegram Bot markup keyboard or Inline Query callback buttons.<br />
                      3. Every user tap that navigates to the Direct Link will trigger a popunder page, crediting balance to your profile.
                    </p>
                  </div>
                </div>
              )}

              {/* 4. DIRECT LINK TAB (SMARTLINK) */}
              {activeTab === 'direct_link' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  
                  {/* Create Direct Link */}
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ marginBottom: '15px' }}>Direct Links (SmartLink)</h3>
                    <form onSubmit={handleAddDirectLink} style={{ display: 'flex', gap: '15px', alignItems: 'end' }}>
                      <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                        <label className="form-label">Link Name</label>
                        <input type="text" className="form-control" placeholder="e.g. Social Traffic SmartLink" value={newDlName} onChange={e => setNewDlName(e.target.value)} required />
                      </div>
                      <button type="submit" className="btn btn-primary">Generate Direct Link</button>
                    </form>
                  </div>

                  {/* List of Direct Links */}
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ marginBottom: '15px' }}>Active Links ({directLinks.length})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {directLinks.map(dl => (
                        <div key={dl.id} className="glass-card" style={{ background: 'rgba(255,255,255,0.01)', padding: '20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                            <div>
                              <h4 style={{ color: '#fff', fontSize: '15px' }}>{dl.name}</h4>
                              <span style={{ fontSize: '12px', color: 'var(--accent-purple)', wordBreak: 'break-all', display: 'block', margin: '4px 0' }}>
                                {dl.url}
                              </span>
                              <span style={{ fontSize: '11px', color: '#9ca3af' }}>Created: {dl.created_at}</span>
                            </div>
                            <span className="badge badge-verified">{dl.status}</span>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => copyToClipboard(dl.url)}>
                              Copy Direct Link
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setActiveTab('statistics')}>
                              View Statistics
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* How to use Direct Link section */}
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <h4 style={{ marginBottom: '12px' }}>How to use SmartLink</h4>
                    <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: 1.6, marginBottom: '20px' }}>
                      Copy the link and use it wherever you see fit. Link it to items on your website, landing page, or send traffic directly from social media platforms (Facebook, Telegram channels, X tweets).
                    </p>
                    
                    <span style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '12px', color: '#a78bfa' }}>
                      Cases — find out how publishers make profits with SmartLink
                    </span>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                      <li style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                        🔗 <strong>Learn the best ways to motivate users to interact with ads more</strong> <span style={{ color: '#9ca3af' }}>(Blog article)</span>
                      </li>
                      <li style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                        🔗 <strong>How to Turn Facebook into a Profit Machine</strong> <span style={{ color: '#9ca3af' }}>(Success story)</span>
                      </li>
                      <li>
                        🔗 <strong>How high CPMs turned tweets into real profit</strong> <span style={{ color: '#9ca3af' }}>(Success story)</span>
                      </li>
                    </ul>
                  </div>

                </div>
              )}

              {/* 5. PAYMENTS TAB */}
              {activeTab === 'payments' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  
                  {/* Payout summaries */}
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ marginBottom: '20px' }}>Payments & Earnings Overview</h3>
                    <div className="grid-4">
                      <div>
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>Approved Balance</span>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>${parseFloat(profile.balance_usd).toFixed(2)}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>Hold Balance</span>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fbbf24' }}>$0.00</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>Total Payouts</span>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
                          ${withdrawals.filter(w => w.status === 'approved').reduce((acc, w) => acc + parseFloat(w.amount_usd), 0).toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>Minimum Limit</span>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#a78bfa' }}>$5.00</div>
                      </div>
                    </div>
                  </div>

                  {/* Payment request options form */}
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ marginBottom: '15px' }}>Request Withdrawal</h3>
                    
                    {withdrawMsg.text && (
                      <div className={`badge badge-${withdrawMsg.type === 'success' ? 'verified' : 'rejected'}`} style={{ width: '100%', padding: '10px', marginBottom: '20px', textTransform: 'none', justifyContent: 'center' }}>
                        {withdrawMsg.text}
                      </div>
                    )}

                    <form onSubmit={handleRequestWithdrawal} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' }}>
                      <div className="form-group">
                        <label className="form-label">Withdrawal Amount ($ USD)</label>
                        <input type="number" step="0.01" className="form-control" placeholder="0.00" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Withdrawal Method</label>
                        <select className="form-control" value={withdrawMethod} onChange={e => setWithdrawMethod(e.target.value)}>
                          <option value="PayPal">PayPal (Min $5)</option>
                          <option value="Cryptocurrencies">Crypto (Min $100)</option>
                          <option value="Skrill">Skrill (Min €5)</option>
                          <option value="Webmoney">Webmoney (Min $5)</option>
                          <option value="Payoneer">Payoneer (Min $20)</option>
                          <option value="Wire">Wire Bank (Min $500)</option>
                          <option value="Revolut">Revolut (Min $500)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Target Currency</label>
                        <select className="form-control" value={withdrawCurrency} onChange={e => setWithdrawCurrency(e.target.value)}>
                          <option value="USD">USD ($)</option>
                          <option value="INR">INR (₹)</option>
                        </select>
                      </div>
                    </form>

                    <div className="form-group">
                      <label className="form-label">Payment Account Details (Bank info, UPI ID, or Wallet address)</label>
                      <textarea className="form-control" rows="2" placeholder="e.g. PayPal email ID, bank details, or UPI address..." value={withdrawDetails} onChange={e => setWithdrawDetails(e.target.value)} required />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                      Submit Payout Request
                    </button>
                  </div>

                  {/* Payment Options Details tabs (mimics the Monetag layout) */}
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ marginBottom: '20px' }}>Available Payout Gateways</h3>
                    
                    {/* Method Selector Tabs */}
                    <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', marginBottom: '20px', overflowX: 'auto' }}>
                      {['cryptocurrencies', 'paypal', 'skrill', 'webmoney', 'payoneer', 'wire', 'revolut'].map(method => (
                        <button 
                          key={method} 
                          className="btn" 
                          type="button"
                          onClick={() => setSelectedPaymentMethodTab(method)}
                          style={{ 
                            padding: '6px 12px', 
                            fontSize: '12px', 
                            background: selectedPaymentMethodTab === method ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                            borderColor: selectedPaymentMethodTab === method ? '#8b5cf6' : 'rgba(255,255,255,0.05)',
                            border: '1px solid',
                            color: selectedPaymentMethodTab === method ? '#fff' : '#9ca3af'
                          }}
                        >
                          {method.toUpperCase()}
                        </button>
                      ))}
                    </div>

                    {/* Method Description Card */}
                    <div className="glass-card" style={{ background: 'rgba(255,255,255,0.01)', padding: '20px' }}>
                      {selectedPaymentMethodTab === 'cryptocurrencies' && (
                        <div>
                          <h4 style={{ color: '#fff', marginBottom: '8px' }}>Cryptocurrencies Payouts</h4>
                          <p style={{ color: '#9ca3af', fontSize: '13px', lineHeight: 1.5 }}>
                            Receive earnings in Bitcoin, USDT TRC20, USDT ERC20, USDT BEP20, or Toncoin (TON) through a licensed payment service provider (e.g., CoinsPaid or similar).<br /><br />
                            <strong>Minimum payout:</strong> $100 USD<br />
                            <strong>Fees:</strong> Exchange platform network fees apply.
                          </p>
                        </div>
                      )}
                      {selectedPaymentMethodTab === 'paypal' && (
                        <div>
                          <h4 style={{ color: '#fff', marginBottom: '8px' }}>PayPal Transfers</h4>
                          <p style={{ color: '#9ca3af', fontSize: '13px', lineHeight: 1.5 }}>
                            Instant payment directly to your registered PayPal email account in USD.<br /><br />
                            <strong>Minimum payout:</strong> $5 USD<br />
                            <strong>Fees:</strong> None.
                          </p>
                        </div>
                      )}
                      {selectedPaymentMethodTab === 'skrill' && (
                        <div>
                          <h4 style={{ color: '#fff', marginBottom: '8px' }}>Skrill Wallet</h4>
                          <p style={{ color: '#9ca3af', fontSize: '13px', lineHeight: 1.5 }}>
                            Instant payment in EUR only.<br /><br />
                            <strong>Minimum payout:</strong> €5 EUR<br />
                            <strong>Verification:</strong> Required to complete KYC checks.
                          </p>
                        </div>
                      )}
                      {selectedPaymentMethodTab === 'webmoney' && (
                        <div>
                          <h4 style={{ color: '#fff', marginBottom: '8px' }}>Webmoney Transfer</h4>
                          <p style={{ color: '#9ca3af', fontSize: '13px', lineHeight: 1.5 }}>
                            Instant payment in USD to WMZ or WMT wallets.<br /><br />
                            <strong>Minimum payout:</strong> $5 USD<br />
                            <strong>Verification:</strong> Required to complete KYC.
                          </p>
                        </div>
                      )}
                      {selectedPaymentMethodTab === 'payoneer' && (
                        <div>
                          <h4 style={{ color: '#fff', marginBottom: '8px' }}>Payoneer Account</h4>
                          <p style={{ color: '#9ca3af', fontSize: '13px', lineHeight: 1.5 }}>
                            Direct bank card transfer in USD.<br /><br />
                            <strong>Minimum payout:</strong> $20 USD<br />
                            <strong>Availability:</strong> Unlocked when balance exceeds $30.
                          </p>
                        </div>
                      )}
                      {selectedPaymentMethodTab === 'wire' && (
                        <div>
                          <h4 style={{ color: '#fff', marginBottom: '8px' }}>Regular Bank Wire</h4>
                          <p style={{ color: '#9ca3af', fontSize: '13px', lineHeight: 1.5 }}>
                            Regular bank transactions with 3-5 business days processing delay. Transfers in USD or EUR.<br /><br />
                            <strong>Minimum payout:</strong> $500 USD<br />
                            <strong>Fees:</strong> Transfers below $1000 incur a standard bank handling fee of $50.
                          </p>
                        </div>
                      )}
                      {selectedPaymentMethodTab === 'revolut' && (
                        <div>
                          <h4 style={{ color: '#fff', marginBottom: '8px' }}>Revolut Account</h4>
                          <p style={{ color: '#9ca3af', fontSize: '13px', lineHeight: 1.5 }}>
                            For Revolut account holders. Standard transactions with 3-5 days delivery. Transfers in USD/EUR.<br /><br />
                            <strong>Minimum payout:</strong> $500 USD<br />
                            <strong>Fees:</strong> Wire transactions under $1000 carry a $50 bank commission fee.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Transaction logs */}
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ marginBottom: '15px' }}>Payout Transaction History</h3>
                    {withdrawals.length === 0 ? (
                      <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center' }}>No payments recorded yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {withdrawals.map(w => (
                          <div key={w.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
                            <div>
                              <h4 style={{ fontSize: '14px' }}>
                                {w.currency === 'INR' ? `₹${parseFloat(w.amount_local).toFixed(2)} INR` : `$${parseFloat(w.amount_usd).toFixed(2)} USD`}
                              </h4>
                              <span style={{ fontSize: '11px', color: '#9ca3af' }}>Gateway: {w.payment_method} | Date: {new Date(w.created_at).toLocaleDateString()}</span>
                            </div>
                            <span className={`badge badge-${w.status}`}>{w.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* 6. INSIGHTS TAB */}
              {activeTab === 'insights' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <h2 style={{ marginBottom: '15px', fontSize: '24px' }}>Essential Monetization Guides & Insights</h2>
                    <p style={{ color: '#9ca3af', marginBottom: '24px', fontSize: '14px' }}>
                      Learn how to turn your website into a monetization powerhouse with all the essential monetization information and guides.
                    </p>

                    {/* Onboarding Videos accordion layout */}
                    <h3 style={{ fontSize: '18px', marginBottom: '15px', color: '#a78bfa' }}>Video Instructions</h3>
                    <div className="grid-2" style={{ marginBottom: '30px' }}>
                      <div className="glass-card" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <div style={{ background: 'rgba(139,92,246,0.1)', padding: '15px', borderRadius: '12px' }}>
                          <Play size={24} color="#8b5cf6" />
                        </div>
                        <div>
                          <h4 style={{ fontSize: '14px' }}>Onboarding video</h4>
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>Learn how to set up your account</span>
                        </div>
                      </div>
                      <div className="glass-card" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <div style={{ background: 'rgba(16,185,129,0.1)', padding: '15px', borderRadius: '12px' }}>
                          <Play size={24} color="#10b981" />
                        </div>
                        <div>
                          <h4 style={{ fontSize: '14px' }}>Tag installation guide</h4>
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>Learn where to copy-paste scripts</span>
                        </div>
                      </div>
                    </div>

                    {/* Educational Formats list */}
                    <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>Ad Formats Explanation</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {[
                        { title: 'SmartLink: Easy and Profitable Traffic Monetization', desc: 'Direct redirect links optimized for highest conversion rates.' },
                        { title: 'Popunder (Onclick): Your Monetization Format with REALLY High CPM', desc: 'Maximum CPM popup ad placements firing in background pages.' },
                        { title: 'In-Page Push: Monetize broadest audience, including iOS users', desc: 'Native push notifications that float cleanly on mobile browsers.' },
                        { title: 'MultiTag: What Is It?', desc: 'A multi-ad-format tag that serves Popunders, banners, and push automatically.' },
                        { title: 'Vignette Banner: Native Monetization Format With BURNING Performance', desc: 'A native interstitial vignette ad displaying on page transitions.' },
                        { title: 'Push Notifications: Make additional profit with a well-known monetization format', desc: 'Subscribes readers to clean notification feeds for continuous revenue.' }
                      ].map((format, idx) => (
                        <div key={idx} className="glass-card" style={{ background: 'rgba(255,255,255,0.01)', padding: '16px' }}>
                          <h4 style={{ fontSize: '14px', marginBottom: '4px', color: '#fff' }}>{format.title}</h4>
                          <p style={{ fontSize: '12px', color: '#9ca3af' }}>{format.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 7. REFERRAL TAB */}
              {activeTab === 'referral' && (
                <div className="glass-panel" style={{ padding: '30px' }}>
                  <h2>Referral Program</h2>
                  <p style={{ color: 'var(--text-secondary)', margin: '15px 0 24px', fontSize: '14px' }}>
                    Invite new publishers to EarnVictor and receive a lifetime commission of 5% of their gross earnings.
                  </p>
                  
                  <div className="glass-card" style={{ background: 'rgba(255,255,255,0.01)' }}>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>Your Unique Referral Link</span>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
                      <input type="text" className="form-control" readOnly value={`https://earnvictor.com/ref?id=${user.id}`} style={{ flex: 1 }} />
                      <button className="btn btn-primary" onClick={() => { copyToClipboard(`https://earnvictor.com/ref?id=${user.id}`); alert("Referral link copied!"); }}>
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 8. PRIORITY PROGRAM TAB */}
              {activeTab === 'priority' && (
                <div className="glass-panel" style={{ padding: '30px' }}>
                  <h2>Priority Club</h2>
                  <p style={{ color: 'var(--text-secondary)', margin: '15px 0 24px', fontSize: '14px' }}>
                    Achieve higher monthly traffic counts to unlock prioritized payouts, dedicated manager support, and exclusive custom ad tags.
                  </p>
                  <div className="grid-3">
                    <div className="glass-card" style={{ opacity: 0.6 }}>
                      <h3>Silver Tier</h3>
                      <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>Requires $500 monthly revenue share. 24h payout cycles.</p>
                    </div>
                    <div className="glass-card" style={{ opacity: 0.6 }}>
                      <h3>Gold Tier</h3>
                      <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>Requires $2000 monthly revenue share. Priority domain checks.</p>
                    </div>
                    <div className="glass-card" style={{ opacity: 0.6 }}>
                      <h3>VIP Tier</h3>
                      <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>Requires $5000 monthly revenue share. 0% withdrawal commissions.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 9. HELP CENTER TAB */}
              {activeTab === 'help_center' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  <div className="glass-panel" style={{ padding: '30px', textAlign: 'center' }}>
                    <h2 style={{ marginBottom: '10px' }}>Advice and answers from the EarnVictor Team</h2>
                    <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '24px' }}>Search or browse troubleshooting topics below.</p>
                    
                    <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto 30px' }}>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Search for articles..." 
                        style={{ paddingLeft: '40px', fontSize: '14px' }}
                        value={helpSearchQuery}
                        onChange={e => setHelpSearchQuery(e.target.value)}
                      />
                      <Search size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: '#9ca3af' }} />
                    </div>

                    <div className="grid-3" style={{ textAlign: 'left' }}>
                      {[
                        { title: 'General Support', count: '14 articles' },
                        { title: 'Ad Formats Setup', count: '6 articles' },
                        { title: 'Account Settings', count: '4 articles' },
                        { title: 'Payments & Finances', count: '12 articles' },
                        { title: 'WordPress Plugin', count: '6 articles' },
                        { title: 'Troubleshooting FAQ', count: '9 articles' }
                      ].map((cat, idx) => (
                        <div key={idx} className="glass-card" style={{ cursor: 'pointer' }}>
                          <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '5px' }}>{cat.title}</h4>
                          <span style={{ fontSize: '12px', color: '#9ca3af' }}>{cat.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 9b. PREMIUM PLANS TAB (Ads Free & Weekly Referrals) */}
              {activeTab === 'premium' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  
                  {/* Explanatory banner */}
                  <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), transparent)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <Award size={36} color="#10b981" />
                      <div>
                        <h2 style={{ fontSize: '22px', color: '#fff', marginBottom: '4px' }}>EarnVictor Publisher Premium Upgrades</h2>
                        <p style={{ color: '#9ca3af', fontSize: '13px' }}>Unlock higher conversion rates, zero platform ads, and maximum referral payouts.</p>
                      </div>
                    </div>
                  </div>

                  {/* Pricing grid */}
                  <div className="grid-2">
                    {/* Plan 1: Ads Free Pass */}
                    <div className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div>
                        <span className="badge badge-verified" style={{ fontSize: '10px' }}>MOST POPULAR</span>
                        <h3 style={{ fontSize: '20px', color: '#fff', marginTop: '10px' }}>20 Days Ads-Free Pass</h3>
                        <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: '5px' }}>Monetize traffic without seeing any admin ads on your publisher control panel.</p>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ fontSize: '32px', fontWeight: 800, color: '#fff' }}>₹149</span>
                        <span style={{ color: '#9ca3af', fontSize: '13px' }}>/ 20 days</span>
                      </div>

                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }} />

                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#d1d5db' }}>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CheckCircle size={14} color="#10b981" /> 100% Ads-Free Publisher Interface
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CheckCircle size={14} color="#10b981" /> Unlimited Link Traffic routing
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CheckCircle size={14} color="#10b981" /> Custom Direct SmartLink generation
                        </li>
                      </ul>

                      <button 
                        className="btn btn-emerald" 
                        style={{ width: '100%', marginTop: 'auto', padding: '12px' }}
                        onClick={() => {
                          setSelectedSubPlan({ name: '20 Days Ads-Free Pass', price: 149.00, duration: 20 });
                          setShowSubModal(true);
                        }}
                      >
                        Subscribe for ₹149
                      </button>
                    </div>

                    {/* Plan 2: Referrals Booster */}
                    <div className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div>
                        <span className="badge badge-pending" style={{ fontSize: '10px', color: '#a78bfa', borderColor: '#a78bfa' }}>GROWTH BOOST</span>
                        <h3 style={{ fontSize: '20px', color: '#fff', marginTop: '10px' }}>Weekly Referrals Booster</h3>
                        <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: '5px' }}>Triple your lifetime referral commission payouts from 5% to 15%.</p>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ fontSize: '32px', fontWeight: 800, color: '#fff' }}>₹49</span>
                        <span style={{ color: '#9ca3af', fontSize: '13px' }}>/ 1 week</span>
                      </div>

                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }} />

                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#d1d5db' }}>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CheckCircle size={14} color="#10b981" /> 15% Lifetime Referral cut (instead of 5%)
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CheckCircle size={14} color="#10b981" /> VIP Verification Support
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CheckCircle size={14} color="#10b981" /> Dedicated Admin Manager Channel
                        </li>
                      </ul>

                      <button 
                        className="btn btn-primary" 
                        style={{ width: '100%', marginTop: 'auto', padding: '12px' }}
                        onClick={() => {
                          setSelectedSubPlan({ name: 'Weekly Referrals Booster', price: 49.00, duration: 7 });
                          setShowSubModal(true);
                        }}
                      >
                        Subscribe for ₹49
                      </button>
                    </div>
                  </div>

                  {/* Active Subscriptions List */}
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ marginBottom: '15px' }}>Your Subscription History</h3>
                    {publisherSubscriptions.length === 0 ? (
                      <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center' }}>No subscription history recorded yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {publisherSubscriptions.map(sub => (
                          <div key={sub.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
                            <div>
                              <h4 style={{ fontSize: '14px', color: '#fff' }}>{sub.plan_name}</h4>
                              <span style={{ fontSize: '11px', color: '#9ca3af' }}>UTR Code: {sub.utr_id} | Paid: ₹{parseFloat(sub.price).toFixed(2)} | Date: {new Date(sub.created_at).toLocaleDateString()}</span>
                            </div>
                            <span className={`badge badge-${sub.status}`}>{sub.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* 10. DONATE TAB */}
              {activeTab === 'donate' && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div className="glass-panel" style={{ padding: '40px', maxWidth: '550px', width: '100%', textAlign: 'center', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                    <div style={{ background: 'rgba(251, 191, 36, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                      <DollarSign size={32} color="#fbbf24" />
                    </div>
                    <h2 style={{ fontSize: '28px', marginBottom: '12px' }}>Support EarnVictor Platform</h2>
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
                  </div>
                </div>
              )}

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
                            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => {
                              const reason = prompt("Enter rejection reason:");
                              if (reason) handleRejectProperty(prop.id, reason);
                            }}>
                              Reject
                            </button>
                            <button className="btn btn-emerald" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleApproveProperty(prop.id)}>
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
                            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleRejectWithdrawal(wd)}>
                              Reject & Refund
                            </button>
                            <button className="btn btn-emerald" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleApproveWithdrawal(wd.id)}>
                              Confirm Payment
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2b. Subscriptions Approval Manager */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ marginBottom: '20px' }}>Subscriptions Verification Queue</h3>
                  {allSubscriptions.filter(s => s.status === 'pending').length === 0 ? (
                    <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center' }}>No pending subscription updates.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {allSubscriptions.filter(s => s.status === 'pending').map(sub => (
                        <div key={sub.id} className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                            <div>
                              <h4 style={{ fontSize: '16px', color: 'var(--accent-emerald)' }}>
                                {sub.plan_name} (₹{parseFloat(sub.price).toFixed(2)})
                              </h4>
                              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Publisher: {sub.profiles?.email}</div>
                              <div style={{ fontSize: '12px', background: '#0a0814', padding: '10px', borderRadius: '6px', marginTop: '8px', color: '#fff', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <b>UTR ID:</b> {sub.utr_id}
                              </div>
                            </div>
                            <span className="badge badge-pending">{sub.status}</span>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleRejectSubscription(sub.id)}>
                              Reject
                            </button>
                            <button className="btn btn-emerald" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleApproveSubscription(sub.id)}>
                              Approve & Activate
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
                    <input type="number" step="0.01" className="form-control" value={usdToInrRate} onChange={e => setUsdToInrRate(parseFloat(e.target.value))} required />
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>Used to calculate local currency payouts dynamically</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Platform Commission Rate</label>
                    <input type="number" step="0.01" min="0.0" max="1.0" className="form-control" value={ownerCommissionRate} onChange={e => setOwnerCommissionRate(parseFloat(e.target.value))} required />
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>e.g. 0.20 = 20% commission routed to owner account</span>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Save Settings
                  </button>
                </form>
              </div>

            </div>

            {/* 3. Publisher Balance Customizer (Free Customize & Edit) */}
            <div className="glass-panel" style={{ padding: '24px', marginTop: '30px' }}>
              <h3 style={{ marginBottom: '20px' }}>Publisher Accounts Balance Manager (Customise & Free Config)</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>
                      <th style={{ padding: '12px' }}>Publisher Email</th>
                      <th style={{ padding: '12px' }}>Role</th>
                      <th style={{ padding: '12px' }}>USD Balance ($)</th>
                      <th style={{ padding: '12px' }}>INR Balance (₹)</th>
                      <th style={{ padding: '12px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allProfiles.map(prof => (
                      <tr key={prof.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'middle' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{prof.email}</td>
                        <td style={{ padding: '12px' }}>
                          <span className={`badge ${prof.role === 'owner' ? 'badge-verified' : 'badge-pending'}`} style={{ textTransform: 'uppercase' }}>
                            {prof.role}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <input 
                            type="number" 
                            step="0.0001" 
                            className="form-control" 
                            style={{ width: '120px', padding: '6px 10px', fontSize: '13px' }}
                            defaultValue={parseFloat(prof.balance_usd).toFixed(4)} 
                            onChange={e => setEditUsdBalances({ ...editUsdBalances, [prof.id]: e.target.value })}
                          />
                        </td>
                        <td style={{ padding: '12px' }}>
                          <input 
                            type="number" 
                            step="0.01" 
                            className="form-control" 
                            style={{ width: '120px', padding: '6px 10px', fontSize: '13px' }}
                            defaultValue={parseFloat(prof.balance_inr).toFixed(2)} 
                            onChange={e => setEditInrBalances({ ...editInrBalances, [prof.id]: e.target.value })}
                          />
                        </td>
                        <td style={{ padding: '12px' }}>
                          <button 
                            className="btn btn-emerald" 
                            style={{ padding: '6px 14px', fontSize: '12px' }}
                            onClick={() => handleUpdatePublisherBalance(prof.id)}
                          >
                            Update Payout Balance
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Detailed Traffic Analysis Breakdown */}
            <div className="glass-panel" style={{ padding: '24px', marginTop: '30px' }}>
              <h3 style={{ marginBottom: '20px' }}>Global Traffic Analysis & Property Performance</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>
                      <th style={{ padding: '12px' }}>Registered Domain URL</th>
                      <th style={{ padding: '12px' }}>Property Type</th>
                      <th style={{ padding: '12px' }}>Status</th>
                      <th style={{ padding: '12px' }}>Publisher Owner</th>
                      <th style={{ padding: '12px' }}>Monetization Health</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allProperties.map(prop => (
                      <tr key={prop.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{prop.url}</td>
                        <td style={{ padding: '12px', textTransform: 'uppercase' }}>{prop.type}</td>
                        <td style={{ padding: '12px' }}>
                          <span className={`badge badge-${prop.status}`}>
                            {prop.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: '#9ca3af' }}>{prop.profiles?.email || 'Unknown'}</td>
                        <td style={{ padding: '12px' }}>
                          {prop.status === 'verified' ? (
                            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle size={14} /> Active & High Yielding
                            </span>
                          ) : (
                            <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <XCircle size={14} /> Restricted / Blocked
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

      </main>

      {/* CHECKOUT MODAL WITH QR CODE */}
      {showSubModal && selectedSubPlan && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}>
          <div className="glass-panel" style={{ padding: '30px', maxWidth: '480px', width: '100%', textAlign: 'center', position: 'relative', border: '1px solid rgba(16, 185, 129, 0.3)', backdropFilter: 'blur(10px)' }}>
            
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ position: 'absolute', top: '15px', right: '15px', padding: '6px 12px', fontSize: '12px' }}
              onClick={() => setShowSubModal(false)}
            >
              Close
            </button>

            <h3 style={{ fontSize: '22px', marginBottom: '8px', color: '#fff' }}>Scan & Pay via UPI</h3>
            <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '15px' }}>
              Subscribe to <strong>{selectedSubPlan.name}</strong> for <strong>₹{selectedSubPlan.price}</strong>
            </p>

            {/* QR Code Img */}
            <img 
              src="/upi_qr.png" 
              alt="UPI QR Code" 
              style={{ width: '220px', height: '220px', borderRadius: '12px', margin: '0 auto 15px', display: 'block', border: '4px solid #fff' }} 
            />

            <div style={{ fontSize: '13px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '20px', textAlign: 'left' }}>
              <div style={{ marginBottom: '4px' }}><strong>UPI ID:</strong> arasu9629hf@okhdfcbank</div>
              <div><strong>Amount:</strong> ₹{selectedSubPlan.price} INR</div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!subUtrId || subUtrId.length < 8) {
                alert("Please enter a valid 12-digit UTR Transaction ID.");
                return;
              }
              try {
                const { error } = await supabase.table('subscriptions').insert({
                  publisher_id: user.id,
                  plan_name: selectedSubPlan.name,
                  price: selectedSubPlan.price,
                  duration_days: selectedSubPlan.duration,
                  utr_id: subUtrId,
                  status: 'pending'
                });
                if (error) throw error;
                alert("Subscription submitted successfully! Verification pending.");
                setSubUtrId('');
                setShowSubModal(false);
                // Reload publisher data to update subs table
                fetchPublisherData();
              } catch (err) {
                alert("Failed to submit subscription: " + err.message);
              }
            }}>
              <div className="form-group" style={{ textAlign: 'left' }}>
                <label className="form-label">Enter 12-digit UTR / UPI Transaction ID</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. 627192039281" 
                  value={subUtrId} 
                  onChange={e => setSubUtrId(e.target.value)} 
                  required 
                />
              </div>

              <button type="submit" className="btn btn-emerald" style={{ width: '100%', marginTop: '10px' }}>
                Confirm Payment & Submit UTR
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ background: '#07050d', borderTop: '1px solid var(--border-color)', padding: '40px 20px', textAlign: 'center', fontSize: '13px', color: '#9ca3af', marginTop: '60px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div>© Copyright EarnVictor 2026 - 2100. All Rights Reserved.</div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Certified Safe & Verified Ad Network</div>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setCurrentPage('legal-dmca')}>DMCA Certificate</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
