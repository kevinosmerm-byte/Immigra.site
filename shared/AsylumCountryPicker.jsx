import {asylumCountries} from '../modules/asylum/countries.mjs';
export default function AsylumCountryPicker({value,onChange,language='es',disabled=false}){
 const es=language==='es';
 return <label className="block text-lg">{es?'País de referencia (opcional)':'Reference country (optional)'}
  <select className="block min-h-12 w-full rounded-xl border bg-white p-3 text-slate-900" value={value} disabled={disabled} onChange={event=>onChange(event.target.value)}>
   <option value="">{es?'Práctica general':'General practice'}</option>
   {asylumCountries.map(country=><option key={country} value={country}>{country==='Other'?(es?'Otro':'Other'):country}</option>)}
  </select>
 </label>;
}
