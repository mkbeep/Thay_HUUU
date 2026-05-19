import type { Role } from '../types/staff.types';

interface RolesSidebarProps {
  roles: Role[];
  isLoading?: boolean;
}

export function RolesSidebar({ roles, isLoading }: RolesSidebarProps) {
  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
      <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-gray-900">
        Vai trò hệ thống
      </h3>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-xl animate-pulse h-20" />
          ))}
        </div>
      ) : roles.length === 0 ? (
        <p className="text-sm text-gray-500">Chưa có vai trò nào.</p>
      ) : (
        <div className="space-y-4">
          {roles.map((role) => (
            <div key={role.id} className="p-4 bg-gray-50 rounded-xl">
              <span className="text-xs font-bold tracking-wider uppercase text-[#AD2C00]">
                {role.role_name}
              </span>
              {role.description && (
                <p className="text-xs text-gray-600 leading-relaxed mt-2">
                  {role.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
