import { useState } from "react";
import { apiJson } from "./api.js";
import { normalizeZipCode } from "./civicProfile.js";
import { TEST_VERSIONS, DEFAULT_TEST_VERSION } from "./civicsVersions.js";
import { resolveDynamicAnswers } from "./dynamicCivicsData.js";

export function MyCivicsProfile({ profile, onSave, onBack }) {
  const [zip, setZip] = useState(profile?.zipCode || "");
  const [address, setAddress] = useState("");
  const [needsAddress, setNeedsAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const resolve = async event => {
    event.preventDefault();
    if (!normalizeZipCode(zip)) { setError("Enter a valid five-digit ZIP code."); return; }
    if (!needsAddress) { setNeedsAddress(true); setError(""); return; }
    setLoading(true); setError("");
    try {
      const result = await apiJson("/civic-location/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ zipCode: zip, address }) });
      onSave(result); setAddress(""); setNeedsAddress(false);
    } catch { setError("We couldn't verify your location. Check your connection and try again. Your previous profile is unchanged."); }
    finally { setLoading(false); }
  };
  return <div className="practice-screen"><header className="practice-header"><button className="back-button" onClick={onBack}>← Home</button></header>
    <main className="civic-profile-panel"><h1>My Civics Profile</h1>
      <label>Test version<select value={DEFAULT_TEST_VERSION} disabled>{Object.values(TEST_VERSIONS).map(version => <option key={version.id} value={version.id}>{version.label}</option>)}</select></label>
      <p>This is the test bank available in this app. Check your applicable version with USCIS.</p>
      <dl>{[["State", profile?.state?.code], ["State Capital", profile?.state?.capital], ["Governor", resolveDynamicAnswers("stateGovernor", { profile }).join(", ")], ["U.S. Senators", resolveDynamicAnswers("stateSenators", { profile }).join(", ")], ["Congressional District", profile?.district], ["U.S. Representative", resolveDynamicAnswers("representative", { profile }).join(", ")]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "Not yet verified"}</dd></div>)}</dl>
      {profile?.verifiedAt && <p>Last verified: {new Date(profile.verifiedAt).toLocaleDateString()}</p>}
      <form onSubmit={resolve}><h2>Update location</h2><label htmlFor="civic-zip">ZIP Code</label><input id="civic-zip" inputMode="numeric" autoComplete="postal-code" value={zip} onChange={event => setZip(event.target.value)} maxLength={10} required />
        {needsAddress && <><p>We need a little more information to find your representative. A ZIP code alone does not reliably identify your district.</p><label htmlFor="civic-address">Street address, city and state</label><input id="civic-address" autoComplete="street-address" value={address} onChange={event => setAddress(event.target.value)} required /><small>Sent to the Census Geocoder for this lookup. Not saved in your study profile.</small></>}
        {error && <p role="alert">{error}</p>}<button type="submit" disabled={loading}>{loading ? "Verifying…" : "Find my civic information"}</button>
      </form>
      <button onClick={onBack}>Continue studying</button>
    </main></div>;
}
