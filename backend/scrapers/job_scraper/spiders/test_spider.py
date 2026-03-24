import scrapy
from scrapy_playwright.page import PageMethod
from job_scraper.items import JobItem

class TestSpider(scrapy.Spider):
    name = "test_spider"
    
    def start_requests(self):
        # We test with a simple page that helps verify JS rendering or a public job site
        yield scrapy.Request(
            "https://www.google.com/search?q=software+engineer+jobs",
            meta={
                "playwright": True,
                "playwright_page_methods": [
                    PageMethod("wait_for_selector", "div"),
                ],
            },
            callback=self.parse
        )

    def parse(self, response):
        self.logger.info(f"✅ Successfully scraped: {response.url}")
        # Yield a dummy item to verify pipeline
        item = JobItem()
        item['company_name'] = "Test Company"
        item['job_title'] = "Test Job"
        item['location'] = "Remote"
        item['source_url'] = response.url
        yield item
