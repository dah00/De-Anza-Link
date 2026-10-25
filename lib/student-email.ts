// Same rule as public.is_student_email() in supabase/schema.sql, which is the
// real gate. This copy gives a friendly message before we call Supabase.
const STUDENT_EMAIL_RE = /^[^@\s]+@([a-z0-9-]+\.)*(deanza|fhda)\.edu$/;

export function isStudentEmail(email: string) {
  return STUDENT_EMAIL_RE.test(email.trim().toLowerCase());
}
