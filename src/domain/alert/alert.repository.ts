export type AlertType = 'STOCK_BAJO';
export type AlertStatus = 'ACTIVA' | 'RESUELTA';

export interface Alert {
  id: string;
  productId: string;
  type: AlertType;
  status: AlertStatus;
  resolvedAt: Date | null;
  createdAt: Date;
}

export interface CreateAlertData {
  productId: string;
  type: AlertType;
}

export interface AlertFilters {
  status?: AlertStatus;
  productId?: string;
}

export interface AlertRepository {
  create(data: CreateAlertData): Promise<Alert>;
  findById(id: string): Promise<Alert | null>;
  findActiveByProductId(productId: string): Promise<Alert | null>;
  findAll(filters?: AlertFilters): Promise<Alert[]>;
  resolve(id: string): Promise<Alert>;
}
