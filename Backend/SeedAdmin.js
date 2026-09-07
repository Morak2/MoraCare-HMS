const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    throw new Error('Set ADMIN_USERNAME and ADMIN_PASSWORD in your .env before running this script.');
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Use superAdmin (camelCase) to match Prisma's generation rules
  const admin = await prisma.superAdmin.upsert({
    where: { username: adminUsername },
    update: { passwordHash: hashedPassword }, // re-running updates the password too
    create: {
      username: adminUsername,
      passwordHash: hashedPassword,
    },
  });

  console.log("✅ Super Admin created/verified:", admin.username);
}

main()
  .catch((e) => {
    console.error("❌ Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });