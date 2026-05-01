import { DollarSign, ShoppingCart, Users, TrendingUp } from 'lucide-react'

const stats = [
  {
    name: 'Doanh thu hôm nay',
    value: '12.5M đ',
    change: '+12.5%',
    icon: DollarSign,
    color: 'bg-green-500',
  },
  {
    name: 'Đơn hàng',
    value: '48',
    change: '+8.2%',
    icon: ShoppingCart,
    color: 'bg-blue-500',
  },
  {
    name: 'Khách hàng',
    value: '156',
    change: '+15.3%',
    icon: Users,
    color: 'bg-purple-500',
  },
  {
    name: 'Tăng trưởng',
    value: '23.5%',
    change: '+4.1%',
    icon: TrendingUp,
    color: 'bg-orange-500',
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Tổng quan hoạt động nhà hàng</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stat.value}
                </p>
                <p className="text-sm text-green-600 mt-2">{stat.change}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Đơn hàng gần đây
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-primary-700 font-bold">#{i}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Bàn {i + 10}</p>
                    <p className="text-sm text-gray-600">
                      {i} món • {i * 150}k đ
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                  Đang nấu
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
