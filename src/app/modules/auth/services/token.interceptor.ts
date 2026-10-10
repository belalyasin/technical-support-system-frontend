import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthServiceService } from './auth-service.service';

/**
 * Sends the API token with every request to the API and signs the user out
 * when the API says the token is no longer valid.
 */
@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(private auth: AuthServiceService, private router: Router) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (!req.url.startsWith(environment.apiBaseUrl)) {
      return next.handle(req);
    }

    const headers: { [name: string]: string } = { Accept: 'application/json' };
    const token = this.auth.token;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return next.handle(req.clone({ setHeaders: headers })).pipe(
      catchError((error: HttpErrorResponse) => {
        const isLogin = req.url.endsWith('/login');
        if (error.status === 401 && token && !isLogin) {
          this.auth.clearSession();
          this.router.navigate(['/auth/login']);
        }
        return throwError(error);
      })
    );
  }
}
