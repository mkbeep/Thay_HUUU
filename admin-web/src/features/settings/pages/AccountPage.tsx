import { useState } from 'react'
import { useAuthStore } from '../../../stores/authStore'
import { Lock, Shield, Key, AlertTriangle, CheckCircle } from 'lucide-react'

export default function AccountPage() {
  const { user, updatePassword } = useAuthStore()
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  const [loading, setLoading] = useState(false)

  const handleChangePassword = async () => {
    if (passwordData.new !== passwordData.confirm) {
      alert('Mật khẩu mới không khớp!')
      return
    }

    if (passwordData.new.length < 6) {
      alert('Mật khẩu phải có ít nhất 6 ký tự!')
      return
    }

    setLoading(true)
    try {
      await updatePassword(passwordData.current, passwordData.new)
      alert('Đổi mật khẩu thành công!')
      setPasswordData({ current: '', new: '', confirm: '' })
      setShowChangePassword(false)
    } catch (error) {
      alert('Đổi mật khẩu thất bại!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Cài Đặt Tài Khoản
        </h1>
        <p className="text-gray-600 mt-1">
          Quản lý bảo mật và cài đặt tài khoản
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Thông Tin Tài Khoản</h2>
            <p className="text-sm text-gray-500">Thông tin đăng nhập và bảo mật</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-semibold text-gray-900">Email đăng nhập</p>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                Đã xác thực
              </span>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-semibold text-gray-900">Mật khẩu</p>
                  <p className="text-sm text-gray-600">••••••••</p>
                </div>
              </div>
              <button
                onClick={() => setShowChangePassword(!showChangePassword)}
                className="px-4 py-2 bg-[#AD2C00] text-white rounded-xl font-semibold hover:bg-[#D83900] transition-colors"
              >
                {showChangePassword ? 'Hủy' : 'Đổi mật khẩu'}
              </button>
            </div>
          </div>

          {showChangePassword && (
            <div className="p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border-2 border-[#AD2C00]/20">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Key className="w-5 h-5 text-[#AD2C00]" />
                Đổi Mật Khẩu
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-widest font-bold text-gray-900 block mb-2">
                    Mật khẩu hiện tại
                  </label>
                  <input
                    type="password"
                    value={passwordData.current}
                    onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                    className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-base font-medium text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest font-bold text-gray-900 block mb-2">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    value={passwordData.new}
                    onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                    className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-base font-medium text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest font-bold text-gray-900 block mb-2">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirm}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                    className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-base font-medium text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>

                <button
                  onClick={handleChangePassword}
                  disabled={loading || !passwordData.current || !passwordData.new || !passwordData.confirm}
                  className="w-full py-3 bg-gradient-to-br from-[#AD2C00] to-[#D83900] text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Xác nhận đổi mật khẩu
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bảo Mật</h2>
            <p className="text-sm text-gray-500">Cài đặt bảo mật tài khoản</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-semibold text-gray-900">Xác thực hai yếu tố (2FA)</p>
                <p className="text-sm text-gray-600">Tăng cường bảo mật tài khoản</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#AD2C00]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#AD2C00]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-semibold text-gray-900">Thông báo đăng nhập</p>
                <p className="text-sm text-gray-600">Nhận thông báo khi có đăng nhập mới</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#AD2C00]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#AD2C00]"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-900 mb-2">Vùng Nguy Hiểm</h3>
            <p className="text-sm text-red-700 mb-4">
              Các hành động sau đây không thể hoàn tác. Vui lòng cân nhắc kỹ trước khi thực hiện.
            </p>
            <button className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors">
              Vô hiệu hóa tài khoản
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
