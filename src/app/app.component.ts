import { Component, ViewChild } from "@angular/core";

import { Platform, NavController } from "ionic-angular";

import { AccueilPage } from "../pages/accueil/accueil";

import { StatusBar } from "@ionic-native/status-bar";
import { SplashScreen } from "@ionic-native/splash-screen";

@Component({
  templateUrl: "app.html"
})
export class MyApp {
  @ViewChild("nav") nav: NavController;

  // make HelloIonicPage the root (or first) page
  rootPage = AccueilPage;
  pages: Array<{ title: string; component: any }>;

  constructor(
    public platform: Platform,
    public statusBar: StatusBar,
    public splashScreen: SplashScreen
  ) {
    this.initializeApp();

  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      // Load QR Code plugins
      // Optionally request the permission early

      // default
      this.statusBar.styleBlackTranslucent();
      this.splashScreen.hide();
    });
  }

  openPage(page) {
    // navigate to the new page if it is not the current page
    this.nav.setRoot(page.component);
  }
}
