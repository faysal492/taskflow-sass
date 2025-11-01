import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './src/config/app.config';
import databaseConfig from './src/config/database.config';
import jwtConfig from './src/config/jwt.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig, databaseConfig, jwtConfig],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {}
