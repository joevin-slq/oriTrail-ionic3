import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable'; 
import 'rxjs/add/operator/map';

declare var AdvancedGeolocation: any;

@Injectable()
export class Service {

  constructor() { }

  getTime(): Promise<any> {
    return new Promise(function (resolve, reject) {
      AdvancedGeolocation.start(function (data) {
        try {
          let location = JSON.parse(data);
          resolve(location.timestamp);
        }
        catch (error) {
          reject(error);
        }
      }.bind(this), // bind explicitly to this
        function (error) {
          reject(error);
        }, {
          "minTime": 500, // Min time interval between updates (ms)
          "minDistance": 1, // Min distance between updates (meters)
          "noWarn": true, // Native location provider warnings
          "providers": "all", // Return GPS, NETWORK and CELL locations
          "useCache": true, // Return GPS and NETWORK cached locations
          "satelliteData": false, // Return of GPS satellite info
          "buffer": false, // Buffer location data
          "bufferSize": 0, // Max elements in buffer
          "signalStrength": false // Return cell signal strength data
        });
    }.bind(this));
  };

  stopTime(): Promise<any> {
    return new Promise((resolve, reject) => {
      AdvancedGeolocation.stop(
        function (success) {
          var jsonObject = JSON.parse(success);
          resolve(JSON.stringify(jsonObject.stopLocation));
        },
        function (error) {
          reject(JSON.stringify(error));
        },
      );
    })
  };

}