import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeekerDashboard } from './seeker-dashboard';

describe('SeekerDashboard', () => {
  let component: SeekerDashboard;
  let fixture: ComponentFixture<SeekerDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeekerDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeekerDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
