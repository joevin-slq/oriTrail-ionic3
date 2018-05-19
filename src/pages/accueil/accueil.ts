import { Component, NgZone } from "@angular/core";

import { Storage } from "@ionic/storage";
import { HttpClient } from "@angular/common/http";

import { Observable } from "rxjs/Observable";
import { ModalController, NavController, NavParams, ViewController } from "ionic-angular";

import { modalConnexion } from "../connexion/modalConnexion";
import { modalEnregistrement } from "../enregistrement/modalEnregistrement";
import { scanManager } from "../scanManager/scanManager";
import { ViewEncapsulation } from '@angular/core'
 

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
        if(val != null) {
          this.userInfo =  "Bienvenu " + val.prenom + " "  + val.nom
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
            console.log("INFO CONNEXION : " + JSON.stringify(val) )
            this.userInfo =  "Bienvenu " + val.prenom + " "  + val.nom
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
      this.storage.get('resultat').then((resultat) => {
        // TODO appel api
        console.log("RESULTAT BRUT  : " + JSON.stringify(resultat, null, 4));
        // on renomme les champs pour que l'api puissent les interpréter
        let toSend = resultat;
        toSend.id_course = toSend.nom;
        delete toSend.nom;

        this.storage.get('userInfo').then((val) => { 
          toSend.id_user  =  val.id_user
        });

        // on effectue la rqt
        let data:Observable<any> = this.http.post("https://www.oritrail.fr/api/install", 
              { toSend },
                
        )
           // ok
         data.subscribe(async result => { 
            // TODO sauvegarder le token dans le Sotage 

            console.log(JSON.stringify(result));

        }, async (err) => { // on catch les erreurs potentielles
            // DEBUG
            console.log(JSON.stringify(err)) ;
        }) 
        

        // on supprime le bandeau si les résultats ont bien été envoyés
        this.enleverResultatAEnvoyer();
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
