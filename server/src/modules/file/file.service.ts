import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class FileService {
  private storage: Storage;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    const keyJson = this.configService.get<string>('GCS_KEY_JSON');
    const keyFilename = this.configService.get<string>('GCS_KEY_FILE');
    const projectId = this.configService.get<string>('GCS_PROJECT_ID');

    const options: any = { projectId };
    
    if (keyJson) {
      try {
        options.credentials = JSON.parse(keyJson);
      } catch (e) {
        console.error('Failed to parse GCS_KEY_JSON:', e);
      }
    } else if (keyFilename) {
      options.keyFilename = keyFilename;
    }

    this.storage = new Storage(options);
    this.bucketName = this.configService.get<string>('GCS_BUCKET')!;
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'general'): Promise<string> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const fileName = `${folder}/${uuidv4()}${path.extname(file.originalname)}`;
      const blob = bucket.file(fileName);

      const blobStream = blob.createWriteStream({
        resumable: false,
        gzip: true,
      });

      return new Promise((resolve, reject) => {
        blobStream.on('error', (err) => reject(err));
        blobStream.on('finish', () => {
          const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
          resolve(publicUrl);
        });
        blobStream.end(file.buffer);
      });
    } catch (error) {
      throw new InternalServerErrorException('Error uploading file to GCS');
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const fileName = fileUrl.split(`${this.bucketName}/`)[1];
      if (fileName) {
        await this.storage.bucket(this.bucketName).file(fileName).delete();
      }
    } catch (error) {
      console.error('Error deleting file from GCS:', error);
    }
  }
}
