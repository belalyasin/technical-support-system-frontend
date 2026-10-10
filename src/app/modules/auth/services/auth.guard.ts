import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthServiceService } from './auth-service.service';

/** Lets signed-in users through; everyone else goes to the login page. */
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthServiceService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    if (this.authService.isLoggedIn()) {
      return true;
    }
    return this.router.parseUrl('/auth/login');
  }
}

/** Keeps signed-in users away from the login and sign-up pages. */
@Injectable({ providedIn: 'root' })
export class GuestGuard implements CanActivate {
  constructor(private authService: AuthServiceService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    if (!this.authService.isLoggedIn()) {
      return true;
    }
    return this.router.parseUrl('/');
  }
}

/** Pages for support staff (admin and super admin) only. */
@Injectable({ providedIn: 'root' })
export class StaffGuard implements CanActivate {
  constructor(private authService: AuthServiceService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    if (this.authService.isStaff) {
      return true;
    }
    return this.router.parseUrl('/support/conversations');
  }
}
