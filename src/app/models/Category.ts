import {HierarchyItem} from './HierarchyItem';
import { CategoryAttribute } from './Attribute';

export interface Category extends HierarchyItem {

    attributes?: CategoryAttribute[];
    prefix?: string;
    suffixFormat?: [{
        type: string;
        data?: string;
    }];

}
