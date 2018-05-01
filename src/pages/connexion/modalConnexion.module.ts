import { NgModule } from '@angular/core'; 
import { IonicPageModule } from 'ionic-angular';

import { modalConnexion } from './modalConnexion';


@NgModule({
  declarations: [
    modalConnexion,
  ],
  imports: [
    IonicPageModule.forChild(modalConnexion),
  ],
  entryComponents: [
    modalConnexion,
  ]
})
export class modalConnexionModule {}