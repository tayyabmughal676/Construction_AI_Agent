import { Elysia } from 'elysia';
import fs from 'fs';
import path from 'path';

export const filesRouter = new Elysia({ prefix: '/files' })
  .get('/:type/:filename', async (c) => {
    const { type, filename } = c.params;
    const safeType = type.replace(/[^a-zA-Z0-9_-]/g, '');
    const safeFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '');
    const filePath = path.join(process.cwd(), 'generated', safeType, safeFilename);

    if (!fs.existsSync(filePath)) {
      c.set.status = 404;
      return { error: 'File not found' };
    }

    const file = Bun.file(filePath);
    return new Response(file, {
      headers: {
        'Content-Type': safeFilename.endsWith('.pdf')
          ? 'application/pdf'
          : safeFilename.endsWith('.csv')
          ? 'text/csv'
          : safeFilename.endsWith('.xlsx')
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
      },
    });
  });

export default filesRouter;
