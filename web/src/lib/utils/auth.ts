export function extractBasicAuthUsername(authorizationHeader: string | null): string | null {
  if (!authorizationHeader || !authorizationHeader.startsWith("Basic ")) {
    return null;
  }

  const encoded = authorizationHeader.slice(6).trim();
  if (!encoded) {
    return null;
  }

  try {
    const decoded = atob(encoded);
    const separator = decoded.indexOf(":");
    if (separator < 0) {
      return null;
    }

    const username = decoded.slice(0, separator);
    return username || null;
  } catch {
    return null;
  }
}
