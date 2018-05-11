import { Component } from "@angular/core";
import { Events } from "ionic-angular";
import { Storage } from "@ionic/storage";
import { Geolocation } from "@ionic-native/geolocation";
import { Platform, NavController, NavParams } from "ionic-angular";
import { Service } from "../../utils/services";

declare var AdvancedGeolocation: any;

@Component({
  selector: "scanManager",
  templateUrl: "scanManager.html"
})
export class scanManager {


  /**
   *
   */
  //different possible states:
  // before(on attend un QR config)
  // ready(on attend un QRstart)
  // started(On attend un QRbeacon ou un QRstop)
  // ended, error. en fonction du "state" on affiche la div qui correspond
  public state: string = "before";
  // contient toutes les infos du QR code config
  private infoConfig;
  public mode: string; // valeur possible: 'I' installation, 'C' course
  private eventsManager: Events;
  private backButtonUnregister: Function;

  constructor(
    events: Events,
    public storage: Storage,
    public service: Service,
    public navCtrl: NavController,
    public navParams: NavParams,
    private platform: Platform
  ) {
    console.log("scanManager constructor...");
    //get parmeters
    this.mode = navParams.get("mode");

    console.log("this.mode = ", this.mode);
    this.eventsManager = events;
    events.subscribe("qrcodescan:newqr", qrcode => {
      this.handleScannedQR(qrcode);
    });
  }

  public displayCamera(): boolean {
    return !(this.state == "before" || this.state == "ended");
  }

  public handleScannedQR(event) {
    //une balise à été scannée, on la gère ici
    //console.log("handleScannedQR() -> " + event);
    // on parse les données reçu du QRCode
    let info: object = JSON.parse(event);
    console.log(JSON.stringify(info));

    // Si on vient de scanner une balise de configuration
    // (le champs type est présent seulement dans cette balise)
    // if (info["type"] != null) this.storage.set("course_nom", info["nom"]);
    // this.storage.set("course_type", info["type"]);

    // // Si on est en mode configuration et qu'on scanne une balise de départ
    // if (this.state == "ready" && info["id"] != "") {
    //   this.state = "started";
    // }

    //------
    if (this.state == "before") {
      // on attend un QRcode config
      if (this.isQRConfig(info)) {
        this.infoConfig = info; // all
        //TODO on doit récupérer le mode de la course si on est en mode course sinon on met "i" dans mode
        //this.mode = i';

        this.state = "ready";
      } else {
        console.log("error, it's not the good QR. -> " + JSON.stringify(info));
      }
    } else if (this.state == "ready") {
      // on attend un qr code start
      if (this.isQRStart(info)) {
        console.log("we scanned the start QR");
        this.state = "started";
      }
    } else if (this.state == "started") {
      //it's a beacon QR or a stop QR
      if (this.isQRStop(info)) {
        // if it's a QR stop
        if (this.mode == "I") {
          //TODO enregistrer la position GPS de la balise stop
        }
        this.stopScanning();
      } else {
        // if it's a QR Config
        if (this.mode == "P") {
          // si on est en pas en mode parcours on tiens compte de l'ordre
          //TODO vérifier que c'est bien celui qu'on attendait
          if (this.isQRStop(info)) {
            this.stopScanning();
          }
          //si c'est le bon on
        } else if (this.infoConfig.type == "P") {
          //TODO on vérifie que le QR fait partie de la course mais si c'est le end
        }
        if (this.infoConfig.type == "S") {
          //TODO on vérifie que le QR fait partie de la course mais si c'est le end
        }
      }
    }
  }

  public startScanning() {
    console.log("startScanning()");
    this.eventsManager.publish("scanManager:startScanning");
    this.state = "ready";

    //sabotage du bouton retour
    this.backButtonUnregister = this.platform.registerBackButtonAction(() => {
      /*Do nothing*/
    }, 1);
  }

  public stopScanning() {
    this.eventsManager.publish("scanManager:stopScanning");
    this.state = "ended";
  }

  public backToMainMenu() {
    this.stopScanning();

    if (this.backButtonUnregister != undefined) {
      this.backButtonUnregister();
    }
    this.state = "before"; // seems useless

    this.navCtrl.pop();
  }

  private isQRConfig(QRCode: object) {
    //TODO return true if the QR code is a config QRcode, false instead
    //TODO On doit vérifier que tout les champs soit bien présent pour éviter de prendre des erreurs

    // Si on vient de scanner une balise de configuration
    // (le champs type est présent seulement dans cette balise)
    if (QRCode["type"] != null
    && QRCode["id"] != null
    && QRCode["nom"] != null
    && QRCode["deb"] != null
    && QRCode["fin"] != null
    && QRCode["bals"] != null) {
      // on s'assure que (dépendemment du type de course) on a bien les informations nécessaires
      if(QRCode["type"] == 'S' && QRCode["timp"] != null) {
        return true;
      } else if (QRCode["type"] == 'P' && QRCode["pnlt"] != null) {
        return true;
      }
  }
  // il manque des informations donc ... =>
  return false;

}

private isQRStart(QRCode: object) {
  if(QRCode["num"] == "1" && QRCode["nom"] == "Start") {
    return true;
  } // else
  return false;
}

private isQRStop(QRCode: object) {
  if(QRCode["num"] == "1" && QRCode["nom"] == "Start") {
    return true;
  } // else
  return false;
}
}
