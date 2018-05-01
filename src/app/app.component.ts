import { Component, ViewChild } from '@angular/core';

import { Platform, MenuController, Nav } from 'ionic-angular';

import { AccueilPage } from '../pages/accueil/accueil';
import { ListPage } from '../pages/list/list';
import { QrcodeScanPage } from '../pages/qrcodescan/qrcodescan';
import { JsonTestPage } from '../pages/jsonTest/jsonTest';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
 


@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  // make HelloIonicPage the root (or first) page
  rootPage = AccueilPage;
  pages: Array<{title: string, component: any}>;

  constructor(
    public platform: Platform,
    public menu: MenuController,
    public statusBar: StatusBar,
    public splashScreen: SplashScreen
  ) {
    this.initializeApp();

    // set our app's pages
    this.pages = [
      { title: 'Accueil', component: AccueilPage },
      { title: 'My First List', component: ListPage },
      { title: 'QRcode Test', component: QrcodeScanPage},
      { title: 'Json Test', component: JsonTestPage}
    ];
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      // Load QR Code plugins
      // Optionally request the permission early
      // Optionally request the permission early
      
      // default
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }

  openPage(page) {
    // close the menu when clicking a link from the menu
    this.menu.close();
    // navigate to the new page if it is not the current page
    this.nav.setRoot(page.component);
  }
}
