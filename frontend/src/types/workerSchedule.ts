import type { AntenatalVisit } from "./antenatalVisit";
import type { FollowUpTask } from "./followUpTask";

export interface WorkerSchedule {
  antenatal_visits: AntenatalVisit[];
  follow_up_tasks: FollowUpTask[];
}