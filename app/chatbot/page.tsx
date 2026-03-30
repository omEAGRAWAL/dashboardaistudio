'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  Bot, Plus, Trash2, GripVertical, ChevronUp, ChevronDown,
  Save, MessageSquare, CheckCircle2, AlertCircle,
} from 'lucide-react';

type QuestionType = 'text' | 'choice';
type FieldMapping = 'name' | 'phone' | 'destination' | 'pax' | 'travelDate' | 'custom';

interface Question {
  id: string;
  order: number;
  text: string;
  type: QuestionType;
  choices: string[];
  fieldMapping: FieldMapping;
  customKey: string;
}

const FIELD_MAPPING_LABELS: Record<FieldMapping, string> = {
  name: 'Customer Name',
  phone: 'Phone Number',
  destination: 'Destination',
  pax: 'No. of Travelers (pax)',
  travelDate: 'Travel Date',
  custom: 'Custom Field',
};

function newQuestion(order: number): Question {
  return {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    order,
    text: '',
    type: 'text',
    choices: ['', ''],
    fieldMapping: 'custom',
    customKey: '',
  };
}

export default function ChatbotPage() {
  const { user, orgId, loading } = useAuth();

  const [greetingMessage, setGreetingMessage] = useState(
    'Hi! Welcome to {orgName}. I have a few quick questions to help you better.'
  );
  const [completionMessage, setCompletionMessage] = useState(
    'Thank you! Our team will reach out to you shortly.'
  );
  const [questions, setQuestions] = useState<Question[]>([newQuestion(0)]);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [loadingFlow, setLoadingFlow] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    getDoc(doc(db, 'chatbot_flows', orgId)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.greetingMessage) setGreetingMessage(data.greetingMessage);
        if (data.completionMessage) setCompletionMessage(data.completionMessage);
        if (data.questions?.length) {
          setQuestions(data.questions.sort((a: Question, b: Question) => a.order - b.order));
        }
      }
    }).finally(() => setLoadingFlow(false));
  }, [orgId]);

  const addQuestion = () => {
    setQuestions((prev) => [...prev, newQuestion(prev.length)]);
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) =>
      prev.filter((q) => q.id !== id).map((q, i) => ({ ...q, order: i }))
    );
  };

  const updateQuestion = (id: string, patch: Partial<Question>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const moveQuestion = (id: string, direction: 'up' | 'down') => {
    setQuestions((prev) => {
      const idx = prev.findIndex((q) => q.id === id);
      if (direction === 'up' && idx === 0) return prev;
      if (direction === 'down' && idx === prev.length - 1) return prev;
      const next = [...prev];
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next.map((q, i) => ({ ...q, order: i }));
    });
  };

  const addChoice = (questionId: string) => {
    updateQuestion(questionId, {
      choices: [...(questions.find((q) => q.id === questionId)?.choices ?? []), ''],
    });
  };

  const updateChoice = (questionId: string, choiceIdx: number, value: string) => {
    const q = questions.find((q) => q.id === questionId);
    if (!q) return;
    const choices = [...q.choices];
    choices[choiceIdx] = value;
    updateQuestion(questionId, { choices });
  };

  const removeChoice = (questionId: string, choiceIdx: number) => {
    const q = questions.find((q) => q.id === questionId);
    if (!q || q.choices.length <= 2) return;
    const choices = q.choices.filter((_, i) => i !== choiceIdx);
    updateQuestion(questionId, { choices });
  };

  const save = async () => {
    if (!orgId) return;
    setSaving(true);
    setSaveStatus('idle');
    try {
      const cleanedQuestions = questions.map((q, i) => ({
        ...q,
        order: i,
        choices: q.type === 'choice' ? q.choices.filter((c) => c.trim()) : [],
      }));
      await setDoc(doc(db, 'chatbot_flows', orgId), {
        greetingMessage,
        completionMessage,
        questions: cleanedQuestions,
        updatedAt: serverTimestamp(),
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Save error:', err);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingFlow) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-3xl mx-auto">

            {/* Page header */}
            <div className="mb-8 flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Bot className="w-6 h-6 text-green-600" />
                  WhatsApp Chatbot Builder
                </h1>
                <p className="text-gray-500 mt-1">
                  Configure the questions your bot asks when a customer sends a message.
                </p>
              </div>
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Saving…' : 'Save Flow'}
              </button>
            </div>

            {saveStatus === 'saved' && (
              <div className="mb-4 flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Chatbot flow saved successfully.
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="mb-4 flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4" />
                Failed to save. Please try again.
              </div>
            )}

            <div className="space-y-6">

              {/* Greeting & Completion messages */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-green-600" />
                    Bot Messages
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Greeting Message
                      <span className="ml-1 text-xs font-normal text-gray-400">
                        (sent when customer first messages; use {'{orgName}'} as placeholder)
                      </span>
                    </label>
                    <textarea
                      rows={2}
                      value={greetingMessage}
                      onChange={(e) => setGreetingMessage(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Completion Message
                      <span className="ml-1 text-xs font-normal text-gray-400">
                        (sent after all questions are answered)
                      </span>
                    </label>
                    <textarea
                      rows={2}
                      value={completionMessage}
                      onChange={(e) => setCompletionMessage(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Questions */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">
                    Questions ({questions.length})
                  </h2>
                  <button
                    onClick={addQuestion}
                    className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Question
                  </button>
                </div>

                <div className="divide-y divide-gray-100">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="p-6">
                      <div className="flex items-start gap-3">
                        {/* Order controls */}
                        <div className="flex flex-col items-center gap-0.5 pt-1 shrink-0">
                          <span className="text-xs text-gray-400 font-medium">{idx + 1}</span>
                          <button
                            onClick={() => moveQuestion(q.id, 'up')}
                            disabled={idx === 0}
                            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-25"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveQuestion(q.id, 'down')}
                            disabled={idx === questions.length - 1}
                            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-25"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex-1 space-y-3">
                          {/* Question text */}
                          <input
                            type="text"
                            placeholder="Question text e.g. What is your name?"
                            value={q.text}
                            onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />

                          <div className="flex gap-3 flex-wrap">
                            {/* Type toggle */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-500">Type:</span>
                              <div className="flex rounded-lg border border-gray-300 overflow-hidden text-xs">
                                <button
                                  onClick={() => updateQuestion(q.id, { type: 'text' })}
                                  className={`px-3 py-1.5 font-medium transition-colors ${
                                    q.type === 'text'
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-white text-gray-600 hover:bg-gray-50'
                                  }`}
                                >
                                  Text Input
                                </button>
                                <button
                                  onClick={() => updateQuestion(q.id, { type: 'choice' })}
                                  className={`px-3 py-1.5 font-medium transition-colors border-l border-gray-300 ${
                                    q.type === 'choice'
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-white text-gray-600 hover:bg-gray-50'
                                  }`}
                                >
                                  Multiple Choice
                                </button>
                              </div>
                            </div>

                            {/* Field mapping */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-500">Maps to:</span>
                              <select
                                value={q.fieldMapping}
                                onChange={(e) =>
                                  updateQuestion(q.id, { fieldMapping: e.target.value as FieldMapping })
                                }
                                className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              >
                                {Object.entries(FIELD_MAPPING_LABELS).map(([value, label]) => (
                                  <option key={value} value={value}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Custom key */}
                            {q.fieldMapping === 'custom' && (
                              <input
                                type="text"
                                placeholder="Field key e.g. budget"
                                value={q.customKey}
                                onChange={(e) => updateQuestion(q.id, { customKey: e.target.value })}
                                className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 w-36"
                              />
                            )}
                          </div>

                          {/* Choices (if multiple choice) */}
                          {q.type === 'choice' && (
                            <div className="space-y-2 pl-2 border-l-2 border-indigo-100">
                              {q.choices.map((choice, cIdx) => (
                                <div key={cIdx} className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400 w-4">{cIdx + 1}.</span>
                                  <input
                                    type="text"
                                    placeholder={`Option ${cIdx + 1}`}
                                    value={choice}
                                    onChange={(e) => updateChoice(q.id, cIdx, e.target.value)}
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  />
                                  <button
                                    onClick={() => removeChoice(q.id, cIdx)}
                                    disabled={q.choices.length <= 2}
                                    className="text-gray-400 hover:text-red-500 disabled:opacity-25"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => addChoice(q.id)}
                                className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                Add option
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Delete question */}
                        <button
                          onClick={() => removeQuestion(q.id)}
                          disabled={questions.length === 1}
                          className="text-gray-400 hover:text-red-500 disabled:opacity-25 shrink-0 mt-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-6 py-4 border-t border-gray-100">
                  <button
                    onClick={addQuestion}
                    className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-indigo-600 border-2 border-dashed border-gray-200 hover:border-indigo-300 rounded-lg py-3 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add another question
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <h2 className="text-base font-semibold text-gray-900">Conversation Preview</h2>
                  <p className="text-xs text-gray-400 mt-0.5">How the bot will appear to customers</p>
                </div>
                <div className="p-6">
                  <div
                    className="rounded-xl p-4 space-y-2 max-h-72 overflow-y-auto"
                    style={{ background: '#e5ddd5' }}
                  >
                    {/* Greeting */}
                    <div className="flex justify-start">
                      <div className="bg-white rounded-lg rounded-tl-none px-3 py-2 text-sm max-w-xs shadow-sm">
                        {greetingMessage.replace('{orgName}', 'Your Agency') || '(greeting message)'}
                      </div>
                    </div>

                    {/* Questions */}
                    {questions.map((q, idx) => (
                      <div key={q.id} className="flex justify-start">
                        <div className="bg-white rounded-lg rounded-tl-none px-3 py-2 text-sm max-w-xs shadow-sm">
                          {q.text || `(question ${idx + 1})`}
                          {q.type === 'choice' && q.choices.filter(Boolean).length > 0 && (
                            <div className="mt-1.5 space-y-0.5">
                              {q.choices.filter(Boolean).map((c, ci) => (
                                <div key={ci} className="text-xs text-gray-500">
                                  {ci + 1}. {c}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Customer placeholder answer */}
                    <div className="flex justify-end">
                      <div
                        className="rounded-lg rounded-tr-none px-3 py-2 text-sm max-w-xs shadow-sm text-white"
                        style={{ background: '#dcf8c6' }}
                      >
                        <span className="text-gray-700">Customer reply…</span>
                      </div>
                    </div>

                    {/* Completion */}
                    <div className="flex justify-start">
                      <div className="bg-white rounded-lg rounded-tl-none px-3 py-2 text-sm max-w-xs shadow-sm">
                        {completionMessage || '(completion message)'}
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
