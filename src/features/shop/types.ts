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
  type: DeliveryTypeEnum;
  speed: string;
  free_shipping_amount: number;
  delivery_by: DeliveryByEnum;
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