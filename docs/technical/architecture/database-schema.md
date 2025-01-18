# Database Schema Documentation

## Overview
The application uses PostgreSQL as the primary database with Prisma as the ORM. The schema is designed to support order management, user roles, inventory tracking, and various business operations.

## Core Tables

### User
```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  password      String?
  role          UserRole  @default(CUSTOMER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  orders        Order[]
  activities    Activity[]
}

enum UserRole {
  ADMIN
  SUPPLIER
  CUSTOMER
  GENERAL_CONTRACTOR
  SUBCONTRACTOR
}
```

### Order
```prisma
model Order {
  id                String          @id @default(cuid())
  status            OrderStatus     @default(PENDING)
  userId            String
  user              User            @relation(fields: [userId], references: [id])
  items             OrderItem[]
  history           OrderHistory[]
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  shippingAddress   String?
  shippingCity      String?
  shippingState     String?
  shippingZip       String?
  trackingNumber    String?
  carrier           String?
  pooledOrder       PooledOrder?    @relation(fields: [pooledOrderId], references: [id])
  pooledOrderId     String?
}

enum OrderStatus {
  POOLING
  PENDING
  PROCESSING
  CONFIRMED
  SHIPPED
  DELIVERED
  CANCELLED
}
```

### OrderItem
```prisma
model OrderItem {
  id          String    @id @default(cuid())
  orderId     String
  order       Order     @relation(fields: [orderId], references: [id])
  productId   String
  product     Product   @relation(fields: [productId], references: [id])
  quantity    Int
  price       Float
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

### Product
```prisma
model Product {
  id              String      @id @default(cuid())
  name            String
  description     String?
  price           Float
  currentStock    Int         @default(0)
  minOrderQuantity Int        @default(1)
  supplierId      String?
  supplier        User?       @relation(fields: [supplierId], references: [id])
  orderItems      OrderItem[]
  stockHistory    StockHistory[]
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}
```

### PooledOrder
```prisma
model PooledOrder {
  id              String    @id @default(cuid())
  productId       String
  product         Product   @relation(fields: [productId], references: [id])
  currentQuantity Int       @default(0)
  targetQuantity  Int
  status          String    @default("OPEN")
  orders          Order[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

## Tracking and History

### OrderHistory
```prisma
model OrderHistory {
  id          String      @id @default(cuid())
  orderId     String
  order       Order       @relation(fields: [orderId], references: [id])
  userId      String
  user        User        @relation(fields: [userId], references: [id])
  fromStatus  OrderStatus
  toStatus    OrderStatus
  note        String?
  metadata    Json?
  timestamp   DateTime    @default(now())
}
```

### StockHistory
```prisma
model StockHistory {
  id          String    @id @default(cuid())
  productId   String
  product     Product   @relation(fields: [productId], references: [id])
  quantity    Int
  type        String    // "IN" or "OUT"
  reason      String?
  timestamp   DateTime  @default(now())
}
```

### Activity
```prisma
model Activity {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  type        String
  description String
  metadata    Json?
  timestamp   DateTime  @default(now())
}
```

## Supporting Tables

### Wishlist
```prisma
model Wishlist {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  productId   String
  product     Product   @relation(fields: [productId], references: [id])
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

### ErrorReport
```prisma
model ErrorReport {
  id          String    @id @default(cuid())
  userId      String?
  user        User?     @relation(fields: [userId], references: [id])
  type        String
  description String
  status      String    @default("OPEN")
  priority    String    @default("MEDIUM")
  metadata    Json?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  resolvedAt  DateTime?
}
```

## Relationships

### One-to-Many
- User -> Orders
- User -> Activities
- Order -> OrderItems
- Order -> OrderHistory
- Product -> OrderItems
- Product -> StockHistory

### Many-to-One
- OrderItem -> Order
- OrderItem -> Product
- OrderHistory -> Order
- StockHistory -> Product
- Activity -> User

### Optional Relationships
- Order -> PooledOrder (optional pooling)
- Product -> Supplier (optional supplier assignment)

## Indexes
```prisma
@@index([userId])
@@index([orderId])
@@index([productId])
@@index([status])
@@index([createdAt])
```

## Constraints
- Unique email addresses for users
- Non-negative stock quantities
- Valid status transitions
- Referential integrity on all relations

## Soft Deletion
- Implemented via status fields rather than actual deletion
- Preserves data integrity and history

## Audit Trail
- OrderHistory tracks all status changes
- StockHistory tracks inventory movements
- Activity logs user actions
- All models include timestamps 