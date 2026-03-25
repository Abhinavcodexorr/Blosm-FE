import { getCountryDataList, getEmojiFlag, type TCountryCode } from "countries-list";

export type CountryDialOption = {
  value: string;
  dial: string;
  label: string;
  hint: string;
};

function buildOptions(): CountryDialOption[] {
  const out: Array<CountryDialOption & { _sort: string }> = [];
  for (const c of getCountryDataList()) {
    const iso = c.iso2 as TCountryCode;
    const flag = getEmojiFlag(iso);
    for (const p of c.phone) {
      const dial = `+${p}`;
      out.push({
        value: `${dial}__${iso}__${p}`,
        dial,
        label: `${flag} ${dial}`,
        hint: `${c.name} (${dial})`,
        _sort: c.name,
      });
    }
  }
  out.sort((a, b) => a._sort.localeCompare(b._sort, "en"));
  return out.map(({ _sort, ...o }) => o);
}

let cached: CountryDialOption[] | null = null;

export function getCountryDialOptions(): CountryDialOption[] {
  if (!cached) cached = buildOptions();
  return cached;
}

export function dialFromSelection(selectValue: string): string {
  const dial = selectValue.split("__")[0];
  return dial && dial.startsWith("+") ? dial : "+61";
}

export function getDefaultCountrySelectValue(): string {
  const opts = getCountryDialOptions();
  return opts.find((o) => o.value.startsWith("+61__AU__"))?.value ?? opts[0]?.value ?? "+61__AU__61";
}

/** Legacy alias — use `getDefaultCountrySelectValue()` in new code. */
export const DEFAULT_COUNTRY_SELECT = getDefaultCountrySelectValue();

/** Legacy alias — use `getCountryDialOptions()` in new code. */
export const COUNTRY_DIAL_OPTIONS = getCountryDialOptions();
