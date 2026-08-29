"use client";

import { useParams } from "next/navigation";
import KitchenOrderWizard from "@/components/kitchen/KitchenOrderWizard";

export default function EditKitchenOrderPage() {
  const { id } = useParams<{ id: string }>();
  return <KitchenOrderWizard mode="edit" editOrderId={id} />;
}
