import type { Metadata } from "next";
import { EmailLink, LegalPage, type LegalSection } from "../legal-page";

export const metadata: Metadata = {
  title: "Terms of use · Pulse",
};

const sections: LegalSection[] = [
  {
    title: { en: "Using Pulse", es: "Uso de Pulse" },
    body: [
      {
        en: "Pulse checks the health of websites and shows you what needs attention. By creating an account or using Pulse, you agree to these terms.",
        es: "Pulse revisa la salud de sitios web y te muestra qué necesita atención. Al crear una cuenta o usar Pulse, aceptás estos términos.",
      },
    ],
  },
  {
    title: { en: "Your account", es: "Tu cuenta" },
    body: [
      {
        en: "Keep your password safe and don't share your account. You're responsible for what happens in it. Tell us right away if you think someone else got in.",
        es: "Cuidá tu contraseña y no compartas tu cuenta. Sos responsable de lo que pase en ella. Avisanos enseguida si creés que alguien más entró.",
      },
    ],
  },
  {
    title: { en: "Sites you check", es: "Los sitios que revisás" },
    body: [
      {
        en: "Only add websites you own or have permission to check. Don't use Pulse to overload, attack or test the security of sites that aren't yours.",
        es: "Agregá solo sitios que sean tuyos o que tengas permiso para revisar. No uses Pulse para sobrecargar, atacar o probar la seguridad de sitios ajenos.",
      },
    ],
  },
  {
    title: { en: "Plans and payments", es: "Planes y pagos" },
    body: [
      {
        en: "Pulse has a single plan, shown on our home page. If you subscribe, it renews every month until you cancel. When you cancel, you keep access until the end of the period you already paid for.",
        es: "Pulse tiene un solo plan, que figura en la página principal. Si te suscribís, se renueva cada mes hasta que lo canceles. Al cancelar, seguís teniendo acceso hasta el final del período que ya pagaste.",
      },
    ],
  },
  {
    title: { en: "What we can and can't promise", es: "Lo que podemos y no podemos prometer" },
    body: [
      {
        en: "We work hard to keep Pulse accurate and available, but it's provided as is. Scan results are a guide, not a guarantee that your site is free of problems, and Pulse may sometimes be unavailable.",
        es: "Nos esforzamos para que Pulse sea preciso y esté disponible, pero se ofrece tal como está. Los resultados de los escaneos son una guía, no una garantía de que tu sitio no tenga problemas, y a veces Pulse puede no estar disponible.",
      },
      {
        en: "To the extent the law allows, Pulse isn't liable for indirect losses, such as lost revenue or data, that come from using the service.",
        es: "En la medida en que la ley lo permita, Pulse no es responsable por pérdidas indirectas, como ingresos o datos perdidos, que surjan del uso del servicio.",
      },
    ],
  },
  {
    title: { en: "Ending your account", es: "Fin de la cuenta" },
    body: [
      {
        en: "You can stop using Pulse and delete your account from your Profile at any time. We may suspend accounts that break these terms.",
        es: "Podés dejar de usar Pulse y borrar tu cuenta desde tu Perfil cuando quieras. Podemos suspender cuentas que no cumplan estos términos.",
      },
    ],
  },
  {
    title: { en: "Changes", es: "Cambios" },
    body: [
      {
        en: "If we change these terms, we'll update the date at the top of this page and, for important changes, let you know by email.",
        es: "Si cambiamos estos términos, vamos a actualizar la fecha de arriba y, si el cambio es importante, te vamos a avisar por email.",
      },
      {
        en: <>Questions? Write to <EmailLink />.</>,
        es: <>¿Dudas? Escribinos a <EmailLink />.</>,
      },
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      current="/terms"
      title={{ en: "Terms of use", es: "Términos de uso" }}
      intro={{
        en: "The rules for using Pulse, written as plainly as we can.",
        es: "Las reglas para usar Pulse, escritas lo más claro posible.",
      }}
      sections={sections}
    />
  );
}
