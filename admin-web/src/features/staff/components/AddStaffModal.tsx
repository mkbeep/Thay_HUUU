import { useEffect, useState } from 'react';
import type { Role } from '../types/staff.types';

interface AddStaffModalProps {
  open: boolean;
  roles: Role[];
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (data: {
    full_name: string;
    email: string;
    password: string;
    role_id: string;
  }) => void;
}

const initialForm = {
  full_name: '',
  email: '',
  password: '',
  role_id: '',
};

export function AddStaffModal({
  open,
  roles,
  isSubmitting,
  onClose,
  onSubmit,
}: AddStaffModalProps) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm({
        ...initialForm,
        role_id: roles[0]?.id || '',
      });
      setErrors({});
    }
  }, [open, roles]);

  if (!open) return null;

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.full_name.trim()) next.full_name = 'Họ và tên là bắt buộc';
    if (!form.email.trim()) next.email = 'Email là bắt buộc';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Email không hợp lệ';
    }
    if (!form.password) next.password = 'Mật khẩu là bắt buộc';
    else if (form.password.length < 6) {
      next.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    if (!form.role_id) next.role_id = 'Vui lòng chọn vai trò';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      password: form.password,
      role_id: form.role_id,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Thêm nhân viên mới</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Họ và tên</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none text-gray-900 bg-white"
              placeholder="Nhập họ tên nhân viên"
              disabled={isSubmitting}
            />
            {errors.full_name && <p className="text-xs text-red-600 mt-1">{errors.full_name}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none text-gray-900 bg-white"
              placeholder="email@gourmet.tech"
              disabled={isSubmitting}
            />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none text-gray-900 bg-white"
              placeholder="Tối thiểu 6 ký tự"
              disabled={isSubmitting}
            />
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Vai trò</label>
            <select
              value={form.role_id}
              onChange={(e) => setForm({ ...form, role_id: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none text-gray-900 bg-white"
              disabled={isSubmitting || roles.length === 0}
            >
              {roles.length === 0 ? (
                <option value="">Chưa có vai trò</option>
              ) : (
                roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.role_name}
                  </option>
                ))
              )}
            </select>
            {errors.role_id && <p className="text-xs text-red-600 mt-1">{errors.role_id}</p>}
          </div>

          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || roles.length === 0}
              className="flex-1 px-6 py-3 bg-gradient-to-br from-[#AD2C00] to-[#D83900] text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Thêm nhân viên'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
