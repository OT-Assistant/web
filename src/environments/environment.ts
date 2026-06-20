export const environment = {
  production: true,
  get apiUrl() {
    return (window as any).config?.NG_APP_API_BASE_URL || 'https://ot-assistant-api.rasoulveisi.workers.dev/api/v1';
  },
  get clerkPublishableKey() {
    return (window as any).config?.NG_APP_CLERK_PUBLISHABLE_KEY || 'pk_test_c2V0dGxlZC1iYWRnZXItNjEuY2xlcmsuYWNjb3VudHMuZGV2JA';
  }
};
