import { bodyLimit } from 'hono/body-limit';
import { MAX_UPLOAD_REQUEST_BYTES } from '../services/image.service';
import { AppError } from '../utils/errors';

const PAYLOAD_TOO_LARGE = 413;

export const limitUploadSize = bodyLimit({
  maxSize: MAX_UPLOAD_REQUEST_BYTES,
  onError: () => {
    throw new AppError(PAYLOAD_TOO_LARGE, 'Request too large. Images must not exceed 2MB');
  },
});
