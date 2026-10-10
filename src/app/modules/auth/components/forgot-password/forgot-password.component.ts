import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { apiErrorMessage } from '../../../support/models';
import { AuthServiceService } from '../../services/auth-service.service';

/**
 * Two steps: ask for a reset code by email, then set a new password with it.
 */
@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  emailForm: FormGroup;
  resetForm: FormGroup;
  step: 'email' | 'reset' = 'email';
  email = '';
  errorMessage = '';
  isLoading = false;

  private unsubscribe: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthServiceService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.emailForm = this.fb.group({
      email: [
        '',
        Validators.compose([
          Validators.required,
          Validators.email,
          Validators.maxLength(320),
        ]),
      ],
    });
    this.resetForm = this.fb.group({
      code: [
        '',
        Validators.compose([Validators.required, Validators.pattern(/^[0-9]{4}$/)]),
      ],
      password: [
        '',
        Validators.compose([Validators.required, Validators.minLength(6)]),
      ],
      cPassword: ['', Validators.compose([Validators.required])],
    });
  }

  showError(form: FormGroup, name: string): boolean {
    const control = form.controls[name];
    return control.invalid && (control.dirty || control.touched);
  }

  get passwordsDiffer(): boolean {
    const controls = this.resetForm.controls;
    return (
      (controls.cPassword.dirty || controls.cPassword.touched) &&
      controls.password.value !== controls.cPassword.value
    );
  }

  requestCode(): void {
    if (this.emailForm.invalid || this.isLoading) {
      this.emailForm.markAllAsTouched();
      return;
    }
    this.errorMessage = '';
    this.isLoading = true;
    const email = this.emailForm.controls.email.value.trim();
    const subscr = this.authService.forgotPassword(email).subscribe(
      () => {
        this.isLoading = false;
        this.email = email;
        this.step = 'reset';
        this.cdr.markForCheck();
      },
      (error) => {
        this.isLoading = false;
        this.errorMessage =
          error?.status === 429
            ? 'Too many attempts. Wait a minute and try again.'
            : apiErrorMessage(error, 'The code was not sent.');
        this.cdr.markForCheck();
      }
    );
    this.unsubscribe.push(subscr);
  }

  resetPassword(): void {
    const controls = this.resetForm.controls;
    if (
      this.resetForm.invalid ||
      controls.password.value !== controls.cPassword.value ||
      this.isLoading
    ) {
      this.resetForm.markAllAsTouched();
      return;
    }
    this.errorMessage = '';
    this.isLoading = true;
    const subscr = this.authService
      .resetPassword({
        email: this.email,
        code: controls.code.value,
        password: controls.password.value,
        password_confirmation: controls.cPassword.value,
      })
      .subscribe(
        () => {
          this.isLoading = false;
          this.router.navigate(['/auth/login'], {
            queryParams: { notice: 'reset', email: this.email },
          });
        },
        (error) => {
          this.isLoading = false;
          this.errorMessage =
            error?.status === 429
              ? 'Too many attempts. Wait a minute and try again.'
              : apiErrorMessage(error, 'The password was not reset.');
          if (this.errorMessage === 'reset code error, try again') {
            this.errorMessage = 'That code is wrong or has expired.';
          }
          this.cdr.markForCheck();
        }
      );
    this.unsubscribe.push(subscr);
  }

  startOver(): void {
    this.step = 'email';
    this.errorMessage = '';
    this.resetForm.reset();
  }

  ngOnDestroy(): void {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
