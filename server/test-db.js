const { PrismaClient } = require('@prisma/client')
const { PrismaLibSql } = require('@prisma/adapter-libsql')
const path = require('path')

// Prisma 7: 必须通过 adapter 传入数据库连接
const libsql = new PrismaLibSql({
  url: 'file:' + path.resolve(__dirname, './prisma/dev.db'),
})
const prisma = new PrismaClient({ adapter: libsql })

async function main() {
  try {
    const merchants = await prisma.merchant.findMany()
    console.log('Merchants:', merchants)
  } catch (e) {
    console.error(e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
