# 🔧 Backend Microservices

## Kiến trúc Microservices

Hệ thống backend được chia thành 6 microservices độc lập:

```
backend/
├── api-gateway/              # API Gateway (Port: 3000)
├── menu-service/             # Menu Management (Port: 3001)
├── order-service/            # Order Management (Port: 3002)
├── table-service/            # Table Management (Port: 3003)
├── user-service/             # User/Auth Management (Port: 3004)
└── notification-service/     # Notifications (Port: 3005)
```

## 🚀 Công nghệ đề xuất

- **Runtime:** Node.js 18+ / Bun
- **Framework:** Express.js / NestJS / Fastify
- **Database:** PostgreSQL
- **Cache:** Redis
- **Message Queue:** RabbitMQ / Apache Kafka
- **Real-time:** Socket.io / WebSocket
- **Container:** Docker + Docker Compose
- **API Docs:** Swagger/OpenAPI

## 📊 Database Schema

### Tables

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'staff')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### tables
```sql
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number INTEGER UNIQUE NOT NULL,
  qr_code TEXT UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('available', 'occupied', 'reserved')),
  capacity INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### menu_items
```sql
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### orders
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES tables(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('paid', 'confirmed', 'cooking', 'ready', 'served', 'cancelled')),
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### order_items
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  customizations JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔌 API Endpoints

### API Gateway (Port: 3000)

#### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Menu Service (Port: 3001)

- `GET /api/menu/items` - Get all menu items
- `GET /api/menu/items/:id` - Get menu item by ID
- `POST /api/menu/items` - Create menu item (Admin)
- `PUT /api/menu/items/:id` - Update menu item (Admin)
- `DELETE /api/menu/items/:id` - Delete menu item (Admin)
- `GET /api/menu/categories` - Get all categories

### Order Service (Port: 3002)

- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order by ID
- `GET /api/orders/table/:tableId` - Get orders by table
- `PUT /api/orders/:id/status` - Update order status
- `GET /api/orders` - Get all orders (Admin)
- `GET /api/orders/stats` - Get order statistics (Admin)

### Table Service (Port: 3003)

- `GET /api/tables` - Get all tables
- `GET /api/tables/:id` - Get table by ID
- `POST /api/tables` - Create table (Admin)
- `PUT /api/tables/:id` - Update table (Admin)
- `DELETE /api/tables/:id` - Delete table (Admin)
- `GET /api/tables/:id/qr` - Get QR code for table
- `PUT /api/tables/:id/status` - Update table status

### User Service (Port: 3004)

- `GET /api/users` - Get all users (Admin)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (Admin)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin)
- `PUT /api/users/:id/password` - Change password

### Notification Service (Port: 3005)

- `GET /api/notifications` - Get user notifications
- `POST /api/notifications` - Send notification (System)
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification
- `WS /ws` - WebSocket connection for real-time

## 🔐 Authentication & Authorization

### JWT Token Structure
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "admin|manager|staff",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Role Permissions

**Admin:**
- Full access to all endpoints
- Manage users, menu, tables, settings

**Manager:**
- View all orders and statistics
- Manage menu and tables
- Cannot manage users

**Staff:**
- View and update orders
- View menu and tables
- Cannot modify menu or tables

## 🔄 Inter-Service Communication

### Event-Driven Architecture

**Events:**
- `order.created` - When new order is created
- `order.status.updated` - When order status changes
- `table.status.updated` - When table status changes
- `menu.item.updated` - When menu item is updated

**Message Queue (RabbitMQ/Kafka):**
```
order-service → [order.created] → notification-service
order-service → [order.status.updated] → notification-service
table-service → [table.status.updated] → notification-service
```

## 🐳 Docker Setup

### docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: restaurant_db
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: admin123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"

  api-gateway:
    build: ./api-gateway
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis

  menu-service:
    build: ./menu-service
    ports:
      - "3001:3001"
    depends_on:
      - postgres

  order-service:
    build: ./order-service
    ports:
      - "3002:3002"
    depends_on:
      - postgres
      - rabbitmq

  table-service:
    build: ./table-service
    ports:
      - "3003:3003"
    depends_on:
      - postgres

  user-service:
    build: ./user-service
    ports:
      - "3004:3004"
    depends_on:
      - postgres

  notification-service:
    build: ./notification-service
    ports:
      - "3005:3005"
    depends_on:
      - redis
      - rabbitmq

volumes:
  postgres_data:
```

## 📝 Environment Variables

### .env.example
```env
# Database
DATABASE_URL=postgresql://admin:admin123@localhost:5432/restaurant_db

# Redis
REDIS_URL=redis://localhost:6379

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# API Gateway
API_GATEWAY_PORT=3000

# Services
MENU_SERVICE_URL=http://localhost:3001
ORDER_SERVICE_URL=http://localhost:3002
TABLE_SERVICE_URL=http://localhost:3003
USER_SERVICE_URL=http://localhost:3004
NOTIFICATION_SERVICE_URL=http://localhost:3005
```

## 🚀 Getting Started

```bash
# Install dependencies for all services
cd api-gateway && npm install
cd ../menu-service && npm install
cd ../order-service && npm install
cd ../table-service && npm install
cd ../user-service && npm install
cd ../notification-service && npm install

# Start with Docker Compose
docker-compose up -d

# Or start individually
cd api-gateway && npm run dev
cd menu-service && npm run dev
# ... etc
```

## 📚 Documentation

- API Documentation: http://localhost:3000/api-docs
- RabbitMQ Management: http://localhost:15672
- Database: localhost:5432

## 🧪 Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## 📦 Deployment

- Use Docker containers
- Deploy to AWS ECS / Google Cloud Run / Azure Container Instances
- Use Kubernetes for orchestration
- Setup CI/CD with GitHub Actions / GitLab CI

---

**Note:** Cấu trúc này là template. Team backend sẽ implement chi tiết cho từng service.
