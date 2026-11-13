import type { Metadata } from "next";
import { EmailLink, LegalPage, type LegalSection } from "../legal-page";

export const metadata: Metadata = {
  title: "Privacy · Pulse",
};

const sections: LegalSection[] = [
  {
    title: { en: "What we collect", es: "Qué datos guardamos" },
    body: [
      {
        en: "Your account: your name, your email address and your password. We never see your password; it's stored encrypted by our authentication provider.",
        es: "Tu cuenta: tu nombre, tu email y tu contraseña. Nunca vemos tu contraseña: la guarda cifrada nuestro proveedor de autenticación.",
      },
      {
        en: "If you sign in with Google: the name, email address and profile photo that Google shares with us. We don't get access to your Gmail, Drive or anything else in your Google account.",
        es: "Si entrás con Google: el nombre, el email y la foto de perfil que Google nos comparte. No tenemos acceso a tu Gmail, tu Drive ni a nada más de tu cuenta de Google.",
      },
      {
        en: "The websites you add and the results of the scans we run on them.",
        es: "Los sitios web que agregás y los resultados de los escaneos que hacemos sobre ellos.",
      },
      {
        en: "Messages you send us through the contact form: your name, your email and your message.",
        es: "Los mensajes que nos mandás desde el formulario de contacto: tu nombre, tu email y tu mensaje.",
      },
    ],
  },
  {
    title: { en: "What we use it for", es: "Para qué los usamos" },
    body: [
      {
        en: "Only to run Pulse: to sign you in, check the health of your sites, show you the results and answer your messages. We don't sell your data and we don't use it for advertising.",
        es: "Solo para que Pulse funcione: iniciar tu sesión, revisar la salud de tus sitios, mostrarte los resultados y responder tus mensajes. No vendemos tus datos ni los usamos para publicidad.",
      },
    ],
  },
  {
    title: { en: "Cookies and local storage", es: "Cookies y almacenamiento local" },
    body: [
      {
        en: "We use cookies only to keep you signed in. Your browser also remembers the language you picked. We don't use tracking or advertising cookies.",
        es: "Usamos cookies solo para mantener tu sesión iniciada. Tu navegador también recuerda el idioma que elegiste. No usamos cookies de seguimiento ni de publicidad.",
      },
    ],
  },
  {
    title: { en: "Who else handles your data", es: "Quién más maneja tus datos" },
    body: [
      {
        en: "We rely on a few providers to run Pulse: Supabase (accounts and database), Google (if you choose to sign in with Google) and our hosting provider. They process data only on our behalf and only to provide their service.",
        es: "Usamos algunos proveedores para que Pulse funcione: Supabase (cuentas y base de datos), Google (si elegís entrar con Google) y nuestro proveedor de hosting. Procesan los datos solo en nuestro nombre y solo para dar su servicio.",
      },
    ],
  },
  {
    title: { en: "Your choices", es: "Tus derechos" },
    body: [
      {
        en: "You can change your name and your sites from the dashboard at any time. To get a copy of your data or delete your account and everything in it, write to us and we'll do it.",
        es: "Podés cambiar tu nombre y tus sitios desde el dashboard cuando quieras. Si querés una copia de tus datos o borrar tu cuenta con todo lo que tiene, escribinos y lo hacemos.",
      },
      {
        en: "If you signed in with Google, you can also remove Pulse's access from your Google Account settings.",
        es: "Si entraste con Google, también podés quitarle el acceso a Pulse desde la configuración de tu cuenta de Google.",
      },
    ],
  },
  {
    title: { en: "Contact", es: "Contacto" },
    body: [
      {
        en: <>Questions about your privacy? Write to <EmailLink />.</>,
        es: <>¿Dudas sobre tu privacidad? Escribinos a <EmailLink />.</>,
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      current="/privacy"
      title={{ en: "Privacy", es: "Privacidad" }}
      intro={{
        en: "This page explains what information Pulse keeps about you, why, and what you can do about it.",
        es: "Esta página explica qué información guarda Pulse sobre vos, para qué, y qué podés hacer al respecto.",
      }}
      sections={sections}
    />
  );
}
