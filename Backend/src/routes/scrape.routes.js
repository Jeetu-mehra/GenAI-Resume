const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const { scrapeJobController } = require("../controllers/scrape.controller")

const scrapeRouter = express.Router()

/**
 * @route POST /api/scrape/job
 * @description Scrape a job description from a given URL.
 * @access private
 */
scrapeRouter.post("/job", authMiddleware.authUser, scrapeJobController)

module.exports = scrapeRouter
