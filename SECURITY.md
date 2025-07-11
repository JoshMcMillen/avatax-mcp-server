# Security Guidelines

## Environment Variables

This application requires sensitive configuration data. **Never commit sensitive data to version control.**

### Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# AvaTax Configuration
AVATAX_ACCOUNT_ID=your_account_id_here
AVATAX_LICENSE_KEY=your_license_key_here
AVATAX_ENVIRONMENT=sandbox
AVATAX_COMPANY_CODE=DEFAULT
AVATAX_APP_NAME=AvaTax-MCP-Server
AVATAX_TIMEOUT=30000
```

### Code Signing (Optional)

For code signing during build:
- Store certificate files outside the repository
- Use environment variables for certificate passwords:
  ```bash
  CSC_LINK=path/to/certificate.p12
  CSC_KEY_PASSWORD=your_certificate_password
  ```

## Security Features

### Input Validation
- All API inputs are validated before sending to AvaTax
- String inputs are sanitized to prevent injection attacks
- Date formats are validated using regex patterns
- Required fields are checked before API calls

### Error Handling
- Sensitive information is not leaked in error messages
- API errors are properly handled and formatted
- Rate limiting errors include retry guidance

### Best Practices
1. Always use environment variables for sensitive data
2. Regularly rotate API credentials
3. Use sandbox environment for testing
4. Monitor API usage for unusual patterns
5. Keep dependencies updated

## Reporting Security Issues

If you discover a security vulnerability, please report it privately to the maintainers.
