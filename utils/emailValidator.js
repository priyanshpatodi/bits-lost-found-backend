const ALLOWED_EMAIL_SUFFIXES = [
  "@bits-pilani.ac.in",
  "@pilani.bits-pilani.ac.in",
  "@goa.bits-pilani.ac.in",
  "@hyderabad.bits-pilani.ac.in",
];

export function isValidBitsEmail(email) {
  if (typeof email !== "string") return false;

  const normalized = email.trim().toLowerCase();

  return ALLOWED_EMAIL_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
}
