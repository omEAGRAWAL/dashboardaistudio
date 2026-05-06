'use client';

import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Send } from 'lucide-react';

interface ContactFormProps {
  orgId: string;
  tc: string;
}

export function ContactForm({ orgId, tc }: ContactFormProps) {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', destination: '', message: '' });
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('submitting');
    try {
      await addDoc(collection(db, 'leads'), {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        latestRemark: [formData.destination && `Destination: ${formData.destination}`, formData.message].filter(Boolean).join(' | ') || null,
        source: 'Website',
        status: 'New Enquiry',
        category: 'None',
        pax: 1,
        orgId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setFormState('success');
      setFormData({ name: '', phone: '', email: '', destination: '', message: '' });
    } catch {
      setFormState('error');
    }
  };

  if (formState === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${tc}20` }}>
          <Send className="w-7 h-7" style={{ color: tc }} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Enquiry Received!</h3>
        <p className="text-gray-500 text-sm mb-6">We&apos;ll get back to you shortly.</p>
        <button onClick={() => setFormState('idle')} className="text-sm font-semibold underline" style={{ color: tc }}>Send another</button>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleContact}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Full Name *</label>
          <input type="text" required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 bg-gray-50 text-sm" placeholder="John Doe" />
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Phone *</label>
          <input type="tel" required value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 bg-gray-50 text-sm" placeholder="+91 98765 43210" />
        </div>
      </div>
      <div>
        <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Email</label>
        <input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 bg-gray-50 text-sm" placeholder="you@email.com" />
      </div>
      <div>
        <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Destination Interest</label>
        <input type="text" value={formData.destination} onChange={e => setFormData(p => ({ ...p, destination: e.target.value }))} className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 bg-gray-50 text-sm" placeholder="e.g. Bali, Europe, etc." />
      </div>
      <div>
        <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Message</label>
        <textarea rows={4} value={formData.message} onChange={e => setFormData(p => ({ ...p, message: e.target.value }))} className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 bg-gray-50 text-sm resize-none" placeholder="Tell us about your travel plans..." />
      </div>
      {formState === 'error' && (
        <p className="text-sm text-red-500">Something went wrong. Please try again.</p>
      )}
      <button type="submit" disabled={formState === 'submitting'} className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-white font-bold text-base shadow-md hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100" style={{ backgroundColor: tc }}>
        <Send className="w-5 h-5" /> {formState === 'submitting' ? 'Sending...' : 'Send Enquiry'}
      </button>
    </form>
  );
}
