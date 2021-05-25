import {HierarchyItem} from './HierarchyItem';
import { CategoryAttribute } from './Attribute';

export interface Category extends HierarchyItem {

    attributes?: CategoryAttribute[];
    prefix?: string;
    titleFormat?: [{ // Soon will replace prefix
        type: string;
        data?: string;
    }];

}
