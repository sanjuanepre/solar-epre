import { Module } from '@nestjs/common';
import { SendEmailController } from './send-email/send-email.controller';
import { MailService } from './send-email/send-email.service';

@Module({
  controllers: [SendEmailController],
  providers: [MailService]
})
export class GmailModule {}
