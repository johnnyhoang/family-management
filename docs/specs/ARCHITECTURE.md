# System Architecture

## 1. High-level flow

```text
Browser
  -> React SPA (web)
  -> Bearer JWT
  -> NestJS API (/api/v1)
  -> TypeORM
  -> PostgreSQL
```

External integrations:

- Google OAuth2
- OpenAI API
- File storage module (nếu đang bật môi trường upload)

## 2. Request lifecycle

```text
Browser request
  -> AuthGuard('jwt')
  -> JwtStrategy resolve user + active family membership
  -> ActiveFamilyGuard (nếu route yêu cầu family session)
  -> PermissionGuard
  -> Controller
  -> Service
  -> Repository / QueryBuilder
```

Điểm quan trọng:

- `JwtStrategy` là lớp chốt membership đang hoạt động
- `PermissionGuard` map module/action sang permission template
- `APP_ADMIN` bị chặn khỏi các module tài chính

## 3. Multi-family model

```text
users
  1 --- n family_users n --- 1 families
```

`family_users` là nguồn sự thật cho:

- family membership
- family role
- membership status

`users.lastActiveFamilyId` chỉ là session preference.

## 4. RBAC model

```text
roles
  1 --- n role_permissions n --- 1 permissions

family_users.roleId -> roles.id
invites.roleId -> roles.id
```

### Permission modules

- `ADMIN`
- `FAMILY`
- `USER`
- `PERMISSION`
- `DASHBOARD`
- `CATEGORY`
- `CALENDAR`
- `ASSET`
- `TRANSACTION`

### Actions

- `view`
- `create`
- `update`
- `delete`

## 5. Auth flow

```text
/auth/google
  -> Google callback
  -> validateOAuthUser()
      -> upsert user
      -> seed permissions/roles
      -> create default family if user has no membership
      -> choose active family
  -> sign JWT
  -> redirect frontend with token
```

Frontend:

```text
login-success
  -> save token
  -> load /auth/me
  -> SessionProvider caches session
  -> sidebar/routes derive family and permission state
```

## 6. Invite flow

```text
FAMILY_ADMIN
  -> POST /users/invite
  -> create invite token + expiry

Invited user
  -> login Google
  -> POST /auth/accept-invite
  -> create or reactivate family_users membership
  -> switch active family to invited family
```

Lưu ý:

- Hiện chưa có email sender thật
- Invite hiện là token-based backend flow

## 7. Finance category model

```text
Category(type=ASSET|LIABILITY|INCOME|EXPENSE, level=GROUP|CATEGORY, parentId?)
```

Rules:

- `GROUP` là tầng trung gian
- `CATEGORY` phải có `parentId`
- parent và child phải cùng `type`

Ví dụ:

```text
ASSET
  -> Investment
    -> Stock
    -> Crypto
EXPENSE
  -> Sinh hoạt
    -> Điện nước
INCOME
  -> Lương
    -> Lương chính
LIABILITY
  -> Vay mượn
    -> Nợ bạn bè
```

## 8. Transaction model

Entity transaction hiện dùng `Expense`:

- `entryType`: `INCOME | EXPENSE | LIABILITY`
- `isRecurring`
- `isTransfer`

Analytics rules:

- `isTransfer = true` không đi vào tổng thu chi
- transfer không đi vào breakdown income/expense bình thường

## 9. Frontend authorization model

Frontend không thay backend authorization, nhưng làm 3 việc:

1. load session qua `/auth/me`
2. ẩn menu theo permission template
3. redirect khỏi route không có `view` permission

Điều này giảm số màn `403` vô nghĩa và khớp trải nghiệm với backend.

## 10. Production concerns

Các điểm còn cần chú ý trước launch:

- chưa có admin web riêng cho `APP_ADMIN`
- chưa có outbound email cho invite
- test integration còn thiếu cho:
  - multi-family isolation
  - switch family
  - invite accept
  - finance category migration
  - transfer exclusion
