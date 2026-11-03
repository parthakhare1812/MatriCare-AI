
import logging

from app.database.session import SessionLocal
from app.services.overdue_follow_up_service import (
    process_overdue_follow_up_tasks,
)
from app.services.upcoming_follow_up_service import (
    process_upcoming_follow_up_tasks,
)
from app.services.follow_up_escalation_service import (
    process_follow_up_escalations,
)


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


def run_job(db, job_name, job_function):
    try:
        db.rollback()

        result = job_function(db)

        logger.info("%s completed successfully: %s", job_name, result)

        return True

    except Exception:
        db.rollback()

        logger.exception("%s failed", job_name)

        return False


def main():
    db = SessionLocal()

    try:
        logger.info("Starting follow-up processing")

        jobs = [
            (
                "Upcoming reminders",
                process_upcoming_follow_up_tasks,
            ),
            (
                "Overdue follow-ups",
                process_overdue_follow_up_tasks,
            ),
            (
                "Follow-up escalations",
                process_follow_up_escalations,
            ),
        ]

        failed_jobs = []

        for job_name, job_function in jobs:
            success = run_job(
                db,
                job_name,
                job_function,
            )

            if not success:
                failed_jobs.append(job_name)

        if failed_jobs:
            logger.error(
                "Follow-up processing completed with failures: %s",
                failed_jobs,
            )

            raise RuntimeError(
                f"Failed processing jobs: {', '.join(failed_jobs)}"
            )

        logger.info("All follow-up processing jobs completed successfully")

    finally:
        db.close()


if __name__ == "__main__":
    main()
