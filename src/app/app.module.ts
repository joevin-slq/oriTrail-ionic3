import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';


import { AccueilPage } from '../pages/accueil/accueil';
import { ItemDetailsPage } from '../pages/item-details/item-details';
import { ListPage } from '../pages/list/list'; 
import { QrcodeScanPage } from '../pages/qrcodescan/qrcodescan'
import { JsonTestPage } from '../pages/jsonTest/jsonTest'
import { modalConnexionModule } from '../pages/connexion/modalConnexion.module';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { QRScanner } from '@ionic-native/qr-scanner'; 

import { HttpClientModule } from '@angular/common/http'

import { IonicStorageModule } from '@ionic/storage' 

@NgModule({
  declarations: [
    MyApp,
    AccueilPage,
    ItemDetailsPage,
    ListPage,
    QrcodeScanPage,
    JsonTestPage,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot(),
    modalConnexionModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    AccueilPage,
    ItemDetailsPage,
    ListPage,
    QrcodeScanPage,  
    JsonTestPage,
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    QRScanner
  ]
})
export class AppModule { 
}
