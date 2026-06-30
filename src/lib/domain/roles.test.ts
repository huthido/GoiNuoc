import { describe, it, expect } from "vitest";
import { parseRoles, rolesToCsv, hasAnyRole } from "./types";

describe("roles (đa vai trò)", () => {
  it("parseRoles: tách, lọc hợp lệ, theo thứ tự chuẩn, bỏ trùng", () => {
    expect(parseRoles("ADMIN,DRIVER")).toEqual(["ADMIN", "DRIVER"]);
    expect(parseRoles("DRIVER,ADMIN")).toEqual(["ADMIN", "DRIVER"]); // chuẩn hóa thứ tự
    expect(parseRoles("CUSTOMER")).toEqual(["CUSTOMER"]);
    expect(parseRoles("ADMIN, ADMIN ,XYZ")).toEqual(["ADMIN"]); // bỏ trùng + rác
    expect(parseRoles("")).toEqual([]);
    expect(parseRoles(null)).toEqual([]);
  });

  it("rolesToCsv: round-trip + chuẩn hóa", () => {
    expect(rolesToCsv(["DRIVER", "ADMIN"])).toBe("ADMIN,DRIVER");
    expect(parseRoles(rolesToCsv(["CUSTOMER", "DRIVER"]))).toEqual(["CUSTOMER", "DRIVER"]);
  });

  it("hasAnyRole: giao nhau", () => {
    expect(hasAnyRole(["ADMIN", "DRIVER"], ["DRIVER"])).toBe(true);
    expect(hasAnyRole(["ADMIN", "DRIVER"], ["ADMIN", "STAFF"])).toBe(true);
    expect(hasAnyRole(["CUSTOMER"], ["ADMIN", "STAFF"])).toBe(false);
  });
});
