const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'dev.db');
const adapter = new PrismaLibSql({
  url: `file:${dbPath}`,
});
const prisma = new PrismaClient({ adapter });

prisma.merchant.findMany().then(console.log).catch(console.error).finally(() => prisma.$disconnect());
