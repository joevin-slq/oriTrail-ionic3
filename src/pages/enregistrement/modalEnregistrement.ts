import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular'; 

import { Storage } from '@ionic/storage'
import { HttpClient } from '@angular/common/http'  

import { Observable } from 'rxjs/Observable'
import { LoadingController } from 'ionic-angular';
 

@Component({
  templateUrl: 'modalEnregistrement.html'
})
export class modalEnregistrement {
    // resultat du formulaire de l'enregistrement
    signup = {nom: '', prenom: '', id: '', pass: '', confirm_pass: ''}
    // contient le résultat de l'enregistrement
    resultatEnregistrement;

  constructor(public viewCtrl: ViewController,
              private http: HttpClient,
              private storage: Storage,
              public loadingCtrl: LoadingController  
            ) {}

  // cacher le modal
  dismiss() {
    this.viewCtrl.dismiss();
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
        let id = this.signup.id
        let pass = this.signup.pass
        let confirm_pass = this.signup.confirm_pass

        // TODO FAIRE LA RQT D'ENREGISTREMENT
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

            this.resultatEnregistrement="<h5> Enregistrement réussi ! Redirection en cours ... </h5>";
            await this.delay(1500);
            this.dismiss()
            return result[0] 
        }, (err) => { // on catch les erreurs potentielles
            // DEBUG
            console.log(JSON.stringify(err))
            // on enleve le loader le chargement est finit
            loader.dismiss();  
            if(err.status == 401) {
                this.resultatEnregistrement="<h5> Enregistrement échoué ! Identifiant et/ou mot de passe incorrect.</h5>";
            } else {
                this.resultatEnregistrement="<h5> Erreur innatendue ! Veuillez réessayer.</h5>";
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