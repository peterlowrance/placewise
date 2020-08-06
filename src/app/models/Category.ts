import {HierarchyItem} from './HierarchyItem';
import { Attribute } from './Attribute';

export interface Category extends HierarchyItem {

    attributes?: {[ID:string]: {[settingName:string]: any}};
    prefix?: string;
    suffixStructure?: [{
        beforeText: string;
        attributeID: string;
        afterText: string;
    }];

}
