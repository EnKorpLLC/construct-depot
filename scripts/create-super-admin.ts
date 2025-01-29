import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    // Check if super admin already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: {
        role: 'SUPER_ADMIN'
      }
    });

    if (existingSuperAdmin) {
      // Delete existing super admin
      await prisma.user.delete({
        where: {
          id: existingSuperAdmin.id
        }
      });
      console.log('Existing super admin deleted');
    }

    // Create super admin
    const hashedPassword = await bcrypt.hash('Qwas!@90', 10);
    
    const superAdmin = await prisma.user.create({
      data: {
        email: 'team@constructdepot.com',
        name: 'Super Admin',
        password: hashedPassword,
        role: 'SUPER_ADMIN'
      }
    });

    console.log('Super admin created successfully:', superAdmin);
  } catch (error) {
    console.error('Error creating super admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin(); 