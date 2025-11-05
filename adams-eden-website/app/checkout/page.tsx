import { Metadata } from "next";
import { CheckoutPage } from "./CheckoutPage";

export const metadata: Metadata = {
  title: "Checkout | Adams Eden",
  description: "Complete your purchase from Adams Eden greenhouse.",
};

export default function Checkout() {
  return <CheckoutPage />;
}
