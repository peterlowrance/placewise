import {SearchInterfaceService} from './search-interface.service';

import {Injectable} from '@angular/core';
import {HttpHeaders} from '@angular/common/http';
import {Observable, of, observable} from 'rxjs';

import {Item} from '../models/Item';
import {HierarchyItem} from '../models/HierarchyItem';
import {AngularFirestore} from '@angular/fire/firestore';
import {map, first} from 'rxjs/operators';
import {AuthService} from './auth.service';
import {ImageService} from './image.service';
import { HierarchyObject } from '../models/HierarchyObject';
import { Category } from '../models/Category';
import { HierarchyLocation } from '../models/Location';
import { ContentObserver } from '@angular/cdk/observers';
import { CacheService } from './cache.service';
import { time } from 'console';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  })
};

@Injectable({
  providedIn: 'root'
})

export class SearchService implements SearchInterfaceService {

  locations: HierarchyItem[];
  categories: Category[];

  // /**
  //  * Finds all the ancestors of an item and returns them in a 2D array.
  //  * The first dimension of the array are arrays of ancestors, the second dimension is each individual ancestor.
  //  * @param id item to find ancestors of
  //  */
  // getAncestorsOfItem(id: string): Observable<HierarchyItem[][]> {
  //   return new Observable(obs => {
  //     this.getAllLocations().subscribe(locs => {
  //       obs.next(this.getAncestors(id, locs));
  //       obs.complete();
  //     });
  //   });
  // }

  /**
   * Returns the ancestors from IDs of whichever type you are searching by.
   * @param parents the parent or parents of what something is located in
   * @param locations array of hierarchy items to find ancestors out of
   */
  getAncestors(parentIDs: string[], hierItems: HierarchyItem[]): HierarchyItem[][] {
    const result: HierarchyItem[][] = [];
    // Find all parents of items and add an array for each parent
    for(const parentID of parentIDs){
      for(const firstParent of hierItems) {
        if (firstParent.ID === parentID) {
          const ancestors: HierarchyItem[] = [firstParent];
          result.push(ancestors);
          // Find all parents in this ancestor list
          // While the last parent of the last array of ancestors is not the root
          while (result[result.length - 1][result[result.length - 1].length - 1].ID !== 'root') {
            let not_found_error = true; // Prevent infinite loop

            for (const nextParent of hierItems) {
              // If the item has the same ID as the parent of the last item in the ancestor list, add it
              if (nextParent.ID === result[result.length - 1][result[result.length - 1].length - 1].parent) {
                result[result.length - 1].push(nextParent);
                not_found_error = false;
                break;
              }
            }

            if(not_found_error){
              console.log("ERROR! Categories improperly loaded.");
              console.log(result[result.length - 1][result[result.length - 1].length - 1].ID);
              // NOTE: this has popped up with a location ID before!
              break;
            }
          }
        }
      }
    }
    
    return result;
  }

  /**
   * A general ancestor call for any type of thing in a hierarchy (item, category, location)
   * The first dimension of the array are arrays of ancestors (multiple when getting mutliple locations from an item),
   * The second dimension is each individual ancestor.
   * @param id item to find ancestors of
   */
  getAncestorsOf(item: HierarchyObject): Observable<HierarchyItem[][]> {
    
    return new Observable(obs => {
    if(item.type === "item"){
        this.getAllLocations().subscribe(locs => {
          obs.next(this.getAncestors((item as Item).locations, locs));
          obs.complete();
        });
    }
    else {
        let hierItem = item as HierarchyItem;
        if(hierItem.type === 'category'){
          this.getAllCategories().subscribe(categories =>
            {
              console.log("RECV ALL CATS");
              obs.next(this.getAncestors([hierItem.parent], categories));

              if(categories.length > 1){  // Finish when we have all the data (It always has at least a length of one ??)
                obs.complete();
              }
            })
        } else {
          this.getAllLocations().subscribe(locations =>
            {
              obs.next(this.getAncestors([hierItem.parent], locations));
              
              if(locations.length > 1){  // Finish when we have all the data (It always has at least a length of one ??)
                obs.complete();
              }
            })
        }
      }
    });
  }

  // TESTING METHOD
  // INCLUDES PARENT
  getAncestorsByChain(ID: string, type: string): Promise<HierarchyItem[]> {
    return new Promise<HierarchyItem[]>( async resolve => {
      let results: HierarchyItem[] = [];
      let nextID = ID;
      let finished = false;
      let typeURL = type === 'category' ? 'Category' : 'Locations';

      while(!finished){
        let location = (await this.afs.doc('/Workspaces/' + this.auth.workspace.id + '/' + typeURL + '/' + nextID).get().toPromise()).data() as HierarchyLocation;
        location.ID = nextID;
        results.push(location);
        
        if(location.parent){
          nextID = location.parent;
        }
        else {
          finished = true;
        }
      }

      resolve(results);
    })
  }

  /**
   * Returns the hierarchy items that immediately descend from a node
   * @param rootID the node to find the descendants of
   * @param isCategory category or location
   */
  getDescendantsOfRoot(rootID: string, isCategory: boolean): Observable<HierarchyItem[]> {
    const result: HierarchyItem[] = [];
    const appropriateHierarchyItems: Observable<HierarchyItem[]> = isCategory ? this.getAllCategories() : this.getAllLocations();
    return new Observable(obs => {
      appropriateHierarchyItems.subscribe(hierarchyItems => {
        hierarchyItems.forEach(cat => {
          if (cat.parent === rootID && result.filter(x => x.ID === cat.ID).length === 0) {
            result.push(cat);
          }
        });
        result.sort(function(a, b) {
          var nameA = a.name.toUpperCase(); // ignore upper and lowercase
          var nameB = b.name.toUpperCase(); // ignore upper and lowercase
          if (nameA < nameB) {
            return -1;
          }
          if (nameA > nameB) {
            return 1;
          }
        
          // names must be equal
          return 0;
        });
        obs.next(result);
        obs.complete();
      });
    });
  }

  getItem(id: string): Observable<Item> {
    return this.afs.doc<Item>('/Workspaces/' + this.auth.workspace.id + '/Items/' + id).snapshotChanges().pipe(map(a => {
      const data = a.payload.data() as Item;
      if (!data) {
        return;
      }
      data.ID = a.payload.id;
      data.type = "item";
      return data;
    }));
  }

  getLocation(id: string, confirm: string = "normal human"): Observable<HierarchyLocation> {
    if (!id || id === 'none') {
      return of(null);
    }
    return this.afs.doc<HierarchyLocation>('/Workspaces/' + this.auth.workspace.id + '/Locations/' + id).snapshotChanges().pipe(map(a => {
      const data = a.payload.data() as HierarchyLocation;
      if(data){
        data.ID = a.payload.id;
        if (data.imageUrl == null) {
          data.imageUrl = '../../../assets/notFound.png';
        }
        data.type = "location";
        return data;
      }
      else {
        return null;
      }
    }));
  }

  getCategory(id: string): Observable<Category> {
    if (!id) {
      return of(null);
    }
    return this.afs.doc<Category>('/Workspaces/' + this.auth.workspace.id + '/Category/' + id).snapshotChanges().pipe(map(a => {
      const data = a.payload.data() as Category;
      if(data){
        data.ID = a.payload.id;
        if (data.imageUrl == null) {
          data.imageUrl = '../../../assets/notFound.png';
        }
        data.type = "category";
        return data;
      }
      else {
        return null;
      }
    }));
  }

  getAllItems(): Observable<Item[]> {
    return this.afs.collection<Item>('/Workspaces/' + this.auth.workspace.id + '/Items').snapshotChanges().pipe(map(a => {
      return a.map(g => {
          const data = g.payload.doc.data();
          data.ID = g.payload.doc.id;
          data.type = "item";
          return data;
        }
      );
    }));
  }

  /**
   * Find all descendant items of a hierarchy item
   * @param root the hierarchy item to find descendants of
   * @param allParents all the appropriate hierarchy items
   */
  getAllDescendantItems(root: HierarchyItem, allParents: HierarchyItem[]): Observable<Item[]> {
    if (root.ID === 'root') {
      return this.getAllItems();
    }
    // Make list of all children items
    const childrenItems: string[] = root.items ? JSON.parse(JSON.stringify(root.items)) : [];
    allParents.forEach(p => {
      if (p.items) {
        p.items.forEach(i => {
          if (!childrenItems.includes(i)) {
            childrenItems.push(i);
          }
        });
      }
    });
    const result: Item[] = [];
    return new Observable(obs => {
      // Find all items whose ID's are in the list of children items
      let honk = this.getAllItems().subscribe(items => {
        items.forEach(i => {
          if (childrenItems.includes(i.ID)) {
            result.push(i);
          }
        });
        obs.next(result);
        obs.complete(); // Dangerous if we don't close this - that's so much data to be subbed to
      },
      () => {
        obs.complete(); // Pretty sure this is never called
      });
    });
  }

  /**
   * Find all descendant hierarchy items of a hierarchy item
   * @param rootID hierarchy item to search for descendants of
   * @param isCategory category or location
   */
  getAllDescendantHierarchyItems(rootID: string, isCategory: boolean): Observable<HierarchyItem[]> {
    const result: HierarchyItem[] = [];
    const parents: string[] = [rootID];
    const appropriateHierarchyItems: Observable<HierarchyItem[]> = isCategory ? this.getAllCategories(true) : this.getAllLocations(true);
    if (rootID === 'root') {
      return appropriateHierarchyItems;
    }
    return new Observable(obs => {
      appropriateHierarchyItems.subscribe(hierarchyItems => {
        let added = true;
        while (added) {
          added = false;
          hierarchyItems.forEach(c => {
            // If the category has a parent in the parents list
            if (c.parent && parents.includes(c.parent) && !result.includes(c) && c.ID !== 'root') { // TODO make more efficient
              if (c.children && c.children.length !== 0) {
                added = true;
                parents.push(c.ID);
              }
              result.push(c);
            }
          });
        }
        obs.next(result);
        obs.complete();
      });
    });
  }

  getAllCategories(excludeRoot: boolean = false): Observable<Category[]> {
    return this.getAllHierarchy(excludeRoot, true);
  }

  getAllLocations(excludeRoot: boolean = false): Observable<HierarchyLocation[]> {
    return this.getAllHierarchy(excludeRoot, false);
  }

  private getAllHierarchy(excludeRoot: boolean, isCategory: boolean): Observable<HierarchyItem[]> {
    // TODO: proper caching and checking for updated version?
    const appropriateCache = isCategory ? this.categories : this.locations;
    // If the data is cached, return it
    if (appropriateCache) {
      return of(excludeRoot ? appropriateCache.filter(c => c.ID !== 'root') : appropriateCache);
    }

    return this.afs.collection<HierarchyItem>('/Workspaces/' + this.auth.workspace.id + (isCategory ? '/Category' : '/Locations'))
      .snapshotChanges().pipe(map(a => {
        const returnedHierarchy = a.map(g => {
          const data = isCategory ? (g.payload.doc.data() as Category) : (g.payload.doc.data() as HierarchyLocation);
          data.ID = g.payload.doc.id;
          if (data.imageUrl == null) {
            data.imageUrl = '../../../assets/notFound.png';
          }
          data.type = isCategory ? 'category' : 'location';
          return data;
        });

        return excludeRoot ? returnedHierarchy.filter(g => g.ID !== 'root') : returnedHierarchy;
      }));
  }

  buildAttributeSuffixFrom(item: Item, categoryAndAncestors: Category[], startingIndex = 0): string{

    // If there's no category, return empty string
    if(!categoryAndAncestors){
      return '';
    }

    // Start building attribute string
    let buildingString = '';

    // Go through each suffix piece in the category we're in
    if(categoryAndAncestors[startingIndex].suffixStructure){
      for(let suffix of categoryAndAncestors[startingIndex].suffixStructure){
        let id = suffix.attributeID;
  
        // If the piece points to the parent's suffix, build that piece out
        if(id === 'parent'){
          buildingString += suffix.beforeText + this.buildAttributeSuffixFrom(item, categoryAndAncestors, startingIndex + 1) + suffix.afterText;
        }
  
        // Otherwise, insert that suffix piece with the corresponding value
        else {
          for(let attr in item.attributes){
            if(item.attributes[attr].ID === id){
              if(item.attributes[attr].value){ // Don't insert anything if there's no value
                buildingString += suffix.beforeText + 
                  item.attributes[attr].value +
                  suffix.afterText;
              }
            }
          }
        }
      }
    }

    return buildingString;
  }

  numericAndAplhabeticalComparison(a: string, b: string): boolean {
    // Use the smaller length
    let maxLength = a.length > b.length ?  b.length  : a.length; 
    let aOffset = 0;
    let bOffset = 0;
    let aHasNumber = false;
    let bHasNumber = false;
    let aNumber = 0;
    let bNumber = 0;

    let nextA;
    let nextB;
    let isANumber = false;
    let isBNumber = false;

    for(let index = 0; index < maxLength; index+=1){

      if(aHasNumber && bHasNumber){
        nextA = a[index + aOffset];
        isANumber = nextA >= '0' || nextA <= '9';

        nextB = b[index + bOffset];
        isBNumber = nextB >= '0' || nextB <= '9';

        if(isANumber && isBNumber){
          if(aNumber === bNumber){
            continue;
          }
          else {
            return aNumber > bNumber;
          }
        }

        // NEXT: other possibilities
      }

      /*
      


      if both a and b have numbers
        if the next thing is not a number, direct compare chars from offset
          if equal, continue
        if the next thing is another number or is the end, compare the saved numbers
          if equal, continue

      if offset for a is zero
        if it is a number, count ahead (func)
          build number, tracking one number as we go
            if we hit a decimal, track another number
              if we hit another decimal or slash, back up to one 
            if we hit a slash, track another number for a fraction
              if we hit another slash or decimal, back up to one
            if we hit something else, save/calc the number, set offset
        otherwise
        
      if offset for b is zero
          if it is a number, count ahead
            ...
          if not
            if reee

      if both are offset, jump to the lowest number

      */
    }

    return false;
  }

  private scanAheadNumbers(str: string): {result: string[], index: number} {
    let result: string[] = [""];
    let resultIndex = 0; // I don't trust length - not sure if it's calculated each time
    let index = 0;

    for(; index < str.length; index+=1){
      let char = str[index];

      if(char === ' '){
        result.push("");
        resultIndex += 1;
      }
      else if ((char >= '0' && char <= '9') || char === '.' || char === '/' ) {
        result[resultIndex] += char;
      }
      else {
        break;
      }
    }

    console.log(result);

    return {result, index};
  }

  // This will also deal with 
  private isNumberGreater(a: string, b: string): boolean {
    let slashDetected = false;
    let decimalDetected = false;



    return false;

    /*
    let spaceDetected = false;
    let overrideElements = false; // For when there's a bunch of slashes or decimals and we're just going to ignore them
    let result = 0;
    let length = 0;
    let numberPiece: string[] = [''];
    let numberPieceIndex = 0;
    let char = '';

    for(let index; index < str.length; index += 1){
      char = str[index]; // For simplicity

      // If the next is a number, just add it to the current section of numbers
      if(char <= '9' && char >= '0'){
        numberPiece[numberPieceIndex] += char;
      }

      else if(char === '.'){
        if(!overrideElements){

          if(decimalDetected || slashDetected || spaceDetected){
            overrideElements = true;
          }
          else {
            // If there hasn't been a decimal yet, start a new number section for numbers after decimal
            decimalDetected = true;
            numberPiece.push('');
            numberPieceIndex += 1;
          }

        }
      }

      else if(char === '/'){
        if(!overrideElements){
          if(decimalDetected || slashDetected){ // We can ignore space here - for things like 1 1/2
            overrideElements = true;
          }
          else {
            // If there hasn't been a slash yet, start a new number section for numbers after slash
            decimalDetected = true;
            numberPiece.push('');
            numberPieceIndex += 1;
          }
        }
      }

      else if(char === ' '){
        if(!overrideElements){
          if(decimalDetected || slashDetected || spaceDetected){
            overrideElements = true;
          }
          else {
            // NEXT: wait what about things like "2.2 9.8" WAIT NO SPACES? EEEEE
          }
        }
      }
    }
    */
  }

  constructor(private afs: AngularFirestore, private auth: AuthService, private imageService: ImageService, private cacheService: CacheService) {
  }
}
