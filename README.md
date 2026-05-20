# 🍽️ Restaurant Management System

> Hệ thống quản lý nhà hàng toàn diện với QR Code ordering, real-time updates, và quản lý tập trung.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange.svg)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## 🎯 Tổng Quan

Hệ thống quản lý nhà hàng hiện đại với 3 components chính:
- **Admin Web:** Dashboard quản lý toàn diện
- **Customer App:** Web-app cho khách hàng (QR code ordering)
- **Backend API:** RESTful API + WebSocket real-time

---

## ✨ Tính Năng Chính

### 👨‍💼 Admin Dashboard
- 📋 Quản lý thực đơn (CRUD menu items)
- 📦 Quản lý đơn hàng (Real-time với WebSocket)
- 🪑 Quản lý bàn ăn (Tạo QR codes)
- 👥 Quản lý nhân viên (Role-based access)
- 📊 Báo cáo & Analytics
- 🎁 Khuyến mãi & Promotions
- 📦 Quản lý kho (Inventory)

### 📱 Customer Web-App
- 📷 Quét QR code để vào bàn
- 🍕 Xem menu theo danh mục
- 🛒 Giỏ hàng & đặt món
- 🔔 Gọi nhân viên hỗ trợ
- 📜 Lịch sử đơn hàng
- 💳 Thanh toán

### 🔧 Backend Features
- RESTful API (Express.js)
- WebSocket real-time updates
- JWT Authentication
- Role-based Authorization
- Firebase Firestore
- Clean Architecture

---

## 🚀 Quick Start

### 🏠 Chạy Local (Development)

```powershell
# Clone repository
git clone https://github.com/YOUR_USERNAME/restaurant-management-system.git
cd restaurant-management-system

# Chạy tất cả services
.\START-ALL-LOCAL.ps1
```

**Truy cập:**
- Backend: http://localhost:3000
- Admin: http://localhost:5173 (admin@restaurant.com / Admin@123456)
- App: http://localhost:8081?tableId=1

📖 **Chi tiết:** [HUONG-DAN-LOCAL.md](./HUONG-DAN-LOCAL.md)

---

### 🌐 Deploy Production (Internet)

```powershell
# Push to GitHub
.\DEPLOY-QUICK-START.ps1

# Deploy services (xem hướng dẫn chi tiết)
# - Backend → Render.com (Free)
# - Admin-web → Vercel (Free)
# - App → Vercel (Free)
```

📖 **Chi tiết:** [HUONG-DAN-DEPLOY.md](./HUONG-DAN-DEPLOY.md)

---

## 🏗️ Kiến Trúc

```
┌─────────────────────────────────────────┐
│  Frontend (React + Vite)                │
│  ┌──────────────┐  ┌──────────────┐    │
│  │ Admin Web    │  │ Customer App │    │
│  │ (Vercel)     │  │ (Vercel)     │    │
│  └──────┬───────┘  └──────┬───────┘    │
│         │                  │            │
│         └────────┬─────────┘            │
└──────────────────┼──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  Backend (Node.js + Express)            │
│  ┌──────────────────────────────────┐   │
│  │  RESTful API + WebSocket         │   │
│  │  (Render.com)                    │   │
│  └──────────────┬───────────────────┘   │
└─────────────────┼───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Database (Firebase Firestore)          │
│  ┌──────────────────────────────────┐   │
│  │  Collections: foods, orders,     │   │
│  │  tables, users, inventory        │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, React Router |
| **Backend** | Node.js, Express.js, TypeScript, Socket.io |
| **Database** | Firebase Firestore |
| **Auth** | JWT (JSON Web Tokens) |
| **Deployment** | Render.com (Backend), Vercel (Frontend) |

---

## 📚 Documentation

| File | Mô tả |
|------|-------|
| [BAT-DAU-O-DAY.md](./BAT-DAU-O-DAY.md) | 🎯 Điểm khởi đầu |
| [HUONG-DAN-LOCAL.md](./HUONG-DAN-LOCAL.md) | 💻 Chạy local |
| [HUONG-DAN-DEPLOY.md](./HUONG-DAN-DEPLOY.md) | 🚀 Deploy production |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | 🔧 Giải quyết vấn đề |
| [DOCS-INDEX.md](./DOCS-INDEX.md) | 📚 Index tất cả docs |
| [SUMMARY.md](./SUMMARY.md) | 📊 Tóm tắt dự án |

---

## 💰 Chi Phí

### FREE Tier (Khuyến nghị)
- Backend: Render.com (Free - 750h/month)
- Frontend: Vercel (Free - 100GB bandwidth)
- Database: Firebase (Free - 50K reads/day)
- **Total: $0/month** ✅

### Paid Tier (Nếu cần)
- Backend: Render.com ($7/month - no sleep)
- Database: Firebase (~$25/month - more quota)
- **Total: ~$32/month**

---

## 📦 Project Structure

```
restaurant-management-system/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── application/  # Business logic
│   │   ├── domain/       # Models
│   │   ├── infrastructure/ # Database, config
│   │   └── presentation/ # Controllers, routes
│   ├── scripts/          # Seed data
│   └── .env.example
│
├── admin-web/            # React Admin Dashboard
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── features/     # Feature modules
│   │   ├── business/     # Services
│   │   └── data/         # Repositories
│   └── .env.example
│
├── App/                  # React Customer Web-App
│   ├── src/
│   │   ├── presentation/ # Screens, components
│   │   ├── business/     # Services
│   │   ├── data/         # Repositories
│   │   └── domain/       # Models
│   └── .env.example
│
└── docs/                 # Documentation
    ├── *.md              # Guides
    └── scripts/          # Helper scripts
```

---

## 🔐 Default Credentials

**Admin Account:**
- Email: `admin@restaurant.com`
- Password: `Admin@123456`

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🆘 Support

- 📧 Email: support@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/YOUR_USERNAME/restaurant-management-system/issues)
- 📚 Docs: See [DOCS-INDEX.md](./DOCS-INDEX.md)

---

## 🎉 Acknowledgments

- Firebase for database
- Render.com for backend hosting
- Vercel for frontend hosting
- All open-source libraries used

---

**Made with ❤️ for Restaurant Management**

**Last Updated:** 20/05/2026
