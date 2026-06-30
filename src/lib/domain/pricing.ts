// Logic tính giá đơn — thuần, không phụ thuộc Next/Prisma. Tiền: integer VND.

export interface PricingLine {
  unitPrice: number; // giá 1 đơn vị (VND)
  qty: number;
  depositPrice?: number; // cọc vỏ 1 đơn vị (VND)
  returnedEmpties?: number; // số vỏ rỗng khách trả lại cho dòng này
  isReturnable?: boolean; // hàng có vỏ tuần hoàn không
}

export interface PricingInput {
  lines: PricingLine[];
  shippingFee?: number; // phí ship cơ bản của khu vực (VND)
  freeShipThreshold?: number; // ngưỡng miễn ship theo tiền hàng (0 = không áp dụng)
  discount?: number; // giảm giá (VND)
}

export interface PricingResult {
  subtotal: number; // tiền hàng
  depositTotal: number; // tiền cọc vỏ (ròng)
  shippingFee: number; // phí ship thực thu
  discount: number;
  total: number; // tổng phải trả
}

export function lineTotal(line: PricingLine): number {
  return line.unitPrice * line.qty;
}

export function computeSubtotal(lines: PricingLine[]): number {
  return lines.reduce((sum, l) => sum + lineTotal(l), 0);
}

/** Cọc vỏ tính trên số vỏ ròng đưa thêm vào lưu thông = max(0, giao − trả). */
export function computeDeposit(lines: PricingLine[]): number {
  return lines.reduce((sum, l) => {
    const deposit = l.depositPrice ?? 0;
    if (!l.isReturnable || deposit <= 0) return sum;
    const net = Math.max(0, l.qty - (l.returnedEmpties ?? 0));
    return sum + deposit * net;
  }, 0);
}

export function computeShipping(subtotal: number, baseFee: number, freeShipThreshold: number): number {
  if (freeShipThreshold > 0 && subtotal >= freeShipThreshold) return 0;
  return baseFee;
}

export function priceOrder(input: PricingInput): PricingResult {
  const subtotal = computeSubtotal(input.lines);
  const depositTotal = computeDeposit(input.lines);
  const shippingFee = computeShipping(subtotal, input.shippingFee ?? 0, input.freeShipThreshold ?? 0);
  const discount = input.discount ?? 0;
  const total = Math.max(0, subtotal + depositTotal + shippingFee - discount);
  return { subtotal, depositTotal, shippingFee, discount, total };
}
