#!/usr/bin/env node

/**
 * Password Hash Utility (Node.js ES Module version)
 * 
 * This utility generates PBKDF2 password hashes compatible with Edge Functions.
 * 
 * Usage:
 *   node password-hash-utility.js "YourPasswordHere"
 * 
 * Or run interactively:
 *   node password-hash-utility.js
 */

import readline from 'readline';
import crypto from 'crypto';

const ITERATIONS = 100000; // OWASP recommended minimum for PBKDF2
const HASH_LENGTH = 32; // 256 bits
const SALT_LENGTH = 16; // 128 bits

async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    // Generate random salt
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    // Hash password using PBKDF2
    crypto.pbkdf2(password, salt, ITERATIONS, HASH_LENGTH, 'sha256', (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Format: iterations$salt$hash (all base64 encoded)
      const saltBase64 = salt.toString('base64');
      const hashBase64 = derivedKey.toString('base64');
      const hash = `${ITERATIONS}$${saltBase64}$${hashBase64}`;
      
      resolve(hash);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  let password;

  if (args.length > 0) {
    password = args[0];
  } else {
    console.log('Password Hash Utility');
    console.log('=====================\n');
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    password = await new Promise((resolve) => {
      rl.question('Enter password to hash: ', (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }

  if (!password) {
    console.error('Error: Password cannot be empty');
    process.exit(1);
  }

  console.log('\nGenerating PBKDF2 hash (100,000 iterations)...\n');

  const hash = await hashPassword(password);

  console.log('✅ Password hashed successfully!\n');
  console.log('Your password hash:');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(hash);
  console.log('─────────────────────────────────────────────────────────────\n');

  console.log('To update your database, run this SQL in Supabase SQL Editor:\n');
  console.log(`UPDATE admin_password`);
  console.log(`SET password_hash = '${hash}'`);
  console.log(`WHERE id = 'your-admin-id-here';  -- Replace with your admin ID\n`);

  console.log('Or to find your admin ID and update in one go:\n');
  console.log(`UPDATE admin_password`);
  console.log(`SET password_hash = '${hash}'`);
  console.log(`WHERE password = 'your-current-plain-text-password';  -- Replace with current password\n`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
