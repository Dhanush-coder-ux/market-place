export interface SupplierLocationInfos {
  zipcode: string;
  country: string;
  state: string;
  full_address: string;
}

export interface SupplierContactInfos {
  email?: string;
  mobile_number?: string;
}

export interface SupplierContactPersonInfos {
  name: string;
  email?: string;
  mobile_number?: string;
}

export interface SupplierOutstandingInfos {
  amount: number;
}

export interface SupplierCustomFieldDefinition {
  id: string;
  shop_id: string;
  field_name: string;
  label_name: string;
  type: string;
  required: boolean;
  visible_online: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SupplierCustomFieldValue {
  id?: string;
  shop_id: string;
  supplier_id: string;
  field_id: string;
  value: string;
}

// Helper function to extract supplier outstanding amount safely from any structure
export const getSupplierOutstanding = (sup: any, stats?: any): number => {
  if (sup) {
    if (typeof sup.outstanding_infos === 'number') return sup.outstanding_infos;
    if (sup.outstanding_infos?.amount !== undefined && sup.outstanding_infos?.amount !== null) {
      return Number(sup.outstanding_infos.amount) || 0;
    }
    if (sup.outstanding !== undefined && sup.outstanding !== null) {
      return Number(sup.outstanding) || 0;
    }
    if (sup.outstanding_amount !== undefined && sup.outstanding_amount !== null) {
      return Number(sup.outstanding_amount) || 0;
    }
    if (sup.datas?.outstanding_balance !== undefined && sup.datas?.outstanding_balance !== null) {
      return Number(sup.datas.outstanding_balance) || 0;
    }
    if (sup.datas?.outstanding !== undefined && sup.datas?.outstanding !== null) {
      return Number(sup.datas.outstanding) || 0;
    }
  }
  if (stats?.total_outstandings !== undefined && stats?.total_outstandings !== null) {
    return Number(stats.total_outstandings) || 0;
  }
  return 0;
};
