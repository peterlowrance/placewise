import { char } from "@zxing/library/esm/customTypings";

export interface PrintItem {
    ID: string;
    displayName: string;
    binID?: string;
    type: string;
    QRtext?: string;
}