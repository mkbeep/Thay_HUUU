# 🐳 Docker Setup Guide

Hướng dẫn chạy hệ thống Restaurant Management bằng Docker - Cực kỳ đơn giản!

## 📋 Yêu cầu

- Docker Desktop (macOS/Windows) hoặc Docker Engine (Linux)
- Docker Compose v2.0+

## 🚀 Cách sử dụng

### Khởi động toàn bộ hệ thống

```bash
# Build và khởi động tất cả services (bao gồm auto seed data)
docker-compose up --build

# Hoặc chạy ở background
docker-compose up --build -d
```

**Chỉ cần 1 lệnh!** Docker sẽ tự động:
- ✅ Build tất cả services
- ✅ Khởi động MongoDB và RabbitMQ
- ✅ Khởi động tất cả microservices
- ✅ Tự động seed dữ liệu mẫu
- ✅ Khởi động Frontend Admin

### Xem logs

```bash
# Xem logs tất cả services
docker-compose logs -f

# Xem logs của 1 service cụ thể
docker-compose logs -f api-gateway
docker-compose logs -f auth-service
docker-compose logs -f frontend-admin
```

### Dừng services

```bash
# Dừng tất cả services
docker-compose down

# Dừng và xóa volumes (xóa data)
docker-compose down -v
```

### Restart services

```bash
# Restart tất cả
docker-compose restart

# Restart 1 service cụ thể
docker-compose restart api-gateway
```

## 🌐 URLs

Sau khi khởi động thành công:

| Service | URL | Mô tả |
|---------|-----|-------|
| Frontend Admin | http://localhost:8080 | Web quản lý nhân viên |
| API Gateway | http://localhost:3000 | API Gateway chính |
| Auth Service | http://localhost:3001 | Service xác thực |
| Menu Service | http://localhost:3002 | Service quản lý menu |
| Order Service | http://localhost:3003 | Service quản lý đơn hàng |
| Table Service | http://localhost:3004 | Service quản lý bàn |
| RabbitMQ Management | http://localhost:15672 | RabbitMQ UI (admin/admin123) |

## 👥 Tài khoản test

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | ADMIN |
| manager | manager123 | MANAGER |
| waiter | waiter123 | WAITER |
| chef | chef123 | CHEF |

## 🔍 Troubleshooting

### Services không khởi động

```bash
# Kiểm tra logs
docker-compose logs

# Kiểm tra trạng thái
docker-compose ps

# Restart services
docker-compose restart
```

### Port đã được sử dụng

Nếu port bị conflict, sửa trong `docker-compose.yml`:

```yaml
services:
  frontend-admin:
    ports:
      - "8081:80"  # Thay đổi port bên trái
```

### MongoDB connection failed

```bash
# Kiểm tra MongoDB đã chạy chưa
docker-compose ps mongodb

# Xem logs MongoDB
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

### Rebuild từ đầu

```bash
# Xóa tất cả và rebuild
docker-compose down -v
docker-compose up --build
```

### Data không được seed

```bash
# Chạy lại seeder
docker-compose up data-seeder

# Hoặc chạy manual
cd scripts && npm install && node seed-data.js
```

## 🧹 Cleanup

```bash
# Dừng và xóa containers
docker-compose down

# Dừng và xóa containers + volumes (xóa data)
docker-compose down -v

# Dừng và xóa containers + volumes + images
docker-compose down -v --rmi all
```

## 📦 Cấu trúc Docker

```
.
├── docker-compose.yml          # Production config
├── docker-compose.dev.yml      # Development override
├── .dockerignore              # Files to ignore
├── Makefile                   # Helper commands
└── services/
    ├── api-gateway/
    │   └── Dockerfile
    ├── auth-service/
    │   └── Dockerfile
    ├── menu-service/
    │   └── Dockerfile
    ├── order-service/
    │   └── Dockerfile
    └── table-service/
        └── Dockerfile
```

## 🔐 Environment Variables

Các biến môi trường quan trọng trong `docker-compose.yml`:

```yaml
# JWT Secret (nên thay đổi trong production)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Session Secret
SESSION_SECRET=your-super-secret-session-key-change-in-production

# RabbitMQ Credentials
RABBITMQ_DEFAULT_USER=admin
RABBITMQ_DEFAULT_PASS=admin123
```

## 📈 Monitoring

```bash
# Xem resource usage
docker stats

# Xem logs real-time
docker-compose logs -f [service-name]

# Kiểm tra trạng thái services
docker-compose ps
```

## 🚢 Production Deployment

Để deploy lên production:

1. Thay đổi các secrets trong `docker-compose.yml`
2. Sử dụng environment-specific config
3. Setup reverse proxy (nginx/traefik)
4. Enable HTTPS
5. Setup monitoring và logging
6. Backup volumes thường xuyên

```bash
# Production deployment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 💡 Tips

- Data MongoDB được persist trong volume `mongodb_data`
- Logs được lưu trong Docker volumes
- Để xem logs real-time: `docker-compose logs -f`
- Để rebuild: `docker-compose up --build`
- Data seeder chỉ chạy 1 lần khi khởi động

## 🆘 Support

Nếu gặp vấn đề:

1. Kiểm tra logs: `docker-compose logs`
2. Kiểm tra trạng thái: `docker-compose ps`
3. Restart services: `docker-compose restart`
4. Rebuild từ đầu: `docker-compose down -v && docker-compose up --build`
