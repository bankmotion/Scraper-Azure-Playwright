export interface Result {
  success: boolean;
  devices: Device[]
}

export interface Device {
  success: boolean;
  serialNumber: string;
  productNumber: string;
  productName: string;
  entitlements: Entitlement[]
}

export interface Entitlement {
  type: string;
  serviceType: string;
  supportLevels: SupportLevel[]
}

export interface SupportLevel {
  startDate: string;
  endDate: string;
  serviceLevel: string[];
  deliverables: string[];
  status: string
}