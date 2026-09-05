# Lumina

A photo gallery on the Unsplash API: a server-rendered masonry feed with a 3/5 column switch,
pagination, search, tag pages and photo detail pages, plus a browser-local account for saving
photos.

Next.js 16 (App Router), React 19, TypeScript, SCSS Modules. No UI, state or masonry libraries.

## Requirements

The nine numbered requirements from the assignment, and where each one is implemented.

| # | Requirement | Where |
| --- | --- | --- |
| 1 | Feed with a 3-column and a 5-column option, switched by a button | `LayoutToggle` + `LayoutModeProvider`; the count is mirrored into the `gallery_cols` cookie so the server renders it |
| 2 | Unsplash-style masonry: images fill the space by size | `lib/masonry.ts` — greedy shortest-column on `height / width`, no measurement, no library |
| 3 | Pagination as pages | `Pagination` + `lib/pagination.ts`; `?page=N` in the URL, page 1 has no param |
| 4 | Clicking an image opens its page with extra info | `/photos/[id]` — description, tags, likes, author, date |
| 5 | Clicking a tag opens a collection that works like the feed | `/tags/[tag]`, the same `GalleryFeed` as `/` and `/search` |
| 6 | Image search | `SearchForm` in the header → `/search?q=` |
| 7 | UI style taken from Unsplash | `styles/_variables.scss` tokens; header, search pill, square cards, hover overlay |
| 8 | Responsive at 1440 / 1024 / 768 / 375 | Both modes keep their column count at every width; gutters and page padding shrink instead |
| 9 | SSR with Next.js | Every route is a Server Component rendered on demand; photos and pagination links are in the initial HTML |
| Bonus 1 | Basic registration | `/register`, `/login` — browser-local, see below |
| Bonus 2 | Save feed images to a profile collection and remove them | `SaveButton` + `/profile` |

## Getting started

Node 22.12+, 24, or 26+ — the range in `package.json` `engines`, set by Vitest 5, which does not
support 23.x or 25.x. `.nvmrc` pins 22.

```bash
nvm use
npm install
cp .env.example .env.local   # add your Unsplash access key
npm run dev
```

Access keys come from <https://unsplash.com/oauth/applications>. Demo applications are capped at
50 requests per hour, which is what the caching below is sized around; an approved production
application raises that to 5000.

### Environment variables

| Variable               | Required | Notes                                                                            |
| ---------------------- | -------- | -------------------------------------------------------------------------------- |
| `UNSPLASH_ACCESS_KEY`  | yes      | Server only. Read at request time in `src/lib/env.ts`, never sent to the client. |
| `NEXT_PUBLIC_APP_NAME` | no       | Wordmark, and the `utm_source` on links back to Unsplash. Defaults to `Lumina`.  |

### Scripts

| Script                            | Does                          |
| --------------------------------- | ----------------------------- |
| `npm run dev`                     | Dev server                    |
| `npm run build` / `npm start`     | Production build, serve it    |
| `npm test` / `npm run test:watch` | Vitest                        |
| `npm run typecheck`               | `tsc --noEmit`                |
| `npm run lint`                    | ESLint (`eslint-config-next`) |
| `npm run format`                  | Prettier                      |

## Routes

| Route                             | Renders                                                  |
| --------------------------------- | -------------------------------------------------------- |
| `/`                               | Latest photos, `?page=`                                  |
| `/search`                         | Results for `?q=`, `?page=`                              |
| `/tags/[tag]`                     | Photos for a tag, `?page=`                               |
| `/photos/[id]`                    | One photo: description, tags, likes, author, save button |
| `/register`, `/login`, `/profile` | Account and saved collection                             |
