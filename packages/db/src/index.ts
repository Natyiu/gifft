import { env } from "@Batman/env/server";
import { PrismaPg } from "@prisma/adapter-pg";

import { Prisma, PrismaClient } from "../prisma/generated/client";

const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL || "", });
const prisma = new PrismaClient({ adapter });

export default prisma;
export { Prisma };
