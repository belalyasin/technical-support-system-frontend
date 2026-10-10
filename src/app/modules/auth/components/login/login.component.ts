import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { apiErrorMessage } from '../../../support/models';
import { AuthServiceService } from '../../services/auth-service.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  errorMessage = '';
  notice = '';
  isLoading = false;

  private unsubscribe: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthServiceService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: [
        this.route.snapshot.queryParamMap.get('email') || '',
        Validators.compose([
          Validators.required,
          Validators.email,
          Validators.maxLength(320),
        ]),
      ],
      password: [
        '',
        Validators.compose([Validators.required, Validators.minLength(6)]),
      ],
    });

    const reason = this.route.snapshot.queryParamMap.get('notice');
    if (reason === 'registered') {
      this.notice = 'Your account is ready. Sign in to continue.';
    } else if (reason === 'reset') {
      this.notice = 'Your password was reset. Sign in with the new one.';
    }
  }

  get f() {
    return this.loginForm.controls;
  }

  submit(): void {
    if (this.loginForm.invalid || this.isLoading) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.errorMessage = '';
    this.isLoading = true;
    const loginSubscr = this.authService
      .login(this.f.email.value, this.f.password.value)
      .subscribe(
        () => {
          this.isLoading = false;
          this.router.navigate(['/']);
        },
        (error) => {
          this.isLoading = false;
          this.errorMessage =
            error?.status === 400 || error?.status === 401
              ? 'The email or password is incorrect.'
              : apiErrorMessage(error, 'Could not sign in. Please try again.');
          this.cdr.markForCheck();
        }
      );
    this.unsubscribe.push(loginSubscr);
  }

  ngOnDestroy(): void {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
