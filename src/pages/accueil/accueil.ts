import { Component } from '@angular/core';  

import { Storage } from '@ionic/storage'
import { HttpClient } from '@angular/common/http'  

import { Observable } from 'rxjs/Observable'
import { ModalController } from 'ionic-angular';

import { modalConnexion } from '../connexion/modalConnexion'
import { modalEnregistrement } from '../enregistrement/modalEnregistrement';

@Component({
  selector: 'page-accueil',
  templateUrl: 'accueil.html'
})
export class AccueilPage {
  constructor(private storage: Storage, 
              private  http:HttpClient,
              public modalCtrl: ModalController) {

    //set a key/value
     this.storage.set('api', 'http://www.oritrail.fr/api/');

  }


  seconnecter() {
    let profileModal = this.modalCtrl.create(modalConnexion);
    profileModal.present();
  }

  sinscrire() {
    let profileModal = this.modalCtrl.create(modalEnregistrement);
    profileModal.present();
  }


 

}
