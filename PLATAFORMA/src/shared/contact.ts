export const CONTACT_EMAIL = 'wellturutcv@gmail.com';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
    return EMAIL_RE.test(value.trim());
}
