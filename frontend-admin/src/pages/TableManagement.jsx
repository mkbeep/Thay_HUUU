import React, { useState } from 'react';

const TableManagement = () => {
  const [tables] = useState([
    { id: 1, number: 1, seats: 4, status: 'Trống', customer: null },
    { id: 2, number: 2, seats: 2, status: 'Đang phục vụ', customer: 'Nguyễn Văn A' },
    { id: 3, number: 3, seats: 6, status: 'Đang phục vụ', customer: 'Trần Thị B' },
    { id: 4, number: 4, seats: 4, status: 'Đã đặt', customer: 'Lê Văn C' },
    { id: 5, number: 5, seats: 8, status: 'Trống', customer: null },
    { id: 6, number: 6, seats: 2, status: 'Đang phục vụ', customer: 'Phạm Thị D' },
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Trống':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Đang phục vụ':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Đã đặt':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý bàn</h2>
          <p className="mt-1 text-sm text-gray-500">Theo dõi trạng thái bàn trong nhà hàng</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
            + Thêm bàn mới
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Tổng số bàn</p>
          <p className="text-2xl font-bold text-gray-900">{tables.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow">
          <p className="text-sm text-green-600">Bàn trống</p>
          <p className="text-2xl font-bold text-green-700">
            {tables.filter(t => t.status === 'Trống').length}
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow">
          <p className="text-sm text-blue-600">Đang phục vụ</p>
          <p className="text-2xl font-bold text-blue-700">
            {tables.filter(t => t.status === 'Đang phục vụ').length}
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow">
          <p className="text-sm text-yellow-600">Đã đặt</p>
          <p className="text-2xl font-bold text-yellow-700">
            {tables.filter(t => t.status === 'Đã đặt').length}
          </p>
        </div>
      </div>

      {/* Tables Grid - Responsive */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tables.map((table) => (
          <div
            key={table.id}
            className={`bg-white border-2 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer ${getStatusColor(table.status)}`}
          >
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {table.number}
              </div>
              <div className="text-sm text-gray-600 mb-3">
                {table.seats} chỗ ngồi
              </div>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(table.status)}`}>
                {table.status}
              </div>
              {table.customer && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">Khách hàng:</p>
                  <p className="text-sm font-medium text-gray-900">{table.customer}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableManagement;
