import { Component, HostBinding } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthServiceService } from '../../../../../../modules/auth/services/auth-service.service';
import { ApiUser } from '../../../../../../modules/support/models';

@Component({
  selector: 'app-user-inner',
  templateUrl: './user-inner.component.html',
})
export class UserInnerComponent {
  @HostBinding('class')
  class = `menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg menu-state-primary fw-bold py-4 fs-6 w-275px`;
  @HostBinding('attr.data-kt-menu') dataKtMenu = 'true';

  user$: Observable<ApiUser | null>;

  constructor(private auth: AuthServiceService, private router: Router) {
    this.user$ = this.auth.currentUser$;
  }

  roleLabel(roles: string[] | undefined): string {
    if (roles?.includes('super admin')) {
      return 'Super admin';
    }
    return roles?.includes('admin') ? 'Support agent' : 'Customer';
  }

  logout(): void {
    this.auth.logout().subscribe(() => {
      this.router.navigate(['/auth/login']);
    });
  }
}
