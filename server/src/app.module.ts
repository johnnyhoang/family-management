import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { HeaderResolver, I18nModule } from 'nestjs-i18n';
import * as path from 'path';

console.log('APP_MODULE_FILE_LOADED');

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { FamilyModule } from './modules/family/family.module';
import { AssetModule } from './modules/asset/asset.module';
import { CategoryModule } from './modules/category/category.module';
import { ExpenseModule } from './modules/expense/expense.module';
import { NotificationModule } from './modules/notification/notification.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AdminModule } from './modules/admin/admin.module';
import { PermissionModule } from './modules/permission/permission.module';
import { FileModule } from './modules/file/file.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('DATABASE_URL');
        return {
          type: 'postgres',
          url: url || undefined,
          host: url ? undefined : configService.get<string>('DB_HOST'),
          port: url ? undefined : configService.get<number>('DB_PORT', 5432),
          username: url ? undefined : configService.get<string>('DB_USERNAME'),
          password: url ? undefined : configService.get<string>('DB_PASSWORD'),
          database: url ? undefined : configService.get<string>('DB_DATABASE'),
          autoLoadEntities: true,
          synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
          ssl: configService.get<string>('DB_SSL') === 'true' || !!url ? {
            rejectUnauthorized: false
          } : false,
        };
      },
    }),
    ...(process.env.REDIS_ENABLED === 'true' ? [
      BullModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          connection: {
            host: configService.get<string>('REDIS_HOST'),
            port: configService.get<number>('REDIS_PORT'),
          },
        }),
      }),
    ] : []),
    I18nModule.forRoot({
      fallbackLanguage: 'vi',
      loaderOptions: {
        path: (() => {
          const basePath = process.cwd();
          const isProd = process.env.NODE_ENV === 'production';
          // Vercel might have different CWD based on root settings
          const subDir = process.env.VERCEL ? '' : (basePath.endsWith('server') ? '' : 'server');
          const i18nPath = isProd ? 'dist/i18n' : 'src/i18n';
          const fullPath = path.join(basePath, subDir, i18nPath);
          console.log(`I18N_PATH_RESOLVED: ${fullPath}`);
          return fullPath;
        })(),
        watch: process.env.NODE_ENV !== 'production',
      },
      resolvers: [
        new HeaderResolver(['lang']),
      ],
    }),
    AuthModule,
    UserModule,
    FamilyModule,
    AssetModule,
    CategoryModule,
    ExpenseModule,
    NotificationModule,
    DashboardModule,
    AdminModule,
    PermissionModule,
    FileModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
