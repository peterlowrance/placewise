import { TestBed } from '@angular/core/testing';

import { SearchInterfaceService } from './search-interface.service';

describe('SearchInterfaceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SearchInterfaceService = TestBed.get(SearchInterfaceService);
    expect(service).toBeTruthy();
  });
});
