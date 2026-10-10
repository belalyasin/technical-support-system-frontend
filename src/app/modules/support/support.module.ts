import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupportRoutingModule } from './support-routing.module';
import { AccountComponent } from './pages/account/account.component';
import { ConversationsComponent } from './pages/conversations/conversations.component';
import { QuickRepliesComponent } from './pages/quick-replies/quick-replies.component';
import { UsersComponent } from './pages/users/users.component';

@NgModule({
  declarations: [
    ConversationsComponent,
    QuickRepliesComponent,
    UsersComponent,
    AccountComponent,
  ],
  imports: [CommonModule, FormsModule, SupportRoutingModule],
})
export class SupportModule {}
