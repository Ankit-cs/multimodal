import asyncio
import json
import aio_pika
from src.services.config import settings
from src.services.cognee import cognee_service

async def process_memory_correction(message: aio_pika.IncomingMessage):
    async with message.process():
        try:
            payload = json.loads(message.body.decode())
            print(f"[MemoryWorker] Processing correction event: {payload.get('session_id')}")
            
            user_id = payload.get("user_id", "default")
            feedback = payload.get("feedback")
            
            if feedback:
                result = await cognee_service.improve(feedback, user_id=user_id)
                print(f"[MemoryWorker] Graph improved: {result}")
        except Exception as e:
            print(f"[MemoryWorker Error] Failed to process message: {e}")

async def main():
    from cognee.modules.engine.operations.setup import setup as cognee_setup
    try:
        await cognee_setup()
    except Exception as e:
        print(f"[Cognee] MemoryWorker setup failed: {e}")
    print("Memory Worker Started. Listening for RabbitMQ memory correction events...")
    
    try:
        connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
        
        async with connection:
            channel = await connection.channel()
            await channel.set_qos(prefetch_count=10)
            
            queue = await channel.declare_queue("memory_correction_events", durable=True)
            
            await queue.consume(process_memory_correction)
            
            # Wait until terminated
            await asyncio.Future()
    except Exception as e:
        print(f"Memory Worker failed to start or crashed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
