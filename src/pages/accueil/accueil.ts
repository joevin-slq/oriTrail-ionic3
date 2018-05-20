import { Component, NgZone } from "@angular/core";

import { Storage } from "@ionic/storage";
import { HttpClient, HttpHeaders } from "@angular/common/http";

import { ModalController, NavController, NavParams, ViewController } from "ionic-angular";

import { modalConnexion } from "../connexion/modalConnexion";
import { modalEnregistrement } from "../enregistrement/modalEnregistrement";
import { scanManager } from "../scanManager/scanManager";
import { ViewEncapsulation } from '@angular/core'
import { ToastController } from "ionic-angular";

import { Observable } from 'rxjs/Observable'

@Component({
  selector: "page-accueil",
  templateUrl: "accueil.html",
  encapsulation: ViewEncapsulation.None
})
export class AccueilPage {
  // etat avec ou sans résultat
  public state: string = "before";
  // quand on passe en état resultat, on a un mode à spécifier
  public mode: string = "null";
  // définit l'état de connexion de l'utilisateur
  public connecter: string = "non";

  // information utilisateur
  public userInfo;

  // AFFICHAGE
  // contient le texte d'envoie des résultats ou d'une installation
  envoyer;

  constructor(
    private storage: Storage,
    private http: HttpClient,
    public modalCtrl: ModalController,
    public navCtrl: NavController,
    public zone: NgZone,
    public navparams: NavParams,
    public toastCtrl: ToastController,
    private viewCtrl: ViewController
  ) {
    //set a key/value
    this.storage.set("api", "http://www.oritrail.fr/api/");

    this.zone.run(() => {
      // si on a des résultat à envoyer (paramètre de navigation de la vue depuis scanManager) 
      if (navparams.get("resultat") != null) {
        // on affiche sur la page d'accueil qu'on peut envoyer des résultats
        this.state = "resultat"
        // on récupére le mode (installation ou résultats) pour afficher le bon message à l'utilisateur
        this.storage.get('mode').then((mode) => {
          if (mode == "I") { // mode installation
            this.envoyer = "Vous pouvez envoyer les résultats de l'installation de la course."
            // on affiche le bon bouton pour envoyer les résultats de l'install
            this.mode = "installation"
          } else { // mode cours / résultats
            this.envoyer = "Vous pouvez envoyer les résultats de la course."
            // on affiche le bon bouton pour envoyer les résultats d'une course
            this.mode = "course"
          }
        });

      }
      // on affiche comme quoi on est bien connecté si on arrive d'une autre vue
      this.storage.get('userInfo').then((val) => {
        // si l'objet existe
        if (val != null) {
          this.userInfo =  val.prenom + " " + val.nom
          this.connecter = "oui"
        }
      });

    });
  }

  ionViewWillEnter() {
    this.viewCtrl.showBackButton(false);
  }

  public async seconnecter() {
    let profileModal = this.modalCtrl.create(modalConnexion);
    profileModal.present();
    profileModal.onDidDismiss(async data => {
      // on met à jour la vue
      if (data == "ok") {
        this.zone.run(async () => {
          await this.storage.get('userInfo').then((val) => {
            console.log("INFO CONNEXION : " + JSON.stringify(val))
            this.userInfo = val.prenom + " " + val.nom 
          });
          this.connecter = "oui"
        })
      }
    });
  }

  public sinscrire() {
    let profileModal = this.modalCtrl.create(modalEnregistrement);
    profileModal.present();
  }

  public sedeconnecter() {
    // on raffiche les possiblités de connexion
    this.connecter = "non"
    // on supprime les données de la connexion
    this.storage.remove('userInfo');
    this.storage.remove('token');
  }

  public installerCourse() {
    console.log("lancement installation course");
    this.navCtrl.push(scanManager, { mode: "I" });
  }

  public participerCourse() {
    console.log("Lancement participation course");
    this.navCtrl.push(scanManager, { mode: "C" });
  }

  /**
   * Permet d'envoyer les résultats d'une course à l'api
   */
  public envoyerResultat() {

    this.zone.run(() => {
      this.storage.get('resultat').then((resultat) => {
        // TODO appel api
        console.log("RESULTAT BRUT  : " + JSON.stringify(resultat, null, 4));
        // on supprime le bandeau si les résultats ont bien été envoyés
        this.enleverResultatAEnvoyer();
      });

    });
  }

  /**
   * Permet d'envoyer les résultats d'une installation à l'api
   */
  public envoyerInstallation() {

    this.zone.run(() => {
      this.storage.get('resultat').then(async (resultat) => {
        console.log("RESULTAT BRUT  : " + JSON.stringify(resultat, null, 4));
        // PREPARATION JSON A ENVOYER À L'API
        // on renomme les champs pour que l'api puissent les interpréter
        let toSend = resultat;
        // renommage du champs id en id_course...
        toSend.id_course = toSend.id;
        delete toSend.id;
        // ajout de l'id utilisateur 
        await this.storage.get('userInfo').then((val) => {
          toSend.id_user = val.id_user
        });
        // récupération du token
        let token;
        await this.storage.get('token').then((val) => { 
          token = val
        });
  
        console.log("OBJET FINAL A ENVOYER : " + JSON.stringify(toSend, null, 4))

        // ajout du token d'authentification
        // set de l'header pour la requête avec le token 
        const httpOptions = {
          headers: new HttpHeaders().set('Authorization', "Bearer " + token)
        };

        // on effectue la rqt
        let data: Observable<any> = this.http.post("https://www.oritrail.fr/api/install",
          { toSend }, httpOptions

        )
        // ok
        data.subscribe(async result => { // DONNÉES BIEN ENVOYÉES
          let toast = this.toastCtrl.create({
            message: `Les données d'installation ont correctement été envoyées.`,
            duration: 4000
          });
          toast.present();

          console.log("RÉPONSE ENVOIE INSTALLATION : " + JSON.stringify(result));
          // on supprime le bandeau si les résultats ont bien été envoyés
          this.enleverResultatAEnvoyer();

        }, async (err) => { // on catch les erreurs potentielles
          // DEBUG
          let toast = this.toastCtrl.create({
            message: `Une erreur s'est produit à l'envoi des données, veuillez réessayer.`,
            duration: 4000
          });
          toast.present();
          console.log(JSON.stringify(err));
        })



      });
    });

  }
  // Enleve sur la page les options pour envoyer les résultats 
  private enleverResultatAEnvoyer() {
    this.zone.run(() => {
      this.state = "before";
      this.mode = "null"
    });
  }
}
