import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthServiceService } from '../../../../../modules/auth/services/auth-service.service';

@Component({
  selector: 'app-header-menu',
  templateUrl: './header-menu.component.html',
  styleUrls: ['./header-menu.component.scss'],
})
export class HeaderMenuComponent {
  isStaff$: Observable<boolean>;

  constructor(auth: AuthServiceService) {
    this.isStaff$ = auth.isStaff$;
  }
}
