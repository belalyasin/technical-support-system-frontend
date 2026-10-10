import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { apiErrorMessage } from '../../../support/models';
import { AuthServiceService } from '../../services/auth-service.service';
import { ConfirmPasswordValidator } from './confirm-password.validator';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss'],
})
export class RegistrationComponent implements OnInit, OnDestroy {
  registrationForm: FormGroup;
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
    this.registrationForm = this.fb.group(
      {
        name: [
          '',
          Validators.compose([
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(100),
          ]),
        ],
        email: [
          '',
          Validators.compose([
            Validators.required,
            Validators.email,
            Validators.maxLength(320),
          ]),
        ],
        phone: [
          '',
          Validators.compose([
            Validators.required,
            Validators.pattern(/^[0-9]{10,15}$/),
          ]),
        ],
        password: [
          '',
          Validators.compose([
            Validators.required,
            Validators.minLength(6),
            Validators.maxLength(100),
          ]),
        ],
        cPassword: ['', Validators.compose([Validators.required])],
      },
      {
        validator: ConfirmPasswordValidator.MatchPassword,
      }
    );
  }

  get f() {
    return this.registrationForm.controls;
  }

  showError(name: string): boolean {
    const control = this.f[name];
    return control.invalid && (control.dirty || control.touched);
  }

  submit(): void {
    if (this.registrationForm.invalid || this.isLoading) {
      this.registrationForm.markAllAsTouched();
      return;
    }
    this.errorMessage = '';
    this.isLoading = true;
    const email = this.f.email.value.trim();
    const password = this.f.password.value;

    const registrationSubscr = this.authService
      .register({
        name: this.f.name.value.trim(),
        email,
        phone: this.f.phone.value.trim(),
        password,
      })
      .subscribe(
        () => {
          // The API does not sign the new user in, so do it with what they just typed
          const loginSubscr = this.authService.login(email, password).subscribe(
            () => {
              this.isLoading = false;
              this.router.navigate(['/']);
            },
            () => {
              this.isLoading = false;
              this.router.navigate(['/auth/login'], {
                queryParams: { notice: 'registered', email },
              });
            }
          );
          this.unsubscribe.push(loginSubscr);
        },
        (error) => {
          this.isLoading = false;
          this.errorMessage = apiErrorMessage(error, 'The account was not created.');
          this.cdr.markForCheck();
        }
      );
    this.unsubscribe.push(registrationSubscr);
  }

  ngOnDestroy(): void {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
