# AI Handover Documentation

## 1. Tóm tắt hệ thống

Đây là ứng dụng quản lý tài sản, thu chi và lịch gia đình theo mô hình nhiều gia đình. Một user có thể thuộc nhiều family, nhưng mỗi phiên làm việc chỉ dùng đúng một `activeFamilyId`.

Các thay đổi quan trọng gần đây:

- Refactor category tài chính sang 4 type chính: `ASSET`, `LIABILITY`, `INCOME`, `EXPENSE`
- Chuẩn hóa hierarchy danh mục: `type -> group -> category`
- Bổ sung `isTransfer` và chuẩn hóa `isRecurring` cho transaction
- Thêm multi-family membership bằng `family_users`
- Thêm RBAC theo role template
- UI bỏ i18n, dùng tiếng Việt trực tiếp
- Dark Mode hoạt động thật

## 2. Stack

| Thành phần | Công nghệ |
| :--- | :--- |
| Backend | NestJS 11 |
| ORM | TypeORM 0.3 |
| DB | PostgreSQL |
| Frontend | React 19 + Vite |
| UI | Ant Design + CSS/Tailwind utility |
| Routing | React Router 7 |
| State | TanStack Query |
| Auth | Google OAuth2 + JWT |
| AI | OpenAI SDK |

## 3. Cấu trúc dữ liệu cốt lõi

### User / Family

- `users`: user toàn cục
- `families`: tenant logic
- `family_users`: membership `user_id + family_id + role_id + status`

### RBAC

- `roles`
- `permissions`
- `role_permissions`
- `invites`

### Finance

- `categories`
- `assets`
- `expenses` (transaction)

## 4. Cách auth/session đang chạy

1. User login bằng Google
2. Backend upsert `users`
3. Nếu user chưa có family membership:
   - tạo family mới
   - gán `FAMILY_ADMIN`
4. Backend trả JWT có:
   - `sub`
   - `systemRole`
   - `activeFamilyId`
   - `activeRole`
5. Frontend lưu token vào `localStorage`
6. Frontend gọi `/auth/me` để lấy session mới nhất
7. Frontend có thể switch family bằng `/auth/switch-family`

## 5. Backend modules đáng chú ý

- `auth`: OAuth, JWT, session profile, switch family, accept invite
- `permission`: seed permission definitions, role template, permission lookup
- `user`: member listing, invite, update role, remove membership
- `family`: family profile trong active family
- `admin`: cấu trúc hệ thống cho `APP_ADMIN`
- `category`: hierarchy tài chính
- `expense`: transactions, recurring, transfer

## 6. Frontend state hiện tại

- `SessionProvider` đọc `/auth/me` và giữ session hiện tại
- Sidebar/MobileHeader đã hiểu:
  - family đang chọn
  - role hiện tại
  - switch family
  - ẩn/hiện menu theo quyền
- Route có guard theo permission view để tránh rơi vào màn không có quyền

## 7. Các giới hạn cần biết trước khi mở rộng

- Web admin dành riêng cho `APP_ADMIN` chưa hoàn thiện; backend API đã có
- Invite flow mới dừng ở token-based backend, chưa có mail sender thật
- User settings backend chưa tách hẳn thành module riêng theo user
- Coverage test còn mỏng

## 8. Migrations quan trọng

- `1775304000000-RefactorFinanceCategoryHierarchy`
- `1775400000000-AddMultiFamilyRbac`

Khi dựng môi trường mới hoặc deploy DB cũ, cần chạy migration đầy đủ trước.

## 9. Checklist khi AI khác tiếp quản

1. Chạy build cả backend và frontend
2. Kiểm tra migration trên DB thật
3. Kiểm tra login mới, create family, invite, accept invite, switch family
4. Kiểm tra APP_ADMIN không truy cập finance data
5. Kiểm tra transfer không vào dashboard tổng thu/chi
6. Kiểm tra category type consistency
7. Kiểm tra UI route/menu đúng theo role
