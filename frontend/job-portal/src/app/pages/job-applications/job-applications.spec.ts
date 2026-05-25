import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobApplications } from './job-applications';

describe('JobApplications', () => {
  let component: JobApplications;
  let fixture: ComponentFixture<JobApplications>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobApplications]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobApplications);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
