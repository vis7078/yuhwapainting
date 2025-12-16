export enum WorkflowStatus {
  UNRECEIVED = 'Unreceived',
  RECEIVED = 'Received (Inbound)',
  BLASTING = 'Blasting',
  SHOP_SORTING = 'Shop Sorting',
  PAINTING = 'Painting',
  PACKING = 'Packing',
  AWAITING_SHIPMENT = 'Awaiting Shipment',
  SHIPPED = 'Shipped',
}

export enum ShopLocation {
  NONE = 'None',
  SHOP_A = 'Shop A',
  SHOP_B = 'Shop B',
  SHOP_C = 'Shop C',
  SHOP_D = 'Shop D',
  SHOP_E = 'Shop E',
}

export interface ProductItem {
  id: string; // Corresponds to NO.
  item: string;
  assembly: string;
  description: string;
  material: string;
  length: number;
  qty: number;
  weight: number;
  area: number;
  fp: string;
  
  // Workflow Mutable State
  status: WorkflowStatus;
  shop: ShopLocation;
  updatedAt: string;
}

export interface DashboardStats {
  received: number;
  blasting: number;
  painting: number;
  packing: number;
  waiting: number;
  shipped: number;
  total: number;
}