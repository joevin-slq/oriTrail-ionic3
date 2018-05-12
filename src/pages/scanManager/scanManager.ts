import { Component, NgZone } from "@angular/core";
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
  public score = 0;

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
    public toastCtrl: ToastController,
    public zone: NgZone
  ) {
    console.log("scanManager constructor...");
    //get parmeters
    this.mode = navParams.get("mode");

    console.log("this.mode = ", this.mode);
    this.eventsManager = events;
    events.subscribe("qrcodescan:newqr", qrcode => {
      this.handleScannedQR(qrcode);

    });
    this.zone.run(() => {
      //run the code that should update the view
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
 

    // à partir du moment ou on à scanner un QR config on prend plus que des QR codes de la course correspondante
    let isQRValid: boolean = true;
    if(this.state != 'config'){
      if(info['id_course'] == this.infoConfig['id']){
        isQRValid = true;
      }else{
        isQRValid = false; 
        let toast = this.toastCtrl.create({
          message: `Ce QR code ne provient d'une autre course`,
          showCloseButton: false
        });
        toast.present();
      }
    }

    //
    if (this.state == "config") {
      // si on a rien scanner,
      //TODO vérifier que c'est un QRconfig et l'enregistrer en variable
      console.log("on vient de scanner le QR config");
      this.infoConfig = info;
      if (this.mode == "I") {
        // si on est en mode installation on passe directement en mode started
        this.state = "started";
        console.log("on est en mode installation")
      } else {
        // sinon  on passe en mode ready
        this.state = "ready";
        console.log("on est en mode course")
      }
    } else if (this.state == "ready") {
      // on passe dans ce cas seulement si on est en mode course
      if (this.isQRStart(info)) {
        this.state = "started";
        //TODO lancer le chrono
        console.log('top départ');
      }
    } else if (this.state == "started") {
      if (this.mode == "I") {
        console.log("on viens de scanner un QR durant l'installation");
        //On viens de scanner une balise,
        //TODO enregistrer la position GPS correspondannt à cette balise
        //on enregistre la position GPS de la balise ( à coder sous forme de fonction générique + dans cette fonction si toutes les balise on été scannées on arrete l’appareil photo et on tente d’envoyer le résultat)
        this.addQR(info);
        if (this.allQRScanned()) {
          this.backToMainMenu();
        }
      } else {
        //on est en mode course
        if (this.isQRStop(info)) {
          this.backToMainMenu();
        }
        if (this.infoConfig["type"] == "S") {
          // course en type score

          if (this.addQR(info)) {
            // TODO ajouter les points la balise au score total
          }
        } else {
          // on est en mode parcours, les balises on un ordre préci
          this.addQROrdered(info);
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
    console.log("stopscanning()")
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
    if (
      QRCode["type"] != null &&
      QRCode["id"] != null &&
      QRCode["nom"] != null &&
      QRCode["deb"] != null &&
      QRCode["fin"] != null &&
      QRCode["bals"] != null
    ) {
      // on s'assure que (dépendemment du type de course) on a bien les informations nécessaires
      if (QRCode["type"] == "S" && QRCode["timp"] != null) {
        return true;
      } else if (QRCode["type"] == "P" && QRCode["pnlt"] != null) {
        return true;
      }
    }
    // il manque des informations donc ... =>
    return false;
  }

  private isQRStart(QRCode: object): boolean {
    //TODO vérifier que ce soit le QR correspondant à la bonne course
    if (QRCode["num"] == "1" && QRCode["nom"] == "Start") {
      return true;
    } // else
    return false;
  }

  private isQRStop(QRCode: object): boolean {
    //TODO vérifier que ce soit le QR correspondant à la bonne course
    let nombreDeBalise = Object.keys(this.infoConfig["bals"]).length;

    if (QRCode["num"] == nombreDeBalise /* -1 ? */) {
      return true;
    } // else
    return false;
  }
  private allQRScanned() {
    //TODO comparer les balise à scanner et les balise scanné
    // TODO si on à tout scanné return true sinon false
  }


  //enregistrer quel QR a été scanné et leurs positions
  private addQR(newQR: object): boolean {
    // TODO vérifier que le QR est pas déja dans la liste des QR scanné
    // TODO si il y est pas, on le rajoute et o retourne true
    // TODO sinon (si il est déja dans la liste) on retourne fasle.
    return true; // remove that
  }

  private addQROrdered(newQR: object): boolean {
    //TODO vérifier que newQR est égale au prochain QR code la course
    //si il a sauté des QR {
    //compter combien de QR il à sauter
    //let nbQRSkipped;
    // pénalité  += nombre de QR sauté * valeur de la pénalité
    // pénalité += nbQRSkipped * this.infoConfig["pnlt"];
    //}
    this.addQR(newQR);
    return true; // remove that
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
 
 
