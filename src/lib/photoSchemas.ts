import { z } from 'zod';

export const photoFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= 10 * 1024 * 1024, {
    message: 'Súbor je príliš veľký. Maximálna veľkosť je 10MB.',
  })
  .refine((file) => file.type.startsWith('image/'), {
    message: 'Neplatný formát súboru. Nahrajte obrázok.',
  });

export const optionalPhotoFileSchema = photoFileSchema.optional();
