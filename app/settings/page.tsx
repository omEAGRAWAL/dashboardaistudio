'use client';

import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Settings as SettingsIcon, Webhook, Copy, CheckCircle2, MessageSquare, Phone, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function SettingsPage() {
  const { user, orgId, role, loading } = useAuth();
  const [copied, setCopied] = useState(false);
  const [waNumber, setWaNumber] = useState<string | null>(null);
  const [waSource, setWaSource] = useState<string | null>(null);

  // Self-serve WhatsApp connection form
  const [selfPhoneNumber, setSelfPhoneNumber] = useState('');
  const [selfAccountSid, setSelfAccountSid] = useState('');
  const [selfAuthToken, setSelfAuthToken] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [connectSuccess, setConnectSuccess] = useState('');

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const webhookUrl = orgId && origin ? `${origin}/api/webhooks/meta-leads?orgId=${orgId}` : '';

  useEffect(() => {
    if (!orgId) return;
    getDoc(doc(db, 'whatsapp_numbers', orgId)).then((snap) => {
      if (snap.exists()) {
        setWaNumber(snap.data().phoneNumber);
        setWaSource(snap.data().source || 'om');
      }
    });
  }, [orgId]);

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
