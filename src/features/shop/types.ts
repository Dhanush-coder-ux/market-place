import { 
  DayEnum, 
  DeliveryTypeEnum, 
  DeliveryByEnum, 
  AnnouncementTypeEnum, 
  AnnouncementSendToEnum, 
  AnnouncementStatusEnum 
} from '@/types/api';

export interface OperatingHoursFormData {
  open_at: string;
  close_at: string;
  day: DayEnum;
}

export interface DeliveryOptionFormData {
  id?: number;
  type: DeliveryTypeEnum;
  speed: string;
  free_shipping_amount: number;
  min_order_amount?: number;
  delivery_charge?: number;
  charge_per_km?: number;
  radius?: number;
  delivery_by: DeliveryByEnum;
  enabled?: boolean;
}

export interface AnnouncementFormData {
  type: AnnouncementTypeEnum;
  message: string;
  call_to_action?: string;
  schedule_at?: string;
  expire_at?: string;
  send_to: AnnouncementSendToEnum;
  status: AnnouncementStatusEnum;
}
