const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const investors = await prisma.investor.findMany();
  console.log("Investors:", investors.map(i => ({ name: i.name, email: i.email, status: i.status })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
