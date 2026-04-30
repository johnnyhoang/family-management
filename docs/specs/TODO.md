# Production Backlog

Backlog này phản ánh trạng thái sau các refactor lớn về finance category, multi-family RBAC và UI.

## P0 — Phải chốt trước production launch

### 1. Bổ sung integration tests cho flow sống còn

Thiếu test cho:

- login lần đầu -> auto create family -> FAMILY_ADMIN
- switch active family
- invite + accept invite
- APP_ADMIN không truy cập finance data
- transfer không vào dashboard tổng thu/chi
- last FAMILY_ADMIN không bị remove/demote

### 2. Hoàn thiện web admin riêng cho APP_ADMIN

Backend API cho admin đã có, nhưng frontend admin tách biệt chưa hoàn thiện. Không nên launch `APP_ADMIN` cho user thật nếu chưa có bề mặt quản trị phù hợp.

### 3. Tích hợp email sender cho invite flow

Hiện tại invite là token-based backend flow. Muốn production thật cần:

- mail provider
- template email
- deep link nhận lời mời

## P1 — Nên xử lý ngay sau P0

### 4. Tách user settings backend riêng theo user

Hiện chỉnh hồ sơ trên web còn đi qua endpoint user trong active family. Về lâu dài nên có endpoint user-scoped độc lập với family session.

### 5. Audit lại migration trên dữ liệu thật

Đặc biệt với:

- category legacy có `subTypes`
- transaction legacy `DEBT`
- membership legacy từ `users.familyId`

### 6. Chuẩn hóa family status lifecycle

Hiện có `ACTIVE | INACTIVE`. Cần xác nhận nghiệp vụ suspend/reactivate trên UI admin và quy trình support.

## P2 — Nâng chất lượng kỹ thuật

### 7. Tăng chỉ số và index cho bảng mới

Xem lại index cho:

- `family_users(userId, status)`
- `invites(email, status, expiresAt)`
- `users(lastActiveFamilyId)`

### 8. Rà soát DTO validation

Một số route mới đang nhận object inline trong controller/service. Nên chuyển dần sang DTO + class-validator cho:

- invite
- switch family
- accept invite
- update role

### 9. Thêm observability

- request logging có correlation id
- audit log cho invite, role change, family status change
- error monitoring cho frontend và backend

### 10. Tiếp tục tối ưu bundle frontend

Đã tách lazy route, nhưng build hiện vẫn còn 2 chunk lớn từ dashboard/vendor. Cần cân nhắc:

- `manualChunks`
- tách `NaturalInputBox`
- tách chart/editor nặng khỏi luồng khởi động chính

## P3 — UX polish

### 11. Màn nhận lời mời trên web

Hiện backend đã có `/auth/accept-invite`, nhưng UX trên web còn tối giản. Nên có route nhận token rõ ràng hơn.

### 12. Màn chọn family khi user có nhiều family

Đã có switcher trong sidebar, nhưng có thể thêm selector rõ hơn ngay sau login với user nhiều gia đình.

### 13. Admin/family analytics tách bạch hơn

Hiện `APP_ADMIN` được điều hướng về bề mặt an toàn. Sau này cần tách dashboard hệ thống riêng thay vì dùng chung shell tài chính gia đình.
