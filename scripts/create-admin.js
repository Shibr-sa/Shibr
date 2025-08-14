#!/usr/bin/env node

/**
 * Script to create an admin user for the Shibr platform
 * Usage: node scripts/create-admin.js
 */

const readline = require('readline');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createAdmin() {
  console.log('\n=== Shibr Admin User Creation ===\n');
  
  try {
    // Collect admin details
    const email = await question('Enter admin email: ');
    const password = await question('Enter admin password: ');
    const fullName = await question('Enter admin full name: ');
    const phoneNumber = await question('Enter admin phone number: ');
    
    // Validate inputs
    if (!email || !password || !fullName || !phoneNumber) {
      throw new Error('All fields are required');
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    
    // Password strength check
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    
    // Prepare the Convex command
    const args = JSON.stringify({
      email,
      password,
      fullName,
      phoneNumber
    });
    
    console.log('\nCreating admin user...');
    
    // Execute the Convex mutation
    const command = `bunx convex run admin:createAdminUser '${args}'`;
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr) {
      throw new Error(stderr);
    }
    
    const result = JSON.parse(stdout);
    
    console.log('\n✅ Admin user created successfully!');
    console.log(`Email: ${result.email}`);
    console.log(`ID: ${result.id}`);
    console.log('\nThe admin can now log in at /signin');
    console.log('\n⚠️  Remember to:');
    console.log('1. Use a strong password in production');
    console.log('2. Enable two-factor authentication when available');
    console.log('3. Regularly rotate admin credentials');
    
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('\nAn admin with this email already exists.');
      console.log('Please use a different email address.');
    }
    
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the script
createAdmin();