export interface JwtPayload {
  sub: string; // user id
  email: string;
  tenantId: string;
  role: string;
  iat?: number;
  exp?: number;
}