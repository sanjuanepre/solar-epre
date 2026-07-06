export declare class MailService {
    private transporter;
    constructor();
    sendEmail(to: string, subject: string, htmlContent: string, file?: Express.Multer.File): Promise<void>;
}
