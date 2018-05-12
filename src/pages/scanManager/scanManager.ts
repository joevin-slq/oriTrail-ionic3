import { Component } from "@angular/core";
import { Events } from "ionic-angular";
import { Storage } from "@ionic/storage";
import { Geolocation } from "@ionic-native/geolocation";
import { Platform, NavController, NavParams } from "ionic-angular";
import { Service } from "../../utils/services";
import { ToastController } from 'ionic-angular';
import { Uptime } from '@ionic-native/uptime';

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
  private infoConfig= JSON.parse('{"nom":"La ruthénoise","id":1,"type":"S","deb":"2018-05-05 08:00:00","fin":"2018-08-05 18:00:00","timp":"02:00:00","bals":{"1":{"nom":"CP1","val":"100"},"2":{"nom":"CP2","val":"50"}}}') ;
  public mode: string; // valeur possible: 'I' installation, 'C' course
  private eventsManager: Events;
  private backButtonUnregister: Function;

  constructor(
    private geolocation: Geolocation, 
    private uptime: Uptime,
    events: Events,
    public storage: Storage,
    public service: Service,
    public navCtrl: NavController,
    public navParams: NavParams,
    private platform: Platform,
    public toastCtrl: ToastController
  ) {
    console.log("scanManager constructor...");
    //get parmeters
    this.mode = navParams.get("mode");

    console.log("this.mode = ", this.mode);
    this.eventsManager = events;
    events.subscribe("qrcodescan:newqr", qrcode => {
      this.handleScannedQR(qrcode);
    });  
    this.updateBaliseTimeScan(2)
  }

  public displayCamera(): boolean {
    return !(this.state == "before" || this.state == "ended");
  }

  public handleScannedQR(event) {
    //une balise à été scannée, on la gère ici
    //console.log("handleScannedQR() -> " + event);
    // on parse les données reçu du QRCode
    let info: object = JSON.parse(event);
    //console.log(JSON.stringify(info));
 
    //------
    if (this.state == "config") {
 
      // on attend un QRCODE DE CONFIGURATION
      if (this.isQRConfig(info)) {
        console.log("Configuration QRCode scanned")
        // sauvegarde des données de la course 
        this.infoConfig = info; 
        // passage en état ready
        this.state = "ready";
        // on indique à l'utilisateur que la configuration a bien fonctionné
        let toast = this.toastCtrl.create({
          message: 'QRCode de configuration bien scanné. Vous pouvez maintenant scanner le QRCode de départ 😉',
          showCloseButton: true,
          closeButtonText: 'Ok'
        });
        toast.present();

      } else { 
        // on réessaye de scanner à nouveau un QRCode 
        this.startScanning()
        console.log("QRCode scanné mais pas celui de configuration ...")  
      }
      // on attend un QRCODE DE DÉPART
    } else if (this.state == "ready") {
      // on attend un qr code start
      if (this.isQRStart(info)) {
        console.log("we scanned the start QR");
        this.state = "started";
      }
      // on attend un QRCODE DE BALISE
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
          // si on est en pas en mode parcours on tient compte de l'ordre
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
    this.state = "config";

    //sabotage du bouton retour
    this.backButtonUnregister = this.platform.registerBackButtonAction(() => {
      /*Do nothing*/
    }, 1);
  }

  public stopScanning() {
    this.eventsManager.publish("scanManager:stopScanning");
    this.state = "ended";
  }

  public cancelScanning() {
    this.eventsManager.publish("scanManager:stopScanning");
    this.state = "before";
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

/**
 * Détecte si le QRCode est un QRCode de début (start)
 * @param QRCode le QRCode scanné
 * @return true si c'est un QRcode de début/start ou false sinon
 */
private isQRStart(QRCode: object) {
  if(QRCode["num"] == "1" && QRCode["nom"] == "Start") {
    return true;
  } // else
  return false;
}

/**
 * Détecte si le QRCode est un QRCode de fin
 * @param QRCode le QRCode scanné
 * @return true si c'est un QRcode de stop ou false sinon
 */
private isQRStop(QRCode: object) {
  // on récupère le nombre de balise
  let nombreDeBalise = Object.keys(this.infoConfig["bals"]).length

  if(QRCode["num"] == nombreDeBalise /* -1 ? */) {
    return true;
  } // else
  return false;
}

private getPosition() { 
   this.geolocation.getCurrentPosition().then((resp) => {
    console.log(resp.coords.latitude)
    console.log(resp.coords.longitude)
   }).catch((error) => {
     console.log('Error getting location', error);
   });
}
 
/**
 * Ajoute à l'objet infoConfig le temps de la balise indiquée (dans un champs temps)
 * @param idBalise l'id de la balise dans la liste
 */
private async updateBaliseTimeScan(idBalise: number) { 
  let uptimeLocal;
  // ne pas tenir compte de l'erreur Visual Studio
  await this.uptime.getUptime(true).then(
    function(uptime) {
      uptimeLocal = uptime;  
    }
  ).catch(
    function(error) { 
      uptimeLocal = "nothing"
    }
  );
   
  // on ajoute l'uptime actuel à l'id de la balise passée en param
  this.infoConfig["bals"][idBalise]["temps"] = uptimeLocal
  console.log(JSON.stringify(this.infoConfig))
  console.log(uptimeLocal)


}

}

