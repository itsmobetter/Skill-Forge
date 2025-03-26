import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  const password = "password123"; // New password
  const hashedPassword = await hashPassword(password);
  console.log("New hashed password:", hashedPassword);
}

main().catch(console.error);