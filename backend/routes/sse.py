import asyncio
import json
from fastapi import APIRouter, Depends, Request
from sse_starlette.sse import EventSourceResponse
from sqlalchemy.orm import Session

from database import get_db
from models import Household
from routes.auth import get_current_household

router = APIRouter(tags=["sse"])

# Store active connections per household
connections: dict[int, list[asyncio.Queue]] = {}


async def notify_change(household_id: int, event_type: str, data: dict | None = None):
    """Notify all connected clients of a household about a change."""
    if household_id not in connections:
        return

    message = json.dumps({
        "type": event_type,
        "data": data or {}
    })

    for queue in connections[household_id]:
        await queue.put(message)


@router.get("/sse")
async def sse_endpoint(
    request: Request,
    household: Household = Depends(get_current_household),
    db: Session = Depends(get_db)
):
    household_id = household.id

    if household_id not in connections:
        connections[household_id] = []

    queue: asyncio.Queue = asyncio.Queue()
    connections[household_id].append(queue)

    async def event_generator():
        try:
            yield {"event": "connected", "data": json.dumps({"status": "connected"})}

            while True:
                if await request.is_disconnected():
                    break

                try:
                    message = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield {"event": "update", "data": message}
                except asyncio.TimeoutError:
                    yield {"event": "ping", "data": ""}

        finally:
            if household_id in connections:
                connections[household_id].remove(queue)
                if not connections[household_id]:
                    del connections[household_id]

    return EventSourceResponse(event_generator())
