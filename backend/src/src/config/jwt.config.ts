import { registerAs } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export default registerAs('jwt', (): JwtModuleOptions => {
  const secret = process.env.JWT_SECRET ?? 'change_me_in_production';
  const expiresIn = process.env.JWT_EXPIRES_IN ?? '7d';
  const refreshSecret = process.env.JWT_REFRESH_SECRET ?? 'change_me_in_production';
  const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN ?? '30d';

  return {
    secret,
    signOptions: {
      // jwt libraries accept number (seconds) or string like '7d'
      expiresIn,
    },
    // expose refresh tokens config as additional fields if needed by your app
    // (JwtModuleOptions doesn't have refresh fields by default, but we include for app config)
    // @ts-ignore - allow custom fields for app-level config
    refresh: {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
    },
  } as unknown as JwtModuleOptions;
});