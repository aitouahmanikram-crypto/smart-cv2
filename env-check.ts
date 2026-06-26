import dotenv from "dotenv";
dotenv.config();

console.log("Keys available in process.env:");
Object.keys(process.env).forEach(key => {
  console.log(`- ${key}`);
});
