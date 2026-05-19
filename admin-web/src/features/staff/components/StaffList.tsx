import { UserCog } from 'lucide-react';
import type { StaffMember } from '../types/staff.types';
import { formatRelativeTime, getDefaultAvatarUrl } from '../utils/formatRelativeTime';

interface StaffListProps {
  staff: StaffMember[];
  isLoading?: boolean;
  isError?: boolean;
  onChangeRole: (member: StaffMember) => void;
}

function StaffListSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} className="px-8 py-5 flex items-center gap-6 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
      ))}
    </>
  );
}

export function StaffList({
  staff,
  isLoading,
  isError,
  onChangeRole,
}: StaffListProps) {
  if (isLoading) {
    return <StaffListSkeleton />;
  }

  if (isError) {
    return (
      <div className="px-8 py-12 text-center">
        <p className="text-sm text-red-600">Không thể tải danh sách nhân viên.</p>
      </div>
    );
  }

  if (staff.length === 0) {
    return (
      <div className="px-8 py-16 text-center">
        <p className="text-gray-500 text-sm">Chưa có nhân viên nào.</p>
        <p className="text-gray-400 text-xs mt-1">Thêm nhân viên mới để bắt đầu.</p>
      </div>
    );
  }

  return (
    <>
      {staff.map((member) => {
        const statusLabel = member.is_active ? 'Hoạt động' : 'Không hoạt động';
        const avatar =
          member.avatar_url || getDefaultAvatarUrl(member.full_name || member.email);

        return (
          <div
            key={member.id}
            className="group px-8 py-5 flex items-center hover:bg-gray-50 transition-all"
          >
            <img
              className="w-12 h-12 rounded-full object-cover mr-6 border-2 border-white shadow-sm"
              src={avatar}
              alt={member.full_name}
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 truncate">{member.full_name}</h4>
              <p className="text-xs text-gray-500 truncate">{member.email}</p>
            </div>
            <div className="w-32 text-center shrink-0">
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-[10px] font-semibold tracking-wider uppercase">
                {member.role_name || '—'}
              </span>
            </div>
            <div className="w-32 text-center shrink-0">
              <div className="flex items-center justify-center gap-1.5">
                <div
                  className={`w-2 h-2 rounded-full ${
                    member.is_active ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
                <span
                  className={`text-xs font-medium ${
                    member.is_active ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  {statusLabel}
                </span>
              </div>
            </div>
            <div className="w-40 text-right pr-4 shrink-0">
              <p className="text-xs text-gray-500">
                {formatRelativeTime(member.created_at)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onChangeRole(member)}
              title="Đổi vai trò"
              className="p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 rounded-full text-[#AD2C00]"
            >
              <UserCog className="w-5 h-5" />
            </button>
          </div>
        );
      })}
    </>
  );
}
