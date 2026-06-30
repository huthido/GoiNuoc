# Feature Specification: Hệ thống đặt nước đóng bình (Gọi Nước)

**Feature Branch**: `001-dat-nuoc`

**Created**: 2026-06-30

**Status**: Draft

**Input**: User description: "Hệ thống đặt nước đóng bình: app khách PWA, admin nhà máy, app tài xế; quản lý đơn, vỏ bình, công nợ, tuyến giao"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Khách đặt nước (Priority: P1)

Khách (hộ gia đình/văn phòng) mở app trên điện thoại, chọn sản phẩm (bình 20L, thùng chai),
chọn địa chỉ giao, đặt đơn và theo dõi trạng thái tới khi nhận hàng.

**Why this priority**: Đây là lý do tồn tại của hệ thống — thay việc gọi điện đặt nước.
Có nó là đã có MVP mang lại giá trị.

**Independent Test**: Đăng nhập tài khoản khách demo → thêm 2 bình 20L vào giỏ → đặt đơn →
thấy đơn ở trạng thái "Chờ xác nhận" trong mục "Đơn của tôi".

**Acceptance Scenarios**:
1. **Given** khách đã đăng nhập và có địa chỉ mặc định, **When** đặt 2 bình 20L + 1 thùng chai và xác nhận, **Then** tạo đơn trạng thái PENDING với tổng tiền = hàng + ship + cọc vỏ (nếu có).
2. **Given** khách có đơn đã giao trước đó, **When** bấm "Đặt lại", **Then** giỏ hàng được điền sẵn đúng sản phẩm/số lượng đơn cũ.
3. **Given** một đơn của khách, **When** admin/tài xế cập nhật trạng thái, **Then** khách thấy trạng thái mới trên màn theo dõi.

---

### User Story 2 - Admin duyệt đơn & phân tài xế (Priority: P1)

Nhân viên nhà máy xem đơn mới, xác nhận, phân cho tài xế giao, và quản lý sản phẩm/giá/khách.

**Why this priority**: Không có khâu này thì đơn của khách không được xử lý — bắt buộc cho vòng đời đơn.

**Independent Test**: Đăng nhập admin → mở danh sách đơn → xác nhận một đơn PENDING → phân cho tài xế A →
đơn chuyển sang ASSIGNED và hiện tài xế phụ trách.

**Acceptance Scenarios**:
1. **Given** đơn PENDING, **When** admin "Xác nhận", **Then** đơn thành CONFIRMED.
2. **Given** đơn CONFIRMED, **When** admin chọn tài xế và "Phân giao", **Then** đơn thành ASSIGNED, gắn `assignedDriverId`.
3. **Given** trang sản phẩm, **When** admin sửa giá/cọc vỏ/tồn kho, **Then** giá mới áp cho đơn tạo sau đó.

---

### User Story 3 - Tài xế giao hàng, thu vỏ & tiền (Priority: P2)

Tài xế xem danh sách đơn được phân trong ngày, bắt đầu giao, đánh dấu đã giao, nhập số vỏ thu lại
và cách thanh toán (đã thu tiền / ghi nợ).

**Why this priority**: Hoàn tất vòng đời đơn và cập nhật chính xác sổ vỏ + công nợ — giá trị nghiệp vụ cốt lõi nhưng có thể theo sau US1/US2.

**Independent Test**: Đăng nhập tài xế A → thấy đơn ASSIGNED → "Đã giao", nhập thu 1 vỏ, chọn "Ghi nợ" →
đơn thành DELIVERED, sổ vỏ khách +1 (giao 2 − trả 1), công nợ tăng đúng tổng tiền.

**Acceptance Scenarios**:
1. **Given** đơn ASSIGNED của tài xế, **When** "Bắt đầu giao", **Then** đơn thành DELIVERING.
2. **Given** đơn DELIVERING, **When** "Đã giao" với số vỏ thu = 1 và thanh toán = COD, **Then** đơn DELIVERED, paymentStatus PAID, ghi `BottleTxn`, cập nhật `emptyBottlesHeld`.
3. **Given** đơn DELIVERING, **When** "Đã giao" với thanh toán = Ghi nợ, **Then** paymentStatus DEBT và công nợ khách tăng.

---

### Edge Cases
- Khách trả vỏ nhiều hơn số bình nhận → số vỏ giữ giảm; không cho âm vô lý (cảnh báo nếu trả > đang giữ + đang nhận).
- Hủy đơn: chỉ cho hủy khi PENDING/CONFIRMED, không cho khi đang/đã giao.
- Giao hụt (khách vắng): đơn về trạng thái FAILED, không ghi vỏ/tiền.
- Đặt khi offline: cho xem danh mục (cache), nhưng chặn gửi đơn và báo "cần kết nối mạng".
- Khách vượt hạn mức công nợ → admin/tài xế được cảnh báo trước khi cho ghi nợ thêm.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: Hệ thống PHẢI cho khách đăng nhập bằng số điện thoại + mật khẩu, phân quyền theo vai trò (CUSTOMER/ADMIN/STAFF/DRIVER).
- **FR-002**: Khách PHẢI duyệt danh mục sản phẩm, thêm vào giỏ, chọn địa chỉ và đặt đơn.
- **FR-003**: Hệ thống PHẢI tính tổng đơn = tiền hàng + phí ship (theo khu vực, miễn phí khi đạt ngưỡng) + tiền cọc vỏ ròng − giảm giá.
- **FR-004**: Hệ thống PHẢI lưu vòng đời trạng thái đơn và chỉ cho chuyển trạng thái hợp lệ theo vai trò.
- **FR-005**: Admin PHẢI xác nhận, hủy, và phân tài xế cho đơn; CRUD sản phẩm/giá/cọc/tồn kho; xem khách + công nợ + sổ vỏ.
- **FR-006**: Tài xế PHẢI thấy đơn được phân, cập nhật trạng thái giao, nhập số vỏ thu và cách thanh toán.
- **FR-007**: Hệ thống PHẢI ghi mọi thay đổi vỏ vào sổ cái `BottleTxn` và cập nhật số vỏ khách đang giữ khi đơn DELIVERED.
- **FR-008**: Hệ thống PHẢI hỗ trợ công nợ: trạng thái thanh toán UNPAID/PAID/DEBT và số dư nợ truy vết theo đơn.
- **FR-009**: App khách & tài xế PHẢI là PWA cài được (manifest + service worker + offline fallback).
- **FR-010**: Tiền PHẢI lưu dạng integer VND.

### Key Entities
- **User**: người dùng + vai trò; khách có số vỏ đang giữ, hạn mức công nợ.
- **Address / Zone**: địa chỉ giao của khách; khu vực giao quy định phí ship + ngưỡng freeship.
- **Product**: sản phẩm nước (bình 20L tuần hoàn có cọc vỏ; thùng/chai); giá, tồn kho.
- **Order / OrderItem**: đơn + dòng hàng (snapshot giá, số lượng, số vỏ trả lại từng dòng).
- **BottleTxn**: sổ cái vỏ bình (giao/ trả, số dư sau).
- **Notification / Subscription**: thông báo; đặt định kỳ (Phase 2).

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: Khách hoàn tất một đơn (từ mở app tới xác nhận) dưới 1 phút với dữ liệu mẫu.
- **SC-002**: Một đơn đi trọn vòng PENDING → DELIVERED qua 3 vai mà số vỏ và công nợ khớp tuyệt đối.
- **SC-003**: App đạt tiêu chí "Installable" của Lighthouse và mở được trang offline khi mất mạng.
- **SC-004**: Test domain (pricing/bottles/orderStatus) xanh 100% trước khi merge.

## Assumptions
- Một nhà máy / một thương hiệu (chưa đa nhà cung cấp).
- Thanh toán: COD và Ghi nợ (chuyển khoản xác nhận thủ công); chưa tích hợp cổng thanh toán online.
- Đăng nhập SĐT + mật khẩu (chưa OTP SMS) ở v1; có thể thêm OTP sau.
- DB SQLite cho dev/tự host; có thể đổi Postgres sau mà không đổi schema nghiệp vụ.
- Đặt định kỳ và Push notification là Phase 2 (không chặn MVP).
