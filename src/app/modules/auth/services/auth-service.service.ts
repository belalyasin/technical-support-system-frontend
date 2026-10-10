import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ApiUser, STAFF_ROLES } from '../../support/models';

const TOKEN_KEY = 'token';

/**
 * Talks to the Technical Support System API for everything about the signed-in
 * account and keeps the current user in memory for the rest of the app.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthServiceService {
  private authApi = environment.apiBaseUrl;
  private userSubject = new BehaviorSubject<ApiUser | null>(null);

  currentUser$: Observable<ApiUser | null> = this.userSubject.asObservable();
  isStaff$: Observable<boolean> = this.currentUser$.pipe(
    map((user) => AuthServiceService.userIsStaff(user))
  );

  constructor(private http: HttpClient) {}

  static userIsStaff(user: ApiUser | null): boolean {
    return !!user?.roles?.some((role) => STAFF_ROLES.includes(role as any));
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get currentUser(): ApiUser | null {
    return this.userSubject.value;
  }

  get isStaff(): boolean {
    return AuthServiceService.userIsStaff(this.currentUser);
  }

  get isSuperAdmin(): boolean {
    return !!this.currentUser?.roles?.includes('super admin');
  }

  isLoggedIn(): boolean {
    return this.token !== null;
  }

  login(email: string, password: string): Observable<ApiUser> {
    return this.http
      .post<any>(`${this.authApi}/login`, { email, password })
      .pipe(
        map((res) => {
          localStorage.setItem(TOKEN_KEY, res.token);
          const user: ApiUser = {
            id: res.user.id,
            name: res.user.name,
            email: res.user.email,
            phone: res.user.phone,
            roles: res.roles || [],
          };
          this.userSubject.next(user);
          return user;
        })
      );
  }

  /** Public sign-up. The API always creates a customer account. */
  register(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.authApi}/register`, data);
  }

  /** Revokes the token on the server; the local session is cleared either way. */
  logout(): Observable<any> {
    if (!this.isLoggedIn()) {
      this.clearSession();
      return of(null);
    }
    return this.http.post<any>(`${this.authApi}/logout`, {}).pipe(
      catchError(() => of(null)),
      finalize(() => this.clearSession())
    );
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.userSubject.next(null);
  }

  /** Loads the signed-in user from the API. Emits null when there is no valid session. */
  getCurrentUser(): Observable<ApiUser | null> {
    if (!this.isLoggedIn()) {
      return of(null);
    }
    return this.http.get<any>(`${this.authApi}/current-user`).pipe(
      map((res) => res.data as ApiUser),
      tap((user) => this.userSubject.next(user)),
      catchError(() => of(null))
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.authApi}/forgot-password`, { email });
  }

  resetPassword(data: {
    email: string;
    code: string;
    password: string;
    password_confirmation: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.authApi}/reset-password`, data);
  }

  changePassword(data: {
    password: string;
    new_password: string;
    new_password_confirmation: string;
  }): Observable<any> {
    return this.http.put<any>(`${this.authApi}/change-password`, data);
  }

  initiateEmailChange(new_email: string): Observable<any> {
    return this.http.post<any>(`${this.authApi}/initiateEmailChange`, {
      new_email,
    });
  }

  confirmEmailChange(new_email: string, code: string): Observable<any> {
    return this.http.post<any>(`${this.authApi}/confirmEmailChange`, {
      new_email,
      code,
    });
  }

  initiatePhoneChange(new_phone: string): Observable<any> {
    return this.http.post<any>(`${this.authApi}/initiatePhoneChange`, {
      new_phone,
    });
  }

  confirmPhoneChange(new_phone: string, code: string): Observable<any> {
    return this.http.post<any>(`${this.authApi}/confirmPhoneChange`, {
      new_phone,
      code,
    });
  }
}
