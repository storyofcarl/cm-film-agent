import { signedMediaUrl, storeKeyFromUrl } from './mediaStore';

// Provider requests cannot carry the user's Supabase session. Resolve protected
// references under the authenticated request, then grant temporary read access.
export const providerMediaUrl = async (value) => {
  if (typeof value !== 'string') return value;
  const key = storeKeyFromUrl(value);
  return key ? signedMediaUrl(key) : value;
};

export const providerMediaReferences = async (value) => Array.isArray(value)
  ? Promise.all(value.map(providerMediaUrl))
  : providerMediaUrl(value);
