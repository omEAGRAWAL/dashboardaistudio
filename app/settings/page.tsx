'use client';

import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Settings as SettingsIcon, Webhook, Copy, CheckCircle2, MessageSquare, Phone, AlertCircle, Loader2, ExternalLink, Globe, Link2, RefreshCw, Trash2, CreditCard, Eye, EyeOff, Gift } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export default function SettingsPage() {
  const { user, orgId, role, loading } = useAuth();
  const [copied, setCopied] = useState(false);
  const [waNumber, setWaNumber] = useState<string | null>(null);
  const [waSource, setWaSource] = useState<string | null>(null);

  // Domain state
  const [domainTab, setDomainTab] = useState<'subdomain' | 'custom'>('subdomain');
  const [subdomainSlug, setSubdomainSlug] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [savedSubdomain, setSavedSubdomain] = useState<string | null>(null);
  const [savedCustomDomain, setSavedCustomDomain] = useState<string | null>(null);
  const [domainLoading, setDomainLoading] = useState(false);
  const [domainError, setDomainError] = useState('');
  const [domainSuccess, setDomainSuccess] = useState('');
  const [domainVerification, setDomainVerification] = useState<{
    verified: boolean;
    configuredBy: string | null;
    verification: { type: string; domain: string; value: string; reason: string }[];
  } | null>(null);
  const [checkingVerification, setCheckingVerification] = useState(false);

  const platformHost = process.env.NEXT_PUBLIC_PLATFORM_HOST ?? 'yourapp.vercel.app';

  // Self-serve WhatsApp connection form
  const [selfPhoneNumber, setSelfPhoneNumber] = useState('');
  const [selfAccountSid, setSelfAccountSid] = useState('');
  const [selfAuthToken, setSelfAuthToken] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [connectSuccess, setConnectSuccess] = useState('');

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const webhookUrl = orgId && origin ? `${origin}/api/webhooks/meta-leads?orgId=${orgId}` : '';

  // Razorpay payment settings state
  const [rzpKeyId, setRzpKeyId] = useState('');
  const [rzpKeySecret, setRzpKeySecret] = useState('');
  const [rzpWebhookSecret, setRzpWebhookSecret] = useState('');
  const [rzpAdvancePct, setRzpAdvancePct] = useState(30);
  const [rzpAdvanceType, setRzpAdvanceType] = useState<'percentage' | 'fixed'>('percentage');
  const [rzpAdvanceFixed, setRzpAdvanceFixed] = useState(0);
  const [rzpSaving, setRzpSaving] = useState(false);
  const [rzpError, setRzpError] = useState('');
  const [rzpSuccess, setRzpSuccess] = useState('');
  const [rzpConfigured, setRzpConfigured] = useState(false);
  const [rzpHasWebhookSecret, setRzpHasWebhookSecret] = useState(false);
  const [showRzpSecret, setShowRzpSecret] = useState(false);
  const [showRzpWebhookSecret, setShowRzpWebhookSecret] = useState(false);
  const [rzpCopied, setRzpCopied] = useState(false);

  // Load Razorpay config (non-sensitive fields only)
  useEffect(() => {
    if (!orgId || !user) return;
    const loadRzpConfig = async () => {
      try {
        const auth = getAuth();
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const res = await fetch(`/api/razorpay/save-config?orgId=${orgId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.configured) {
            setRzpConfigured(true);
            setRzpKeyId(data.keyId || '');
            setRzpAdvancePct(data.advancePercentage ?? 30);
            setRzpAdvanceType(data.advanceType ?? 'percentage');
            setRzpAdvanceFixed(data.advanceFixedAmount ?? 0);
            setRzpHasWebhookSecret(data.hasWebhookSecret || false);
          }
        }
      } catch (e) { /* ignore */ }
    };
    loadRzpConfig();
  }, [orgId, user]);

  useEffect(() => {
    if (!orgId) return;
    getDoc(doc(db, 'whatsapp_numbers', orgId)).then((snap) => {
      if (snap.exists()) {
        setWaNumber(snap.data().phoneNumber);
        setWaSource(snap.data().source || 'om');
      }
    });
    // Load existing domain config
    getDoc(doc(db, 'organizations', orgId)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.subdomain) setSavedSubdomain(data.subdomain);
        if (data.customDomain) setSavedCustomDomain(data.customDomain);
      }
    });
  }, [orgId]);

  const handleSaveDomain = async (type: 'subdomain' | 'custom') => {
    if (!orgId) return;
    setDomainLoading(true);
    setDomainError('');
    setDomainSuccess('');
    setDomainVerification(null);

    const rawValue = type === 'subdomain' ? subdomainSlug.trim().toLowerCase() : customDomain.trim().toLowerCase();
    if (!rawValue) { setDomainLoading(false); return; }

    const hostname = type === 'subdomain' ? `${rawValue}.${platformHost}` : rawValue;

    try {
      const res = await fetch('/api/admin/add-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, hostname, type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (type === 'subdomain') setSavedSubdomain(hostname);
      else setSavedCustomDomain(hostname);
      setDomainSuccess(type === 'subdomain' ? 'Subdomain saved!' : 'Custom domain added! Add the DNS record below.');
    } catch (e: any) {
      setDomainError(e.message);
    } finally {
      setDomainLoading(false);
    }
  };

  const handleRemoveDomain = async (type: 'subdomain' | 'custom') => {
    if (!orgId) return;
    const hostname = type === 'subdomain' ? savedSubdomain : savedCustomDomain;
    if (!hostname) return;
    setDomainLoading(true);
    setDomainError('');
    setDomainSuccess('');
    try {
      const res = await fetch('/api/admin/add-domain', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, hostname, type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (type === 'subdomain') { setSavedSubdomain(null); setSubdomainSlug(''); }
      else { setSavedCustomDomain(null); setCustomDomain(''); setDomainVerification(null); }
    } catch (e: any) {
      setDomainError(e.message);
    } finally {
      setDomainLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!savedCustomDomain) return;
    setCheckingVerification(true);
    try {
      const res = await fetch(`/api/admin/check-domain?domain=${encodeURIComponent(savedCustomDomain)}`);
      const data = await res.json();
      setDomainVerification(data);
    } catch {
      setDomainError('Failed to check verification status');
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleConnectOwnNumber = async () => {
    if (!orgId || !selfPhoneNumber || !selfAccountSid || !selfAuthToken) return;
    setConnecting(true);
    setConnectError('');
    setConnectSuccess('');
    try {
      const res = await fetch('/api/whatsapp/connect-own-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          phoneNumber: selfPhoneNumber,
          ownAccountSid: selfAccountSid,
          ownAuthToken: selfAuthToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setWaNumber(data.phoneNumber);
      setWaSource('agency');
      setConnectSuccess('WhatsApp number connected successfully!');
      setSelfPhoneNumber(''); setSelfAccountSid(''); setSelfAuthToken('');
    } catch (e: any) {
      setConnectError(e.message);
    } finally {
      setConnecting(false);
    }
  };

  const copyToClipboard = () => {
    if (!webhookUrl) return;
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveRazorpay = async () => {
    if (!orgId || !user) return;
    if (!rzpKeyId.trim() || !rzpKeySecret.trim()) {
      setRzpError('Key ID and Key Secret are required');
      return;
    }
    setRzpSaving(true);
    setRzpError('');
    setRzpSuccess('');
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');
      const res = await fetch('/api/razorpay/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          orgId,
          keyId: rzpKeyId.trim(),
          keySecret: rzpKeySecret.trim(),
          webhookSecret: rzpWebhookSecret.trim(),
          advanceType: rzpAdvanceType,
          advancePercentage: rzpAdvancePct,
          advanceFixedAmount: rzpAdvanceFixed,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRzpConfigured(true);
      setRzpHasWebhookSecret(!!rzpWebhookSecret.trim());
      setRzpKeySecret(''); // clear secret from UI after save
      setRzpWebhookSecret('');
      setRzpSuccess('Razorpay settings saved successfully!');
    } catch (e: any) {
      setRzpError(e.message);
    } finally {
      setRzpSaving(false);
    }
  };

  const rzpWebhookUrl = orgId && origin ? `${origin}/api/webhooks/razorpay?orgId=${orgId}` : '';
  const copyRzpWebhookUrl = () => {
    if (!rzpWebhookUrl) return;
    navigator.clipboard.writeText(rzpWebhookUrl);
    setRzpCopied(true);
    setTimeout(() => setRzpCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <SettingsIcon className="w-6 h-6 text-gray-400" />
                Settings
              </h1>
              <p className="text-gray-500 mt-1">Manage your agency settings and integrations.</p>
            </div>

            <div className="space-y-6">
              
              {/* Webhook Integration Section */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                  <Webhook className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Lead Integrations (Zapier / Make / Google Sheets)</h2>
                </div>
                
                <div className="p-6">
                  <p className="text-sm text-gray-600 mb-4">
                    Use this Webhook URL to automatically send leads from Meta Ads, Google Ads, Google Sheets, or your website directly into Yatrik.
                  </p>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Unique Webhook URL</label>
                    <div className="flex items-center gap-2">
                      <code suppressHydrationWarning className="flex-1 bg-white border border-gray-200 px-3 py-2 rounded text-sm text-gray-800 overflow-x-auto whitespace-nowrap">
                        {webhookUrl || 'Loading...'}
                      </code>
                      <button 
                        onClick={copyToClipboard}
                        className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded font-medium transition-colors border border-indigo-200"
                      >
                        {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy URL'}
                      </button>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-6">
                    <p className="font-medium text-gray-900 mb-2">Required JSON Payload:</p>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
{`{
  "name": "John Doe",
  "phone": "+1234567890",
  "source": "Google Sheet 1",
  "pax": 2,
  "travelDate": "Next month"
}`}
                    </pre>
                    <p className="mt-3 text-xs text-gray-500">
                      Note: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700">name</code> and <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700">phone</code> are required. All other fields are optional.
                    </p>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-md font-semibold text-gray-900 mb-3">How to connect multiple Google Sheets</h3>
                    <div className="space-y-4 text-sm text-gray-600">
                      <p>You can aggregate leads from multiple Google Sheets into this single dashboard. There are two ways to do this:</p>
                      
                      <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-4">
                        <h4 className="font-medium text-indigo-900 mb-1">Option 1: Using Zapier or Make.com (Recommended)</h4>
                        <ol className="list-decimal pl-5 space-y-1 text-indigo-800/80">
                          <li>Create a new Zap/Scenario.</li>
                          <li>Set the Trigger to <strong>Google Sheets: New Spreadsheet Row</strong>.</li>
                          <li>Set the Action to <strong>Webhooks: POST</strong>.</li>
                          <li>Paste your Unique Webhook URL above into the URL field.</li>
                          <li>Map the columns from your sheet to the JSON payload (name, phone, source). Set the &quot;source&quot; to the name of the specific sheet (e.g., &quot;Facebook Ads Sheet&quot;).</li>
                          <li>Repeat this process for every Google Sheet you want to connect.</li>
                        </ol>
                      </div>

                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-1">Option 2: Sample Google Apps Script (Free)</h4>
                        <p className="mb-2">In your Google Sheet, go to <strong>Extensions &gt; Apps Script</strong> and paste this complete sample script. It will automatically send new rows to your CRM.</p>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs mb-4">
{`function sendLeadToCRM(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // Get the row that was just added or edited. 
  // If no specific range is found, it defaults to the last row.
  var row = (e && e.range) ? e.range.getRow() : sheet.getLastRow();
  
  // Skip the header row
  if (row === 1) return;
  
  // Assuming Name is in Column A (1), Phone is in Column B (2)
  // Adjust these numbers if your columns are different!
  var name = sheet.getRange(row, 1).getValue();
  var phone = sheet.getRange(row, 2).getValue();
  
  // Only send if both name and phone are present
  if (!name || !phone) return;

  var payload = {
    "name": name,
    "phone": phone,
    "source": sheet.getName() // Automatically uses the sheet tab name as the source
  };

  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload)
  };

  // Send the data to your CRM Webhook
  UrlFetchApp.fetch("${webhookUrl || 'YOUR_WEBHOOK_URL'}", options);
}`}
                        </pre>
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-yellow-800">
                          <strong className="block mb-1">Important: You must create a Trigger for this to work!</strong>
                          <ol className="list-decimal pl-4 space-y-1">
                            <li>Save the script (Ctrl+S / Cmd+S).</li>
                            <li>Click the <strong>Triggers</strong> icon (looks like an alarm clock) on the left sidebar.</li>
                            <li>Click <strong>Add Trigger</strong> (bottom right).</li>
                            <li>Choose which function to run: <strong>sendLeadToCRM</strong></li>
                            <li>Select event source: <strong>From spreadsheet</strong></li>
                            <li>Select event type: <strong>On change</strong> (Best for new rows added by forms/integrations)</li>
                            <li>Click Save and authorize the script with your Google Account.</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* WhatsApp Number Section */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-semibold text-gray-900">WhatsApp Integration</h2>
                </div>
                <div className="p-6 space-y-5">
                  {/* Current status */}
                  {waNumber ? (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <Phone className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{waNumber}</p>
                        <p className="text-xs text-green-600">
                          {waSource === 'agency' ? 'Connected via your own Twilio account' : 'Connected via admin-assigned number'}
                          {' — chatbot and inbox are active'}
                        </p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full shrink-0">Connected</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                        <Phone className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">No WhatsApp number assigned</p>
                        <p className="text-xs text-gray-400">Contact your admin or connect your own number below.</p>
                      </div>
                    </div>
                  )}

                  {/* Self-serve: connect own Twilio number */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800">Connect Your Own WhatsApp Number</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Have your own Twilio account with a WhatsApp-enabled number?{' '}
                        <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline inline-flex items-center gap-0.5">
                          Twilio Console <ExternalLink className="w-3 h-3" />
                        </a>
                      </p>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Your WhatsApp Phone Number</label>
                        <input type="text" placeholder="+919xxxxxxxxx" value={selfPhoneNumber}
                          onChange={(e) => setSelfPhoneNumber(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Twilio Account SID</label>
                          <input type="text" placeholder="ACxxxxxxxx" value={selfAccountSid}
                            onChange={(e) => setSelfAccountSid(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Auth Token</label>
                          <input type="password" placeholder="••••••••" value={selfAuthToken}
                            onChange={(e) => setSelfAuthToken(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">Your credentials are stored securely server-side and never exposed to clients.</p>

                      {connectError && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                          <AlertCircle className="w-4 h-4 shrink-0" /> {connectError}
                        </div>
                      )}
                      {connectSuccess && (
                        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0" /> {connectSuccess}
                        </div>
                      )}

                      <button
                        onClick={handleConnectOwnNumber}
                        disabled={connecting || !selfPhoneNumber || !selfAccountSid || !selfAuthToken}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                      >
                        {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                        {connecting ? 'Connecting…' : 'Connect Number'}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400">
                    Twilio webhook URL (set this in your Twilio console):{' '}
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                      {origin}/api/webhooks/whatsapp
                    </code>
                  </p>
                </div>
              </div>

              {/* Custom Domain Section */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Custom Domain</h2>
                </div>
                <div className="p-6 space-y-5">
                  <p className="text-sm text-gray-600">
                    Give your agency a branded web presence. Choose a free subdomain or connect your own domain.
                  </p>

                  {/* Tabs */}
                  <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
                    {(['subdomain', 'custom'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => { setDomainTab(t); setDomainError(''); setDomainSuccess(''); }}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          domainTab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {t === 'subdomain' ? 'Free Subdomain' : 'Custom Domain'}
                      </button>
                    ))}
                  </div>

                  {domainTab === 'subdomain' && (
                    <div className="space-y-4">
                      {savedSubdomain ? (
                        <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                            <Link2 className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{savedSubdomain}</p>
                            <p className="text-xs text-indigo-600">Active — your public landing page</p>
                          </div>
                          <a
                            href={`https://${savedSubdomain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 shrink-0"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleRemoveDomain('subdomain')}
                            disabled={domainLoading}
                            className="text-red-400 hover:text-red-600 shrink-0 disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 items-center">
                          <div className="flex flex-1 border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                            <input
                              type="text"
                              placeholder="yourslug"
                              value={subdomainSlug}
                              onChange={(e) => setSubdomainSlug(e.target.value.replace(/[^a-z0-9-]/g, ''))}
                              className="flex-1 px-3 py-2 text-sm focus:outline-none"
                            />
                            <span className="bg-gray-50 border-l border-gray-300 px-3 py-2 text-sm text-gray-500 whitespace-nowrap">
                              .{platformHost}
                            </span>
                          </div>
                          <button
                            onClick={() => handleSaveDomain('subdomain')}
                            disabled={domainLoading || !subdomainSlug}
                            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                          >
                            {domainLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-gray-400">
                        Requires a wildcard DNS record <code className="bg-gray-100 px-1.5 py-0.5 rounded">*.{platformHost} CNAME cname.vercel-dns.com</code> (one-time setup by admin).
                      </p>
                    </div>
                  )}

                  {domainTab === 'custom' && (
                    <div className="space-y-4">
                      {savedCustomDomain ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                              <Globe className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{savedCustomDomain}</p>
                              <p className="text-xs text-gray-500">Added to Vercel — add the DNS record below</p>
                            </div>
                            <button
                              onClick={handleCheckVerification}
                              disabled={checkingVerification}
                              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium shrink-0"
                            >
                              <RefreshCw className={`w-3 h-3 ${checkingVerification ? 'animate-spin' : ''}`} />
                              Check
                            </button>
                            <button
                              onClick={() => handleRemoveDomain('custom')}
                              disabled={domainLoading}
                              className="text-red-400 hover:text-red-600 shrink-0 disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {domainVerification && (
                            <div className={`rounded-lg border p-3 text-sm ${
                              domainVerification.verified
                                ? 'bg-green-50 border-green-200 text-green-800'
                                : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                            }`}>
                              {domainVerification.verified ? (
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                                  <span className="font-medium">Domain verified and active!</span>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span className="font-medium">DNS not verified yet</span>
                                  </div>
                                  {domainVerification.verification?.map((v, i) => (
                                    <div key={i} className="bg-white/60 rounded p-2 text-xs font-mono space-y-1">
                                      <p><span className="font-semibold">Type:</span> {v.type}</p>
                                      <p><span className="font-semibold">Name:</span> {v.domain}</p>
                                      <p><span className="font-semibold">Value:</span> {v.value}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* DNS instructions */}
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
                            <p className="font-semibold text-gray-800 mb-2">DNS Setup (add to your domain registrar)</p>
                            <div className="space-y-1 font-mono text-xs text-gray-700">
                              <div className="grid grid-cols-3 gap-2 bg-white border border-gray-200 rounded p-2">
                                <span className="text-gray-500">Type</span>
                                <span className="text-gray-500">Name</span>
                                <span className="text-gray-500">Value</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 bg-white border border-gray-200 rounded p-2">
                                <span>CNAME</span>
                                <span>{savedCustomDomain.startsWith('www.') ? 'www' : '@'}</span>
                                <span>cname.vercel-dns.com</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">DNS changes can take up to 48 hours to propagate.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="www.youragency.com"
                              value={customDomain}
                              onChange={(e) => setCustomDomain(e.target.value.toLowerCase().trim())}
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                              onClick={() => handleSaveDomain('custom')}
                              disabled={domainLoading || !customDomain}
                              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                            >
                              {domainLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Domain'}
                            </button>
                          </div>
                          <p className="text-xs text-gray-400">
                            We&#39;ll add this to Vercel and show you the CNAME record to add to your DNS.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {domainError && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <AlertCircle className="w-4 h-4 shrink-0" /> {domainError}
                    </div>
                  )}
                  {domainSuccess && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" /> {domainSuccess}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Razorpay Payment Settings ── */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Razorpay Payment Settings</h2>
                  {rzpConfigured && (
                    <span className="ml-auto text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full">Connected</span>
                  )}
                </div>
                <div className="p-6 space-y-5">
                  <p className="text-sm text-gray-600">
                    Connect your Razorpay account to accept advance and full payments from customers on your landing page and campaign pages. Agents can also generate payment links.
                  </p>

                  {/* Key ID */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      Razorpay Key ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="rzp_live_xxxxxxxxxxxxxxxx"
                      value={rzpKeyId}
                      onChange={e => setRzpKeyId(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-gray-400">Found in Razorpay Dashboard → Settings → API Keys. Use <code className="bg-gray-100 px-1 rounded">rzp_live_</code> prefix for production.</p>
                  </div>

                  {/* Key Secret */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      Razorpay Key Secret <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showRzpSecret ? 'text' : 'password'}
                        placeholder={rzpConfigured ? '••••••••••••••••••••••• (leave blank to keep existing)' : 'Your Razorpay Key Secret'}
                        value={rzpKeySecret}
                        onChange={e => setRzpKeySecret(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button type="button" onClick={() => setShowRzpSecret(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showRzpSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400">Stored securely server-side. Never exposed to the browser.</p>
                  </div>

                  {/* Advance Payment Type */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Advance Payment Type</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRzpAdvanceType('percentage')}
                        className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${rzpAdvanceType === 'percentage' ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 text-gray-600 hover:border-indigo-400'}`}
                      >
                        % Percentage
                      </button>
                      <button
                        type="button"
                        onClick={() => setRzpAdvanceType('fixed')}
                        className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${rzpAdvanceType === 'fixed' ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 text-gray-600 hover:border-indigo-400'}`}
                      >
                        ₹ Fixed Amount
                      </button>
                    </div>

                    {rzpAdvanceType === 'percentage' ? (
                      <div className="space-y-1.5">
                        <label className="block text-sm text-gray-600">
                          Advance Percentage: <strong>{rzpAdvancePct}%</strong>
                        </label>
                        <input
                          type="range"
                          min={1}
                          max={100}
                          value={rzpAdvancePct}
                          onChange={e => setRzpAdvancePct(Number(e.target.value))}
                          className="w-full accent-indigo-600"
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>1%</span><span>50%</span><span>100%</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="block text-sm text-gray-600">Fixed Advance Amount (₹)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">₹</span>
                          <input
                            type="number"
                            min={1}
                            placeholder="e.g. 5000"
                            value={rzpAdvanceFixed || ''}
                            onChange={e => setRzpAdvanceFixed(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Customers will see an option to pay this advance when booking. Agents can still override the amount manually per booking.
                    </p>
                  </div>

                  {/* Webhook Secret */}
                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    <p className="text-sm font-semibold text-gray-800">Webhook Configuration <span className="text-xs font-normal text-gray-400">(Recommended)</span></p>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">
                        Razorpay Webhook Secret
                        {rzpHasWebhookSecret && <span className="ml-2 text-xs text-green-600 font-medium">✓ Set</span>}
                      </label>
                      <div className="relative">
                        <input
                          type={showRzpWebhookSecret ? 'text' : 'password'}
                          placeholder={rzpHasWebhookSecret ? '••••••••••••••• (leave blank to keep existing)' : 'Webhook secret from Razorpay dashboard'}
                          value={rzpWebhookSecret}
                          onChange={e => setRzpWebhookSecret(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button type="button" onClick={() => setShowRzpWebhookSecret(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showRzpWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Webhook URL */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Your Razorpay Webhook URL</label>
                      <div className="flex items-center gap-2">
                        <code suppressHydrationWarning className="flex-1 bg-gray-50 border border-gray-200 px-3 py-2 rounded text-xs text-gray-800 overflow-x-auto whitespace-nowrap">
                          {rzpWebhookUrl || 'Loading…'}
                        </code>
                        <button onClick={copyRzpWebhookUrl}
                          className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-2 rounded font-medium transition-colors border border-indigo-200 text-xs whitespace-nowrap">
                          {rzpCopied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {rzpCopied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <p className="text-xs text-gray-400">
                        Add this URL in <strong>Razorpay Dashboard → Settings → Webhooks</strong>. Enable events: <code className="bg-gray-100 px-1 rounded">payment.captured</code>, <code className="bg-gray-100 px-1 rounded">payment.failed</code>, <code className="bg-gray-100 px-1 rounded">order.paid</code>.
                      </p>
                    </div>
                  </div>

                  {rzpError && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <AlertCircle className="w-4 h-4 shrink-0" /> {rzpError}
                    </div>
                  )}
                  {rzpSuccess && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" /> {rzpSuccess}
                    </div>
                  )}

                  <button
                    onClick={handleSaveRazorpay}
                    disabled={rzpSaving || !rzpKeyId.trim()}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
                  >
                    {rzpSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                    {rzpSaving ? 'Saving…' : rzpConfigured ? 'Update Payment Settings' : 'Save Payment Settings'}
                  </button>
                </div>
              </div>

              {/* Refer & Earn */}
              <ReferEarnSection orgId={orgId} />

              {/* Organization Info */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900">Organization Info</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Organization ID</label>
                      <div className="text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded border border-gray-200">
                        {orgId || 'Not assigned'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Your Role</label>
                      <div className="text-sm text-gray-900 capitalize bg-gray-50 px-3 py-2 rounded border border-gray-200">
                        {role === 'org_admin' ? 'Admin' : role}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Refer & Earn Section ─────────────────────────────────────────────────────

function ReferEarnSection({ orgId }: { orgId: string | null }) {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [stats, setStats] = useState<{ total: number; converted: number; pending: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    const uid = getAuth().currentUser?.uid;
    if (!uid) { setLoading(false); return; }
    fetch(`/api/admin/manage-referral-code?orgId=${orgId}`, {
      headers: { 'x-uid': uid },
    }).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setReferralCode(data.code);
        setStats(data.stats);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [orgId]);

  const shareLink = typeof window !== 'undefined' && referralCode
    ? `${window.location.origin}/?ref=${referralCode}`
    : '';

  const handleCopy = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
        <Gift className="w-5 h-5 text-indigo-500" />
        <h2 className="text-lg font-semibold text-gray-900">Refer &amp; Earn</h2>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : !referralCode ? (
          <div className="text-sm text-gray-500">
            Your referral code hasn't been set up yet. Contact support to get your unique referral link and start earning rewards.
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-gray-600">
              Share your referral link with other travel agencies. When they sign up, you both earn a free month when they become a paid subscriber.
            </p>

            {/* Code + share link */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
                <span className="text-xs text-indigo-500 font-medium">Code</span>
                <span className="font-mono font-bold text-indigo-700 text-lg tracking-widest">{referralCode}</span>
              </div>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 border rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                  copied ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Share Link'}
              </button>
            </div>

            {shareLink && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono text-gray-500 truncate">
                {shareLink}
              </div>
            )}

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { label: 'Total Referred', value: stats.total },
                  { label: 'Converted',      value: stats.converted },
                  { label: 'Pending',        value: stats.pending },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-xl border border-gray-100 p-3 text-center">
                    <div className="text-xl font-bold text-gray-900">{value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
