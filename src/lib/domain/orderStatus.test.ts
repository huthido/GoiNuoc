import { describe, it, expect } from "vitest";
import { canTransition, assertTransition, nextStatuses, isTerminal } from "./orderStatus";

describe("orderStatus", () => {
  it("cho phép các bước hợp lệ trong vòng đời", () => {
    expect(canTransition("PENDING", "CONFIRMED")).toBe(true);
    expect(canTransition("CONFIRMED", "ASSIGNED")).toBe(true);
    expect(canTransition("ASSIGNED", "DELIVERING")).toBe(true);
    expect(canTransition("DELIVERING", "DELIVERED")).toBe(true);
  });

  it("chặn bước không hợp lệ", () => {
    expect(canTransition("PENDING", "DELIVERED")).toBe(false);
    expect(canTransition("DELIVERED", "PENDING")).toBe(false);
    expect(canTransition("CANCELLED", "CONFIRMED")).toBe(false);
  });

  it("xét vai trò: chỉ tài xế/admin được đánh dấu đã giao", () => {
    expect(canTransition("DELIVERING", "DELIVERED", "DRIVER")).toBe(true);
    expect(canTransition("DELIVERING", "DELIVERED", "ADMIN")).toBe(true);
    expect(canTransition("DELIVERING", "DELIVERED", "CUSTOMER")).toBe(false);
  });

  it("khách được hủy khi chờ xác nhận, không được xác nhận đơn", () => {
    expect(canTransition("PENDING", "CANCELLED", "CUSTOMER")).toBe(true);
    expect(canTransition("PENDING", "CONFIRMED", "CUSTOMER")).toBe(false);
  });

  it("assertTransition ném lỗi khi sai", () => {
    expect(() => assertTransition("PENDING", "DELIVERED")).toThrow();
    expect(() => assertTransition("DELIVERING", "DELIVERED", "DRIVER")).not.toThrow();
  });

  it("DELIVERED/CANCELLED là trạng thái cuối", () => {
    expect(isTerminal("DELIVERED")).toBe(true);
    expect(isTerminal("CANCELLED")).toBe(true);
    expect(isTerminal("PENDING")).toBe(false);
    expect(nextStatuses("FAILED")).toContain("ASSIGNED"); // cho giao lại
  });
});
