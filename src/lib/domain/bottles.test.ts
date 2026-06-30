import { describe, it, expect } from "vitest";
import { applyBottleMovement, netBottleChange, bottleMovementFromItems } from "./bottles";

describe("bottles", () => {
  it("thay đổi ròng = giao − trả", () => {
    expect(netBottleChange({ deliveredFull: 2, returnedEmpty: 1 })).toBe(1);
    expect(netBottleChange({ deliveredFull: 0, returnedEmpty: 2 })).toBe(-2);
  });

  it("cập nhật số vỏ khách giữ", () => {
    expect(applyBottleMovement(3, { deliveredFull: 2, returnedEmpty: 1 })).toBe(4);
    expect(applyBottleMovement(3, { deliveredFull: 0, returnedEmpty: 3 })).toBe(0);
  });

  it("gộp dòng hàng chỉ tính hàng tuần hoàn", () => {
    const m = bottleMovementFromItems([
      { qty: 2, returnedEmpties: 1, isReturnable: true },
      { qty: 5, isReturnable: false }, // thùng chai -> bỏ qua
      { qty: 1, isReturnable: true },
    ]);
    expect(m).toEqual({ deliveredFull: 3, returnedEmpty: 1 });
  });
});
