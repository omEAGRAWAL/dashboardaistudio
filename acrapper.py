"""
====================================================
 INDIA TRAVEL AGENCY LEAD SCRAPER
 Sources: Google Maps, Justdial, IndiaMART
 Output : travel_agency_leads.csv
====================================================

SETUP (run once):
    pip install requests beautifulsoup4 pandas playwright lxml
    playwright install chromium

RUN:
    python travel_agency_scraper.py

"""

import time
import random
import re
import csv
import os
import pandas as pd
from datetime import datetime
from bs4 import BeautifulSoup
import requests

# ─────────────────────────────────────────────
#  CONFIG
# ─────────────────────────────────────────────

CITIES = [
    "Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad",
    "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow",
    "Bhubaneswar", "Kochi", "Goa", "Chandigarh", "Surat",
    "Nagpur", "Indore", "Coimbatore", "Visakhapatnam", "Vadodara"
]

OUTPUT_FILE = "travel_agency_leads.csv"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Referer": "https://www.google.com/",
}

def random_delay(min_s=1.5, max_s=3.5):
    time.sleep(random.uniform(min_s, max_s))

def clean(text):
    if not text:
        return ""
    return re.sub(r'\s+', ' ', text).strip()


# ─────────────────────────────────────────────
#  SOURCE 1: JUSTDIAL
# ─────────────────────────────────────────────

def scrape_justdial(city, max_pages=3):
    """Scrape travel agencies from Justdial for a given city."""
    leads = []
    session = requests.Session()
    session.headers.update(HEADERS)

    for page in range(1, max_pages + 1):
        if page == 1:
            url = f"https://www.justdial.com/{city}/Travel-Agents/nct-10000033"
        else:
            url = f"https://www.justdial.com/{city}/Travel-Agents/nct-10000033/page-{page}"

        try:
            print(f"  [Justdial] {city} page {page} ...")
            resp = session.get(url, timeout=15)
            if resp.status_code != 200:
                print(f"  [Justdial] Blocked/error {resp.status_code} for {city}")
                break

            soup = BeautifulSoup(resp.text, "lxml")

            # Each listing card
            cards = soup.select("li.cntanr") or soup.select("div.resultbox_info")
            if not cards:
                # Try alternate selector
                cards = soup.find_all("li", class_=re.compile("cntanr|resultbox"))

            if not cards:
                print(f"  [Justdial] No cards found for {city} page {page} — structure may have changed")
                break

            for card in cards:
                try:
                    name_tag = card.select_one("span.lng_lnk_cntanr, a.store-name, h2.jdtitle")
                    name = clean(name_tag.get_text()) if name_tag else ""

                    phone_tag = card.select_one("p.contact-info, span.callnow, a[href^='tel']")
                    phone = ""
                    if phone_tag:
                        phone = clean(phone_tag.get_text())
                        if not phone and phone_tag.get("href"):
                            phone = phone_tag["href"].replace("tel:", "")

                    addr_tag = card.select_one("span.addresss-info, p.address, span.jdtxt")
                    address = clean(addr_tag.get_text()) if addr_tag else ""

                    rating_tag = card.select_one("span.green-box, span.rting")
                    rating = clean(rating_tag.get_text()) if rating_tag else ""

                    website_tag = card.select_one("a[href*='http']:not([href*='justdial'])")
                    website = website_tag["href"] if website_tag else ""

                    if name:
                        leads.append({
                            "Source": "Justdial",
                            "City": city,
                            "Business Name": name,
                            "Phone": phone,
                            "Address": address,
                            "Rating": rating,
                            "Website": website,
                            "Email": "",
                        })
                except Exception as e:
                    continue

            random_delay(2, 4)

        except requests.RequestException as e:
            print(f"  [Justdial] Request failed for {city}: {e}")
            break

    print(f"  [Justdial] {city}: {len(leads)} leads found")
    return leads


# ─────────────────────────────────────────────
#  SOURCE 2: INDIAMART
# ─────────────────────────────────────────────

def scrape_indiamart(city, max_pages=2):
    """Scrape travel agencies from IndiaMART directory."""
    leads = []
    session = requests.Session()
    session.headers.update(HEADERS)

    city_slug = city.lower().replace(" ", "-")

    for page in range(1, max_pages + 1):
        url = (
            f"https://dir.indiamart.com/search.mp?"
            f"ss=travel+agency&prdsrc=1&city={city}&page={page}"
        )

        try:
            print(f"  [IndiaMART] {city} page {page} ...")
            resp = session.get(url, timeout=15)
            if resp.status_code != 200:
                print(f"  [IndiaMART] Error {resp.status_code}")
                break

            soup = BeautifulSoup(resp.text, "lxml")

            cards = soup.select("div.organic, div.card, div#cnt div.bname")
            if not cards:
                cards = soup.find_all("div", class_=re.compile("organic|bname|bdetail"))

            for card in cards:
                try:
                    name_tag = card.select_one("a.bname, h2, .company-name, a[class*='name']")
                    name = clean(name_tag.get_text()) if name_tag else ""

                    phone_tag = card.select_one("span.pns_h, span[class*='phone'], a[href^='tel']")
                    phone = ""
                    if phone_tag:
                        phone = clean(phone_tag.get_text())

                    addr_tag = card.select_one("span.add, span[class*='address'], p[class*='loc']")
                    address = clean(addr_tag.get_text()) if addr_tag else city

                    website_tag = card.select_one("a[href*='http']:not([href*='indiamart'])")
                    website = website_tag["href"] if website_tag else ""

                    if name:
                        leads.append({
                            "Source": "IndiaMART",
                            "City": city,
                            "Business Name": name,
                            "Phone": phone,
                            "Address": address,
                            "Rating": "",
                            "Website": website,
                            "Email": "",
                        })
                except Exception:
                    continue

            random_delay(2, 3)

        except requests.RequestException as e:
            print(f"  [IndiaMART] Request failed: {e}")
            break

    print(f"  [IndiaMART] {city}: {len(leads)} leads found")
    return leads


# ─────────────────────────────────────────────
#  SOURCE 3: GOOGLE MAPS (via Playwright)
# ─────────────────────────────────────────────

def scrape_google_maps(city, max_results=20):
    """
    Scrape travel agencies from Google Maps using Playwright (headless browser).
    Requires: playwright install chromium
    """
    leads = []

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("  [Google Maps] Playwright not installed. Run: pip install playwright && playwright install chromium")
        return leads

    search_query = f"travel agency in {city} India"
    maps_url = f"https://www.google.com/maps/search/{requests.utils.quote(search_query)}"

    print(f"  [Google Maps] Searching: {search_query}")

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                user_agent=HEADERS["User-Agent"],
                viewport={"width": 1280, "height": 800},
            )
            page = context.new_page()
            page.goto(maps_url, wait_until="networkidle", timeout=30000)
            time.sleep(3)

            # Dismiss cookie/consent dialogs if present
            try:
                page.click("button[aria-label='Accept all']", timeout=3000)
            except Exception:
                pass

            # Scroll to load more results
            results_panel = page.query_selector("div[role='feed']")
            if results_panel:
                for _ in range(5):
                    page.evaluate("arguments[0].scrollTop += 800", results_panel)
                    time.sleep(1.5)

            # Extract listing cards
            cards = page.query_selector_all("div.Nv2PK, a.hfpxzc, div[data-result-index]")

            for card in cards[:max_results]:
                try:
                    card.click()
                    time.sleep(2)

                    # Extract details from side panel
                    html = page.inner_html("div[role='main']")
                    soup = BeautifulSoup(html, "lxml")

                    name = clean(soup.select_one("h1.DUwDvf, h1")
                                 .get_text()) if soup.select_one("h1.DUwDvf, h1") else ""

                    phone = ""
                    for span in soup.select("span"):
                        txt = span.get_text()
                        if re.match(r'^(\+91|0)?[6-9]\d{9}$', txt.replace(" ", "").replace("-", "")):
                            phone = txt
                            break

                    addr_tag = soup.select_one("button[data-item-id='address'] .Io6YTe")
                    address = clean(addr_tag.get_text()) if addr_tag else city

                    website_tag = soup.select_one("a[data-item-id='authority']")
                    website = website_tag["href"] if website_tag else ""

                    rating_tag = soup.select_one("span.ceNzKf, div.F7nice span")
                    rating = clean(rating_tag.get_text()) if rating_tag else ""

                    if name:
                        leads.append({
                            "Source": "Google Maps",
                            "City": city,
                            "Business Name": name,
                            "Phone": phone,
                            "Address": address,
                            "Rating": rating,
                            "Website": website,
                            "Email": "",
                        })

                except Exception:
                    continue

            browser.close()

    except Exception as e:
        print(f"  [Google Maps] Error for {city}: {e}")

    print(f"  [Google Maps] {city}: {len(leads)} leads found")
    return leads


# ─────────────────────────────────────────────
#  BONUS: EMAIL FINDER (from website domains)
# ─────────────────────────────────────────────

def try_find_email(website):
    """Attempt to find a contact email from a website's homepage or contact page."""
    if not website or not website.startswith("http"):
        return ""
    try:
        session = requests.Session()
        session.headers.update(HEADERS)
        resp = session.get(website, timeout=8)
        emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', resp.text)
        # Filter out generic/spam emails
        filtered = [e for e in emails if not any(
            x in e.lower() for x in ["example", "test", "noreply", "support@w3", "schema"]
        )]
        return filtered[0] if filtered else ""
    except Exception:
        return ""


# ─────────────────────────────────────────────
#  DEDUPLICATE LEADS
# ─────────────────────────────────────────────

def deduplicate(leads):
    seen = set()
    unique = []
    for lead in leads:
        key = (
            lead["Business Name"].lower().strip(),
            lead["City"].lower().strip()
        )
        if key not in seen and lead["Business Name"]:
            seen.add(key)
            unique.append(lead)
    return unique


# ─────────────────────────────────────────────
#  MAIN
# ─────────────────────────────────────────────

def save_leads(leads, filepath):
    """Write current leads list to CSV (overwrites each time)."""
    if not leads:
        return
    df = pd.DataFrame(leads, columns=[
        "Source", "City", "Business Name", "Phone", "Address", "Rating", "Website", "Email"
    ])
    df.index += 1
    df.to_csv(filepath, index_label="S.No", encoding="utf-8-sig")


def main():
    print("=" * 55)
    print("  INDIA TRAVEL AGENCY LEAD SCRAPER")
    print(f"  Cities: {len(CITIES)} | Sources: Justdial, IndiaMART, Google Maps")
    print("=" * 55)

    all_leads = []

    for city in CITIES:
        print(f"\n[City] Scraping: {city}")
        print("-" * 40)

        # --- Justdial ---
        try:
            jd_leads = scrape_justdial(city, max_pages=3)
            all_leads.extend(jd_leads)
            save_leads(all_leads, OUTPUT_FILE)
        except Exception as e:
            print(f"  [Justdial] Skipped {city}: {e}")

        random_delay(1, 2)

        # --- IndiaMART ---
        try:
            im_leads = scrape_indiamart(city, max_pages=2)
            all_leads.extend(im_leads)
            save_leads(all_leads, OUTPUT_FILE)
        except Exception as e:
            print(f"  [IndiaMART] Skipped {city}: {e}")

        random_delay(1, 2)

        # --- Google Maps ---
        try:
            gm_leads = scrape_google_maps(city, max_results=20)
            all_leads.extend(gm_leads)
            save_leads(all_leads, OUTPUT_FILE)
        except Exception as e:
            print(f"  [Google Maps] Skipped {city}: {e}")

        print(f"  [Done] {city} done. Running total: {len(all_leads)} leads")
        random_delay(2, 4)

    # Deduplicate
    print(f"\n[Dedup] Deduplicating {len(all_leads)} raw leads...")
    unique_leads = deduplicate(all_leads)
    print(f"[Dedup] {len(unique_leads)} unique leads after deduplication")

    # Try to find emails from websites
    print("\n[Email] Attempting to find emails from websites...")
    for i, lead in enumerate(unique_leads):
        if lead.get("Website"):
            email = try_find_email(lead["Website"])
            if email:
                unique_leads[i]["Email"] = email
                print(f"  Found email for {lead['Business Name']}: {email}")
        if i % 10 == 0:
            random_delay(0.5, 1)
            save_leads(unique_leads, OUTPUT_FILE)

    # Final save
    save_leads(unique_leads, OUTPUT_FILE)

    print(f"\n[Done] DONE! {len(unique_leads)} leads saved to: {OUTPUT_FILE}")
    print(f"   Columns: Source, City, Business Name, Phone, Address, Rating, Website, Email")
    print(f"   Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M')}")

    # Summary by city and source
    df = pd.read_csv(OUTPUT_FILE, encoding="utf-8-sig")
    print("\n[Stats] Summary by Source:")
    print(df["Source"].value_counts().to_string())
    print("\n[Stats] Top Cities:")
    print(df["City"].value_counts().head(10).to_string())


if __name__ == "__main__":
    main()