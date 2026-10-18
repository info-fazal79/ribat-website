"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { OrderStatus } from "@/generated/prisma/enums";
import { requireStaff } from "@/server/auth/guards";
import { db } from "@/server/db";

const input = z.object({ id: z.string().min(1), status: z.enum(OrderStatus), note: z.string().max(500).optional() });

export async function updateOrderStatus(raw: z.input<typeof input>) {
  const user = await requireStaff();
  const { id, status, note } = input.parse(raw);

  await db.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id }, select: { status: true } });
    if (order.status === status) return;
    await tx.order.update({
      where: { id },
      data: {
        status,
        ...(status === "DELIVERED" && { deliveredAt: new Date() }),
        ...(status === "CANCELLED" && { cancelledAt: new Date() }),
      },
    });
    await tx.orderStatusHistory.create({
      data: {
        orderId: id,
        fromStatus: order.status,
        toStatus: status,
        note,
        // The dev-only login has no User row.
        changedById: user.id === "dev-admin" ? null : user.id,
      },
    });
    // TODO(orders): restock variants + InventoryLog on CANCELLED/RETURNED once checkout decrements stock.
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}
