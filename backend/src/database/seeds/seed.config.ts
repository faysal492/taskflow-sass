import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

export class SeederConfig {
  static async getDataSource(): Promise<DataSource> {
    const configService = new ConfigService();
    
    return new DataSource({
      type: 'postgres',
      host: configService.get('DATABASE_HOST'),
      port: configService.get('DATABASE_PORT'),
      username: configService.get('DATABASE_USERNAME'),
      password: configService.get('DATABASE_PASSWORD'),
      database: configService.get('DATABASE_NAME'),
      entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      synchronize: false,
    });
  }
}