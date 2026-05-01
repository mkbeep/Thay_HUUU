import { useState } from 'react'
import { Eye, EyeOff, Mail, Lock, User, Phone, HelpCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    if (!agreeTerms) {
      toast.error('Vui lòng đồng ý với điều khoản sử dụng')
      return
    }

    setLoading(true)

    try {
      // TODO: Call API register
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.')
      navigate('/login')
    } catch (error) {
      toast.error('Đăng ký thất bại. Vui lòng thử lại.')
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
            alt="Restaurant interior"
            className="w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-xl">
          <div className="mb-6 inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
            <svg className="w-5 h-5 text-primary-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-white font-bold tracking-tight text-sm uppercase">Tham gia cùng chúng tôi</span>
          </div>
          <h1 className="font-headline text-5xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tighter mb-4">
            Bắt đầu hành trình của bạn.
          </h1>
          <p className="font-headline text-xl lg:text-2xl text-white/80 font-medium tracking-tight">
            Gourmet Tech: Quản lý nhà hàng thông minh
          </p>
        </div>
      </section>

      {/* Right Side: Register Interface */}
      <section className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-24 bg-[#FCF9F8] overflow-y-auto">
        <div className="w-full max-w-[440px] space-y-8 my-8">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#AD2C00] to-[#D83900] flex items-center justify-center shadow-2xl shadow-primary-500/20">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>
              </svg>
            </div>
            <div>
              <h2 className="font-headline text-3xl font-extrabold text-[#1C1B1B] tracking-tighter">
                Tạo tài khoản mới
              </h2>
              <p className="text-[#5F5E5E] font-medium mt-1">
                Đăng ký để bắt đầu quản lý nhà hàng của bạn.
              </p>
            </div>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#1C1B1B] ml-1" htmlFor="name">
                  Họ và tên
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-[#916F67]" />
                  </div>
                  <input
                    className="block w-full pl-12 pr-4 py-3.5 bg-[#EAE7E7] border-none rounded-lg focus:ring-2 focus:ring-[#AD2C00]/40 text-[#1C1B1B] transition-all placeholder:text-[#916F67]/60 outline-none"
                    id="name"
                    name="name"
                    placeholder="Nguyễn Văn A"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#1C1B1B] ml-1" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-[#916F67]" />
                  </div>
                  <input
                    className="block w-full pl-12 pr-4 py-3.5 bg-[#EAE7E7] border-none rounded-lg focus:ring-2 focus:ring-[#AD2C00]/40 text-[#1C1B1B] transition-all placeholder:text-[#916F67]/60 outline-none"
                    id="email"
                    name="email"
                    placeholder="email@example.com"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#1C1B1B] ml-1" htmlFor="phone">
                  Số điện thoại
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="w-5 h-5 text-[#916F67]" />
                  </div>
                  <input
                    className="block w-full pl-12 pr-4 py-3.5 bg-[#EAE7E7] border-none rounded-lg focus:ring-2 focus:ring-[#AD2C00]/40 text-[#1C1B1B] transition-all placeholder:text-[#916F67]/60 outline-none"
                    id="phone"
                    name="phone"
                    placeholder="0123456789"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
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
                    className="block w-full pl-12 pr-12 py-3.5 bg-[#EAE7E7] border-none rounded-lg focus:ring-2 focus:ring-[#AD2C00]/40 text-[#1C1B1B] transition-all placeholder:text-[#916F67]/60 outline-none"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
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

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#1C1B1B] ml-1" htmlFor="confirmPassword">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-[#916F67]" />
                  </div>
                  <input
                    className="block w-full pl-12 pr-12 py-3.5 bg-[#EAE7E7] border-none rounded-lg focus:ring-2 focus:ring-[#AD2C00]/40 text-[#1C1B1B] transition-all placeholder:text-[#916F67]/60 outline-none"
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="••••••••"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#916F67] hover:text-[#AD2C00] transition-colors"
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start">
              <input
                className="w-5 h-5 mt-0.5 rounded border-[#E5BEB3] text-[#AD2C00] focus:ring-[#AD2C00]/20 transition-all cursor-pointer"
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <label htmlFor="terms" className="ml-3 text-sm text-[#5F5E5E] cursor-pointer">
                Tôi đồng ý với{' '}
                <a href="#" className="text-[#AD2C00] font-semibold hover:underline">
                  Điều khoản sử dụng
                </a>{' '}
                và{' '}
                <a href="#" className="text-[#AD2C00] font-semibold hover:underline">
                  Chính sách bảo mật
                </a>
              </label>
            </div>

            {/* Action */}
            <button
              className="w-full bg-gradient-to-br from-[#AD2C00] to-[#D83900] text-white font-headline font-bold text-lg py-4 rounded-xl shadow-xl shadow-[#AD2C00]/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>

          {/* Footer / Switch */}
          <div className="pt-6 text-center border-t border-[#E5BEB3]/20">
            <p className="text-[#5F5E5E] font-medium">
              Đã có tài khoản?{' '}
              <Link 
                to="/login" 
                className="text-[#AD2C00] font-bold ml-1 hover:underline decoration-[#AD2C00]/30 underline-offset-4"
              >
                Đăng nhập ngay
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
