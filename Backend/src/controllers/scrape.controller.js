const { scrapeJobDescription } = require("../services/scraper.service")

/**
 * @description Controller to scrape a job description from a given URL.
 */
async function scrapeJobController(req, res) {
    try {
        const { url } = req.body

        if (!url) {
            return res.status(400).json({ message: "URL is required." })
        }

        // Basic URL validation
        try {
            new URL(url)
        } catch {
            return res.status(400).json({ message: "Invalid URL. Please provide a valid job posting URL." })
        }

        const jobDescription = await scrapeJobDescription(url)

        res.status(200).json({
            message: "Job description scraped successfully.",
            jobDescription
        })

    } catch (error) {
        console.error("Error in scrapeJobController:", error.message)
        res.status(500).json({
            message: error.message || "Failed to extract job description from the URL. Try pasting it manually."
        })
    }
}

module.exports = { scrapeJobController }
