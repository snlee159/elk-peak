#!/usr/bin/env -S deno run --allow-net --allow-env

/**
 * Password Hash Utility
 * 
 * This utility helps you generate bcrypt hashes for your admin passwords.
 * 
 * Usage:
 *   deno run --allow-net --allow-env password-hash-utility.ts "YourPasswordHere"
 * 
 * Or run interactively:
 *   deno run --allow-net --allow-env password-hash-utility.ts
 */

import * as bcrypt from "https://deno.land/x/bcrypt@v0.2.4/mod.ts";

async function hashPassword(password: string): Promise<string> {
  // Using cost factor 10 (default, good balance of security and performance)
  const hash = await bcrypt.hash(password);
  return hash;
}

// Get password from command line or prompt
const args = Deno.args;
let password: string;

if (args.length > 0) {
  password = args[0];
} else {
  console.log("Password Hash Utility");
  console.log("=====================\n");
  
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  // Prompt for password
  await Deno.stdout.write(encoder.encode("Enter password to hash: "));
  const buf = new Uint8Array(1024);
  const n = await Deno.stdin.read(buf);
  
  if (n === null) {
    console.error("No input received");
    Deno.exit(1);
  }
  
  password = decoder.decode(buf.subarray(0, n)).trim();
}

if (!password) {
  console.error("Error: Password cannot be empty");
  Deno.exit(1);
}

console.log("\nGenerating bcrypt hash...\n");

const hash = await hashPassword(password);

console.log("✅ Password hashed successfully!\n");
console.log("Your bcrypt hash:");
console.log("─────────────────────────────────────────────────────────────");
console.log(hash);
console.log("─────────────────────────────────────────────────────────────\n");

console.log("To update your database, run this SQL in Supabase SQL Editor:\n");
console.log(`UPDATE admin_password`);
console.log(`SET password_hash = '${hash}'`);
console.log(`WHERE id = 'your-admin-id-here';  -- Replace with your admin ID\n`);

console.log("Or to find your admin ID and update in one go:\n");
console.log(`UPDATE admin_password`);
console.log(`SET password_hash = '${hash}'`);
console.log(`WHERE password = 'your-current-plain-text-password';  -- Replace with current password\n`);
