import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding database...");

  const username = "admin";

  const existingAdmin = await prisma.user.findUnique({
    where: { username },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("admin123", 10);

    const admin = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: "ADMIN",
        fullName: "Admin",
        designation: "Admin",
        department: "Admin",
        email: "[EMAIL_ADDRESS]",
        mobileNumber: "1234567890",
      },
    });

    console.log(`Created admin user: ${admin.id}`);
  } else {
    console.log(`Admin already exists: ${existingAdmin.id}`);
  }
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
