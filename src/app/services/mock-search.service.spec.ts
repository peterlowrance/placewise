import { TestBed } from '@angular/core/testing';

import { MockSearchService } from './mock-search.service';

describe('MockSearchService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MockSearchService = TestBed.get(MockSearchService);
    expect(service).toBeTruthy();
  });
});
