export async function verifyAndFinishPurchase({ transaction, platform, userId, plugin, verify }) {
  if (!userId) throw new Error("account_required");
  const reference = platform === "ios" ? transaction.transactionId : transaction.purchaseToken;
  if (!reference) throw new Error("purchase_pending");
  const result = await verify({ provider: platform === "ios" ? "apple" : "google_play", reference });
  if (!result?.verified) throw new Error("purchase_verification_unavailable");
  if (platform === "ios") await plugin.finishTransaction({ transactionId: transaction.transactionId });
  else if (!transaction.isAcknowledged && result.active) await plugin.acknowledgePurchase({ purchaseToken: reference });
  return result;
}

export async function restoreVerifiedPurchases({ platform, userId, plugin, verify }) {
  if (!userId) throw new Error("account_required");
  await plugin.restorePurchases();
  const { purchases } = await plugin.getPurchases({ productType: "subs", onlyCurrentEntitlements: false });
  let active = false;
  let failures = 0;
  for (const transaction of purchases) {
    try { active = (await verifyAndFinishPurchase({ transaction, platform, userId, plugin, verify })).active || active; }
    catch { failures++; }
  }
  if (!active && failures) throw new Error("purchase_verification_unavailable");
  return { active };
}

export function storeProductForPlan(products, target, platform) {
  // In the pinned Android plugin, identifier is the base plan and planIdentifier is the subscription product.
  return products.find(product => platform === "android"
    ? product.planIdentifier === target.id && product.identifier === target.plan && !product.offerId
    : product.identifier === target);
}
