import { TestBed } from '@angular/core/testing';

import { MockAdminService } from './mock-admin.service';

describe('MockAdminService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MockAdminService = TestBed.get(MockAdminService);
    expect(service).toBeTruthy();
  });
});
