'use client';

import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CalendarCheck, Search, Filter, Trash2, Edit2, Plus } from 'lucide-react';
import { format } from 'date-fns';

export default function BookingsPage() {
  const { user, orgId, role } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any>(null);
  const [editStatus, setEditStatus] = useState('');
  const [packages, setPackages] = useState<any[]>([]);

  const [createFormData, setCreateFormData] = useState({
    packageId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    sharingType: 'double',
    numberOfPersons: 2
  });

  useEffect(() => {
    if (!orgId) return;

    // Fetch packages for the create booking dropdown
    const pkgsQuery = query(collection(db, 'packages'), where('orgId', '==', orgId));
    const unsubscribePkgs = onSnapshot(pkgsQuery, (snapshot) => {
      setPackages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const q = query(
      collection(db, 'bookings'), 
      where('orgId', '==', orgId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort in memory since we need a composite index for orderBy with where
      bks.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toMillis() || 0;
        const dateB = b.createdAt?.toMillis() || 0;
        return dateB - dateA;
      });
      setBookings(bks);
      setLoading(false);
    });

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

  const handleSaveStatus = async () => {
    if (!editingBooking) return;
    try {
      await updateDoc(doc(db, 'bookings', editingBooking.id), {
        status: editStatus
      });
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

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;

    const selectedPkg = packages.find(p => p.id === createFormData.packageId);
    if (!selectedPkg) return;

    let totalPrice = 0;
    const persons = Number(createFormData.numberOfPersons);
    if (createFormData.sharingType === 'double') totalPrice = selectedPkg.priceDouble * persons;
    if (createFormData.sharingType === 'triple') totalPrice = selectedPkg.priceTriple * persons;
    if (createFormData.sharingType === 'quad') totalPrice = selectedPkg.priceQuad * persons;

    try {
      await addDoc(collection(db, 'bookings'), {
        orgId,
        packageId: selectedPkg.id,
        packageTitle: selectedPkg.title,
        customerName: createFormData.customerName,
        customerEmail: createFormData.customerEmail,
        customerPhone: createFormData.customerPhone,
        sharingType: createFormData.sharingType,
        numberOfPersons: persons,
        totalPrice,
        status: 'Confirmed', // CRM bookings are usually confirmed
        source: 'CRM',
        createdAt: serverTimestamp()
      });
      setIsCreateModalOpen(false);
      setCreateFormData({
        packageId: '', customerName: '', customerEmail: '', customerPhone: '', sharingType: 'double', numberOfPersons: 2
      });
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Failed to create booking");
    }
  };

  if (!user || !orgId) return null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bookings</h1>
                <p className="text-gray-500 text-sm mt-1">Manage customer package bookings.</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Booking
                </button>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search bookings..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full md:w-64 text-sm"
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
                <div className="overflow-x-auto">
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
                            <div className="font-medium text-gray-900">${booking.totalPrice}</div>
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
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleOpenEdit(booking)}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                title="Edit Status"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete(booking.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete Booking"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">Create New Booking</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleCreateBooking} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Select Package</label>
                <select 
                  required
                  value={createFormData.packageId}
                  onChange={e => setCreateFormData({...createFormData, packageId: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">-- Select a Package --</option>
                  {packages.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>{pkg.title} ({pkg.destination})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Customer Name</label>
                  <input required type="text" value={createFormData.customerName} onChange={e => setCreateFormData({...createFormData, customerName: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Customer Email</label>
                  <input required type="email" value={createFormData.customerEmail} onChange={e => setCreateFormData({...createFormData, customerEmail: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Customer Phone</label>
                  <input required type="tel" value={createFormData.customerPhone} onChange={e => setCreateFormData({...createFormData, customerPhone: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Number of Persons</label>
                  <input required type="number" min="1" value={createFormData.numberOfPersons} onChange={e => setCreateFormData({...createFormData, numberOfPersons: parseInt(e.target.value) || 1})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Sharing Type</label>
                <select 
                  value={createFormData.sharingType}
                  onChange={e => setCreateFormData({...createFormData, sharingType: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="double">Double Sharing</option>
                  <option value="triple">Triple Sharing</option>
                  <option value="quad">Quad Sharing</option>
                </select>
              </div>

              <div className="pt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
                  Create Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
