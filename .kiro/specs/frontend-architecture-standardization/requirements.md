# Requirements Document

## Introduction

Dự án này nhằm chuẩn hóa kiến trúc frontend cho hệ thống quản lý nhà hàng, loại bỏ các thành phần thừa và tối ưu hóa cấu trúc. Hệ thống sẽ có hai frontend chính: Web Admin (ReactJS + TailwindCSS) cho nhân viên và quản lý, và Mobile App (React Native) cho khách hàng.

## Glossary

- **Web_Admin**: Ứng dụng web ReactJS sử dụng TailwindCSS, dành cho nhân viên và quản lý nhà hàng
- **Mobile_App**: Ứng dụng React Native cho khách hàng đặt món
- **Frontend_Admin_Directory**: Thư mục `frontend-admin/` chứa source code của Web Admin
- **Frontend_Directory**: Thư mục `frontend/` - thư mục thừa cần xóa
- **Frontend_Customer_Directory**: Thư mục `frontend-customer/` - thư mục thừa cần xóa
- **Mobile_App_Directory**: Thư mục `mobile-app/` chứa source code của Mobile App
- **Docker_Compose_File**: File `docker-compose.yml` định nghĩa các services Docker
- **TailwindCSS**: Framework CSS utility-first thay thế Material-UI
- **Material_UI**: Thư viện UI component cũ cần được thay thế
- **JWT_Authentication**: Cơ chế xác thực sử dụng JSON Web Token cho Web Admin
- **Session_Based_Authentication**: Cơ chế xác thực dựa trên session với tableId cho Mobile App
- **Role_Based_Access_Control**: Hệ thống phân quyền dựa trên vai trò (ADMIN, MANAGER, WAITER, CHEF)
- **Responsive_Design**: Thiết kế giao diện tương thích với nhiều kích thước màn hình (desktop và mobile web)
- **Documentation_Files**: Các file tài liệu bao gồm README.md, DOCKER.md, SETUP.md

## Requirements

### Requirement 1: Xóa các thư mục frontend thừa

**User Story:** Là một developer, tôi muốn xóa các thư mục frontend không sử dụng, để cấu trúc dự án rõ ràng và dễ bảo trì.

#### Acceptance Criteria

1. THE Frontend_Directory SHALL be deleted from the project root
2. THE Frontend_Customer_Directory SHALL be deleted from the project root
3. WHEN the deletion is complete, THE project structure SHALL contain only Frontend_Admin_Directory and Mobile_App_Directory for frontend code
4. THE deletion SHALL not affect any other directories or files in the project

### Requirement 2: Cấu hình TailwindCSS cho Web Admin

**User Story:** Là một developer, tôi muốn cấu hình TailwindCSS trong Web Admin, để có thể sử dụng utility-first CSS framework thay vì Material-UI.

#### Acceptance Criteria

1. THE Web_Admin SHALL include TailwindCSS as a dependency in package.json
2. THE Web_Admin SHALL include a valid tailwind.config.js configuration file
3. THE Web_Admin SHALL include TailwindCSS directives in the main CSS file
4. THE Web_Admin SHALL include PostCSS configuration for TailwindCSS processing
5. WHEN TailwindCSS is configured, THE Web_Admin SHALL be able to use TailwindCSS utility classes in components

### Requirement 3: Chuyển đổi UI components từ Material-UI sang TailwindCSS

**User Story:** Là một developer, tôi muốn chuyển đổi tất cả UI components từ Material-UI sang TailwindCSS, để có giao diện nhất quán và hiện đại hơn.

#### Acceptance Criteria

1. THE Web_Admin SHALL remove all Material-UI dependencies from package.json
2. THE Web_Admin SHALL remove all Material-UI imports from component files
3. WHEN a component is converted, THE component SHALL use TailwindCSS utility classes instead of Material-UI components
4. WHEN a component is converted, THE component SHALL maintain the same functionality as before
5. THE Web_Admin SHALL convert all pages including Dashboard, MenuManagement, OrderManagement, TableManagement, StaffManagement, and Login
6. THE Web_Admin SHALL convert all shared components including Layout and ProtectedRoute

### Requirement 4: Implement Responsive Design cho Web Admin

**User Story:** Là một người dùng, tôi muốn Web Admin hoạt động tốt trên cả desktop và mobile web, để tôi có thể truy cập từ nhiều thiết bị khác nhau.

#### Acceptance Criteria

1. WHEN Web_Admin is accessed on desktop (width >= 1024px), THE layout SHALL display a full sidebar navigation
2. WHEN Web_Admin is accessed on tablet (width >= 768px and < 1024px), THE layout SHALL display a collapsible sidebar navigation
3. WHEN Web_Admin is accessed on mobile (width < 768px), THE layout SHALL display a hamburger menu with drawer navigation
4. THE Web_Admin SHALL use TailwindCSS responsive breakpoints (sm, md, lg, xl) for layout adjustments
5. WHEN a page is viewed on mobile, THE tables and data grids SHALL be scrollable horizontally or stack vertically
6. WHEN a form is viewed on mobile, THE form fields SHALL stack vertically and use full width

### Requirement 5: Giữ nguyên JWT Authentication và Role-Based Access Control

**User Story:** Là một quản lý, tôi muốn hệ thống xác thực và phân quyền vẫn hoạt động như cũ sau khi refactor, để đảm bảo bảo mật và kiểm soát truy cập.

#### Acceptance Criteria

1. THE Web_Admin SHALL maintain JWT_Authentication for user login
2. THE Web_Admin SHALL maintain Role_Based_Access_Control with roles: ADMIN, MANAGER, WAITER, CHEF
3. WHEN a user logs in, THE Web_Admin SHALL store JWT token in localStorage or sessionStorage
4. WHEN a user accesses a protected route, THE Web_Admin SHALL verify JWT token validity
5. WHEN a user accesses a role-restricted route, THE Web_Admin SHALL verify user role matches required role
6. WHEN JWT token is invalid or expired, THE Web_Admin SHALL redirect user to login page
7. THE ProtectedRoute component SHALL continue to enforce authentication and authorization

### Requirement 6: Giữ nguyên Mobile App

**User Story:** Là một developer, tôi muốn Mobile App không bị thay đổi trong quá trình refactor, để tránh ảnh hưởng đến trải nghiệm khách hàng.

#### Acceptance Criteria

1. THE Mobile_App_Directory SHALL remain unchanged
2. THE Mobile_App SHALL continue to use React Native with Expo
3. THE Mobile_App SHALL continue to use Session_Based_Authentication with tableId
4. THE Mobile_App SHALL continue to provide features: table selection, menu viewing, order placement, and order tracking
5. THE Mobile_App SHALL continue to work with existing backend APIs without modification

### Requirement 7: Cập nhật Docker Configuration

**User Story:** Là một DevOps engineer, tôi muốn Docker configuration phản ánh đúng cấu trúc frontend mới, để deployment chính xác và không có services thừa.

#### Acceptance Criteria

1. THE Docker_Compose_File SHALL remove the frontend service definition if it exists
2. THE Docker_Compose_File SHALL remove the frontend-customer service definition if it exists
3. THE Docker_Compose_File SHALL keep the frontend-admin service definition
4. THE Docker_Compose_File SHALL keep all backend services (api-gateway, auth-service, menu-service, order-service, table-service)
5. THE Docker_Compose_File SHALL keep the mongodb and rabbitmq services
6. WHEN docker-compose up is executed, THE system SHALL start only the necessary services without errors

### Requirement 8: Cập nhật Documentation

**User Story:** Là một developer mới, tôi muốn documentation phản ánh đúng cấu trúc dự án hiện tại, để tôi có thể hiểu và làm việc với dự án dễ dàng.

#### Acceptance Criteria

1. THE README.md SHALL update the project structure section to reflect only Frontend_Admin_Directory and Mobile_App_Directory
2. THE README.md SHALL update the technology stack section to mention TailwindCSS instead of Material-UI for Web Admin
3. THE README.md SHALL update installation instructions to reflect the new structure
4. THE DOCKER.md SHALL update service descriptions to remove references to frontend and frontend-customer
5. THE SETUP.md SHALL update setup instructions to reflect the new structure
6. WHEN a developer reads the documentation, THE documentation SHALL accurately describe the current project structure and setup process

### Requirement 9: Cải thiện UI/UX cho Web Admin

**User Story:** Là một người dùng Web Admin, tôi muốn giao diện đẹp hơn và dễ sử dụng hơn, để tôi có thể làm việc hiệu quả hơn.

#### Acceptance Criteria

1. THE Web_Admin SHALL use a consistent color scheme throughout the application
2. THE Web_Admin SHALL use consistent spacing and typography using TailwindCSS utilities
3. THE Web_Admin SHALL provide visual feedback for user interactions (hover states, active states, loading states)
4. THE Web_Admin SHALL use appropriate icons for actions and navigation
5. WHEN a user performs an action (create, update, delete), THE Web_Admin SHALL display success or error notifications
6. THE Web_Admin SHALL use loading indicators when fetching data from APIs
7. THE Web_Admin SHALL display empty states when no data is available

### Requirement 10: Đảm bảo tính tương thích với Backend APIs

**User Story:** Là một developer, tôi muốn Web Admin sau khi refactor vẫn tương thích với các Backend APIs hiện có, để không cần thay đổi backend code.

#### Acceptance Criteria

1. THE Web_Admin SHALL maintain the same API endpoints as before refactoring
2. THE Web_Admin SHALL maintain the same request/response formats for all API calls
3. THE Web_Admin SHALL maintain the same authentication headers (Authorization: Bearer <token>)
4. WHEN Web_Admin makes an API call, THE request format SHALL match the backend service expectations
5. WHEN Web_Admin receives an API response, THE response handling SHALL work correctly with existing backend response formats
6. THE Web_Admin SHALL continue to use the API Gateway at http://localhost:3000/api

### Requirement 11: Validation và Error Handling

**User Story:** Là một người dùng, tôi muốn hệ thống validate input và hiển thị lỗi rõ ràng, để tôi biết cách sửa lỗi khi nhập sai thông tin.

#### Acceptance Criteria

1. WHEN a user submits a form with invalid data, THE Web_Admin SHALL display field-level validation errors
2. WHEN a user submits a form with missing required fields, THE Web_Admin SHALL highlight the missing fields
3. WHEN an API call fails, THE Web_Admin SHALL display a user-friendly error message
4. WHEN a network error occurs, THE Web_Admin SHALL display a network error message with retry option
5. THE Web_Admin SHALL validate input on the client side before sending to the server
6. THE Web_Admin SHALL handle server-side validation errors and display them to the user

### Requirement 12: Performance Optimization

**User Story:** Là một người dùng, tôi muốn Web Admin tải nhanh và mượt mà, để tôi có thể làm việc hiệu quả mà không bị chậm trễ.

#### Acceptance Criteria

1. THE Web_Admin SHALL implement code splitting for route-based lazy loading
2. THE Web_Admin SHALL optimize images and assets for web delivery
3. THE Web_Admin SHALL minimize bundle size by removing unused dependencies
4. WHEN Web_Admin loads, THE initial page load SHALL complete within 3 seconds on a standard broadband connection
5. THE Web_Admin SHALL implement memoization for expensive computations using React.memo or useMemo
6. THE Web_Admin SHALL debounce search inputs to reduce unnecessary API calls

### Requirement 13: Accessibility Compliance

**User Story:** Là một người dùng có khuyết tật, tôi muốn Web Admin hỗ trợ accessibility features, để tôi có thể sử dụng ứng dụng với screen readers và keyboard navigation.

#### Acceptance Criteria

1. THE Web_Admin SHALL use semantic HTML elements (header, nav, main, footer, article, section)
2. THE Web_Admin SHALL provide alt text for all images
3. THE Web_Admin SHALL ensure all interactive elements are keyboard accessible
4. THE Web_Admin SHALL provide focus indicators for keyboard navigation
5. THE Web_Admin SHALL use ARIA labels where necessary for screen readers
6. THE Web_Admin SHALL maintain a logical tab order throughout the application
7. THE Web_Admin SHALL ensure color contrast ratios meet WCAG 2.1 AA standards (minimum 4.5:1 for normal text)

### Requirement 14: State Management Consistency

**User Story:** Là một developer, tôi muốn state management được tổ chức nhất quán, để code dễ đọc và bảo trì.

#### Acceptance Criteria

1. THE Web_Admin SHALL continue to use Redux Toolkit for state management
2. THE Web_Admin SHALL maintain separate slices for auth, menu, order, table, and staff
3. THE Web_Admin SHALL use Redux Toolkit's createAsyncThunk for async operations
4. THE Web_Admin SHALL handle loading, success, and error states consistently across all slices
5. WHEN a slice is updated, THE slice SHALL follow the same pattern as other slices
6. THE Web_Admin SHALL use Redux DevTools for debugging in development mode

### Requirement 15: Testing Strategy

**User Story:** Là một developer, tôi muốn có test coverage cho các components chính, để đảm bảo code quality và tránh regression bugs.

#### Acceptance Criteria

1. THE Web_Admin SHALL include unit tests for utility functions and helpers
2. THE Web_Admin SHALL include component tests for critical UI components
3. THE Web_Admin SHALL include integration tests for authentication flow
4. THE Web_Admin SHALL include integration tests for CRUD operations (menu, orders, tables, staff)
5. THE Web_Admin SHALL achieve at least 70% code coverage for critical paths
6. WHEN tests are run, THE test suite SHALL complete within 2 minutes
7. THE Web_Admin SHALL use Jest and React Testing Library for testing
