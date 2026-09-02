import Cook from "@/models/Cook";

/** Cuisinière associée automatiquement aux commandes cuisine (la première active). */
export async function resolveDefaultKitchenCookId(): Promise<string | null> {
  const cook = await Cook.findOne({ isActive: { $ne: false } })
    .sort({ createdAt: 1 })
    .select("_id")
    .lean<{ _id: unknown } | null>();

  return cook?._id ? String(cook._id) : null;
}
