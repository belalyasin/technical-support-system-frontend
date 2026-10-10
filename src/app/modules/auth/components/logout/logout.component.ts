import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthServiceService } from '../../services/auth-service.service';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss'],
})
export class LogoutComponent implements OnInit {
  constructor(private authService: AuthServiceService, private router: Router) {}

  ngOnInit(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/auth/login']);
    });
  }
}
