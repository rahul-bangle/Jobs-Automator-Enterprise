import hashlib
from itemadapter import ItemAdapter

class JobDedupePipeline:
    def process_item(self, item, spider):
        adapter = ItemAdapter(item)
        
        company = adapter.get('company_name', '').lower()
        title = adapter.get('job_title', '').lower()
        location = adapter.get('location', '').lower()
        
        if company and title and location:
            payload = f"{company}|{title}|{location}"
            job_id = hashlib.sha256(payload.encode()).hexdigest()
            adapter['id'] = job_id
            
        return item
