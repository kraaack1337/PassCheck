import { Matches } from 'class-validator';

/**
 * DTO для валидации параметра :prefix из URL.
 *
 * Правило: ровно 5 шестнадцатеричных символов (A-F, a-f, 0-9).
 * Это соответствует формату k-Anonymity API сервиса HaveIBeenPwned:
 * мы передаём только первые 5 символов SHA-1 хэша пароля — сам пароль
 * и полный хэш никогда не покидают клиент.
 */
export class PrefixParamDto {
  @Matches(/^[A-Fa-f0-9]{5}$/, {
    message:
      'prefix должен содержать ровно 5 шестнадцатеричных символов [A-Fa-f0-9]',
  })
  prefix: string;
}
