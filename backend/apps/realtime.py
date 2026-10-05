import os
import json
import logging
from datetime import datetime
import redis

logger = logging.getLogger('springai.realtime')

REDIS_URL = os.environ.get('REDIS_URL', 'redis://redis:6379/0')

_redis_client = None

def get_redis_client():
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
            _redis_client.ping()
        except Exception as e:
            logger.warning(f"Could not connect to Redis at {REDIS_URL}: {e}")
            _redis_client = None
    return _redis_client

def publish_realtime_event(event: str, data: dict, channel: str = 'springai_events') -> bool:
    """
    Publishes an event to the Redis Pub/Sub channel.
    Node.js / Express gateway listens to this channel and immediately propagates
    it via Socket.io to all connected frontend clients.
    """
    client = get_redis_client()
    if not client:
        logger.debug(f"[Realtime Skipped] Redis offline. Event: {event}")
        return False
    try:
        payload = json.dumps({
            "event": event,
            "data": data,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        })
        client.publish(channel, payload)
        return True
    except Exception as e:
        logger.error(f"Failed to publish event {event} to channel {channel}: {e}")
        return False
