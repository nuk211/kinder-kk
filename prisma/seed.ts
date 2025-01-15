const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs'); // Changed to bcryptjs as it's commonly used in Node.js

const prisma = new PrismaClient();

async function main() {
  const pages = ['profit', 'payments', 'accounting'];
  const defaultPassword = '472998';
  
  for (const page of pages) {
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    await prisma.adminProtection.upsert({
      where: { page },
      update: {},
      create: {
        page,
        password: hashedPassword,
        isLocked: true
      },
    });
  }
  
  console.log('Protected pages created successfully');
  console.log('Protected pages password:', defaultPassword);
}

main()
  .catch((e) => {
    console.error('Error in seed script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });