"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckInitService = void 0;
const common_1 = require("@nestjs/common");
let CheckInitService = class CheckInitService {
    constructor() {
        this.urlSheet = 'https://docs.google.com/spreadsheets/d/1F7ewXNxeSzydxFn3zBpCFhLXXK7QCcidzP6bClQa3AY/edit?gid=1632757415#gid=1632757415';
    }
    async isCalculadoraOnline(googleSheetClient, urlSheet) {
        try {
            const sheetId = this.extractSheetIdFromUrl(urlSheet ?? this.urlSheet);
            const response = await googleSheetClient.spreadsheets.get({
                spreadsheetId: sheetId,
            });
            return response.status === 200;
        }
        catch (error) {
            console.error('Error al verificar la hoja de cálculo:', error.message);
            return false;
        }
    }
    extractSheetIdFromUrl(url) {
        const matches = url.match(/\/d\/([a-zA-Z0-9-_]+)\//);
        return matches ? matches[1] : '';
    }
};
exports.CheckInitService = CheckInitService;
exports.CheckInitService = CheckInitService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CheckInitService);
//# sourceMappingURL=check-init.service.js.map