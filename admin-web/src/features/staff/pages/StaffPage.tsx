import { useState } from 'react';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'Quản lý' | 'Bếp trưởng' | 'Phục vụ';
  status: 'Hoạt động' | 'Không hoạt động';
  lastActive: string;
  avatar: string;
}

interface RolePermission {
  role: string;
  description: string;
  color: string;
}

interface AuditLog {
  id: string;
  user: string;
  action: string;
  timestamp: string;
}

export default function StaffPage() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([
    {
      id: '1',
      name: 'Minh Thư',
      email: 'minhthu@gourmet.tech',
      role: 'Quản lý',
      status: 'Hoạt động',
      lastActive: '2 giờ trước',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpFXRtsiNZvHG6TAm8DzODxrraQr2tZipKFNCgYOUca0QMGf0vWzpacu7_CfbI31nv8WHpxfStcPr48UnTXQjZS8FjwEsC_l8Os_YFzZuwNeV36C6Cz4Vn0WtpHDvBBsABVj9SoiIy-TEq2EuDeRaSfsyfCwWXdO-ee1UDqFiYxawSRzcPj0LB1P0H2e89MgA-hcxfvxlw-b07cfRRsHO7xvUSw13SwlLOmK7lmyDJrkvM3M_f_SLYpwyPxlDiTHYbGFXWP1qSYQ'
    },
    {
      id: '2',
      name: 'Quốc Bảo',
      email: 'baochef@gourmet.tech',
      role: 'Bếp trưởng',
      status: 'Hoạt động',
      lastActive: 'Hôm qua, 18:45',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCymwArTeB3lYx7HrE2N19vKv88L4gMwxu-abkHP2pPal2s3dBUQgonlgPxXmTHjPJehkwMFn9b2QxL7ArhtIriBc3TngQrOwN3skGK6V5FeCYwPL8f6gCWZc8CH1zngsxo19UlXPV5HqGXHPv0CH8_rl2CjlAj7shP5jiEMNYHQSlLRKcN7NiG7Q75YhD832HfGp48P0XFLPrqOgtAHhodnHuLWBnkx5scP345Zv3JKHLGA0jiEaOeBdcTgRpwhl6ca-_AoYsWkg'
    },
    {
      id: '3',
      name: 'Hoàng Nam',
      email: 'nam.server@gourmet.tech',
      role: 'Phục vụ',
      status: 'Không hoạt động',
      lastActive: '3 ngày trước',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBL672_3MIF1jFBXliSPPn7etAwvfFWAgxz6fSBc0Q75KaBbiRPJKnq3mRPF4Wb5gDgNsK-1yV4b1lgHjtnkydjq1hBxDIZIL5vf4r82nIe_BMH0pLg_2o1RzeYUEqIpXSMCTAeuI0yDzK_yKfiNCxlRiZ9uVZtbpaDFo4fBAS0f2ca2NvTzpSAtJOdOQPq7itgjq4o4Hs8gKZqU0CR2H63nAs5oIJCl6oHpfPWO7Xm9PCMsyCqE5MUuvwF04Kovdg3Pif5Td9scw'
    }
  ]);

  const [showAllStaff, setShowAllStaff] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    role: 'Phục vụ' as 'Quản lý' | 'Bếp trưởng' | 'Phục vụ'
  });

  const [rolePermissions] = useState<RolePermission[]>([
    {
      role: 'Quản lý',
      description: 'Toàn quyền quản lý menu, nhân viên, báo cáo tài chính và cấu hình hệ thống.',
      color: 'bg-gray-100 text-gray-700'
    },
    {
      role: 'Bếp trưởng',
      description: 'Quản lý kho nguyên liệu, trạng thái món ăn trong Kitchen View và chỉnh sửa menu.',
      color: 'bg-red-100 text-[#AD2C00]'
    },
    {
      role: 'Phục vụ',
      description: 'Quản lý bàn, đặt món (POS), xem trạng thái đơn hàng và thanh toán.',
      color: 'bg-gray-200 text-gray-600'
    }
  ]);

  const [auditLogs] = useState<AuditLog[]>([
    {
      id: '1',
      user: 'Minh Thư',
      action: "Đã cập nhật quyền hạn cho 'Hoàng Nam'",
      timestamp: '10:45 AM - Hôm nay'
    },
    {
      id: '2',
      user: 'Hệ thống',
      action: "Đã thêm nhân viên mới 'Thanh Sơn' (Phục vụ)",
      timestamp: 'Hôm qua'
    },
    {
      id: '3',
      user: 'Chef de Cuisine',
      action: "Khôi phục mật khẩu cho 'Quốc Bảo'",
      timestamp: '2 ngày trước'
    }
  ]);

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'Quản lý':
        return 'bg-gray-100 text-gray-700';
      case 'Bếp trưởng':
        return 'bg-red-100 text-[#AD2C00]';
      case 'Phục vụ':
        return 'bg-gray-200 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const handleAddStaff = () => {
    if (!newStaff.name || !newStaff.email) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    const newMember: StaffMember = {
      id: String(staffMembers.length + 1),
      name: newStaff.name,
      email: newStaff.email,
      role: newStaff.role,
      status: 'Hoạt động',
      lastActive: 'Vừa xong',
      avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(newStaff.name) + '&background=f97316&color=fff'
    };

    setStaffMembers([newMember, ...staffMembers]);
    setShowAddModal(false);
    setNewStaff({ name: '', email: '', role: 'Phục vụ' });
  };

  const displayedStaff = showAllStaff ? staffMembers : staffMembers.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">
            Quản lý Nhân sự
          </h2>
          <p className="text-gray-600">
            Điều hành đội ngũ và phân quyền hệ thống
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gradient-to-br from-[#AD2C00] to-[#D83900] text-white px-8 py-4 rounded-xl font-bold text-sm shadow-xl shadow-[#AD2C00]/30 hover:shadow-[#AD2C00]/40 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined"></span>
          Thêm nhân viên
        </button>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#AD2C00] p-6 rounded-xl text-white flex flex-col justify-between h-40">
          <span className="material-symbols-outlined opacity-60 text-3xl"></span>
          <div>
            <p className="text-3xl font-bold">32</p>
            <p className="text-xs font-semibold opacity-80 uppercase tracking-wider">
              Tổng nhân sự
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl flex flex-col justify-between h-40 shadow-sm border border-gray-100">
          <span className="material-symbols-outlined text-green-600 text-3xl">
           
          </span>
          <div>
            <p className="text-3xl font-bold text-gray-900">18</p>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Đang làm việc
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl flex flex-col justify-between h-40 shadow-sm border border-gray-100">
          <span className="material-symbols-outlined text-gray-600 text-3xl"></span>
          <div>
            <p className="text-3xl font-bold text-gray-900">02</p>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Đang nghỉ phép
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl flex flex-col justify-between h-40 shadow-sm border border-gray-100">
          <span className="material-symbols-outlined text-[#D83900] text-3xl"></span>
          <div>
            <p className="text-3xl font-bold text-gray-900">4.8</p>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Đánh giá trung bình
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-8">
        {/* Staff List Section */}
        <section className="col-span-12 lg:col-span-8">
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
            <div className="p-6 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-lg text-gray-900">Danh sách nhân viên</h3>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-white rounded-full text-xs font-semibold border border-gray-200 flex items-center gap-1 hover:bg-gray-50 transition-colors">
                  <span className="material-symbols-outlined text-sm"></span>
                  Vai trò
                </button>
                <button className="px-4 py-2 bg-white rounded-full text-xs font-semibold border border-gray-200 flex items-center gap-1 hover:bg-gray-50 transition-colors">
                  <span className="material-symbols-outlined text-sm"></span>
                  Mới nhất
                </button>
              </div>
            </div>

            <div className="divide-y-0">
              {displayedStaff.map((member) => (
                <div
                  key={member.id}
                  className="group px-8 py-5 flex items-center hover:bg-gray-50 transition-all"
                >
                  <img
                    className="w-12 h-12 rounded-full object-cover mr-6 border-2 border-white shadow-sm"
                    src={member.avatar}
                    alt={member.name}
                  />
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">{member.name}</h4>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                  <div className="w-32 text-center">
                    <span
                      className={`px-3 py-1 ${getRoleBadgeClass(
                        member.role
                      )} rounded-full text-[10px] font-semibold tracking-wider uppercase`}
                    >
                      {member.role}
                    </span>
                  </div>
                  <div className="w-32 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          member.status === 'Hoạt động' ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      ></div>
                      <span
                        className={`text-xs font-medium ${
                          member.status === 'Hoạt động' ? 'text-green-600' : 'text-gray-400'
                        }`}
                      >
                        {member.status}
                      </span>
                    </div>
                  </div>
                  <div className="w-40 text-right pr-4">
                    <p className="text-xs text-gray-500">{member.lastActive}</p>
                  </div>
                  <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 rounded-full">
                    <span className="material-symbols-outlined text-gray-500"></span>
                  </button>
                </div>
              ))}
            </div>

            <div className="p-6 text-center border-t border-gray-100">
              <button 
                onClick={() => setShowAllStaff(!showAllStaff)}
                className="text-sm font-semibold text-[#AD2C00] hover:underline transition-all"
              >
                {showAllStaff ? 'Thu gọn' : `Xem tất cả ${staffMembers.length} nhân viên`}
              </button>
            </div>
          </div>
        </section>

        {/* Role Permissions Section */}
        <section className="col-span-12 lg:col-span-4 flex flex-col gap-8">
          {/* Role Permissions Card */}
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-gray-900">
              <span className="material-symbols-outlined text-[#AD2C00]"></span>
              Phân quyền
            </h3>
            <div className="space-y-4">
              {rolePermissions.map((permission, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs font-bold tracking-wider uppercase ${permission.color}`}>
                      {permission.role}
                    </span>
                    <span className="material-symbols-outlined text-green-600 text-sm">
                      
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {permission.description}
                  </p>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setShowPermissionModal(true)}
              className="w-full mt-6 py-3 border-2 border-[#AD2C00] text-[#AD2C00] rounded-xl text-xs font-semibold hover:bg-[#AD2C00] hover:text-white transition-all"
            >
              Chỉnh sửa quyền hạn
            </button>
          </div>

          {/* Audit Log */}
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex-1">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-gray-900">
              <span className="material-symbols-outlined text-gray-600"></span>
              Nhật ký thay đổi
            </h3>
            <div className="space-y-6 relative before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-200">
              {auditLogs.map((log) => (
                <div key={log.id} className="relative pl-6">
                  <div className="absolute left-0 top-1 w-[12px] h-[12px] bg-[#AD2C00] rounded-full border-2 border-white shadow-sm"></div>
                  <p className="text-xs font-semibold text-gray-900">{log.user}</p>
                  <p className="text-[11px] text-gray-600 mb-1">{log.action}</p>
                  <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">
                    {log.timestamp}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Thêm nhân viên mới</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleAddStaff(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all text-gray-900 bg-white"
                  placeholder="Nhập họ tên nhân viên"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all text-gray-900 bg-white"
                  placeholder="email@gourmet.tech"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vai trò
                </label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value as any })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all text-gray-900 bg-white"
                >
                  <option value="Phục vụ">Phục vụ</option>
                  <option value="Bếp trưởng">Bếp trưởng</option>
                  <option value="Quản lý">Quản lý</option>
                </select>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-br from-[#AD2C00] to-[#D83900] text-white rounded-xl font-bold hover:shadow-lg transition-all"
                >
                  Thêm nhân viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permission Edit Modal */}
      {showPermissionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Chỉnh sửa quyền hạn</h3>
              <button 
                onClick={() => setShowPermissionModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {rolePermissions.map((permission, index) => (
                <div key={index} className="border-2 border-gray-200 rounded-xl p-6 hover:border-[#AD2C00] transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-lg text-gray-900">{permission.role}</h4>
                      <p className="text-xs text-gray-500">Vai trò hệ thống</p>
                    </div>
                    <button 
                      onClick={() => setEditingRole(editingRole === permission.role ? null : permission.role)}
                      className="px-4 py-2 bg-[#AD2C00] text-white rounded-lg text-sm font-semibold hover:bg-[#D83900] transition-all"
                    >
                      {editingRole === permission.role ? 'Thu gọn' : 'Chỉnh sửa'}
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">{permission.description}</p>
                  
                  {editingRole === permission.role && (
                    <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Quyền truy cập:</p>
                      <div className="space-y-3">
                        {index === 0 ? (
                          <>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" defaultChecked className="w-5 h-5 text-[#AD2C00] rounded focus:ring-[#AD2C00]" />
                              <span className="text-sm font-medium text-gray-700">Toàn quyền quản trị</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" defaultChecked className="w-5 h-5 text-[#AD2C00] rounded focus:ring-[#AD2C00]" />
                              <span className="text-sm font-medium text-gray-700">Quản lý menu</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" defaultChecked className="w-5 h-5 text-[#AD2C00] rounded focus:ring-[#AD2C00]" />
                              <span className="text-sm font-medium text-gray-700">Quản lý nhân viên</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" defaultChecked className="w-5 h-5 text-[#AD2C00] rounded focus:ring-[#AD2C00]" />
                              <span className="text-sm font-medium text-gray-700">Xem báo cáo tài chính</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" defaultChecked className="w-5 h-5 text-[#AD2C00] rounded focus:ring-[#AD2C00]" />
                              <span className="text-sm font-medium text-gray-700">Cài đặt hệ thống</span>
                            </label>
                          </>
                        ) : index === 1 ? (
                          <>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" defaultChecked className="w-5 h-5 text-[#AD2C00] rounded focus:ring-[#AD2C00]" />
                              <span className="text-sm font-medium text-gray-700">Quản lý kho nguyên liệu</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" defaultChecked className="w-5 h-5 text-[#AD2C00] rounded focus:ring-[#AD2C00]" />
                              <span className="text-sm font-medium text-gray-700">Truy cập Kitchen View</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" defaultChecked className="w-5 h-5 text-[#AD2C00] rounded focus:ring-[#AD2C00]" />
                              <span className="text-sm font-medium text-gray-700">Chỉnh sửa menu</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" defaultChecked className="w-5 h-5 text-[#AD2C00] rounded focus:ring-[#AD2C00]" />
                              <span className="text-sm font-medium text-gray-700">Xem đơn hàng</span>
                            </label>
                          </>
                        ) : (
                          <>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" defaultChecked className="w-5 h-5 text-[#AD2C00] rounded focus:ring-[#AD2C00]" />
                              <span className="text-sm font-medium text-gray-700">Quản lý bàn</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" defaultChecked className="w-5 h-5 text-[#AD2C00] rounded focus:ring-[#AD2C00]" />
                              <span className="text-sm font-medium text-gray-700">Đặt món (POS)</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" defaultChecked className="w-5 h-5 text-[#AD2C00] rounded focus:ring-[#AD2C00]" />
                              <span className="text-sm font-medium text-gray-700">Xem đơn hàng</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" defaultChecked className="w-5 h-5 text-[#AD2C00] rounded focus:ring-[#AD2C00]" />
                              <span className="text-sm font-medium text-gray-700">Thanh toán</span>
                            </label>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowPermissionModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  alert('Đã lưu thay đổi quyền hạn!');
                  setShowPermissionModal(false);
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-br from-[#AD2C00] to-[#D83900] text-white rounded-xl font-bold hover:shadow-lg transition-all"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
