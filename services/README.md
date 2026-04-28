# Services

Các microservices của hệ thống Restaurant Management.

## Cấu trúc

```
services/
├── api-gateway/       # API Gateway - điểm vào chính
├── auth-service/      # Xác thực & phân quyền
├── menu-service/      # Quản lý thực đơn
├── order-service/     # Quản lý đơn hàng
└── table-service/     # Quản lý bàn & session
```

## Chạy với Docker

Tất cả services được chạy tự động với:

```bash
docker compose up --build
```

## Chạy thủ công (Development)

### 1. Cài đặt dependencies

```bash
cd api-gateway && npm install && cd ..
cd auth-service && npm install && cd ..
cd menu-service && npm install && cd ..
cd order-service && npm install && cd ..
cd table-service && npm install && cd ..
```

### 2. Khởi động MongoDB

```bash
docker run -d -p 27017:27017 --name mongodb mongo:7
```

### 3. Chạy từng service

Mở terminal riêng cho mỗi service:

```bash
# Terminal 1
cd api-gateway && npm run dev

# Terminal 2
cd auth-service && npm run dev

# Terminal 3
cd menu-service && npm run dev

# Terminal 4
cd order-service && npm run dev

# Terminal 5
cd table-service && npm run dev
```

## Ports

| Service | Port | Mô tả |
|---------|------|-------|
| API Gateway | 3000 | Điểm vào chính |
| Auth Service | 3001 | Xác thực |
| Menu Service | 3002 | Thực đơn |
| Order Service | 3003 | Đơn hàng |
| Table Service | 3004 | Bàn |

## Environment Variables

Mỗi service có file `.env.example` riêng. Copy thành `.env` và điều chỉnh nếu cần:

```bash
cp .env.example .env
```

## Dockerfile

Mỗi service có Dockerfile riêng với:
- Node.js 18 Alpine (lightweight)
- Production dependencies only
- Health checks
- Optimized caching
