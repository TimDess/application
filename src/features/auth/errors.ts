/** Translates Supabase Auth error codes into clear French messages that reveal nothing sensitive. */
const messages: Record<string, string> = {
  invalid_credentials: 'Email ou mot de passe incorrect.',
  email_not_confirmed:
    'Confirme ton adresse email avant de te connecter : le lien est dans ta boîte de réception.',
  weak_password:
    'Mot de passe trop faible : au moins 8 caractères, avec des lettres et des chiffres.',
  same_password: 'Choisis un mot de passe différent de l’actuel.',
  over_request_rate_limit: 'Trop de tentatives. Réessaie dans quelques minutes.',
  over_email_send_rate_limit: 'Trop d’emails envoyés. Réessaie dans quelques minutes.',
  otp_expired: 'Ce lien a expiré ou a déjà été utilisé. Demande-en un nouveau.',
  session_not_found: 'Ta session a expiré. Reconnecte-toi.',
  session_expired: 'Ta session a expiré. Reconnecte-toi.',
  reauthentication_needed: 'Pour ta sécurité, saisis ton mot de passe actuel.',
  signup_disabled: 'Les inscriptions sont temporairement fermées.',
  email_address_invalid: 'Cette adresse email n’est pas acceptée.',
  captcha_failed: 'La vérification anti-robot a échoué. Réessaie.',
  anonymous_provider_disabled: 'Le mode invité est momentanément indisponible. Crée un compte.',
  over_anonymous_sign_in_rate_limit: 'Trop d’essais depuis ta connexion. Réessaie dans une heure.',
  email_exists: 'Cette adresse a déjà un compte. Utilise une autre adresse.',
}

export const genericAuthError = 'Une erreur est survenue. Réessaie dans un instant.'

export function authErrorMessage(code: string | undefined | null): string {
  return (code && messages[code]) || genericAuthError
}
