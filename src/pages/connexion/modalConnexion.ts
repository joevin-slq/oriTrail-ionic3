import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular';

import { Storage } from '@ionic/storage'
import { HttpClient, HttpHeaders } from '@angular/common/http'

import { Observable } from 'rxjs/Observable'
import { LoadingController } from 'ionic-angular';
import { ViewEncapsulation } from '@angular/core'
import { ToastController } from "ionic-angular";


@Component({
    templateUrl: 'modalConnexion.html',
    encapsulation: ViewEncapsulation.None
})
export class modalConnexion {
    // resultat du formulaire de connexion
    login = { id: '', pass: '' } 

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
    public async loginApi() {
        let loader = this.loadingCtrl.create({
            content: "Connexion en cours..."
        });
        loader.present();

        let id = this.login.id
        let pass = this.login.pass

        let data: Observable<any> = await this.http.post("https://www.oritrail.fr/api/token/create",
            { login: id, password: pass },

        )
        // ok
        data.subscribe(async result => { 
            // enregistrement du token dans le stockage local
            this.storage.set('token', result[1].token);

            // on récupère toutes les informations de l'utilisateurs... dans le storage userInfo
            await this.setUserInformation(result[1].token);
 
            // on enleve le loader car le chargement est finit
            this.dismiss("ok");

            let toast = this.toastCtrl.create({
                message: `Connexion réussie !`,
                duration: 3000
            });
            toast.present();


            // on revient à la page courrante
            await this.delay(1500);
            loader.dismiss()
            return result[0]

        }, async (err) => { // on catch les erreurs potentielles
            // DEBUG
            // console.log(JSON.stringify(err))
            // on enleve le loader le chargement est finit
            loader.dismiss(); 
            if (err.status == 401) {
                let toast = this.toastCtrl.create({
                    message: `Connexion échouée ! Identifiant et/ou mot de passe incorrect.`,
                    duration: 3000
                });
                toast.present();
            } else {
                let toast = this.toastCtrl.create({
                    message: `Connexion échouée : ` +  err.error.status ,
                    duration: 3000
                });
                toast.present(); 
            }
            return err
        })

    }

    /**
     * Récupére les informations de l'utilisateur via un appel API et les enregistre en local
     * /!\ COPIE de la fonction du modal de connexion, si modification faire sur les deux méthodes ...
     * TODO factoriser cela quelques parts pour n'utiliser qu'une seule méthode
     * @param token 
     */
    public async setUserInformation(token: String) {

        // set de l'header pour la requête avec le token 
        const httpOptions = {
            headers: new HttpHeaders().set('Authorization', "Bearer " + token)
        };

        let data: Observable<any> = await this.http.get("https://www.oritrail.fr/api/user",
            httpOptions
        )
        // ok
        data.subscribe(async result => {
            //console.log("DONNÉE DEPUIS LA FONCTION : "  + JSON.stringify(result))
            await this.storage.set('userInfo', result);
        }, async (err) => { // on catch les erreurs potentielles
            console.log("Err fetching data")
            // do nothing ... on enregistre pas le résultat
        });
    }

    async delay(ms) {
        return new Promise(function (resolve, reject) {
            setTimeout(resolve, ms);
        });
    }
}