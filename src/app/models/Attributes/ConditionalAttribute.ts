import { CategoryAttribute } from "./CategoryAttribute";

export interface ConditionalAttribute extends CategoryAttribute {
    condition: string;
}