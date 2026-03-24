BOT_NAME = 'job_scraper'

SPIDER_MODULES = ['job_scraper.spiders']
NEWSPIDER_MODULE = 'job_scraper.spiders'

# Obey robots.txt rules
ROBOTSTXT_OBEY = False

# Configure maximum concurrent requests
CONCURRENT_REQUESTS = 1

# Download delay (Stealth)
DOWNLOAD_DELAY = 5
RANDOMIZE_DOWNLOAD_DELAY = True

# Disable cookies (Stealth)
COOKIES_ENABLED = False

# Enable or disable downloader middlewares
DOWNLOADER_MIDDLEWARES = {
    'job_scraper.middlewares.RotateUserAgentMiddleware': 400,
    'scrapy.downloadermiddlewares.useragent.UserAgentMiddleware': None,
}

# Configure item pipelines
ITEM_PIPELINES = {
    'job_scraper.pipelines.JobDedupePipeline': 300,
}

# Playwright settings
DOWNLOAD_HANDLERS = {
    "http": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
    "https": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
}

TWISTED_REACTOR = "twisted.internet.asyncioreactor.AsyncioSelectorReactor"

PLAYWRIGHT_BROWSER_TYPE = "chromium"
PLAYWRIGHT_LAUNCH_OPTIONS = {
    "headless": True,
    "args": ["--disable-blink-features=AutomationControlled"],
}
