import { TestBed } from '@angular/core/testing';

import { NavService } from './nav.service';

import * as MOCKDB from '../models/MockDB';

describe('NavService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NavService = TestBed.get(NavService);
    expect(service).toBeTruthy();
  });

  it('should update parent for locations', async () => {
    const service: NavService = TestBed.get(NavService);
    service.setParent(MOCKDB.LOCATIONS[0]);

    await service.getParent().subscribe(val => expect(val).toBe(MOCKDB.LOCATIONS[0]));
  });

  it('should update parent for categories', async () => {
    const service: NavService = TestBed.get(NavService);
    service.setParent(MOCKDB.CATEGORIES[0]);

    await service.getParent().subscribe(val => expect(val).toBe(MOCKDB.CATEGORIES[0]));
  });

  it('should forget parent', async () => {
    const service: NavService = TestBed.get(NavService);
    service.setParent(MOCKDB.LOCATIONS[0]);

    service.forgetParent();

    await service.getParent().subscribe(val => expect(val).toBeNull());
  });

  it('should register and emit return clicks', async () => {
    const service: NavService = TestBed.get(NavService);

    await service.getReturnState().subscribe(val => expect(val).toBeTruthy());

    service.returnState();
  })

  it('should set search type', async() => {
    const service: NavService = TestBed.get(NavService);

    await service.getSearchType().subscribe(val => expect(val).toBe('TYPE'));

    service.setSearchType('TYPE');
  });

  it('should reset search type', async () => {
    const service: NavService = TestBed.get(NavService);

    await service.getSearchType().subscribe(val => expect(val).toBe(''));

    service.forgetSearchType();
  });
});
