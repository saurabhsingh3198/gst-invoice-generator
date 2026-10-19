// Customer / Party Directory Manager
// Allows saving frequent buyers/contractors so their details auto-fill in 1-click

export interface CustomerTemplate {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  gstin?: string;
  address: string;
  stateName: string;
  stateCode: string;
  partyType?: 'B2B' | 'B2C';
  notes?: string;
}

export const DEFAULT_CUSTOMERS: CustomerTemplate[] = [
  {
    id: 'cust-1',
    name: 'MANAV UTTHAN SEWA SAMITI',
    phone: '9838012345',
    email: 'manavutthan@gmail.com',
    gstin: '09AABTM1234C1Z5',
    address: 'KUSHINAGAR, NEAR MAIN CHOWK',
    stateName: 'Uttar Pradesh',
    stateCode: '09',
    partyType: 'B2B',
  },
  {
    id: 'cust-2',
    name: 'AGRAWAL HARDWARE & SANITARY',
    phone: '9415098765',
    email: 'agrawal.hardware@gmail.com',
    gstin: '09BPLPA4432K1ZP',
    address: 'NAUSAD CHOWK, GORAKHPUR',
    stateName: 'Uttar Pradesh',
    stateCode: '09',
    partyType: 'B2B',
  },
  {
    id: 'cust-3',
    name: 'SHARMA BUILDCON & DEVELOPERS',
    phone: '9918076543',
    email: 'sharmabuilders@yahoo.com',
    gstin: '',
    address: 'SECTOR 4, GOMTI NAGAR, LUCKNOW',
    stateName: 'Uttar Pradesh',
    stateCode: '09',
    partyType: 'B2C',
  },
];

const CUSTOMER_STORAGE_KEY = 'gst_customer_directory_v1';

export function loadCustomerDirectory(): CustomerTemplate[] {
  if (typeof window === 'undefined') return DEFAULT_CUSTOMERS;
  try {
    const raw = localStorage.getItem(CUSTOMER_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(DEFAULT_CUSTOMERS));
      return DEFAULT_CUSTOMERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to load customer directory:', e);
  }
  return DEFAULT_CUSTOMERS;
}

export const getSavedCustomers = loadCustomerDirectory;

export function saveCustomerToDirectory(customer: Omit<CustomerTemplate, 'id'> & { id?: string }): CustomerTemplate[] {
  const current = loadCustomerDirectory();
  const id = customer.id || `cust-${Date.now()}`;
  const record: CustomerTemplate = { ...customer, id };

  const existingIdx = current.findIndex(
    (c) => c.id === id || (c.name.trim().toLowerCase() === customer.name.trim().toLowerCase())
  );

  let updated: CustomerTemplate[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = record;
  } else {
    updated = [record, ...current];
  }

  try {
    localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save customer to directory:', e);
  }
  return updated;
}

export function deleteCustomerFromDirectory(id: string): CustomerTemplate[] {
  const current = loadCustomerDirectory();
  const updated = current.filter((c) => c.id !== id);
  try {
    localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete customer:', e);
  }
  return updated;
}
