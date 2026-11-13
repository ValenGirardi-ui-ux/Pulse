import type { Metadata } from "next";
import { EmailLink, LegalPage, type LegalSection } from "../legal-page";

export const metadata: Metadata = {
  title: "Security · Pulse",
};

const sections: LegalSection[] = [
  {
    title: { en: "Your account", es: "Tu cuenta" },
    body: [
      {
        en: "Passwords are never stored in plain text: our authentication provider, Supabase, keeps them hashed. You can also sign in with Google so you don't need a separate password.",
        es: "Las contraseñas nunca se guardan en texto plano: nuestro proveedor de autenticación, Supabase, las guarda cifradas. También podés entrar con Google y no necesitar otra contraseña.",
      },
    ],
  },
  {
    title: { en: "Your data", es: "Tus datos" },
    body: [
      {
        en: "Everything travels over encrypted connections (HTTPS). In our database, every account can only read and change its own sites and results; that rule is enforced by the database itself, not just by the app.",
        es: "Todo viaja por conexiones cifradas (HTTPS). En nuestra base de datos, cada cuenta solo puede ver y cambiar sus propios sitios y resultados; esa regla la aplica la base de datos misma, no solo la app.",
      },
      {
        en: "Messages sent through the contact form can be sent by anyone, but can't be read back through the app.",
        es: "Cualquiera puede mandar mensajes desde el formulario de contacto, pero nadie puede leerlos desde la app.",
      },
    ],
  },
  {
    title: { en: "How we check your sites", es: "Cómo revisamos tus sitios" },
    body: [
      {
        en: "Pulse only looks at what any visitor could see from the outside. We don't ask for passwords or access to your servers.",
        es: "Pulse solo mira lo que cualquier visitante podría ver desde afuera. No te pedimos contraseñas ni acceso a tus servidores.",
      },
    ],
  },
  {
    title: { en: "Report a problem", es: "Reportar un problema" },
    body: [
      {
        en: <>If you find a security issue in Pulse, please write to <EmailLink /> with the details. We&apos;ll answer and keep you posted while we fix it. Please don&apos;t access other people&apos;s data or disrupt the service while testing.</>,
        es: <>Si encontrás un problema de seguridad en Pulse, escribinos a <EmailLink /> con los detalles. Te vamos a responder y mantener al tanto mientras lo arreglamos. Por favor, no accedas a datos de otras personas ni interrumpas el servicio al probar.</>,
      },
    ],
  },
];

export default function SecurityPage() {
  return (
    <LegalPage
      current="/security"
      title={{ en: "Security", es: "Seguridad" }}
      intro={{
        en: "How Pulse protects your account and your data.",
        es: "Cómo Pulse protege tu cuenta y tus datos.",
      }}
      sections={sections}
    />
  );
}
