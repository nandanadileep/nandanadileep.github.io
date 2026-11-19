# Nandana Dileep: search visibility and launch plan

Prepared 16 October 2026. Updated 16 November 2026 for the new headline and live deployment. The build deploys to GitHub Pages through `.github/workflows/pages.yml`. No Search Console or Bing Webmaster Tools account has been connected in this task. Rankings, search volumes, backlinks and Core Web Vitals have not been measured.

## Headline

One headline everywhere: **"I make agents fast, cheap and reliable to run."** Use it word for word on the resume, GitHub profile, LinkedIn and this site. Do not reword it per platform.

| Surface | Where it lives | Status |
| --- | --- | --- |
| Resume | `career/resume/main.tex`, under the name | Done. PDF rebuilt and copied to `resume.pdf` |
| GitHub profile | `github-profile/README.md`, line 3 | Done |
| Website | `canvas/seo/pages.json` (intro title and description), `canvas/index.html` (intro), `canvas/seo/build.py` (`llms.txt`), plus legacy `index.html` and `llms.txt` | Done |
| LinkedIn | Headline and About, by hand | Pending. Text below |

LinkedIn headline (121 characters, limit 220): "I make agents fast, cheap and reliable to run. | LLM inference, vLLM, agent reliability | AI Engineer at JLR | IIT Madras". Keep the headline first, because only the first part shows in search results and comments.

The headline is a pitch line. The role words stay in the keyword fields. Search titles still carry "Nandana Dileep", and the page descriptions still say "AI engineer at JLR", so the name and job title are searchable.

Kept as "AI Engineer" on purpose:

- JSON-LD `jobTitle`. Structured data should state the real job title, not a tagline.
- The "AI Engineer and Full-Stack AI Engineer opportunities" line in the legacy `llms.txt`. It names the roles I am targeting.
- Descriptions on project, writing and legacy note pages. They describe the work, not the pitch.

When the headline changes again, edit `pages.json`, `canvas/index.html` and `build.py`, rebuild, and update the legacy `index.html` and `llms.txt` by hand. Then sync `resume.pdf` and bump the `?v=` on the resume link in `index.html`.

## Positioning

Lead with **"I make agents fast, cheap and reliable to run"**, followed by **Nandana Dileep, AI engineer working on LLM inference, agent reliability and AI infrastructure**. Use Bangalore in the visible biography and Bengaluru as an alternate geographic form in structured data. The target niche is inference serving and KV cache work for agents (vLLM, LMCache, FlashInfer), with the reliability work on Mycelium as the second half of the story. Reading list: `learning/opensource/REPOS.md`. The strongest differentiator is implementation evidence, including open-source agent reliability, measured inference experiments and production work at JLR.

Recruiter intent differs from someone searching for a definition of “AI engineer.” A personal portfolio can compete more meaningfully on a name, a project, a specific capability or a combination of skills and location than on every engineering title. Broad job terms are goals to measure, not rankings that metadata can guarantee. Do not claim “startup founder,” “founding engineer,” years of experience or availability without confirmation.

| Search intent / target phrases | Destination | Evidence on the page |
| --- | --- | --- |
| Nandana Dileep; Nandana AI engineer; IIT Madras JLR | `/` and `/experience/` | Name, role, education, employment and linked public profiles |
| AI engineer Bangalore; AI infrastructure engineer portfolio | `/projects/` | An overview linking actual agent, inference and infrastructure work |
| AI agent engineer; agentic AI engineering; AI agent reliability | `/projects/mycelium/` | Creator and maintainer, 36K+ PyPI downloads supplied by Nandana (snapshot 19 November 2026), durable execution and recovery design |
| LLM inference engineer; MLX continuous batching; Apple Silicon inference | `/projects/mlx-llm-serving/` | Experimental serving engine, scheduling and cache design |
| GPU inference optimization; reranker performance; Metal and CUDA | `/projects/tiny-reranker/` | 13 experiments across two hardware environments, with measurement boundaries |
| RAG engineering; AI engineering artifacts; Git-native compliance | `/projects/sarvam/` | Five vehicle programs, scoped retrieval, CI/CD and human approval |
| ML infrastructure; Kubernetes inference; telemetry classification | `/projects/rig-utilization/` | About 200 rigs, 500K+ daily events, model quality and operational design |
| Learned test prioritization; failure likelihood ranking | `/projects/octopus/` | Ranking metrics, recency treatment and optimization |
| AI memory; knowledge graph retrieval | `/projects/identiti/` | Neo4j implementation, evaluation and limitations |
| Modern transformer experiments; nanoGPT alternatives | `/projects/nanollm/` | Component changes, experiments and the original article |

These are relevance hypotheses, not measured keyword-volume estimates. Do not create multiple thin pages titled “AI engineer,” “agentic engineer,” and “infrastructure engineer” with identical content.

## Implemented

- 18 static routes, including 11 project pages, a project index, experience, stack, writing, beyond work, personal notes and home. Each response contains only the selected view and its full content. Hosted copies of the Medium articles also exist at `/technical-notes/`; the writing index still links out to Medium.
- Actual anchor links replace hash-only navigation and project-selection buttons in the SEO build. Native navigation supports direct entry, refresh, sharing and browser Back/Forward.
- Unique titles and descriptions, self-referencing canonical URLs, Open Graph and Twitter metadata, and a linked favicon.
- Person, WebSite and WebPage structured data; ProfilePage on the homepage; CreativeWork for project write-ups; ItemList on the project index; BreadcrumbList on inner pages. Markup describes existing visible content, without invented review ratings, job listings or FAQ spam.
- All project engineering paragraphs are visible in initial HTML. The build does not depend on Google clicking buttons, running JavaScript or reading hidden panes.
- Semantic headings and accessible links. Existing responsive canvas styles, light/dark mode, portrait and rolling contact icons remain in use. Homepage layout stays fixed; detailed content stays in its reader pane.
- An indexable production build, robots file, XML sitemap, real not-found page and an informational `llms.txt`. The local design source keeps its noindex tag; it is not the production artifact.
- Seven existing public essay/project URLs are copied into the build to avoid deleting indexed URLs during migration. TicTic is not reintroduced into the portfolio navigation. A removal from navigation does not need to cause a broken public URL.
- A resized portrait for the homepage and social metadata. The original photograph is preserved.
- Static checks for metadata uniqueness, canonical URLs, valid JSON-LD, one H1 per new route, initial HTML content, accessible references, internal links, sitemap coverage and crawl reachability from home.

`llms.txt` is a convenience for readers and tools. It is not a Google ranking requirement or an assurance of inclusion in AI answers. Structured data likewise improves machine-readable descriptions but does not guarantee a rich result or higher ranking.

## Build and review

Run from `nandanadileep.github.io`:

```sh
python3 canvas/seo/build.py
python3 canvas/seo/verify.py
node --check canvas/seo/site.js
python3 -m http.server 8019 --bind 127.0.0.1 --directory canvas/site
```

Review `http://127.0.0.1:8019/`. The original design playground stays at `/canvas/` on its existing server. Content is sourced from `canvas/index.html`; search titles and descriptions live in `canvas/seo/pages.json`. Rebuild after content or CSS changes. The exporter uses Python's standard library and requires no package installation.

The generated `canvas/site/` directory is a complete publishable document root. Production canonicals deliberately point to `https://nandanadileep.com/`, not localhost. The Pages workflow runs `build.py` and `verify.py`, runs `node --check` on the scripts, and deploys `canvas/site` on every push to `main`. The root `index.html` is a legacy page. It is not what the domain serves, so edit it only to keep it consistent. Do not publish the design source or the SEO implementation directory as the homepage.

`LOCAL.md` is an older local-preview note and no longer matches how the site ships. The live checks below still apply after each release. Roll back by reverting the commit on `main`, which redeploys the previous build.

## Launch checks

1. Confirm desktop and mobile layouts in both themes, keyboard navigation, project resource links, native Back/Forward, contact links and the resume. Check direct URLs with JavaScript disabled. Local automated HTML checks are not a substitute for visual review.
2. Serve all new routes with HTTP 200 and missing URLs with HTTP 404. On GitHub Pages the custom `404.html` is a real not-found page; do not use a universal homepage fallback that returns 200 for nonexistent projects.
3. Choose `https://nandanadileep.com` as the one canonical host. Check HTTP and www variants redirect in one hop to it. The canonical link does not itself implement a redirect. This requires a live hosting check.
4. Verify production contains no `noindex` on intended pages, no login gate and no robots block on HTML, CSS or JavaScript. The 404 stays noindex. Do not expose the local preview as a second indexable version.
5. Inspect home, Mycelium, SARVAM, tiny-reranker and writing in Google Search Console's live URL Inspection tool. Check rendered content and the chosen canonical. Test supported schema in Rich Results Test, and broader schema in Schema Markup Validator.
6. Submit `https://nandanadileep.com/sitemap.xml` in Search Console and Bing Webmaster Tools. Verify domain ownership through the actual account/DNS flow; never insert invented verification tokens. Request indexing for the homepage and a few key project pages, not repeated bulk requests.
7. Run PageSpeed Insights on mobile and desktop after hosting. Check LCP, INP and CLS using field data when available, then diagnose with lab data. Targets are LCP at most 2.5 seconds, INP at most 200 ms and CLS at most 0.1 at the 75th percentile. No score is claimed from the local build.
8. Confirm social preview images resolve publicly and titles describe the correct project. Check all old sitemap URLs still work and decide separately whether any obsolete article needs a genuine redirect.

## Authority and distribution

The site changes are one part of search visibility. The next high-value work is making the identity and project evidence consistent across public profiles. These are proposed edits, not changes made to external accounts:

- LinkedIn headline: the one in the Headline section above. Point the Featured section to Mycelium, the inference work and the portfolio project index.
- GitHub profile: use the same name, headline and portfolio domain. Link maintained repositories to their relevant case-study pages, not all to an undifferentiated homepage.
- Mycelium documentation and PyPI: identify the maintainer consistently and link to the project page where appropriate. Date download snapshots when next updating the count; downloads change over time.
- Medium biography: link to the portfolio. Add a relevant case-study link to the matching original engineering article only when it helps the reader. Do not publish duplicate full articles on the portfolio without resolving the canonical/original-publication relationship.
- Share original, reproducible work in relevant engineering communities when it answers a real question. Avoid purchased links, automated outreach, irrelevant directories and mass-produced keyword pages.
- For startup recruiting, make the project pages easy to use as evidence: problem, constraints, design decisions, measured outcomes, what failed, operational lessons and a clear way to contact the engineer. This is more useful than repeating “startup engineer” throughout every page.

## Next 90 days

| When | Work | Evidence to collect |
| --- | --- | --- |
| Now | Paste the LinkedIn headline and About. Verify the live homepage shows the new headline and the new `resume.pdf` | Live title and description, PDF date, LinkedIn text matching the site |
| Launch week | Verify ownership, inspect pages, submit sitemap | Live response codes, rendered HTML, canonical choice, sitemap acceptance |
| Weeks 2–4 | Check index coverage and search queries; reconcile public identity links | Indexed project URLs, branded impressions, non-branded impressions, referring pages |
| Month 2 | Expand one genuinely useful original article around a query already showing impressions | Query-to-page relevance, engagement and useful links earned |
| Month 3 | Compare equivalent periods; improve weak snippets or unclear pages | Clicks, impressions, CTR, position by query/page, contact or resume actions if tracking is enabled |

Start with Search Console without adding third-party analytics by default. Track the exact name and spelling variants separately from non-branded engineering searches. Split branded/non-branded queries and inspect countries and devices; average position alone is not a hiring outcome. For low-traffic pages, use longer periods before drawing conclusions. Do not change all titles every week or interpret one ranking fluctuation as proof.

Suggested future articles should come from work already done: how Mycelium handles an uncertain tool-call outcome; when faster GPU kernels fail to improve HTTP latency; continuous batching on Apple Silicon; preventing starvation in learned test prioritization. Only publish material that can be supported and, for employer work, is suitable for public sharing. The current build uses the content already supplied for this portfolio.

## References

- [Google's SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide): discovery, realistic timing and no ranking guarantees.
- [JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics): crawlable routes and initial HTML.
- [Crawlable links](https://developers.google.com/search/docs/crawling-indexing/links-crawlable): actual anchors and useful link text.
- [ProfilePage structured data](https://developers.google.com/search/docs/appearance/structured-data/profile-page): person-focused pages and eligibility.
- [Search spam policies](https://developers.google.com/search/docs/essentials/spam-policies): doorway pages, keyword stuffing and scaled low-value content.
- [Core Web Vitals](https://web.dev/articles/vitals): field metrics and thresholds.

The browser-control service could not locate an available browser window during this pass. Static and local HTTP checks are recorded separately; a visual browser pass and live Google validation remain launch checks.
