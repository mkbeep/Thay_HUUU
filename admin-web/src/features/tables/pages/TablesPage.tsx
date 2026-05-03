import { useState } from 'react';

type TableStatus = 'available' | 'occupied' | 'billing';
type ZoneType = 'main' | 'terrace' | 'private';

interface Table {
  id: number;
  number: string;
  name: string;
  zone: ZoneType;
  capacity: string;
  location: string;
  status: TableStatus;
  qrCode: string;
}

export default function TablesPage() {
  const [selectedZone, setSelectedZone] = useState<ZoneType>('main');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [newTable, setNewTable] = useState({
    number: '',
    name: '',
    zone: 'main' as ZoneType,
    capacity: '',
    location: ''
  });

  const [tables, setTables] = useState<Table[]>([
    {
      id: 1,
      number: '01',
      name: 'Bàn Cửa Sổ',
      zone: 'main',
      capacity: '2-4 Khách',
      location: 'Trong nhà',
      status: 'available',
      qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=table-01'
    },
    {
      id: 2,
      number: '02',
      name: 'Bàn Trung Tâm',
      zone: 'main',
      capacity: '4-6 Khách',
      location: 'Trong nhà',
      status: 'occupied',
      qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=table-02'
    },
    {
      id: 3,
      number: '03',
      name: 'Bàn Góc',
      zone: 'main',
      capacity: '2 Khách',
      location: 'Trong nhà',
      status: 'billing',
      qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=table-03'
    },
    {
      id: 4,
      number: '04',
      name: 'Bàn Vườn',
      zone: 'main',
      capacity: '2-4 Khách',
      location: 'Trong nhà',
      status: 'available',
      qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=table-04'
    },
    {
      id: 5,
      number: '05',
      name: 'Bàn Sân Thượng 1',
      zone: 'terrace',
      capacity: '4 Khách',
      location: 'Ngoài trời',
      status: 'available',
      qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=table-05'
    },
    {
      id: 6,
      number: '06',
      name: 'Phòng VIP',
      zone: 'private',
      capacity: '8-10 Khách',
      location: 'Phòng riêng',
      status: 'available',
      qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=table-06'
    }
  ]);

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return {
          bg: 'bg-green-50',
          text: 'text-green-600',
          badge: 'bg-green-100',
          border: 'border-green-200',
          circle: 'bg-green-500'
        };
      case 'occupied':
        return {
          bg: 'bg-red-50',
          text: 'text-[#AD2C00]',
          badge: 'bg-red-100',
          border: 'border-red-200',
          circle: 'bg-[#AD2C00]'
        };
      case 'billing':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-600',
          badge: 'bg-blue-100',
          border: 'border-blue-200',
          circle: 'bg-blue-500'
        };
    }
  };

  const getStatusText = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return 'Trống';
      case 'occupied':
        return 'Đang dùng';
      case 'billing':
        return 'Thanh toán';
    }
  };

  const getZoneText = (zone: ZoneType) => {
    switch (zone) {
      case 'main':
        return 'Khu Chính';
      case 'terrace':
        return 'Sân Thượng';
      case 'private':
        return 'Phòng Riêng';
    }
  };

  const filteredTables = tables.filter(table => table.zone === selectedZone);

  const handleAddTable = () => {
    if (!newTable.number || !newTable.name) return;

    const table: Table = {
      id: tables.length + 1,
      number: newTable.number,
      name: newTable.name,
      zone: newTable.zone,
      capacity: newTable.capacity,
      location: newTable.location,
      status: 'available',
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=table-${newTable.number}`
    };

    setTables([...tables, table]);
    setShowAddModal(false);
    setNewTable({
      number: '',
      name: '',
      zone: 'main',
      capacity: '',
      location: ''
    });
  };

  const handleEditTable = (table: Table) => {
    setSelectedTable(table);
    setShowEditPanel(true);
  };

  const handleSaveEdit = () => {
    if (!selectedTable) return;

    setTables(tables.map(t => 
      t.id === selectedTable.id ? selectedTable : t
    ));
    setShowEditPanel(false);
    setSelectedTable(null);
  };

  const handleDeleteTable = (id: number) => {
    if (confirm('Bạn có chắc muốn xóa bàn này?')) {
      setTables(tables.filter(t => t.id !== id));
      setShowEditPanel(false);
      setSelectedTable(null);
    }
  };

  const handleViewQR = (table: Table) => {
    setSelectedTable(table);
    setShowQRModal(true);
  };

  const handlePrintQR = () => {
    window.print();
  };

  const handleDownloadQR = () => {
    if (!selectedTable) return;
    const link = document.createElement('a');
    link.href = selectedTable.qrCode;
    link.download = `QR-Ban-${selectedTable.number}.png`;
    link.click();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Sơ Đồ Bàn
          </h1>
          <div className="flex items-center gap-3 text-sm mt-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-gray-600">Trực tuyến</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
            <span className="text-gray-500">Cập nhật 10 giây trước</span>
          </div>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 py-3 px-6 bg-gradient-to-br from-[#AD2C00] to-[#D83900] text-white rounded-xl font-bold hover:shadow-lg transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-lg"></span>
          Thêm Bàn Mới
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-200">
          <button
            onClick={() => setSelectedZone('main')}
            className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              selectedZone === 'main'
                ? 'bg-white text-[#AD2C00] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Khu Chính
          </button>
          <button
            onClick={() => setSelectedZone('terrace')}
            className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              selectedZone === 'terrace'
                ? 'bg-white text-[#AD2C00] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sân Thượng
          </button>
          <button
            onClick={() => setSelectedZone('private')}
            className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              selectedZone === 'private'
                ? 'bg-white text-[#AD2C00] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Phòng Riêng
          </button>
        </div>

        <div className="flex items-center gap-6 px-6 py-3 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-gray-600 uppercase tracking-wider">Trống</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-3 h-3 rounded-full bg-[#AD2C00]"></span>
            <span className="text-gray-600 uppercase tracking-wider">Đang dùng</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="text-gray-600 uppercase tracking-wider">Thanh toán</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
        {filteredTables.map((table) => {
          const colors = getStatusColor(table.status);
          return (
            <div
              key={table.id}
              className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 relative border border-gray-100"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`${colors.badge} ${colors.text} px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest`}>
                  {getStatusText(table.status)}
                </div>
                <button 
                  onClick={() => handleViewQR(table)}
                  className="text-gray-300 hover:text-[#AD2C00] transition-colors"
                >
                  <span className="material-symbols-outlined">qr_code_2</span>
                </button>
              </div>

              <div className="text-center py-4">
                <div className={`w-20 h-20 mx-auto rounded-full ${colors.bg} border-4 border-white shadow-inner flex items-center justify-center mb-3`}>
                  <span className={`text-2xl font-bold ${colors.text}`}>{table.number}</span>
                </div>
                <h3 className="font-bold text-gray-900">{table.name}</h3>
                <p className="text-xs text-gray-500">{table.capacity} • {table.location}</p>
              </div>

              <div className="absolute inset-0 bg-white/95 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-3 transition-opacity p-6 backdrop-blur-sm">
                <button 
                  onClick={() => handleEditTable(table)}
                  className="w-full py-2.5 bg-[#AD2C00] text-white rounded-full font-bold text-sm shadow-md hover:bg-[#D83900] transition-colors"
                >
                  Chỉnh sửa bàn
                </button>
                <button 
                  onClick={() => handleViewQR(table)}
                  className="w-full py-2.5 bg-gray-100 text-gray-900 rounded-full font-bold text-sm hover:bg-gray-200 transition-colors"
                >
                  Xem mã QR
                </button>
                {table.status === 'available' && (
                  <button 
                    onClick={() => handleDeleteTable(table.id)}
                    className="w-full py-2.5 border-2 border-red-200 text-red-600 rounded-full font-bold text-sm hover:bg-red-50 transition-colors"
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Thêm Bàn Mới</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-widest font-bold text-gray-900 block mb-2">
                  Số bàn
                </label>
                <input
                  type="text"
                  value={newTable.number}
                  onChange={(e) => setNewTable({ ...newTable, number: e.target.value })}
                  className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-base font-medium text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                  placeholder="01"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest font-bold text-gray-900 block mb-2">
                  Tên bàn
                </label>
                <input
                  type="text"
                  value={newTable.name}
                  onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
                  className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-base font-medium text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                  placeholder="Bàn Cửa Sổ"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest font-bold text-gray-900 block mb-2">
                  Khu vực
                </label>
                <select
                  value={newTable.zone}
                  onChange={(e) => setNewTable({ ...newTable, zone: e.target.value as ZoneType })}
                  className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-base font-medium text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                >
                  <option value="main">Khu Chính</option>
                  <option value="terrace">Sân Thượng</option>
                  <option value="private">Phòng Riêng</option>
                </select>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest font-bold text-gray-900 block mb-2">
                  Sức chứa
                </label>
                <input
                  type="text"
                  value={newTable.capacity}
                  onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })}
                  className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-base font-medium text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                  placeholder="2-4 Khách"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest font-bold text-gray-900 block mb-2">
                  Vị trí
                </label>
                <input
                  type="text"
                  value={newTable.location}
                  onChange={(e) => setNewTable({ ...newTable, location: e.target.value })}
                  className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-base font-medium text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                  placeholder="Trong nhà"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleAddTable}
                className="flex-1 px-6 py-3 bg-gradient-to-br from-[#AD2C00] to-[#D83900] text-white rounded-xl font-bold hover:shadow-lg transition-all"
              >
                Thêm bàn
              </button>
            </div>
          </div>
        </div>
      )}

      {showQRModal && selectedTable && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Mã QR - Bàn {selectedTable.number}</h3>
                <p className="text-sm text-gray-500 mt-1">{selectedTable.name}</p>
              </div>
              <button 
                onClick={() => setShowQRModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 flex flex-col items-center justify-center mb-6">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <img
                  src={selectedTable.qrCode}
                  alt={`QR Code Bàn ${selectedTable.number}`}
                  className="w-48 h-48"
                />
              </div>
              <p className="text-xs text-gray-500 text-center mt-4 italic">
                Quét mã QR này để truy cập thực đơn điện tử cho Bàn {selectedTable.number}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDownloadQR}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg"></span>
                Tải xuống
              </button>
              <button
                onClick={handlePrintQR}
                className="flex-1 px-6 py-3 bg-gradient-to-br from-[#AD2C00] to-[#D83900] text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg"></span>
                In mã QR
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditPanel && selectedTable && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Chỉnh Sửa Bàn</h3>
                <p className="text-sm text-gray-500 mt-1">Quản lý thông tin Bàn {selectedTable.number}</p>
              </div>
              <button 
                onClick={() => setShowEditPanel(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-widest font-bold text-gray-900 block mb-2">
                  Số bàn
                </label>
                <input
                  type="text"
                  value={selectedTable.number}
                  onChange={(e) => setSelectedTable({ ...selectedTable, number: e.target.value })}
                  className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-base font-medium text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest font-bold text-gray-900 block mb-2">
                  Tên bàn
                </label>
                <input
                  type="text"
                  value={selectedTable.name}
                  onChange={(e) => setSelectedTable({ ...selectedTable, name: e.target.value })}
                  className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-base font-medium text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest font-bold text-gray-900 block mb-2">
                  Khu vực
                </label>
                <select
                  value={selectedTable.zone}
                  onChange={(e) => setSelectedTable({ ...selectedTable, zone: e.target.value as ZoneType })}
                  className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-base font-medium text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                >
                  <option value="main">Khu Chính</option>
                  <option value="terrace">Sân Thượng</option>
                  <option value="private">Phòng Riêng</option>
                </select>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest font-bold text-gray-900 block mb-2">
                  Trạng thái
                </label>
                <select
                  value={selectedTable.status}
                  onChange={(e) => setSelectedTable({ ...selectedTable, status: e.target.value as TableStatus })}
                  className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-base font-medium text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                >
                  <option value="available">Trống</option>
                  <option value="occupied">Đang dùng</option>
                  <option value="billing">Thanh toán</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <label className="text-xs uppercase tracking-widest font-bold text-gray-900 block mb-3">
                  Xem trước mã QR
                </label>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 flex flex-col items-center border-2 border-gray-200">
                  <div className="bg-white p-4 rounded-lg shadow-md">
                    <img
                      src={selectedTable.qrCode}
                      alt={`QR Code Bàn ${selectedTable.number}`}
                      className="w-32 h-32"
                    />
                  </div>
                  <p className="text-sm text-[#AD2C00] font-bold mt-3 flex items-center gap-1">
                    <span className="material-symbols-outlined text-base"></span>
                    Tự động tạo...
                  </p>
                </div>
                <p className="text-xs text-gray-700 text-center mt-3 font-medium">
                  Quét mã QR này sẽ dẫn khách hàng đến thực đơn điện tử cho Bàn {selectedTable.number}
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowEditPanel(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
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
