import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AuthServiceService } from '../../../auth/services/auth-service.service';
import { ApiUser, apiErrorMessage, UserPayload } from '../../models';
import { SupportApiService } from '../../services/support-api.service';

const ROLE_LABELS: { [role: string]: string } = {
  user: 'Customer',
  admin: 'Support agent',
  'super admin': 'Super admin',
};

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit, OnDestroy {
  users: ApiUser[] = [];
  page = 1;
  lastPage = 1;
  total = 0;
  search = '';
  roleFilter = '';
  loading = true;
  error = '';
  notice = '';

  roleOptions: string[] = [];
  isSuperAdmin = false;
  currentUserId: number | null = null;

  showForm = false;
  editingId: number | null = null;
  form = { name: '', email: '', phone: '', password: '', role: 'user' };
  saving = false;
  formError = '';

  confirmDeleteId: number | null = null;
  deletingId: number | null = null;

  private search$ = new Subject<string>();
  private subscription?: Subscription;

  constructor(
    private api: SupportApiService,
    private auth: AuthServiceService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isSuperAdmin = this.auth.isSuperAdmin;
    this.currentUserId = this.auth.currentUser?.id ?? null;
    this.roleOptions = this.isSuperAdmin
      ? ['user', 'admin', 'super admin']
      : ['user', 'admin'];
    this.subscription = this.search$
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.page = 1;
        this.load();
      });
    this.load();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  roleLabel(role: string): string {
    return ROLE_LABELS[role] || role;
  }

  roleOf(user: ApiUser): string {
    return user.roles?.[0] || 'user';
  }

  /** Only a super admin may change or remove a super admin. */
  canManage(user: ApiUser): boolean {
    return this.isSuperAdmin || this.roleOf(user) !== 'super admin';
  }

  load(): void {
    this.loading = true;
    this.api
      .users({ page: this.page, search: this.search.trim(), role: this.roleFilter })
      .subscribe(
        (result) => {
          this.users = result.data;
          this.page = result.meta.current_page;
          this.lastPage = result.meta.last_page;
          this.total = result.meta.total;
          this.error = '';
          this.loading = false;
          this.cdr.markForCheck();
        },
        (error) => {
          this.error = apiErrorMessage(error, 'Could not load the users.');
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  onSearch(term: string): void {
    this.search$.next(term.trim());
  }

  onRoleFilter(): void {
    this.page = 1;
    this.load();
  }

  goTo(page: number): void {
    if (page >= 1 && page <= this.lastPage && page !== this.page) {
      this.page = page;
      this.load();
    }
  }

  openCreate(): void {
    this.editingId = null;
    this.form = { name: '', email: '', phone: '', password: '', role: 'user' };
    this.formError = '';
    this.notice = '';
    this.showForm = true;
  }

  openEdit(user: ApiUser): void {
    this.editingId = user.id;
    this.form = {
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '',
      role: this.roleOf(user),
    };
    this.formError = '';
    this.notice = '';
    this.confirmDeleteId = null;
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.formError = '';
  }

  save(): void {
    if (this.saving) {
      return;
    }
    const editing = this.editingId !== null;
    const payload: UserPayload = {
      name: this.form.name.trim(),
      email: this.form.email.trim(),
      phone: this.form.phone.trim(),
      role: this.form.role,
    };
    if (this.form.password) {
      payload.password = this.form.password;
    }
    if (!payload.name || !payload.email || !payload.phone) {
      this.formError = 'Name, email and phone are required.';
      return;
    }
    if (!editing && !payload.password) {
      this.formError = 'Set a password for the new account.';
      return;
    }

    this.saving = true;
    this.formError = '';
    const request = editing
      ? this.api.updateUser(this.editingId as number, payload)
      : this.api.createUser(payload);

    request.subscribe(
      (user) => {
        this.saving = false;
        this.notice = editing
          ? `${user.name} was updated.`
          : `${user.name} was added.`;
        this.closeForm();
        this.cdr.markForCheck();
        this.load();
      },
      (error) => {
        this.saving = false;
        this.formError = apiErrorMessage(error, 'The user was not saved.');
        this.cdr.markForCheck();
      }
    );
  }

  remove(user: ApiUser): void {
    if (this.deletingId !== null) {
      return;
    }
    this.deletingId = user.id;
    this.notice = '';
    this.error = '';
    this.api.deleteUser(user.id).subscribe(
      () => {
        this.deletingId = null;
        this.confirmDeleteId = null;
        this.notice = `${user.name} was deleted.`;
        if (this.users.length === 1 && this.page > 1) {
          this.page--;
        }
        this.cdr.markForCheck();
        this.load();
      },
      (error) => {
        this.deletingId = null;
        this.confirmDeleteId = null;
        this.error = apiErrorMessage(error, 'The user was not deleted.');
        this.cdr.markForCheck();
      }
    );
  }

  trackById(_: number, user: ApiUser): number {
    return user.id;
  }
}
