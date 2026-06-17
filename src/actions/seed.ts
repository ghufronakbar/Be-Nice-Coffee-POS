"use server";

import {
  createCustomerAction,
  getCustomerListAction,
} from "@/actions/customer";
import {
  createMaterialAction,
  createMaterialAdjustmentAction,
  createMaterialPurchaseAction,
  getMaterialAdjustmentListAction,
  getMaterialListAction,
  getMaterialPurchaseListAction,
} from "@/actions/material";
import { createMenuWithRecipesAction, getMenuListAction } from "@/actions/menu";
import {
  cancelPendingOrderAction,
  completePendingOrderAction,
  createOrderFromPosAction,
  getOrderListAction,
} from "@/actions/order";
import { prisma } from "@/lib/prisma";

type SeedStepStatus = "created" | "skipped" | "updated" | "failed";

type SeedStep = {
  group: string;
  item: string;
  status: SeedStepStatus;
  message: string;
};

type MaterialUnit = "GRAM" | "ML" | "PIECE";

type OrderSeedStatus = "PENDING" | "COMPLETED" | "CANCELLED";

const seedPrefix = "[SEED]";

const seedMaterials: Array<{
  name: string;
  unit: MaterialUnit;
  imageUrl?: string;
}> = [
  {
    name: "House Blend Beans",
    unit: "GRAM",
    imageUrl:
      "https://res.cloudinary.com/dga0wmldp/image/upload/v1781689768/1280px-Roasted_coffee_beans_prr7xp.jpg",
  },
  {
    name: "Fresh Milk",
    unit: "ML",
    imageUrl:
      "https://res.cloudinary.com/dga0wmldp/image/upload/v1781689802/d091897760df6b9958dd30fc5f4509a7_yneiv4.jpg",
  },
  {
    name: "Palm Sugar Syrup",
    unit: "ML",
    imageUrl:
      "https://res.cloudinary.com/dga0wmldp/image/upload/v1781689815/ProductPalmsugar_pino_200gr_jucdqm.png",
  },
  {
    name: "Butterscotch Syrup",
    unit: "ML",
    imageUrl:
      "https://res.cloudinary.com/dga0wmldp/image/upload/v1781689854/oteivv6kykzadjwaefy5eg_size_350_iek7dt.jpg",
  },
  {
    name: "Salted Caramel Syrup",
    unit: "ML",
    imageUrl:
      "https://res.cloudinary.com/dga0wmldp/image/upload/v1781689866/gyqmbnhs8wi3mqwgm7jbuo_product_MDnXfmt_kj2flj.jpg",
  },
  {
    name: "Vanilla Syrup",
    unit: "ML",
    imageUrl:
      "https://res.cloudinary.com/dga0wmldp/image/upload/v1781689882/monin-vanilla_n7haxu.jpg",
  },
  {
    name: "Chocolate Powder",
    unit: "GRAM",
    imageUrl:
      "https://res.cloudinary.com/dga0wmldp/image/upload/v1781689987/AL20260518T115037491_add45e24-ed5c-45fd-b9a1-d3325969c8b4_900x900_bmtwpy.jpg",
  },
  {
    name: "Choco Crumb",
    unit: "GRAM",
    imageUrl:
      "https://res.cloudinary.com/dga0wmldp/image/upload/v1781689968/rupys-chocolate-crumbs_AkpJ69vuj_gym6fp.jpg",
  },
  {
    name: "Matcha Powder",
    unit: "GRAM",
    imageUrl:
      "https://res.cloudinary.com/dga0wmldp/image/upload/v1781689952/vanhoutencocoapowder_313176ea-b0d3-49e5-9d0e-ad527f2cd14c_900x900_ptttte.jpg",
  },
  {
    name: "Taro Powder",
    unit: "GRAM",
    imageUrl:
      "https://res.cloudinary.com/dga0wmldp/image/upload/v1781690032/9b2d4a1b-576d-4f55-8434-4f0fad7a9344-taro-creme-powder_oaev9g.jpg",
  },
  {
    name: "Hot Cup 8oz",
    unit: "PIECE",
    imageUrl:
      "https://res.cloudinary.com/dga0wmldp/image/upload/v1781690083/1010479_pokrls.jpg",
  },
  {
    name: "Ice Cup 14oz",
    unit: "PIECE",
    imageUrl:
      "https://res.cloudinary.com/dga0wmldp/image/upload/v1781690087/idgdAsKM1723023209-700x700_epft6i.jpg",
  },
  {
    name: "Coffee Lid",
    unit: "PIECE",
    imageUrl:
      "https://res.cloudinary.com/dga0wmldp/image/upload/v1781690100/2422445_orsz5j.jpg",
  },
];

const seedPurchases = [
  {
    invoiceNumber: "BN-PO-2026-0001",
    note: `${seedPrefix} Stok awal material utama`,
    items: [
      { materialName: "House Blend Beans", amount: 10000, total: 1600000 },
      { materialName: "Fresh Milk", amount: 30000, total: 450000 },
      { materialName: "Palm Sugar Syrup", amount: 8000, total: 240000 },
      { materialName: "Butterscotch Syrup", amount: 5000, total: 225000 },
      { materialName: "Salted Caramel Syrup", amount: 5000, total: 225000 },
      { materialName: "Vanilla Syrup", amount: 5000, total: 200000 },
      { materialName: "Chocolate Powder", amount: 5000, total: 300000 },
      { materialName: "Choco Crumb", amount: 3000, total: 150000 },
      { materialName: "Matcha Powder", amount: 3000, total: 450000 },
      { materialName: "Taro Powder", amount: 3000, total: 360000 },
      { materialName: "Hot Cup 8oz", amount: 400, total: 160000 },
      { materialName: "Ice Cup 14oz", amount: 600, total: 300000 },
      { materialName: "Coffee Lid", amount: 850, total: 170000 },
    ],
  },
  {
    invoiceNumber: "BN-PO-2026-0002",
    note: `${seedPrefix} Restock beans dan susu`,
    items: [
      { materialName: "House Blend Beans", amount: 5000, total: 825000 },
      { materialName: "Fresh Milk", amount: 15000, total: 240000 },
    ],
  },
];

const seedAdjustments = [
  {
    materialName: "Ice Cup 14oz",
    amount: -12,
    note: `${seedPrefix} Stock opname awal: ice cup rusak`,
  },
  {
    materialName: "House Blend Beans",
    amount: -250,
    note: `${seedPrefix} Kalibrasi grinder beans`,
  },
  {
    materialName: "Choco Crumb",
    amount: 100,
    note: `${seedPrefix} Bonus topping choco crumb supplier`,
  },
];

const seedMenus = [
  {
    name: "Butterscotch Coffe Latte",
    price: 8000,
    imageUrl:
      "https://res.cloudinary.com/dga0wmldp/image/upload/v1781689116/butter_salted_mfvaex.png",
    recipes: [
      { materialName: "House Blend Beans", amount: 18 },
      { materialName: "Fresh Milk", amount: 150 },
      { materialName: "Butterscotch Syrup", amount: 20 },
      { materialName: "Ice Cup 14oz", amount: 1 },
      { materialName: "Coffee Lid", amount: 1 },
    ],
  },
  {
    name: "Salted Caramel Latte",
    price: 8000,
    imageUrl:
      "https://res.cloudinary.com/dga0wmldp/image/upload/v1781689116/butter_salted_mfvaex.png",
    recipes: [
      { materialName: "House Blend Beans", amount: 18 },
      { materialName: "Fresh Milk", amount: 150 },
      { materialName: "Salted Caramel Syrup", amount: 20 },
      { materialName: "Ice Cup 14oz", amount: 1 },
      { materialName: "Coffee Lid", amount: 1 },
    ],
  },
  {
    name: "Choco Caramelo",
    price: 8000,
    imageUrl:
      "https://res.cloudinary.com/dga0wmldp/image/upload/v1781689109/choco_crunchy_qsxmvg.png",
    recipes: [
      { materialName: "Chocolate Powder", amount: 25 },
      { materialName: "Fresh Milk", amount: 160 },
      { materialName: "Salted Caramel Syrup", amount: 15 },
      { materialName: "Ice Cup 14oz", amount: 1 },
      { materialName: "Coffee Lid", amount: 1 },
    ],
  },
  {
    name: "Crunchy Choco Crumb",
    price: 8000,
    imageUrl:
      "https://res.cloudinary.com/dga0wmldp/image/upload/v1781689109/choco_crunchy_qsxmvg.png",
    recipes: [
      { materialName: "Chocolate Powder", amount: 25 },
      { materialName: "Fresh Milk", amount: 160 },
      { materialName: "Choco Crumb", amount: 10 },
      { materialName: "Ice Cup 14oz", amount: 1 },
      { materialName: "Coffee Lid", amount: 1 },
    ],
  },
  {
    name: "Vanilla Latte",
    price: 8000,
    imageUrl:
      "https://res.cloudinary.com/dga0wmldp/image/upload/v1781689159/vanila_njmrqk.png",
    recipes: [
      { materialName: "House Blend Beans", amount: 18 },
      { materialName: "Fresh Milk", amount: 150 },
      { materialName: "Vanilla Syrup", amount: 20 },
      { materialName: "Ice Cup 14oz", amount: 1 },
      { materialName: "Coffee Lid", amount: 1 },
    ],
  },
  {
    name: "Matcha Signature",
    price: 8000,
    imageUrl:
      "https://res.cloudinary.com/dga0wmldp/image/upload/v1781689491/matcha_pt9jff.png",
    recipes: [
      { materialName: "Matcha Powder", amount: 14 },
      { materialName: "Fresh Milk", amount: 180 },
      { materialName: "Ice Cup 14oz", amount: 1 },
      { materialName: "Coffee Lid", amount: 1 },
    ],
  },
  {
    name: "Silky Taro",
    price: 8000,
    imageUrl:
      "https://res.cloudinary.com/dga0wmldp/image/upload/v1781689491/taro_qmssd4.png",
    recipes: [
      { materialName: "Taro Powder", amount: 18 },
      { materialName: "Fresh Milk", amount: 180 },
      { materialName: "Ice Cup 14oz", amount: 1 },
      { materialName: "Coffee Lid", amount: 1 },
    ],
  },
  {
    name: "Black Coffee Hot",
    price: 6000,
    imageUrl:
      "https://res.cloudinary.com/dga0wmldp/image/upload/v1781689119/black_hot_mpjwxn.png",
    recipes: [
      { materialName: "House Blend Beans", amount: 18 },
      { materialName: "Hot Cup 8oz", amount: 1 },
      { materialName: "Coffee Lid", amount: 1 },
    ],
  },
  {
    name: "Black Coffee Ice",
    price: 5000,
    imageUrl:
      "https://res.cloudinary.com/dga0wmldp/image/upload/v1781689491/black_ice_xp44rl.png",
    recipes: [
      { materialName: "House Blend Beans", amount: 18 },
      { materialName: "Ice Cup 14oz", amount: 1 },
      { materialName: "Coffee Lid", amount: 1 },
    ],
  },
  {
    name: "Kopi Susu Gula Aren Hot",
    price: 9000,
    imageUrl:
      "https://res.cloudinary.com/dga0wmldp/image/upload/v1781689498/aren_hot_mv560o.png",
    recipes: [
      { materialName: "House Blend Beans", amount: 18 },
      { materialName: "Fresh Milk", amount: 140 },
      { materialName: "Palm Sugar Syrup", amount: 25 },
      { materialName: "Hot Cup 8oz", amount: 1 },
      { materialName: "Coffee Lid", amount: 1 },
    ],
  },
  {
    name: "Kopi Susu Gula Aren Ice",
    price: 8000,
    imageUrl:
      "https://res.cloudinary.com/dga0wmldp/image/upload/v1781689128/aren_ice_afdqxq.png",
    recipes: [
      { materialName: "House Blend Beans", amount: 18 },
      { materialName: "Fresh Milk", amount: 150 },
      { materialName: "Palm Sugar Syrup", amount: 25 },
      { materialName: "Ice Cup 14oz", amount: 1 },
      { materialName: "Coffee Lid", amount: 1 },
    ],
  },
];

const seedCustomers = [
  { name: "Rina Prasetya", phone: "081234560001" },
  { name: "Budi Santoso", phone: "081234560002" },
  { name: "Sari Wulandari", phone: "081234560003" },
  { name: "Dimas Nugraha", phone: "081234560004" },
];

const seedOrders: Array<{
  note: string;
  customerPhone?: string;
  status: OrderSeedStatus;
  items: Array<{ menuName: string; amount: number }>;
}> = [
  {
    note: `${seedPrefix} Order completed - Rina morning`,
    customerPhone: "081234560001",
    status: "COMPLETED",
    items: [
      { menuName: "Black Coffee Hot", amount: 2 },
      { menuName: "Butterscotch Coffe Latte", amount: 1 },
    ],
  },
  {
    note: `${seedPrefix} Order completed - Sari team order`,
    customerPhone: "081234560003",
    status: "COMPLETED",
    items: [
      { menuName: "Kopi Susu Gula Aren Ice", amount: 3 },
      { menuName: "Matcha Signature", amount: 2 },
    ],
  },
  {
    note: `${seedPrefix} Order pending - walk in`,
    status: "PENDING",
    items: [
      { menuName: "Silky Taro", amount: 1 },
      { menuName: "Choco Caramelo", amount: 1 },
    ],
  },
  {
    note: `${seedPrefix} Order cancelled - demo wrong input`,
    customerPhone: "081234560002",
    status: "CANCELLED",
    items: [{ menuName: "Salted Caramel Latte", amount: 1 }],
  },
];

function addStep(
  steps: SeedStep[],
  group: string,
  item: string,
  status: SeedStepStatus,
  message: string,
) {
  steps.push({ group, item, status, message });
}

function summarizeSteps(steps: SeedStep[]) {
  return steps.reduce(
    (summary, step) => {
      summary[step.status] += 1;
      return summary;
    },
    { created: 0, skipped: 0, updated: 0, failed: 0 },
  );
}

function assertMaterialId(
  materialIds: Map<string, number>,
  materialName: string,
) {
  const materialId = materialIds.get(materialName);

  if (!materialId) {
    throw new Error(`Material "${materialName}" tidak tersedia untuk seed`);
  }

  return materialId;
}

function assertMenuId(menuIds: Map<string, number>, menuName: string) {
  const menuId = menuIds.get(menuName);

  if (!menuId) {
    throw new Error(`Menu "${menuName}" tidak tersedia untuk seed`);
  }

  return menuId;
}

async function findMaterialByName(name: string) {
  const result = await getMaterialListAction({
    q: name,
    page: 1,
    pageSize: 50,
    sortBy: "name",
    sortOrder: "asc",
  });

  return (
    result.items.find(
      (item) => item.name.toLowerCase() === name.toLowerCase(),
    ) ?? null
  );
}

async function findMenuByName(name: string) {
  const result = await getMenuListAction({
    q: name,
    page: 1,
    pageSize: 50,
    sortBy: "name",
    sortOrder: "asc",
  });

  return (
    result.items.find(
      (item) => item.name.toLowerCase() === name.toLowerCase(),
    ) ?? null
  );
}

async function findCustomerByPhone(phone: string) {
  const result = await getCustomerListAction({
    q: phone,
    page: 1,
    pageSize: 50,
    sortBy: "phone",
    sortOrder: "asc",
  });

  return result.items.find((item) => item.phone === phone) ?? null;
}

async function shouldSkipInitialSeed() {
  const userCount = await prisma.user.count({
    where: {
      deletedAt: null,
    },
  });

  return {
    userCount,
    shouldSkip: userCount > 1,
  };
}

async function seedMaterialData(steps: SeedStep[]) {
  const materialIds = new Map<string, number>();

  for (const material of seedMaterials) {
    const existingMaterial = await findMaterialByName(material.name);

    if (existingMaterial) {
      materialIds.set(material.name, existingMaterial.id);
      addStep(
        steps,
        "materials",
        material.name,
        "skipped",
        "Material sudah ada",
      );
      continue;
    }

    const result = await createMaterialAction(material);

    if (!result.success || !result.material) {
      addStep(steps, "materials", material.name, "failed", result.message);
      throw new Error(result.message);
    }

    materialIds.set(material.name, result.material.id);
    addStep(steps, "materials", material.name, "created", result.message);
  }

  return materialIds;
}

async function seedPurchaseData(
  steps: SeedStep[],
  materialIds: Map<string, number>,
) {
  for (const purchase of seedPurchases) {
    const existingPurchase = await getMaterialPurchaseListAction({
      q: purchase.invoiceNumber,
      page: 1,
      pageSize: 10,
      sortBy: "invoiceNumber",
      sortOrder: "asc",
    });

    if (
      existingPurchase.items.some(
        (item) => item.invoiceNumber === purchase.invoiceNumber,
      )
    ) {
      addStep(
        steps,
        "materialPurchases",
        purchase.invoiceNumber,
        "skipped",
        "Pembelian sudah ada",
      );
      continue;
    }

    const result = await createMaterialPurchaseAction({
      invoiceNumber: purchase.invoiceNumber,
      note: purchase.note,
      items: purchase.items.map((item) => ({
        materialId: assertMaterialId(materialIds, item.materialName),
        amount: item.amount,
        total: item.total,
      })),
    });

    if (!result.success) {
      addStep(
        steps,
        "materialPurchases",
        purchase.invoiceNumber,
        "failed",
        result.message,
      );
      throw new Error(result.message);
    }

    addStep(
      steps,
      "materialPurchases",
      purchase.invoiceNumber,
      "created",
      result.message,
    );
  }
}

async function seedAdjustmentData(
  steps: SeedStep[],
  materialIds: Map<string, number>,
) {
  for (const adjustment of seedAdjustments) {
    const existingAdjustment = await getMaterialAdjustmentListAction({
      q: adjustment.note,
      page: 1,
      pageSize: 10,
      sortBy: "createdAt",
      sortOrder: "desc",
    });

    if (
      existingAdjustment.items.some((item) => item.note === adjustment.note)
    ) {
      addStep(
        steps,
        "materialAdjustments",
        adjustment.note,
        "skipped",
        "Penyesuaian sudah ada",
      );
      continue;
    }

    const result = await createMaterialAdjustmentAction({
      materialId: assertMaterialId(materialIds, adjustment.materialName),
      amount: adjustment.amount,
      note: adjustment.note,
    });

    if (!result.success) {
      addStep(
        steps,
        "materialAdjustments",
        adjustment.note,
        "failed",
        result.message,
      );
      throw new Error(result.message);
    }

    addStep(
      steps,
      "materialAdjustments",
      adjustment.note,
      "created",
      result.message,
    );
  }
}

async function seedMenuData(
  steps: SeedStep[],
  materialIds: Map<string, number>,
) {
  const menuIds = new Map<string, number>();

  for (const menu of seedMenus) {
    const existingMenu = await findMenuByName(menu.name);

    if (existingMenu) {
      menuIds.set(menu.name, existingMenu.id);
      addStep(steps, "menus", menu.name, "skipped", "Menu sudah ada");
      continue;
    }

    const result = await createMenuWithRecipesAction({
      name: menu.name,
      price: menu.price,
      imageUrl: menu.imageUrl,
      recipes: menu.recipes.map((recipe) => ({
        materialId: assertMaterialId(materialIds, recipe.materialName),
        amount: recipe.amount,
      })),
    });

    if (!result.success || !result.menuId) {
      addStep(steps, "menus", menu.name, "failed", result.message);
      throw new Error(result.message);
    }

    menuIds.set(menu.name, result.menuId);
    addStep(steps, "menus", menu.name, "created", result.message);
  }

  return menuIds;
}

async function seedCustomerData(steps: SeedStep[]) {
  const customerIds = new Map<string, number>();

  for (const customer of seedCustomers) {
    const existingCustomer = await findCustomerByPhone(customer.phone);

    if (existingCustomer) {
      customerIds.set(customer.phone, existingCustomer.id);
      addStep(
        steps,
        "customers",
        customer.phone,
        "skipped",
        "Customer sudah ada",
      );
      continue;
    }

    const result = await createCustomerAction(customer);

    if (!result.success || !result.customerId) {
      addStep(steps, "customers", customer.phone, "failed", result.message);
      throw new Error(result.message);
    }

    customerIds.set(customer.phone, result.customerId);
    addStep(steps, "customers", customer.phone, "created", result.message);
  }

  return customerIds;
}

async function seedOrderData(
  steps: SeedStep[],
  menuIds: Map<string, number>,
  customerIds: Map<string, number>,
) {
  for (const order of seedOrders) {
    const existingOrder = await getOrderListAction({
      q: order.note,
      status: "ALL",
      page: 1,
      pageSize: 10,
      sortBy: "createdAt",
      sortOrder: "desc",
    });

    if (existingOrder.totalItems > 0) {
      addStep(steps, "orders", order.note, "skipped", "Order seed sudah ada");
      continue;
    }

    const customerId = order.customerPhone
      ? customerIds.get(order.customerPhone)
      : null;

    const result = await createOrderFromPosAction({
      customerMode: customerId ? "EXISTING" : "NONE",
      customerId,
      note: order.note,
      items: order.items.map((item) => ({
        menuId: assertMenuId(menuIds, item.menuName),
        amount: item.amount,
      })),
    });

    if (!result.success || !result.orderId) {
      addStep(steps, "orders", order.note, "failed", result.message);
      throw new Error(result.message);
    }

    addStep(steps, "orders", order.note, "created", result.message);

    if (order.status === "COMPLETED") {
      const completeResult = await completePendingOrderAction(result.orderId);

      if (!completeResult.success) {
        addStep(
          steps,
          "orders",
          `${order.note} status`,
          "failed",
          completeResult.message,
        );
        throw new Error(completeResult.message);
      }

      addStep(
        steps,
        "orders",
        `${order.note} status`,
        "updated",
        completeResult.message,
      );
    }

    if (order.status === "CANCELLED") {
      const cancelResult = await cancelPendingOrderAction(result.orderId);

      if (!cancelResult.success) {
        addStep(
          steps,
          "orders",
          `${order.note} status`,
          "failed",
          cancelResult.message,
        );
        throw new Error(cancelResult.message);
      }

      addStep(
        steps,
        "orders",
        `${order.note} status`,
        "updated",
        cancelResult.message,
      );
    }
  }
}

export async function getSeedPlanAction() {
  const guard = await shouldSkipInitialSeed();

  return {
    guard: {
      userCount: guard.userCount,
      skipWhenUserCountMoreThanOne: true,
      willRun: !guard.shouldSkip,
    },
    materials: seedMaterials,
    purchases: seedPurchases,
    adjustments: seedAdjustments,
    menus: seedMenus,
    customers: seedCustomers,
    orders: seedOrders,
  };
}

export async function runSeedAction() {
  const steps: SeedStep[] = [];

  try {
    const guard = await shouldSkipInitialSeed();

    if (guard.shouldSkip) {
      addStep(
        steps,
        "guard",
        "initial-data",
        "skipped",
        `Seed data awal dilewati karena user aktif sudah ${guard.userCount}`,
      );

      return {
        success: true,
        message: "Seed dilewati karena data awal sudah tidak diperlukan",
        summary: summarizeSteps(steps),
        steps,
      };
    }

    const materialIds = await seedMaterialData(steps);
    await seedPurchaseData(steps, materialIds);
    await seedAdjustmentData(steps, materialIds);
    const menuIds = await seedMenuData(steps, materialIds);
    const customerIds = await seedCustomerData(steps);
    await seedOrderData(steps, menuIds, customerIds);
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Seed gagal dijalankan",
      summary: summarizeSteps(steps),
      steps,
    };
  }

  return {
    success: steps.every((step) => step.status !== "failed"),
    message: "Seed selesai dijalankan",
    summary: summarizeSteps(steps),
    steps,
  };
}
