'use client';

import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useEffect, useState, useCallback } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CalendarCheck, Search, Filter, Trash2, Edit2, Plus, Minus, Eye, FileText, Mail, Download, Loader2, X, History } from 'lucide-react';
import { format } from 'date-fns';
import { generateInvoiceHTML, type BusinessProfile, type InvoiceBooking } from '@/lib/invoice-template';

// ─── localStorage helpers ──────────────────────────────────────────────
const INVOICE_KEY_PREFIX = 'invoices_';
const COUNTER_KEY_PREFIX = 'invoice_counter_';

function getInvoiceCounter(orgId: string): number {
  if (typeof window === 'undefined') return 1;
  return Number(localStorage.getItem(COUNTER_KEY_PREFIX + orgId)) || 0;
}
function incrementInvoiceCounter(orgId: string): number {
  const next = getInvoiceCounter(orgId) + 1;
  localStorage.setItem(COUNTER_KEY_PREFIX + orgId, String(next));
  return next;
}
function getInvoiceHistory(orgId: string): any[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(INVOICE_KEY_PREFIX + orgId) || '[]');
  } catch { return []; }
}
function saveInvoiceToHistory(orgId: string, entry: any) {
  const list = getInvoiceHistory(orgId);
  list.unshift(entry);
  // Keep last 100 entries
  localStorage.setItem(INVOICE_KEY_PREFIX + orgId, JSON.stringify(list.slice(0, 100)));
}

export default function BookingsPage() {
  const { user, orgId, role } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [viewingBooking, setViewingBooking] = useState<any>(null);
  const [editingBooking, setEditingBooking] = useState<any>(null);
  const [editStatus, setEditStatus] = useState('');
  const [packages, setPackages] = useState<any[]>([]);
  
  // Business profile for invoices
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [invoiceHistory, setInvoiceHistory] = useState<any[]>([]);
  
  // Loading states for invoice actions
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [emailingFor, setEmailingFor] = useState<string | null>(null);

  // Invoice generation modal
  const [invoiceModalBooking, setInvoiceModalBooking] = useState<any>(null);
  const [invoiceAmountPaid, setInvoiceAmountPaid] = useState('');
  const [invoiceParticipants, setInvoiceParticipants] = useState<string[]>(['']);
  const [invoiceRemarks, setInvoiceRemarks] = useState('');

  const [createFormData, setCreateFormData] = useState({
    packageId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    customerCity: '',
    customerState: '',
    travelDate: '',
    notes: '',
    ticketQty: {} as Record<string, number>,
  });

  useEffect(() => {
    if (!orgId) return;

    // Fetch packages
    const pkgsQuery = query(collection(db, 'packages'), where('orgId', '==', orgId));
    const unsubscribePkgs = onSnapshot(pkgsQuery, (snapshot) => {
      setPackages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch bookings
    const q = query(collection(db, 'bookings'), where('orgId', '==', orgId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      bks.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toMillis() || 0;
        const dateB = b.createdAt?.toMillis() || 0;
        return dateB - dateA;
      });
      setBookings(bks);
      setLoading(false);
    });

    // Fetch business profile
    getDoc(doc(db, 'business_profiles', orgId)).then(snap => {
      if (snap.exists()) {
        setBusinessProfile(snap.data() as BusinessProfile);
      }
    });

    // Load invoice history from localStorage
    setInvoiceHistory(getInvoiceHistory(orgId));

    return () => {
      unsubscribe();
      unsubscribePkgs();
    };
  }, [orgId]);

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.packageTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleOpenEdit = (booking: any) => {
    setEditingBooking(booking);
    setEditStatus(booking.status || 'Pending');
    setIsModalOpen(true);
  };

  const handleOpenView = (booking: any) => {
    setViewingBooking(booking);
    setIsViewModalOpen(true);
  };

  const handleSaveStatus = async () => {
    if (!editingBooking) return;
    try {
      await updateDoc(doc(db, 'bookings', editingBooking.id), { status: editStatus });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating booking:", error);
      alert("Failed to update booking status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;
    try {
      await deleteDoc(doc(db, 'bookings', id));
    } catch (error) {
      console.error("Error deleting booking:", error);
    }
  };

  // Calculate total persons
  const getTotalPersons = (ticketQty: Record<string, number>) =>
    Object.values(ticketQty).reduce((sum, q) => sum + (q || 0), 0);

  // Calculate total price
  const calcTotalPrice = (ticketQty: Record<string, number>, pkg: any) => {
    if (!pkg) return 0;
    return (ticketQty['double'] || 0) * (pkg.priceDouble || 0) +
           (ticketQty['triple'] || 0) * (pkg.priceTriple || 0) +
           (ticketQty['quad'] || 0) * (pkg.priceQuad || 0);
  };

  // Dominant sharing type
  const getDominantSharing = (ticketQty: Record<string, number>) => {
    let dominant = 'double';
    let max = -1;
    ['double', 'triple', 'quad'].forEach(t => {
      if ((ticketQty[t] || 0) > max) { max = ticketQty[t] || 0; dominant = t; }
    });
    return dominant;
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    const selectedPkg = packages.find(p => p.id === createFormData.packageId);
    if (!selectedPkg) return;
    const totalPersons = getTotalPersons(createFormData.ticketQty);
    const totalPrice = calcTotalPrice(createFormData.ticketQty, selectedPkg);
    if (totalPersons < 1) { alert('Add at least 1 person'); return; }
    try {
      const ticketBreakdown = [
        { type: 'double', label: 'Dual Occupancy', quantity: createFormData.ticketQty['double'] || 0, pricePerPerson: selectedPkg.priceDouble || 0 },
        { type: 'triple', label: 'Triple Occupancy', quantity: createFormData.ticketQty['triple'] || 0, pricePerPerson: selectedPkg.priceTriple || 0 },
        { type: 'quad', label: 'Quad Occupancy', quantity: createFormData.ticketQty['quad'] || 0, pricePerPerson: selectedPkg.priceQuad || 0 },
      ].filter(t => t.pricePerPerson > 0);

      await addDoc(collection(db, 'bookings'), {
        orgId,
        packageId: selectedPkg.id,
        packageTitle: selectedPkg.title,
        customerName: createFormData.customerName,
        customerEmail: createFormData.customerEmail,
        customerPhone: createFormData.customerPhone,
        customerAddress: createFormData.customerAddress,
        customerCity: createFormData.customerCity,
        customerState: createFormData.customerState,
        travelDate: createFormData.travelDate,
        notes: createFormData.notes,
        sharingType: getDominantSharing(createFormData.ticketQty),
        ticketBreakdown,
        numberOfPersons: totalPersons,
        totalPrice,
        status: 'Confirmed',
        source: 'CRM',
        createdAt: serverTimestamp()
      });
      setIsCreateModalOpen(false);
      setCreateFormData({
        packageId: '', customerName: '', customerEmail: '', customerPhone: '',
        customerAddress: '', customerCity: '', customerState: '', travelDate: '', notes: '',
        ticketQty: {},
      });
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Failed to create booking");
    }
  };

  // ─── Invoice Generation ──────────────────────────────────────────
  const openInvoiceModal = (booking: any) => {
    setInvoiceModalBooking(booking);
    setInvoiceAmountPaid('');
    setInvoiceParticipants(['']);
    setInvoiceRemarks('');
  };

  const buildInvoiceBooking = (booking: any): InvoiceBooking => {
    // Find the package to get per-person prices
    const pkg = packages.find(p => p.id === booking.packageId);
    return {
      id: booking.id,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail || '',
      customerPhone: booking.customerPhone || '',
      packageTitle: booking.packageTitle,
      sharingType: booking.sharingType,
      ticketBreakdown: booking.ticketBreakdown,
      numberOfPersons: booking.numberOfPersons,
      totalPrice: booking.totalPrice,
      status: booking.status || 'Pending',
      travelDate: booking.travelDate || '',
      bookingDate: booking.createdAt ? format(booking.createdAt.toDate(), 'dd MMM yyyy') : 'N/A',
      participants: invoiceParticipants.filter(p => p.trim()),
      remarks: invoiceRemarks,
      amountPaid: Number(invoiceAmountPaid) || 0,
      priceDouble: pkg?.priceDouble || 0,
      priceTriple: pkg?.priceTriple || 0,
      priceQuad: pkg?.priceQuad || 0,
    };
  };

  const generatePdfBlob = useCallback(async (htmlContent: string): Promise<Blob> => {
    // Dynamically import html2pdf.js (browser-only)
    const html2pdf = (await import('html2pdf.js')).default;

    // Parse the full HTML document to extract styles and body content
    const parser = new DOMParser();
    const parsed = parser.parseFromString(htmlContent, 'text/html');
    const styleTag = parsed.querySelector('style');
    const invoiceBody = parsed.querySelector('.invoice-container');

    // Create a wrapper that is in the render tree but invisible to the user
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.top = '0';
    wrapper.style.left = '0';
    wrapper.style.width = '800px';
    wrapper.style.zIndex = '-9999';
    wrapper.style.opacity = '0';
    wrapper.style.pointerEvents = 'none';
    wrapper.style.overflow = 'hidden';
    wrapper.style.background = '#fff';

    // Inject the styles + the invoice container
    if (styleTag) wrapper.appendChild(styleTag.cloneNode(true));
    if (invoiceBody) {
      wrapper.appendChild(invoiceBody.cloneNode(true));
    } else {
      // Fallback: inject raw HTML
      const fallback = document.createElement('div');
      fallback.innerHTML = htmlContent;
      wrapper.appendChild(fallback);
    }

    document.body.appendChild(wrapper);

    // Give the browser a tick to render / layout
    await new Promise(r => setTimeout(r, 300));

    try {
      const target = wrapper.querySelector('.invoice-container') as HTMLElement || wrapper;
      const blob = await html2pdf()
        .set({
          margin: [10, 0, 10, 0],
          filename: 'invoice.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            width: 800,
            windowWidth: 800,
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(target)
        .outputPdf('blob');
      return blob as Blob;
    } finally {
      document.body.removeChild(wrapper);
    }
  }, []);

  const handleDownloadInvoice = async () => {
    if (!orgId || !invoiceModalBooking || !businessProfile) return;
    setGeneratingFor(invoiceModalBooking.id);
    try {
      const invoiceNum = incrementInvoiceCounter(orgId);
      const invoiceBooking = buildInvoiceBooking(invoiceModalBooking);
      const html = generateInvoiceHTML(invoiceBooking, businessProfile, invoiceNum);
      const blob = await generatePdfBlob(html);
      
      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${invoiceNum}-${invoiceBooking.packageTitle.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Save to localStorage history
      const entry = {
        invoiceNumber: invoiceNum,
        bookingId: invoiceModalBooking.id,
        customerName: invoiceModalBooking.customerName,
        packageTitle: invoiceModalBooking.packageTitle,
        totalPrice: invoiceModalBooking.totalPrice,
        date: new Date().toISOString(),
        action: 'download',
      };
      saveInvoiceToHistory(orgId, entry);
      setInvoiceHistory(getInvoiceHistory(orgId));
      setInvoiceModalBooking(null);
    } catch (err) {
      console.error('Invoice generation error:', err);
      alert('Failed to generate invoice. Please try again.');
    } finally {
      setGeneratingFor(null);
    }
  };

  const handleEmailInvoice = async () => {
    if (!orgId || !invoiceModalBooking || !businessProfile) return;
    if (!invoiceModalBooking.customerEmail) {
      alert('This booking has no customer email. Please add an email address first.');
      return;
    }
    setEmailingFor(invoiceModalBooking.id);
    try {
      const invoiceNum = incrementInvoiceCounter(orgId);
      const invoiceBooking = buildInvoiceBooking(invoiceModalBooking);
      const html = generateInvoiceHTML(invoiceBooking, businessProfile, invoiceNum);
      const blob = await generatePdfBlob(html);
      
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(blob);
      const pdfBase64 = await base64Promise;

      // Send to API
      const res = await fetch('/api/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: invoiceModalBooking.customerEmail,
          customerName: invoiceModalBooking.customerName,
          invoiceNumber: invoiceNum,
          packageTitle: invoiceModalBooking.packageTitle,
          agencyName: businessProfile.agencyName,
          pdfBase64,
          invoiceHtml: html,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send email');
      }

      // Save to localStorage history
      const entry = {
        invoiceNumber: invoiceNum,
        bookingId: invoiceModalBooking.id,
        customerName: invoiceModalBooking.customerName,
        customerEmail: invoiceModalBooking.customerEmail,
        packageTitle: invoiceModalBooking.packageTitle,
        totalPrice: invoiceModalBooking.totalPrice,
        date: new Date().toISOString(),
        action: 'email',
      };
      saveInvoiceToHistory(orgId, entry);
      setInvoiceHistory(getInvoiceHistory(orgId));

      alert(`Invoice #${invoiceNum} sent successfully to ${invoiceModalBooking.customerEmail}!`);
      setInvoiceModalBooking(null);
    } catch (err: any) {
      console.error('Invoice email error:', err);
      alert(`Failed to send invoice: ${err.message}`);
    } finally {
      setEmailingFor(null);
    }
  };

  if (!user || !orgId) return null;

  const noProfile = !businessProfile || !businessProfile.agencyName;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 md:mb-8">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Bookings</h1>
                <p className="text-gray-500 text-sm mt-1">Manage customer package bookings.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsHistoryOpen(true)}
                  className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  <History className="w-4 h-4" />
                  <span className="hidden sm:inline">Invoice History</span>
                </button>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Create Booking
                </button>
              </div>
            </div>

            {/* No business profile warning */}
            {noProfile && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-center gap-3">
                <FileText className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">Set up your Business Profile to generate invoices</p>
                  <p className="text-xs text-amber-600">Go to Business Profile to add your agency name, logo, GST details, and contact info.</p>
                </div>
                <a href="/business-profile" className="text-sm font-medium text-amber-700 hover:text-amber-900 underline flex-shrink-0">
                  Set Up →
                </a>
              </div>
            )}

            {/* Search and Filter */}
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="relative flex-1 min-w-[160px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full text-sm"
                />
              </div>
              <div className="relative">
                <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white text-sm"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading bookings...</div>
            ) : filteredBookings.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarCheck className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                <p className="text-gray-500">There are no bookings matching your current filters.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Mobile card view */}
                <div className="block md:hidden divide-y divide-gray-100">
                  {filteredBookings.map((booking) => (
                    <div key={booking.id} className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{booking.customerName}</p>
                          <p className="text-xs text-gray-500 truncate">{booking.customerPhone}</p>
                        </div>
                        <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          booking.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>{booking.status || 'Pending'}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-700 line-clamp-1">{booking.packageTitle}</p>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500 space-x-2">
                          <span className="capitalize">{booking.sharingType} · {booking.numberOfPersons}p</span>
                          <span>· {booking.createdAt ? format(booking.createdAt.toDate(), 'MMM d') : 'N/A'}</span>
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">₹{booking.totalPrice?.toLocaleString?.() ?? booking.totalPrice}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button onClick={() => handleOpenView(booking)} className="flex-1 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-center">View</button>
                        {booking.status === 'Confirmed' && !noProfile && (
                          <button onClick={() => openInvoiceModal(booking)} className="flex-1 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors text-center flex items-center justify-center gap-1">
                            <FileText className="w-3 h-3" /> Invoice
                          </button>
                        )}
                        <button onClick={() => handleOpenEdit(booking)} className="flex-1 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors text-center">Edit</button>
                        <button onClick={() => handleDelete(booking.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Package</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Price</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredBookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{booking.customerName}</div>
                            <div className="text-sm text-gray-500">{booking.customerEmail}</div>
                            <div className="text-sm text-gray-500">{booking.customerPhone}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900 line-clamp-1">{booking.packageTitle}</div>
                            <div className="text-sm text-gray-500">Source: {booking.source || 'Website'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {booking.sharingType === 'double' && 'Double Sharing'}
                              {booking.sharingType === 'triple' && 'Triple Sharing'}
                              {booking.sharingType === 'quad' && 'Quad Sharing'}
                            </div>
                            <div className="text-sm text-gray-500">{booking.numberOfPersons} Persons</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">₹{booking.totalPrice?.toLocaleString?.() ?? booking.totalPrice}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              booking.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                              booking.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {booking.status || 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {booking.createdAt ? format(booking.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => handleOpenView(booking)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View Details"><Eye className="w-4 h-4" /></button>
                              {booking.status === 'Confirmed' && !noProfile && (
                                <button
                                  onClick={() => openInvoiceModal(booking)}
                                  className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                  title="Generate Invoice"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                              )}
                              <button onClick={() => handleOpenEdit(booking)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Edit Status"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => handleDelete(booking.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete Booking"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Edit Status Modal ── */}
      {isModalOpen && editingBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Update Booking Status</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Customer</p>
                <p className="font-medium text-gray-900">{editingBooking.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Package</p>
                <p className="font-medium text-gray-900">{editingBooking.packageTitle}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select 
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors">Cancel</button>
              <button onClick={handleSaveStatus} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Booking Modal ── */}
      {isViewModalOpen && viewingBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                  viewingBooking.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                  viewingBooking.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {viewingBooking.status || 'Pending'}
                </span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">{viewingBooking.source || 'Website'}</span>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Package</p>
                <p className="font-bold text-gray-900">{viewingBooking.packageTitle}</p>
                <div className="flex gap-4 mt-2 text-sm text-gray-600">
                  <span className="capitalize">{viewingBooking.sharingType} sharing</span>
                  <span>·</span>
                  <span>{viewingBooking.numberOfPersons} {viewingBooking.numberOfPersons === 1 ? 'person' : 'persons'}</span>
                  <span>·</span>
                  <span className="font-bold text-gray-900">₹{viewingBooking.totalPrice?.toLocaleString?.() ?? viewingBooking.totalPrice}</span>
                </div>
                {viewingBooking.travelDate && (
                  <p className="text-sm text-gray-500 mt-1">Travel Date: {viewingBooking.travelDate}</p>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Customer</p>
                <div className="space-y-1.5">
                  <p className="font-semibold text-gray-900">{viewingBooking.customerName}</p>
                  {viewingBooking.customerPhone && <p className="text-sm text-gray-600">{viewingBooking.customerPhone}</p>}
                  {viewingBooking.customerEmail && <p className="text-sm text-gray-600">{viewingBooking.customerEmail}</p>}
                  {viewingBooking.state && <p className="text-sm text-gray-600">{viewingBooking.city ? `${viewingBooking.city}, ` : ''}{viewingBooking.state}</p>}
                  {viewingBooking.leadSource && <p className="text-sm text-gray-500">Source: {viewingBooking.leadSource}</p>}
                </div>
              </div>

              {viewingBooking.customFields && Object.keys(viewingBooking.customFields).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Additional Info</p>
                  <div className="space-y-2 bg-gray-50 rounded-xl p-4 border border-gray-100">
                    {Object.entries(viewingBooking.customFields).map(([key, val]) => (
                      <div key={key} className="flex justify-between gap-3 text-sm">
                        <span className="text-gray-500 capitalize">{key.replace(/^cf_\d+_?/, '').replace(/_/g, ' ')}</span>
                        <span className="font-medium text-gray-900 text-right">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewingBooking.createdAt && (
                <p className="text-xs text-gray-400">Submitted on {format(viewingBooking.createdAt.toDate(), 'MMM d, yyyy h:mm a')}</p>
              )}
            </div>
            <div className="p-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
              {viewingBooking.status === 'Confirmed' && !noProfile && (
                <button onClick={() => { setIsViewModalOpen(false); openInvoiceModal(viewingBooking); }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> Generate Invoice
                </button>
              )}
              <button onClick={() => { setIsViewModalOpen(false); handleOpenEdit(viewingBooking); }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors">
                Edit Status
              </button>
              <button onClick={() => setIsViewModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium text-sm transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Booking Modal ── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">Create New Booking</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleCreateBooking} className="p-6 space-y-6">
              {/* Package Selection */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Select Package *</label>
                <select
                  required
                  value={createFormData.packageId}
                  onChange={e => setCreateFormData({...createFormData, packageId: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">-- Select a Package --</option>
                  {packages.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>{pkg.title} ({pkg.destination})</option>
                  ))}
                </select>
              </div>

              {/* Show pricing if package selected */}
              {createFormData.packageId && (() => {
                const pkg = packages.find(p => p.id === createFormData.packageId);
                if (!pkg) return null;
                return (
                  <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 text-sm text-indigo-800 flex gap-4 flex-wrap">
                    {pkg.priceDouble > 0 && <span>Double: ₹{pkg.priceDouble?.toLocaleString('en-IN')}/person</span>}
                    {pkg.priceTriple > 0 && <span>Triple: ₹{pkg.priceTriple?.toLocaleString('en-IN')}/person</span>}
                    {pkg.priceQuad > 0 && <span>Quad: ₹{pkg.priceQuad?.toLocaleString('en-IN')}/person</span>}
                  </div>
                );
              })()}

              {/* Customer Details Section */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">Customer Details</p>
                </div>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Full Name *</label>
                      <input required type="text" value={createFormData.customerName} onChange={e => setCreateFormData({...createFormData, customerName: e.target.value})} className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="Customer full name" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Email *</label>
                      <input required type="email" value={createFormData.customerEmail} onChange={e => setCreateFormData({...createFormData, customerEmail: e.target.value})} className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="customer@email.com" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Phone *</label>
                      <input required type="tel" value={createFormData.customerPhone} onChange={e => setCreateFormData({...createFormData, customerPhone: e.target.value})} className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="+91-XXXXXXXXXX" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Travel Date</label>
                      <input type="date" value={createFormData.travelDate} onChange={e => setCreateFormData({...createFormData, travelDate: e.target.value})} className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Address</label>
                    <input type="text" value={createFormData.customerAddress} onChange={e => setCreateFormData({...createFormData, customerAddress: e.target.value})} className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="Street address" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">City</label>
                      <input type="text" value={createFormData.customerCity} onChange={e => setCreateFormData({...createFormData, customerCity: e.target.value})} className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="City" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">State</label>
                      <input type="text" value={createFormData.customerState} onChange={e => setCreateFormData({...createFormData, customerState: e.target.value})} className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="State" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Select Ticket(s) */}
              {createFormData.packageId && (() => {
                const pkg = packages.find(p => p.id === createFormData.packageId);
                if (!pkg) return null;
                const availableTicketTypes = [
                  { type: 'double', label: 'Dual Occupancy', price: pkg.priceDouble || 0 },
                  { type: 'triple', label: 'Triple Occupancy', price: pkg.priceTriple || 0 },
                  { type: 'quad', label: 'Quad Occupancy', price: pkg.priceQuad || 0 },
                ].filter(t => t.price > 0);

                const tp = getTotalPersons(createFormData.ticketQty);
                const total = calcTotalPrice(createFormData.ticketQty, pkg);

                return (
                  <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Select Ticket(s)</p>
                        <p className="text-xs text-gray-400">Choose quantity for each sharing type</p>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      {availableTicketTypes.map(t => (
                        <div key={t.type} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900">{t.label}</p>
                            <p className="text-xs text-gray-500">₹{t.price?.toLocaleString('en-IN')} per person</p>
                          </div>
                          <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 shadow-sm p-0.5">
                            <button type="button"
                              onClick={() => setCreateFormData(prev => ({
                                ...prev, 
                                ticketQty: { ...prev.ticketQty, [t.type]: Math.max(0, (prev.ticketQty[t.type] || 0) - 1) }
                              }))}
                              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 font-bold text-gray-600 transition-colors">
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-7 text-center font-bold text-sm text-gray-900">
                              {createFormData.ticketQty[t.type] || 0}
                            </span>
                            <button type="button"
                              onClick={() => setCreateFormData(prev => ({
                                ...prev, 
                                ticketQty: { ...prev.ticketQty, [t.type]: (prev.ticketQty[t.type] || 0) + 1 }
                              }))}
                              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 font-bold text-gray-600 transition-colors">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total: <strong className="text-gray-900">{tp} tickets</strong></span>
                      <span className="text-sm font-bold text-gray-900">₹{total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
                <textarea
                  value={createFormData.notes}
                  onChange={e => setCreateFormData({...createFormData, notes: e.target.value})}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
                  rows={2}
                  placeholder="Any special requirements or notes..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
                  Create Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Invoice Generation Modal ── */}
      {invoiceModalBooking && businessProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Generate Invoice</h2>
                <p className="text-xs text-gray-500 mt-0.5">{invoiceModalBooking.customerName} · {invoiceModalBooking.packageTitle}</p>
              </div>
              <button onClick={() => setInvoiceModalBooking(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-5">
              {/* Quick summary */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Package:</span> <span className="font-medium text-gray-900">{invoiceModalBooking.packageTitle}</span></div>
                <div><span className="text-gray-500">Persons:</span> <span className="font-medium text-gray-900">{invoiceModalBooking.numberOfPersons}</span></div>
                <div><span className="text-gray-500">Sharing:</span> <span className="font-medium text-gray-900 capitalize">{invoiceModalBooking.sharingType}</span></div>
                <div><span className="text-gray-500">Total:</span> <span className="font-bold text-gray-900">₹{invoiceModalBooking.totalPrice?.toLocaleString('en-IN')}</span></div>
              </div>

              {/* Amount Paid */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Amount Paid (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={invoiceAmountPaid}
                  onChange={e => setInvoiceAmountPaid(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-gray-50 focus:bg-white"
                  placeholder="0"
                />
                <p className="text-xs text-gray-400">Leave blank or 0 if no payment received yet</p>
              </div>

              {/* Participants */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Participant Names (optional)</label>
                {invoiceParticipants.map((p, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                    <input
                      value={p}
                      onChange={e => {
                        const arr = [...invoiceParticipants];
                        arr[i] = e.target.value;
                        setInvoiceParticipants(arr);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={`Participant ${i + 1}`}
                    />
                    {invoiceParticipants.length > 1 && (
                      <button type="button" onClick={() => setInvoiceParticipants(invoiceParticipants.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500 p-1">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setInvoiceParticipants([...invoiceParticipants, ''])} className="text-sm text-indigo-600 font-medium flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add Participant
                </button>
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Remarks (optional)</label>
                <textarea
                  value={invoiceRemarks}
                  onChange={e => setInvoiceRemarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-gray-50 focus:bg-white resize-none"
                  rows={2}
                  placeholder="Any notes for the invoice..."
                />
              </div>

              {/* GST Info */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 flex items-start gap-2">
                <FileText className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  GST: {businessProfile.gstRate}% ({businessProfile.gstType === 'igst' ? 'IGST' : 'SGST + CGST'})
                  {businessProfile.gstRate > 0 && ` — Tax: ₹${Math.round(invoiceModalBooking.totalPrice * businessProfile.gstRate / 100)}`}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-gray-50 rounded-b-2xl flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDownloadInvoice}
                disabled={generatingFor === invoiceModalBooking.id}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-medium transition-colors text-sm"
              >
                {generatingFor === invoiceModalBooking.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download PDF
              </button>
              <button
                onClick={handleEmailInvoice}
                disabled={emailingFor === invoiceModalBooking.id || !invoiceModalBooking.customerEmail}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-medium transition-colors text-sm"
              >
                {emailingFor === invoiceModalBooking.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                Email to Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Invoice History Panel ── */}
      {isHistoryOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-gray-400" /> Invoice History
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Stored locally in your browser</p>
              </div>
              <button onClick={() => setIsHistoryOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              {invoiceHistory.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No invoices generated yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoiceHistory.map((entry, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        entry.action === 'email' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {entry.action === 'email' ? <Mail className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 text-sm">#{entry.invoiceNumber}</span>
                          <span className="text-xs text-gray-400">·</span>
                          <span className="text-xs text-gray-500 truncate">{entry.customerName}</span>
                        </div>
                        <p className="text-xs text-gray-400 truncate">{entry.packageTitle} — ₹{entry.totalPrice?.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-gray-400">{new Date(entry.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                        <div className={`text-[10px] font-medium ${entry.action === 'email' ? 'text-indigo-600' : 'text-gray-500'}`}>
                          {entry.action === 'email' ? 'Emailed' : 'Downloaded'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
