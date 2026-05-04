import { 
  DollarSign, 
  ShoppingCart, 
  Receipt, 
  TrendingUp,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

// Types
type TimeFilter = 'daily' | 'weekly' | 'monthly'

interface Category {
  name: string
  revenue: number
  percentage: number
}

// Mock data generator
// TODO: Replace with real API calls to backend
// API endpoints needed:
// - GET /api/v1/reports/revenue?filter=daily|weekly|monthly&date=YYYY-MM-DD
// - GET /api/v1/reports/orders?filter=daily|weekly|monthly&date=YYYY-MM-DD
// - GET /api/v1/reports/best-sellers?filter=daily|weekly|monthly&date=YYYY-MM-DD
// - GET /api/v1/reports/categories?filter=daily|weekly|monthly&date=YYYY-MM-DD
const generateMockData = (filter: TimeFilter) => {
  // Calculate real percentage changes based on current vs previous data
  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return 0
    return Number((((current - previous) / previous) * 100).toFixed(1))
  }

  const data = {
    daily: {
      kpi: {
        totalRevenue: 12842500,
        previousRevenue: 11128000,
        get revenueChange() { return calculateChange(this.totalRevenue, this.previousRevenue) },
        completedOrders: 342,
        previousOrders: 315,
        get ordersChange() { return calculateChange(this.completedOrders, this.previousOrders) },
        avgOrderValue: 37550,
        previousAvgValue: 35325,
        get avgChange() { return calculateChange(this.avgOrderValue, this.previousAvgValue) },
        avgOrdersPerHour: 42.7,
      },
      chart: [
        { label: '12:00', height: 15, revenue: 450000 },
        { label: '14:00', height: 25, revenue: 750000 },
        { label: '16:00', height: 18, revenue: 540000 },
        { label: '18:00', height: 45, revenue: 1350000 },
        { label: '20:00', height: 65, revenue: 1950000 },
        { label: '22:00', height: 95, revenue: 2840000 },
        { label: '00:00', height: 30, revenue: 900000 },
        { label: '02:00', height: 20, revenue: 600000 },
      ],
      bestSellers: [
        {
          id: 1,
          name: 'Cá Hồi Tô',
          orders: 84,
          revenue: 3192000,
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmepLMxgB1Es1xxN0QONxayXLhHrjU4qHwpa_gmzhxXuCg6-J4hQilBcZ5EjDvOrqvXr_8K5mrzuGbeLFRwwLg6vNvZV6MSo0pkWAoiFkERw-ckJkkQP6a7kFrofNof8sb4FfGf2IpPeY7gGf4dRdLs3kjDdsIAXnG4i7rKPxesz63A4PUmroXoanTiZ-Tsv9uxvTlviMb31DWE5_4bw_7uhx3jMmuWQ3dVot2bKVh2-uEx3WdaeNm84cJAZ5a20ErFKYP0YbO7A'
        },
        {
          id: 2,
          name: 'Pizza Nấm Truffle',
          orders: 62,
          revenue: 1550000,
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBVyGD1v9VBN3UkQwKO0Rfj7OOjCRvSP7KHsDvgWdT3LBC6SZOf82QFH5CHQ6dMi0Gzw4ZAN9xhuu438GyG6QXMXiBPaT0nl1-ns2vG1nBlVHPy_oHugXxnBj06xn2YuhaJgghkTcGdmHxE3Wwh0It6KhOIldupbvgTW-eP6swfUbsAe_2HXF_HHHytohyLy43ohmGkJemgvAHu_bTkPB7lyS7xLVhzlmzQJF2XjXb_rhF50Ya9eeV58NN-y9AtLAkHvudm9dRIvQ'
        },
        {
          id: 3,
          name: 'Bánh Donut Socola',
          orders: 48,
          revenue: 864000,
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4NHy7QZE6iufpxpFI5BMsYjEteIhGSaSENlCn9FI6WsnT514B_ra0XtMGCMG_rlDibXH4HvMG02xoc_WkUeyhfNrPxHXS1ephQwZ_1h7u44AjifoiMO5imlpoXNagJXxowper5iRVq0zUXYXpRFBVypD8ozk-W5agJCI7QMGkpqMjFotHJlRAXHQaLSbaPkjapQTIMKJaga2CrEfOvCxRuPwJUyklfmcjBbvV5WjEDBxgLzvG_NrinL29FLGiy1c1nbwf7ewfHQ'
        }
      ],
      categories: [
        { name: 'Món Chính Đặc Biệt', revenue: 6420000, percentage: 65 },
        { name: 'Cocktail Cao Cấp', revenue: 3110000, percentage: 40 },
        { name: 'Khai Vị & Tapas', revenue: 2280000, percentage: 25 }
      ]
    },
    weekly: {
      kpi: {
        totalRevenue: 89896500,
        previousRevenue: 79896000,
        get revenueChange() { return calculateChange(this.totalRevenue, this.previousRevenue) },
        completedOrders: 2394,
        previousOrders: 2166,
        get ordersChange() { return calculateChange(this.completedOrders, this.previousOrders) },
        avgOrderValue: 37550,
        previousAvgValue: 36880,
        get avgChange() { return calculateChange(this.avgOrderValue, this.previousAvgValue) },
        avgOrdersPerHour: 342,
      },
      chart: [
        { label: 'T2', height: 45, revenue: 11200000 },
        { label: 'T3', height: 55, revenue: 13500000 },
        { label: 'T4', height: 50, revenue: 12300000 },
        { label: 'T5', height: 65, revenue: 15800000 },
        { label: 'T6', height: 85, revenue: 18900000 },
        { label: 'T7', height: 95, revenue: 21500000 },
        { label: 'CN', height: 75, revenue: 16696500 },
      ],
      bestSellers: [
        {
          id: 1,
          name: 'Cá Hồi Tô',
          orders: 588,
          revenue: 22344000,
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmepLMxgB1Es1xxN0QONxayXLhHrjU4qHwpa_gmzhxXuCg6-J4hQilBcZ5EjDvOrqvXr_8K5mrzuGbeLFRwwLg6vNvZV6MSo0pkWAoiFkERw-ckJkkQP6a7kFrofNof8sb4FfGf2IpPeY7gGf4dRdLs3kjDdsIAXnG4i7rKPxesz63A4PUmroXoanTiZ-Tsv9uxvTlviMb31DWE5_4bw_7uhx3jMmuWQ3dVot2bKVh2-uEx3WdaeNm84cJAZ5a20ErFKYP0YbO7A'
        },
        {
          id: 2,
          name: 'Pizza Nấm Truffle',
          orders: 434,
          revenue: 10850000,
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBVyGD1v9VBN3UkQwKO0Rfj7OOjCRvSP7KHsDvgWdT3LBC6SZOf82QFH5CHQ6dMi0Gzw4ZAN9xhuu438GyG6QXMXiBPaT0nl1-ns2vG1nBlVHPy_oHugXxnBj06xn2YuhaJgghkTcGdmHxE3Wwh0It6KhOIldupbvgTW-eP6swfUbsAe_2HXF_HHHytohyLy43ohmGkJemgvAHu_bTkPB7lyS7xLVhzlmzQJF2XjXb_rhF50Ya9eeV58NN-y9AtLAkHvudm9dRIvQ'
        },
        {
          id: 3,
          name: 'Bánh Donut Socola',
          orders: 336,
          revenue: 6048000,
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4NHy7QZE6iufpxpFI5BMsYjEteIhGSaSENlCn9FI6WsnT514B_ra0XtMGCMG_rlDibXH4HvMG02xoc_WkUeyhfNrPxHXS1ephQwZ_1h7u44AjifoiMO5imlpoXNagJXxowper5iRVq0zUXYXpRFBVypD8ozk-W5agJCI7QMGkpqMjFotHJlRAXHQaLSbaPkjapQTIMKJaga2CrEfOvCxRuPwJUyklfmcjBbvV5WjEDBxgLzvG_NrinL29FLGiy1c1nbwf7ewfHQ'
        }
      ],
      categories: [
        { name: 'Món Chính Đặc Biệt', revenue: 44940000, percentage: 65 },
        { name: 'Cocktail Cao Cấp', revenue: 21770000, percentage: 40 },
        { name: 'Khai Vị & Tapas', revenue: 15960000, percentage: 25 }
      ]
    },
    monthly: {
      kpi: {
        totalRevenue: 385680000,
        previousRevenue: 325480000,
        get revenueChange() { return calculateChange(this.totalRevenue, this.previousRevenue) },
        completedOrders: 10272,
        previousOrders: 8915,
        get ordersChange() { return calculateChange(this.completedOrders, this.previousOrders) },
        avgOrderValue: 37550,
        previousAvgValue: 36515,
        get avgChange() { return calculateChange(this.avgOrderValue, this.previousAvgValue) },
        avgOrdersPerHour: 342,
      },
      chart: [
        { label: 'T1', height: 35, revenue: 38568000 },
        { label: 'T2', height: 45, revenue: 46281600 },
        { label: 'T3', height: 55, revenue: 54022800 },
        { label: 'T4', height: 65, revenue: 61764000 },
        { label: 'T5', height: 50, revenue: 50000000 },
        { label: 'T6', height: 40, revenue: 42000000 },
        { label: 'T7', height: 30, revenue: 35000000 },
        { label: 'T8', height: 60, revenue: 58043400 },
      ],
      bestSellers: [
        {
          id: 1,
          name: 'Cá Hồi Tô',
          orders: 2520,
          revenue: 95760000,
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmepLMxgB1Es1xxN0QONxayXLhHrjU4qHwpa_gmzhxXuCg6-J4hQilBcZ5EjDvOrqvXr_8K5mrzuGbeLFRwwLg6vNvZV6MSo0pkWAoiFkERw-ckJkkQP6a7kFrofNof8sb4FfGf2IpPeY7gGf4dRdLs3kjDdsIAXnG4i7rKPxesz63A4PUmroXoanTiZ-Tsv9uxvTlviMb31DWE5_4bw_7uhx3jMmuWQ3dVot2bKVh2-uEx3WdaeNm84cJAZ5a20ErFKYP0YbO7A'
        },
        {
          id: 2,
          name: 'Pizza Nấm Truffle',
          orders: 1860,
          revenue: 46500000,
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBVyGD1v9VBN3UkQwKO0Rfj7OOjCRvSP7KHsDvgWdT3LBC6SZOf82QFH5CHQ6dMi0Gzw4ZAN9xhuu438GyG6QXMXiBPaT0nl1-ns2vG1nBlVHPy_oHugXxnBj06xn2YuhaJgghkTcGdmHxE3Wwh0It6KhOIldupbvgTW-eP6swfUbsAe_2HXF_HHHytohyLy43ohmGkJemgvAHu_bTkPB7lyS7xLVhzlmzQJF2XjXb_rhF50Ya9eeV58NN-y9AtLAkHvudm9dRIvQ'
        },
        {
          id: 3,
          name: 'Bánh Donut Socola',
          orders: 1440,
          revenue: 25920000,
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4NHy7QZE6iufpxpFI5BMsYjEteIhGSaSENlCn9FI6WsnT514B_ra0XtMGCMG_rlDibXH4HvMG02xoc_WkUeyhfNrPxHXS1ephQwZ_1h7u44AjifoiMO5imlpoXNagJXxowper5iRVq0zUXYXpRFBVypD8ozk-W5agJCI7QMGkpqMjFotHJlRAXHQaLSbaPkjapQTIMKJaga2CrEfOvCxRuPwJUyklfmcjBbvV5WjEDBxgLzvG_NrinL29FLGiy1c1nbwf7ewfHQ'
        }
      ],
      categories: [
        { name: 'Món Chính Đặc Biệt', revenue: 192840000, percentage: 65 },
        { name: 'Cocktail Cao Cấp', revenue: 93324000, percentage: 40 },
        { name: 'Khai Vị & Tapas', revenue: 68448000, percentage: 25 }
      ]
    }
  }
  
  return data[filter]
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('daily')
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const datePickerRef = useRef<HTMLDivElement>(null)

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false)
      }
    }

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDatePicker])

  // Get data based on time filter
  const currentData = useMemo(() => generateMockData(timeFilter), [timeFilter])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const getTimeLabel = () => {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('vi-VN', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      })
    }

    if (timeFilter === 'daily') {
      return formatDate(selectedDate)
    } else if (timeFilter === 'weekly') {
      const weekStart = new Date(selectedDate)
      weekStart.setDate(selectedDate.getDate() - selectedDate.getDay() + 1)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      return `${weekStart.getDate()}-${weekEnd.getDate()} ${weekEnd.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}`
    } else {
      return selectedDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
    }
  }

  const getChartTitle = () => {
    const titles = {
      daily: 'Phân Bố Doanh Thu Theo Giờ',
      weekly: 'Phân Bố Doanh Thu Theo Ngày',
      monthly: 'Phân Bố Doanh Thu Theo Tuần'
    }
    return titles[timeFilter]
  }

  const getChartSubtitle = () => {
    const subtitles = {
      daily: 'Lưu lượng cao nhất phát hiện từ 19:00 - 21:00',
      weekly: 'Cuối tuần có doanh thu cao nhất',
      monthly: 'Tuần 6 có doanh thu cao nhất trong tháng'
    }
    return subtitles[timeFilter]
  }

  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    setSelectedDate(newDate)
    setShowDatePicker(false)
  }

  const isToday = (day: number) => {
    const today = new Date()
    return day === today.getDate() && 
           currentMonth.getMonth() === today.getMonth() && 
           currentMonth.getFullYear() === today.getFullYear()
  }

  const isSelectedDate = (day: number) => {
    return day === selectedDate.getDate() && 
           currentMonth.getMonth() === selectedDate.getMonth() && 
           currentMonth.getFullYear() === selectedDate.getFullYear()
  }

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth)
  const monthName = currentMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#1C1B1B]">
            Động Lực Doanh Thu
          </h1>
          <p className="text-[#5F5E5E] mt-1 font-medium">
            Theo dõi hiệu suất thời gian thực cho {getTimeLabel()}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Date Picker Button */}
          <div className="relative" ref={datePickerRef}>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-lg hover:border-[#AD2C00]/40 transition-all shadow-sm"
            >
              <Calendar className="w-5 h-5 text-[#AD2C00]" />
              <span className="text-sm font-semibold text-[#1C1B1B]">
                {selectedDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
            </button>

            {/* Date Picker Dropdown */}
            {showDatePicker && (
              <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-2xl border border-stone-200 p-4 z-30 w-80">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={handlePreviousMonth}
                    className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-stone-600" />
                  </button>
                  <h3 className="text-base font-bold text-[#1C1B1B] capitalize">
                    {monthName}
                  </h3>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-stone-600" />
                  </button>
                </div>

                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
                    <div key={day} className="text-center text-xs font-bold text-stone-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for days before month starts */}
                  {Array.from({ length: startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1 }).map((_, index) => (
                    <div key={`empty-${index}`} className="aspect-square" />
                  ))}
                  
                  {/* Days of the month */}
                  {Array.from({ length: daysInMonth }).map((_, index) => {
                    const day = index + 1
                    const selected = isSelectedDate(day)
                    const today = isToday(day)
                    
                    return (
                      <button
                        key={day}
                        onClick={() => handleDateSelect(day)}
                        className={`aspect-square flex items-center justify-center text-sm font-semibold rounded-lg transition-all ${
                          selected
                            ? 'bg-[#AD2C00] text-white shadow-md'
                            : today
                            ? 'bg-[#AD2C00]/10 text-[#AD2C00] border-2 border-[#AD2C00]'
                            : 'hover:bg-stone-100 text-stone-700'
                        }`}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>

                {/* Quick Actions */}
                <div className="mt-4 pt-4 border-t border-stone-200 flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedDate(new Date())
                      setCurrentMonth(new Date())
                      setShowDatePicker(false)
                    }}
                    className="flex-1 px-3 py-2 text-sm font-semibold text-[#AD2C00] hover:bg-[#AD2C00]/10 rounded-lg transition-colors"
                  >
                    Hôm nay
                  </button>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="flex-1 px-3 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Time Filter Buttons */}
          <div className="flex bg-[#E5E2E1] p-1 rounded-full w-fit">
            <button
              onClick={() => setTimeFilter('daily')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                timeFilter === 'daily'
                  ? 'bg-white text-[#1C1B1B] shadow-sm'
                  : 'text-[#5F5E5E] hover:text-[#1C1B1B]'
              }`}
            >
              Hàng ngày
            </button>
            <button
              onClick={() => setTimeFilter('weekly')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                timeFilter === 'weekly'
                  ? 'bg-white text-[#1C1B1B] shadow-sm'
                  : 'text-[#5F5E5E] hover:text-[#1C1B1B]'
              }`}
            >
              Hàng tuần
            </button>
            <button
              onClick={() => setTimeFilter('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                timeFilter === 'monthly'
                  ? 'bg-white text-[#1C1B1B] shadow-sm'
                  : 'text-[#5F5E5E] hover:text-[#1C1B1B]'
              }`}
            >
              Hàng tháng
            </button>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI Card 1 - Total Revenue */}
        <div className="bg-white p-6 rounded-lg shadow-[0_32px_64px_rgba(28,27,27,0.05)] border-l-4 border-[#AD2C00] relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-[#AD2C00]/10 rounded-full text-[#AD2C00]">
              <DollarSign className="w-6 h-6" />
            </div>
            {/* Removed fake percentage badge */}
          </div>
          <p className="text-[#5F5E5E] text-sm font-medium uppercase tracking-widest">
            Tổng Doanh Thu
          </p>
          <h3 className="text-3xl font-black mt-1">{formatCurrency(currentData.kpi.totalRevenue)}</h3>
          <p className="text-stone-400 text-xs mt-4">
            so với {formatCurrency(currentData.kpi.previousRevenue)} {timeFilter === 'daily' ? 'hôm qua' : timeFilter === 'weekly' ? 'tuần trước' : 'tháng trước'}
          </p>
        </div>

        {/* KPI Card 2 - Completed Orders */}
        <div className="bg-white p-6 rounded-lg shadow-[0_32px_64px_rgba(28,27,27,0.05)] border-l-4 border-[#5F5E5E] relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-[#5F5E5E]/10 rounded-full text-[#5F5E5E]">
              <ShoppingCart className="w-6 h-6" />
            </div>
            {/* Removed fake percentage badge */}
          </div>
          <p className="text-[#5F5E5E] text-sm font-medium uppercase tracking-widest">
            Đơn Hoàn Thành
          </p>
          <h3 className="text-3xl font-black mt-1">{currentData.kpi.completedOrders.toLocaleString('vi-VN')}</h3>
          <p className="text-stone-400 text-xs mt-4">
            Trung bình {currentData.kpi.avgOrdersPerHour.toLocaleString('vi-VN')} đơn / {timeFilter === 'daily' ? 'giờ' : timeFilter === 'weekly' ? 'ngày' : 'tuần'}
          </p>
        </div>

        {/* KPI Card 3 - Average Order Value */}
        <div className="bg-white p-6 rounded-lg shadow-[0_32px_64px_rgba(28,27,27,0.05)] border-l-4 border-[#008645] relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-[#006A35]/10 rounded-full text-[#006A35]">
              <Receipt className="w-6 h-6" />
            </div>
            {/* Removed fake percentage badge */}
          </div>
          <p className="text-[#5F5E5E] text-sm font-medium uppercase tracking-widest">
            Giá Trị Đơn TB
          </p>
          <h3 className="text-3xl font-black mt-1">{formatCurrency(currentData.kpi.avgOrderValue)}</h3>
          <p className="text-stone-400 text-xs mt-4">
            so với {formatCurrency(currentData.kpi.previousAvgValue)} kỳ trước
          </p>
        </div>
      </div>

      {/* Bento Grid Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Chart Area (2/3 width) */}
        <div className="lg:col-span-2 bg-white rounded-lg p-8 shadow-[0_32px_64px_rgba(28,27,27,0.03)] h-full min-h-[480px] flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-xl font-bold">{getChartTitle()}</h2>
              <p className="text-sm text-[#5F5E5E]">
                {getChartSubtitle()}
              </p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-[#AD2C00]/5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#AD2C00]"></span>
                <span className="text-xs font-semibold text-[#AD2C00]">Trực tiếp</span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="flex-1 w-full relative group">
            {/* Y Axis */}
            <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[10px] font-bold text-stone-400 w-8 py-2">
              {timeFilter === 'daily' ? (
                <>
                  <span>3tr</span>
                  <span>2tr</span>
                  <span>1tr</span>
                  <span>0</span>
                </>
              ) : timeFilter === 'weekly' ? (
                <>
                  <span>22tr</span>
                  <span>15tr</span>
                  <span>7tr</span>
                  <span>0</span>
                </>
              ) : (
                <>
                  <span>65tr</span>
                  <span>43tr</span>
                  <span>22tr</span>
                  <span>0</span>
                </>
              )}
            </div>

            {/* Chart Bars */}
            <div className="ml-10 h-full border-b border-stone-100 flex items-end justify-between pb-8 pt-4 gap-2">
              {currentData.chart.map((data, index) => {
                const isHighlighted = timeFilter === 'daily' ? index === 5 : index === currentData.chart.length - 2
                return (
                  <div
                    key={index}
                    className="flex-1 relative group/bar"
                    onMouseEnter={() => setHoveredBar(index)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    <div
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        isHighlighted
                          ? 'bg-[#AD2C00] shadow-[0_-10px_20px_rgba(173,44,0,0.2)]'
                          : 'bg-[#F0EDED] group-hover/bar:bg-[#AD2C00]/20'
                      }`}
                      style={{ height: `${data.height}%` }}
                    />
                    {(hoveredBar === index || isHighlighted) && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#1C1B1B] text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                        {formatCurrency(data.revenue)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* X Axis */}
            <div className="absolute bottom-0 left-10 right-0 flex justify-between text-[10px] font-bold text-stone-400 uppercase tracking-tighter">
              {currentData.chart.map((data, index) => (
                <span key={index} className="flex-1 text-center">{data.label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Secondary Section: Top Items / Revenue by Category (1/3 width) */}
        <div className="space-y-6">
          {/* Revenue by Category */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-base font-bold mb-6">Doanh Thu Theo Danh Mục</h3>
            <div className="space-y-5">
              {currentData.categories.map((category, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>{category.name}</span>
                    <span>{formatCurrency(category.revenue)}</span>
                  </div>
                  <div className="w-full bg-[#E5E2E1] h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        index === 0 ? 'bg-[#AD2C00]' : index === 1 ? 'bg-[#5F5E5E]' : 'bg-orange-300'
                      }`}
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Selling Items */}
          <div className="bg-white rounded-lg overflow-hidden shadow-sm">
            <div className="p-6">
              <h3 className="text-base font-bold">Bán Chạy Nhất {timeFilter === 'daily' ? 'Hôm Nay' : timeFilter === 'weekly' ? 'Tuần Này' : 'Tháng Này'}</h3>
            </div>
            <div className="px-2 pb-2">
              {currentData.bestSellers.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 hover:bg-[#F6F3F2] rounded-lg transition-colors group"
                >
                  <img
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover"
                    src={item.image}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-bold">{item.name}</p>
                    <p className="text-xs text-[#5F5E5E]">
                      {item.orders} đơn {timeFilter === 'daily' ? 'hôm nay' : timeFilter === 'weekly' ? 'tuần này' : 'tháng này'}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-[#AD2C00]">
                    +{formatCurrency(item.revenue)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Operational Insights Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* Inventory Alert */}
        <div className="bg-[#AD2C00] p-8 rounded-lg text-white flex flex-col justify-center relative overflow-hidden">
          <TrendingUp className="absolute -right-8 -bottom-8 w-48 h-48 opacity-10" />
          <h3 className="text-2xl font-bold mb-2">Cảnh Báo Tồn Kho</h3>
          <p className="text-[#FFB5A0] max-w-sm mb-6">
            Nguyên liệu "Cá Hồi" sắp hết (còn 15 phần). Dự kiến hết trong 1 giờ
            dựa trên tốc độ bán hiện tại.
          </p>
          <button 
            onClick={() => navigate('/inventory')}
            className="bg-white text-[#AD2C00] px-6 py-2 rounded-full font-bold w-fit hover:bg-[#FFB5A0] transition-colors"
          >
            Nhập Hàng Ngay
          </button>
        </div>

        {/* Staffing Recommendation */}
        <div className="bg-[#5F5E5E] p-8 rounded-lg text-white flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Đề Xuất Nhân Sự</h3>
              <p className="text-stone-300 text-sm">
                Dựa trên xu hướng lưu lượng cao điểm
              </p>
            </div>
          </div>
          <p className="text-stone-300 text-sm italic border-l-2 border-[#AD2C00] pl-4 mb-4">
            "Triển khai thêm 2 nhân viên phục vụ từ 19:00 - 21:00 để duy trì tốc
            độ phục vụ bàn trong 15 phút."
          </p>
        </div>
      </div>
    </div>
  )
}
