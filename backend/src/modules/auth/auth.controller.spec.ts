import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call AuthService.register and return its result', async () => {
      const dto: RegisterDto = {
        email: 'test@example.com',
        password: 'Test123!',
        firstName: 'John',
        lastName: 'Doe',
        subdomain: 'myorg',
        organizationName: 'My Organization',
      };

      const mockResponse: AuthResponseDto = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'ADMIN',
          tenantId: 't1',
        },
        tenant: {
          id: 't1',
          name: 'My Organization',
          subdomain: 'myorg',
        },
      };

      mockAuthService.register.mockResolvedValue(mockResponse);

      const result = await controller.register(dto);
      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('login', () => {
    it('should call AuthService.login and return its result', async () => {
      const dto: LoginDto = {
        email: 'test@example.com',
        password: 'Test123!',
      };

      const mockResponse: AuthResponseDto = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'ADMIN',
          tenantId: 't1',
        },
        tenant: {
          id: 't1',
          name: 'My Organization',
          subdomain: 'myorg',
        },
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      const result = await controller.login(dto);
      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('refreshToken', () => {
    it('should call AuthService.refreshToken and return its result', async () => {
      const refreshToken = 'some_refresh_token';

      const mockResponse: AuthResponseDto = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'ADMIN',
          tenantId: 't1',
        },
        tenant: {
          id: 't1',
          name: 'My Organization',
          subdomain: 'myorg',
        },
      };

      mockAuthService.refreshToken.mockResolvedValue(mockResponse);

      const result = await controller.refreshToken(refreshToken);
      expect(authService.refreshToken).toHaveBeenCalledWith(refreshToken);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getProfile', () => {
    it('should return the current user profile', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        role: 'ADMIN',
        tenantId: 't1',
        isActive: true,
        emailVerifiedAt: new Date(),
        lastLoginAt: new Date(),
      };

      const result = await controller.getProfile(mockUser as any);
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        fullName: mockUser.fullName,
        role: mockUser.role,
        tenantId: mockUser.tenantId,
        isActive: mockUser.isActive,
        emailVerifiedAt: mockUser.emailVerifiedAt,
        lastLoginAt: mockUser.lastLoginAt,
      });
    });
  });
});