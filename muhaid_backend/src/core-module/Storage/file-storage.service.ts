import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IMAGE_TYPES, type ImageExt } from './image-upload.js';

// Files live under UPLOAD_DIR; callers pass paths relative to it, and those
// relative paths are what the database stores.
@Injectable()
export class FileStorageService {
  private readonly root: string;

  constructor(config: ConfigService) {
    this.root = resolve(config.get<string>('UPLOAD_DIR', 'uploads'));
  }

  // {projectCode}_{userId}. The project code, not the name: names are Arabic
  // free text with spaces, the code is unique and short.
  folderFor(projectCode: string, userId: string): string {
    return `${projectCode.replace(/[^A-Za-z0-9_-]/g, '-')}_${userId}`;
  }

  absolutePath(relPath: string): string {
    const abs = resolve(this.root, relPath);
    if (!abs.startsWith(this.root + sep)) {
      throw new Error(`Path escapes the upload directory: ${relPath}`);
    }
    return abs;
  }

  // Write to a temp file then rename, so a crash never leaves a half-written file.
  async save(relPath: string, data: Buffer): Promise<void> {
    const abs = this.absolutePath(relPath);
    await mkdir(dirname(abs), { recursive: true });
    const tmp = `${abs}.tmp-${randomUUID()}`;
    try {
      await writeFile(tmp, data);
      await rename(tmp, abs);
    } catch (err) {
      await rm(tmp, { force: true });
      throw err;
    }
  }

  async remove(relPath: string): Promise<void> {
    await rm(this.absolutePath(relPath), { force: true });
  }

  async stream(relPath: string): Promise<StreamableFile> {
    const abs = this.absolutePath(relPath);
    const info = await stat(abs).catch(() => null);
    if (!info?.isFile()) throw new NotFoundException('File not found');
    const ext = extname(abs).slice(1) as ImageExt;
    return new StreamableFile(createReadStream(abs), {
      type: IMAGE_TYPES[ext] ?? 'application/octet-stream',
      length: info.size,
      disposition: 'inline',
    });
  }
}
