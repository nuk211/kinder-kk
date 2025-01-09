'use client';

import { useState, useEffect } from 'react';
import { Loader2, Eye, EyeOff, Key } from 'lucide-react';

interface Parent {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  password?: string;
}

interface ParentListProps {
  language?: 'en' | 'ar';
}

const translations = {
  en: {
    parentsList: "Parents List",
    addParent: "Add Parent",
    refresh: "Refresh",
    name: "Name",
    email: "Email",
    phone: "Phone",
    actions: "Actions",
    resetPassword: "Reset Password",
    edit: "Edit",
    delete: "Delete",
    addNewParent: "Add New Parent",
    editParent: "Edit Parent",
    cancel: "Cancel",
    createParent: "Create Parent",
    saveChanges: "Save Changes",
    creating: "Creating...",
    saving: "Saving...",
    confirmDelete: "Confirm Delete",
    deleteConfirmation: "Are you sure you want to delete",
    deleteWarning: "This action cannot be undone.",
    deleting: "Deleting...",
    managePassword: "Manage Password",
    newPassword: "New Password",
    enterNewPassword: "Enter new password",
    updatePassword: "Update Password",
    updating: "Updating...",
    loading: "Loading...",
    notAvailable: "N/A",
    phoneNumber: "Phone Number",
    password: "Password"
  },
  ar: {
    parentsList: "قائمة أولياء الأمور",
    addParent: "إضافة ولي أمر",
    refresh: "تحديث",
    name: "الاسم",
    email: "البريد الإلكتروني",
    phone: "الهاتف",
    actions: "الإجراءات",
    resetPassword: "إعادة تعيين كلمة المرور",
    edit: "تعديل",
    delete: "حذف",
    addNewParent: "إضافة ولي أمر جديد",
    editParent: "تعديل ولي الأمر",
    cancel: "إلغاء",
    createParent: "إنشاء ولي أمر",
    saveChanges: "حفظ التغييرات",
    creating: "جاري الإنشاء...",
    saving: "جاري الحفظ...",
    confirmDelete: "تأكيد الحذف",
    deleteConfirmation: "هل أنت متأكد من حذف",
    deleteWarning: "لا يمكن التراجع عن هذا الإجراء.",
    deleting: "جاري الحذف...",
    managePassword: "إدارة كلمة المرور",
    newPassword: "كلمة المرور الجديدة",
    enterNewPassword: "أدخل كلمة المرور الجديدة",
    updatePassword: "تحديث كلمة المرور",
    updating: "جاري التحديث...",
    loading: "جاري التحميل...",
    notAvailable: "غير متوفر",
    phoneNumber: "رقم الهاتف",
    password: "كلمة المرور"
  }
};

const ParentList = ({ language = 'en' }: ParentListProps) => {
  const t = translations[language];
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState<{[key: string]: boolean}>({});
  const togglePasswordVisibility = (parentId: string) => {
    setPasswordVisibility(prev => ({
      ...prev,
      [parentId]: !prev[parentId]
    }));
  };
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: ''
  });

  useEffect(() => {
    fetchParents();
  }, []);

  const fetchParents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/parents');
      if (!response.ok) throw new Error('Failed to fetch parents');
      const data = await response.json();
      setParents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = mode === 'create' ? '/api/parents' : `/api/parents/${selectedParent?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) throw new Error(`Failed to ${mode} parent`);
      
      await fetchParents();
      setShowModal(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${mode} parent`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedParent) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/parents/${selectedParent.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete parent');
      
      await fetchParents();
      setShowDeleteModal(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete parent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetPassword = async () => {
    if (!selectedParent || !formData.password) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/parents/${selectedParent.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: formData.password }),
      });
      
      if (!response.ok) throw new Error('Password Must Be 6 Characters');
      
      setShowPasswordModal(false);
      resetForm();
      alert('Password updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = (parent?: Parent) => {
    if (parent) {
      setMode('edit');
      setSelectedParent(parent);
      setFormData({
        name: parent.name,
        email: parent.email,
        phoneNumber: parent.phoneNumber || '',
        password: ''
      });
    } else {
      setMode('create');
      setSelectedParent(null);
      resetForm();
    }
    setShowModal(true);
  };

  const openDeleteModal = (parent: Parent) => {
    setSelectedParent(parent);
    setShowDeleteModal(true);
  };

  const openPasswordModal = (parent: Parent) => {
    setSelectedParent(parent);
    setFormData(prev => ({ ...prev, password: '' }));
    setShowPasswordModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phoneNumber: '',
      password: ''
    });
    setSelectedParent(null);
    setMode('create');
    setShowPassword(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
        <span className="ml-2">{t.loading}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{t.parentsList}</h2>
        <div className="space-x-4">
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            {t.addParent}
          </button>
          <button
            onClick={fetchParents}
            className="px-4 py-2 bg-white text-gray-700 rounded-md hover:bg-gray-50 border border-gray-300 transition-colors"
          >
            {t.refresh}
          </button>
        </div>
      </div>

      {/* Parents Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.name}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.email}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.phone}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {parents.map((parent) => (
              <tr key={parent.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{parent.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{parent.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{parent.phoneNumber || t.notAvailable}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => openPasswordModal(parent)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    {t.resetPassword}
                  </button>
                  <button
                    onClick={() => openModal(parent)}
                    className="text-yellow-600 hover:text-yellow-900 mr-4"
                  >
                    {t.edit}
                  </button>
                  <button
                    onClick={() => openDeleteModal(parent)}
                    className="text-red-600 hover:text-red-900"
                  >
                    {t.delete}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-50 z-50">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">
              {mode === 'create' ? t.addNewParent : t.editParent}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.name}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.email}</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.phoneNumber}</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>

                {mode === 'create' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t.password}</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        {mode === 'create' ? t.creating : t.saving}
                      </div>
                    ) : (
                      mode === 'create' ? t.createParent : t.saveChanges
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">{t.confirmDelete}</h3>
            <p className="text-gray-500 mb-6">
              {t.deleteConfirmation} {selectedParent?.name}? {t.deleteWarning}
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    {t.deleting}
                  </div>
                ) : (
                  t.delete
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Management Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">
              {t.managePassword} - {selectedParent?.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t.newPassword}</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:border-pink-500 focus:ring-pink-500"
                    placeholder={t.enterNewPassword}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                  >
                  {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleSetPassword}
                  disabled={isSubmitting || !formData.password}
                  className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50 flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      {t.updating}
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      {t.updatePassword}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentList;