import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ClipboardModule } from 'ngx-clipboard';
import { TranslateModule } from '@ngx-translate/core';
import { InlineSVGModule } from 'ng-inline-svg';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthServiceService } from './modules/auth/services/auth-service.service';
import { TokenInterceptor } from './modules/auth/services/token.interceptor';

/** Loads the signed-in user before the first page renders, so guards and menus know the role. */
export function appInitializer(authService: AuthServiceService) {
  return () => authService.getCurrentUser().toPromise();
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    TranslateModule.forRoot(),
    HttpClientModule,
    ClipboardModule,
    AppRoutingModule,
    InlineSVGModule.forRoot(),
    NgbModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializer,
      multi: true,
      deps: [AuthServiceService],
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
