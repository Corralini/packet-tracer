import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaticMaskComponent } from './static-mask.component';

describe('StaticMaskComponent', () => {
  let component: StaticMaskComponent;
  let fixture: ComponentFixture<StaticMaskComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StaticMaskComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StaticMaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
