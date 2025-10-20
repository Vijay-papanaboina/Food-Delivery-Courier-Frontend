import { config } from "@/config/env";
import { ApiService } from "./baseApi";
import type { Delivery, DriverStats } from "@/types";

// Delivery API Service
export class DeliveryApi extends ApiService {
  constructor() {
    super(config.deliveryApiUrl);
  }

  // Get deliveries for the logged-in driver
  getMyDeliveries = async (
    status?: string
  ): Promise<{ deliveries: Delivery[]; total: number }> => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);

    const url = `/api/delivery${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    return this.get<{ deliveries: Delivery[]; total: number; message: string }>(
      url
    );
  };

  // Mark delivery as picked up
  pickupDelivery = async (
    deliveryId: string,
    orderId: string,
    driverId: string
  ): Promise<{ message: string }> => {
    return this.post("/api/delivery/pickup", { deliveryId, orderId, driverId });
  };

  // Mark delivery as completed
  completeDelivery = async (
    deliveryId: string,
    orderId: string,
    driverId: string
  ): Promise<{ message: string }> => {
    return this.post("/api/delivery/complete", {
      deliveryId,
      orderId,
      driverId,
    });
  };

  // Get driver stats
  getStats = async (): Promise<DriverStats> => {
    const response = await this.get<{ stats: DriverStats; message: string }>(
      "/api/delivery/stats"
    );
    return response.stats;
  };
}

export const deliveryApi = new DeliveryApi();
