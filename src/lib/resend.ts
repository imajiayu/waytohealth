import 'server-only';
import { Resend } from 'resend';

export {
  FROM_DISPLAY_NAME,
  FROM_DOMAIN,
  FROM_PREFIXES,
  DEFAULT_FROM_PREFIX,
  PREFIX_RE,
  isFromPrefix,
  isValidPrefixFormat,
  buildFromAddress,
  type FromPrefix,
} from './emailFrom';

let cached: Resend | null = null;

export function getResend(): Resend {
  if (!cached) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error('RESEND_API_KEY is not set');
    }
    cached = new Resend(key);
  }
  return cached;
}
