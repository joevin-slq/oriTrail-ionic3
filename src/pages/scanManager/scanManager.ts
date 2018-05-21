import { Component, NgZone } from "@angular/core";
import { Events } from "ionic-angular";
import { Storage } from "@ionic/storage";
import { Geolocation } from "@ionic-native/geolocation";
import { NavController, NavParams } from "ionic-angular";
import { Service } from "../../utils/services";
import { ToastController } from "ionic-angular";
import { Uptime } from "@ionic-native/uptime";
import { AccueilPage } from "../accueil/accueil";
import { Config } from "ionic-angular/config/config";

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
  public displayedTimer: string = "";

  private eventsManager: Events;
  private timeout;
  private watchTimeout;

  constructor(
    private geolocation: Geolocation,
    private uptime: Uptime,
    events: Events,
    public storage: Storage,
    public service: Service,
    public navCtrl: NavController,
    public navParams: NavParams,
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
            this.infoConfig["bals"].unshift({ num: 1, nom: "Start", val: 0 });
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
            this.eventsManager.publish("scanManager:startScanning");
          }
        } else if (this.state == "ready") {
          // on passe dans ce cas seulement si on est en mode course
          if (this.isQRStart(info)) {
            this.state = "started";
            console.log("top départ");
            this.addQR(info);
            if (this.infoConfig["type"] == "P") {
              // lancer le chrono
              // passer le temps que doit faire le timer et le prendre en compte dans la fonction
              this.countdownWatch(0, 0, true);
            } else {
              //lancement de la callback qui limite le temps de scan
              var time = this.infoConfig.timp;
              //format should be "HH:MM" or "HH:MM:SS"
              console.log(
                "this.infoConfig.timp = " + JSON.stringify(this.infoConfig.timp)
              );
              var a = time.split(":"); // split it at the colons

              let seconds;
              //two cases, depending on how QRconfig format that shit
              if (a.length == 2) {
                a[2] = "00";
              }
              // minutes are worth 60 seconds. Hours are worth 60 minutes.
              seconds = +a[0] * 60 * 60 + +a[1] * 60 + +a[2];

              console.log("seconds = " + seconds);
              if (seconds != null) {
                // lancer le countdown
                this.timeout = setTimeout(() => {
                  this.backToMainMenu();
                }, seconds * 1000);
              }
              // passer le temps que doit faire le timer et le prendre en compte dans la fonction
              this.countdownWatch(0, seconds, false);
            }
          } else {
            this.eventsManager.publish("scanManager:startScanning");
          }
        } else if (this.state == "started") {
          if (this.mode == "I") {
            console.log("on vient de scanner un QR durant l'installation");
            //On vient de scanner une balise
            this.addQR(info);
          } else {
            //on est en mode course
            if (this.infoConfig["type"] == "S") {
              // course en type score
              console.log("une balise a été scanner en mode course score.");

              if (this.addQR(info)) {
                // ajouter les points de la balise au score total
                this.score += info["val"];
              }
            } else {
              console.log("une balise a été scanner en mode course parcours.");
              // on est en mode parcours, les balises on un ordre précis
              this.addQROrdered(info);
            }
          }
        }
      } else {
        this.eventsManager.publish("scanManager:startScanning");
      }
      //console.log("infoConfig = " + JSON.stringify(this.infoConfig));

      if (this.state == "config") {
        this.eventsManager.publish("scanManager:startScanning");
      }
    });
  }
  // -------- watch ----------
  /**
   * Permet de créer un timer ou un chronomètre
   * @param minutes
   * @param seconds
   * @param stopwatch
   */
  private watchReferenceTime; // reference time is: end for countdown, start for stopwatch
  private watchHours;
  private watchMins;
  private watchMsLeft;
  private watchTime = new Date(0);
  private watchStopWatch: boolean;

  private countdownWatch(minutes, seconds, stopwatch: boolean) {
    this.watchStopWatch = stopwatch;
    if (stopwatch) {
      this.watchReferenceTime = +new Date();
    } else {
      this.watchReferenceTime =
        +new Date() + 1000 * (60 * minutes + seconds) + 500;
    }
    this.watchTimeout = setInterval(() =>{this.updateTimer()}, 500);
  }

  private twoDigits(n) {
    return n <= 9 ? "0" + n : n;
  }

  private updateTimer() {
    if (this.watchStopWatch) {
      this.watchTime.setTime(+new Date() - this.watchReferenceTime);
    } else {
      this.watchMsLeft = this.watchReferenceTime - +new Date();
      this.watchTime.setTime(this.watchMsLeft);
    }
    console.log("this.watchTime = " + +this.watchTime);

    this.watchHours = this.watchTime.getUTCHours();
    this.watchMins = this.watchTime.getUTCMinutes();
    this.displayedTimer =
      (this.watchHours
        ? this.watchHours + ":" + this.twoDigits(this.watchMins)
        : this.watchMins) +
      ":" +
      this.twoDigits(this.watchTime.getUTCSeconds());

    console.log("this.displayedTimer = " + this.displayedTimer);
  }
  //----- /Watch --------

  public startScanning() {
    console.log("startScanning()");
    this.eventsManager.publish("scanManager:startScanning");
    this.state = "config";

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

  /**
   * TODO : problème ici, parfois après le retour sur l'accueil la caméra fonctionne toujours (et fond transparent /:)
   */
  public backToMainMenu() {
    this.stopScanning();

    clearInterval(this.watchTimeout);
    this.state = "before"; // seems useless, yes it should be, so delete it ?
    // on enregistre les informations de résultat
    if (this.infoConfig != null) {
      this.storage.ready().then(() => {
        this.storage.set("mode", this.mode);
        this.storage.set("resultat", this.infoConfig);
      });
      this.navCtrl.push(AccueilPage, {
        resultat: this.infoConfig
      });
    } else {
      this.navCtrl.pop();
    }
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
  private allQRScanned() {
    // comparer les balise à scanner et les balise scanné
    let areAllQRScanned: boolean = true;
    for (let element of this.infoConfig.bals) {
      if (this.isIDAlreadyScanned(element.num) == false) {
        areAllQRScanned = false;
      }
    }

    if (!areAllQRScanned && this.infoConfig.type == "P" && this.mode == "C") {
      if (this.nextQRID == this.stopQRID + 1) {
        areAllQRScanned = true;
      }
    }

    console.log("allQRScanned() returning -> " + areAllQRScanned);
    if (areAllQRScanned) {
      if (this.mode == "C" && this.infoConfig.type == "S") {
        // stopper le countdown
        clearTimeout(this.timeout);
        this.infoConfig["score"] = this.score;
      }
      this.state = "ended";
    }
    console.log("infoconfig = " + JSON.stringify(this.infoConfig));

    // state ended -> on termine immédiatement sinon on attends un nouveau scan
    if (this.state != "ended") {
      this.eventsManager.publish("scanManager:startScanning");
    } else {
      this.backToMainMenu();
    }
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
      this.eventsManager.publish("scanManager:startScanning");
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
      /*alert(
        "Vous ne pouvez pas revenir en arrière, continuer votre course vers la balise n°" +
          this.nextQRID
      );*/
      console.log("scan d'une balise déja sauté! On l'ignore");
      this.eventsManager.publish("scanManager:startScanning");
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
        console.log("UPTIME RÉCUPÉRÉE");
        uptimeLocal = uptime;
      })
      .catch(function(error) {
        uptimeLocal = null;
        console.log("ERREUR de récupération uptime ! updateBaliseTimeScan()");
      });

    // si c'est la balise de départ on note la date de début (du téléphone ...)
    if (idBalise == 1) {
      // balise de départ
      this.infoConfig["bals"][0]["temps_initial"] = new Date().getTime();
      // ajout du temps à la balise
      this.infoConfig["bals"][0]["temps"] = uptimeLocal;
    }
    // si c'est une balise autre que le départ ou soustrait l'uptime de celle de départ
    if (idBalise >= 2) {
      // ajout du temps à la balise

      this.infoConfig["bals"][idBalise - 1]["temps"] =
        Number(uptimeLocal) - Number(this.infoConfig["bals"][0]["temps"]);
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
    this.allQRScanned();
  }
}
