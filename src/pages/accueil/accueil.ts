import { Component } from "@angular/core";

import { Storage } from "@ionic/storage";
import { HttpClient } from "@angular/common/http";

import { Observable } from "rxjs/Observable";
import { ModalController, NavController } from "ionic-angular";

import { modalConnexion } from "../connexion/modalConnexion";
import { modalEnregistrement } from "../enregistrement/modalEnregistrement";
import { scanManager } from "../scanManager/scanManager";

@Component({
  selector: "page-accueil",
  templateUrl: "accueil.html"
})
export class AccueilPage {
  constructor(
    private storage: Storage,
    private http: HttpClient,
    public modalCtrl: ModalController,
    public navCtrl: NavController
  ) {
    //set a key/value
    this.storage.set("api", "http://www.oritrail.fr/api/");
  }

  public seconnecter() {
    let profileModal = this.modalCtrl.create(modalConnexion);
    profileModal.present();
  }

  public sinscrire() {
    let profileModal = this.modalCtrl.create(modalEnregistrement);
    profileModal.present();
  }

  public installerCourse() {
    console.log("lancement installation course");
    this.navCtrl.push(scanManager, {mode:"I"} );
  }

  public participerCourse() {
    console.log("Lancement participation course");
    this.navCtrl.push(scanManager, {mode:"C"});
  }
}
