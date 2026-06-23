import aio_pika
import json
from src.services.config import settings

class RabbitMQService:
    def __init__(self):
        self.url = settings.RABBITMQ_URL

    async def publish_critical_message(self, queue_name: str, payload: dict):
        try:
            # Create persistent connection
            connection = await aio_pika.connect_robust(self.url)
            
            async with connection:
                channel = await connection.channel()
                
                # Declare queue, making it durable so it survives broker restarts
                queue = await channel.declare_queue(queue_name, durable=True)
                
                # Publish the message with DeliveryMode.PERSISTENT
                await channel.default_exchange.publish(
                    aio_pika.Message(
                        body=json.dumps(payload).encode(),
                        delivery_mode=aio_pika.DeliveryMode.PERSISTENT
                    ),
                    routing_key=queue_name,
                )
                print(f"[RabbitMQ] Successfully published to {queue_name}: {payload}")
                
        except Exception as e:
            print(f"[RabbitMQ Error] Failed to publish message: {e}")

rabbitmq_service = RabbitMQService()
