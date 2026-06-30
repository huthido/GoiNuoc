export const metadata = { title: "Ngoại tuyến · Gọi Nước" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="text-5xl">📴</div>
      <h1 className="text-xl font-semibold">Bạn đang ngoại tuyến</h1>
      <p className="max-w-sm text-sm text-gray-500">
        Không có kết nối mạng. Bạn vẫn xem được các trang đã tải trước đó. Vui lòng kết nối lại để đặt
        nước và cập nhật đơn hàng.
      </p>
    </main>
  );
}
