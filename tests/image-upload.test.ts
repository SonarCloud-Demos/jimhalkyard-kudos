import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Hono } from 'hono';
import kudosRoutes from '../src/routes/kudos.routes';
import feedbackRoutes from '../src/routes/feedback.routes';
import { generateToken } from '../src/services/auth.service';
import { AppError } from '../src/utils/errors';
import { MAX_IMAGE_BYTES, detectImageExtension } from '../src/services/image.service';
import { createTestDatabase, seedTestUsers, closeTestDatabase } from './helpers/database.helper';

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01]);
const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const GIF_BYTES = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);

function filledImage(header: Uint8Array, totalBytes: number): Uint8Array {
  const bytes = new Uint8Array(totalBytes);
  bytes.set(header);
  return bytes;
}

describe('Image upload', () => {
  let uploadDir: string;
  let previousUploadDir: string | undefined;
  let app: Hono;
  let employeeCookie: string;
  let otherEmployeeCookie: string;
  let managerCookie: string;
  let recipientId: number;

  async function cookieFor(user: any): Promise<string> {
    const token = await generateToken({
      userId: user.id,
      role: user.role,
      department: user.department,
    });
    return `authToken=${token}`;
  }

  function post(path: string, cookie: string, form: FormData) {
    return app.request(path, { method: 'POST', headers: { Cookie: cookie }, body: form });
  }

  function kudosForm(image?: File): FormData {
    const form = new FormData();
    form.append('recipientId', String(recipientId));
    form.append('message', 'Great work!');
    if (image) {
      form.append('image', image);
    }
    return form;
  }

  function feedbackForm(visibility: string, image?: File): FormData {
    const form = new FormData();
    form.append('targetDepartment', 'Engineering');
    form.append('message', 'Feedback with a screenshot');
    form.append('isAnonymous', 'false');
    form.append('visibility', visibility);
    if (image) {
      form.append('image', image);
    }
    return form;
  }

  beforeAll(async () => {
    previousUploadDir = process.env.UPLOAD_DIR;
    uploadDir = mkdtempSync(join(tmpdir(), 'kudos-uploads-'));
    process.env.UPLOAD_DIR = uploadDir;

    createTestDatabase();
    const users: any = await seedTestUsers();
    recipientId = users.manager.id;
    employeeCookie = await cookieFor(users.employee);
    otherEmployeeCookie = await cookieFor(users.employeeMarketing);
    managerCookie = await cookieFor(users.manager);

    app = new Hono();
    app.route('/api/kudos', kudosRoutes);
    app.route('/api/feedback', feedbackRoutes);
    app.onError((err, c) => {
      if (err instanceof AppError) {
        return c.json({ success: false, error: err.message }, err.statusCode);
      }
      return c.json({ success: false, error: 'Internal server error' }, 500);
    });
  });

  afterAll(() => {
    closeTestDatabase();
    rmSync(uploadDir, { recursive: true, force: true });
    if (previousUploadDir === undefined) {
      delete process.env.UPLOAD_DIR;
    } else {
      process.env.UPLOAD_DIR = previousUploadDir;
    }
  });

  describe('detectImageExtension', () => {
    test('recognises PNG and JPEG signatures only', () => {
      expect(detectImageExtension(PNG_BYTES)).toBe('png');
      expect(detectImageExtension(JPEG_BYTES)).toBe('jpg');
      expect(detectImageExtension(GIF_BYTES)).toBeNull();
      expect(detectImageExtension(new Uint8Array())).toBeNull();
    });
  });

  describe('kudos', () => {
    test('still accepts JSON submissions without an image', async () => {
      const response = await app.request('/api/kudos', {
        method: 'POST',
        headers: { Cookie: employeeCookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId, message: 'JSON kudos' }),
      });

      expect(response.status).toBe(200);
      expect((await response.json()).kudos.image_path).toBeNull();
    });

    test('stores a PNG on disk and serves it back', async () => {
      const response = await post(
        '/api/kudos',
        employeeCookie,
        kudosForm(new File([PNG_BYTES], 'photo.png', { type: 'image/png' }))
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.kudos.image_path).toMatch(/\.png$/);
      expect(existsSync(join(uploadDir, body.kudos.image_path))).toBe(true);

      const imageResponse = await app.request(`/api/kudos/${body.kudos.id}/image`, {
        headers: { Cookie: otherEmployeeCookie },
      });

      expect(imageResponse.status).toBe(200);
      expect(imageResponse.headers.get('Content-Type')).toBe('image/png');
      expect(imageResponse.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(new Uint8Array(await imageResponse.arrayBuffer())).toEqual(PNG_BYTES);
    });

    test('stores a JPEG and ignores the client-supplied file name', async () => {
      const response = await post(
        '/api/kudos',
        employeeCookie,
        kudosForm(new File([JPEG_BYTES], '../../evil.png', { type: 'image/jpeg' }))
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.kudos.image_path).toMatch(/^[0-9a-f-]{36}\.jpg$/);
    });

    test('rejects a GIF', async () => {
      const response = await post(
        '/api/kudos',
        employeeCookie,
        kudosForm(new File([GIF_BYTES], 'anim.gif', { type: 'image/gif' }))
      );

      expect(response.status).toBe(400);
      expect((await response.json()).error).toBe('Only PNG and JPG images are allowed');
    });

    test('rejects a non-image renamed to .png', async () => {
      const response = await post(
        '/api/kudos',
        employeeCookie,
        kudosForm(new File(['<script>alert(1)</script>'], 'x.png', { type: 'image/png' }))
      );

      expect(response.status).toBe(400);
    });

    test('rejects an image larger than 2MB', async () => {
      const tooBig = filledImage(PNG_BYTES, MAX_IMAGE_BYTES + 1);
      const response = await post(
        '/api/kudos',
        employeeCookie,
        kudosForm(new File([tooBig], 'big.png', { type: 'image/png' }))
      );

      expect(response.status).toBe(400);
      expect((await response.json()).error).toBe('Image must not exceed 2MB');
    });

    test('accepts an image of exactly 2MB', async () => {
      const exact = filledImage(PNG_BYTES, MAX_IMAGE_BYTES);
      const response = await post(
        '/api/kudos',
        employeeCookie,
        kudosForm(new File([exact], 'exact.png', { type: 'image/png' }))
      );

      expect(response.status).toBe(200);
    });

    test('rejects a request body far above the limit with 413', async () => {
      const huge = filledImage(PNG_BYTES, MAX_IMAGE_BYTES * 2);
      const response = await post(
        '/api/kudos',
        employeeCookie,
        kudosForm(new File([huge], 'huge.png', { type: 'image/png' }))
      );

      expect(response.status).toBe(413);
    });

    test('removes the stored file when the kudos cannot be created', async () => {
      const before = readdirSync(uploadDir).length;
      const form = kudosForm(new File([PNG_BYTES], 'photo.png', { type: 'image/png' }));
      form.set('recipientId', '99999');

      const response = await post('/api/kudos', employeeCookie, form);

      expect(response.status).toBe(404);
      expect(readdirSync(uploadDir)).toHaveLength(before);
    });

    test('returns 404 for kudos without an image', async () => {
      const created = await app.request('/api/kudos', {
        method: 'POST',
        headers: { Cookie: employeeCookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId, message: 'No image here' }),
      });
      const id = (await created.json()).kudos.id;

      const response = await app.request(`/api/kudos/${id}/image`, {
        headers: { Cookie: employeeCookie },
      });

      expect(response.status).toBe(404);
    });

    test('requires authentication to view an image', async () => {
      const response = await app.request('/api/kudos/1/image');
      expect(response.status).toBe(401);
    });
  });

  describe('feedback', () => {
    test('HR_ONLY feedback image is hidden from employees but visible to HR', async () => {
      const response = await post(
        '/api/feedback',
        employeeCookie,
        feedbackForm('HR_ONLY', new File([PNG_BYTES], 'shot.png', { type: 'image/png' }))
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.feedback.image_path).toMatch(/\.png$/);

      const denied = await app.request(`/api/feedback/${body.feedback.id}/image`, {
        headers: { Cookie: otherEmployeeCookie },
      });
      expect(denied.status).toBe(403);

      const hrToken = await generateToken({
        userId: 3,
        role: 'HR_ADMIN',
        department: 'Human Resources',
      });
      const allowed = await app.request(`/api/feedback/${body.feedback.id}/image`, {
        headers: { Cookie: `authToken=${hrToken}` },
      });
      expect(allowed.status).toBe(200);
    });

    test('PUBLIC feedback image is visible to a manager', async () => {
      const response = await post(
        '/api/feedback',
        employeeCookie,
        feedbackForm('PUBLIC', new File([JPEG_BYTES], 'shot.jpg', { type: 'image/jpeg' }))
      );
      const id = (await response.json()).feedback.id;

      const imageResponse = await app.request(`/api/feedback/${id}/image`, {
        headers: { Cookie: managerCookie },
      });

      expect(imageResponse.status).toBe(200);
      expect(imageResponse.headers.get('Content-Type')).toBe('image/jpeg');
    });

    test('rejects a GIF on feedback', async () => {
      const response = await post(
        '/api/feedback',
        employeeCookie,
        feedbackForm('PUBLIC', new File([GIF_BYTES], 'anim.gif', { type: 'image/gif' }))
      );

      expect(response.status).toBe(400);
    });

    test('still accepts JSON submissions without an image', async () => {
      const response = await app.request('/api/feedback', {
        method: 'POST',
        headers: { Cookie: employeeCookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetDepartment: 'Engineering',
          message: 'Plain feedback',
          isAnonymous: false,
          visibility: 'PUBLIC',
        }),
      });

      expect(response.status).toBe(200);
    });
  });
});
