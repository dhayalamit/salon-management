import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, X, Calendar, Users, Package, Receipt, UserCog } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import client from '../../api/client.js';

export default function Topbar({ onMenuClick }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [greeting, setGreeting] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const searchRef = useRef(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = async (val) => {
    setSearchQuery(val);
    if (!val || val.trim().length < 2) {
      setSearchResults(null);
      return;
    }

    try {
      setSearchLoading(true);
      setIsSearchOpen(true);
      const res = await client.get('/search', { params: { q: val } });
      setSearchResults(res.data);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="px-4 pt-6 pb-4 sm:px-8 flex items-center justify-between gap-4 relative z-30">
      {/* Left Greeting & Always-Visible 3-Line Menu Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2.5 rounded-2xl glass-card text-dark hover:bg-white transition-colors flex items-center gap-2 shadow-sm"
          title="Open Menu"
        >
          <Menu size={18} />
          <img src="/logo.png" alt="TRIO Logo" className="h-7 w-7 object-contain" />
        </button>

        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-dark flex items-center gap-2">
            {greeting}, <span className="gold-text-gradient">{user?.name?.split(' ')[0] || 'Administrator'}</span>
          </h2>
          <p className="text-xs font-medium text-dark/50 mt-0.5">{formattedDate}</p>
        </div>
      </div>

      {/* Right Tools: Global Search Bar */}
      <div className="flex items-center gap-3">
        <div ref={searchRef} className="relative w-48 sm:w-64 lg:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/40 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setIsSearchOpen(true)}
            placeholder="Search clients, bills, staff, products..."
            className="w-full pl-10 pr-8 py-2.5 bg-white border border-[#E8DFCF] rounded-full text-xs text-dark placeholder:text-dark/40 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults(null);
                setIsSearchOpen(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/40 hover:text-dark"
            >
              <X size={14} />
            </button>
          )}

          {/* Search Dropdown Modal */}
          {isSearchOpen && searchResults && (
            <div className="absolute right-0 top-12 w-80 sm:w-96 glass-modal p-4 shadow-2xl max-h-[70vh] overflow-y-auto space-y-4 text-xs z-50">
              <div className="flex items-center justify-between border-b border-[#E8DFCF] pb-2">
                <span className="font-bold text-[#D4AF37] uppercase tracking-wider text-[10px]">Search Results</span>
                <span className="text-[10px] text-dark/40">Query: "{searchQuery}"</span>
              </div>

              {/* Customers */}
              {searchResults.customers?.length > 0 && (
                <div>
                  <p className="font-bold text-dark/60 uppercase text-[10px] tracking-wider mb-1.5 flex items-center gap-1">
                    <Users size={12} className="text-[#D4AF37]" /> Clients ({searchResults.customers.length})
                  </p>
                  <div className="space-y-1">
                    {searchResults.customers.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          navigate(`/customers/${c.id}`);
                          setIsSearchOpen(false);
                        }}
                        className="p-2 rounded-xl hover:bg-[#F4F0E6] cursor-pointer flex justify-between items-center transition-colors"
                      >
                        <span className="font-semibold text-dark">{c.name}</span>
                        <span className="text-dark/50 text-[11px]">{c.phone || 'No phone'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Appointments */}
              {searchResults.appointments?.length > 0 && (
                <div>
                  <p className="font-bold text-dark/60 uppercase text-[10px] tracking-wider mb-1.5 flex items-center gap-1">
                    <Calendar size={12} className="text-purple-600" /> Appointments ({searchResults.appointments.length})
                  </p>
                  <div className="space-y-1">
                    {searchResults.appointments.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => {
                          navigate('/appointments');
                          setIsSearchOpen(false);
                        }}
                        className="p-2 rounded-xl hover:bg-purple-50 cursor-pointer flex justify-between items-center transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-dark">{a.customer_name || 'Client'}</p>
                          <p className="text-[10px] text-dark/50">{a.service_name} • {a.appointment_date} {a.appointment_time}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-purple-100 text-purple-700">
                          {a.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoices */}
              {searchResults.invoices?.length > 0 && (
                <div>
                  <p className="font-bold text-dark/60 uppercase text-[10px] tracking-wider mb-1.5 flex items-center gap-1">
                    <Receipt size={12} className="text-emerald-600" /> Invoices ({searchResults.invoices.length})
                  </p>
                  <div className="space-y-1">
                    {searchResults.invoices.map((inv) => (
                      <div
                        key={inv.id}
                        onClick={() => {
                          navigate(`/billing/${inv.id}`);
                          setIsSearchOpen(false);
                        }}
                        className="p-2 rounded-xl hover:bg-emerald-50 cursor-pointer flex justify-between items-center transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-dark">{inv.invoice_number}</p>
                          <p className="text-[10px] text-dark/50">{inv.customer_name || 'Walk-in Client'}</p>
                        </div>
                        <span className="font-display font-bold text-emerald-700">₹{Number(inv.total).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Products */}
              {searchResults.products?.length > 0 && (
                <div>
                  <p className="font-bold text-dark/60 uppercase text-[10px] tracking-wider mb-1.5 flex items-center gap-1">
                    <Package size={12} className="text-amber-600" /> Products ({searchResults.products.length})
                  </p>
                  <div className="space-y-1">
                    {searchResults.products.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          navigate('/products');
                          setIsSearchOpen(false);
                        }}
                        className="p-2 rounded-xl hover:bg-amber-50 cursor-pointer flex justify-between items-center transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-dark">{p.name}</p>
                          <p className="text-[10px] text-dark/50">Stock: {p.stock_quantity} units</p>
                        </div>
                        <span className="font-display font-bold text-[#D4AF37]">₹{Number(p.selling_price).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Staff */}
              {searchResults.staff?.length > 0 && (
                <div>
                  <p className="font-bold text-dark/60 uppercase text-[10px] tracking-wider mb-1.5 flex items-center gap-1">
                    <UserCog size={12} className="text-blue-600" /> Staff ({searchResults.staff.length})
                  </p>
                  <div className="space-y-1">
                    {searchResults.staff.map((st) => (
                      <div
                        key={st.id}
                        onClick={() => {
                          navigate(`/staff/${st.id}`);
                          setIsSearchOpen(false);
                        }}
                        className="p-2 rounded-xl hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors"
                      >
                        <span className="font-semibold text-dark">{st.name}</span>
                        <span className="text-dark/50 text-[11px]">{st.phone || 'Stylist'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Object.values(searchResults).every((arr) => arr.length === 0) && (
                <p className="py-4 text-center text-dark/40 italic">No matching records found</p>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}