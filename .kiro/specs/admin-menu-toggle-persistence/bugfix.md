# Bugfix Requirements Document

## Introduction

Khi quản trị viên (admin) bật/tắt trạng thái "có sẵn" (availability) của món ăn trong giao diện quản lý menu, món ăn biến mất khỏi danh sách ngay lập tức. Điều này gây khó khăn cho việc quản lý vì admin không thể thấy trạng thái hiện tại của các món ăn không có sẵn.

Hành vi này khác với giao diện khách hàng (customer app), nơi việc lọc các món không có sẵn là mong muốn. Giao diện admin cần hiển thị TẤT CẢ các món ăn (cả có sẵn và không có sẵn) để quản lý hiệu quả.

**Tác động:**
- Admin không thể xem danh sách đầy đủ các món ăn
- Trải nghiệm quản lý không mượt mà, thiếu phản hồi trực quan
- Khó khăn trong việc theo dõi trạng thái món ăn

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN admin toggles availability of a menu item to "unavailable" (is_available = false) THEN the system removes the item from the admin menu list immediately

1.2 WHEN admin toggles availability of a menu item THEN the system does not provide visual feedback showing the updated toggle state before the item disappears

1.3 WHEN the admin menu page loads THEN the system displays all menu items regardless of availability status, but WebSocket updates cause unavailable items to disappear from view

### Expected Behavior (Correct)

2.1 WHEN admin toggles availability of a menu item to "unavailable" THEN the system SHALL keep the item visible in the admin menu list with the toggle switch showing the "unavailable" state

2.2 WHEN admin toggles availability of a menu item to "available" THEN the system SHALL keep the item visible in the admin menu list with the toggle switch showing the "available" state

2.3 WHEN the admin menu page loads THEN the system SHALL display all menu items (both available and unavailable) with their current availability status clearly indicated by the toggle switch

2.4 WHEN admin toggles availability THEN the system SHALL provide immediate visual feedback by updating the toggle switch state and maintaining the item's position in the list

### Unchanged Behavior (Regression Prevention)

3.1 WHEN customer app loads the menu THEN the system SHALL CONTINUE TO filter and display only available items (is_available = true)

3.2 WHEN customer app receives WebSocket updates for unavailable items THEN the system SHALL CONTINUE TO hide those items from the customer view immediately

3.3 WHEN admin toggles availability to "unavailable" THEN the customer app SHALL CONTINUE TO remove that item from the customer's menu view in real-time

3.4 WHEN admin toggles availability to "available" THEN the customer app SHALL CONTINUE TO show that item in the customer's menu view in real-time

3.5 WHEN admin creates, updates, or deletes menu items THEN the system SHALL CONTINUE TO emit WebSocket events and update the UI in real-time

3.6 WHEN admin toggles availability THEN the system SHALL CONTINUE TO update the backend database and emit WebSocket events to notify all connected clients

3.7 WHEN admin edits other menu item properties (name, price, description, category, image) THEN the system SHALL CONTINUE TO function as before without affecting availability display logic
