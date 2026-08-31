import { Mail, Phone, MapPin, Loader2 } from "lucide-react";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { useCustomerAccount } from "@/features/admin/hooks/account/useCustomerAccount";

interface Props {
  customerId: string;
  customerName: string;
}

export default function CustomerHoverCard({ customerId, customerName }: Props) {
  return (
    <HoverCard>
      <HoverCardTrigger className="cursor-default underline decoration-dotted underline-offset-2">
        {customerName}
      </HoverCardTrigger>
      <HoverCardContent align="end">
        <CustomerHoverCardBody customerId={customerId} />
      </HoverCardContent>
    </HoverCard>
  );
}

function CustomerHoverCardBody({ customerId }: { customerId: string }) {
  const { data: customer, isLoading, isError } = useCustomerAccount(customerId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <p className="text-xs text-destructive text-center py-2">
        Couldn't load customer information.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="font-medium">{customer.fullName}</p>
      <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Mail className="size-3.5 shrink-0" />
          <span className="truncate">{customer.email}</span>
        </div>
        {customer.phoneNumber && (
          <div className="flex items-center gap-1.5">
            <Phone className="size-3.5 shrink-0" />
            <span>{customer.phoneNumber}</span>
          </div>
        )}
        {customer.address && (
          <div className="flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{customer.address}</span>
          </div>
        )}
      </div>
    </div>
  );
}
