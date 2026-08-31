/** Minimal customer profile for the "Customer" hover card on battery/ticket info panels. */
export interface CustomerAccountDto {
  id: string;
  email: string;
  phoneNumber?: string | null;
  fullName: string;
  address?: string | null;
}
