'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileSpreadsheet } from 'lucide-react';
import Papa from 'papaparse';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthProvider';

export function ImportLeads() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setSuccess('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const leads = results.data as any[];
          let importedCount = 0;

          for (const row of leads) {
            if (!row.name || !row.phone) continue; // Skip invalid rows

            await addDoc(collection(db, 'leads'), {
              name: row.name,
              phone: row.phone,
              source: row.source || 'CSV Import',
              sourceId: row.sourceId || null,
              pax: row.pax ? parseInt(row.pax, 10) : 1,
              travelDate: row.travelDate || null,
              status: row.status || 'New Enquiry',
              category: row.category || 'None',
              assigneeId: user?.uid || null,
              latestRemark: row.remark || '',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            importedCount++;
          }

          setSuccess(`Successfully imported ${importedCount} leads.`);
          setLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
          setTimeout(() => setIsOpen(false), 2000);
        } catch (err) {
          console.error('Import error:', err);
          setError('Failed to import leads. Please check the CSV format.');
          setLoading(false);
        }
      },
      error: (err) => {
        console.error('Parse error:', err);
        setError('Failed to parse CSV file.');
        setLoading(false);
      }
    });
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
      >
        <Upload className="w-4 h-4" />
        Import CSV
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                Import Leads from CSV
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Upload a CSV file exported from Google Sheets or Meta Ads. The file must include <code className="bg-gray-100 px-1 py-0.5 rounded">name</code> and <code className="bg-gray-100 px-1 py-0.5 rounded">phone</code> columns.
              </p>
              
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">Click to upload CSV file</p>
                <p className="text-xs text-gray-500 mt-1">.csv files only</p>
              </div>
              
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload}
              />

              {loading && <p className="text-sm text-indigo-600 mt-4 text-center font-medium">Importing leads... Please wait.</p>}
              {error && <p className="text-sm text-red-600 mt-4 text-center font-medium">{error}</p>}
              {success && <p className="text-sm text-emerald-600 mt-4 text-center font-medium">{success}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
