  import { Component } from '@angular/core';

  //import { Input } from '@angular/core';

  import { Storage } from '@ionic/storage'
  import { HttpClient } from '@angular/common/http' 
  import { AlertController } from 'ionic-angular';

  import { Observable } from 'rxjs/Observable'
  import { AppModule } from '../../app/app.module';
 

  @Component({
    selector: 'jsonTest',
    templateUrl: 'jsonTest.html'
  })
  export class JsonTestPage {

    

    public state: string = "before"; //different possible states: before, config, started, baliseLoop, ..., ended, error
    //en fonction du "state" on affiche la div qui correspond

    constructor(private storage : Storage,
                private  http:HttpClient,
                private alertCtrl: AlertController) {
      
    } 

    /**
     * Simple appel à l'api
     */
    callApi() {
       
    }

    


    /**
     * Enregistre les données passées en params dans un fichier JSON
     * @param key la clef 
     * @param value la valeur
     */
    saveData(key:string, value:string) {
      this.storage.set(key, value);
    }

    /**
     * Retourne la valeur de la clef (index) dans le fichier JSON
     * @param key la clef
     */
    loadData(key:string) {
      return this.storage.get(key);
    }
 

  }
