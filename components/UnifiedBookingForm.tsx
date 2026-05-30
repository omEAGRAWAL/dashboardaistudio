'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';

export type FieldType = 'text' | 'tel' | 'email' | 'date' | 'select' | 'number' | 'textarea';
export type BookingPageType = 'standard' | 'participants';

export interface BookingField {
  id: string;
  key?: string; // typically customerName, customerPhone, customerEmail, etc.
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];
  required: boolean;
  enabled: boolean;
  order: number;
  isDefault: boolean;
}

export interface BookingPage {
  id: string;
  title: string;
  fields: BookingField[];
  type?: BookingPageType;
  enabled?: boolean;
}

export const DEFAULT_BOOKING_FIELDS: BookingField[] = [
  { id: 'f_name', key: 'customerName', label: 'Full Name', type: 'text', placeholder: 'Full Name', required: true, enabled: true, order: 0, isDefault: true },
  { id: 'f_phone', key: 'customerPhone', label: 'Phone Number (WhatsApp)', type: 'tel', placeholder: 'Phone Number', required: true, enabled: true, order: 1, isDefault: true },
  { id: 'f_email', key: 'customerEmail', label: 'Email Address', type: 'email', placeholder: 'Email Address', required: false, enabled: true, order: 2, isDefault: true },
  { id: 'f_date', key: 'travelDate', label: 'Travel Date', type: 'date', required: false, enabled: true, order: 3, isDefault: true },
  { id: 'f_state', key: 'state', label: 'State', type: 'select', options: ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh'], required: false, enabled: true, order: 4, isDefault: true },
  { id: 'f_city', key: 'city', label: 'City', type: 'text', placeholder: 'City', required: false, enabled: true, order: 5, isDefault: true },
  { id: 'f_source', key: 'leadSource', label: 'Source (How did you hear?)', type: 'select', options: ['Instagram','Facebook','WhatsApp','Google','Reference','Website','Other'], required: false, enabled: true, order: 6, isDefault: true },
];

export const DEFAULT_BOOKING_PAGES: BookingPage[] = [
  { id: 'page_1', title: 'Details', type: 'standard', enabled: true, fields: DEFAULT_BOOKING_FIELDS },
  {
    id: 'page_participants',
    title: 'Passenger Details',
    type: 'participants',
    enabled: true,
    fields: [
      { id: 'pf_name', key: 'participantName', label: 'Passenger Name', type: 'text', placeholder: 'Passenger Name', required: false, enabled: true, order: 0, isDefault: true },
      { id: 'pf_phone', key: 'participantPhone', label: 'Passenger Phone', type: 'tel', placeholder: 'Passenger Phone', required: false, enabled: true, order: 1, isDefault: true },
      { id: 'pf_age', key: 'participantAge', label: 'Age', type: 'number', placeholder: 'Age', required: false, enabled: true, order: 2, isDefault: true },
      { id: 'pf_gender', key: 'participantGender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: false, enabled: true, order: 3, isDefault: true },
    ],
  },
];

const PARTICIPANT_FIELD_PREFIX = '__participant_';
const PARTICIPANT_KEY_MAP: Record<string, string> = {
  participantName: 'name',
  participantPhone: 'phone',
  participantAge: 'age',
  participantGender: 'gender',
};

interface UnifiedBookingFormProps {
  pages: BookingPage[];
  accentColor: string;
  initialData?: Record<string, any>;
  onComplete: (data: Record<string, any>) => void | Promise<void>;
  headerRenderer?: (currentPage: number, totalPages: number, pageTitle: string, onBack: () => void) => React.ReactNode;
  children?: React.ReactNode; // For the package mini-card
  submitLabel?: string;
  nextLabel?: string;
  isSubmitting?: boolean;
  participantCount?: number;
}

export function UnifiedBookingForm({
  pages,
  accentColor,
  initialData = {},
  onComplete,
  headerRenderer,
  children,
  submitLabel = 'Submit Booking',
  nextLabel = 'Next',
  isSubmitting = false,
  participantCount = 0,
}: UnifiedBookingFormProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const safeParticipantCount = Math.max(0, Math.floor(Number(participantCount) || 0));

  const safePages = useMemo(() => {
    const normalized = (pages || [])
      .filter(page => page.enabled !== false)
      .filter(page => page.type !== 'participants' || safeParticipantCount > 0)
      .map(page => ({
        ...page,
        fields: (page.fields || [])
          .filter(field => field.enabled)
          .sort((a, b) => a.order - b.order),
      }))
      .filter(page => page.fields.length > 0);

    const fallbackPages = DEFAULT_BOOKING_PAGES
      .filter(page => page.enabled !== false)
      .filter(page => page.type !== 'participants' || safeParticipantCount > 0)
      .map(page => ({
        ...page,
        fields: (page.fields || [])
          .filter(field => field.enabled)
          .sort((a, b) => a.order - b.order),
      }))
      .filter(page => page.fields.length > 0);

    return normalized.length > 0 ? normalized : fallbackPages;
  }, [pages, safeParticipantCount]);

  const safeCurrentPage = safePages[Math.min(currentPageIndex, safePages.length - 1)];
  const activeFields = safeCurrentPage?.fields || [];
  const progress = Math.round(((Math.min(currentPageIndex, safePages.length - 1) + 1) / safePages.length) * 100);

  const validateCurrentPage = () => {
    const nextErrors: Record<string, string> = {};
    const validateField = (field: BookingField, fieldKey: string) => {
      const value = formData[fieldKey];
      if (field.required && (value === undefined || value === null || String(value).trim() === '')) {
        nextErrors[fieldKey] = `${field.label} is required.`;
      }

      if (value && field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
        nextErrors[fieldKey] = 'Enter a valid email address.';
      }
    };

    if (safeCurrentPage?.type === 'participants') {
      for (let passengerIndex = 0; passengerIndex < safeParticipantCount; passengerIndex++) {
        for (const field of activeFields) {
          validateField(field, getParticipantFieldKey(field.id, passengerIndex));
        }
      }
    } else {
      for (const field of activeFields) {
        validateField(field, field.id);
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const getParticipantFieldKey = (fieldId: string, passengerIndex: number) =>
    `${PARTICIPANT_FIELD_PREFIX}${passengerIndex}_${fieldId}`;

  const buildParticipants = () => {
    const participantPages = safePages.filter(page => page.type === 'participants');
    if (participantPages.length === 0 || safeParticipantCount < 1) return [];

    return Array.from({ length: safeParticipantCount }).map((_, passengerIndex) => {
      const participant: Record<string, any> = {};
      const customFields: Record<string, any> = {};

      for (const page of participantPages) {
        for (const field of page.fields) {
          const value = formData[getParticipantFieldKey(field.id, passengerIndex)];
          if (value === undefined || value === null || String(value).trim() === '') continue;

          const participantKey = field.key ? PARTICIPANT_KEY_MAP[field.key] : undefined;
          if (participantKey) {
            participant[participantKey] = value;
          } else {
            customFields[field.label || field.id] = value;
          }
        }
      }

      if (Object.keys(customFields).length > 0) {
        participant.customFields = customFields;
      }

      return participant;
    }).filter(participant => Object.keys(participant).length > 0);
  };

  const handleNext = async () => {
    if (isSubmitting || !validateCurrentPage()) return;

    if (currentPageIndex < safePages.length - 1) {
      setCurrentPageIndex(prev => prev + 1);
    } else {
      await onComplete({ ...formData, __participants: buildParticipants() });
    }
  };

  const handleBack = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
    } else {
      // In first page, back means cancel/close, parent should handle it if passed via headerRenderer
    }
  };

  const handleChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    setErrors(prev => {
      if (!prev[fieldId]) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  };

  if (!safeCurrentPage) return null;

  const renderField = (field: BookingField, fieldKey: string, label?: string) => {
    const hasError = !!errors[fieldKey];
    return (
      <div key={fieldKey} className="space-y-1">
        <label htmlFor={fieldKey} className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          {label || field.label} {field.required && <span className="text-red-500">*</span>}
        </label>

        {field.type === 'select' ? (
          <div className="relative">
            <select
              id={fieldKey}
              value={formData[fieldKey] || ''}
              onChange={(e) => handleChange(fieldKey, e.target.value)}
              required={field.required}
              aria-invalid={hasError}
              className={`w-full appearance-none rounded-xl border px-4 py-3.5 pr-9 text-base bg-white text-gray-900 outline-none transition-colors focus:ring-2 sm:text-sm ${
                hasError ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:border-gray-300 focus:ring-gray-100'
              }`}
            >
              <option value="">Select...</option>
              {(field.options || []).map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <ChevronRight className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
          </div>
        ) : field.type === 'textarea' ? (
          <textarea
            id={fieldKey}
            value={formData[fieldKey] || ''}
            onChange={(e) => handleChange(fieldKey, e.target.value)}
            placeholder={field.placeholder || ''}
            required={field.required}
            rows={3}
            aria-invalid={hasError}
            className={`w-full resize-y rounded-xl border px-4 py-3.5 text-base bg-white text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:ring-2 sm:text-sm ${
              hasError ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:border-gray-300 focus:ring-gray-100'
            }`}
          />
        ) : (
          <input
            id={fieldKey}
            type={field.type}
            value={formData[fieldKey] || ''}
            onChange={(e) => handleChange(fieldKey, e.target.value)}
            placeholder={field.placeholder || ''}
            required={field.required}
            aria-invalid={hasError}
            inputMode={field.type === 'tel' ? 'tel' : field.type === 'number' ? 'numeric' : undefined}
            className={`w-full rounded-xl border px-4 py-3.5 text-base bg-white text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:ring-2 sm:text-sm ${
              hasError ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:border-gray-300 focus:ring-gray-100'
            }`}
            style={field.type === 'date' ? { accentColor } : undefined}
          />
        )}
        {hasError && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
            <AlertCircle className="h-3.5 w-3.5" /> {errors[fieldKey]}
          </p>
        )}
      </div>
    );
  };

  return (
    <form
      className="flex h-full min-h-0 flex-col bg-white"
      onSubmit={(e) => { e.preventDefault(); handleNext(); }}
    >
      {headerRenderer && headerRenderer(
        currentPageIndex,
        safePages.length,
        safeCurrentPage.title,
        handleBack
      )}

      <div className="px-5 pt-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
            Step {Math.min(currentPageIndex, safePages.length - 1) + 1} of {safePages.length}
          </p>
          <p className="text-[11px] font-semibold text-gray-400">{progress}%</p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, backgroundColor: accentColor }}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 overscroll-contain">
        {currentPageIndex === 0 && children}

        {safeCurrentPage.type === 'participants' ? (
          <div className="space-y-4">
            <p className="text-xs text-gray-400">Optional passenger details. You can leave unknown fields blank.</p>
            {Array.from({ length: safeParticipantCount }).map((_, passengerIndex) => (
              <div key={passengerIndex} className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: accentColor }}>
                    {passengerIndex + 1}
                  </span>
                  <p className="text-sm font-bold text-gray-800">Passenger {passengerIndex + 1}</p>
                </div>
                <div className="space-y-4">
                  {activeFields.map(field => renderField(field, getParticipantFieldKey(field.id, passengerIndex)))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          activeFields.map(field => renderField(field, field.id))
        )}
      </div>

      <div className="flex-shrink-0 border-t border-gray-100 bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl py-4 text-base font-bold text-white shadow-md transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundColor: accentColor }}
        >
          {isSubmitting ? 'Submitting...' : currentPageIndex < safePages.length - 1 ? nextLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
