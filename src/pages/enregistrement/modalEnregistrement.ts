import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular';

import { Storage } from '@ionic/storage'
import { HttpClient, HttpHeaders } from '@angular/common/http'

import { Observable } from 'rxjs/Observable'
import { LoadingController } from 'ionic-angular';
import { ToastController } from "ionic-angular";


@Component({
    templateUrl: 'modalEnregistrement.html'
})
export class modalEnregistrement {
    // resultat du formulaire de l'enregistrement
    signup = { nom: '', prenom: '', login: '', pass: '', mail: '', datenaiss: '', sexe: '' }
    // contient le résultat de l'enregistrement
    resultatEnregistrement;

    constructor(public viewCtrl: ViewController,
        private http: HttpClient,
        private storage: Storage,
        public loadingCtrl: LoadingController,
        private toastCtrl: ToastController
    ) { }

    // cacher le modal
    dismiss(msg: String) {
        this.viewCtrl.dismiss(msg);
    }


    /**
      * Simple appel à l'api pour se connecter
      */
    signupApi() {
        let loader = this.loadingCtrl.create({
            content: "Enregistrement en cours..."
        });
        loader.present();

        let nom = this.signup.nom
        let prenom = this.signup.prenom
        let login = this.signup.login
        let mail = this.signup.mail
        let pass = this.signup.pass
        let datenaiss = this.signup.datenaiss
        let sexe = this.signup.sexe

        // TODO FAIRE LA RQT D'ENREGISTREMENT
        let data: Observable<any> = this.http.post("https://www.oritrail.fr/api/signup",
            {
                login: login, password: pass, nom: nom, prenom: prenom,
                mail: mail, dateNaissance: datenaiss, sexe: sexe
            },

        )
        // ok
        data.subscribe(async result => {
            // enregistrement du token dans le stockage local
            this.storage.set('token', result[1].token);

            // on récupère toutes les informations de l'utilisateurs... 
            await this.setUserInformation(result[1].token);
            // on enleve le loader le chargement est finit
            // on enleve le loader car le chargement est finit
            this.dismiss("ok");

            let toast = this.toastCtrl.create({
                message: `Inscription réussie ! Vous êtes maintenant connecté(e) 😀`,
                duration: 3000
            });
            toast.present();

            await this.delay(1500);
            loader.dismiss()
            return result[0]
        }, (err) => { // on catch les erreurs potentielles
            // DEBUG 
            // on enleve le loader le chargement est finit
            loader.dismiss();
            let toast = this.toastCtrl.create({
                message: `L'inscription a échoué : ` + err.error.status,
                duration: 3000
            });
            toast.present();
            return err;
        })

    }


    /**
     * Récupére les informations de l'utilisateur via un appel API et les enregistre en local
     * /!\ COPIE de la fonction du modal de connexion, si modification faire sur les deux méthodes ...
     * TODO factoriser cela quelques parts pour n'utiliser qu'une seule méthode
     * @param token 
     */
    public async setUserInformation(token: String) {

        console.log("token" + token)

        // set de l'header pour la requête avec le token 
        const httpOptions = {
            headers: new HttpHeaders().set('Authorization', "Bearer " + token)
        };

        let data: Observable<any> = this.http.get("https://www.oritrail.fr/api/user",
            httpOptions
        )
        // ok
        data.subscribe(async result => {
            //console.log("DONNÉE DEPUIS LA FONCTION : "  + JSON.stringify(result))
            await this.storage.set('userInfo', result);
            console.log("REULST : " + JSON.stringify(result))
        }, async (err) => { // on catch les erreurs potentielles
            console.log("Err fetching data : " + JSON.stringify(err))
            // do nothing ... on enregistre pas le résultat
        });
    }

    async delay(ms) {
        return new Promise(function (resolve, reject) {
            setTimeout(resolve, ms);
        });
    }
}