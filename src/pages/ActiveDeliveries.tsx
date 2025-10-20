import { useState } from "react";
import {
  useMyDeliveries,
  usePickupDelivery,
  useCompleteDelivery,
} from "@/hooks/useDelivery";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, MapPin, Clock, Phone, User } from "lucide-react";
import type { Delivery } from "@/types";

export const ActiveDeliveries = () => {
  const [activeTab, setActiveTab] = useState("assigned");
  const { user } = useAuthStore();

  const { data: assignedData, isLoading: assignedLoading } =
    useMyDeliveries("assigned");
  const { data: pickedUpData, isLoading: pickedUpLoading } =
    useMyDeliveries("picked_up");

  const pickupMutation = usePickupDelivery();
  const completeMutation = useCompleteDelivery();

  const handlePickup = (deliveryId: string, orderId: string) => {
    if (user?.userId) {
      pickupMutation.mutate({ deliveryId, orderId, driverId: user.userId });
    }
  };

  const handleComplete = (deliveryId: string, orderId: string) => {
    if (user?.userId) {
      completeMutation.mutate({ deliveryId, orderId, driverId: user.userId });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Active Deliveries</h1>
        <p className="text-muted-foreground mt-2">
          Manage your ongoing deliveries
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="assigned">
            Assigned ({assignedData?.total || 0})
          </TabsTrigger>
          <TabsTrigger value="picked_up">
            Picked Up ({pickedUpData?.total || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assigned" className="mt-6">
          {assignedLoading ? (
            <DeliverySkeletons />
          ) : assignedData?.deliveries && assignedData.deliveries.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {assignedData.deliveries.map((delivery) => (
                <DeliveryCard
                  key={delivery.deliveryId}
                  delivery={delivery}
                  onAction={() =>
                    handlePickup(delivery.deliveryId, delivery.orderId)
                  }
                  actionLabel="Pick Up"
                  actionPending={pickupMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="No assigned deliveries at the moment" />
          )}
        </TabsContent>

        <TabsContent value="picked_up" className="mt-6">
          {pickedUpLoading ? (
            <DeliverySkeletons />
          ) : pickedUpData?.deliveries && pickedUpData.deliveries.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {pickedUpData.deliveries.map((delivery) => (
                <DeliveryCard
                  key={delivery.deliveryId}
                  delivery={delivery}
                  onAction={() =>
                    handleComplete(delivery.deliveryId, delivery.orderId)
                  }
                  actionLabel="Complete"
                  actionPending={completeMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="No picked up deliveries at the moment" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface DeliveryCardProps {
  delivery: Delivery;
  onAction: () => void;
  actionLabel: string;
  actionPending: boolean;
}

function DeliveryCard({
  delivery,
  onAction,
  actionLabel,
  actionPending,
}: DeliveryCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              Order #{delivery.orderId.slice(0, 8)}
            </CardTitle>
          </div>
          <Badge
            variant={delivery.status === "picked_up" ? "default" : "secondary"}
          >
            {delivery.status.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {delivery.deliveryAddress && (
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium">Delivery Address:</p>
              <p className="text-muted-foreground">
                {delivery.deliveryAddress.street}
              </p>
              <p className="text-muted-foreground">
                {delivery.deliveryAddress.city},{" "}
                {delivery.deliveryAddress.state}{" "}
                {delivery.deliveryAddress.zipCode}
              </p>
            </div>
          </div>
        )}

        {delivery.customerName && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Customer:</span>
            <span className="text-muted-foreground">
              {delivery.customerName}
            </span>
          </div>
        )}

        {delivery.customerPhone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Phone:</span>
            <span className="text-muted-foreground">
              {delivery.customerPhone}
            </span>
          </div>
        )}

        {delivery.estimatedDeliveryTime && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Estimated Time:</span>
            <span className="text-muted-foreground">
              {new Date(delivery.estimatedDeliveryTime).toLocaleTimeString()}
            </span>
          </div>
        )}

        <div className="pt-2">
          <Button
            onClick={onAction}
            disabled={actionPending}
            className="w-full"
          >
            {actionPending ? "Processing..." : actionLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DeliverySkeletons() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-center">{message}</p>
      </CardContent>
    </Card>
  );
}
