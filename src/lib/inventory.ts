import { Prisma } from "@prisma/client"

export function toDecimal(value: number | Prisma.Decimal) {
  return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value)
}

export async function ensureMaterialsExistForTransaction(
  tx: Prisma.TransactionClient,
  materialIds: number[]
) {
  const uniqueMaterialIds = [...new Set(materialIds)]

  const totalMaterials = await tx.material.count({
    where: {
      id: {
        in: uniqueMaterialIds,
      },
      deletedAt: null,
    },
  })

  return totalMaterials === uniqueMaterialIds.length
}

export async function refreshMaterialStockSnapshot(
  tx: Prisma.TransactionClient,
  materialIds: number[]
) {
  const uniqueMaterialIds = [...new Set(materialIds)]

  if (uniqueMaterialIds.length === 0) {
    return
  }

  const materials = await tx.material.findMany({
    where: {
      id: {
        in: uniqueMaterialIds,
      },
      deletedAt: null,
    },
    select: {
      id: true,
      materialTransactions: {
        where: {
          deletedAt: null,
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: {
          type: true,
          amount: true,
          materialPurchaseItem: {
            select: {
              amount: true,
              total: true,
              deletedAt: true,
              materialPurchase: {
                select: {
                  deletedAt: true,
                },
              },
            },
          },
        },
      },
    },
  })

  for (const material of materials) {
    let stockAmount = new Prisma.Decimal(0)
    let stockValue = new Prisma.Decimal(0)

    for (const transaction of material.materialTransactions) {
      if (transaction.type === "PURCHASE") {
        const purchaseItem = transaction.materialPurchaseItem

        if (
          purchaseItem &&
          purchaseItem.deletedAt === null &&
          purchaseItem.materialPurchase.deletedAt === null
        ) {
          stockAmount = stockAmount.plus(toDecimal(purchaseItem.amount))
          stockValue = stockValue.plus(toDecimal(purchaseItem.total))
          continue
        }
      }

      const amountDelta = toDecimal(transaction.amount)
      const averageCostBefore =
        stockAmount.greaterThan(0) && stockValue.greaterThan(0)
          ? stockValue.div(stockAmount)
          : new Prisma.Decimal(0)

      stockAmount = stockAmount.plus(amountDelta)
      stockValue = stockValue.plus(averageCostBefore.mul(amountDelta))

      if (stockAmount.lessThanOrEqualTo(0)) {
        stockAmount = new Prisma.Decimal(0)
        stockValue = new Prisma.Decimal(0)
      } else if (stockValue.lessThan(0)) {
        stockValue = new Prisma.Decimal(0)
      }
    }

    const recordedBuyPrice =
      stockAmount.greaterThan(0) && stockValue.greaterThan(0)
        ? stockValue.div(stockAmount)
        : new Prisma.Decimal(0)

    await tx.material.update({
      where: {
        id: material.id,
      },
      data: {
        recordedAmount: stockAmount,
        recordedBuyPrice,
      },
    })
  }
}
