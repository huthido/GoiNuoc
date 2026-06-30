// Logic sổ vỏ bình — thuần. Quy ước: số dương = số vỏ khách đang giữ.

export interface BottleMovement {
  deliveredFull: number; // số bình đầy giao đi (khách nhận thêm vỏ)
  returnedEmpty: number; // số vỏ rỗng thu về (khách trả vỏ)
}

export interface BottleItem {
  qty: number;
  returnedEmpties?: number;
  isReturnable?: boolean;
}

/** Thay đổi ròng số vỏ khách giữ sau một lần giao. */
export function netBottleChange(m: BottleMovement): number {
  return m.deliveredFull - m.returnedEmpty;
}

/** Số vỏ khách giữ sau khi áp dụng giao dịch. */
export function applyBottleMovement(currentHeld: number, m: BottleMovement): number {
  return currentHeld + netBottleChange(m);
}

/** Gộp các dòng hàng (chỉ tính hàng tuần hoàn) thành một giao dịch vỏ. */
export function bottleMovementFromItems(items: BottleItem[]): BottleMovement {
  let deliveredFull = 0;
  let returnedEmpty = 0;
  for (const it of items) {
    if (!it.isReturnable) continue;
    deliveredFull += it.qty;
    returnedEmpty += it.returnedEmpties ?? 0;
  }
  return { deliveredFull, returnedEmpty };
}
