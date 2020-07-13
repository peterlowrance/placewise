import {HierarchyItem} from './HierarchyItem';
import { Attribute } from './Attribute';

export interface Category extends HierarchyItem {

    attributes?: {[ID:string]: {[settingName:string]: any}};

}
