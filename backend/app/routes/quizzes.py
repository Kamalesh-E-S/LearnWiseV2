from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.routes import get_current_user
from app.services.llm import llm_service
from app.models import ComprehensiveRoadmap, QuizAttempt, QuizTemplate
from datetime import datetime

router = APIRouter()


@router.post("/generate")
async def generate_quiz(
    data: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        roadmap_id = data.get("roadmap_id")
        node_id = data.get("node_id")
        topic = data.get("topic")

        if not roadmap_id or not node_id:
            raise HTTPException(status_code=400, detail="roadmap_id and node_id are required")

        roadmap = db.query(ComprehensiveRoadmap).filter(
            ComprehensiveRoadmap.id == roadmap_id,
            ComprehensiveRoadmap.user_id == current_user.id
        ).first()

        if not roadmap:
            raise HTTPException(status_code=404, detail="Roadmap not found")

        # If topic not provided, try to get from roadmap node descriptions or nodes
        if not topic:
            topic = None
            # Try node_desc mapping
            if roadmap.node_desc and node_id in roadmap.node_desc:
                topic = roadmap.node_desc.get(node_id)

            # Fallback to searching nodes list
            if not topic and roadmap.nodes:
                for n in roadmap.nodes:
                    if n.get("id") == node_id:
                        topic = n.get("text")
                        break

        if not topic:
            raise HTTPException(status_code=400, detail="Unable to determine topic for quiz")

        # Check if a quiz template already exists for this user/roadmap/node
        quiz_template = db.query(QuizTemplate).filter(
            QuizTemplate.user_id == current_user.id,
            QuizTemplate.roadmap_id == roadmap_id,
            QuizTemplate.node_id == node_id
        ).first()

        if quiz_template and quiz_template.quiz_json:
            return {"success": True, "quiz": quiz_template.quiz_json}

        # Otherwise request quiz generation from LLM service (include skill and target level)
        llm_resp = await llm_service.generate_quiz_for_topic(topic, skill=roadmap.skill, level=roadmap.target_level)

        if not llm_resp.get("success"):
            raise HTTPException(status_code=500, detail=llm_resp.get("error") or "LLM failed to generate quiz")

        quiz_data = llm_resp.get("data")

        # Persist QuizTemplate record
        if quiz_template:
            quiz_template.quiz_json = quiz_data
            quiz_template.updated_at = datetime.utcnow()
        else:
            quiz_template = QuizTemplate(
                user_id=current_user.id,
                roadmap_id=roadmap_id,
                node_id=node_id,
                quiz_json=quiz_data,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(quiz_template)
        db.commit()

        return {"success": True, "quiz": quiz_data}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/attempts')
async def get_attempts(roadmap_id: int, node_id: str, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        record = db.query(QuizAttempt).filter(
            QuizAttempt.user_id == current_user.id,
            QuizAttempt.roadmap_id == roadmap_id,
            QuizAttempt.node_id == node_id
        ).first()

        if not record:
            return {"success": True, "data": {"attempts": 0, "best_score": None, "best_total": None, "passed": False}}

        return {"success": True, "data": {"attempts": record.attempts or 0, "best_score": record.best_score, "best_total": record.best_total, "passed": bool(record.passed)}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/submit")
async def submit_quiz(
    data: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        print("[quizzes.submit] payload:", data)
        roadmap_id = data.get("roadmap_id")
        node_id = data.get("node_id")
        score = int(data.get("score", 0))
        total = int(data.get("total", 0))
        answers = data.get("answers", {})

        if not roadmap_id or not node_id:
            raise HTTPException(status_code=400, detail="roadmap_id and node_id are required")

        roadmap = db.query(ComprehensiveRoadmap).filter(
            ComprehensiveRoadmap.id == roadmap_id,
            ComprehensiveRoadmap.user_id == current_user.id
        ).first()

        if not roadmap:
            raise HTTPException(status_code=404, detail="Roadmap not found")

        # Determine pass threshold (80%)
        passed = (total > 0) and ((score / total) >= 0.8)

        # Find existing record
        record = db.query(QuizAttempt).filter(
            QuizAttempt.user_id == current_user.id,
            QuizAttempt.roadmap_id == roadmap_id,
            QuizAttempt.node_id == node_id
        ).first()

        if record:
            record.attempts = (record.attempts or 0) + 1
            # update best score if this attempt is better
            if (record.best_score is None) or (score / total > (record.best_score or 0) / (record.best_total or 1)):
                record.best_score = score
                record.best_total = total
            record.passed = record.passed or passed
            record.updated_at = datetime.utcnow()
        else:
            record = QuizAttempt(
                user_id=current_user.id,
                roadmap_id=roadmap_id,
                node_id=node_id,
                attempts=1,
                best_score=score,
                best_total=total,
                passed=passed,
                updated_at=datetime.utcnow()
            )
            db.add(record)

        # If passed, mark node as completed in roadmap
        if passed:
            marked = list(roadmap.marked_nodes) if roadmap.marked_nodes else []
            if node_id not in marked:
                marked.append(node_id)
                roadmap.marked_nodes = marked

            # update nodes completion flag
            if roadmap.nodes:
                roadmap.nodes = [ {**n, "completed": n.get("id") in marked} for n in roadmap.nodes ]

        roadmap.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(record)
        print(f"[quizzes.submit] saved attempt id={record.id} passed={record.passed} attempts={record.attempts}")

        return {"success": True, "attempt_id": record.id, "passed": record.passed, "score": score, "total": total, "attempts": record.attempts}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
