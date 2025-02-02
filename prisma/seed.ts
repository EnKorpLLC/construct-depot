import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create super admin user
  const hashedPassword = await hash('Admin@123', 12);
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@constructdepot.com' },
    update: {},
    create: {
      email: 'admin@constructdepot.com',
      name: 'Super Admin',
      password: hashedPassword,
      role: Role.super_admin,
    },
  });

  console.log({ superAdmin });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 