import { Attribute } from "./Attribute";
import { ConditionalAttribute } from "./ConditionalAttribute";

export interface CategoryAttribute extends Attribute {
    type?: string;
    values?: string[];
    dependents?: ConditionalAttribute[];
}