import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular'; 

import { Storage } from '@ionic/storage'
import { HttpClient } from '@angular/common/http'  

import { Observable } from 'rxjs/Observable'
import { ModalController } from 'ionic-angular';
import { LoadingController } from 'ionic-angular';
 

@Component({
  templateUrl: 'modalConnexion.html'
})
export class modalConnexion {
    // resultat du formulaire de connexion
    login = {id: '', pass: ''}
    // contient le résultat de la connexion
    resultatConnexion;

  constructor(public viewCtrl: ViewController,
              private http: HttpClient,
              private storage: Storage,
              public loadingCtrl: LoadingController  
            ) {}

  dismiss() {
    this.viewCtrl.dismiss();
  }


   /**
     * Simple appel à l'api pour se connecter
     */
    loginApi() { 
        let loader = this.loadingCtrl.create({
            content: "Connexion en cours..."
          });
          loader.present();
        
        let id = this.login.id
        let pass = this.login.pass

        let data:Observable<any> = this.http.post("https://www.oritrail.fr/api/token/create", 
              { login: id, password: pass },
                
        )
           // ok
         data.subscribe(async result => { 
            // TODO sauvegarder le token dans le Sotage
            // DEBUG
            console.log(result[0].status)
            console.log(result[0].token) 
            // on enleve le loader le chargement est finit
            loader.dismiss();

            this.resultatConnexion="<h5> Connexion réussie ! Redirection en cours ... </h5>";
            await this.delay(1500);
            this.dismiss()
            return result[0] 
        }, (err) => { // on catch les erreurs potentielles
            // DEBUG
            console.log(JSON.stringify(err))
            // on enleve le loader le chargement est finit
            loader.dismiss();  
            if(err.status == 401) {
                this.resultatConnexion="<h5> Connexion échouée ! Identifiant et/ou mot de passe incorrect.</h5>";
            }
                return err
        }) 
   
    }
 
  
    async delay(ms) {
        return new Promise(function (resolve, reject) {
            setTimeout(resolve, ms);
        });
    }
}