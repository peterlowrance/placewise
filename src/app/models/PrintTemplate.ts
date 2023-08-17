
export interface PrintTemplate {
    templateName: string;
    updated: string;

    format: string;
    width: number;
    height: number;
    margins: number;
    qrSize: number;
    fontSize?: number;
    linkToBin?: boolean;
    whatIsPrinted: string;
}