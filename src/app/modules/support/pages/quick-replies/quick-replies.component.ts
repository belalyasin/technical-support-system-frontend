import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { apiErrorMessage, DefaultMessage } from '../../models';
import { SupportApiService } from '../../services/support-api.service';

@Component({
  selector: 'app-quick-replies',
  templateUrl: './quick-replies.component.html',
})
export class QuickRepliesComponent implements OnInit {
  readonly maxLength = 255;

  items: DefaultMessage[] = [];
  loading = true;
  error = '';
  notice = '';

  editingId: number | null = null;
  body = '';
  parentId: number | null = null;
  saving = false;
  formError = '';

  confirmDeleteId: number | null = null;
  deletingId: number | null = null;

  constructor(private api: SupportApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.allDefaultMessages().subscribe(
      (items) => {
        this.items = items;
        this.error = '';
        this.loading = false;
        this.cdr.markForCheck();
      },
      (error) => {
        this.error = apiErrorMessage(error, 'Could not load the quick replies.');
        this.loading = false;
        this.cdr.markForCheck();
      }
    );
  }

  /** Quick replies that can be the parent of the one in the form. */
  get parentOptions(): DefaultMessage[] {
    return this.items.filter((item) => item.id !== this.editingId);
  }

  parentIdOf(item: DefaultMessage): number | null {
    return typeof item.parent_id === 'number' ? item.parent_id : null;
  }

  edit(item: DefaultMessage): void {
    this.editingId = item.id;
    this.body = item.body;
    this.parentId = this.parentIdOf(item);
    this.formError = '';
    this.notice = '';
    this.confirmDeleteId = null;
  }

  resetForm(): void {
    this.editingId = null;
    this.body = '';
    this.parentId = null;
    this.formError = '';
  }

  save(): void {
    const body = this.body.trim();
    if (body.length < 3) {
      this.formError = 'Write at least 3 characters.';
      return;
    }
    if (this.saving) {
      return;
    }
    this.saving = true;
    this.formError = '';
    const payload = { body, parent_id: this.parentId };
    const editing = this.editingId !== null;
    const request = editing
      ? this.api.updateDefaultMessage(this.editingId as number, payload)
      : this.api.createDefaultMessage(payload);

    request.subscribe(
      () => {
        this.saving = false;
        this.notice = editing ? 'Quick reply updated.' : 'Quick reply added.';
        this.resetForm();
        this.cdr.markForCheck();
        this.load();
      },
      (error) => {
        this.saving = false;
        this.formError = apiErrorMessage(error, 'The quick reply was not saved.');
        this.cdr.markForCheck();
      }
    );
  }

  remove(item: DefaultMessage): void {
    if (this.deletingId !== null) {
      return;
    }
    this.deletingId = item.id;
    this.notice = '';
    this.error = '';
    this.api.deleteDefaultMessage(item.id).subscribe(
      () => {
        this.deletingId = null;
        this.confirmDeleteId = null;
        this.notice = 'Quick reply deleted.';
        if (this.editingId === item.id) {
          this.resetForm();
        }
        this.cdr.markForCheck();
        this.load();
      },
      (error) => {
        this.deletingId = null;
        this.confirmDeleteId = null;
        this.error = apiErrorMessage(error, 'The quick reply was not deleted.');
        this.cdr.markForCheck();
      }
    );
  }

  trackById(_: number, item: DefaultMessage): number {
    return item.id;
  }
}
