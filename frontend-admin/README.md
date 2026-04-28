# Restaurant Admin Web App

Web app ReactJS cho nhân viên và quản lý nhà hàng.

## Cài đặt

```bash
cd frontend-admin
npm install
```

## Chạy app

```bash
npm start
```

## Tính năng

- Đăng nhập JWT
- Phân quyền theo role (ADMIN, MANAGER, WAITER, CHEF)
- Quản lý thực đơn
- Quản lý đơn hàng
- Quản lý bàn
- Quản lý nhân viên (chỉ ADMIN)

## Roles

- **ADMIN**: Toàn quyền, quản lý nhân viên
- **MANAGER**: Quản lý menu, đơn hàng, bàn
- **WAITER**: Xem và cập nhật đơn hàng
- **CHEF**: Xem đơn hàng bếp

## Cấu trúc

```
frontend-admin/
├── src/
│   ├── components/          # Components
│   │   ├── Layout.jsx
│   │   └── ProtectedRoute.jsx
│   ├── pages/              # Pages
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── MenuManagement.jsx
│   │   ├── OrderManagement.jsx
│   │   ├── TableManagement.jsx
│   │   └── StaffManagement.jsx
│   ├── store/              # Redux store
│   │   ├── index.js
│   │   └── slices/
│   └── services/           # API services
│       └── api.js
└── package.json
```
