import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useTranslation } from '../../i18n';
import EmojiPicker from '../../components/EmojiPicker';

export default function ProductManagement() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', icon: '', color: '#3B82F6' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const resetForm = () => {
    setFormData({ name: '', slug: '', description: '', icon: '', color: '#3B82F6' });
    setShowForm(false);
    setEditingId(null);
    setError('');
  };

  const generateSlug = (name) => name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const slug = formData.slug || generateSlug(formData.name);
      await api.post('/products', { ...formData, slug });
      setSuccess('Product created');
      resetForm();
      fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to create product');
    }
  };

  const startEdit = (prod) => {
    setEditingId(prod.id);
    setFormData({ name: prod.name, slug: prod.slug || '', description: prod.description || '', icon: prod.icon || '', color: prod.color || '#3B82F6' });
    setShowForm(true);
    setError('');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.put(`/products/${editingId}`, formData);
      setSuccess('Product updated');
      resetForm();
      fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update product');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.productMgmt.deleteConfirm'))) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter(p => p.id !== id));
      setSuccess('Product deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleToggleActive = async (prod) => {
    try {
      await api.put(`/products/${prod.id}`, { isActive: !prod.isActive });
      fetchProducts();
    } catch (err) {
      console.error('Failed to toggle product:', err);
    }
  };

  if (loading) return <div className="p-8 text-gray-500 dark:text-gray-400">{t('common.loading')}</div>;

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('admin.productMgmt.title')}</h1>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="bg-[#50ba4b] text-white px-4 py-2 rounded-lg hover:bg-[#45a340] text-sm">
          {showForm && !editingId ? t('common.cancel') : t('admin.productMgmt.newButton')}
        </button>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}
      {success && <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-3 rounded-lg mb-4 text-sm">{success}</div>}

      {showForm && (
        <form onSubmit={editingId ? handleUpdate : handleCreate} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 transition-colors">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{editingId ? t('admin.productMgmt.editTitle') : t('admin.productMgmt.createTitle')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('admin.productMgmt.nameLabel')}</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('admin.productMgmt.slugLabel')}</label>
              <input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400" placeholder={t('admin.productMgmt.slugPlaceholder')} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('admin.productMgmt.descriptionLabel')}</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" rows="2" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('admin.productMgmt.iconLabel')}</label>
              <EmojiPicker value={formData.icon} onChange={(val) => setFormData({ ...formData, icon: val })} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('admin.productMgmt.colorLabel')}</label>
              <div className="flex gap-2">
                <input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-14 border border-gray-300 dark:border-gray-600 rounded cursor-pointer" />
                <input type="text" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="bg-[#50ba4b] text-white px-4 py-2 rounded-lg hover:bg-[#45a340] text-sm">
              {editingId ? t('admin.productMgmt.updateButton') : t('admin.productMgmt.createButton')}
            </button>
            <button type="button" onClick={resetForm} className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 text-sm">{t('common.cancel')}</button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors">
        <table className="w-full">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">{t('admin.productMgmt.tableProduct')}</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">{t('admin.productMgmt.tableDescription')}</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">{t('admin.productMgmt.tableStatus')}</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">{t('admin.productMgmt.tableOrder')}</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">{t('admin.productMgmt.tableActions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {products.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">{t('admin.productMgmt.noProducts')}</td></tr>
            ) : (
              products.map(prod => (
                <tr key={prod.id} className={!prod.isActive ? 'opacity-50' : ''}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {prod.icon && <span>{prod.icon}</span>}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{prod.name}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">{prod.slug}</div>
                      </div>
                      {prod.color && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: prod.color }}></div>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{prod.description || '-'}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleToggleActive(prod)}
                      className={`px-2 py-1 rounded-full text-xs ${prod.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {prod.isActive ? t('common.active') : t('common.inactive')}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{prod.displayOrder}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(prod)} className="text-[#50ba4b] hover:text-[#45a340] text-sm">{t('common.edit')}</button>
                      <button onClick={() => handleDelete(prod.id)} className="text-red-600 hover:text-red-800 text-sm">{t('common.delete')}</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
