'use client';

import { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export type FieldType = 'text' | 'tel' | 'email' | 'date' | 'select' | 'number' | 'textarea';

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
  { id: 'page_1', title: 'Details', fields: DEFAULT_BOOKING_FIELDS }
];

interface UnifiedBookingFormProps {
  pages: BookingPage[];
  accentColor: string;
  initialData?: Record<string, any>;
  onComplete: (data: Record<string, any>) => void;
  headerRenderer?: (currentPage: number, totalPages: number, pageTitle: string, onBack: () => void) => React.ReactNode;
  children?: React.ReactNode; // For the package mini-card
}

export function UnifiedBookingForm({
  pages,
  accentColor,
  initialData = {},
  onComplete,
  headerRenderer,
  children
}: UnifiedBookingFormProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>(initialData);

  const currentPage = pages[currentPageIndex];
  
  // Filter out disabled fields
  const activeFields = currentPage?.fields.filter(f => f.enabled).sort((a, b) => a.order - b.order) || [];

  const handleNext = () => {
    // Basic validation
    for (const field of activeFields) {
      if (field.required && !formData[field.id]) {
        alert(`${field.label} is required.`);
        return;
      }
    }

    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(prev => prev + 1);
    } else {
      onComplete(formData);
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
  };

  if (!pages || pages.length === 0) return null;

  return (
    <div className="flex flex-col h-full">
      {headerRenderer && headerRenderer(
        currentPageIndex, 
        pages.length, 
        currentPage.title, 
        handleBack
      )}

      <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
        {currentPageIndex === 0 && children}

        {activeFields.map(field => {
          return (
            <div key={field.id} className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>

              {field.type === 'select' ? (
                <div className="relative">
                  <select
                    value={formData[field.id] || ''}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    required={field.required}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none appearance-none pr-8"
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
                  value={formData[field.id] || ''}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  placeholder={field.placeholder || ''}
                  required={field.required}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none resize-y"
                />
              ) : (
                <input
                  type={field.type}
                  value={formData[field.id] || ''}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  placeholder={field.placeholder || ''}
                  required={field.required}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none"
                  style={field.type === 'date' ? { accentColor } : undefined}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="px-5 pb-5 pt-2 flex-shrink-0">
        <button
          onClick={handleNext}
          className="w-full py-4 rounded-2xl text-white font-bold text-base shadow-md hover:brightness-110 transition-all"
          style={{ backgroundColor: accentColor }}
        >
          {currentPageIndex < pages.length - 1 ? 'Next' : 'Next'}
        </button>
      </div>
    </div>
  );
}
