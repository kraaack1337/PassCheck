import { Module } from '@nestjs/common';
import { LeaksController } from './leaks.controller';
import { LeaksService } from './leaks.service';

/**
 * LeaksModule — инкапсулирует всё, что связано с проверкой утечек.
 * Подключается в AppModule через imports[].
 */
@Module({
  controllers: [LeaksController],
  providers: [LeaksService],
})
export class LeaksModule {}
