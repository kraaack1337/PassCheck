import {
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ValidationPipe,
} from '@nestjs/common';
import { LeaksService } from './leaks.service';
import { PrefixParamDto } from './dto/prefix.param.dto';

/**
 * LeaksController — прокси-контроллер к HaveIBeenPwned Range API.
 *
 * Реализует k-Anonymity проверку утечек паролей:
 * клиент отправляет только первые 5 символов SHA-1 хэша — сервер
 * никогда не получает ни пароль, ни полный хэш.
 *
 * Полный путь: GET /api/v1/leaks/:prefix
 */
@Controller('leaks')
export class LeaksController {
  constructor(private readonly leaksService: LeaksService) {}

  /**
   * GET /api/v1/leaks/:prefix
   *
   * Параметр :prefix — ровно 5 шестнадцатеричных символов.
   * Возвращает plain-text список суффиксов SHA-1 хэшей формата HIBP:
   *   SUFFIX1:COUNT\r\n
   *   SUFFIX2:COUNT\r\n
   *   ...
   *
   * Ответы:
   *   200 — данные получены (из кэша или от HIBP)
   *   400 — prefix не прошёл валидацию
   *   500 — HIBP API недоступен
   */
  @Get(':prefix')
  @HttpCode(HttpStatus.OK)
  // Возвращаем plain text — именно так отвечает HIBP, клиент парсит это сам
  @Header('Content-Type', 'text/plain; charset=utf-8')
  async getLeaks(
    @Param(
      new ValidationPipe({
        // Трансформируем plain-object в экземпляр DTO-класса
        transform: true,
        // Отбрасываем все поля, которых нет в DTO
        whitelist: true,
        // При ошибке сразу бросаем исключение (400)
        forbidNonWhitelisted: false,
      }),
    )
    params: PrefixParamDto,
  ): Promise<string> {
    return this.leaksService.getHashSuffixes(params.prefix);
  }
}
