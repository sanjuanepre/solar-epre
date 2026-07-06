import { MailService } from './send-email.service';
export declare class SendEmailController {
    private readonly mailService;
    body: string;
    constructor(mailService: MailService);
    sendEmailWithAttachment(file: Express.Multer.File, email: string): Promise<{
        message: string;
    }>;
    sendEmailChangeCapacityInApi(newPanelCapacityW: number): Promise<void>;
    getCategory(): string;
    getPanelsCapacity(): string;
    getPanelsCount(): string;
    getCoordinates(): string;
    getUbication(): string;
}
