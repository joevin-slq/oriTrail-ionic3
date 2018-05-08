import { Component, Input } from '@angular/core';
import { Events } from 'ionic-angular'
import { Storage } from '@ionic/storage'
import { Geolocation } from '@ionic-native/geolocation';
import { Platform } from 'ionic-angular';
import { Service } from '../../utils/services'

declare var AdvancedGeolocation: any;

@Component({
  selector: 'scanManager',
  templateUrl: 'scanManager.html'
})



export class scanManager {
  @Input() mode: string;

  /**
   * different possible states: before, config, start, baliseLoop, ..., ended, error
   * en fonction du "state" on affiche la div qui correspond
   */
  public state: string = "before"; //

  private eventsManager: Events;

  constructor(events: Events,
    public storage: Storage,
    public service: Service,
    private platform: Platform) {

    console.log("scanManager constructor...");
    this.eventsManager = events;
    events.subscribe("qrcodescan:newqr", (qrcode) => { this.handleScannedQR(qrcode); });

  }

  
  public displayCamera(): boolean {
    return !((this.state == "before") || (this.state == "ended"));
  }

  public handleScannedQR(event) { //une balise à été scannée, on la gère ici




    //console.log("handleScannedQR() -> " + event);

    // on parse les données reçu du QRCode
    let info: object = JSON.parse(event);
    console.log(JSON.stringify(info));

    // Si on vient de scanner une balise de configuration 
    // (le champs type est présent seulement dans cette balise)
    if (info["type"] != null)
      this.storage.set("course_nom", info["nom"])
    this.storage.set("course_type", info["type"])

    // Si on est en mode configuration et qu'on scanne une balise de départ
    if (this.state == "config" && info["id"] != "") {
      this.state = "start"

    }

    // Si on est en mode départ et qu'on scanne 


    this.eventsManager.publish("scanManager:stopScanning");
    this.state = "ended";
  }

  public startScanning() {
    console.log("startScanning()");
    this.eventsManager.publish("scanManager:startScanning")
    this.state = "config";
  }
}
