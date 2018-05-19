import { Component, NgZone } from "@angular/core";
import { Events } from "ionic-angular";
import { Storage } from "@ionic/storage";
import { Geolocation } from "@ionic-native/geolocation";
import { Platform, NavController, NavParams } from "ionic-angular";
import { Service } from "../../utils/services";
import { ToastController } from "ionic-angular";
import { Uptime } from "@ionic-native/uptime";
import { AccueilPage } from "../accueil/accueil";

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
  public infoConfig;
  public mode: string; // valeur possible: 'I' installation, 'C' course
  public score: number = 0;
  public nextQRID: number = 2;
  public countQRskipped: number = 0;
  private stopQRID;

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
        info = undefined;
      }
      //console.log(JSON.stringify(info));

      if (info != undefined) {
        if (!this.isQRIDValid(info)) {
          // if QR is not valid we delete it
          info = undefined;
        }
      }

      if (info != undefined) {
        //
        if (this.state == "config") {
          if (this.isQRConfig(info)) {
            // si on a rien scanner,
            console.log("on vient de scanner le QR config");
            this.infoConfig = info;
            // on ajoute les balises de démarrage et de fin
            this.infoConfig["bals"].unshift({ num: 1, nom: "Start" });
            //pas de balise end en course score
            if (this.infoConfig["type"] == "P") {
              this.stopQRID = this.infoConfig["bals"].length + 1;
              this.infoConfig["bals"].push({ num: this.stopQRID, nom: "Stop" });
            }

            console.log(
              "ajout de Start/Stop -> infoConfig.bals = " +
                JSON.stringify(this.infoConfig["bals"])
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
            console.log("top départ");
            this.addQR(info);
            if (this.infoConfig["type"] == "P") {
              //TODO lancer le chrono
            } else {
              //TODO lancer le countdown
            }
          }
        } else if (this.state == "started") {
          if (this.mode == "I") {
            console.log("on vient de scanner un QR durant l'installation");
            //On vient de scanner une balise
            this.addQR(info);
            if (this.allQRScanned()) {
              this.state = "ended";
            }
          } else {
            //on est en mode course
            if (this.infoConfig["type"] == "S") {
              // course en type score
              console.log("une balise a été scanner en mode course score.");

              if (this.addQR(info)) {
                // ajouter les points de la balise au score total
                this.score += info["val"];
              }
              if (this.allQRScanned()) {
                //TODO stopper le countdown
                this.state = "ended";
              }
            } else {
              console.log("une balise a été scanner en mode course parcours.");
              // on est en mode parcours, les balises on un ordre préci
              this.addQROrdered(info);
              if (this.nextQRID == this.stopQRID + 1) {
                //TODO stoper le chrono
                this.state = "ended";
              }
            }
          }
        }
      }
      //console.log("infoConfig = " + JSON.stringify(this.infoConfig));

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

  public backToMainMenu() {
    this.stopScanning();

    this.storage.set("mode", this.mode);
    this.storage.set("resultat", this.infoConfig);

    if (this.backButtonUnregister != undefined) {
      this.backButtonUnregister();
    }
    this.state = "before"; // seems useless

    console.log("résultat -> " + JSON.stringify(this.infoConfig));
    this.navCtrl.push(AccueilPage, {
      resultat: this.infoConfig
    });
  }

  /**
   * Vérifie que le QRCode actuel est le QRCode de configuration
   * @param QRCode
   */
  private isQRConfig(QRCode: object): boolean {
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

  //verifier que c'est un QR start correct
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

  //verifier que c'est un QR stop correct
  /**
   * Détermine si l'id de la balise passée est l'id de la dernière balise ou non (Stop)
   * /!\ on part du principe que les balises début / fin ont bien été ajoutées à infoConfig
   * @param idBalise QR code de la balise à tester
   */
  private isQRStop(QRCode: object): boolean {
    let isQRValid = this.isQRIDValid(QRCode);

    if (isQRValid == true) {
      let nombreDeBalise = this.infoConfig["bals"].length;

      // +1 car on a nombre de balise - 2 dans notre config
      if (QRCode["num"] == nombreDeBalise) {
        isQRValid = true;
      } else {
        isQRValid = false;
      }
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
        // Pour le moment on affiche pas le toast
        /* let toast = this.toastCtrl.create({
          message: `Ce QR code semble provenir d'une autre course`,
          duration: 4000
        });
        toast.present();*/
      }
    } else isQRValid = true;

    return isQRValid;
  }

  // retourne: est-ce que toutes les balises on été scanné ? (y compris la balise fin)
  private allQRScanned(): boolean {
    // comparer les balise à scanner et les balise scanné
    let areAllQRScanned = true;
    for (let element of this.infoConfig.bals) {
      if (this.isIDAlreadyScanned(element.num) == false) {
        areAllQRScanned = false;
      }
    }

    console.log("allQRScanned() returning -> " + areAllQRScanned);
    return areAllQRScanned;
  }

  //@param un ID de balise
  //ça te renvoie si la balise a déja été scanné
  private isIDAlreadyScanned(ID: number): boolean {
    let arrayID: number = ID - 1;
    if (this.infoConfig.bals[arrayID].latitude != undefined) {
      return true;
    } else {
      return false;
    }
  }

  //enregistrer quel QR a été scanné et leurs positions + temps
  //
  private addQR(newQR: object): boolean {
    // vérifier que le QR est pas déja scanné
    if (this.isIDAlreadyScanned(newQR["num"])) {
      // si il est déja dans la liste, on retourne false.
      return false;
    } else {
      // sinon il y est pas, on le rajoute et on retourne true
      this.updateBalisePosition(newQR["num"]);
      if (this.mode == "C") {
        this.updateBaliseTimeScan(newQR["num"]);
      }
      return true;
    }
  }

  /*
   * scan des balises dans l'ordre en commençant par la balise 1
   * cette fonction vérifie que c'est bien le QR attendu, le cas échéant, applique les pénalités en conséquence ou ignore le QR
  */
  private addQROrdered(newQR: object): boolean {
    let returnValue;
    let newQRID = newQR["num"];
    //vérifier que newQR est le prochain QR code la course
    if (this.nextQRID > newQRID) {
      returnValue = false;
      alert(
        "Vous ne pouvez pas revenir en arrière, continuer votre course vers la balise n°" +
          this.nextQRID
      );
      console.log("scan d'une balise déja sauté! On l'ignore");
    } else if (this.nextQRID < newQRID) {
      //sautage de balise, on compte les pénalités
      //compter combien de QR il a sauter
      let count = newQRID - this.nextQRID;
      this.countQRskipped += count;
      console.log(count + " balise(s) sauté. total: " + this.countQRskipped);
      this.nextQRID = newQRID + 1;

      //apres ça on se base sur addQR();
      returnValue = this.addQR(newQR);
    } else {
      //apres ça on se base sur addQR();
      returnValue = this.addQR(newQR);
      this.nextQRID = newQRID + 1;
    }

    return returnValue;
  }
  /**
   * Ajoute à l'objet infoConfig le temps de la balise indiquée (dans un champs temps)
   * UPTIME => Milliseconde /!\
   * @param idBalise l'id de la balise dans la liste
   */
  private async updateBaliseTimeScan(idBalise: number) {
    console.log("updateBaliseTimeScan");
    let uptimeLocal;
    await this.uptime
      .getUptime()
      .then(function(uptime) {
        console.log("UPTIME CHOPPÉ");
        uptimeLocal = uptime;
      })
      .catch(function(error) {
        uptimeLocal = null;
        console.log("ERREUR de récupération uptime ! updateBaliseTimeScan()");
      });

    // si c'est la balise de départ on note la date de début (du téléphone ...)
    if (idBalise == 1) {
      // balise de départ
      this.infoConfig["bals"][idBalise - 1][
        "temps_initial"
      ] = new Date().getTime();
      // ajout du temps à la balise
      this.infoConfig["bals"][idBalise - 1]["temps"] = uptimeLocal;
    }
    // si c'est une balise autre que le départ ou soustrait l'uptime de celle de départ
    if (idBalise != 1) {
      // ajout du temps à la balise
      this.infoConfig["bals"][idBalise - 1]["temps"] =
        this.infoConfig["bals"][0]["temps"] - uptimeLocal;
    }

    // DEBUG
    console.log(uptimeLocal);
    console.log(JSON.stringify(this.infoConfig));
  }

  /**
   * Ajoute à l'objet infoConfig la position GPS prise à la volée (dans un champs position)
   * Donc la position GPS sera récupérée à l'appel de la fonction
   * //on enregistre la position GPS de la balise
   * @param idBalise l'id de la balise dont on veut ajouter la position
   */
  private async updateBalisePosition(idBalise: number) {
    console.log("updateBalisePosition");
    let position;
    var posOptions = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };
    // on enregistre la position GPS dans la variable position
    await this.geolocation
      .getCurrentPosition(posOptions)
      .then(function(resp) {
        console.log("LOCALISATION CHOPPÉ");

        position = {
          latitude: resp.coords.latitude,
          longitude: resp.coords.longitude
        };
      })
      .catch(function(error) {
        position = {
          latitude: null,
          longitude: null
        };
        console.log(
          "ERREUR de récupérartion de la position. updateBalisePosition()"
        );
      });

    // ajout de la position pour la balise
    this.infoConfig["bals"][idBalise - 1]["longitude"] = position.longitude;
    this.infoConfig["bals"][idBalise - 1]["latitude"] = position.latitude;
    console.log(
      "position ajouté dans " +
        JSON.stringify(this.infoConfig["bals"][idBalise - 1])
    );
  }
}
