
from pydantic import BaseModel, ConfigDict

from app.schemas.antenatal_visit import AntenatalVisitResponse
from app.schemas.follow_up_task import FollowUpTaskResponse


class WorkerScheduleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    antenatal_visits: list[AntenatalVisitResponse]
    follow_up_tasks: list[FollowUpTaskResponse]
