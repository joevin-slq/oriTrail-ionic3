import { IonicStorageModule } from '@ionic/storage';




  export class JsonHelper {
    constructor(private storage: Storage) { 

        let json = { "name":"John", "age":30, "car":null };
 
    }
  
    
    loadData(jsonFileName) {
        // show json data (debug)
        this.storage.get('my-json').then((val) => {
            console.log('Your json is', val);
        });

        // retourne les valeurs du fichier
        return this.storage.get(jsonFileName)
    }

    saveData(jsonFileName, data) {
        this.storage.set(jsonFileName, data);

    }
    
  
  
  }