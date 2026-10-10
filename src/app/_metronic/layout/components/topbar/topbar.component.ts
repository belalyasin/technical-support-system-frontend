import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthServiceService } from '../../../../modules/auth/services/auth-service.service';
import { LayoutService } from '../../core/layout.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent implements OnInit {
  toolbarButtonMarginClass = 'ms-1 ms-lg-3';
  toolbarUserAvatarHeightClass = 'symbol-30px symbol-md-40px';
  headerLeft: string = 'menu';
  initial$: Observable<string>;

  constructor(private layout: LayoutService, auth: AuthServiceService) {
    this.initial$ = auth.currentUser$.pipe(
      map((user) => (user?.name || '?').charAt(0).toUpperCase())
    );
  }

  ngOnInit(): void {
    this.headerLeft = this.layout.getProp('header.left') as string;
  }
}
