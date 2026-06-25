import cognee
import os
from typing import Optional

class CogneeService:
    def __init__(self):
        # We can configure cognee here if needed
        pass

    async def remember(self, text_or_filepath: str, user_id: str):
        """Ingests files or text into the permanent knowledge graph."""
        try:
            await cognee.remember(text_or_filepath, dataset_name=f"user_{user_id}")
            return f"Successfully remembered data for user {user_id}"
        except Exception as e:
            return f"Error remembering data: {str(e)}"

    async def recall(self, query: str, user_id: str):
        """Queries Cognee to recall historical context."""
        try:
            results = await cognee.recall(query_text=query, datasets=[f"user_{user_id}"])
            # cognee.recall returns a list of RecallResponse objects. Convert them to string for LLM readability.
            if not results:
                return "No matching memories found."
            
            formatted_results = []
            for item in results:
                # Format depends on RecallResponse type, typically has content or similar fields
                if hasattr(item, "content"):
                    formatted_results.append(str(item.content))
                else:
                    formatted_results.append(str(item))
            return "\n".join(formatted_results)
        except Exception as e:
            return f"Error recalling data: {str(e)}"

    async def improve(self, feedback: str, user_id: str):
        """Adapts the graph's weights based on human feedback."""
        try:
            dataset_name = f"user_{user_id}"
            # Record the feedback in memory
            await cognee.remember(feedback, dataset_name=dataset_name)
            # Run the improvement process on the dataset
            await cognee.improve(dataset=dataset_name)
            return f"Successfully improved memory with feedback for user {user_id}"
        except Exception as e:
            return f"Error improving memory: {str(e)}"

    async def forget(self, topic: str, user_id: str):
        """Surgically prunes specific datasets or everything from the graph."""
        try:
            dataset_name = f"user_{user_id}"
            if topic.lower() == "everything":
                await cognee.forget(everything=True)
            else:
                await cognee.forget(dataset=dataset_name)
            return f"Successfully forgot topic '{topic}' for user {user_id}"
        except Exception as e:
            return f"Error forgetting data: {str(e)}"

cognee_service = CogneeService()
