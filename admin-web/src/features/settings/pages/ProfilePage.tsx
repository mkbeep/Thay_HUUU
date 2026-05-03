import { useState } from 'react'
import { useAuthStore } from '../../../stores/authStore'
import { Camera, Mail, Phone, Briefcase, Calendar, Save } from 'lucide-react'

export default function ProfilePage() {
  const { user, updateProfile, updateAvatar } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    position: user?.position || ''
  })

  const handleSave = () => {
    updateProfile(formData)
    setIsEditing(false)
    alert('Cập nhật hồ sơ thành công!')
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        updateAvatar(reader.result as string)
        alert('Đã cập nhật ảnh đại diện!')
      }
      reader.readAsDataURL(file)
    }
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Quản trị viên'
      case 'manager':
        return 'Quản lý'
      case 'staff':
        return 'Nhân viên'
      default:
        return role
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Hồ Sơ Cá Nhân
        </h1>
        <p className="text-gray-600 mt-1">
          Quản lý thông tin cá nhân của bạn
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col items-center">
              <div className="relative group">
                <img
                  src={user?.avatar || 'https://via.placeholder.com/150'}
                  alt={user?.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-100"
                />
                <label className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Camera className="w-8 h-8 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mt-4">{user?.name}</h3>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <div className="mt-4 px-4 py-2 bg-gradient-to-br from-[#AD2C00] to-[#D83900] text-white rounded-full text-sm font-bold">
                {getRoleName(user?.role || '')}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-500 text-xs">Ngày tham gia</p>
                  <p className="font-semibold text-gray-900">
                    {user?.joinedDate ? new Date(user.joinedDate).toLocaleDateString('vi-VN') : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Briefcase className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-500 text-xs">Vị trí</p>
                  <p className="font-semibold text-gray-900">{user?.position || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Thông Tin Chi Tiết</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Chỉnh sửa
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setFormData({
                        name: user?.name || '',
                        email: user?.email || '',
                        phone: user?.phone || '',
                        position: user?.position || ''
                      })
                    }}
                    className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-gradient-to-br from-[#AD2C00] to-[#D83900] text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Lưu
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs uppercase tracking-widest font-bold text-gray-900 block mb-2">
                  Họ và tên
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-base font-medium text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                  />
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                    <span className="text-base font-medium text-gray-900">{user?.name}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest font-bold text-gray-900 block mb-2">
                  Email
                </label>
                {isEditing ? (
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-white border-2 border-gray-300 rounded-xl pl-11 pr-4 py-3 text-base font-medium text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-base font-medium text-gray-900">{user?.email}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest font-bold text-gray-900 block mb-2">
                  Số điện thoại
                </label>
                {isEditing ? (
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-white border-2 border-gray-300 rounded-xl pl-11 pr-4 py-3 text-base font-medium text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                      placeholder="0901234567"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-base font-medium text-gray-900">{user?.phone || 'Chưa cập nhật'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest font-bold text-gray-900 block mb-2">
                  Vị trí công việc
                </label>
                {isEditing ? (
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full bg-white border-2 border-gray-300 rounded-xl pl-11 pr-4 py-3 text-base font-medium text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                      placeholder="Quản trị viên hệ thống"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                    <Briefcase className="w-5 h-5 text-gray-400" />
                    <span className="text-base font-medium text-gray-900">{user?.position || 'Chưa cập nhật'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
