import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HierarchyObject } from '../models/HierarchyObject';
import { Item } from '../models/Item';
import { ITEMS } from '../models/MockDB';

interface HierarchyObjectCache {
  elements: HierarchyObject[];
  nextIndex: number;
}

/**
 * This service makes navigating more snappy by pre-loading a 
 * raw heirarchy objects into the UI to immediately start building from.
 * On nearly every page, we already subscribe to its related 
 * categories/locations/items/etc. so this takes of advantage of that.
 */

@Injectable({
  providedIn: 'root'
})
export class CacheService {

  constructor() {
    // Initialize caches
    this.cachedItems = {elements: [], nextIndex: 0};
    this.cachedLocations = {elements: [], nextIndex: 0};
    this.cachedCategories = {elements: [], nextIndex: 0};
   }

  MAX_CACHE = 32;

  cachedItems: HierarchyObjectCache;
  cachedLocations: HierarchyObjectCache;
  cachedCategories: HierarchyObjectCache;

  /**
   * Store any object we navigate to.
   */ 
  store(element: HierarchyObject){
    // Check if the element already exists
    if(this.get(element.ID, element.type)){
      return;
    }

    // Point to the correct cache based on element type
    let cache = this.getTypedCache(element.type);

    // If cache is full, replace oldest element
    if(cache.elements.length >= this.MAX_CACHE){
      cache.elements[cache.nextIndex] = element;
      cache.nextIndex += 1;

      if(cache.nextIndex >= this.MAX_CACHE){
        cache.nextIndex = 0;
      }
    }

    // Otherwise, add it to the array
    else {
      cache.elements.push(element);
    }
  }

  /**
   * Attempt to get an object we jsut navigated to.
   * @returns The element if found, NULL IF NOT!
   */
  get(ID: string, type: string): HierarchyObject {
    // Point to the correct cache based on element type
    let cache = this.getTypedCache(type);

    // If the cache is empty, return null
    if(!cache.elements){
      return null;
    }

    let index = cache.elements.findIndex(element => element.ID === ID);
    if(index > -1){
      console.log("cache hit: " + cache.elements[index].name)
      return cache.elements[index];
    }

    return null;
  }

  // Return the correct cache based on type
  private getTypedCache(type: string): HierarchyObjectCache {
    if(type === "item"){
      return this.cachedItems;
    }
    else if(type === "location"){
      return this.cachedLocations;
    }
    else if(type === "category"){
      return this.cachedCategories;
    }
    else {
      console.log("Error: No cache for type " + type);
      return null;
    }
  }
}
