# Technical Support System: Front End

Angular front end for the Technical Support System. The API lives in [technical-support-system-api](https://github.com/belalyasin/technical-support-system-api).

## What is in it

- Authentication: login, registration, forgot password, route guard
- Chat: private chat, group chat and a chat drawer
- Account and profile pages
- English plus five other interface languages (ngx-translate)

The layout and base components come from the Metronic 8 Angular template.

## Tech stack

Angular 12, TypeScript, Angular Material, ng-bootstrap, ngx-translate, RxJS

## Getting started

```bash
git clone https://github.com/belalyasin/technical-support-system-frontend.git
cd technical-support-system-frontend
npm install
npm start
```

Then open http://localhost:4200. The API address is set in `src/environments/environment.ts` (`apiUrl`).
