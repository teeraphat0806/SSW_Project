/**
 * Fix PostgreSQL sequences for User and Staff tables
 * Run this when you get "Unique constraint failed on the fields: (id)" error
 *
 * Usage: npx tsx scripts/fix-sequences.ts
 */

import prisma from "../src/lib/prisma";

async function fixSequences() {
  try {
    console.log("🔧 Fixing PostgreSQL sequences...\n");

    // Fix User table sequence
    console.log("Fixing User table sequence...");
    const userResult = await prisma.$queryRaw<Array<{ setval: bigint }>>`
      SELECT setval(pg_get_serial_sequence('"User"', 'id'), COALESCE((SELECT MAX(id) FROM "User"), 1), true)
    `;
    console.log(
      "✅ User sequence updated to:",
      userResult[0]?.setval?.toString(),
    );

    // Fix Staff table sequence
    console.log("Fixing Staff table sequence...");
    const staffResult = await prisma.$queryRaw<Array<{ setval: bigint }>>`
      SELECT setval(pg_get_serial_sequence('"Staff"', 'id'), COALESCE((SELECT MAX(id) FROM "Staff"), 1), true)
    `;
    console.log(
      "✅ Staff sequence updated to:",
      staffResult[0]?.setval?.toString(),
    );

    // Verify sequences
    console.log("\n📊 Verifying sequences...");

    const userMax = await prisma.user.findFirst({
      orderBy: { id: "desc" },
      select: { id: true },
    });
    console.log("User table max ID:", userMax?.id || 0);

    const staffMax = await prisma.staff.findFirst({
      orderBy: { id: "desc" },
      select: { id: true },
    });
    console.log("Staff table max ID:", staffMax?.id || 0);

    console.log("\n✅ Sequences fixed successfully!");
    console.log("You can now create new users without ID conflicts.");
  } catch (error) {
    console.error("❌ Error fixing sequences:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixSequences().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
