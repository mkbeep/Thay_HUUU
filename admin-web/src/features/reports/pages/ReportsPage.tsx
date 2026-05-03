import { useState } from 'react';

type TimeFilter = 'today' | 'week' | 'month' | 'custom';

interface BestSeller {
  name: string;
  orders: number;
  percentage: number;
}

interface ProfitableItem {
  id: number;
  name: string;
  category: string;
  image: string;
  quantitySold: number;
  unitMargin: number;
  revenueShare: number;
}

export default function ReportsPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAllBestSellers, setShowAllBestSellers] = useState(false);

  const bestSellers: BestSeller[] = [
    { name: 'Bít Tết Wagyu', orders: 84, percentage: 95 },
    { name: 'Pizza Nấm Truffle', orders: 62, percentage: 70 },
    { name: 'Cocktail Đặc Biệt', orders: 58, percentage: 65 },
    { name: 'Đĩa Hàu Tươi', orders: 41, percentage: 45 }
  ];

  const allBestSellers: BestSeller[] = [
    { name: 'Bít Tết Wagyu', orders: 84, percentage: 95 },
    { name: 'Pizza Nấm Truffle', orders: 62, percentage: 70 },
    { name: 'Cocktail Đặc Biệt', orders: 58, percentage: 65 },
    { name: 'Đĩa Hàu Tươi', orders: 41, percentage: 45 },
    { name: 'Sushi Cá Hồi', orders: 38, percentage: 43 },
    { name: 'Pasta Carbonara', orders: 35, percentage: 40 },
    { name: 'Salad Caesar', orders: 32, percentage: 36 },
    { name: 'Tôm Hùm Nướng', orders: 28, percentage: 32 },
    { name: 'Bánh Tiramisu', orders: 25, percentage: 28 },
    { name: 'Rượu Vang Đỏ', orders: 22, percentage: 25 }
  ];

  const profitableItems: ProfitableItem[] = [
    {
      id: 1,
      name: 'Bít Tết Wagyu Ribeye',
      category: 'Món Chính • Nướng',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATgljqWG_gGRlzdDonAzuEkbXWa0LTMYHy9dUsWpDNm-DKMMKcKITUdGqW896RgrIj8tvc4eA1T67WEnXhWnXneaCp6t3tuHIpu72xmvp3nKnwiOTv25BgXsft20_xICuPFLI8cu8BdA1h0G8XQRsEih8njEHTzpFtmvFLaMyIB74c8PBfnVSs1O8tsBsslpJEGCACrJcFIHW9Ixilw6LSzgLZL202ZCvdSai5UMDYSt_WuVop09VPlEDmiXxV-TbnHDJTOeS3IQ',
      quantitySold: 842,
      unitMargin: 52.0,
      revenueShare: 18.4
    },
    {
      id: 2,
      name: 'Pizza Nấm Truffle Đen',
      category: 'Khai Vị • Lò Nướng',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDrdZwAAkE0WFaVfcktyRUu5iJ0TbGmrdualQtSvGzJoFYvRRY9XhiAWMghz3ZvZla0_cqOMlwMrkUcLA1uv_b7CzTdkL_RB00FpJwxDbDrMHmEBaFNo1jDhgGyPT-0uLv0_I08t3d_9IJUr3ZdMB3espBho9rNMpQPol9DEB8a53CCo_xG-g_rNiGx674VQTmx16uMzSYVxcR9TPMnYktXGguebvjVtIBtbhfxjft0UOqs-sZS3aqDjruEobl3TFm2G9i86Pqjrw',
      quantitySold: 1105,
      unitMargin: 18.5,
      revenueShare: 12.1
    },
    {
      id: 3,
      name: 'Old Fashioned Khói',
      category: 'Đồ Uống • Quầy Bar',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASxl2g-6X7HOVlgWPMW-2LQTyebdHiR_1PS71pDL4qHkkrzXNBJpCTRDHN7xOv0wAO2WPsKrXimYjoQt0tE9ce4MXfWafILxj1vTM9-u2EeL1qrut74SVldS2AqLhpa5Iu2fBcrZjU5bcFk9f9AJOQPunCUr98INA00Q2DMqqp6vbhfh3uFNWk5fzu9mzN_DLi0aO7zgKQkX5v2a9I9P5OHvHaYTk4yKxy6Lh9YDHPVUJxK5osEMIaGnL3QXomU213xKNqbWbaRg',
      quantitySold: 624,
      unitMargin: 14.2,
      revenueShare: 8.5
    }
  ];

  const chartData = [
    { time: '11am', height: 33 },
    { time: '1pm', height: 50 },
    { time: '3pm', height: 85 },
    { time: '5pm', height: 70 },
    { time: '7pm', height: 95 },
    { time: '9pm', height: 40 },
    { time: '11pm', height: 60 }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount * 1000);
  };

  const handleExportPDF = () => {
    const reportData = {
      title: 'Báo cáo & Phân tích',
      period: timeFilter === 'today' ? 'Hôm nay' : timeFilter === 'week' ? 'Tuần này' : 'Tháng này',
      date: new Date().toLocaleDateString('vi-VN'),
      summary: {
        revenue: '24.850.000₫',
        avgOrder: '142.500₫',
        tableRate: '1.8/giờ'
      },
      bestSellers: bestSellers,
      profitableItems: profitableItems
    };

    console.log('Xuất PDF:', reportData);
    alert('Đang xuất báo cáo PDF...\n\nTrong thực tế, bạn có thể dùng thư viện như:\n- jsPDF\n- pdfmake\n- react-pdf\n\nĐể tạo file PDF từ dữ liệu báo cáo.');
    setShowExportMenu(false);
  };

  const handleExportExcel = () => {
    const csvContent = [
      ['Báo cáo & Phân tích'],
      ['Thời gian:', timeFilter === 'today' ? 'Hôm nay' : timeFilter === 'week' ? 'Tuần này' : 'Tháng này'],
      ['Ngày xuất:', new Date().toLocaleDateString('vi-VN')],
      [],
      ['Tổng quan'],
      ['Tổng doanh thu', '24.850.000₫'],
      ['Giá trị đơn TB', '142.500₫'],
      ['Vòng quay bàn', '1.8/giờ'],
      [],
      ['Món bán chạy nhất'],
      ['Tên món', 'Số đơn'],
      ...bestSellers.map(item => [item.name, item.orders]),
      [],
      ['Món có lợi nhuận cao nhất'],
      ['Tên món', 'Số lượng bán', 'Lợi nhuận/món', '% Doanh thu'],
      ...profitableItems.map(item => [
        item.name,
        item.quantitySold,
        formatCurrency(item.unitMargin),
        `${item.revenueShare}%`
      ])
    ];

    const csv = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bao-cao-${timeFilter}-${Date.now()}.csv`;
    link.click();
    setShowExportMenu(false);
  };

  const handlePrint = () => {
    window.print();
    setShowExportMenu(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Báo cáo & Phân tích
          </h1>
          <p className="text-gray-600 mt-1">
            Theo dõi hiệu suất kinh doanh chi tiết
          </p>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-2 py-3 px-6 bg-gradient-to-br from-[#AD2C00] to-[#D83900] text-white rounded-xl font-bold hover:shadow-lg transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-lg"></span>
            Xuất báo cáo
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
              <button
                onClick={handleExportPDF}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-gray-700"
              >
                <span className="material-symbols-outlined text-red-600"></span>
                <div>
                  <p className="font-semibold text-sm">Xuất PDF</p>
                  <p className="text-xs text-gray-500">Tải xuống file PDF</p>
                </div>
              </button>

              <button
                onClick={handleExportExcel}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-gray-700"
              >
                <span className="material-symbols-outlined text-green-600"></span>
                <div>
                  <p className="font-semibold text-sm">Xuất Excel/CSV</p>
                  <p className="text-xs text-gray-500">Tải xuống file CSV</p>
                </div>
              </button>

              <div className="border-t border-gray-100 my-2"></div>

              <button
                onClick={handlePrint}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-gray-700"
              >
                <span className="material-symbols-outlined text-blue-600"></span>
                <div>
                  <p className="font-semibold text-sm">In báo cáo</p>
                  <p className="text-xs text-gray-500">In trực tiếp</p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-xl border border-gray-200 w-fit">
        <button
          onClick={() => setTimeFilter('today')}
          className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            timeFilter === 'today'
              ? 'bg-white text-[#AD2C00] shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Hôm nay
        </button>
        <button
          onClick={() => setTimeFilter('week')}
          className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            timeFilter === 'week'
              ? 'bg-white text-[#AD2C00] shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Tuần này
        </button>
        <button
          onClick={() => setTimeFilter('month')}
          className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            timeFilter === 'month'
              ? 'bg-white text-[#AD2C00] shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Tháng này
        </button>
        <button
          onClick={() => setTimeFilter('custom')}
          className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            timeFilter === 'custom'
              ? 'bg-white text-[#AD2C00] shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Tùy chỉnh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-[#AD2C00] to-[#D83900] p-6 rounded-2xl text-white relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-2xl opacity-80"></span>
              <p className="text-sm font-semibold opacity-90 uppercase tracking-wider">
                Tổng doanh thu
              </p>
            </div>
            <h3 className="text-3xl font-bold mb-3">24.850.000₫</h3>
            <div className="flex items-center gap-2 text-sm font-semibold bg-white/20 rounded-lg px-3 py-1.5 w-fit">
              <span className="material-symbols-outlined text-sm"></span>
              <span>+12.5% so với tuần trước</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-2xl text-blue-600"></span>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                Giá trị đơn TB
              </p>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-3">142.500₫</h3>
            <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
              <span className="material-symbols-outlined text-sm"></span>
              <span>+4.2% tăng</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-2xl text-purple-600"></span>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                Vòng quay bàn
              </p>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-3">
              1.8 <span className="text-lg font-medium text-gray-400">/giờ</span>
            </h3>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
              <span className="material-symbols-outlined text-sm"></span>
              <span>Ổn định</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-xl font-bold text-gray-900">Xu hướng doanh thu</h4>
              <p className="text-sm text-gray-500 mt-1">Theo dõi hiệu suất bán hàng theo giờ</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#AD2C00]"></span>
                <span className="text-gray-600">Doanh thu</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-200"></span>
                <span className="text-gray-600">Trước đó</span>
              </div>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-2 px-2 relative">
            <div className="absolute inset-x-0 top-0 bottom-0 flex flex-col justify-between py-2">
              <div className="border-t border-gray-100 w-full"></div>
              <div className="border-t border-gray-100 w-full"></div>
              <div className="border-t border-gray-100 w-full"></div>
              <div className="border-t border-gray-100 w-full"></div>
            </div>

            {chartData.map((data, index) => (
              <div
                key={index}
                className="w-full relative group/bar z-10"
                style={{ height: `${data.height}%` }}
              >
                <div
                  className={`w-full h-full rounded-t-lg transition-all ${
                    data.height > 80
                      ? 'bg-[#AD2C00] shadow-lg'
                      : data.height > 60
                      ? 'bg-[#D83900]'
                      : 'bg-gray-200 group-hover/bar:bg-[#AD2C00]/30'
                  }`}
                ></div>
                {data.height > 80 && (
                  <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap z-20 font-semibold">
                    Cao điểm: 4.2tr @ 7PM
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {chartData.map((data, index) => (
              <span key={index}>{data.time}</span>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-[#AD2C00]"></span>
            <h4 className="text-xl font-bold text-gray-900">Bán chạy nhất</h4>
          </div>
          <div className="space-y-6 flex-1">
            {bestSellers.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-gray-900">{item.name}</span>
                  <span className="text-[#AD2C00]">{item.orders} đơn</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#AD2C00] to-[#D83900] rounded-full transition-all"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => setShowAllBestSellers(true)}
            className="mt-8 text-sm font-bold text-[#AD2C00] hover:underline underline-offset-4 text-center"
          >
            Xem tất cả món
          </button>
        </div>

        <div className="col-span-12 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[#AD2C00]"></span>
                <h4 className="text-xl font-bold text-gray-900">Giờ cao điểm</h4>
              </div>
              <p className="text-sm text-gray-500">Lượng khách theo thời gian và ngày</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Thấp</span>
              <div className="flex gap-1">
                <div className="w-4 h-4 rounded-sm bg-orange-50"></div>
                <div className="w-4 h-4 rounded-sm bg-orange-200"></div>
                <div className="w-4 h-4 rounded-sm bg-orange-400"></div>
                <div className="w-4 h-4 rounded-sm bg-[#AD2C00]"></div>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Cao điểm</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-[80px_repeat(14,minmax(0,1fr))] gap-1">
                <div className="h-6"></div>
                {['10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p', '10p', '11p'].map(
                  (time) => (
                    <div key={time} className="text-[10px] text-gray-400 font-bold text-center">
                      {time}
                    </div>
                  )
                )}

                {/* Monday */}
                <div className="text-[10px] font-black uppercase text-gray-900 py-1">T2</div>
                {[50, 50, 200, 400, 200, 50, 50, 200, 400, 600, 600, 400, 200, 50].map((intensity, i) => (
                  <div
                    key={i}
                    className={`rounded-sm ${
                      intensity >= 600
                        ? 'bg-[#AD2C00]'
                        : intensity >= 400
                        ? 'bg-orange-400'
                        : intensity >= 200
                        ? 'bg-orange-200'
                        : 'bg-orange-50'
                    }`}
                  ></div>
                ))}

                <div className="text-[10px] font-black uppercase text-gray-900 py-1">T4</div>
                {[50, 100, 400, 400, 200, 50, 100, 200, 400, 600, 600, 600, 400, 200].map((intensity, i) => (
                  <div
                    key={i}
                    className={`rounded-sm ${
                      intensity >= 600
                        ? 'bg-[#AD2C00]'
                        : intensity >= 400
                        ? 'bg-orange-400'
                        : intensity >= 200
                        ? 'bg-orange-200'
                        : intensity >= 100
                        ? 'bg-orange-100'
                        : 'bg-orange-50'
                    }`}
                  ></div>
                ))}

                <div className="text-[10px] font-black uppercase text-gray-900 py-1">T7</div>
                {[100, 200, 400, 600, 600, 400, 200, 400, 600, 600, 600, 600, 600, 400].map((intensity, i) => (
                  <div
                    key={i}
                    className={`rounded-sm ${
                      intensity >= 600
                        ? 'bg-[#AD2C00]'
                        : intensity >= 400
                        ? 'bg-orange-400'
                        : intensity >= 200
                        ? 'bg-orange-200'
                        : 'bg-orange-100'
                    }`}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[#AD2C00]"></span>
            <h4 className="text-xl font-bold text-gray-900">Món có lợi nhuận cao nhất</h4>
          </div>
          <p className="text-sm text-gray-500">Đóng góp vào tổng lợi nhuận theo món</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] bg-gray-50/50">
                <th className="px-8 py-4">Tên món</th>
                <th className="px-8 py-4">Số lượng bán</th>
                <th className="px-8 py-4">Lợi nhuận/món</th>
                <th className="px-8 py-4">% Doanh thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {profitableItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <img
                        className="w-12 h-12 rounded-lg object-cover"
                        src={item.image}
                        alt={item.name}
                      />
                      <div>
                        <p className="font-bold text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 font-medium text-gray-600">
                    {item.quantitySold.toLocaleString('vi-VN')}
                  </td>
                  <td className="px-8 py-5 font-medium text-gray-600">
                    {formatCurrency(item.unitMargin)}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="bg-[#AD2C00] h-full"
                          style={{ width: `${(item.revenueShare / 20) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-gray-900">{item.revenueShare}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAllBestSellers && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#AD2C00]">local_fire_department</span>
                <h3 className="text-2xl font-bold text-gray-900">Tất cả món bán chạy</h3>
              </div>
              <button 
                onClick={() => setShowAllBestSellers(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {allBestSellers.map((item, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#AD2C00] to-[#D83900] text-white flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <span className="font-bold text-gray-900">{item.name}</span>
                    </div>
                    <span className="text-[#AD2C00] font-bold">{item.orders} đơn</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#AD2C00] to-[#D83900] rounded-full transition-all"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowAllBestSellers(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  handleExportExcel();
                  setShowAllBestSellers(false);
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-br from-[#AD2C00] to-[#D83900] text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg"></span>
                Xuất danh sách
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
