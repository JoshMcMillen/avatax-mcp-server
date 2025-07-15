// Quick test to verify adjust_transaction schema validation
const fs = require('fs');
const path = require('path');

// Read and evaluate the TypeScript definitions file (simplified approach)
const definitionsPath = path.join(__dirname, 'src', 'tools', 'definitions.ts');
const content = fs.readFileSync(definitionsPath, 'utf8');

// Extract the TOOL_DEFINITIONS array (simple regex approach for testing)
const match = content.match(/export const TOOL_DEFINITIONS = (\[[\s\S]*?\]);/);
if (!match) {
    console.error('❌ Could not find TOOL_DEFINITIONS in file');
    process.exit(1);
}

// Evaluate the JavaScript portion (removing TypeScript types)
const toolsArray = match[1]
    .replace(/\/\/.*$/gm, '') // Remove comments
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

// Find adjust_transaction tool by searching in the string - more specific pattern
const adjustToolMatch = content.match(/{\s*name:\s*'adjust_transaction'[\s\S]*?},\s*{/);

if (!adjustToolMatch) {
    console.error('❌ adjust_transaction tool not found');
    process.exit(1);
}

console.log('✅ adjust_transaction tool found');

// Check if newTransaction is present (should not be)
const adjustToolString = adjustToolMatch[0];
if (adjustToolString.includes('newTransaction')) {
    console.error('❌ newTransaction field still present - should be flattened');
    process.exit(1);
}

console.log('✅ newTransaction field properly removed - structure is flattened');

// Check for the main required fields at the end of the tool definition
const mainRequiredMatch = adjustToolString.match(/}\s*},\s*required:\s*\[[^\]]+\]/);
if (mainRequiredMatch) {
    const requiredString = mainRequiredMatch[0];
    if (requiredString.includes("'transactionCode'") && 
        requiredString.includes("'date'") && 
        requiredString.includes("'customerCode'") && 
        requiredString.includes("'lines'")) {
        console.log('✅ Required fields correctly updated to include: transactionCode, date, customerCode, lines');
    } else {
        console.error('❌ Required fields not as expected. Found:', mainRequiredMatch[0]);
        process.exit(1);
    }
} else {
    console.error('❌ Main required fields not found');
    process.exit(1);
}

console.log('🎉 adjust_transaction schema validation passed!');
