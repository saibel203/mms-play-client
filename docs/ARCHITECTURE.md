# Архітектура MMS.Play.Client

Angular 22, standalone-компоненти, signals, zoneless. Документ пояснює, **як влаштований код і чому саме так**, щоб нову функціональність можна було додавати за тими самими правилами.

---

## 1. Шари і правила залежностей

```
src/app/
├── core/          інфраструктура застосунку, одна копія на весь app
│   ├── api/       HTTP-клієнти бекенду + транспортні моделі + обробка помилок
│   ├── auth/      Session, ролі, guards, interceptor
│   ├── layout/    каркас (Shell: шапка + router-outlet, ThemeToggle, UserMenu)
│   └── theme/     ColorTheme: світла / темна тема
├── shared/        перевикористовувані «цеглинки» без бізнес-стану
│   ├── ui/        тупі компоненти: file-drop-zone, search-box, pagination, confirm-dialog
│   ├── score-file/знання про файли партитур (розширення, читання тегів)
│   └── utils/     formatDuration, formatFileSize, keepPreviousValue (для resource)
└── features/      вертикальні зрізи функціональності
    ├── auth/      вхід (/login) і «очікує підтвердження» (/no-access)
    ├── admin/     сторінки лише для Admin: логи, health, фонові задачі (Hangfire)
    ├── library/   бібліотека: список, пошук, пагінація, завантаження, видалення
    └── tab-player/плеєр партитури за id
```

Залежності йдуть **лише вниз**:

```
        features/library      features/tab-player
               │    ╲            ╱    │
               │     ╲  ✗  ✗   ╱     │        ✗ = фічі не імпортують одна одну
               ▼      ▼        ▼      ▼
             shared ◄──────────── core
```

| Шар | Може імпортувати | Не може |
|---|---|---|
| `features/*` | `core`, `shared`, свої файли | іншу фічу |
| `core` | `shared` (за потреби) | `features` |
| `shared` | лише Angular / сторонні бібліотеки | `core`, `features` |

**Чому так.** Фічі можна видаляти, переписувати та lazy-завантажувати незалежно. Якщо двом фічам потрібне одне й те саме (наприклад, `ScoresApi` потрібен і бібліотеці, і плеєру), воно спускається на рівень нижче: у `core` для сервісів-одинаків або в `shared` для коду без стану. Фічі між собою спілкуються лише через **URL**: бібліотека робить посилання `/player/:id`, а плеєр нічого про бібліотеку не знає.

Аліаси шляхів (`tsconfig.json`): `@core/*`, `@shared/*`, `@features/*`. Усередині фічі використовуються відносні шляхи (`../../data-access/...`).

---

## 2. Анатомія фічі

Кожна фіча має однакову структуру:

```
features/library/
├── library.routes.ts        маршрути фічі (default export, lazy loadChildren)
├── models/                  view-моделі та константи фічі
├── data-access/             стори: стан + команди + робота з API
├── pages/                   smart-компоненти (по одному на маршрут)
└── ui/                      presentational-компоненти
```

### pages/ — smart (container)
- Сторінка є **єдиним місцем, яке знає про роутер**: читає параметри URL і робить навігацію.
- Через `providers: [...]` створює стори фічі, тому вони живуть рівно стільки, скільки живе сторінка.
- Сама нічого не рахує: бере сигнали зі стору й передає їх у `ui/`-компоненти, а події від них перетворює на виклики стору або навігацію.

### ui/ — presentational (dumb)
- Отримують усе лише через `input()` і повідомляють про дії лише через `output()`.
- Не інжектять сторів чи API. Їх можна переносити, тестувати й показувати з фейковими даними.
- Приклади: `UploadPanel`, `ScoreList`, `TrackMixer`, `TransportBar`.

### data-access/ — стори та фасади
- `@Injectable()` **без** `providedIn: 'root'`: їх надає сторінка.
- Однаковий шаблон для всіх сторів:

```ts
@Injectable()
export class ScoreUploader {
  private readonly _step = signal<UploadStep>('idle');  // приватний записуваний стан
  readonly step = this._step.asReadonly();               // публічний лише для читання
  readonly isBusy = computed(() => ...);                 // похідний стан

  async pick(file: File) { ... }                         // команди змінюють стан
}
```

Зовнішній код не може зробити `store.step.set(...)`. Стан змінюється лише через іменовані команди, тому всі переходи видно в одному файлі.

### models/
- **View-моделі** лежать у фічі (`LibraryFilter`, `UploadDraft`, `TrackState`).
- **Транспортні моделі** (те, що приходить з бекенду) лежать у `core/api` і дзеркалять `MMS.Play.Contracts`. Якщо змінюється контракт на бекенді, правити треба лише одне місце.

### Компонент = 3 файли
`.ts` + `.html` + `.scss`, без inline-шаблонів і стилів.

---

## 3. Робота з бекендом (`core/api`)

```
core/api/
├── api.config.ts        API_BASE_URL = '/api/v1' (InjectionToken)
├── api.models.ts        PagedResult<T>, ProblemDetails
├── api-error.ts         toErrorMessage(error) → речення для UI
└── scores/
    ├── score.models.ts  ScoreDto, ScoreListQuery, ScoreUploadResult...
    └── scores-api.ts    ScoresApi
```

- **`ScoresApi`** не має стану, це `providedIn: 'root'`. Він знає URL-и та формати (multipart, arraybuffer, 200 чи 201 при завантаженні), але нічого не знає про UI. Його методи повертають `Observable`.
- **`API_BASE_URL`** відносний, тому в dev `proxy.conf.json` пересилає `/api` на `https://localhost:7141` і CORS не потрібен. Для іншого хоста достатньо перевизначити токен в `app.config.ts`.
- **`toErrorMessage`** перетворює `HttpErrorResponse` (зокрема загорнутий у resource-помилку) на текст. Пріоритет: перша помилка валідації → `detail` → `title` → текст за HTTP-статусом. Статус 0 означає, що «сервер недоступний».

| Endpoint | Метод `ScoresApi` | Хто використовує |
|---|---|---|
| `POST /scores` | `upload(file, {title, artist})` | `ScoreUploader` |
| `GET /scores?page&pageSize&search` | `list(query)` | `ScoreLibrary` |
| `GET /scores/{id}` | `get(id)` | `CurrentScore` |
| `GET /scores/{id}/content` | `getContent(id)` | `CurrentScore` |
| `DELETE /scores/{id}` | `delete(id)` | `ScoreLibrary` |
| `POST /account/login` | `AccountApi.login(...)` | `Session` |
| `POST /account/logout` | `AccountApi.logout()` | `Session` |
| `GET /account/me` | `AccountApi.me()` | `Session` (на старті) |
| `GET /health` | `HealthApi.getReport()` | `HealthMonitor` |
| `GET /logs?page&pageSize&minLevel&from&to&source&search` | `LogsApi.list(query)` | `LogViewer` |
| `GET /logs/{id}` | `LogsApi.get(id)` | `LogViewer` |

Новий ендпоінт додається так: модель у `core/api/<area>/*.models.ts` → метод у `<Area>Api` → виклик зі стору фічі.

---

## 4. Потік даних

Односпрямований цикл, однаковий для обох сторінок:

```
   ┌──────────── URL (?page=2&q=metal, /player/:id) ◄──────────┐
   │                                                           │
   ▼  route.paramMap / queryParamMap                           │ router.navigate
 Page ───────── store.setFilter() / open(id) ──► Store         │
   ▲                                              │            │
   │                                    rxResource(params)     │
   │                                              ▼            │
   │                                          ScoresApi ──► HTTP
   │                                              │
   │      signals (scores, isLoading, error)      │
   └──────────────────────────────────────────────┘
   │
   ▼ [inputs]                        (outputs) ─► Page ─► navigate / store command
  ui/ components
```

### URL як джерело правди
Сторінка бібліотеки не тримає «поточну сторінку» в стані компонента. Коли користувач натискає «2», сторінка змінює URL. Підписка на `queryParamMap` передає новий фільтр у стор, і `rxResource` сам перезапитує дані. Завдяки цьому:
- кнопки «Назад» і «Вперед» у браузері працюють;
- після перезавантаження сторінки видно те саме;
- посиланням на пошук можна поділитися;
- коли повертаєшся з плеєра в бібліотеку, `‹ Library` відкриває список.

Під час введення пошуку використовується `replaceUrl`, щоб кожна пауза не створювала окремий запис в історії.

### `rxResource` замість ручних subscribe
```ts
private readonly response = rxResource({
  params: () => ({ ...this._filter(), pageSize: LIBRARY_PAGE_SIZE }),
  stream: ({ params }) => this.api.list(params),
});
```
- Коли змінюються `params`, ресурс сам скасовує старий запит і робить новий, тож гонки відповідей не буде.
- Стани `isLoading()`, `error()`, `hasValue()` та метод `reload()` ресурс дає з коробки.
- Якщо `params` дорівнює `undefined`, ресурс простоює (`CurrentScore` до виклику `open()`).

### `keepPreviousValue` проти блимання
Коли змінюються params, ресурс скидає `value`. Щоб список не зникав на час кожного запиту, стори списків (`ScoreLibrary`, `LogViewer`) тримають останню сторінку, що прийшла, через `shared/utils/keep-previous-value.ts`:
```ts
private readonly lastPage = keepPreviousValue(this.response);   // linkedSignal під капотом
```
Поки вантажиться наступна сторінка, список лише напівпрозорий (`busy`). Сигнал записуваний, тож `ScoreLibrary` прибирає з нього видалену картку одразу.

### Коли `effect`, а коли ні
`effect` використовується **лише для синхронізації з імперативним зовнішнім світом**: передати байти файлу в alphaTab, змінити `document.title`. Для стану, похідного від інших сигналів, використовуються `computed` / `linkedSignal`, а не `effect` + `set`.

---

## 5. Фіча `library`

```
LibraryPage  (providers: ScoreLibrary, ScoreUploader)
├── SearchBox       (shared/ui) debounce 300 мс → onSearch → URL
├── UploadPanel     (ui)        drop zone / форма / результат
├── ScoreList       (ui)        картки-посилання на /player/:id + кнопка видалення
├── Pagination      (shared/ui) → onPageChange → URL
└── ConfirmDialog   (shared/ui) «Delete score?»
```

### `ScoreLibrary`: список і видалення
Містить фільтр `{page, search}`, `rxResource` на `list()`, а також `scores`, `totalCount`, `totalPages`, `isFirstLoad`, `error` і `reload()`.

Видалення проходить три кроки: **запитати → підтвердити → видалити**.
```
ScoreList (deleteRequested) ─► library.requestDelete(score)   deleteTarget = score → діалог відкрито
ConfirmDialog (cancelled)   ─► library.cancelDelete()         deleteTarget = null  → діалог закрито
ConfirmDialog (confirmed)   ─► page.onDeleteConfirmed()
                                 └─ library.confirmDelete()   DELETE → картка зникає одразу
                                 └─ сторінка: reload() або перехід на попередню сторінку
```
- **Оптимістичне оновлення.** Після успішного `DELETE` стор прибирає картку з `lastPage` (`linkedSignal` можна записувати), не чекаючи нової відповіді. Потім `reload()` підтягує на звільнене місце перший запис з наступної сторінки.
- **Ідемпотентність.** Відповідь 404 на `DELETE` вважається успіхом: партитуру вже видалили в іншій вкладці, мета досягнута.
- Якщо видалили останню картку на сторінці > 1, сторінка переходить на попередню, а не показує порожню.
- Помилка видалення показується прямо в діалозі, і діалог лишається відкритим, тож можна натиснути ще раз.
- `ScoreList` лише *просить* видалити (`output`). Підтвердження, запит і навігація належать стору та сторінці.

### `ConfirmDialog` (shared/ui)
Побудований на нативному `<dialog>` + `showModal()`, тож focus trap, Esc і backdrop дає браузер. Діалог **повністю контрольований**: видимість задає `[open]`, а Esc і Cancel лише надсилають `cancelled`. Закривати чи ні, вирішує власник стану (поки триває видалення, діалог не закриється). Текст передається через `<ng-content>`, фокус спочатку стоїть на Cancel.

### `ScoreUploader`: машина станів завантаження
```
idle ──pick(file)──► reading ──(теги прочитано)──► editing ──submit()──► uploading
  ▲                     │                             │                     │
  └──────cancel()───────┴──────────cancel()───────────┘        ok ──────────┤──► idle (+ lastResult)
                                                                 помилка ───┘──► editing (+ error)
```
1. **pick**: перевіряє розширення і читає `title`/`artist` із самого файлу (`readScoreTags`, alphaTab). Якщо поки читався один файл користувач вибрав інший, результат першого відкидається.
2. **editing**: форма з заповненими назвою та виконавцем, які можна виправити.
3. **submit**: `POST`. Відповідь 200 означає, що такий файл уже був у бібліотеці (`isDuplicate`). Тоді показується «вже є як …» з посиланням Open.
4. Після успіху сторінка (а не стор) вирішує, що робити далі: оновити першу сторінку або перейти на неї. Через це `ScoreUploader` і `ScoreLibrary` не знають один про одного.

### Lazy alphaTab
`readScoreTags` робить `await import('@coderline/alphatab')`, тому сторінка списку важить ~77 kB, а рушій (~2.7 MB) завантажується лише в момент вибору файлу або відкриття плеєра.

---

## 6. Фіча `tab-player`

```
TabPlayerPage  (providers: CurrentScore, ScorePlayer)
├── TransportBar / SpeedControl
├── TrackMixer
├── ViewControls
└── ScoreViewer   ← DOM, у який малює alphaTab
```

Тут два стори з чітко розділеними обов'язками:

| | `CurrentScore` | `ScorePlayer` |
|---|---|---|
| Що це | **дані**: яку партитуру показуємо | **рушій**: фасад над alphaTab |
| Знає про | `ScoresApi`, id | лише alphaTab і байти файлу |
| Стан | `score` (метадані), `content` (ArrayBuffer), `isLoading`, `error` | треки, позиція, темп, гучність, вигляд... |

Як вони з'єднуються в сторінці:
```ts
route.paramMap → current.open(id)                 // URL → дані
effect: current.content() → player.load(bytes)    // дані → рушій
```

- **`ScorePlayer.load(bytes)`** не знає, звідки взявся файл (API, диск, тест). Якщо його викликати до того, як `ScoreViewer` приєднав рушій, файл чекає в `pending` і завантажиться в `attach()`. Тому порядок «що раніше: HTTP чи рендер DOM» не має значення.
- Метадані (назва, виконавець) беруться з бекенду, а не з файлу, бо їх могли виправити під час завантаження.
- При переході `/player/A` → `/player/B` компонент перевикористовується: `paramMap` віддає новий id, ресурси перезапитуються, і `load()` замінює партитуру в тому самому рушії.
- **Кеш:** `/content` віддається з `ETag` і `Cache-Control: immutable`, тому повторне відкриття пісні не завантажує файл знову.
- Тільки `ScorePlayer` і `alphatab.config.ts` імпортують класи alphaTab. UI-компоненти працюють з view-моделями з `player.models.ts`, тож рушій можна замінити, не чіпаючи UI.

---

## 7. Маршрути і доступ

| Маршрут | Сторінка | Доступ |
|---|---|---|
| `/login` | `LoginPage` (без шапки) | лише неавторизовані (`guestOnly`) |
| `/no-access` | `NoAccessPage` (без шапки) | авторизовані без ролі (`pendingApprovalOnly`) |
| `/` | → `/library` | |
| `/library?page&q` | `LibraryPage` | Admin, Student |
| `/player/:id` | `TabPlayerPage` | Admin, Student |
| `/admin` | → `/admin/logs` | Admin |
| `/admin/logs?level&period&source&q&page&entry` | `LogsPage` | Admin |
| `/admin/health` | `HealthPage` | Admin |
| `/admin/jobs` | `JobsPage` | Admin |
| `/**` | → `/` | |

Усі фічі завантажуються lazy. Сторінки з шапкою вкладені в `Shell`, на якому стоїть `requireRoles(Admin, Student)`. На `/admin` додатково стоїть `requireRoles(Admin)`.

---

## 8. Авторизація і ролі

Бекенд використовує **cookie-авторизацію** (ASP.NET Identity, `HttpOnly`, `SameSite=Strict`). Клієнт ніколи не бачить токена: браузер сам зберігає й надсилає cookie, бо `/api` і `/hangfire` віддаються з того самого сайту через proxy.

```
bootstrap ─► provideAppInitializer ─► Session.restore() ─► GET /account/me
                                         200 → user        401 → null
          ─► перша навігація ─► guards читають Session синхронно
```

| Частина | Де | Що робить |
|---|---|---|
| `Roles`, `APP_ROLES` | `core/auth/roles.ts` | ті самі рядки, що `MMS.Play.Contracts.Authorization.Roles` |
| `Session` | `core/auth/session.ts` | `user`, `isAuthenticated`, `isAdmin`, `isPendingApproval`, `hasRole(...)`; `restore / login / logout / expire` |
| `requireRoles(...roles)` | `core/auth/auth.guards.ts` | не увійшов → `/login?returnUrl=…`; без ролі → `/no-access`; не та роль → `/` |
| `guestOnly`, `pendingApprovalOnly` | там само | захищають самі сторінки входу та очікування |
| `authInterceptor` | `core/auth/auth.interceptor.ts` | 401 на звичайний запит (cookie протух, вихід в іншій вкладці) → `expire()` + `/login?returnUrl=…` |

**Ролі в UI:**
- **Admin:** усе. Завантаження й видалення в бібліотеці, пункт «Jobs» у шапці, сторінка `/admin/jobs` з Hangfire в iframe.
- **Student:** лише читання. `UploadPanel` і кнопки видалення не рендеряться (`canManage = session.isAdmin`).
- **Без ролі:** обліковий запис існує, але адмін ще не підтвердив його (майбутня реєстрація через Telegram). Користувач бачить `/no-access` з кнопками «Check again» (повторний `/me`) і «Sign out».

**Правила:**
- **Перевірки ролей на клієнті лише косметичні.** Вони вирішують, що *показати*, а справжні права перевіряє API (`[Authorize(Roles = ...)]`, fallback policy).
- `returnUrl` проходить через `safeReturnUrl`: дозволені лише внутрішні шляхи (`/…`, не `//…`), щоб сторінка входу не стала open redirect.
- 401 від `/account/*` інтерцептор не чіпає. Для `login` це «невірний пароль», для `me` — «не увійшов».
- Помилку входу показує `toErrorMessage`: `detail` з бекенду («Invalid user name or password.», «Too many failed attempts…»).
- Нова сторінка лише для адміна додається в `features/admin/admin.routes.ts` (+ посилання в `shell.html` під `@if (session.isAdmin())`), guard уже стоїть на батьківському маршруті. Інша роль для маршруту задається через `canActivate: [requireRoles(...)]`.

---

## 9. Фіча `admin`

Усе, що тут є, доступне лише Admin: guard стоїть на маршруті `/admin`, а API перевіряє роль сам.

### Логи (`/admin/logs`), у дусі Log Viewer з Umbraco
```
LogsPage  (providers: LogViewer)
├── LogFilters        рівень (All / Debug+ / Info+ / Warning+ / Error+ / Fatal), період, source, пошук, Refresh
├── LogTable          час · рівень · клас · повідомлення · ⚠ якщо є exception
├── Pagination
└── LogEntryDetails   панель праворуч: повідомлення, source, шаблон, exception, properties
```
- **Усе в URL**, разом із відкритим записом: `?level=Warning&period=week&source=MMS.Play.Infrastructure&q=timeout&entry=123`. Посиланням можна поділитися, і інший адмін побачить той самий запис.
- **`LogViewer` має два незалежні ресурси**: список (за фільтром) і деталі (за `entry`). Тому посилання на запис працює, навіть якщо його немає на поточній сторінці списку.
- **Період відносний** («Last 24 hours»). `from` рахується в `stream` у момент запиту, тож Refresh зсуває вікно до «зараз», і нові записи з'являються зверху.
- **Список легкий.** Рядки не містять properties: бекенд віддає важкий JSON події лише в `GET /logs/{id}`.
- **«Only this source»** у деталях фільтрує список за класом запису. Source-фільтр — це префікс, тому підходить і namespace.
- Текстові фільтри використовують `replaceUrl` (як пошук у бібліотеці), а рівень, період, сторінка й запис додають запис в історію, тож «Назад» працює.

### Health (`/admin/health`)
`HealthMonitor`: `rxResource` без params завантажується раз при відкритті, «Run checks again» робить `reload()`, і поки іде перевірка, старий звіт лишається на екрані. Зверху показано загальний статус (найгірший з усіх), нижче по картці на кожну перевірку: статус, опис або текст помилки, тривалість і `data` (наприклад, лічильники Hangfire).

### Jobs (`/admin/jobs`)
Hangfire в iframe через proxy `/hangfire`, див. розділ 8.

## 10. Стилі і теми

- Дизайн-токени зібрані в `src/styles.scss` (`--color-*`, `--radius-*`, `--shadow-*`). Компоненти використовують змінні, а не хардкод кольорів. Виняток — білий текст на кольорових кнопках.
- Стилі інкапсульовані в компоненті. Виняток — `ScoreViewer` (`ViewEncapsulation.None`), бо alphaTab сам вставляє DOM курсора й виділення.

### Темна тема
```
index.html (inline script)  ──► <html data-theme="dark">   ще до запуску Angular, без білого спалаху
ColorTheme (core/theme)     ──► той самий атрибут + color-scheme, далі керує ним
styles.scss                     :root { світлі токени }  :root[data-theme='dark'] { темні токени }
TabPlayerPage (effect)      ──► player.setTheme(scheme) ──► SCORE_THEMES[scheme] у alphaTab
```
- **`ColorTheme`** (`providedIn: 'root'`): сигнал `scheme` = вибір користувача, а якщо вибору немає, то тема ОС, яку сервіс відстежує наживо. `toggle()` / `set()` зберігають вибір у `localStorage` (`mms-play.theme`). Якщо сховище недоступне, тема просто діє до кінця сесії.
- **Inline-скрипт** в `index.html` повторює ту саму логіку (ключ і fallback), бо CSS має знати тему до того, як завантажиться JS-бандл.
- **Компоненти нічого не знають про тему.** Вони використовують токени, а токени перемикаються одним атрибутом. Новий колір додається в обидва блоки `styles.scss`.
- **Нотація** малюється alphaTab на canvas/SVG, куди CSS-змінні не доходять. Тому її кольори задані окремо в `SCORE_THEMES` (`alphatab.config.ts`), а тема входить у `ViewOptions` плеєра нарівні з layout і zoom. `ScorePlayer` про `ColorTheme` не знає: сторінка передає йому схему через `effect`. Курсор і виділення — це DOM, тому їхні кольори перевизначені в `score-viewer.scss` під `[data-theme='dark']`.
- `ThemeToggle` є presentational-компонентом (`isDark` → `toggled`), а `Shell` з'єднує його з `ColorTheme`.

---

## 11. Рецепти

**Нова фіча** (наприклад, `admin`):
1. `features/admin/{models,data-access,pages,ui}` + `admin.routes.ts` з `export default [...] satisfies Routes`.
2. `loadChildren: () => import('@features/admin/admin.routes')` в `app.routes.ts`.
3. Якщо потрібен бекенд: модель і метод у `core/api/<area>/`, стор у `data-access/`, сторінка надає стор через `providers`.

**Новий ендпоінт для існуючої фічі:** модель → метод `*Api` → `rxResource` або команда в сторі → сигнал → input у UI.

**Щось потрібно двом фічам:** сервіс зі станом на весь застосунок іде в `core/`. Компонент або функція без стану йде в `shared/`. Імпорт між фічами заборонений.

---

## 12. Обмеження і що далі

- На бекенді немає `PATCH` для партитур. Перейменування з'явиться разом із ним за тим самим шаблоном, що й видалення: метод у `ScoresApi` + команда в `ScoreLibrary`.
- Після видалення браузер може ще віддавати файл зі свого кешу (`immutable`), але метадані відповідають 404, тому плеєр покаже «Score not found».
- Реєстрації поки немає, облікові записи створює бекенд (`Identity:SeedUsers`). Коли з'явиться реєстрація з підтвердженням через Telegram, сторінка `/register` ляже в `features/auth`. Затвердження означатиме видачу ролі `Student`, а `/no-access` уже вміє це підхопити.
- Лічильників за рівнями (як кругова діаграма в Umbraco) поки немає, бо API віддає лише сторінки. Для цього потрібен окремий ендпоінт статистики, наприклад `GET /logs/stats?from&to` → `{ level: count }`.
- Роль, змінену на бекенді, `/me` побачить, лише коли Identity перевалідує cookie (до 30 хвилин) або після повторного входу.
- `/content` кешується браузером як `private, immutable`. Після виходу інший користувач того самого браузера технічно може отримати файл з кешу.
- Розмір файлу (10 MB) перевіряє лише сервер. Клієнт показує його помилку через `toErrorMessage`.
