'use client';

import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Settings as SettingsIcon, Webhook, Copy, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const { user, orgId, role, loading } = useAuth();
  const [copied, setCopied] = useState(false);
  
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const webhookUrl = orgId && origin ? `${origin}/api/webhooks/meta-leads?orgId=${orgId}` : '';

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
