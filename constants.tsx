import React from 'react';
import { WorkflowStatus } from './types';
import { 
  Circle, 
  ArrowRightCircle, 
  SprayCan, 
  Palette, 
  Truck, 
  Package, 
  Archive,
  LayoutGrid
} from 'lucide-react';

export const WORKFLOW_SEQUENCE: WorkflowStatus[] = [
  WorkflowStatus.UNRECEIVED,
  WorkflowStatus.RECEIVED,
  WorkflowStatus.BLASTING,
  WorkflowStatus.SHOP_SORTING,
  WorkflowStatus.PAINTING,
  WorkflowStatus.PACKING,
  WorkflowStatus.AWAITING_SHIPMENT,
  WorkflowStatus.SHIPPED,
];

export const STATUS_COLORS: Record<WorkflowStatus, string> = {
  [WorkflowStatus.UNRECEIVED]: 'bg-slate-100 text-slate-500 border-slate-200',
  [WorkflowStatus.RECEIVED]: 'bg-blue-100 text-blue-700 border-blue-200',
  [WorkflowStatus.BLASTING]: 'bg-orange-100 text-orange-700 border-orange-200',
  [WorkflowStatus.SHOP_SORTING]: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  [WorkflowStatus.PAINTING]: 'bg-purple-100 text-purple-700 border-purple-200',
  [WorkflowStatus.PACKING]: 'bg-amber-100 text-amber-700 border-amber-200',
  [WorkflowStatus.AWAITING_SHIPMENT]: 'bg-teal-100 text-teal-700 border-teal-200',
  [WorkflowStatus.SHIPPED]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export const STATUS_ICONS: Record<WorkflowStatus, React.ReactNode> = {
  [WorkflowStatus.UNRECEIVED]: <Circle className="w-4 h-4" />,
  [WorkflowStatus.RECEIVED]: <ArrowRightCircle className="w-4 h-4" />,
  [WorkflowStatus.BLASTING]: <SprayCan className="w-4 h-4" />,
  [WorkflowStatus.SHOP_SORTING]: <LayoutGrid className="w-4 h-4" />,
  [WorkflowStatus.PAINTING]: <Palette className="w-4 h-4" />,
  [WorkflowStatus.PACKING]: <Package className="w-4 h-4" />,
  [WorkflowStatus.AWAITING_SHIPMENT]: <Archive className="w-4 h-4" />,
  [WorkflowStatus.SHIPPED]: <Truck className="w-4 h-4" />,
};

export const MOCK_CSV_DATA = `NO.,ITEM,ASSEMBLY,DESCRIPTION,MATERIAL,LENGTH,Q'TY,WEIGHT,Area,FP
1001,BEAM,BM-01,Base Support,Steel,1200,5,50.5,12.5,F
1002,COLUMN,BM-02,Vertical Post,Steel,2400,2,30.2,8.4,F
1003,BEAM,BM-03,Cross Bar,Alum,800,10,12.0,5.0,P
1004,PLATE,BM-04,Mounting Plate,Steel,400,20,5.5,2.1,F
1005,TRUSS,BM-05,Top Beam,Steel,3000,1,80.0,20.0,F
1006,BRACE,BM-06,Corner Brace,Steel,500,8,4.2,1.2,P
1007,RAIL,BM-07,Safety Rail,Alum,1500,4,8.0,3.5,P
1008,GRATING,BM-08,Walkway Grid,Steel,1000,6,25.0,15.0,F`;