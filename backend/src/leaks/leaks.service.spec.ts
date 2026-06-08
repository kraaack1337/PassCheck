import { Test, TestingModule } from '@nestjs/testing';
import { LeaksService } from './leaks.service';
import { RedisService } from '../redis/redis.service';
import axios from 'axios';
import { InternalServerErrorException } from '@nestjs/common';

const mockAxiosInstance = {
  get: jest.fn(),
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() },
  },
};

jest.mock('axios', () => {
  const originalAxios = jest.requireActual('axios');
  return {
    __esModule: true,
    ...originalAxios,
    default: {
      ...originalAxios.default,
      create: jest.fn(() => mockAxiosInstance),
    },
    create: jest.fn(() => mockAxiosInstance),
  };
});

describe('LeaksService', () => {
  let service: LeaksService;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    redisService = {
      get: jest.fn(),
      set: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaksService,
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<LeaksService>(LeaksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return cached value if available', async () => {
    const prefix = '7A6B4';
    const cachedData = 'SUFFIX1:5\nSUFFIX2:10';
    redisService.get.mockResolvedValue(cachedData);

    const result = await service.getHashSuffixes(prefix);

    expect(result).toBe(cachedData);
    expect(redisService.get).toHaveBeenCalledWith(`hibp:${prefix}`);
    expect(mockAxiosInstance.get).not.toHaveBeenCalled();
  });

  it('should fetch from HIBP API if cache miss and cache the result', async () => {
    const prefix = '7A6B4';
    const apiData = 'SUFFIX1:5\nSUFFIX2:10';
    redisService.get.mockResolvedValue(null);
    mockAxiosInstance.get.mockResolvedValue({ data: apiData });

    const result = await service.getHashSuffixes(prefix);

    expect(result).toBe(apiData);
    expect(redisService.get).toHaveBeenCalledWith(`hibp:${prefix}`);
    expect(mockAxiosInstance.get).toHaveBeenCalledWith(
      `/${prefix}`
    );
    expect(redisService.set).toHaveBeenCalledWith(
      `hibp:${prefix}`,
      apiData,
      3600,
    );
  });

  it('should throw InternalServerErrorException if upstream API fails', async () => {
    const prefix = '7A6B4';
    redisService.get.mockResolvedValue(null);
    mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

    await expect(service.getHashSuffixes(prefix)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
