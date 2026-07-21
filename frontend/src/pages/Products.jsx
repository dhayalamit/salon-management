import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Package, Plus, Edit3, Trash2, AlertTriangle, Search, Tag, DollarSign, History, AlertCircle, CheckCircle } from 'lucide-react';
import Table from '../components/ui/Table.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Products() {
  const { showSuccess, showError } = useToast();

  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'low', 'out', 'movements'
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Hair Care',
    purchasePrice: '',
    sellingPrice: '',
    stockQuantity: 10,
    lowStockThreshold: 5,
  });

  useEffect(() => {
    fetchProducts();
    fetchMovements();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await client.get('/products');
      setProducts(res.data || []);
    } catch (err) {
      showError('Failed to load inventory products');
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async () => {
    try {
      const res = await client.get('/products/movements');
      setMovements(res.data || []);
    } catch (err) {
      console.error('Failed to load stock movements', err);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formData.name || formData.sellingPrice === '') {
      return showError('Product name and selling price are required');
    }

    try {
      if (editingProduct) {
        await client.put(`/products/${editingProduct.id}`, formData);
        showSuccess('Product inventory updated');
      } else {
        await client.post('/products', formData);
        showSuccess('New product added to inventory');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      showError('Failed to save product');
    }
  };

  const confirmDeleteProduct = async () => {
    if (!deleteConfirmId) return;
    try {
      await client.delete(`/products/${deleteConfirmId}`);
      showSuccess('Product removed');
      setDeleteConfirmId(null);
      fetchProducts();
    } catch (err) {
      showError('Failed to delete product');
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'Hair Care',
      purchasePrice: '',
      sellingPrice: '',
      stockQuantity: 10,
      lowStockThreshold: 5,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      category: p.category || 'Hair Care',
      purchasePrice: p.purchase_price || '',
      sellingPrice: p.selling_price || '',
      stockQuantity: p.stock_quantity || 0,
      lowStockThreshold: p.low_stock_threshold || 5,
    });
    setIsModalOpen(true);
  };

  const inStockCount = products.filter((p) => p.stock_quantity > p.low_stock_threshold).length;
  const lowStockCount = products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= (p.low_stock_threshold || 5)).length;
  const outOfStockCount = products.filter((p) => p.stock_quantity <= 0).length;

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.category || '').toLowerCase().includes(search.toLowerCase());
    if (activeTab === 'low') return matchesSearch && p.stock_quantity > 0 && p.stock_quantity <= (p.low_stock_threshold || 5);
    if (activeTab === 'out') return matchesSearch && p.stock_quantity <= 0;
    return matchesSearch;
  });

  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedData = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const columns = [
    {
      header: 'Product Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">
            <Package size={18} />
          </div>
          <div>
            <p className="font-semibold text-dark">{row.name}</p>
            <p className="text-xs text-dark/50 flex items-center gap-1">
              <Tag size={12} /> {row.category || 'General'}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Purchase & Selling Price',
      render: (row) => (
        <div>
          <p className="font-display text-sm font-bold text-dark">
            ₹{Number(row.selling_price).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-dark/40">Cost: ₹{Number(row.purchase_price || 0).toLocaleString('en-IN')}</p>
        </div>
      ),
    },
    {
      header: 'Stock Status',
      render: (row) => {
        const qty = Number(row.stock_quantity || 0);
        const threshold = Number(row.low_stock_threshold || 5);
        if (qty <= 0) {
          return (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 inline-flex items-center gap-1">
              <AlertCircle size={12} /> Out of Stock (0 units)
            </span>
          );
        }
        if (qty <= threshold) {
          return (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
              <AlertTriangle size={12} /> Low Stock ({qty} units)
            </span>
          );
        }
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
            <CheckCircle size={12} /> In Stock ({qty} units)
          </span>
        );
      },
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEditModal(row)}
            className="p-2 rounded-xl bg-[#F4F0E6] text-dark/70 hover:bg-dark hover:text-white transition-colors"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={() => setDeleteConfirmId(row.id)}
            className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const movementColumns = [
    {
      header: 'Date & Invoice',
      render: (row) => (
        <div>
          <p className="font-semibold text-dark">{row.invoice_number}</p>
          <p className="text-xs text-dark/50">{new Date(row.created_at).toLocaleDateString('en-IN')}</p>
        </div>
      ),
    },
    {
      header: 'Product Sold',
      render: (row) => (
        <span className="font-semibold text-dark">{row.name}</span>
      ),
    },
    {
      header: 'Client',
      render: (row) => (
        <span className="text-xs text-dark/70">{row.customer_name || 'Walk-in Client'}</span>
      ),
    },
    {
      header: 'Qty Sold',
      render: (row) => (
        <span className="font-bold text-xs text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
          -{row.quantity || 1} units
        </span>
      ),
    },
    {
      header: 'Line Total',
      render: (row) => (
        <span className="font-bold text-xs text-dark">₹{Number(row.line_total || 0).toLocaleString('en-IN')}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-dark">Retail & Product Inventory</h1>
          <p className="text-xs text-dark/50">Manage hair care products, stock alerts, stock sales movements & pricing</p>
        </div>
      </div>

      {/* Stock Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveTab('all')}
          className={`glass-card p-5 cursor-pointer transition-all ${
            activeTab === 'all' ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/20' : ''
          }`}
        >
          <p className="text-xs font-semibold text-dark/50">Healthy Stock Items</p>
          <h3 className="font-display text-2xl font-bold text-emerald-700 mt-1">{inStockCount}</h3>
        </div>
        <div
          onClick={() => setActiveTab('low')}
          className={`glass-card p-5 cursor-pointer transition-all ${
            activeTab === 'low' ? 'border-amber-400 ring-2 ring-amber-400/20' : ''
          }`}
        >
          <p className="text-xs font-semibold text-dark/50">Low Stock Warning</p>
          <h3 className="font-display text-2xl font-bold text-amber-600 mt-1">{lowStockCount}</h3>
        </div>
        <div
          onClick={() => setActiveTab('out')}
          className={`glass-card p-5 cursor-pointer transition-all ${
            activeTab === 'out' ? 'border-red-400 ring-2 ring-red-400/20' : ''
          }`}
        >
          <p className="text-xs font-semibold text-dark/50">Out of Stock</p>
          <h3 className="font-display text-2xl font-bold text-red-600 mt-1">{outOfStockCount}</h3>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8DFCF] pb-2">
        {[
          { id: 'all', label: 'All Products' },
          { id: 'low', label: `Low Stock (${lowStockCount})` },
          { id: 'out', label: `Out of Stock (${outOfStockCount})` },
          { id: 'movements', label: 'Stock Sales Movement History' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-[#D4AF37] text-white shadow-sm'
                : 'bg-white/60 text-dark/70 hover:bg-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'movements' ? (
        <Table columns={movementColumns} data={movements} loading={false} />
      ) : (
        <Table
          columns={columns}
          data={paginatedData}
          loading={loading}
          searchQuery={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search product by name or category..."
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredProducts.length}
          itemsPerPage={itemsPerPage}
          actionButton={
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D4AF37] text-white font-semibold text-xs hover:bg-[#C59F2E] transition-all shadow-md"
            >
              <Plus size={16} /> Add Product
            </button>
          }
        />
      )}

      {/* Add / Edit Product Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? 'Edit Product' : 'Add New Product'}>
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-dark/70 mb-1.5">Product Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Luxe Argan Shampoo"
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Hair Care, Skin Care, Styling..."
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Selling Price (₹) *</label>
              <input
                type="number"
                required
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                placeholder="750"
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Purchase Cost (₹)</label>
              <input
                type="number"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                placeholder="350"
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Stock Quantity</label>
              <input
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Low Stock Alert Threshold</label>
              <input
                type="number"
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#E8DFCF]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 rounded-full border border-[#E8DFCF] text-xs font-semibold text-dark hover:bg-[#F4F0E6]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#D4AF37] text-white font-semibold text-xs hover:bg-[#C59F2E]"
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Product Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDeleteProduct}
        title="⚠️ Confirm Delete Product"
        message="Are you sure you want to delete this product from inventory? This action cannot be undone."
        confirmText="Delete Product"
        variant="danger"
      />
    </div>
  );
}
