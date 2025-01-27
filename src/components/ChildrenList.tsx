'use client'

import { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'

interface Translations {
  childrenList: string
  addChild: string
  refresh: string
  name: string
  parent: string
  status: string
  lastUpdated: string
  actions: string
  view: string
  edit: string
  present: string
  absent: string
  pickedUp: string
  addNewChild: string
  editChild: string
  childDetails: string
  parentName: string
  parentEmail: string
  phoneNumber: string
  qrCode: string
  close: string
  delete: string
  cancel: string
  createChild: string
  saveChanges: string
  creating: string
  saving: string
  confirmDelete: string
  deleteConfirmationText: string
  deleting: string
  selectParent: string
  loading: string
  notAvailable: string
}

const translations = {
  en: {
    childrenList: "Children List",
    addChild: "Add Child",
    refresh: "Refresh",
    name: "Name",
    parent: "Parent",
    status: "Status",
    lastUpdated: "Last Updated",
    actions: "Actions",
    view: "View",
    edit: "Edit",
    present: "PRESENT",
    absent: "ABSENT",
    pickedUp: "PICKED UP",
    addNewChild: "Add New Child",
    editChild: "Edit Child",
    childDetails: "Child Details",
    parentName: "Parent Name",
    parentEmail: "Parent Email",
    phoneNumber: "Phone Number",
    qrCode: "QR Code",
    close: "Close",
    delete: "Delete",
    cancel: "Cancel",
    createChild: "Create Child",
    saveChanges: "Save Changes",
    creating: "Creating...",
    saving: "Saving...",
    confirmDelete: "Confirm Delete",
    deleteConfirmationText: "Are you sure you want to delete this child? This action cannot be undone. All associated attendance records will also be deleted.",
    deleting: "Deleting...",
    selectParent: "Select a parent",
    loading: "Loading...",
    notAvailable: "N/A"
  },
  ar: {
    childrenList: "قائمة الأطفال",
    addChild: "إضافة طفل",
    refresh: "تحديث",
    name: "الاسم",
    parent: "ولي الأمر",
    status: "الحالة",
    lastUpdated: "آخر تحديث",
    actions: "الإجراءات",
    view: "عرض",
    edit: "تعديل",
    present: "حاضر",
    absent: "غائب",
    pickedUp: "تم الاستلام",
    addNewChild: "إضافة طفل جديد",
    editChild: "تعديل بيانات الطفل",
    childDetails: "تفاصيل الطفل",
    parentName: "اسم ولي الأمر",
    parentEmail: "البريد الإلكتروني لولي الأمر",
    phoneNumber: "رقم الهاتف",
    qrCode: "رمز QR",
    close: "إغلاق",
    delete: "حذف",
    cancel: "إلغاء",
    createChild: "إنشاء طفل",
    saveChanges: "حفظ التغييرات",
    creating: "جاري الإنشاء...",
    saving: "جاري الحفظ...",
    confirmDelete: "تأكيد الحذف",
    deleteConfirmationText: "هل أنت متأكد من حذف هذا الطفل؟ لا يمكن التراجع عن هذا الإجراء. سيتم حذف جميع سجلات الحضور المرتبطة به أيضًا.",
    deleting: "جاري الحذف...",
    selectParent: "اختر ولي الأمر",
    loading: "جاري التحميل...",
    notAvailable: "غير متوفر"
  }
}

interface ChildrenListProps {
  language?: 'en' | 'ar'
}



interface AttendanceRecord {
  id: string
  date: string
  status: string
  checkInTime?: string
  checkOutTime?: string
}

interface Parent {
  id: string
  name: string
  email: string
  phoneNumber: string | null
}

interface Child {
  id: string
  name: string
  status: string
  qrCode: string
  attendanceRecords: AttendanceRecord[]
  parent: Parent
  createdAt: string
  updatedAt: string
}

interface ChildFormData {
  name: string
  parentId: string
  status: string
  qrCode?: string
}




const ChildrenList = ({ language = 'en' }: ChildrenListProps) => {
  const t = translations[language];
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [mode, setMode] = useState<'view' | 'edit' | 'create'>('view')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMainModal, setShowMainModal] = useState(false)
  const [availableParents, setAvailableParents] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [formData, setFormData] = useState<ChildFormData>({
    name: '',
    parentId: '',
    status: 'ABSENT',
    qrCode: '',
  })

  useEffect(() => {
    fetchChildren();
    fetchAvailableParents();
  }, [])

  const fetchChildren = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/children')
      if (!response.ok) throw new Error('Failed to fetch children')
      const data: Child[] = await response.json()
      
      // Create a Map to store unique children by name and parentId
      const uniqueChildrenMap = new Map();
      
      // For each child, keep only the latest record (based on updatedAt)
      data.forEach(child => {
        const key = `${child.name}-${child.parent.id}`;
        if (!uniqueChildrenMap.has(key) || 
            new Date(child.updatedAt) > new Date(uniqueChildrenMap.get(key).updatedAt)) {
          uniqueChildrenMap.set(key, child);
        }
      });

      // Convert Map back to array and sort by name
      const uniqueChildren = Array.from(uniqueChildrenMap.values())
        .sort((a, b) => a.name.localeCompare(b.name));

      setChildren(uniqueChildren);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }
  const fetchAvailableParents = async () => {
    try {
      const response = await fetch('/api/parents');
      if (!response.ok) throw new Error('Failed to fetch parents');
      const data = await response.json();
      setAvailableParents(data);
    } catch (error) {
      console.error('Error fetching parents:', error);
    }
  };
  //////////////////////////////////////
  const updateChildStatus = async (childId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/children/attendance/${childId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update status');
      }

      // Refresh the children list after successful update
      await fetchChildren();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update status');
    }
  };
  /////////////////////////////////////////////
  const handleCreateChild = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create child')
      }

      await fetchChildren()
      closeMainModal()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create child')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateChild = async () => {
    if (!selectedChild) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/children/${selectedChild.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update child')
      }

      await fetchChildren()
      closeMainModal()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update child')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteChild = async () => {
    if (!selectedChild) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/children/${selectedChild.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete child')
      }

      await fetchChildren()
      closeDeleteModal()
      closeMainModal()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete child')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openMainModal = (child: Child | null, mode: 'view' | 'edit' | 'create') => {
    setSelectedChild(child)
    setMode(mode)
    setShowMainModal(true)
    setError(null)

    if (child && mode === 'edit') {
      setFormData({
        name: child.name,
        parentId: child.parent.id,
        status: child.status,
      })
    } else if (mode === 'create') {
      setFormData({
        name: '',
        parentId: '',
        status: 'ABSENT',
        qrCode: ''
      })
    }
  }

  const closeMainModal = () => {
    setSelectedChild(null)
    setMode('view')
    setShowMainModal(false)
    setError(null)
    setFormData({
      name: '',
      parentId: '',
      status: 'ABSENT',
      qrCode: ''
    })
  }

  const openDeleteModal = () => {
    setShowDeleteModal(true)
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 text-green-800'
      case 'ABSENT':
        return 'bg-red-100 text-red-800'
      case 'PICKED_UP':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2">{t.loading}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">{t.childrenList}</h2>
        <div className="space-x-4">
          <button
            onClick={() => openMainModal(null, 'create')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            {t.addChild}
          </button>
          <button
            onClick={fetchChildren}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {t.refresh}
          </button>
        </div>
      </div>

      {/* Children Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.name}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.parent}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.status}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.lastUpdated}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {children.map((child) => (
                <tr key={child.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{child.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{child.parent.name}</div>
                    <div className="text-sm text-gray-500">{child.parent.phoneNumber || t.notAvailable}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={child.status}
                      onChange={(e) => updateChildStatus(child.id, e.target.value)}
                      className={`px-2 text-xs font-semibold rounded-full ${getStatusColor(child.status)}`}
                    >
                      <option value="PRESENT">{t.present}</option>
                      <option value="ABSENT">{t.absent}</option>
                      <option value="PICKED_UP">{t.pickedUp}</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(child.updatedAt).toLocaleDateString('en-GB', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
})}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => openMainModal(child, 'view')}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {t.view}
                    </button>
                    <button
                      onClick={() => openMainModal(child, 'edit')}
                      className="text-yellow-600 hover:text-yellow-900"
                    >
                      {t.edit}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Modal */}
      {showMainModal && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={closeMainModal} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {mode === 'create' ? t.addNewChild : mode === 'edit' ? t.editChild : t.childDetails}
              </h3>
              <button onClick={closeMainModal} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>

            {mode === 'view' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t.name}</label>
                    <p className="mt-1">{selectedChild?.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t.status}</label>
                    <p className="mt-1">{selectedChild?.status === 'PRESENT' ? t.present : 
                                      selectedChild?.status === 'ABSENT' ? t.absent : t.pickedUp}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t.parentName}</label>
                    <p className="mt-1">{selectedChild?.parent.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t.parentEmail}</label>
                    <p className="mt-1">{selectedChild?.parent.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t.phoneNumber}</label>
                    <p className="mt-1">{selectedChild?.parent.phoneNumber || t.notAvailable}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t.qrCode}</label>
                    <p className="mt-1">{selectedChild?.qrCode}</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    onClick={() => openMainModal(selectedChild, 'edit')}
                    className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200"
                  >
                    {t.edit}
                  </button>
                  <button
                    onClick={openDeleteModal}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                  >
                    {t.delete}
                  </button>
                  <button
                    onClick={closeMainModal}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    {t.close}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault()
                mode === 'create' ? handleCreateChild() : handleUpdateChild()
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t.name}</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t.status}</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="ABSENT">{t.absent}</option>
                      <option value="PRESENT">{t.present}</option>
                      <option value="PICKED_UP">{t.pickedUp}</option>
                    </select>
                  </div>
                  {mode === 'create' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t.parent}</label>
                      <select
                        value={formData.parentId}
                        onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">{t.selectParent}</option>
                        {availableParents.map((parent) => (
                          <option key={parent.id} value={parent.id}>
                            {parent.name} ({parent.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="mt-6 flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={closeMainModal}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {mode === 'create' ? t.creating : t.saving}
                        </>
                      ) : (
                        mode === 'create' ? t.createChild : t.saveChanges
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60]">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={closeDeleteModal} />
          <div className="fixed left-1/2 top-1/2 z-[60] w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">{t.confirmDelete}</h3>
            <p className="text-sm text-gray-500 mb-6">
              {t.deleteConfirmationText.replace('{name}', selectedChild?.name || '')}
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeDeleteModal}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleDeleteChild}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.deleting}
                  </>
                ) : (
                  t.delete
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChildrenList