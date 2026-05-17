# Graph Report - C:\Users\OmAgrawal\Downloads\dashboardaistudio  (2026-05-14)

## Corpus Check
- 111 files · ~120,291 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 361 nodes · 468 edges · 62 communities detected
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 57 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]

## God Nodes (most connected - your core abstractions)
1. `POST()` - 48 edges
2. `GET()` - 29 edges
3. `set()` - 12 edges
4. `main()` - 9 edges
5. `toDate()` - 9 edges
6. `useAuth()` - 9 edges
7. `DELETE()` - 8 edges
8. `handleMetaWebhook()` - 8 edges
9. `runChatbotFlow()` - 8 edges
10. `scrape_justdial()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `toDate()` --calls--> `trialDaysLeft()`  [INFERRED]
  app\admin\page.tsx → C:\Users\OmAgrawal\Downloads\dashboardaistudio\lib\features.ts
- `POST()` --calls--> `featuresFromPlan()`  [INFERRED]
  C:\Users\OmAgrawal\Downloads\dashboardaistudio\app\api\whatsapp\send\route.ts → C:\Users\OmAgrawal\Downloads\dashboardaistudio\lib\features.ts
- `scrape_justdial()` --calls--> `GET()`  [INFERRED]
  acrapper.py → C:\Users\OmAgrawal\Downloads\dashboardaistudio\app\api\whatsapp\broadcast\route.ts
- `scrape_indiamart()` --calls--> `GET()`  [INFERRED]
  acrapper.py → C:\Users\OmAgrawal\Downloads\dashboardaistudio\app\api\whatsapp\broadcast\route.ts
- `try_find_email()` --calls--> `GET()`  [INFERRED]
  acrapper.py → C:\Users\OmAgrawal\Downloads\dashboardaistudio\app\api\whatsapp\broadcast\route.ts

## Hyperedges (group relationships)
- **Local Development Setup Steps** — readme_nodejs, readme_npm_install, readme_gemini_api_key, readme_env_local, readme_npm_run_dev [EXTRACTED 1.00]

## Communities

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (12): toggleSelect(), buildEmailHtml(), concurrencyLimit(), createTransport(), DELETE(), generateUniqueCode(), metaGet(), POST() (+4 more)

### Community 1 - "Community 1"
Cohesion: 0.13
Nodes (22): extractMetaMessage(), getMetaCreds(), markRead(), metaPost(), sendButtons(), sendChoiceQuestion(), sendDocument(), sendImage() (+14 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (19): generateInvoiceHTML(), buildInvoiceBooking(), calcTotalPrice(), getDominantSharing(), getInvoiceCounter(), getInvoiceHistory(), getNetTotal(), getRemainingBalance() (+11 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (14): useAuth(), featuresFromPlan(), getDefaultFeatures(), trialDaysLeft(), OrgProvider(), useFeatureAccess(), useOrg(), AdminPage() (+6 more)

### Community 4 - "Community 4"
Cohesion: 0.1
Nodes (2): handleLogoUpload(), handleSave()

### Community 5 - "Community 5"
Cohesion: 0.22
Nodes (16): clean(), deduplicate(), main(), random_delay(), ====================================================  INDIA TRAVEL AGENCY LEAD, Scrape travel agencies from IndiaMART directory., Scrape travel agencies from Google Maps using Playwright (headless browser)., Attempt to find a contact email from a website's homepage or contact page. (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.14
Nodes (8): relativeDate(), formatDate(), formatTime(), handleKeyDown(), sendMessage(), toDate(), trialDaysLeft(), serialize()

### Community 7 - "Community 7"
Cohesion: 0.18
Nodes (7): calcDropdownPos(), handleAssigneeChange(), handleBatchAssign(), openActionDropdown(), openAssigneeDropdown(), openStatusDropdown(), sendAssignmentEmail()

### Community 8 - "Community 8"
Cohesion: 0.23
Nodes (8): calcTotal(), dominantType(), getTicketTypes(), handleBookingSubmit(), handleFormComplete(), openBooking(), toggleDay(), totalPersons()

### Community 9 - "Community 9"
Cohesion: 0.17
Nodes (2): closeTemplateModal(), saveTemplate()

### Community 10 - "Community 10"
Cohesion: 0.27
Nodes (9): middleware(), resolveHostToOrgId(), addDay(), addListItem(), removeDay(), removeListItem(), set(), updateDay() (+1 more)

### Community 11 - "Community 11"
Cohesion: 0.27
Nodes (4): addChoice(), removeChoice(), updateChoice(), updateQuestion()

### Community 12 - "Community 12"
Cohesion: 0.29
Nodes (5): getMessagingInstance(), requestNotificationPermission(), setupForegroundHandler(), silentTokenRefresh(), handleEnable()

### Community 13 - "Community 13"
Cohesion: 0.25
Nodes (2): handleSend(), resolveVars()

### Community 14 - "Community 14"
Cohesion: 0.43
Nodes (4): handleInvite(), handleRemoveMember(), handleRoleChange(), sendRoleNotification()

### Community 15 - "Community 15"
Cohesion: 0.33
Nodes (7): AI Studio App, .env.local, GEMINI_API_KEY, GitHub Banner Image, Node.js, npm install, npm run dev

### Community 16 - "Community 16"
Cohesion: 0.5
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 0.5
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 0.67
Nodes (2): generateMetadata(), getWebsiteSettings()

### Community 19 - "Community 19"
Cohesion: 0.5
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 0.5
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 0.83
Nodes (3): ensureFonts(), fmt(), generateInvoicePdfBuffer()

### Community 22 - "Community 22"
Cohesion: 0.67
Nodes (0): 

### Community 23 - "Community 23"
Cohesion: 0.67
Nodes (0): 

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (0): 

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (0): 

### Community 57 - "Community 57"
Cohesion: 1.0
Nodes (0): 

### Community 58 - "Community 58"
Cohesion: 1.0
Nodes (0): 

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (0): 

### Community 60 - "Community 60"
Cohesion: 1.0
Nodes (0): 

### Community 61 - "Community 61"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **9 isolated node(s):** `====================================================  INDIA TRAVEL AGENCY LEAD`, `Scrape travel agencies from Justdial for a given city.`, `Scrape travel agencies from IndiaMART directory.`, `Scrape travel agencies from Google Maps using Playwright (headless browser).`, `Attempt to find a contact email from a website's homepage or contact page.` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 24`** (2 nodes): `layout.tsx`, `RootLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (2 nodes): `page.tsx`, `RootPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (2 nodes): `robots.ts`, `robots()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (2 nodes): `sitemap.ts`, `sitemap()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (2 nodes): `layout.tsx`, `LandingLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (2 nodes): `page.tsx`, `BlogPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (2 nodes): `page.tsx`, `FeaturesPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (2 nodes): `page.tsx`, `VsLeadSquaredPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (2 nodes): `page.tsx`, `MarketingPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (2 nodes): `page.tsx`, `handleCreateOrg()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (2 nodes): `ContactForm.tsx`, `handleContact()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (2 nodes): `NavbarClient.tsx`, `NavbarClient()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (2 nodes): `CreateLeadModal.tsx`, `handleSubmit()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (2 nodes): `ImportLeads.tsx`, `handleFileUpload()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (2 nodes): `SchemaMarkup.tsx`, `SchemaMarkup()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (2 nodes): `Stats.tsx`, `Stats()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (2 nodes): `use-mobile.ts`, `useIsMobile()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (2 nodes): `utils.ts`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `eslint.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (1 nodes): `postcss.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (1 nodes): `Header.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (1 nodes): `MobilePreview.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (1 nodes): `SiteFooter.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (1 nodes): `firebase-admin.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (1 nodes): `firebase.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (1 nodes): `firebase-messaging-sw.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (1 nodes): `html2pdf.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `POST()` connect `Community 0` to `Community 1`, `Community 3`, `Community 5`, `Community 6`, `Community 10`, `Community 21`?**
  _High betweenness centrality (0.227) - this node is a cross-community bridge._
- **Why does `toDate()` connect `Community 6` to `Community 0`, `Community 2`, `Community 3`?**
  _High betweenness centrality (0.164) - this node is a cross-community bridge._
- **Why does `set()` connect `Community 10` to `Community 0`, `Community 1`, `Community 4`, `Community 5`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `POST()` (e.g. with `set()` and `update()`) actually correct?**
  _`POST()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `GET()` (e.g. with `scrape_justdial()` and `scrape_indiamart()`) actually correct?**
  _`GET()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `set()` (e.g. with `deduplicate()` and `resolveHostToOrgId()`) actually correct?**
  _`set()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `toDate()` (e.g. with `serialize()` and `POST()`) actually correct?**
  _`toDate()` has 6 INFERRED edges - model-reasoned connections that need verification._