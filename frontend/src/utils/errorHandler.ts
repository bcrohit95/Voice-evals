export function getErrorMessage(error: unknown): string {
  const e = error as { response?: { status: number; data?: { detail?: string } }; message?: string };
  if (e.response) {
    const { status, data } = e.response;
    const detail = data?.detail;
    if (status === 400) return detail || 'Invalid request. Check your input.';
    if (status === 401) return 'API key is missing or invalid.';
    if (status === 404) return detail || 'Resource not found.';
    if (status === 422) return 'Validation error — check your file format.';
    if (status >= 500)  return 'Server error. Check the backend logs.';
    return detail || `Request failed (${status})`;
  }
  if (!e.response && e.message?.includes('Network'))
    return 'Could not connect to the server — is it running on port 8000?';
  return e.message || 'An unknown error occurred.';
}
