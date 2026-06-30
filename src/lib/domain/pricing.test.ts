import { describe, it, expect } from "vitest";
import { priceOrder, computeDeposit, computeShipping, computeSubtotal } from "./pricing";

describe("pricing", () => {
  it("tính subtotal theo từng dòng", () => {
    expect(
      computeSubtotal([
        { unitPrice: 25000, qty: 2 },
        { unitPrice: 90000, qty: 1 },
      ]),
    ).toBe(140000);
  });

  it("cọc vỏ tính trên số vỏ ròng (giao − trả), không âm", () => {
    // giao 2 bình, trả 1 vỏ -> cọc cho 1 vỏ
    expect(
      computeDeposit([{ unitPrice: 25000, qty: 2, depositPrice: 50000, returnedEmpties: 1, isReturnable: true }]),
    ).toBe(50000);
    // trả nhiều hơn nhận -> không cọc (không âm)
    expect(
      computeDeposit([{ unitPrice: 25000, qty: 1, depositPrice: 50000, returnedEmpties: 3, isReturnable: true }]),
    ).toBe(0);
    // hàng không tuần hoàn -> không cọc
    expect(computeDeposit([{ unitPrice: 90000, qty: 2, depositPrice: 50000, isReturnable: false }])).toBe(0);
  });

  it("miễn phí ship khi đạt ngưỡng", () => {
    expect(computeShipping(100000, 15000, 200000)).toBe(15000);
    expect(computeShipping(250000, 15000, 200000)).toBe(0);
    expect(computeShipping(100000, 15000, 0)).toBe(15000); // 0 = không có ngưỡng
  });

  it("priceOrder gộp đúng tổng = hàng + cọc + ship − giảm", () => {
    const r = priceOrder({
      lines: [
        { unitPrice: 25000, qty: 2, depositPrice: 50000, returnedEmpties: 1, isReturnable: true },
        { unitPrice: 90000, qty: 1, isReturnable: false },
      ],
      shippingFee: 15000,
      freeShipThreshold: 300000,
      discount: 10000,
    });
    expect(r.subtotal).toBe(140000); // 25000*2 + 90000
    expect(r.depositTotal).toBe(50000); // 1 vỏ ròng * 50000
    expect(r.shippingFee).toBe(15000); // 140000 < 300000
    expect(r.total).toBe(140000 + 50000 + 15000 - 10000);
  });

  it("total không âm khi giảm giá lớn", () => {
    const r = priceOrder({ lines: [{ unitPrice: 25000, qty: 1 }], discount: 999999 });
    expect(r.total).toBe(0);
  });
});
