import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { apiJson } from "./api.js";
import { civicAddressIdentity, civicAddressInput, knownCivicAddress, knownCivicZipCode, normalizeZipCode } from "./civicProfile.js";
import { cancelCivicRefreshToken, captureCivicRefreshToken, isCivicRefreshTokenCurrent, refreshCivicProfile } from "./civicProfileSync.js";
import { TEST_VERSIONS, DEFAULT_TEST_VERSION } from "./civicsVersions.js";
import { resolveDynamicAnswers } from "./dynamicCivicsData.js";

export function MyCivicsProfile({ profile, userKey = "guest", language = "en", userProfile = {}, n400Profile = {}, onSave, onProfileUpdate, onBack, refreshStatus = "idle" }) {
  const es = language === "es";
  const knownAddress = knownCivicAddress({ userProfile, n400Profile });
  const knownZip = knownCivicZipCode({ userProfile, n400Profile, civicProfile: profile }) || "";
  const hasStructuredAddress = Boolean(userProfile.streetAddress || userProfile.address);
  const [zip, setZip] = useState(knownZip);
  const [address, setAddress] = useState(userProfile.streetAddress || userProfile.address || knownAddress);
  const [city, setCity] = useState(hasStructuredAddress ? userProfile.city || "" : "");
  const [state, setState] = useState(hasStructuredAddress ? (typeof userProfile.state === "object" ? userProfile.state?.code || "" : userProfile.state || "") : "");
  const [editing, setEditing] = useState(!knownAddress);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const mounted = useRef(true);
  const requestTokenRef = useRef(null);
  const currentLocation = useRef(null);
  useLayoutEffect(() => { currentLocation.current = { userKey, address: knownAddress, zipCode: knownZip }; }, [userKey, knownAddress, knownZip]);
  useEffect(() => {
    mounted.current = true;
    const clear = () => { cancelCivicRefreshToken(requestTokenRef.current); };
    globalThis.addEventListener?.("citizenshipai:local-data-cleared", clear);
    return () => { mounted.current = false; clear(); globalThis.removeEventListener?.("citizenshipai:local-data-cleared", clear); };
  }, [userKey]);

  const resolveLocation = useCallback(async (inputAddress, inputZip, { saveAddress = false, updatedAt = userProfile.addressUpdatedAt || null } = {}) => {
    cancelCivicRefreshToken(requestTokenRef.current);
    const expectedAddress = civicAddressInput(inputAddress, inputZip).toLowerCase();
    const requestToken = captureCivicRefreshToken(userKey, { isCurrent: () => {
      const current = currentLocation.current;
      return mounted.current && current?.userKey === userKey && (!current.address || civicAddressInput(current.address, current.zipCode).toLowerCase() === expectedAddress);
    } });
    requestTokenRef.current = requestToken;
    setLoading(true); setError("");
    try {
      const locationIdentity = await civicAddressIdentity(inputAddress, inputZip);
      if (!mounted.current || !isCivicRefreshTokenCurrent(requestToken)) return;
      const refreshed = await refreshCivicProfile({ userKey, zipCode: inputZip, address: inputAddress, locationIdentity, addressUpdatedAt: updatedAt }, {
        force: true, requestToken, fetchProfile: input => apiJson("/civic-location/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }),
      });
      if (!mounted.current || !isCivicRefreshTokenCurrent(requestToken)) return;
      if (refreshed.status !== "updated") throw new Error("Location lookup unavailable.");
      const result = refreshed.profile;
      if (!mounted.current) return;
      onSave?.(result); setEditing(false);
    } catch {
      if (mounted.current && isCivicRefreshTokenCurrent(requestToken)) setError(saveAddress
        ? (es ? "Guardamos tu ubicación. Aún no pudimos verificar tus representantes. Inténtalo de nuevo." : "Your location is saved. We couldn't verify your representatives yet. Please try again.")
        : (es ? "No pudimos verificar tu ubicación. Conservamos la información anterior. Inténtalo de nuevo." : "We couldn't verify your location. Your previous information is saved. Please try again."));
    } finally { if (mounted.current && requestTokenRef.current === requestToken) setLoading(false); }
  }, [userKey, userProfile.addressUpdatedAt, onSave, es]);

  const submit = event => {
    event.preventDefault();
    if (!normalizeZipCode(zip)) { setError(es ? "Ingresa un código postal válido de cinco dígitos." : "Enter a valid five-digit ZIP code."); return; }
    const fullAddress = [address.trim(), city.trim(), state.trim()].filter(Boolean).join(", ");
    if (fullAddress.length < 8) { setError(es ? "Ingresa tu dirección completa." : "Enter your complete address."); return; }
    const updatedAt = new Date().toISOString();
    onProfileUpdate?.({ streetAddress: address.trim(), city: city.trim(), state: state.trim(), zipCode: normalizeZipCode(zip), addressUpdatedAt: updatedAt });
    resolveLocation(fullAddress, zip, { saveAddress: true, updatedAt });
  };
  const rows = [
    [es ? "Estado" : "State", profile?.state?.code],
    [es ? "Capital del estado" : "State capital", profile?.state?.capital],
    [es ? "Gobernador" : "Governor", resolveDynamicAnswers("stateGovernor", { profile }).join(", ") || null],
    [es ? "Senadores de EE. UU." : "U.S. senators", resolveDynamicAnswers("stateSenators", { profile }).join(", ") || null],
    [es ? "Distrito del Congreso" : "Congressional district", profile?.district],
    [es ? "Representante de EE. UU." : "U.S. representative", resolveDynamicAnswers("representative", { profile }).join(", ") || null],
    [es ? "Senador estatal" : "State senator", profile?.stateSenator?.name],
    [es ? "Representante estatal" : "State representative", profile?.stateRepresentative?.name],
  ];
  return <div className="practice-screen"><header className="practice-header"><button className="back-button" onClick={onBack}>← {es ? "Inicio" : "Home"}</button></header>
    <main className="civic-profile-panel"><h1>{es ? "Mi perfil cívico" : "My civic profile"}</h1>
      <label>{es ? "Versión del examen" : "Test version"}<select value={DEFAULT_TEST_VERSION} disabled>{Object.values(TEST_VERSIONS).map(version => <option key={version.id} value={version.id}>{version.label}</option>)}</select></label>
      <p>{es ? "Confirma con USCIS qué versión corresponde a tu solicitud." : "Check your applicable test version with USCIS."}</p>
      <dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? (es ? "Aún no verificado" : "Not yet verified")}</dd></div>)}</dl>
      {(loading || refreshStatus === "updating") && <p role="status" aria-live="polite">{es ? "Buscando tus representantes…" : "Finding your representatives…"}</p>}
      {!error && refreshStatus === "unavailable" && <p role="status">{es ? "Tu ubicación está guardada. Tus representantes aún están pendientes de verificar." : "Your location is saved. Your representatives still need verification."}</p>}
      {error && <p role="alert">{error}</p>}
      <details><summary>{es ? "Fuentes y fechas" : "Sources and dates"}</summary>
        {profile?.sourceMetadata?.length ? <ul>{profile.sourceMetadata.map((record, index) => <li key={`${record.source}:${index}`}><a href={record.sourceUrl} target="_blank" rel="noopener noreferrer">{record.source}</a> · {record.verifiedAt ? new Date(record.verifiedAt).toLocaleDateString(es ? "es" : "en") : "—"}{["stale", "dated_fallback"].includes(record.cacheStatus) && <span> · {es ? "última información verificada" : "last verified information"}</span>}</li>)}</ul> : <p>{es ? "Las fuentes aparecerán al verificar tu ubicación." : "Sources appear when your location is verified."}</p>}
      </details>
      {!editing ? <div className="civic-profile-actions"><button type="button" disabled={loading} onClick={() => resolveLocation(knownAddress, zip)}>{es ? "Actualizar información" : "Refresh information"}</button><button type="button" onClick={() => setEditing(true)}>{es ? "Editar ubicación" : "Edit location"}</button></div> : <form onSubmit={submit}>
        <h2>{es ? "Tu ubicación" : "Your location"}</h2>
        <p>{es ? "El código postal puede abarcar varios distritos. Usamos la dirección para encontrar el tuyo." : "A ZIP code can span several districts. We use your address to find yours."}</p>
        <label htmlFor="civic-address">{es ? "Dirección" : "Street address"}</label><input id="civic-address" autoComplete="address-line1" value={address} onChange={event => setAddress(event.target.value)} maxLength={300} required />
        <label htmlFor="civic-city">{es ? "Ciudad" : "City"}</label><input id="civic-city" autoComplete="address-level2" value={city} onChange={event => setCity(event.target.value)} maxLength={100} />
        <label htmlFor="civic-state">{es ? "Estado" : "State"}</label><input id="civic-state" autoComplete="address-level1" value={state} onChange={event => setState(event.target.value)} maxLength={50} />
        <label htmlFor="civic-zip">{es ? "Código postal" : "ZIP code"}</label><input id="civic-zip" inputMode="numeric" autoComplete="postal-code" value={zip} onChange={event => setZip(event.target.value)} maxLength={10} required />
        <small>{es ? "La dirección se guarda en tu perfil privado y se envía al Census Geocoder para esta consulta." : "Your address is saved in your private profile and sent to the Census Geocoder for this lookup."}</small>
        <button type="submit" disabled={loading} aria-busy={loading}>{loading ? (es ? "Verificando…" : "Verifying…") : (es ? "Guardar y verificar" : "Save and verify")}</button>
      </form>}
      <button onClick={onBack}>{es ? "Continuar estudiando" : "Continue studying"}</button>
    </main></div>;
}
