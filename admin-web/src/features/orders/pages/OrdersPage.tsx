import { useState } from 'react'
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  X,
  Timer,
  Wifi,
  Bell,
  ChefHat
} from 'lucide-react'

// Types
interface OrderItem {
  name: string
  quantity: number
  note?: string
  cookLevel?: string
}

interface Order {
  id: string
  tableNumber: number
  items: OrderItem[]
  status: 'incoming' | 'preparing' | 'ready'
  timeElapsed: number // in minutes
  progress?: number // 0-100 for preparing orders
}

// Mock data
const mockOrders: Order[] = [
  {
    id: 'GT-9042',
    tableNumber: 12,
    items: [
      { name: 'Wagyu Truffle Burger', quantity: 2, note: 'Không hành, thêm sốt truffle riêng' },
      { name: 'Súp Tôm Hùm', quantity: 1 }
    ],
    status: 'incoming',
    timeElapsed: 12
  },
  {
    id: 'GT-9045',
    tableNumber: 4,
    items: [
      { name: 'Sò Điệp Áp Chảo', quantity: 1 },
      { name: 'Risotto Milanese', quantity: 1 }
    ],
    status: 'incoming',
    timeElapsed: 4
  },
  {
    id: 'GT-9043',
    tableNumber: 7,
    items: [
      { name: 'Mì Ý Hải Sản', quantity: 2 },
      { name: 'Salad Caesar', quantity: 1 }
    ],
    status: 'incoming',
    timeElapsed: 8
  },
  {
    id: 'GT-9041',
    tableNumber: 15,
    items: [
      { name: 'Pizza Margherita', quantity: 1 },
      { name: 'Nước Ép Cam', quantity: 2 }
    ],
    status: 'incoming',
    timeElapsed: 6
  },
  {
    id: 'GT-9038',
    tableNumber: 8,
    items: [
      { name: 'Bít Tết Ribeye 400g', quantity: 1, cookLevel: 'TÁI VỪA' },
      { name: 'Măng Tây Sốt Hollandaise', quantity: 1 }
    ],
    status: 'preparing',
    timeElapsed: 22,
    progress: 65
  },
  {
    id: 'GT-9040',
    tableNumber: 3,
    items: [
      { name: 'Cá Hồi Nướng', quantity: 1 },
      { name: 'Khoai Tây Nghiền', quantity: 1 }
    ],
    status: 'preparing',
    timeElapsed: 15,
    progress: 45
  },
  {
    id: 'GT-9035',
    tableNumber: 21,
    items: [
      { name: 'Bít Tết Súp Lơ Nướng', quantity: 1 },
      { name: 'Vịt Confit Sốt Cherry', quantity: 1 }
    ],
    status: 'ready',
    timeElapsed: 28
  }
]

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(mockOrders)
  const [showAlert, setShowAlert] = useState(true)

  const getOrdersByStatus = (status: Order['status']) => {
    return orders.filter(order => order.status === status)
  }

  const moveToStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ))
  }

  const removeOrder = (orderId: string) => {
    setOrders(orders.filter(order => order.id !== orderId))
  }

  const incomingOrders = getOrdersByStatus('incoming')
  const preparingOrders = getOrdersByStatus('preparing')
  const readyOrders = getOrdersByStatus('ready')

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold tracking-tight text-orange-700">
            Bếp Trực Tiếp
          </h1>
          <div className="hidden lg:flex items-center gap-3 bg-[#E5E2E1] px-4 py-2 rounded-full border border-stone-200">
            <Timer className="w-5 h-5 text-[#AD2C00]" />
            <span className="font-bold text-[#1C1B1B] text-sm">
              TB Chuẩn Bị: 14 phút
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#006A35]/10 text-[#006A35] rounded-full">
            <span className="w-2 h-2 bg-[#006A35] rounded-full animate-pulse"></span>
            <span className="font-bold text-sm">Hệ Thống Online</span>
          </div>
          <button className="p-2 text-stone-500 hover:text-orange-700 transition-colors">
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto -mx-8 px-8">
        <div className="flex gap-6 h-full min-w-[1000px] pb-6">
          {/* Column: Incoming */}
          <section className="flex-1 flex flex-col min-w-[320px]">
            <div className="flex items-center justify-between mb-6 px-2">
              <div className="flex items-center gap-3">
                <span className="w-2 h-8 bg-[#AD2C00] rounded-full"></span>
                <h3 className="text-xl font-extrabold text-[#1C1B1B] tracking-tight uppercase">
                  Đơn Mới
                </h3>
              </div>
              <span className="bg-[#E5E2E1] text-[#1C1B1B] px-3 py-1 rounded-full font-bold text-xs">
                {incomingOrders.length}
              </span>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar">
              {incomingOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-lg p-5 shadow-sm border-l-4 border-[#AD2C00] transition-all hover:-translate-y-1"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-bold text-[#AD2C00] tracking-widest uppercase">
                        #{order.id}
                      </span>
                      <h4 className="text-xl font-bold text-[#1C1B1B]">
                        Bàn {order.tableNumber}
                      </h4>
                    </div>
                    <div className={`px-3 py-1 rounded-full flex items-center gap-1 ${
                      order.timeElapsed > 10 
                        ? 'bg-[#FFDAD6] text-[#BA1A1A]' 
                        : 'bg-[#E5E2E1] text-[#1C1B1B]'
                    }`}>
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-bold">{order.timeElapsed}p</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {order.items.map((item, idx) => (
                      <li key={idx}>
                        <div className="flex justify-between">
                          <span className="text-[#1C1B1B] font-semibold">
                            {item.quantity}x {item.name}
                          </span>
                          {item.cookLevel && (
                            <span className="bg-[#F0EDED] px-2 py-0.5 rounded text-[10px] font-bold text-[#5F5E5E]">
                              {item.cookLevel}
                            </span>
                          )}
                        </div>
                        {item.note && (
                          <div className="bg-[#F0EDED] py-2 px-3 rounded-md mt-2">
                            <p className="text-xs text-[#5F5E5E] font-medium italic">
                              Ghi chú: {item.note}
                            </p>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => moveToStatus(order.id, 'preparing')}
                    className="w-full py-3 bg-gradient-to-r from-[#AD2C00] to-[#D83900] text-white rounded-full font-bold text-sm shadow-md hover:brightness-110 active:scale-95 transition-all"
                  >
                    Bắt Đầu Nấu
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Column: Preparing */}
          <section className="flex-1 flex flex-col min-w-[320px]">
            <div className="flex items-center justify-between mb-6 px-2">
              <div className="flex items-center gap-3">
                <span className="w-2 h-8 bg-[#5F5E5E] rounded-full"></span>
                <h3 className="text-xl font-extrabold text-[#1C1B1B] tracking-tight uppercase">
                  Đang Nấu
                </h3>
              </div>
              <span className="bg-[#E5E2E1] text-[#1C1B1B] px-3 py-1 rounded-full font-bold text-xs">
                {preparingOrders.length}
              </span>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar">
              {preparingOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow-sm border-l-4 border-[#5F5E5E] overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-xs font-bold text-[#5F5E5E] tracking-widest uppercase">
                          #{order.id}
                        </span>
                        <h4 className="text-xl font-bold text-[#1C1B1B]">
                          Bàn {order.tableNumber}
                        </h4>
                      </div>
                      <div className="bg-[#AD2C00]/10 text-[#AD2C00] px-3 py-1 rounded-full flex items-center gap-1">
                        <ChefHat className="w-4 h-4" />
                        <span className="text-xs font-bold">{order.timeElapsed}p</span>
                      </div>
                    </div>
                    <ul className="space-y-3 mb-6">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="flex justify-between items-center">
                          <span className="text-[#1C1B1B] font-semibold">
                            {item.quantity}x {item.name}
                          </span>
                          {item.cookLevel && (
                            <span className="bg-[#F0EDED] px-2 py-0.5 rounded text-[10px] font-bold text-[#5F5E5E]">
                              {item.cookLevel}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => moveToStatus(order.id, 'ready')}
                      className="w-full py-3 bg-[#5F5E5E] text-white rounded-full font-bold text-sm shadow-md hover:bg-[#474746] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Đánh Dấu Hoàn Thành
                    </button>
                  </div>
                  {/* Progress Bar */}
                  <div className="h-1 bg-[#F0EDED]">
                    <div
                      className="h-full bg-[#AD2C00] transition-all duration-1000"
                      style={{ width: `${order.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Column: Ready */}
          <section className="flex-1 flex flex-col min-w-[320px]">
            <div className="flex items-center justify-between mb-6 px-2">
              <div className="flex items-center gap-3">
                <span className="w-2 h-8 bg-[#006A35] rounded-full"></span>
                <h3 className="text-xl font-extrabold text-[#1C1B1B] tracking-tight uppercase">
                  Sẵn Sàng Phục Vụ
                </h3>
              </div>
              <span className="bg-[#006A35] text-white px-3 py-1 rounded-full font-bold text-xs">
                {readyOrders.length}
              </span>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar">
              {readyOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-[#006A35]/5 rounded-lg p-5 shadow-sm border border-[#006A35]/20"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-bold text-[#006A35] tracking-widest uppercase">
                        #{order.id}
                      </span>
                      <h4 className="text-xl font-bold text-[#1C1B1B]">
                        Bàn {order.tableNumber}
                      </h4>
                    </div>
                    <div className="bg-[#006A35] text-white px-3 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-bold">XONG</span>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-6 text-[#5F5E5E]">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="line-through opacity-50 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        {item.quantity}x {item.name}
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    <button
                      onClick={() => moveToStatus(order.id, 'preparing')}
                      className="flex-1 py-3 bg-[#E5E2E1] text-[#1C1B1B] rounded-full font-bold text-sm hover:bg-[#DCD9D9] transition-colors"
                    >
                      Quay Lại
                    </button>
                    <button
                      onClick={() => removeOrder(order.id)}
                      className="flex-1 py-3 bg-[#006A35] text-white rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#005228] transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Đã Phục Vụ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Real-time Alert */}
      {showAlert && (
        <div className="fixed bottom-10 right-10 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-5">
          <div className="bg-white/90 backdrop-blur-xl p-4 rounded-xl shadow-2xl border border-[#AD2C00]/20 flex items-center gap-4">
            <div className="w-12 h-12 bg-[#AD2C00] rounded-full flex items-center justify-center text-white shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h5 className="font-bold text-[#1C1B1B]">Khẩn: Bàn 8</h5>
              <p className="text-xs text-[#5F5E5E]">
                Đơn #GT-9038 đã vượt thời gian chuẩn bị 5 phút.
              </p>
            </div>
            <button
              onClick={() => setShowAlert(false)}
              className="p-1 hover:bg-[#F0EDED] rounded-full text-stone-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
