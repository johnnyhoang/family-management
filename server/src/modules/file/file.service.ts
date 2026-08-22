import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class FileService {
  private supabase: SupabaseClient;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL')!;
    const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!;
    this.bucketName = this.configService.get<string>('SUPABASE_STORAGE_BUCKET') || 'family-mgmt-assets';

    this.supabase = createClient(url, serviceRoleKey);
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'general'): Promise<string> {
    const fileName = `${folder}/${uuidv4()}${path.extname(file.originalname)}`;

    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: false });

    if (error) {
      throw new InternalServerErrorException('Error uploading file to Supabase Storage');
    }

    const { data } = this.supabase.storage.from(this.bucketName).getPublicUrl(fileName);
    return data.publicUrl;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const marker = `/object/public/${this.bucketName}/`;
      const idx = fileUrl.indexOf(marker);
      if (idx === -1) return;
      const fileName = fileUrl.slice(idx + marker.length);
      await this.supabase.storage.from(this.bucketName).remove([fileName]);
    } catch (error) {
      console.error('Error deleting file from Supabase Storage:', error);
    }
  }
}
