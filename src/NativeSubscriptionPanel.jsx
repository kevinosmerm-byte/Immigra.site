import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { NativePurchases } from "@capgo/native-purchases";
import { useAccount } from "./accountContext.js";
import { apiUrl } from "./api.js";
import { verifyAndFinishPurchase, restoreVerifiedPurchases, storeProductForPlan } from "./nativePurchaseFlow.js";

export function NativeSubscriptionPanel({ language = "en" }) {
  const { session, refreshUsage, usage } = useAccount();
  const [products, setProducts] = useState([]);
  const [config, setConfig] = useState(null);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [recoveryRequired, setRecoveryRequired] = useState(false);
  const inFlight = useRef(false);
  const platform = Capacitor.getPlatform();
  const es = language === "es";
  useEffect(() => {
    let alive = true;
    (async () => {
      await NativePurchases.configure({ autoFinishTransactions: false });
      const response = await fetch(apiUrl("/native-billing/config"), { cache: "no-store" });
      if (!response.ok) throw new Error("unavailable");
      const all = await response.json();
      const current = platform === "ios" ? all.apple : all.google;
      if (!alive) return;
      setConfig(current);
      if (!current?.enabled) return;
      const identifiers = [...new Set(Object.values(current.products).map(product => typeof product === "string" ? product : product.id))];
      const result = await NativePurchases.getProducts({ productIdentifiers: identifiers, productType: "subs" });
      if (alive) setProducts(result.products);
    })().catch(() => { if (alive) setMessage(es ? "La tienda no está disponible. Puedes seguir estudiando gratis." : "The store is unavailable. Free study remains available."); });
    return () => { alive = false; };
  }, [platform, es]);
  const verify = async (body) => {
    const response = await fetch(apiUrl("/native-billing/verify"), { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.code || "purchase_verification_unavailable");
    return data;
  };
  const action = async (kind) => {
    if (inFlight.current) return;
    if (!session?.user?.id) { window.dispatchEvent(new Event("citizenshipai:account-request")); return; }
    inFlight.current = true; setBusy(kind); setMessage("");
    try {
      if (kind === "manage") await NativePurchases.manageSubscriptions();
      else if (kind === "restore") {
        const result = await restoreVerifiedPurchases({ platform, userId: session.user.id, plugin: NativePurchases, verify });
        setMessage(result.active ? (es ? "Suscripción restaurada." : "Subscription restored.") : (es ? "No se encontró una suscripción activa para esta cuenta." : "No active subscription was found for this account."));
        setRecoveryRequired(false);
      } else {
        const target = config.products[kind];
        const product = storeProductForPlan(products, target, platform);
        if (!product) throw new Error("store_product_unavailable");
        setRecoveryRequired(true);
        const transaction = await NativePurchases.purchaseProduct({ productIdentifier: typeof target === "string" ? target : target.id, planIdentifier: target.plan, offerToken: product.offerToken, productType: "subs", appAccountToken: session.user.id, autoAcknowledgePurchases: false });
        const result = await verifyAndFinishPurchase({ transaction, platform, userId: session.user.id, plugin: NativePurchases, verify });
        setRecoveryRequired(!result.active);
        setMessage(result.active ? (es ? "Suscripción activada." : "Subscription activated.") : (es ? "La compra todavía no concede acceso activo." : "The purchase does not grant active access yet."));
      }
      await refreshUsage();
    } catch (error) {
      const cancelled = /cancel/i.test(String(error.code || "") + error.message);
      if (cancelled) setRecoveryRequired(false);
      setMessage(cancelled ? (es ? "Compra cancelada. No se activó una suscripción." : "Purchase canceled. No subscription was activated.") : (es ? "No pudimos verificar la compra. Si ya pagaste, usa Restaurar compras; no vuelvas a comprar." : "We could not verify the purchase. If you already paid, use Restore purchases; do not purchase again."));
    } finally { inFlight.current = false; setBusy(""); }
  };
  const button = "min-h-11 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-slate-100! disabled:opacity-50";
  return <section aria-label={es ? "Suscripción de la tienda" : "Store subscription"} className="mt-4 rounded-2xl border border-white/10 bg-[#030305] p-4 text-slate-100 backdrop-blur-md">
    {config?.enabled ? <>
      <div className="flex flex-wrap gap-3">{usage?.tier !== "pro" && ["monthly", "annual"].map(interval => {
        const target = config.products[interval];
        const product = storeProductForPlan(products, target, platform);
        return <button key={interval} className={button} type="button" disabled={Boolean(busy) || recoveryRequired || !product} onClick={() => action(interval)}>{interval === "monthly" ? (es ? "Mensual" : "Monthly") : (es ? "Anual" : "Annual")} · {product?.priceString || (es ? "Cargando precio…" : "Loading price…")}</button>;
      })}<button className={button} type="button" disabled={Boolean(busy)} onClick={() => action("restore")}>{es ? "Restaurar compras" : "Restore purchases"}</button><button className={button} type="button" disabled={Boolean(busy)} onClick={() => action("manage")}>{es ? "Administrar suscripción" : "Manage subscription"}</button></div>
      <p className="mt-3 text-sm text-slate-200!">{es ? "El pago comienza al confirmar la compra en la tienda y se renueva automáticamente hasta que lo canceles en tu cuenta de Apple o Google. La prueba de 7 días de Immigra no necesita tarjeta y no se repite al comprar." : "Payment begins when you confirm the store purchase and renews automatically until canceled in your Apple or Google account. Immigra's 7-day trial requires no card and does not restart when you purchase."}</p>
      <p className="mt-3 text-sm"><a className="underline" href="https://immigra.site/#privacy" target="_blank" rel="noreferrer">{es ? "Privacidad y términos de uso" : "Privacy and terms of use"}</a></p>
    </> : <p>{es ? "Las compras en la tienda todavía no están habilitadas. El estudio gratuito sigue disponible." : "Store purchases are not enabled yet. Free study remains available."}</p>}
    {(busy || message) && <p role="status" aria-live="polite" className="mt-3 text-slate-200!">{busy ? (es ? "Procesando…" : "Processing…") : message}</p>}
  </section>;
}
