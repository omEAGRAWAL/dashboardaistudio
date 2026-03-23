'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthProvider';
import {
  X, Plus, Trash2, Edit3, Send, MessageCircle,
  ChevronRight, Save, ArrowLeft, Type
} from 'lucide-react';

interface Template { id: string; name: string; message: string; }
interface Lead {
  id: string; name: string; phone: string;
  destination?: string; pax?: number; travelDate?: string;
}

// Parse WhatsApp markdown (*bold*, _italic_, ~strike~, ```mono```) → React nodes
function parseWA(text: string): ReactNode {
  const lines = text.split('\n');
  return lines.map((line, li) => (
    <span key={li}>
      {parseInline(line)}
      {li < lines.length - 1 && <br />}
    </span>
  ));
}

function parseInline(text: string): ReactNode[] {
  const regex = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|```[^`]+```)/g;
  const nodes: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const raw = m[0];
    if (raw.startsWith('*'))   nodes.push(<strong key={m.index}>{raw.slice(1, -1)}</strong>);
    else if (raw.startsWith('_'))  nodes.push(<em key={m.index}>{raw.slice(1, -1)}</em>);
    else if (raw.startsWith('~'))  nodes.push(<del key={m.index}>{raw.slice(1, -1)}</del>);
    else if (raw.startsWith('```')) nodes.push(<code key={m.index} className="font-mono bg-[#d4edd1] text-[#1a3c1a] px-0.5 rounded text-[12px]">{raw.slice(3, -3)}</code>);
    last = m.index + raw.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function WhatsAppModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { orgId } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [view, setView] = useState<'list' | 'compose'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!orgId) return;
    const q = query(collection(db, 'whatsapp_templates'), where('orgId', '==', orgId));
    return onSnapshot(q, snap =>
      setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() } as Template)))
    );
  }, [orgId]);

  const resolveVars = (msg: string) =>
    msg
      .replace(/\{name\}/g, lead.name || '')
      .replace(/\{phone\}/g, lead.phone || '')
      .replace(/\{destination\}/g, (lead as any).destination || '')
      .replace(/\{pax\}/g, String(lead.pax || 1))
      .replace(/\{travel_date\}/g, lead.travelDate || '');

  const wrapSelection = (before: string, after: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd;
    const selected = message.slice(s, e) || 'text';
    const next = message.slice(0, s) + before + selected + after + message.slice(e);
    setMessage(next);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + selected.length);
    }, 0);
  };

  const insertVar = (v: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const s = el.selectionStart;
    setMessage(message.slice(0, s) + v + message.slice(s));
    setTimeout(() => { el.focus(); el.setSelectionRange(s + v.length, s + v.length); }, 0);
  };

  const handleSave = async () => {
    if (!templateName.trim()) { setSaveError('Enter a template name.'); return; }
    if (!message.trim()) { setSaveError('Message cannot be empty.'); return; }
    if (!orgId) { setSaveError('No organisation found. Please reload.'); return; }
    setSaving(true); setSaveError('');
    try {
      if (editingId) {
        await updateDoc(doc(db, 'whatsapp_templates', editingId), {
          name: templateName, message, updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'whatsapp_templates'), {
          name: templateName, message, orgId, createdAt: serverTimestamp()
        });
      }
      setView('list'); setTemplateName(''); setMessage(''); setEditingId(null);
    } catch (err: any) {
      setSaveError(err?.message ?? 'Save failed. Check Firestore rules.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    await deleteDoc(doc(db, 'whatsapp_templates', id));
  };

  const handleSend = () => {
    if (!message.trim()) return;
    const resolved = resolveVars(message);
    const phone = lead.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(resolved)}`, '_blank');
    onClose();
  };

  const openCompose = (tmpl?: Template) => {
    if (tmpl) {
      setEditingId(tmpl.id); setTemplateName(tmpl.name); setMessage(tmpl.message);
    } else {
      setEditingId(null); setTemplateName(''); setMessage('');
    }
    setView('compose');
  };

  const VARS = ['{name}', '{phone}', '{destination}', '{pax}', '{travel_date}'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden" style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-green-500 to-emerald-600 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">{lead.name}</p>
              <p className="text-green-100 text-xs">{lead.phone}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── LIST VIEW ── */}
        {view === 'list' && (
          <div className="flex flex-col overflow-hidden flex-1">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
              <p className="text-sm font-semibold text-gray-700">Message Templates</p>
              <div className="flex gap-2">
                <button
                  onClick={() => openCompose()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> New Template
                </button>
                <button
                  onClick={() => { setEditingId(null); setTemplateName(''); setMessage(''); setView('compose'); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Custom Message
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <MessageCircle className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm font-semibold">No templates yet</p>
                  <p className="text-xs mt-1">Create a template to reuse messages quickly</p>
                  <button
                    onClick={() => openCompose()}
                    className="mt-4 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create First Template
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {templates.map(tmpl => (
                    <div
                      key={tmpl.id}
                      className="group flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:border-green-300 hover:bg-green-50/30 transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Type className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800">{tmpl.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 whitespace-pre-wrap font-mono">{tmpl.message}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openCompose(tmpl)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Edit template"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(tmpl.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setMessage(tmpl.message); setEditingId(null); setTemplateName(''); setView('compose'); }}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Use <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── COMPOSE VIEW ── */}
        {view === 'compose' && (
          <div className="flex flex-col overflow-hidden flex-1">
            {/* Sub-header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-shrink-0 bg-gray-50">
              <button
                onClick={() => setView('list')}
                className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Templates
              </button>
              <div className="w-px h-4 bg-gray-200" />
              <input
                type="text"
                value={templateName}
                onChange={e => { setTemplateName(e.target.value); setSaveError(''); }}
                placeholder="Template name (to save)"
                className="flex-1 text-sm font-medium text-gray-700 bg-transparent border-0 focus:outline-none placeholder-gray-400"
              />
              <div className="flex items-center gap-2 flex-shrink-0">
                {saveError && (
                  <span className="text-xs text-red-600 font-medium">{saveError}</span>
                )}
                {templateName && message && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? 'Saving…' : editingId ? 'Update' : 'Save Template'}
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* ── Editor panel ── */}
              <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-100">
                {/* Formatting toolbar */}
                <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-gray-100 bg-gray-50 flex-shrink-0">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mr-1">Format</span>
                  <button
                    onClick={() => wrapSelection('*', '*')}
                    title="Bold — *text*"
                    className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded font-bold text-sm transition-colors"
                  >B</button>
                  <button
                    onClick={() => wrapSelection('_', '_')}
                    title="Italic — _text_"
                    className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded italic text-sm transition-colors"
                  >I</button>
                  <button
                    onClick={() => wrapSelection('~', '~')}
                    title="Strikethrough — ~text~"
                    className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded line-through text-sm transition-colors"
                  >S</button>
                  <button
                    onClick={() => wrapSelection('```', '```')}
                    title="Monospace — ```text```"
                    className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded font-mono text-xs transition-colors"
                  >{'{}'}</button>

                  <div className="w-px h-4 bg-gray-200 mx-1" />
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mr-1">Insert</span>
                  {VARS.map(v => (
                    <button
                      key={v}
                      onClick={() => insertVar(v)}
                      className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-violet-100 text-violet-700 rounded hover:bg-violet-200 transition-colors"
                    >
                      {v}
                    </button>
                  ))}
                </div>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={"Type your message here...\n\nFormatting:\n*bold*  _italic_  ~strikethrough~  ```mono```\n\nUse variables like {name} for personalization"}
                  className="flex-1 p-4 text-sm text-gray-800 font-mono resize-none focus:outline-none placeholder-gray-300 leading-relaxed"
                />

                {/* Char hint */}
                <div className="flex items-center justify-between px-4 py-1.5 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                  <p className="text-[10px] text-gray-400">*bold*  _italic_  ~strike~  ```mono```</p>
                  <p className="text-[10px] text-gray-400">{message.length} chars</p>
                </div>
              </div>

              {/* ── WhatsApp preview panel ── */}
              <div className="w-64 flex flex-col bg-[#e5ddd5] flex-shrink-0 overflow-hidden">
                <div className="px-3 py-2 bg-[#075e54] flex-shrink-0">
                  <p className="text-xs font-semibold text-white">Preview</p>
                  <p className="text-[10px] text-teal-200">{lead.name}</p>
                </div>
                {/* Chat background */}
                <div
                  className="flex-1 overflow-y-auto p-3"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c5b99a' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                  }}
                >
                  {message ? (
                    <div className="flex justify-end">
                      <div className="bg-[#dcf8c6] rounded-2xl rounded-tr-none px-3 py-2 shadow-sm max-w-[90%]">
                        <p className="text-[13px] text-gray-800 leading-relaxed break-words">
                          {parseWA(resolveVars(message))}
                        </p>
                        <p className="text-[10px] text-gray-400 text-right mt-1">now ✓✓</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-[11px] text-gray-400 bg-white/60 px-3 py-1.5 rounded-full">Preview will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50 flex-shrink-0">
              <button
                onClick={handleSend}
                disabled={!message.trim()}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
                Send on WhatsApp
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
