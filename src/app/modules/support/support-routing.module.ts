import { NgModule } from '@angular/core';
import { RouterModule, Routes, UrlMatchResult, UrlSegment } from '@angular/router';
import { StaffGuard } from '../auth/services/auth.guard';
import { AccountComponent } from './pages/account/account.component';
import { ConversationsComponent } from './pages/conversations/conversations.component';
import { QuickRepliesComponent } from './pages/quick-replies/quick-replies.component';
import { UsersComponent } from './pages/users/users.component';

/**
 * Matches both `conversations` and `conversations/:uuid` with one route, so the
 * page (and its list) stays in place while moving between conversations.
 */
export function conversationsMatcher(segments: UrlSegment[]): UrlMatchResult | null {
  if (!segments.length || segments[0].path !== 'conversations' || segments.length > 2) {
    return null;
  }
  return {
    consumed: segments,
    posParams: segments.length === 2 ? { uuid: segments[1] } : {},
  };
}

const routes: Routes = [
  { matcher: conversationsMatcher, component: ConversationsComponent },
  {
    path: 'quick-replies',
    component: QuickRepliesComponent,
    canActivate: [StaffGuard],
  },
  { path: 'users', component: UsersComponent, canActivate: [StaffGuard] },
  { path: 'account', component: AccountComponent },
  { path: '', redirectTo: 'conversations', pathMatch: 'full' },
  { path: '**', redirectTo: 'conversations' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SupportRoutingModule {}
