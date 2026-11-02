# LCid - access LeetCode problems via id

## Introduction

As a world's leading online programming learning platform, [LeetCode](https://leetcode.com) is quite popular among programmers. Since each problem has a unique number id, users tend to share problems via id. However, it is not convenient to visit problem page **directly via id**. People have to visit [LeetCode Problems](https://leetcode.com/problemset/all/) firstly, then enter that number id in the 'Search questions' input box, press 'enter', click the problem title link, finally comes to the problem page. What a hard work!

This simple project, called LCid, provides directly access to LeetCode problems via id. Features:

- Fetch all LeetCode problems via crawler.
- Redirect to LeetCode problem page with problem id in the URL path via backend.
- Support both LeetCode [global site](https://leetcode.com/problemset/all/) and [China site](https://leetcode.cn/problemset/all/) redirect.
- CI/CD, fetch all LeetCode problems daily and commit back to the repository via GitHub Actions, then deploy the latest snapshot.

![redirect-demo](redirect-demo.gif)

LCid is now available at [lcid.cc](https://lcid.cc). Just add `/<problem-id>` at the end of `lcid.cc` (e.g. [lcid.cc/1](https://lcid.cc/1)), then browser will redirect you to the problem page. Simple, fast, and make your live easier.

What's more, to redirect to China site, add `/cn/<problem-id>` instead (e.g. [lcid.cc/cn/1](https://lcid.cc/cn/1)). Interested in the brief info of the problem? Try `/info/<problem-id>` (e.g. [lcid.cc/info/1](https://lcid.cc/info/1)) and find more!

<!-- More technical details introduced at [this blog](https://www.bunnyxt.com/blogs/lcid-cc-leetcode-problems-redirect-via-id/) (Chinese only). -->

## Environment

Use Python 3.11 for the crawler and local backend, matching the GitHub Actions workflow.

The crawler is implemented with `urllib3` and backend is powered with `flask`.

To install all those dependencies, execute `pip install -r requirements.txt`.

The frontend is built with `React.js` with `Ant Design` UI.

To build frontend, use `Node.js 22.x` with `npm 10.x`.

(older versions may work but not tested)

## Usage

### Set environment

Updated Oct 29 2023, leetcode.com now protected with Cloudflare. To send request to any page or endpoint under leetcode.com, `cf_clearance` and `csrftoken` are required.

For now, it is difficult to automate way to get both `cf_clearance` and `csrftoken`. Therefore, it is okay to manually get from browser for now.

Once we fetched `cf_clearance` and `csrftoken` from browser, copy file `.env` to `.env.local`, fill both fields accordingly.

```
VITE_BACKEND_API_URL="http://localhost:1437"
LC_CF_CLEARANCE="{manually get from browser}"
LC_CSRFTOKEN="{manually get from browser}"
```

### Fetch All Problems

To fetch all problems, execute `python fetch_problems_all.py`. The crawler fetches problems in pages, reports progress, and saves the results to `problems_all.json` in JSON format.

### Build Frontend

To start frontend, install all dependencies via `npm install` first. Then, start frontend development server via `npm run start`. By default, the development server will starts at `http://localhost:3000`.

To build frontend, use `npm run build`. The built frontend will be created at `build/`.

### Start Backend Service

To start backend service, execute `python app.py <port>` (e.g. `python app.py 1437`). Then, the backend server will start at `localhost:<port>`.

Now you can try the following endpoints. All of them should work correctly.

- `localhost:<port>/`
- `localhost:<port>/1`
- `localhost:<port>/cn/1`
- `localhost:<port>/info/1`

## Deployment

To deploy on Vercel, use the checked-in [vercel.json](vercel.json). The build command `npm run build` creates the frontend in `build/` and copies `problems_all.json` to `build/info.json`. The configuration serves `/info` from that static snapshot and routes `/info/<id>`, `/cn/<id>`, and `/<id>` to [api/problem.js](api/problem.js).

Keep `VITE_BACKEND_API_URL` empty when building for production so the frontend fetches `/info` from the same origin.

The daily [GitHub Actions workflow](.github/workflows/main.yml) updates `problems_all.json` on `main` when the fetched data changes. To enable it, configure `LC_CF_CLEARANCE` and `LC_CSRFTOKEN` as repository secrets. Deploy the updated snapshot to refresh `/info`.

### Redirect analytics

`POSTHOG_PROJECT_TOKEN` enables optional redirect usage statistics through PostHog in Vercel production deployments. Leave it unset to disable analytics.

## Disclaimer

- This is just a naive tool for convenient access and only call LeetCode API at low frequency. It only obtains public accessible data (no personal info or paid content collected and distributed). DO NOT ABUSE LEETCODE API!!!
- GitHub Repo: [bunnyxt/lcid](https://github.com/bunnyxt/lcid)
- Author: [bunnyxt](https://github.com/bunnyxt)
- License: [MIT](LICENSE)
