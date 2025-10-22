import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToggleAvailability } from "@/hooks/useDelivery";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AvailabilityToggleProps {
  currentStatus?: boolean;
}

export const AvailabilityToggle = ({
  currentStatus = true,
}: AvailabilityToggleProps) => {
  const [isAvailable, setIsAvailable] = useState(currentStatus);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(false);
  const toggleMutation = useToggleAvailability();

  const handleToggle = (checked: boolean) => {
    // If going offline, show confirmation
    if (!checked) {
      setPendingStatus(checked);
      setShowConfirm(true);
    } else {
      // Going online - no confirmation needed
      updateAvailability(checked);
    }
  };

  const updateAvailability = (status: boolean) => {
    toggleMutation.mutate(status, {
      onSuccess: () => {
        setIsAvailable(status);
        toast.success(
          status
            ? "🟢 You're now online and accepting deliveries"
            : "🔴 You're now offline"
        );
      },
      onError: (error: Error) => {
        toast.error(error.message || "Failed to update availability");
      },
    });
  };

  const confirmGoOffline = () => {
    updateAvailability(pendingStatus);
    setShowConfirm(false);
  };

  return (
    <>
      <div className="flex items-center space-x-3 bg-card border rounded-lg px-4 py-3">
        <Switch
          id="availability"
          checked={isAvailable}
          onCheckedChange={handleToggle}
          disabled={toggleMutation.isPending}
        />
        <div className="flex-1">
          <Label htmlFor="availability" className="cursor-pointer font-medium">
            {isAvailable ? "🟢 Online" : "🔴 Offline"}
          </Label>
          <p className="text-sm text-muted-foreground">
            {isAvailable
              ? "Accepting delivery requests"
              : "Not accepting deliveries"}
          </p>
        </div>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Go Offline?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll stop receiving new delivery requests. Make sure you don't
              have any active deliveries in progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmGoOffline}>
              Go Offline
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
