import os
import logging
from dotenv import load_dotenv
from groq import Groq, AsyncGroq

# Ensure environment is loaded before client init
load_dotenv()

logger = logging.getLogger("CoreLLM")

api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    logger.warning("GROQ_API_KEY not found in environment. LLM services will fail.")
    llm_client = None
    async_llm_client = None
else:
    llm_client = Groq(api_key=api_key)
    async_llm_client = AsyncGroq(api_key=api_key)
