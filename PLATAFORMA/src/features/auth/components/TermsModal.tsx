import { X } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey';

type ModalType = 'terms' | 'privacy';

const TERMS_TEXT: Record<string, string> = {
    es: `Última actualización: marzo de 2025.

1. Objeto
SMARTUR es una plataforma para explorar destinos turísticos, recomendaciones y funciones de comunidad en la región de Las Altas Montañas, Veracruz.

2. Registro y cuenta
Al crear una cuenta confirmas que la información proporcionada es veraz. Eres responsable de mantener la confidencialidad de tu contraseña y de las actividades realizadas con tu cuenta.

3. Uso permitido
Te comprometes a utilizar el servicio de forma lícita, sin vulnerar derechos de terceros ni el funcionamiento de la plataforma.

4. Contenido y propiedad intelectual
Los contenidos de la plataforma (textos, diseño, marcas) están protegidos. No está permitida su reproducción no autorizada.

5. Datos personales
El tratamiento de tus datos personales se realiza conforme a la legislación aplicable. Al usar SMARTUR aceptas las prácticas descritas en la política de privacidad del servicio.

6. Modificaciones
Podemos actualizar estos términos. Los cambios relevantes se comunicarán por medios razonables; el uso continuado de la plataforma tras la actualización implica la aceptación de los nuevos términos.

7. Contacto
Para consultas sobre estos términos, utiliza los canales de soporte indicados en la plataforma o en el sitio web oficial.`,
    en: `Last updated: March 2025.

1. Purpose
SMARTUR is a platform to explore tourist destinations, recommendations, and community features in the Las Altas Montañas region, Veracruz.

2. Registration and account
By creating an account you confirm your information is accurate. You are responsible for keeping your password confidential and for activity under your account.

3. Permitted use
You agree to use the service lawfully, without infringing third-party rights or disrupting the platform.

4. Content and intellectual property
Platform content (text, design, trademarks) is protected. Unauthorized reproduction is not allowed.

5. Personal data
Processing of your personal data complies with applicable law. By using SMARTUR you accept the practices described in the service privacy policy.

6. Changes
We may update these terms. Material changes will be communicated by reasonable means; continued use after updates means you accept the new terms.

7. Contact
For questions about these terms, use the support channels provided in the platform or on the official website.`,
    fr: `Dernière mise à jour : mars 2025.

1. Objet
SMARTUR est une plateforme pour explorer des destinations touristiques, des recommandations et des fonctions communautaires dans la région de Las Altas Montañas, Veracruz.

2. Inscription et compte
En créant un compte, vous confirmez que vos informations sont exactes. Vous êtes responsable de la confidentialité de votre mot de passe et des activités sous votre compte.

3. Utilisation autorisée
Vous vous engagez à utiliser le service de manière licite, sans porter atteinte aux droits de tiers ni au fonctionnement de la plateforme.

4. Contenu et propriété intellectuelle
Les contenus de la plateforme (textes, design, marques) sont protégés. Toute reproduction non autorisée est interdite.

5. Données personnelles
Le traitement de vos données personnelles est conforme à la législation applicable. En utilisant SMARTUR, vous acceptez les pratiques décrites dans la politique de confidentialité du service.

6. Modifications
Nous pouvons mettre à jour ces conditions. Les changements importants seront communiqués par des moyens raisonnables ; l'utilisation continue après mise à jour vaut acceptation des nouvelles conditions.

7. Contact
Pour toute question sur ces conditions, utilisez les canaux d'assistance indiqués dans la plateforme ou sur le site officiel.`,
};

const PRIVACY_TEXT: Record<string, string> = {
    es: `Última actualización: marzo de 2025.

1. Responsable del tratamiento
SMARTUR es el responsable del tratamiento de tus datos personales.

2. Datos que recopilamos
Recopilamos los datos que proporcionas al registrarte (nombre, correo electrónico, foto de perfil opcional) y los datos generados al usar la plataforma (preferencias de viaje, historial de recomendaciones).

3. Finalidad del tratamiento
Tus datos se utilizan para personalizar recomendaciones turísticas, mejorar la plataforma y comunicarnos contigo sobre el servicio.

4. Base legal
El tratamiento se basa en tu consentimiento explícito al aceptar estos términos y en la ejecución del contrato de servicio.

5. Conservación de datos
Conservamos tus datos mientras mantengas tu cuenta activa. Puedes solicitar su eliminación en cualquier momento.

6. Derechos del usuario
Tienes derecho a acceder, rectificar, suprimir y portar tus datos personales. Para ejercerlos, contáctanos a través de los canales de soporte.

7. Seguridad
Aplicamos medidas técnicas y organizativas para proteger tus datos contra accesos no autorizados o pérdidas accidentales.

8. Contacto
Para consultas sobre privacidad, utiliza los canales de soporte indicados en la plataforma.`,
    en: `Last updated: March 2025.

1. Data controller
SMARTUR is the controller of your personal data.

2. Data we collect
We collect the data you provide when registering (name, email, optional profile photo) and data generated through platform use (travel preferences, recommendation history).

3. Purpose of processing
Your data is used to personalize travel recommendations, improve the platform, and communicate with you about the service.

4. Legal basis
Processing is based on your explicit consent when accepting these terms and on the performance of the service contract.

5. Data retention
We retain your data while your account is active. You may request deletion at any time.

6. User rights
You have the right to access, rectify, delete, and port your personal data. To exercise these rights, contact us through the support channels.

7. Security
We apply technical and organizational measures to protect your data against unauthorized access or accidental loss.

8. Contact
For privacy inquiries, use the support channels provided in the platform.`,
    fr: `Dernière mise à jour : mars 2025.

1. Responsable du traitement
SMARTUR est le responsable du traitement de vos données personnelles.

2. Données collectées
Nous collectons les données que vous fournissez lors de l'inscription (nom, e-mail, photo de profil optionnelle) et les données générées par l'utilisation de la plateforme (préférences de voyage, historique des recommandations).

3. Finalité du traitement
Vos données sont utilisées pour personnaliser les recommandations touristiques, améliorer la plateforme et communiquer avec vous sur le service.

4. Base légale
Le traitement est basé sur votre consentement explicite lors de l'acceptation de ces conditions et sur l'exécution du contrat de service.

5. Conservation des données
Nous conservons vos données tant que votre compte est actif. Vous pouvez demander leur suppression à tout moment.

6. Droits des utilisateurs
Vous avez le droit d'accéder, de rectifier, de supprimer et de porter vos données personnelles. Pour exercer ces droits, contactez-nous via les canaux d'assistance.

7. Sécurité
Nous appliquons des mesures techniques et organisationnelles pour protéger vos données contre les accès non autorisés ou les pertes accidentelles.

8. Contact
Pour toute question sur la confidentialité, utilisez les canaux d'assistance indiqués sur la plateforme.`,
};

const TITLES: Record<string, Record<ModalType, string>> = {
    es: { terms: 'Términos y Condiciones', privacy: 'Política de Privacidad' },
    en: { terms: 'Terms and Conditions', privacy: 'Privacy Policy' },
    fr: { terms: 'Conditions d\'utilisation', privacy: 'Politique de confidentialité' },
};

const CLOSE_LABELS: Record<string, string> = {
    es: 'Entendido',
    en: 'Got it',
    fr: 'Compris',
};

interface TermsModalProps {
    type: ModalType;
    onClose: () => void;
}

export function TermsModal({ type, onClose }: TermsModalProps) {
    useEscapeKey(onClose);
    const { lang, t } = useLanguage();
    const safeLang = lang in TITLES ? lang : 'es';
    const title = TITLES[safeLang][type];
    const body = type === 'terms' ? TERMS_TEXT[safeLang] : PRIVACY_TEXT[safeLang];
    const closeLabel = CLOSE_LABELS[safeLang] ?? 'Cerrar';

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
                className="relative flex w-full max-w-lg flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-2xl"
                style={{ maxHeight: '80vh' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
                    <h2 className="text-base font-semibold text-[var(--color-text)]">{title}</h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-[var(--color-text-alt)] transition-colors hover:bg-[rgba(var(--rgb-text),0.06)] hover:text-[var(--color-text)]"
                        aria-label={t('auth.terms.closeAriaLabel')}
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text-alt)]">{body}</p>
                </div>

                {/* Footer */}
                <div className="border-t border-[var(--color-border)] px-5 py-3">
                    <button
                        onClick={onClose}
                        className="w-full rounded-lg bg-[var(--color-purple)] py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    >
                        {closeLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
