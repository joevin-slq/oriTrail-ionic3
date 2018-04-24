  import { Component } from '@angular/core';

  import { QRScanner, QRScannerStatus } from '@ionic-native/qr-scanner';
  import { Input } from '@angular/core';
 

  @Component({
    selector: 'qrcodescan',
    templateUrl: 'qrcodescan.html'
  })
  export class QrcodeScanPage {
    @Input() mode: string;

    public state: string = "before"; //different possible states: before, config, started, baliseLoop, ..., ended, error
    //en fonction du "state" on affiche la div qui correspond

    constructor(private qrScanner : QRScanner) {
      
    } 
 
    /**
     * Scan function
     */
    qrscanner() {
 
      this.qrScanner.prepare()
      .then((status: QRScannerStatus) => {
        if (status.authorized) {

          // camera permission was granted
          console.log('camera authorized');
          this.state = "config";
 
    
          // start scanning
          let scanSub = this.qrScanner.scan().subscribe((text: string) => {
            console.log('Scanned something', text);
            console.log(text);
            this.qrScanner.hide(); // hide camera preview

            this.state = "ended";// on viens de scanner la balise end

            if(this.state == "ended"){
              scanSub.unsubscribe(); // stop scanning
            }
          });

          // select front camera 
          this.qrScanner.useBackCamera();

          this.qrScanner.resumePreview();

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

  }
