import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { StaffKpiCard } from '../components/StaffKpiCard';
import { StaffList } from '../components/StaffList';
import { RolesSidebar } from '../components/RolesSidebar';
import { AddStaffModal } from '../components/AddStaffModal';
import { ChangeRoleModal } from '../components/ChangeRoleModal';
import {
  useActiveStaffCount,
  useCreateStaff,
  useRoles,
  useStaffDirectory,
  useUpdateStaffRole,
} from '../hooks/useStaff';
import type { StaffMember } from '../types/staff.types';

const INITIAL_VISIBLE = 5;

export default function StaffPage() {
  const [showAllStaff, setShowAllStaff] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [changeRoleMember, setChangeRoleMember] = useState<StaffMember | null>(null);

  const {
    data: activeCount = 0,
    isLoading: isCountLoading,
    isError: isCountError,
  } = useActiveStaffCount();

  const {
    data: staffMembers = [],
    isLoading: isStaffLoading,
    isError: isStaffError,
  } = useStaffDirectory();

  const { data: roles = [], isLoading: isRolesLoading } = useRoles();

  const createStaffMutation = useCreateStaff();
  const updateRoleMutation = useUpdateStaffRole();

  const sortedStaff = useMemo(() => {
    return [...staffMembers].sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [staffMembers]);

  const displayedStaff = showAllStaff
    ? sortedStaff
    : sortedStaff.slice(0, INITIAL_VISIBLE);

  const handleAddStaff = async (data: {
    full_name: string;
    email: string;
    password: string;
    role_id: string;
  }) => {
    try {
      await createStaffMutation.mutateAsync(data);
      toast.success('Đã thêm nhân viên thành công');
      setShowAddModal(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể thêm nhân viên');
    }
  };

  const handleChangeRole = async (roleId: string) => {
    if (!changeRoleMember) return;

    try {
      await updateRoleMutation.mutateAsync({
        userId: changeRoleMember.id,
        payload: { role_id: roleId },
      });
      toast.success('Đã cập nhật vai trò thành công');
      setChangeRoleMember(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật vai trò');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">
            Quản lý Nhân sự
          </h2>
          <p className="text-gray-600">Điều hành đội ngũ và phân quyền hệ thống</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gradient-to-br from-[#AD2C00] to-[#D83900] text-white px-8 py-4 rounded-xl font-bold text-sm shadow-xl shadow-[#AD2C00]/30 hover:shadow-[#AD2C00]/40 transition-all active:scale-95"
        >
          Thêm nhân viên
        </button>
      </div>

      {isCountError ? (
        <p className="text-sm text-red-600 mb-4">Không thể tải số liệu nhân sự.</p>
      ) : (
        <StaffKpiCard count={activeCount} isLoading={isCountLoading} />
      )}

      <div className="grid grid-cols-12 gap-8">
        <section className="col-span-12 lg:col-span-8">
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
            <div className="p-6 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-lg text-gray-900">Danh sách nhân viên</h3>
              <span className="text-xs text-gray-500 font-medium">
                {staffMembers.length} nhân viên
              </span>
            </div>

            <StaffList
              staff={displayedStaff}
              isLoading={isStaffLoading}
              isError={isStaffError}
              onChangeRole={setChangeRoleMember}
            />

            {sortedStaff.length > INITIAL_VISIBLE && !isStaffLoading && !isStaffError && (
              <div className="p-6 text-center border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAllStaff(!showAllStaff)}
                  className="text-sm font-semibold text-[#AD2C00] hover:underline transition-all"
                >
                  {showAllStaff
                    ? 'Thu gọn'
                    : `Xem tất cả ${sortedStaff.length} nhân viên`}
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="col-span-12 lg:col-span-4">
          <RolesSidebar roles={roles} isLoading={isRolesLoading} />
        </section>
      </div>

      <AddStaffModal
        open={showAddModal}
        roles={roles}
        isSubmitting={createStaffMutation.isPending}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddStaff}
      />

      <ChangeRoleModal
        open={Boolean(changeRoleMember)}
        member={changeRoleMember}
        roles={roles}
        isSubmitting={updateRoleMutation.isPending}
        onClose={() => setChangeRoleMember(null)}
        onSubmit={handleChangeRole}
      />
    </div>
  );
}
