import { Routes } from '@angular/router';

const Routing: Routes = [
  {
    path: 'support',
    loadChildren: () =>
      import('../modules/support/support.module').then((m) => m.SupportModule),
  },
  {
    path: '',
    redirectTo: '/support/conversations',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'error/404',
  },
];

export { Routing };
