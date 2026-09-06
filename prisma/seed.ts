/**
 * Development-only seed data. Never run against a production database.
 * Every record created here is clearly synthetic and exists only to make
 * local development and manual testing easier.
 */
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth/password'

const prisma = new PrismaClient()

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run seed script against production.')
  }

  const passwordHash = await hashPassword('DevPassword123')

  const user = await prisma.user.upsert({
    where: { email: 'dev@sellerhub.local' },
    update: {},
    create: {
      email: 'dev@sellerhub.local',
      name: 'Dev User',
      passwordHash,
      emailVerified: new Date(),
    },
  })

  const organization = await prisma.organization.upsert({
    where: { slug: 'dev-store' },
    update: {},
    create: {
      name: 'Dev Store (seed data)',
      slug: 'dev-store',
      country: 'UZ',
      currency: 'USD',
      businessType: 'INDIVIDUAL',
      onboardedAt: new Date(),
      memberships: {
        create: { userId: user.id, role: 'OWNER' },
      },
    },
  })

  // ── Products ──────────────────────────────────────────────────────────
  const productDefs = [
    {
      sku: 'DEMO-ES-001',
      name: 'Электрический штабелёр [demo]',
      brand: 'LiftPro',
      purchasePrice: 1200,
      sellingPrice: 1650,
      minimumStock: 3,
      physicalStock: 8,
      dailySales: 0.3,
    },
    {
      sku: 'DEMO-PJ-002',
      name: 'Гидравлическая рохля [demo]',
      brand: 'LiftPro',
      purchasePrice: 180,
      sellingPrice: 260,
      minimumStock: 5,
      physicalStock: 2, // low stock
      dailySales: 0.5,
    },
    {
      sku: 'DEMO-CB-003',
      name: 'Картонные коробки, 50 шт [demo]',
      brand: 'PackIt',
      purchasePrice: 15,
      sellingPrice: 25,
      minimumStock: 20,
      physicalStock: 0, // out of stock
      dailySales: 1.2,
    },
    {
      sku: 'DEMO-TP-004',
      name: 'Скотч упаковочный, 10 шт [demo]',
      brand: 'PackIt',
      purchasePrice: 8,
      sellingPrice: 14,
      minimumStock: 15,
      physicalStock: 40,
      dailySales: 0.8,
    },
    {
      sku: 'DEMO-WS-005',
      name: 'Весы складские 300кг [demo]',
      brand: 'MeasureTech',
      purchasePrice: 320,
      sellingPrice: 450,
      minimumStock: 2,
      physicalStock: 5,
      dailySales: 0.1,
    },
    {
      sku: 'DEMO-GL-006',
      name: 'Перчатки рабочие, пара [demo]',
      brand: 'SafeHands',
      purchasePrice: 2,
      sellingPrice: 5,
      minimumStock: 50,
      physicalStock: 120,
      dailySales: 3,
    },
    {
      sku: 'DEMO-SH-007',
      name: 'Стеллаж металлический [demo]',
      brand: 'StoreMax',
      purchasePrice: 90,
      sellingPrice: 140,
      minimumStock: 4,
      physicalStock: 3, // low stock
      dailySales: 0.4,
    },
    {
      sku: 'DEMO-LB-008',
      name: 'Термопринтер этикеток [demo]',
      brand: 'PrintFast',
      purchasePrice: 210,
      sellingPrice: 310,
      minimumStock: 3,
      physicalStock: 6,
      dailySales: 0.15,
    },
  ]

  const products = []
  for (const def of productDefs) {
    const product = await prisma.product.upsert({
      where: { organizationId_sku: { organizationId: organization.id, sku: def.sku } },
      update: {},
      create: {
        organizationId: organization.id,
        sku: def.sku,
        name: def.name,
        brand: def.brand,
        purchasePrice: def.purchasePrice,
        sellingPrice: def.sellingPrice,
        currency: 'USD',
        unit: 'шт',
        status: 'ACTIVE',
        minimumStock: def.minimumStock,
      },
    })

    await prisma.inventory.upsert({
      where: { productId: product.id },
      update: { physicalStock: def.physicalStock },
      create: { productId: product.id, physicalStock: def.physicalStock },
    })

    products.push({ ...def, id: product.id })
  }

  // ── Customers ─────────────────────────────────────────────────────────
  const customerDefs = [
    { name: 'Алишер Каримов [demo]', phone: '+998901112233' },
    { name: 'Дилноза Юсупова [demo]', phone: '+998907654321' },
    { name: 'ООО "СтройТорг" [demo]', phone: '+998712345678' },
  ]

  const customers = []
  for (const def of customerDefs) {
    let customer = await prisma.customer.findFirst({
      where: { organizationId: organization.id, name: def.name },
    })
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          organizationId: organization.id,
          name: def.name,
          phone: def.phone,
          source: 'MANUAL',
        },
      })
    }
    customers.push(customer)
  }

  // ── Inventory transactions (sales history for velocity forecast) ──────
  const existingTx = await prisma.inventoryTransaction.count({
    where: { organizationId: organization.id },
  })

  if (existingTx === 0) {
    for (const product of products) {
      const salesInWindow = Math.round(product.dailySales * 30)
      for (let i = 0; i < salesInWindow; i++) {
        await prisma.inventoryTransaction.create({
          data: {
            organizationId: organization.id,
            productId: product.id,
            type: 'SALE',
            quantity: -1,
            reference: 'demo-seed',
            createdAt: daysAgo(Math.floor(Math.random() * 30)),
          },
        })
      }
    }
  }

  // ── Orders (last 30 days, mostly completed, a few in-progress) ───────
  const existingOrders = await prisma.order.count({
    where: { organizationId: organization.id },
  })

  if (existingOrders === 0) {
    let orderCounter = 1
    const orderPlans = [
      { productIdx: 0, qty: 1, daysAgo: 2, status: 'COMPLETED' as const },
      { productIdx: 1, qty: 3, daysAgo: 5, status: 'COMPLETED' as const },
      { productIdx: 3, qty: 5, daysAgo: 6, status: 'COMPLETED' as const },
      { productIdx: 5, qty: 10, daysAgo: 8, status: 'COMPLETED' as const },
      { productIdx: 4, qty: 1, daysAgo: 10, status: 'SHIPPED' as const },
      { productIdx: 6, qty: 2, daysAgo: 12, status: 'COMPLETED' as const },
      { productIdx: 2, qty: 8, daysAgo: 14, status: 'COMPLETED' as const },
      { productIdx: 7, qty: 1, daysAgo: 15, status: 'COMPLETED' as const },
      { productIdx: 1, qty: 2, daysAgo: 20, status: 'COMPLETED' as const },
      { productIdx: 0, qty: 1, daysAgo: 25, status: 'CANCELLED' as const },
      { productIdx: 5, qty: 6, daysAgo: 1, status: 'NEW' as const },
      { productIdx: 3, qty: 4, daysAgo: 0, status: 'PROCESSING' as const },
    ]

    for (const plan of orderPlans) {
      const product = products[plan.productIdx]
      const customer = customers[orderCounter % customers.length]
      const unitPrice = product.sellingPrice
      const unitCost = product.purchasePrice
      const subtotal = unitPrice * plan.qty
      const cost = unitCost * plan.qty
      const total = subtotal
      const profit = total - cost
      const createdAt = daysAgo(plan.daysAgo)

      const order = await prisma.order.create({
        data: {
          organizationId: organization.id,
          orderNumber: `SH-DEMO-${String(orderCounter).padStart(4, '0')}`,
          customerId: customer.id,
          status: plan.status,
          source: 'MANUAL',
          subtotal,
          discount: 0,
          total,
          cost,
          profit,
          createdAt,
          updatedAt: createdAt,
          items: {
            create: {
              productId: product.id,
              quantity: plan.qty,
              unitPrice,
              unitCost,
              discount: 0,
              total: subtotal,
            },
          },
        },
      })

      orderCounter += 1
      void order
    }
  }

  console.log('Seeded development account:')
  console.log('  email: dev@sellerhub.local')
  console.log('  password: DevPassword123')
  console.log('  organization slug:', organization.slug)
  console.log(`  products: ${products.length}, customers: ${customers.length}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
