  import { Component, NgZone } from '@angular/core';
  import { QRScanner, QRScannerStatus } from '@ionic-native/qr-scanner';
  import { Events } from 'ionic-angular'
import { Subscription } from 'rxjs/Subscription';


  @Component({
    selector: 'qrcodescan',
    templateUrl: 'qrcodescan.html'
  })
  export class qrCodeScan {

    private scanSubscription: Subscription;

    constructor(private qrScanner : QRScanner, private events: Events, public zone: NgZone) {
      console.log("qrCodeScan constructor...");
      events.subscribe("scanManager:stopScanning", ()=>{this.stopScanning()});
      events.subscribe("scanManager:startScanning", ()=>{this.startScanning()});
      this.zone.run(() => {
        //run the code that should update the view
      });
    }

    /**
     * Scan function
     */
    public startScanning() {
      console.log("qrcodescan.startScanning()");
      this.qrScanner.prepare()
      .then((status: QRScannerStatus) => {
        if (status.authorized) {

          // camera permission was granted
          console.log('camera authorized');

          // start scanning
          this.scanSubscription = this.qrScanner.scan().subscribe((text: string) => {
            console.log('Scanned something', text);
            // this.callback.emit(text); //send the info to the scanManager
            this.events.publish("qrcodescan:newqr", text);
          });

          // select front camera
          this.qrScanner.useBackCamera();

          this.qrScanner.resumePreview();

          // Permet d'avoir la preview sur iOS
          // https://forum.ionicframework.com/t/ionic-qr-code-scan-not-opening-camera-for-ios-and-android-devices/101512/23 => Zerok aug 17'
          // et https://forum.ionicframework.com/t/qr-scanner-seems-to-be-working-in-the-background-but-doesnt-display-a-preview-when-calling-show/99822/5
          window.document.querySelector('ion-app').classList.add('cameraView')
          // show camera preview
          this.qrScanner.show();

          // wait for user to scan something, then the observable callback will be called

        } else if (status.denied) {
          console.log('denied');
          // camera permission was permanently denied
          // you must use QRScanner.openSettings() method to guide the user to the settings page
          // then they can grant the permission from there
        } else {
          // permission was denied, but not permanently. You can ask for permission again at a later time.
          console.log('else');
        }
      })
      .catch((e: any) => {
        console.log('Error is' + e);
      });
    }

    public stopScanning(){
      this.qrScanner.hide(); // hide camera preview
      if(this.scanSubscription != undefined){
        this.scanSubscription.unsubscribe(); // stop scanning
      }
      // cf startScanning (on enleve la cameraView (preview))
      window.document.querySelector('ion-app').classList.remove('cameraView')
      console.log("scan stopped");

      //la camera continue de tourner quand meme donc on détruit l'objet
      this.qrScanner.destroy();
    }

  }
