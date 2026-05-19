import { useEffect, useState } from 'react';
import type { Role, StaffMember } from '../types/staff.types';

interface ChangeRoleModalProps {
  open: boolean;
  member: StaffMember | null;
  roles: Role[];
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (roleId: string) => void;
}

export function ChangeRoleModal({
  open,
  member,
  roles,
  isSubmitting,
  onClose,
  onSubmit,
}: ChangeRoleModalProps) {
  const [roleId, setRoleId] = useState('');

  useEffect(() => {
    if (open && member) {
      setRoleId(member.role_id || roles[0]?.id || '');
    }
  }, [open, member, roles]);

  if (!open || !member) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleId) return;
    onSubmit(roleId);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Đổi vai trò</h3>
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

        <div className="mb-6 p-4 bg-gray-50 rounded-xl space-y-1">
          <p className="font-semibold text-gray-900">{member.full_name}</p>
          <p className="text-sm text-gray-500">{member.email}</p>
          <p className="text-xs text-gray-600 mt-2">
            Vai trò hiện tại:{' '}
            <span className="font-semibold text-[#AD2C00]">
              {member.role_name || '—'}
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Vai trò mới
            </label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none text-gray-900 bg-white"
              disabled={isSubmitting || roles.length === 0}
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.role_name}
                </option>
              ))}
            </select>
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
              disabled={isSubmitting || !roleId || roleId === member.role_id}
              className="flex-1 px-6 py-3 bg-gradient-to-br from-[#AD2C00] to-[#D83900] text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Đang lưu...' : 'Cập nhật vai trò'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
