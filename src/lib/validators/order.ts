import { z } from "zod";

export const checkoutSchema = z.object({
  addressId: z.string().min(1, "Vui lòng chọn địa chỉ giao"),
  paymentMethod: z.enum(["COD", "BANK", "DEBT"]),
  note: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        qty: z.number().int().positive(),
      }),
    )
    .min(1, "Giỏ hàng đang trống"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const completeDeliverySchema = z.object({
  orderId: z.string().min(1),
  emptiesCollected: z.number().int().min(0).default(0),
  collected: z.boolean(), // true = đã thu tiền, false = ghi nợ
});

export type CompleteDeliveryInput = z.infer<typeof completeDeliverySchema>;
