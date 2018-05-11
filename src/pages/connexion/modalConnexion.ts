import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular'; 

import { Storage } from '@ionic/storage'
import { HttpClient } from '@angular/common/http'  

import { Observable } from 'rxjs/Observable'
import { LoadingController } from 'ionic-angular';
import { ViewEncapsulation } from '@angular/core'
 
 
@Component({ 
  templateUrl: 'modalConnexion.html',
  encapsulation: ViewEncapsulation.None
})
export class modalConnexion {
    // resultat du formulaire de connexion
    login = {id: '', pass: ''}
    // contient le résultat de la connexion
    resultatConnexion;
    // connexion échouée ou pas 
    connexionStatus;

  constructor(public viewCtrl: ViewController,
              private http: HttpClient,
              private storage: Storage,
              public loadingCtrl: LoadingController  
            ) {}


   // cacher le modal
  dismiss() {
    this.viewCtrl.dismiss();
  }

  public getConnexionStatusColor() {
      if(this.connexionStatus == true) {
          return "green"
      } else {
          return "red"
      }
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

            // TODO check si l'enregistrement de la token est effectif ou non
            this.storage.set('token', result[0].token);

            // DEBUG
            console.log(result[0].status)
            console.log(result[0].token) 
            // on enleve le loader le chargement est finit
            loader.dismiss();
            // pour set la couleur du résultat de connexion 
            this.connexionStatus = true;

            this.resultatConnexion="<h5> Connexion réussie ! Redirection en cours ... </h5>";

            // on revient à la page courrante
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
               
            } else {
                this.resultatConnexion="<h5> Erreur innatendue ! Veuillez réessayer.</h5>";
            }
            this.connexionStatus = false;
            return err
        }) 
   
    }
 
  
    async delay(ms) {
        return new Promise(function (resolve, reject) {
            setTimeout(resolve, ms);
        });
    }
}