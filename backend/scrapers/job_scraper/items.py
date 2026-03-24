import scrapy

class JobItem(scrapy.Item):
    id = scrapy.Field()
    company_name = scrapy.Field()
    job_title = scrapy.Field()
    source_url = scrapy.Field()
    location = scrapy.Field()
    description_raw = scrapy.Field()
