import { useState } from 'react'
import { Eye, EyeOff, Mail, Lock, HelpCircle } from 'lucide-react'
import { useAuthStore } from '../../../stores/authStore'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { DEFAULT_AUTHENTICATED_HOME } from '../../../utils/permissions'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@gourmet.com')
  const [password, setPassword] = useState('admin123')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Email không đúng định dạng. Vui lòng nhập email hợp lệ (ví dụ: user@example.com)')
      return
    }

    if (password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    setLoading(true)

    try {
      await login(email, password)
      toast.success('Đăng nhập thành công!')
      navigate(DEFAULT_AUTHENTICATED_HOME)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Email hoac mat khau khong dung'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Left Side: Atmospheric Branding */}
      <section className="hidden md:flex md:w-1/2 relative bg-gray-200 items-end p-12 lg:p-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            alt="Luxury plating"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2QFf-U72C9ct0Huxa7nLO0mm6qmAurmrznMwNvP68FpCjE6W1jbCRwJgMxJgeslxtC9-FhGf8TY8D4UTXb4G1oemn5pESLZMlgxrvtwre_A0yje_PpQ9xuKXqQRrjApSJd2bikNXuJ7DsyWCkz38eVj6lKEQNSehPdK-ToMd2RuvaH6ZB7RJXp34gieMuEsDuR81iv1b3kQtwecAdCNy9pOUNYKHiVhXzZksYZyjf0rCRRjML8Ws9DsGRu-kNzE-MVd5RopzjXQ"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-xl">
          <div className="mb-6 inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
            <svg className="w-5 h-5 text-primary-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-white font-bold tracking-tight text-sm uppercase">Sự xuất sắc được phục vụ</span>
          </div>
          <h1 className="font-headline text-5xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tighter mb-4">
            Nâng tầm nghệ thuật phục vụ.
          </h1>
          <p className="font-headline text-xl lg:text-2xl text-white/80 font-medium tracking-tight">
            Gourmet Tech: Hệ thống quản lý thông minh
          </p>
        </div>
      </section>

      {/* Right Side: Login Interface */}
      <section className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-24 bg-[#FCF9F8]">
        <div className="w-full max-w-[440px] space-y-10">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#AD2C00] to-[#D83900] flex items-center justify-center shadow-2xl shadow-primary-500/20">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>
              </svg>
            </div>
            <div>
              <h2 className="font-headline text-3xl font-extrabold text-[#1C1B1B] tracking-tighter">
                Chào mừng trở lại
              </h2>
              <p className="text-[#5F5E5E] font-medium mt-1">
                Quản lý nhà hàng của bạn một cách dễ dàng.
              </p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#1C1B1B] ml-1" htmlFor="email">
                  Email hoặc Tên đăng nhập
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-[#916F67]" />
                  </div>
                  <input
                    className="block w-full pl-12 pr-4 py-4 bg-[#EAE7E7] border-none rounded-lg focus:ring-2 focus:ring-[#AD2C00]/40 text-[#1C1B1B] transition-all placeholder:text-[#916F67]/60 outline-none"
                    id="email"
                    placeholder="admin@gourmet.com"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#1C1B1B] ml-1" htmlFor="password">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-[#916F67]" />
                  </div>
                  <input
                    className="block w-full pl-12 pr-12 py-4 bg-[#EAE7E7] border-none rounded-lg focus:ring-2 focus:ring-[#AD2C00]/40 text-[#1C1B1B] transition-all placeholder:text-[#916F67]/60 outline-none"
                    id="password"
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#916F67] hover:text-[#AD2C00] transition-colors"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Utils */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer group">
                <input
                  className="w-5 h-5 rounded border-[#E5BEB3] text-[#AD2C00] focus:ring-[#AD2C00]/20 transition-all cursor-pointer"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="ml-3 text-sm font-medium text-[#5F5E5E] group-hover:text-[#1C1B1B] transition-colors">
                  Ghi nhớ đăng nhập
                </span>
              </label>
              <a className="text-sm font-bold text-[#AD2C00] hover:text-[#D83900] transition-colors" href="#">
                Quên mật khẩu?
              </a>
            </div>

            {/* Action */}
            <button
              className="w-full bg-gradient-to-br from-[#AD2C00] to-[#D83900] text-white font-headline font-bold text-lg py-4 rounded-xl shadow-xl shadow-[#AD2C00]/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          {/* Footer / Switch */}
          <div className="pt-8 text-center border-t border-[#E5BEB3]/20">
            <p className="text-[#5F5E5E] font-medium">
              Chưa có tài khoản?{' '}
              <Link 
                to="/register" 
                className="text-[#AD2C00] font-bold ml-1 hover:underline decoration-[#AD2C00]/30 underline-offset-4"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Support Link Floating */}
      <div className="fixed bottom-6 right-6">
        <button className="flex items-center space-x-2 bg-white shadow-lg px-4 py-2 rounded-full border border-[#E5BEB3]/10 hover:bg-[#F6F3F2] transition-colors">
          <HelpCircle className="w-5 h-5 text-[#5F5E5E]" />
          <span className="text-sm font-semibold text-[#5F5E5E]">Liên hệ hỗ trợ</span>
        </button>
      </div>
    </div>
  )
}
