import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import {
  ApiUser,
  ChatMessage,
  Conversation,
  DefaultMessage,
  Paginated,
  UserPayload,
} from '../models';

@Injectable({ providedIn: 'root' })
export class SupportApiService {
  private api = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // Conversations

  conversations(page = 1): Observable<Paginated<Conversation>> {
    return this.http.get<Paginated<Conversation>>(`${this.api}/conversations`, {
      params: new HttpParams().set('page', String(page)),
    });
  }

  /** The first `pages` pages of conversations as one list. */
  conversationsUpTo(pages: number): Observable<{ items: Conversation[]; lastPage: number }> {
    return this.conversations(1).pipe(
      switchMap((first) => {
        const lastPage = first.meta.last_page;
        const wanted = Math.min(pages, lastPage);
        if (wanted <= 1) {
          return of({ items: first.data, lastPage });
        }
        const rest = [];
        for (let page = 2; page <= wanted; page++) {
          rest.push(this.conversations(page));
        }
        return forkJoin(rest).pipe(
          map((others) => ({
            items: first.data.concat(...others.map((other) => other.data)),
            lastPage,
          }))
        );
      })
    );
  }

  conversation(uuid: string): Observable<Conversation> {
    return this.http
      .get<{ data: Conversation }>(`${this.api}/conversations/${uuid}`)
      .pipe(map((res) => res.data));
  }

  createConversation(data: {
    name?: string | null;
    body: string;
    user_id?: number | null;
  }): Observable<Conversation> {
    return this.http
      .post<{ data: Conversation }>(`${this.api}/conversations`, data)
      .pipe(map((res) => res.data));
  }

  deleteConversation(uuid: string): Observable<any> {
    return this.http.delete(`${this.api}/conversations/${uuid}`);
  }

  // Messages

  private messagesPage(uuid: string, page: number): Observable<Paginated<ChatMessage>> {
    return this.http.get<Paginated<ChatMessage>>(
      `${this.api}/conversations/${uuid}/messages`,
      { params: new HttpParams().set('page', String(page)) }
    );
  }

  /**
   * Messages from page `fromPage` to the last page, oldest first. Reading them
   * marks the conversation as read on the server.
   */
  messagesFrom(
    uuid: string,
    fromPage = 1
  ): Observable<{ items: ChatMessage[]; lastPage: number }> {
    return this.messagesPage(uuid, fromPage).pipe(
      switchMap((first) => {
        const lastPage = first.meta.last_page;
        if (lastPage <= fromPage) {
          return of({ items: first.data, lastPage: Math.max(lastPage, 1) });
        }
        const rest = [];
        for (let page = fromPage + 1; page <= lastPage; page++) {
          rest.push(this.messagesPage(uuid, page));
        }
        return forkJoin(rest).pipe(
          map((others) => ({
            items: first.data.concat(...others.map((other) => other.data)),
            lastPage,
          }))
        );
      })
    );
  }

  sendMessage(uuid: string, body: string): Observable<ChatMessage> {
    return this.http
      .post<{ data: ChatMessage }>(
        `${this.api}/conversations/${uuid}/messages`,
        { body }
      )
      .pipe(map((res) => res.data));
  }

  // Quick replies (default messages)

  defaultMessages(page = 1): Observable<Paginated<DefaultMessage>> {
    return this.http.get<Paginated<DefaultMessage>>(
      `${this.api}/default-messages`,
      { params: new HttpParams().set('page', String(page)) }
    );
  }

  /** Every quick reply, across all pages. */
  allDefaultMessages(): Observable<DefaultMessage[]> {
    return this.defaultMessages(1).pipe(
      switchMap((first) => {
        const lastPage = first.meta.last_page;
        if (lastPage <= 1) {
          return of(first.data);
        }
        const rest = [];
        for (let page = 2; page <= lastPage; page++) {
          rest.push(this.defaultMessages(page));
        }
        return forkJoin(rest).pipe(
          map((others) => first.data.concat(...others.map((other) => other.data)))
        );
      })
    );
  }

  createDefaultMessage(data: {
    body: string;
    parent_id?: number | null;
  }): Observable<DefaultMessage> {
    return this.http
      .post<{ data: DefaultMessage }>(`${this.api}/default-messages`, data)
      .pipe(map((res) => res.data));
  }

  updateDefaultMessage(
    id: number,
    data: { body: string; parent_id?: number | null }
  ): Observable<DefaultMessage> {
    return this.http
      .put<{ data: DefaultMessage }>(`${this.api}/default-messages/${id}`, data)
      .pipe(map((res) => res.data));
  }

  deleteDefaultMessage(id: number): Observable<any> {
    return this.http.delete(`${this.api}/default-messages/${id}`);
  }

  // Users (staff only)

  users(options: { page?: number; search?: string; role?: string } = {}): Observable<Paginated<ApiUser>> {
    let params = new HttpParams().set('page', String(options.page || 1));
    if (options.search) {
      params = params.set('search', options.search);
    }
    if (options.role) {
      params = params.set('role', options.role);
    }
    return this.http.get<Paginated<ApiUser>>(`${this.api}/users`, { params });
  }

  createUser(data: UserPayload): Observable<ApiUser> {
    return this.http
      .post<{ data: ApiUser }>(`${this.api}/users`, data)
      .pipe(map((res) => res.data));
  }

  updateUser(id: number, data: UserPayload): Observable<ApiUser> {
    return this.http
      .put<{ data: ApiUser }>(`${this.api}/users/${id}`, data)
      .pipe(map((res) => res.data));
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.api}/users/${id}`);
  }
}
