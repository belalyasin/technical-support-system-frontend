import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthServiceService } from '../../../../../modules/auth/services/auth-service.service';

@Component({
  selector: 'app-aside-menu',
  templateUrl: './aside-menu.component.html',
  styleUrls: ['./aside-menu.component.scss'],
})
export class AsideMenuComponent {
  isStaff$: Observable<boolean>;

  constructor(auth: AuthServiceService) {
    this.isStaff$ = auth.isStaff$;
  }
}
