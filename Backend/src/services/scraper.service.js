const puppeteer = require("puppeteer")

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

/**
 * Launches a Puppeteer browser with anti-bot evasion flags.
 */
async function launchBrowser() {
    return puppeteer.launch({
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-blink-features=AutomationControlled",
        ]
    })
}

/**
 * Cleans raw scraped text — collapses excess whitespace and blank lines.
 */
function cleanText(text) {
    return text
        .replace(/\r\n/g, "\n")
        .replace(/[ \t]{2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
}

/**
 * Validates that a LinkedIn URL points to a specific job posting,
 * not a search results / feed / profile page.
 * Returns an error string, or null if valid.
 */
function validateLinkedInUrl(url) {
    const parsed = new URL(url)
    const path = parsed.pathname

    // Must be /jobs/view/... to be a specific job posting
    if (path.startsWith("/jobs/view/") || path.startsWith("/jobs/collections/")) {
        return null
    }

    // Search results, feed, profile, etc.
    if (
        path.startsWith("/jobs/search") ||
        path.startsWith("/jobs/search-results") ||
        path === "/jobs/" ||
        path === "/jobs" ||
        path.startsWith("/feed") ||
        path.startsWith("/in/")
    ) {
        return "Please open a specific LinkedIn job posting first, then copy its URL.\n\nA valid LinkedIn job URL looks like:\nhttps://www.linkedin.com/jobs/view/job-title-at-company-1234567890"
    }

    return null
}

/**
 * LinkedIn-specific extractor.
 * Handles both the authenticated (/jobs/view) and guest public job pages.
 */
async function scrapeLinkedIn(page) {
    // Check current URL after navigation (LinkedIn may have redirected)
    const currentUrl = page.url()

    // Detect redirect to login / auth wall
    if (
        currentUrl.includes("/uas/login") ||
        currentUrl.includes("/authwall") ||
        currentUrl.includes("/checkpoint/")
    ) {
        throw new Error(
            "LinkedIn requires you to be signed in to view this page.\n\n" +
            "Please open the job posting in your browser, copy the URL from the address bar, and paste it here.\n\n" +
            "A valid LinkedIn job URL looks like:\nhttps://www.linkedin.com/jobs/view/job-title-at-company-1234567890"
        )
    }

    // Try clicking "Show more" to expand the truncated description
    try {
        await page.waitForSelector(".show-more-less-html__button--more", { timeout: 3000 })
        await page.click(".show-more-less-html__button--more")
        await new Promise(r => setTimeout(r, 800))
    } catch (_) { /* button may not exist or already expanded */ }

    const text = await page.evaluate(() => {
        // Title + company (public job card format)
        const titleEl = document.querySelector([
            ".job-details-jobs-unified-top-card__job-title",
            "h1.topcard__title",
            "h1",
        ].join(", "))

        const companyEl = document.querySelector([
            ".job-details-jobs-unified-top-card__company-name",
            "a.topcard__org-name-link",
            ".topcard__flavor--black-link",
        ].join(", "))

        // Description — try all known LinkedIn description selectors
        const descEl = document.querySelector([
            ".show-more-less-html__markup",
            ".description__text",
            ".jobs-description__content",
            ".jobs-box__html-content",
        ].join(", "))

        const title = titleEl?.innerText?.trim() || ""
        const company = companyEl?.innerText?.trim() || ""
        const desc = descEl?.innerText?.trim() || ""

        return (title && company ? `${title} at ${company}\n\n` : "") + desc
    })

    return text
}

/**
 * Indeed-specific extractor.
 */
async function scrapeIndeed(page) {
    return page.evaluate(() => {
        const titleEl = document.querySelector("h1.jobsearch-JobInfoHeader-title, h1[data-testid='jobsearch-JobInfoHeader-title']")
        const companyEl = document.querySelector("[data-testid='inlineHeader-companyName'], .jobsearch-InlineCompanyRating-companyHeader")
        const descEl = document.querySelector("#jobDescriptionText, .jobsearch-jobDescriptionText")

        const title = titleEl?.innerText?.trim() || ""
        const company = companyEl?.innerText?.trim() || ""
        const desc = descEl?.innerText?.trim() || ""

        return (title && company ? `${title} at ${company}\n\n` : "") + desc
    })
}

/**
 * Generic extractor — finds the largest meaningful text block.
 * Fallback for Glassdoor, Naukri, AngelList, Wellfound, etc.
 */
async function scrapeGeneric(page) {
    return page.evaluate(() => {
        const prioritySelectors = [
            "[class*='job-description']",
            "[class*='jobDescription']",
            "[class*='job_description']",
            "[id*='job-description']",
            "[id*='jobDescription']",
            "[class*='description']",
            "article",
            "main",
        ]

        for (const sel of prioritySelectors) {
            const el = document.querySelector(sel)
            if (el && el.innerText.length > 200) {
                return el.innerText.trim()
            }
        }

        // Last resort: largest block
        let best = ""
        for (const el of document.querySelectorAll("p, div, section")) {
            const text = el.innerText?.trim() || ""
            if (text.length > best.length) best = text
        }
        return best
    })
}

/**
 * Main entry point.
 * @param {string} url - Job posting URL
 * @returns {Promise<string>} - Extracted + cleaned job description text
 */
async function scrapeJobDescription(url) {
    const parsedUrl = new URL(url)
    const hostname = parsedUrl.hostname

    // Pre-flight LinkedIn URL validation (before even launching browser)
    if (hostname.includes("linkedin.com")) {
        const validationError = validateLinkedInUrl(url)
        if (validationError) {
            throw new Error(validationError)
        }
    }

    const browser = await launchBrowser()
    const page = await browser.newPage()

    try {
        // Set a real browser user agent
        await page.setUserAgent(USER_AGENT)
        await page.setExtraHTTPHeaders({
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        })

        // Block only heavy media — keep stylesheets so JS-heavy pages render
        await page.setRequestInterception(true)
        page.on("request", req => {
            const type = req.resourceType()
            if (["image", "font", "media"].includes(type)) {
                req.abort()
            } else {
                req.continue()
            }
        })

        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 })

        // Wait for JS-rendered content to settle
        await new Promise(r => setTimeout(r, 2000))

        let text = ""

        if (hostname.includes("linkedin.com")) {
            text = await scrapeLinkedIn(page)
        } else if (hostname.includes("indeed.com")) {
            text = await scrapeIndeed(page)
        } else {
            text = await scrapeGeneric(page)
        }

        const cleaned = cleanText(text)

        if (!cleaned || cleaned.length < 100) {
            throw new Error(
                "Could not extract job description from this URL.\n\n" +
                "This may happen if the site requires login or blocks automated access.\n" +
                "Please paste the job description text manually instead."
            )
        }

        return cleaned

    } finally {
        await browser.close()
    }
}

module.exports = { scrapeJobDescription }
