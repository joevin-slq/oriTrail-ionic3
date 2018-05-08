import { NgModule } from '@angular/core'; 
import { IonicPageModule } from 'ionic-angular';

import { modalEnregistrement } from './modalEnregistrement';


@NgModule({
  declarations: [
    modalEnregistrement,
  ],
  imports: [
    IonicPageModule.forChild(modalEnregistrement),
  ],
  entryComponents: [
    modalEnregistrement,
  ]
})
export class modalEnregistrementModule {}