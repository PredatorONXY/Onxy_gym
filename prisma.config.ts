import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, ".env") });

export default {
  schema: "./prisma/schema.prisma",
};
