import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {PublicRoutingModule} from './public-routing.module';
import {HomeComponent} from './components/home/home.component';
import {StaticMaskComponent} from './components/static-mask/static-mask.component';
import {ReactiveFormsModule} from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import { HeaderComponent } from './components/header/header.component';
import { PublicComponent } from './public.component';
import { FooterComponent } from './components/footer/footer.component';


@NgModule({
  declarations: [HomeComponent, StaticMaskComponent, HeaderComponent, PublicComponent, FooterComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgbModule,
    PublicRoutingModule
  ]
})
export class PublicModule {
}
