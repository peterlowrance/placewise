import {HierarchyItem} from './HierarchyItem';
import { Attribute } from './Attributes/Attribute';
import { CategoryAttribute } from './Attributes/CategoryAttribute';

export interface Category extends HierarchyItem {

    attributes?: CategoryAttribute[];
    prefix?: string;
    suffixStructure?: [{ // TO BE KILLED
        beforeText: string;
        attributeID: string;
        afterText: string;
    }];
    suffixFormat?: [{
        type: string;
        data?: string;
    }];

}
