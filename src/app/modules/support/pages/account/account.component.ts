import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthServiceService } from '../../../auth/services/auth-service.service';
import { ApiUser, apiErrorMessage } from '../../models';

type Step = 'idle' | 'code';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
})
export class AccountComponent implements OnInit, OnDestroy {
  user: ApiUser | null = null;

  // Password
  password = '';
  newPassword = '';
  newPasswordConfirmation = '';
  passwordBusy = false;
  passwordError = '';
  passwordNotice = '';

  // Email
  newEmail = '';
  emailCode = '';
  emailStep: Step = 'idle';
  emailBusy = false;
  emailError = '';
  emailNotice = '';

  // Phone
  newPhone = '';
  phoneCode = '';
  phoneStep: Step = 'idle';
  phoneBusy = false;
  phoneError = '';
  phoneNotice = '';

  private subscription?: Subscription;

  constructor(private auth: AuthServiceService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.subscription = this.auth.currentUser$.subscribe((user) => {
      this.user = user;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  get roleLabel(): string {
    const roles = this.user?.roles || [];
    if (roles.includes('super admin')) {
      return 'Super admin';
    }
    return roles.includes('admin') ? 'Support agent' : 'Customer';
  }

  changePassword(): void {
    this.passwordNotice = '';
    if (!this.password || !this.newPassword) {
      this.passwordError = 'Fill in your current and new password.';
      return;
    }
    if (this.newPassword !== this.newPasswordConfirmation) {
      this.passwordError = 'The new password and its confirmation do not match.';
      return;
    }
    if (this.passwordBusy) {
      return;
    }
    this.passwordBusy = true;
    this.passwordError = '';
    this.auth
      .changePassword({
        password: this.password,
        new_password: this.newPassword,
        new_password_confirmation: this.newPasswordConfirmation,
      })
      .subscribe(
        () => {
          this.passwordBusy = false;
          this.password = '';
          this.newPassword = '';
          this.newPasswordConfirmation = '';
          this.passwordNotice = 'Your password was changed.';
          this.cdr.markForCheck();
        },
        (error) => {
          this.passwordBusy = false;
          this.passwordError = apiErrorMessage(error, 'The password was not changed.');
          this.cdr.markForCheck();
        }
      );
  }

  sendEmailCode(): void {
    const email = this.newEmail.trim();
    this.emailNotice = '';
    if (!email || this.emailBusy) {
      return;
    }
    this.emailBusy = true;
    this.emailError = '';
    this.auth.initiateEmailChange(email).subscribe(
      () => {
        this.emailBusy = false;
        this.emailStep = 'code';
        this.emailNotice = `We sent a 4-digit code to ${email}.`;
        this.cdr.markForCheck();
      },
      (error) => {
        this.emailBusy = false;
        this.emailError = apiErrorMessage(error, 'The code was not sent.');
        this.cdr.markForCheck();
      }
    );
  }

  confirmEmail(): void {
    if (this.emailBusy) {
      return;
    }
    this.emailBusy = true;
    this.emailError = '';
    this.auth.confirmEmailChange(this.newEmail.trim(), this.emailCode.trim()).subscribe(
      () => {
        this.emailBusy = false;
        this.emailStep = 'idle';
        this.newEmail = '';
        this.emailCode = '';
        this.emailNotice = 'Your email address was changed.';
        this.cdr.markForCheck();
        this.auth.getCurrentUser().subscribe();
      },
      (error) => {
        this.emailBusy = false;
        this.emailError = apiErrorMessage(error, 'The email address was not changed.');
        this.cdr.markForCheck();
      }
    );
  }

  cancelEmail(): void {
    this.emailStep = 'idle';
    this.emailCode = '';
    this.emailError = '';
    this.emailNotice = '';
  }

  sendPhoneCode(): void {
    const phone = this.newPhone.trim();
    this.phoneNotice = '';
    if (!phone || this.phoneBusy) {
      return;
    }
    this.phoneBusy = true;
    this.phoneError = '';
    this.auth.initiatePhoneChange(phone).subscribe(
      () => {
        this.phoneBusy = false;
        this.phoneStep = 'code';
        this.phoneNotice = 'We sent a 4-digit code to your email address.';
        this.cdr.markForCheck();
      },
      (error) => {
        this.phoneBusy = false;
        this.phoneError = apiErrorMessage(error, 'The code was not sent.');
        this.cdr.markForCheck();
      }
    );
  }

  confirmPhone(): void {
    if (this.phoneBusy) {
      return;
    }
    this.phoneBusy = true;
    this.phoneError = '';
    this.auth.confirmPhoneChange(this.newPhone.trim(), this.phoneCode.trim()).subscribe(
      () => {
        this.phoneBusy = false;
        this.phoneStep = 'idle';
        this.newPhone = '';
        this.phoneCode = '';
        this.phoneNotice = 'Your phone number was changed.';
        this.cdr.markForCheck();
        this.auth.getCurrentUser().subscribe();
      },
      (error) => {
        this.phoneBusy = false;
        this.phoneError = apiErrorMessage(error, 'The phone number was not changed.');
        this.cdr.markForCheck();
      }
    );
  }

  cancelPhone(): void {
    this.phoneStep = 'idle';
    this.phoneCode = '';
    this.phoneError = '';
    this.phoneNotice = '';
  }
}
