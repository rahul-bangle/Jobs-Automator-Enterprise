import asyncio
import logging
from dotenv import load_dotenv
load_dotenv() 

from app.services.resume_parser import resume_parser

async def test_parse():
    sample_text = """
    Rahul Bangle
    Full Stack Developer
    Experience: 5 years at TechCorp building automation tools with Python and React.
    Skills: Python, Javascript, SQL, FastAPI.
    """
    print("Sending sample text to LLM parser...")
    try:
        result = await resume_parser.parse_text_to_json(sample_text)
        print("Success! Result:")
        print(result)
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(test_parse())
