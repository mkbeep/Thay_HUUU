import { Bell, Settings, Search } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useState } from 'react'

export default function Header() {
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement search functionality
    console.log('Searching for:', searchQuery)
  }

  return (
    <header className="w-full sticky top-0 z-30 bg-white/80 backdrop-blur-md flex justify-between items-center px-8 py-4 shadow-sm">
      <div className="flex items-center gap-4 flex-1 max-w-2xl">
        <form onSubmit={handleSearch} className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
          <input
            className="w-full bg-[#EAE7E7] border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-[#AD2C00]/40 transition-all outline-none"
            placeholder="Tìm kiếm phân tích, đơn hàng, món ăn..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      <div className="flex items-center gap-6">
        <nav className="hidden lg:flex items-center gap-6 font-medium">
          <a className="text-stone-500 hover:text-stone-900 transition-colors" href="#">
            Trợ giúp
          </a>
          <a className="text-stone-500 hover:text-stone-900 transition-colors" href="#">
            Hỗ trợ
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <button className="p-2 text-stone-500 hover:bg-stone-100 rounded-full transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#AD2C00] rounded-full"></span>
          </button>
          <button className="p-2 text-stone-500 hover:bg-stone-100 rounded-full transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          <div className="h-8 w-[1px] bg-stone-200 mx-2"></div>
          <img
            alt="Quản trị viên"
            className="w-10 h-10 rounded-full border-2 border-[#AD2C00]/20 object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCznXIT2M2jGQTSPmUDv6ehnbXsyBDkJKZXBkXu0nGV0gNOdFs04N22RveuUGsej1T1kgffMRLS-PcV31O3qNEXzK8rToKxV5t5gU0vEDt1oNiEJKnlcFvcEomQBKN9KzYDBgEEj0HcP8ai8juyIEujPg_kAVSdC1U9uazsGlD3i0HeDNVdQALfPlebOgXJWwLy0kfoRLMDHrWZu0UWSeyaf4be0dLwmEoB7BHv0_96ocKYLGfF4CWIK569lWLKgBrytOAng44FYQ"
          />
        </div>
      </div>
    </header>
  )
}
