import { Component, NgZone } from "@angular/core";
import { Events } from "ionic-angular";
import { Storage } from "@ionic/storage";
import { Geolocation } from "@ionic-native/geolocation";
import { Platform, NavController, NavParams } from "ionic-angular";
import { Service } from "../../utils/services";
import { ToastController } from "ionic-angular";
import { Uptime } from "@ionic-native/uptime";

@Component({
  selector: "scanManager",
  templateUrl: "scanManager.html"
})
export class scanManager {
  /**
   *
   */
  //different possible states:
  // before (affichage du tuto)
  // config (on attend un QR config)
  // ready(on attend un QRstart)
  // started(On attend un QRbeacon ou un QRstop)
  // ended
  public state: string = "before";
  // contient toutes les infos du QR code config
  private infoConfig;
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
  }

  public displayCamera(): boolean {
    return !(this.state == "before" || this.state == "ended");
  }

  public handleScannedQR(event) {
    this.zone.run(() => {
      //run the code that should update the view

      //une balise à été scannée, on la gère ici
      //console.log("handleScannedQR() -> " + event);
      let info: object;
      // on parse les données reçu du QRCode
      try {
        info = JSON.parse(event);
      } catch (e) {
        alert("Le QR code scanné comporte une erreur."); // error in the above string (in this case, yes)!
        console.log(e);
      }
      console.log(JSON.stringify(info));

      if (info != undefined) {
        //
        if (this.state == "config") {
          if (this.isQRConfig(info)) {
            // si on a rien scanner,
            console.log("on vient de scanner le QR config");
            this.infoConfig = info;
            // on ajoute les balises de démarrage et de fin
            this.infoConfig["bals"][0] = { nom: "Start" };
            //pas de balise end en course score
            if (this.infoConfig["type"] == "P") {
              this.infoConfig["bals"][
                Object.keys(this.infoConfig["bals"]).length
              ] = { nom: "End" };
            }

            console.log(
              "CONF AVEC START/END : " + JSON.stringify(this.infoConfig["bals"])
            );
            if (this.mode == "I") {
              // si on est en mode installation on passe directement en mode started
              this.state = "started";
              console.log("on est en mode installation");
            } else {
              // sinon  on passe en mode ready
              this.state = "ready";
              console.log("on est en mode course");
            }
          }
        } else if (this.state == "ready") {
          // on passe dans ce cas seulement si on est en mode course
          if (this.isQRStart(info)) {
            this.state = "started";
            //TODO lancer le chrono
            console.log("top départ");
          }
        } else if (this.state == "started") {
          if (this.mode == "I") {
            console.log("on viens de scanner un QR durant l'installation");
            //On viens de scanner une balise,
            //TODO enregistrer la position GPS correspondannt à cette balise
            //on enregistre la position GPS de la balise ( à coder sous forme de fonction générique + dans cette fonction si toutes les balise on été scannées on arrete l’appareil photo et on tente d’envoyer le résultat)
            this.addQR(info);
            if (this.allQRScanned()) {
              this.state = "ended";
            }
          } else {
            //on est en mode course
            if (this.isQRStop(info)) {
              this.state = "ended";
            } else {
              if (this.infoConfig["type"] == "S") {
                // course en type score

                if (this.addQR(info)) {
                  // ajouter les points la balise au score total
                  this.score += info["val"];
                }
              } else {
                // on est en mode parcours, les balises on un ordre préci
                this.addQROrdered(info);
              }
            }
          }
        }
      }

      // state ended -> on termine immédiatement sinon on attends un nouveau scan
      if (this.state != "ended") {
        this.eventsManager.publish("scanManager:startScanning");
      } else {
        this.backToMainMenu();
      }
    });
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

  /**
   * Annule le scan en cours et va en état "end" (état de fin)
   */
  public stopScanning() {
    console.log("stopscanning()");
    this.eventsManager.publish("scanManager:stopScanning");
    this.state = "ended";
  }

  /**
   * Annule le scan en cours et revient en état "before" (avant scan config)
   */
  public cancelScanning() {
    this.eventsManager.publish("scanManager:stopScanning");
    this.state = "before";
  }

  // TODO
  public backToMainMenu() {
    this.stopScanning();

    if (this.backButtonUnregister != undefined) {
      this.backButtonUnregister();
    }
    this.state = "before"; // seems useless

    this.navCtrl.pop();
  }

  private isQRConfig(QRCode: object): boolean {
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
    let isQRValid = this.isQRIDValid(QRCode);
    if (isQRValid == true) {
      if (QRCode["num"] == "1" && QRCode["nom"] == "Start") {
        isQRValid = true;
      } else {
        isQRValid = false;
      }
    }

    return isQRValid;
  }

  private isQRStop(QRCode: object): boolean {
    let isQRValid = this.isQRIDValid(QRCode);

    if (isQRValid == true) {
      isQRValid = this.isEndBalise(QRCode["num"]);
    }
    return isQRValid;
  }

  //vérif du champs id_course, ne pas verifier ça sur le QR config
  private isQRIDValid(QRCode: object): boolean {
    // à partir du moment ou on à scanner un QR config on prend plus que des QR codes de la course correspondante
    let isQRValid: boolean = false;
    if (this.infoConfig != undefined) {
      if (QRCode["id_course"] == this.infoConfig["id"]) {
        isQRValid = true;
      } else {
        isQRValid = false;
        let toast = this.toastCtrl.create({
          message: `Ce QR code ne provient d'une autre course`,
          showCloseButton: false
        });
        toast.present();
      }
    }

    return isQRValid;
  }

  private allQRScanned() {
    //TODO comparer les balise à scanner et les balise scanné
    // TODO si on à tout scanné return true sinon false
  }

  //enregistrer quel QR a été scanné et leurs positions
  private addQR(newQR: object): boolean {
    // TODO vérifier que le QR est pas déja dans la liste des QR scanné
    // TODO si il y est pas, on le rajoute et on retourne true
    this.updateBaliseTimeScan(newQR["num"]);
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
    await this.uptime
      .getUptime(true)
      .then(function(uptime) {
        uptimeLocal = uptime;
        console.log("getUptime(true)");
      })
      .catch(function(error) {
        uptimeLocal = "erreur";
      });

    // On ajoute l'uptime mais également le datetime (timestamp) du téléphone pour étaloner les futurs uptimes
    if (idBalise == 0) {
      this.infoConfig["bals"][0]["temps_init"] = new Date().getTime();
    }

    // ajout du temps à la balise
    this.infoConfig["bals"][idBalise]["temps"] = uptimeLocal;

    // DEBUG
    console.log(uptimeLocal);
    console.log(JSON.stringify(this.infoConfig));
  }

  /**
   * Ajoute à l'objet infoConfig la position GPS prise à la volée (dans un champs position)
   * Donc la position GPS sera récupérée à l'appel de la fonction
   * @param idBalise l'id de la balise dont on veut ajouter la position
   */
  private async updateBalisePosition(idBalise: number) {
    let position;
    // on enregistre la position GPS dans la variable position
    await this.geolocation
      .getCurrentPosition()
      .then(function(resp) {
        position = {
          latitude: resp.coords.latitude,
          longitude: resp.coords.longitude
        };
      })
      .catch(function(error) {
        position = { erreur: error };
      });
    // ajout de la position pour la balise
    this.infoConfig["bals"][idBalise]["position"] = position;

    // DEBUG
    console.log(JSON.stringify(this.infoConfig));
    console.log(JSON.stringify(position));
  }

  /**
   * Détermine si l'id de la balise passée est l'id de la dernière balise ou non (end)
   * /!\ on part du principe que les balises début / fin ont bien été ajoutées à infoConfig
   * @param idBalise l'id de la balise à tester
   */
  private isEndBalise(idBalise: number) {
    let nombreDeBalise = Object.keys(this.infoConfig["bals"]).length;

    // +1 car on a nombre de balise - 2 dans notre config
    if (idBalise == nombreDeBalise + 1) {
      return true;
    } // else
    return false;
  }
}
