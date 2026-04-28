import React, { useState } from 'react';

const OrderManagement = () => {
  const [orders] = useState([
    { id: 1234, table: 5, items: 3, total: 150000, status: 'Đang chế biến', time: '10:30' },
    { id: 1235, table: 3, items: 2, total: 95000, status: 'Chờ xác nhận', time: '10:35' },
    { id: 1236, table: 8, items: 5, total: 250000, status: 'Hoàn thành', time: '10:15' },
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Hoàn thành':
        return 'bg-green-100 text-green-800';
      case 'Đang chế biến':
        return 'bg-yellow-100 text-yellow-800';
      case 'Chờ xác nhận':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h2>
          <p className="mt-1 text-sm text-gray-500">Theo dõi và xử lý đơn hàng</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            Lọc
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
            Làm mới
          </button>
        </div>
      </div>

      {/* Orders Grid - Responsive */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {orders.map((order) => (
          <div key={order.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Đơn #{order.id}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Bàn:</span>
                  <span className="font-medium text-gray-900">{order.table}</span>
                </div>
                <div className="flex justify-between">
                  <span>Số món:</span>
                  <span className="font-medium text-gray-900">{order.items}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tổng tiền:</span>
                  <span className="font-medium text-gray-900">
                    {order.total.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Thời gian:</span>
                  <span className="font-medium text-gray-900">{order.time}</span>
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <button className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  Chi tiết
                </button>
                <button className="flex-1 px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
                  Xử lý
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderManagement;
