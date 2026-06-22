export interface InvoiceItem {
  id: string;
  quantity: number;
  description: string;
  price: number;
  unit?: string;
  width?: number | null;
  height?: number | null;
  pieces?: number | null;
  mrp?: number | null;
  taxRate?: number | null;
}

export interface InvoiceData {
  id?: string; // Optional - only present for saved invoices
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerAddress: string;
  items: InvoiceItem[];
  deliveryCharges: number;
  designingCharges: number;
  discount: number;
  advance: number;
  expenses: number;
  termsConditions: string;
}

export interface CompanyProfile {
  companyName: string;
  logoUrl?: string;
  address: string;
  phone: string;
  website: string;
  directorName: string;
}

export const calculateSubtotal = (items: InvoiceItem[]): number => {
  return items.reduce((sum, item) => sum + item.quantity * item.price, 0);
};

export const calculateTax = (items: InvoiceItem[]): number => {
  return items.reduce((sum, item) => {
    const rate = item.taxRate || 0;
    return sum + item.quantity * item.price * (rate / 100);
  }, 0);
};

export const calculateTotal = (
  items: InvoiceItem[],
  deliveryCharges: number,
  designingCharges: number,
  discount: number = 0
): number => {
  return (
    calculateSubtotal(items) +
    calculateTax(items) +
    deliveryCharges +
    designingCharges -
    discount
  );
};

export const calculateProfit = (
  items: InvoiceItem[],
  deliveryCharges: number,
  designingCharges: number,
  expenses: number,
  discount: number = 0
): number => {
  return calculateTotal(items, deliveryCharges, designingCharges, discount) - expenses;
};
