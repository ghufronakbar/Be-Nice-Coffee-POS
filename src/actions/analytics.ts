"use server"

import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"

type DateRangeInput = {
  startDate?: string
  endDate?: string
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

function parseDateInput(value: string | undefined, fallback: Date) {
  if (!value) {
    return fallback
  }

  const parsedDate = new Date(`${value}T00:00:00`)

  if (Number.isNaN(parsedDate.getTime())) {
    return fallback
  }

  return parsedDate
}

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(date)
}

function resolveDateRange(input: DateRangeInput, defaultDays = 29) {
  const today = startOfDay(new Date())
  const fallbackStart = addDays(today, -defaultDays)
  const startDate = startOfDay(parseDateInput(input.startDate, fallbackStart))
  const endDate = endOfDay(parseDateInput(input.endDate, today))

  if (startDate > endDate) {
    return {
      startDate: startOfDay(endDate),
      endDate: endOfDay(startDate),
    }
  }

  return {
    startDate,
    endDate,
  }
}

function buildDailyBuckets(startDate: Date, endDate: Date) {
  const buckets = new Map<string, { date: string; label: string; revenue: number; profit: number; orders: number }>()
  let currentDate = startOfDay(startDate)

  while (currentDate <= endDate) {
    const key = formatDateKey(currentDate)
    buckets.set(key, {
      date: key,
      label: formatShortDate(currentDate),
      revenue: 0,
      profit: 0,
      orders: 0,
    })
    currentDate = addDays(currentDate, 1)
  }

  return buckets
}

function buildOrderWhere(startDate: Date, endDate: Date): Prisma.OrderWhereInput {
  return {
    deletedAt: null,
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  }
}

export async function getDashboardOverviewAction() {
  const todayStart = startOfDay(new Date())
  const todayEnd = endOfDay(new Date())
  const weekStart = addDays(todayStart, -6)

  const [
    todayOrders,
    pendingOrders,
    lowStockMaterials,
    menusWithoutRecipe,
    latestOrders,
    latestTransactions,
    latestPurchases,
    weeklyOrders,
  ] = await Promise.all([
    prisma.order.findMany({
      where: buildOrderWhere(todayStart, todayEnd),
      select: {
        total: true,
        recordedProfit: true,
        status: true,
      },
    }),
    prisma.order.count({
      where: {
        deletedAt: null,
        status: "PENDING",
      },
    }),
    prisma.material.findMany({
      where: {
        deletedAt: null,
        recordedAmount: {
          lte: new Prisma.Decimal(0),
        },
      },
      select: {
        id: true,
        name: true,
        unit: true,
        recordedAmount: true,
      },
      orderBy: {
        recordedAmount: "asc",
      },
      take: 6,
    }),
    prisma.menu.findMany({
      where: {
        deletedAt: null,
        recipes: {
          none: {
            deletedAt: null,
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 6,
    }),
    prisma.order.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
        total: true,
        createdAt: true,
        customer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
    prisma.materialTransaction.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        type: true,
        amount: true,
        createdAt: true,
        material: {
          select: {
            name: true,
            unit: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
    prisma.materialPurchase.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
    prisma.order.findMany({
      where: buildOrderWhere(weekStart, todayEnd),
      select: {
        createdAt: true,
        total: true,
        recordedProfit: true,
      },
    }),
  ])

  const weeklyBuckets = buildDailyBuckets(weekStart, todayEnd)

  for (const order of weeklyOrders) {
    const key = formatDateKey(order.createdAt)
    const bucket = weeklyBuckets.get(key)

    if (bucket) {
      bucket.orders += 1
      bucket.revenue += Number(order.total)
      bucket.profit += Number(order.recordedProfit)
    }
  }

  return {
    metrics: {
      todayOrderCount: todayOrders.length,
      todayRevenue: todayOrders.reduce((total, order) => total + Number(order.total), 0),
      todayProfit: todayOrders.reduce((total, order) => total + Number(order.recordedProfit), 0),
      pendingOrderCount: pendingOrders,
    },
    alerts: {
      lowStockMaterials: lowStockMaterials.map((material) => ({
        id: material.id,
        name: material.name,
        unit: material.unit,
        recordedAmount: Number(material.recordedAmount),
      })),
      menusWithoutRecipe,
    },
    latestOrders: latestOrders.map((order) => ({
      id: order.id,
      status: order.status,
      total: Number(order.total),
      createdAt: order.createdAt,
      customerName: order.customer?.name ?? null,
    })),
    latestTransactions: latestTransactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      amount: Number(transaction.amount),
      createdAt: transaction.createdAt,
      materialName: transaction.material.name,
      materialUnit: transaction.material.unit,
    })),
    latestPurchases: latestPurchases.map((purchase) => ({
      id: purchase.id,
      invoiceNumber: purchase.invoiceNumber,
      total: Number(purchase.total),
      createdAt: purchase.createdAt,
    })),
    salesTrend: Array.from(weeklyBuckets.values()),
  }
}

export async function getReportDataAction(input: DateRangeInput) {
  const { startDate, endDate } = resolveDateRange(input)
  const orderWhere = buildOrderWhere(startDate, endDate)

  const [orders, purchases, materialTransactions, materials] = await Promise.all([
    prisma.order.findMany({
      where: orderWhere,
      select: {
        id: true,
        status: true,
        total: true,
        recordedBuyPrice: true,
        recordedProfit: true,
        createdAt: true,
        orderItems: {
          where: {
            deletedAt: null,
          },
          select: {
            amount: true,
            total: true,
            recordedBuyPrice: true,
            menu: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.materialPurchase.findMany({
      where: {
        deletedAt: null,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        createdAt: true,
      },
    }),
    prisma.materialTransaction.findMany({
      where: {
        deletedAt: null,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        type: true,
        amount: true,
        createdAt: true,
        material: {
          select: {
            id: true,
            name: true,
            unit: true,
            recordedBuyPrice: true,
          },
        },
      },
    }),
    prisma.material.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        unit: true,
        recordedAmount: true,
        recordedBuyPrice: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ])

  const dailyBuckets = buildDailyBuckets(startDate, endDate)
  const statusSummary = new Map([
    ["PENDING", { status: "PENDING", count: 0, total: 0 }],
    ["COMPLETED", { status: "COMPLETED", count: 0, total: 0 }],
    ["CANCELLED", { status: "CANCELLED", count: 0, total: 0 }],
  ])
  const menuSummary = new Map<string, { menuId: number; name: string; quantity: number; revenue: number; profit: number }>()

  for (const order of orders) {
    const key = formatDateKey(order.createdAt)
    const dailyBucket = dailyBuckets.get(key)

    if (dailyBucket) {
      dailyBucket.orders += 1
      dailyBucket.revenue += Number(order.total)
      dailyBucket.profit += Number(order.recordedProfit)
    }

    const status = statusSummary.get(order.status)

    if (status) {
      status.count += 1
      status.total += Number(order.total)
    }

    for (const item of order.orderItems) {
      const menuKey = String(item.menu.id)
      const current = menuSummary.get(menuKey) ?? {
        menuId: item.menu.id,
        name: item.menu.name,
        quantity: 0,
        revenue: 0,
        profit: 0,
      }

      current.quantity += item.amount
      current.revenue += Number(item.total)
      current.profit += Number(item.total) - Number(item.recordedBuyPrice)
      menuSummary.set(menuKey, current)
    }
  }

  const materialUsage = new Map<string, { materialId: number; name: string; unit: string; amount: number; estimatedValue: number }>()

  for (const transaction of materialTransactions) {
    if (transaction.type !== "SELL") {
      continue
    }

    const materialKey = String(transaction.material.id)
    const current = materialUsage.get(materialKey) ?? {
      materialId: transaction.material.id,
      name: transaction.material.name,
      unit: transaction.material.unit,
      amount: 0,
      estimatedValue: 0,
    }
    const usedAmount = Math.abs(Number(transaction.amount))

    current.amount += usedAmount
    current.estimatedValue += usedAmount * Number(transaction.material.recordedBuyPrice)
    materialUsage.set(materialKey, current)
  }

  const materialTransactionSummary = new Map([
    ["PURCHASE", { type: "PURCHASE", count: 0, amount: 0 }],
    ["SELL", { type: "SELL", count: 0, amount: 0 }],
    ["ADJUSTMENT", { type: "ADJUSTMENT", count: 0, amount: 0 }],
  ])

  for (const transaction of materialTransactions) {
    const current = materialTransactionSummary.get(transaction.type)

    if (current) {
      current.count += 1
      current.amount += Number(transaction.amount)
    }
  }

  const revenue = orders.reduce((total, order) => total + Number(order.total), 0)
  const profit = orders.reduce((total, order) => total + Number(order.recordedProfit), 0)
  const buyPrice = orders.reduce((total, order) => total + Number(order.recordedBuyPrice), 0)
  const purchaseTotal = purchases.reduce((total, purchase) => total + Number(purchase.total), 0)
  const inventoryValue = materials.reduce((total, material) => {
    return total + Number(material.recordedAmount) * Number(material.recordedBuyPrice)
  }, 0)

  return {
    range: {
      startDate: formatDateKey(startDate),
      endDate: formatDateKey(endDate),
    },
    metrics: {
      revenue,
      profit,
      buyPrice,
      orderCount: orders.length,
      averageOrderValue: orders.length > 0 ? revenue / orders.length : 0,
      purchaseTotal,
      purchaseCount: purchases.length,
      inventoryValue,
    },
    salesTrend: Array.from(dailyBuckets.values()),
    statusSummary: Array.from(statusSummary.values()),
    topMenus: Array.from(menuSummary.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10),
    materialUsage: Array.from(materialUsage.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10),
    materialTransactionSummary: Array.from(materialTransactionSummary.values()),
    inventory: materials.map((material) => ({
      id: material.id,
      name: material.name,
      unit: material.unit,
      recordedAmount: Number(material.recordedAmount),
      recordedBuyPrice: Number(material.recordedBuyPrice),
      estimatedValue: Number(material.recordedAmount) * Number(material.recordedBuyPrice),
    })),
    csvRows: {
      orders: orders.map((order) => ({
        id: order.id,
        status: order.status,
        total: Number(order.total),
        recordedBuyPrice: Number(order.recordedBuyPrice),
        recordedProfit: Number(order.recordedProfit),
        createdAt: order.createdAt.toISOString(),
      })),
      purchases: purchases.map((purchase) => ({
        id: purchase.id,
        invoiceNumber: purchase.invoiceNumber,
        total: Number(purchase.total),
        createdAt: purchase.createdAt.toISOString(),
      })),
      inventory: materials.map((material) => ({
        id: material.id,
        name: material.name,
        unit: material.unit,
        recordedAmount: Number(material.recordedAmount),
        recordedBuyPrice: Number(material.recordedBuyPrice),
        estimatedValue: Number(material.recordedAmount) * Number(material.recordedBuyPrice),
      })),
    },
  }
}
