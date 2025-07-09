export interface TaxCalculationRequest {
    transactionCode: string;
    customerCode: string;
    amount: number;
    lineItems: LineItem[];
}

export interface LineItem {
    lineNumber: string;
    quantity: number;
    productCode: string;
    amount: number;
    taxCode?: string;
}

export interface TaxCalculationResponse {
    totalTax: number;
    lineItems: LineItemTaxResult[];
}

export interface LineItemTaxResult {
    lineNumber: string;
    tax: number;
}

export interface AddressValidationRequest {
    address: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
}

export interface AddressValidationResponse {
    isValid: boolean;
    errors?: string[];
}

export interface TransactionCreationRequest {
    customerCode: string;
    transactionDate: string;
    lineItems: LineItem[];
}

export interface TransactionCreationResponse {
    transactionId: string;
    status: string;
}