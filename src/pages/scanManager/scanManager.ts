  import { Component, Input } from '@angular/core';
  import { Events } from 'ionic-angular'

  @Component({
    selector: 'scanManager',
    templateUrl: 'scanManager.html'
  })

  export class scanManager {
    @Input() mode: string;

    public state: string = "before"; //different possible states: before, config, start, baliseLoop, ..., ended, error
    //en fonction du "state" on affiche la div qui correspond
    private eventsManager: Events;

    constructor( events: Events) {
      console.log("scanManager constructor...");
      this.eventsManager = events;
      events.subscribe("qrcodescan:newqr", (qrcode) =>{ this.handleScannedQR(qrcode); });
    }

    public displayCamera(): boolean {
      return !((this.state == "before")||(this.state == "ended"));
    }

    public handleScannedQR(event){ //une balise à été scanner, on la gère ici

      console.log("handleScannedQR() -> " + event);

      // let info: object = JSON.parse(QRContent);
      // console.log(JSON.stringify(info));

      this.eventsManager.publish("scanManager:stopScanning");
      this.state = "ended";
    }

    public startScanning(){
      console.log("startScanning()");
      this.eventsManager.publish("scanManager:startScanning")
      this.state = "config";
    }
  }
