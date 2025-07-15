// Tool guidance and workflow instructions for AvaTax MCP Server
export const TOOLS_GUIDE = {
  taxCalculation: {
    primary: ['calculate_tax', 'create_transaction'],
    validation: ['validate_address'],
    support: ['list_tax_codes', 'get_tax_code_by_id']
  },
  companyManagement: {
    primary: ['get_companies', 'get_company'],
    configuration: ['get_company_configuration', 'list_locations_by_company'],
    nexus: ['list_nexus', 'get_nexus_by_address']
  },
  transactions: {
    primary: ['list_transactions', 'get_transaction'],
    management: ['commit_transaction', 'void_transaction', 'adjust_transaction']
  },
  systemAndDiagnostics: {
    primary: ['ping_service', 'get_account', 'get_settings'],
    certificates: ['list_certificates', 'list_customers']
  }
};

export const WORKFLOW_INSTRUCTIONS = {
  calculate_tax: {
    prerequisite: 'validate_address',
    order: 1,
    instruction: 'Always validate addresses first, then calculate tax'
  },
  
  list_nexus: {
    prerequisite: 'get_companies',
    order: 2,
    instruction: 'Get company list first to find valid company codes'
  },
  
  create_transaction: {
    prerequisite: 'calculate_tax',
    order: 3,
    instruction: 'Calculate tax first to verify amounts before committing'
  }
};

export const TOOL_HELP_MESSAGES = {
  calculate_tax: `To calculate tax:
1. First use 'validate_address' for both shipFrom and shipTo addresses
2. Then use 'calculate_tax' with the validated addresses
3. Optionally use 'list_tax_codes' to find specific product tax codes

EXAMPLE: "Calculate tax on a $100 purchase from CA to NY"`,
  
  find_company: `To work with companies:
1. Start with 'get_companies' to see all available companies
2. Use 'get_company' with a specific code for details
3. Use 'get_company_configuration' for settings
4. Use 'list_locations_by_company' for locations`,
  
  check_nexus: `To check nexus jurisdictions:
1. First use 'get_companies' to get valid company codes
2. Then use 'list_nexus' with the company code
3. Or use 'get_nexus_by_address' to check specific addresses`,
  
  test_connection: `To test connectivity:
1. Use 'ping_service' first to check basic connection
2. If that fails, verify your credentials in configuration
3. Check 'get_account' to see available features`,
  
  validate_address: `To validate addresses:
1. Use 'validate_address' before any tax calculations
2. Always provide complete address information
3. Use validated addresses in subsequent tax calculations`,
  
  manage_certificates: `Certificate management requires additional permissions:
1. Use the AvaTax web portal at https://app.avalara.com
2. Enable CertCapture module if available
3. Check customer records using 'list_customers' for associations`
};

export const COMMON_ERROR_SOLUTIONS = {
  'Company code is required': {
    solution: "Use 'get_companies' first to find valid company codes",
    tools: ['get_companies']
  },
  
  'not found': {
    solution: "Verify the resource exists and you have permission to access it",
    tools: ['ping_service', 'get_companies']
  },
  
  'authentication': {
    solution: "Check your AvaTax credentials and try 'ping_service' to test connection",
    tools: ['ping_service']
  },
  
  'address': {
    solution: "Use 'validate_address' to ensure address format is correct",
    tools: ['validate_address']
  },
  
  'serialization': {
    solution: "This API endpoint may have limitations. Try alternative approaches or check permissions",
    tools: ['ping_service', 'get_account']
  }
};

export function getToolHelp(task: string): string {
  const taskGuide = TOOL_HELP_MESSAGES[task as keyof typeof TOOL_HELP_MESSAGES];
  if (taskGuide) {
    return taskGuide;
  }
  
  // Try to match partial task names
  for (const [key, guide] of Object.entries(TOOL_HELP_MESSAGES)) {
    if (key.includes(task) || task.includes(key)) {
      return guide;
    }
  }
  
  return "Please provide more details about what you're trying to accomplish.";
}

export function getErrorSolution(errorMessage: string): string {
  for (const [errorKey, solution] of Object.entries(COMMON_ERROR_SOLUTIONS)) {
    if (errorMessage.toLowerCase().includes(errorKey.toLowerCase())) {
      return `${solution.solution}\n\nRecommended tools: ${solution.tools.join(', ')}`;
    }
  }
  
  return `Troubleshooting steps:
1. Use 'ping_service' to check connection
2. Use 'get_companies' to verify company codes
3. Use 'validate_address' before tax calculations
4. Check 'get_account' for available features`;
}
