// Centralized date/time formatting so the whole app honours the configured
// timezone (default America/Recife). App sets it once the settings load.
let currentTimezone = 'America/Recife';

export function setAppTimezone(tz: string) {
  if (tz) currentTimezone = tz;
}

export function getAppTimezone(): string {
  return currentTimezone;
}

export function formatDateTime(
  input: string | number | Date,
  opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
): string {
  const d = new Date(input);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('pt-BR', { timeZone: currentTimezone, ...opts });
}
