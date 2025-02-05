import { PrismaClient, Role, OrderStatus, PoolStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create users
  const users = [
    {
      email: 'admin@constructdepot.com',
      name: 'Super Admin',
      role: Role.super_admin,
      password: 'Admin@123',
    },
    {
      email: 'supplier@example.com',
      name: 'Example Supplier',
      role: Role.supplier,
      password: 'Supplier@123',
    },
    {
      email: 'contractor@example.com',
      name: 'Example Contractor',
      role: Role.general_contractor,
      password: 'Contractor@123',
    },
    {
      email: 'subcontractor@example.com',
      name: 'Example Subcontractor',
      role: Role.subcontractor,
      password: 'Subcontractor@123',
    },
  ];

  for (const user of users) {
    const hashedPassword = await hash(user.password, 12);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        password: hashedPassword,
      },
    });
  }

  // Create categories with more diverse options
  const categories = [
    { 
      name: 'Building Materials', 
      description: 'Foundation, framing, and structural materials',
      subcategories: ['Lumber', 'Concrete', 'Steel', 'Masonry', 'Insulation']
    },
    { 
      name: 'Tools & Equipment', 
      description: 'Power tools, hand tools, and construction equipment',
      subcategories: ['Power Tools', 'Hand Tools', 'Safety Equipment', 'Measuring Tools']
    },
    { 
      name: 'Electrical', 
      description: 'Wiring, fixtures, and electrical components',
      subcategories: ['Wiring', 'Lighting', 'Panels', 'Switches', 'Outlets']
    },
    { 
      name: 'Plumbing', 
      description: 'Pipes, fittings, and plumbing supplies',
      subcategories: ['Pipes', 'Fittings', 'Fixtures', 'Water Heaters']
    },
    { 
      name: 'HVAC', 
      description: 'Heating, ventilation, and air conditioning',
      subcategories: ['Heating', 'Cooling', 'Ventilation', 'Filters']
    },
    { 
      name: 'Flooring', 
      description: 'Various flooring materials and accessories',
      subcategories: ['Hardwood', 'Tile', 'Carpet', 'Vinyl', 'Underlayment']
    },
    { 
      name: 'Paint & Finishes', 
      description: 'Paints, stains, and finishing materials',
      subcategories: ['Interior Paint', 'Exterior Paint', 'Stains', 'Primers']
    },
    { 
      name: 'Outdoor & Landscaping', 
      description: 'Materials for outdoor construction and landscaping',
      subcategories: ['Decking', 'Fencing', 'Pavers', 'Irrigation']
    }
  ];

  for (const category of categories) {
    const existingCategory = await prisma.category.findFirst({
      where: { name: category.name },
    });

    if (!existingCategory) {
      await prisma.category.create({
        data: {
          name: category.name,
          description: category.description,
        },
      });
    }
  }

  // Create example products with more variety
  const supplier = await prisma.user.findFirst({
    where: { role: Role.supplier },
  });

  if (supplier) {
    const categoryMap = new Map();
    for (const category of categories) {
      const dbCategory = await prisma.category.findFirst({
        where: { name: category.name },
      });
      if (dbCategory) {
        categoryMap.set(category.name, dbCategory);
      }
    }

    const products = [
      // Building Materials
      {
        name: 'Premium Lumber Pack',
        description: '2x4x8 Premium Grade Lumber - 100 pieces',
        price: 599.99,
        minOrderQuantity: 50,
        inventory: 500,
        specifications: {
          material: 'Pine',
          grade: 'Premium',
          length: '8 feet',
          treatment: 'Pressure treated',
        },
        categoryId: categoryMap.get('Building Materials')?.id,
      },
      {
        name: 'High-Strength Concrete Mix',
        description: 'Professional Grade Concrete Mix - 80lb bags',
        price: 12.99,
        minOrderQuantity: 20,
        inventory: 1000,
        specifications: {
          type: 'High-Strength',
          psi: '5000',
          weight: '80 lbs',
          coverage: '0.6 cubic feet',
        },
        categoryId: categoryMap.get('Building Materials')?.id,
      },
      // Tools & Equipment
      {
        name: 'Professional Power Drill Set',
        description: '20V Cordless Drill with Accessories',
        price: 299.99,
        minOrderQuantity: 1,
        inventory: 50,
        specifications: {
          voltage: '20V',
          batteryType: 'Lithium-Ion',
          warranty: '3 years',
          includes: 'Drill, 2 batteries, charger, case',
        },
        categoryId: categoryMap.get('Tools & Equipment')?.id,
      },
      // Electrical
      {
        name: 'Commercial LED Light Pack',
        description: 'Energy-efficient LED Panel Lights - 10 Pack',
        price: 449.99,
        minOrderQuantity: 5,
        inventory: 200,
        specifications: {
          wattage: '45W',
          lumens: '4000',
          color: '4000K',
          lifespan: '50000 hours',
        },
        categoryId: categoryMap.get('Electrical')?.id,
      },
      // Plumbing
      {
        name: 'PEX Plumbing Kit',
        description: 'Complete PEX plumbing system with fittings',
        price: 189.99,
        minOrderQuantity: 1,
        inventory: 75,
        specifications: {
          type: 'PEX-A',
          size: '1/2 inch',
          length: '100 feet',
          includes: 'Pipes, fittings, tools',
        },
        categoryId: categoryMap.get('Plumbing')?.id,
      }
    ];

    for (const product of products) {
      const existingProduct = await prisma.product.findFirst({
        where: { name: product.name },
      });

      if (!existingProduct) {
        await prisma.product.create({
          data: {
            ...product,
            supplierId: supplier.id,
          },
        });
      }
    }

    // Create sample orders and pools
    const contractor = await prisma.user.findFirst({
      where: { role: Role.general_contractor },
    });

    const subcontractor = await prisma.user.findFirst({
      where: { role: Role.subcontractor },
    });

    if (contractor && subcontractor) {
      const products = await prisma.product.findMany();
      const orderDates = [
        new Date('2024-01-15'),
        new Date('2024-02-01'),
        new Date('2024-02-15'),
        new Date('2024-03-01'),
        new Date('2024-03-15'),
      ];

      for (const product of products) {
        // Create a pool for each product
        const pool = await prisma.pool.create({
          data: {
            productId: product.id,
            targetQuantity: product.minOrderQuantity * 5,
            currentQuantity: product.minOrderQuantity * 2,
            status: PoolStatus.OPEN,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          },
        });

        // Create orders for contractor
        for (const date of orderDates.slice(0, 3)) {
          await prisma.order.create({
            data: {
              userId: contractor.id,
              productId: product.id,
              quantity: product.minOrderQuantity,
              status: OrderStatus.COMPLETED,
              poolId: pool.id,
              totalAmount: product.minOrderQuantity * product.price,
              createdAt: date,
            },
          });
        }

        // Create orders for subcontractor
        for (const date of orderDates.slice(3)) {
          await prisma.order.create({
            data: {
              userId: subcontractor.id,
              productId: product.id,
              quantity: product.minOrderQuantity,
              status: OrderStatus.PENDING,
              poolId: pool.id,
              totalAmount: product.minOrderQuantity * product.price,
              createdAt: date,
            },
          });
        }
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 