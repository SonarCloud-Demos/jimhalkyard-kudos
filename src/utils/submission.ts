import type { Context } from 'hono';
import { ValidationError } from './errors';

export interface SubmissionBody {
  fields: Record<string, unknown>;
  image: File | null;
}

/**
 * Reads a submission sent either as JSON (no image) or as multipart form data
 * (optional "image" file). Multipart field values are strings.
 */
export async function parseSubmissionBody(c: Context): Promise<SubmissionBody> {
  const contentType = c.req.header('content-type') ?? '';

  if (!contentType.includes('multipart/form-data')) {
    const json = await c.req.json();
    if (json === null || typeof json !== 'object' || Array.isArray(json)) {
      throw new ValidationError('Request body must be a JSON object');
    }
    return { fields: json as Record<string, unknown>, image: null };
  }

  const { image, ...fields } = await c.req.parseBody();

  if (image === undefined || (image instanceof File && image.size === 0)) {
    return { fields, image: null };
  }

  if (!(image instanceof File)) {
    throw new ValidationError('Image must be uploaded as a file');
  }

  return { fields, image };
}
