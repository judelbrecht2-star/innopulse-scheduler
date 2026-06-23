export function oauthProviderStatus() {
  return {
    googleEnabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    microsoftEnabled: Boolean(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET),
    emailEnabled: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
  };
}
