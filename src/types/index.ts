export interface TaxCalculationRequest {
    transactionId: string;
    amount: number;
    currency: string;
    lineItems: LineItem[];
}

export interface LineItem {
    id: string;
    quantity: number;
    unitPrice: number;
    taxCode: string;
}

export interface AddressValidationRequest {
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

export interface AddressValidationResult {
    isValid: boolean;
    errors?: string[];
}

export interface TransactionCreationRequest {
    transactionId: string;
    amount: number;
    currency: string;
    customerId: string;
    lineItems: LineItem[];
}

export interface TransactionCreationResponse {
    success: boolean;
    transactionId?: string;
    errors?: string[];
}