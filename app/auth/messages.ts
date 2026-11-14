import type { AuthErrorCode } from "./actions";

export const authErrors: Record<AuthErrorCode | "google" | "callback", { en: string; es: string }> = {
  missing_fields: { en: "Fill in all the required fields.", es: "Completá todos los campos obligatorios." },
  invalid_credentials: { en: "Wrong email or password.", es: "El email o la contraseña no son correctos." },
  email_not_confirmed: {
    en: "Confirm your email first. Check your inbox for the link.",
    es: "Primero confirmá tu email. Buscá el link en tu bandeja de entrada.",
  },
  weak_password: {
    en: "That password is too weak. Use at least 8 characters.",
    es: "Esa contraseña es muy débil. Usá al menos 8 caracteres.",
  },
  user_exists: {
    en: "There's already an account with that email. Try logging in.",
    es: "Ya hay una cuenta con ese email. Probá iniciar sesión.",
  },
  invalid_email: { en: "That email address isn't valid.", es: "Ese email no es válido." },
  invalid_website: { en: "Enter a valid website, like yoursite.com", es: "Ingresá un sitio válido, como tusitio.com" },
  rate_limited: { en: "Too many attempts. Wait a minute and try again.", es: "Demasiados intentos. Esperá un minuto y probá de nuevo." },
  not_configured: {
    en: "Sign in isn't set up yet on this server.",
    es: "El inicio de sesión todavía no está configurado en este servidor.",
  },
  password_mismatch: { en: "The passwords don't match.", es: "Las contraseñas no coinciden." },
  same_password: {
    en: "Choose a password different from your current one.",
    es: "Elegí una contraseña distinta a la que ya tenías.",
  },
  reset_expired: {
    en: "This reset link expired or was already used. Ask for a new one.",
    es: "Este link para cambiar la contraseña venció o ya se usó. Pedí uno nuevo.",
  },
  unknown: { en: "Something went wrong. Try again.", es: "Algo salió mal. Probá de nuevo." },
  google: { en: "We couldn't start Google sign-in. Try again.", es: "No pudimos iniciar sesión con Google. Probá de nuevo." },
  callback: {
    en: "That sign-in link didn't work or has expired. Try again.",
    es: "Ese link de inicio de sesión no funcionó o venció. Probá de nuevo.",
  },
};
