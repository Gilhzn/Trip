import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Snowflake, Sun } from 'lucide-react';

const ICON_CLASSES = 'shrink-0';

export function WeatherIcon({ code, className = 'size-6' }: { code: number; className?: string }) {
  const cls = `${ICON_CLASSES} ${className}`;
  if (code >= 95) return <CloudLightning className={`${cls} text-violet-500`} />;
  if (code >= 85) return <Snowflake className={`${cls} text-sky-400`} />;
  if (code >= 80) return <CloudRain className={`${cls} text-sky-500`} />;
  if (code >= 71) return <CloudSnow className={`${cls} text-sky-400`} />;
  if (code >= 61) return <CloudRain className={`${cls} text-sky-500`} />;
  if (code >= 51) return <CloudDrizzle className={`${cls} text-sky-400`} />;
  if (code >= 45) return <CloudFog className={`${cls} text-zinc-400`} />;
  if (code >= 3) return <Cloud className={`${cls} text-zinc-400`} />;
  if (code >= 1) return <CloudSun className={`${cls} text-amber-400`} />;
  return <Sun className={`${cls} text-amber-400`} />;
}

/** Nearest i18n-covered WMO code (dictionaries define a representative subset). */
export function weatherLabelCode(code: number): number {
  const known = [0, 1, 2, 3, 45, 51, 61, 63, 65, 71, 73, 75, 80, 95];
  if (known.includes(code)) return code;
  if (code >= 95) return 95;
  if (code >= 85) return 73;
  if (code >= 80) return 80;
  if (code >= 71) return 73;
  if (code >= 66) return 65;
  if (code >= 61) return 63;
  if (code >= 51) return 51;
  if (code >= 45) return 45;
  return 3;
}
