import { sheets_v4 } from 'googleapis';
export declare class CheckInitService {
    private readonly urlSheet;
    constructor();
    isCalculadoraOnline(googleSheetClient: sheets_v4.Sheets, urlSheet?: string): Promise<boolean>;
    private extractSheetIdFromUrl;
}
