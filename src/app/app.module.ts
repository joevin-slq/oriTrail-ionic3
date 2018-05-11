import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';


import { AccueilPage } from '../pages/accueil/accueil';
import { ItemDetailsPage } from '../pages/item-details/item-details';
import { ListPage } from '../pages/list/list';
import { scanManager } from '../pages/scanManager/scanManager';
import { qrCodeScan } from '../pages/qrcodescan/qrcodescan'
import { JsonTestPage } from '../pages/jsonTest/jsonTest'

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { QRScanner } from '@ionic-native/qr-scanner';
import { modalConnexionModule } from '../pages/connexion/modalConnexion.module';
import { modalEnregistrementModule } from '../pages/enregistrement/modalEnregistrement.module';


import { HttpClientModule } from '@angular/common/http'
import { Geolocation } from '@ionic-native/geolocation';
import { IonicStorageModule } from '@ionic/storage'  

import { Service } from '../utils/services'

@NgModule({
  declarations: [
    MyApp,
    AccueilPage,
    ItemDetailsPage,
    ListPage,
    qrCodeScan,
    scanManager,
    JsonTestPage
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot(),
    modalConnexionModule,
    modalEnregistrementModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    AccueilPage,
    ItemDetailsPage,
    ListPage,
    qrCodeScan,
    scanManager,
    JsonTestPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    QRScanner,
    Geolocation,  
    Service
  ]
})
export class AppModule {
}
