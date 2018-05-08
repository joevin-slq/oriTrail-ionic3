import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

declare var GPSLocation:any;

/*
  Generated class for the GpsProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class GpsProvider {

  constructor() {
    console.log('Hello GpsProvider Provider');
  }
 
      obtenerLocacion():Promise<string>{
          return new Promise(function (resolve, reject) {
            GPSLocation.getCurrentPosition(function (data) {
              try{
                //let location = JSON.parse(data); ->not works
                resolve(data);
              }
              catch (error) {
                reject(error);
              }
            },
            function (error) {
                reject(error);
              }
            );
          });
        };
}
  
   
