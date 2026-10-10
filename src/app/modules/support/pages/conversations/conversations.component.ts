import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, fromEvent, interval, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AuthServiceService } from '../../../auth/services/auth-service.service';
import {
  ApiUser,
  apiErrorMessage,
  ChatMessage,
  Conversation,
  DefaultMessage,
} from '../../models';
import { SupportApiService } from '../../services/support-api.service';

const POLL_EVERY_MS = 5000;

@Component({
  selector: 'app-conversations',
  templateUrl: './conversations.component.html',
})
export class ConversationsComponent implements OnInit, OnDestroy {
  @ViewChild('thread') thread?: ElementRef<HTMLElement>;

  readonly maxLength = 255;
  isStaff = false;

  // Conversation list
  conversations: Conversation[] = [];
  loadedPages = 1;
  lastPage = 1;
  listLoading = true;
  listError = '';

  // Open conversation
  activeUuid: string | null = null;
  active: Conversation | null = null;
  messages: ChatMessage[] = [];
  threadLoading = false;
  threadError = '';
  draft = '';
  sending = false;
  sendError = '';
  confirmingDelete = false;
  deleting = false;

  // New conversation form
  showNew = false;
  creating = false;
  newError = '';
  newName = '';
  newBody = '';
  newCustomerId: number | null = null;
  customerSearch = '';
  customers: ApiUser[] = [];

  // Quick replies, for staff
  quickReplies: DefaultMessage[] = [];

  private messagesLastPage = 1;
  private listBusy = false;
  private threadBusy = false;
  private customerSearch$ = new Subject<string>();
  private subscriptions: Subscription[] = [];

  constructor(
    private api: SupportApiService,
    private auth: AuthServiceService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isStaff = this.auth.isStaff;

    this.subscriptions.push(
      this.route.paramMap.subscribe((params) => {
        const uuid = params.get('uuid');
        if (uuid) {
          this.openThread(uuid);
        } else {
          this.closeThread();
        }
      })
    );

    this.loadList();

    if (this.isStaff) {
      this.api.allDefaultMessages().subscribe(
        (items) => {
          this.quickReplies = items;
          this.cdr.markForCheck();
        },
        () => {}
      );
      this.subscriptions.push(
        this.customerSearch$
          .pipe(debounceTime(300), distinctUntilChanged())
          .subscribe((term) => this.loadCustomers(term))
      );
    }

    // Keep the open thread and the list fresh. The API allows 60 requests a minute
    // per user, so the list is polled half as often and a hidden tab does not poll.
    this.subscriptions.push(
      interval(POLL_EVERY_MS).subscribe((tick) => {
        if (document.hidden) {
          return;
        }
        this.refreshThread();
        if (tick % 2 === 1) {
          this.loadList(true);
        }
      })
    );
    this.subscriptions.push(
      fromEvent(document, 'visibilitychange').subscribe(() => {
        if (!document.hidden) {
          this.loadList(true);
          this.refreshThread();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  // List

  loadList(silent = false): void {
    if (this.listBusy) {
      return;
    }
    this.listBusy = true;
    if (!silent) {
      this.listLoading = true;
    }
    this.api.conversationsUpTo(this.loadedPages).subscribe(
      (result) => {
        this.conversations = result.items.map((item) =>
          item.uuid === this.activeUuid ? { ...item, unread_count: 0 } : item
        );
        this.lastPage = result.lastPage;
        this.listError = '';
        this.listLoading = false;
        this.listBusy = false;
        this.cdr.markForCheck();
      },
      (error) => {
        if (!silent || !this.conversations.length) {
          this.listError = apiErrorMessage(error, 'Could not load conversations.');
        }
        this.listLoading = false;
        this.listBusy = false;
        this.cdr.markForCheck();
      }
    );
  }

  loadMore(): void {
    if (this.loadedPages < this.lastPage) {
      this.loadedPages++;
      this.loadList();
    }
  }

  select(conversation: Conversation): void {
    this.router.navigate(['/support/conversations', conversation.uuid]);
  }

  title(conversation: Conversation): string {
    return conversation.name || 'Support request';
  }

  trackByUuid(_: number, conversation: Conversation): string {
    return conversation.uuid;
  }

  trackById(_: number, message: ChatMessage): number {
    return message.id;
  }

  // Thread

  private openThread(uuid: string): void {
    this.activeUuid = uuid;
    this.active = null;
    this.messages = [];
    this.messagesLastPage = 1;
    this.threadError = '';
    this.sendError = '';
    this.draft = '';
    this.confirmingDelete = false;
    this.threadLoading = true;
    this.threadBusy = true;

    forkJoin([this.api.conversation(uuid), this.api.messagesFrom(uuid, 1)]).subscribe(
      ([conversation, result]) => {
        if (this.activeUuid !== uuid) {
          return;
        }
        this.active = conversation;
        this.messages = result.items;
        this.messagesLastPage = result.lastPage;
        this.threadLoading = false;
        this.threadBusy = false;
        this.markReadInList(uuid);
        this.cdr.markForCheck();
        this.scrollToBottom();
      },
      (error) => {
        if (this.activeUuid !== uuid) {
          return;
        }
        this.threadError =
          error?.status === 404
            ? 'This conversation no longer exists.'
            : apiErrorMessage(error, 'Could not open the conversation.');
        this.threadLoading = false;
        this.threadBusy = false;
        this.cdr.markForCheck();
      }
    );
  }

  private closeThread(): void {
    this.activeUuid = null;
    this.active = null;
    this.messages = [];
    this.threadError = '';
    this.threadLoading = false;
    this.cdr.markForCheck();
  }

  private refreshThread(): void {
    const uuid = this.activeUuid;
    if (!uuid || !this.active || this.threadBusy) {
      return;
    }
    this.threadBusy = true;
    this.api.messagesFrom(uuid, this.messagesLastPage).subscribe(
      (result) => {
        this.threadBusy = false;
        if (this.activeUuid !== uuid) {
          return;
        }
        this.messagesLastPage = result.lastPage;
        if (this.mergeMessages(result.items)) {
          this.markReadInList(uuid);
          this.cdr.markForCheck();
          this.scrollToBottom();
        }
      },
      () => {
        this.threadBusy = false;
      }
    );
  }

  /** Adds messages that are not on screen yet. Returns true when something was added. */
  private mergeMessages(incoming: ChatMessage[]): boolean {
    const known = new Set(this.messages.map((message) => message.id));
    const added = incoming.filter((message) => !known.has(message.id));
    if (!added.length) {
      return false;
    }
    this.messages = this.messages
      .concat(added)
      .sort((a, b) => a.id - b.id);
    return true;
  }

  private markReadInList(uuid: string): void {
    this.conversations = this.conversations.map((item) =>
      item.uuid === uuid ? { ...item, unread_count: 0 } : item
    );
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const element = this.thread?.nativeElement;
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    });
  }

  useQuickReply(id: string): void {
    const reply = this.quickReplies.find((item) => String(item.id) === id);
    if (reply) {
      this.draft = reply.body;
    }
  }

  onEnter(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (!keyboardEvent.shiftKey) {
      keyboardEvent.preventDefault();
      this.send();
    }
  }

  send(): void {
    const uuid = this.activeUuid;
    const body = this.draft.trim();
    if (!uuid || !body || this.sending) {
      return;
    }
    this.sending = true;
    this.sendError = '';
    this.api.sendMessage(uuid, body).subscribe(
      (message) => {
        this.sending = false;
        if (this.activeUuid === uuid) {
          this.draft = '';
          this.mergeMessages([message]);
          this.scrollToBottom();
        }
        this.cdr.markForCheck();
        this.loadList(true);
      },
      (error) => {
        this.sending = false;
        this.sendError = apiErrorMessage(error, 'The message was not sent.');
        this.cdr.markForCheck();
      }
    );
  }

  deleteActive(): void {
    const uuid = this.activeUuid;
    if (!uuid || this.deleting) {
      return;
    }
    this.deleting = true;
    this.api.deleteConversation(uuid).subscribe(
      () => {
        this.deleting = false;
        this.confirmingDelete = false;
        this.conversations = this.conversations.filter((item) => item.uuid !== uuid);
        this.cdr.markForCheck();
        this.router.navigate(['/support/conversations']);
      },
      (error) => {
        this.deleting = false;
        this.confirmingDelete = false;
        this.sendError = apiErrorMessage(error, 'The conversation was not deleted.');
        this.cdr.markForCheck();
      }
    );
  }

  // New conversation

  toggleNew(): void {
    this.showNew = !this.showNew;
    this.newError = '';
    if (this.showNew && this.isStaff && !this.customers.length) {
      this.loadCustomers('');
    }
  }

  searchCustomers(term: string): void {
    this.customerSearch$.next(term.trim());
  }

  private loadCustomers(term: string): void {
    this.api.users({ role: 'user', search: term }).subscribe(
      (result) => {
        this.customers = result.data;
        if (
          this.newCustomerId !== null &&
          !this.customers.some((customer) => customer.id === this.newCustomerId)
        ) {
          this.newCustomerId = null;
        }
        this.cdr.markForCheck();
      },
      () => {}
    );
  }

  create(): void {
    const body = this.newBody.trim();
    if (!body || this.creating) {
      return;
    }
    if (this.isStaff && this.newCustomerId === null) {
      this.newError = 'Choose the customer this conversation is with.';
      return;
    }
    this.creating = true;
    this.newError = '';
    this.api
      .createConversation({
        name: this.newName.trim() || null,
        body,
        user_id: this.isStaff ? this.newCustomerId : null,
      })
      .subscribe(
        (conversation) => {
          this.creating = false;
          this.showNew = false;
          this.newName = '';
          this.newBody = '';
          this.newCustomerId = null;
          this.cdr.markForCheck();
          this.loadList(true);
          this.router.navigate(['/support/conversations', conversation.uuid]);
        },
        (error) => {
          this.creating = false;
          this.newError = apiErrorMessage(error, 'The conversation was not created.');
          this.cdr.markForCheck();
        }
      );
  }
}
