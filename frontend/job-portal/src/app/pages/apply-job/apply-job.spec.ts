import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplyJob } from './apply-job';

describe('ApplyJob', () => {
  let component: ApplyJob;
  let fixture: ComponentFixture<ApplyJob>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplyJob]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApplyJob);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
