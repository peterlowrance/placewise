import { TestBed } from '@angular/core/testing';

import { AdminInterfaceService } from './admin-interface.service';

describe('AdminInterfaceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AdminInterfaceService = TestBed.get(AdminInterfaceService);
    expect(service).toBeTruthy();
  });
});
