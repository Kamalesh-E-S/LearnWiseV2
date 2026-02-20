from fastapi import APIRouter, Depends, HTTPException 
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import re

from app.database import get_db
from app.models import ComprehensiveRoadmap
from app.auth.routes import get_current_user, oauth2_scheme
from app.services.llm import llm_service
from app.services.resources import get_website_links, get_video_links
from app.services.jobs import jobs_service

router = APIRouter()

def parse_mermaid_to_nodes(mermaid_code):
    nodes = []
    for line in mermaid_code.split('\n'):
        if line.strip():
            match = re.search(r'\[(\w+)\]\s+(.+)$', line)
            if match:
                nodes.append({
                    'id': match.group(1),
                    'text': match.group(2),
                    'completed': False,
                    'varName': match.group(1)
                })
    return nodes

def parse_descriptions(desc_text):
    descriptions = {}
    for line in desc_text.split('\n'):
        if line.strip():
            parts = line.split(',', 1)
            if len(parts) == 2:
                node_id = parts[0]
                desc = parts[1].strip('()')
                descriptions[node_id] = desc
    return descriptions

# @router.post("/generate")
# async def generate_roadmap_content(
#     data: dict,
#     current_user = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     try:
#         content = await generate_roadmap(
#             skill=data["skill"],
#             timeframe=data["timeframe"],
#             current_knowledge=data["current_knowledge"],
#             target_level=data["target_level"]
#         )
        
#         return {
#             "success": True,
#             "data": content
#         }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

@router.post("/create")
async def create_roadmap(
    data: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        print("\n=== Starting Roadmap Creation ===")
        print(f"Received data: {data}")

        # Generate roadmap content using LLM
        print("Generating roadmap content using LLM...")
        llm_response = await llm_service.generate_roadmap_content(
            skill=data["skill"],
            timeframe=data["timeframe"],
            current_knowledge=data["current_knowledge"],
            target_level=data["target_level"]
        )
        
        if not llm_response["success"]:
            raise HTTPException(status_code=500, detail=llm_response["error"])
            
        # Parse generated content
        mermaid_content = llm_response["data"]["mermaid"]
        
        # Parse nodes from generated mermaid
        nodes = parse_mermaid_to_nodes(mermaid_content)
        print(f"\nParsed Nodes: {len(nodes)} nodes created")

        # Generate descriptions and resources for each node
        descriptions = {}
        for node in nodes:
            node_id = node["id"]
            node_text = node["text"]
            
            # Skip getting resources for time-related nodes
            if any(time_word in node_text.lower() for time_word in ['day', 'am','pm','morning','afternoon','night','week','hour', 'month', 'year']):
                descriptions[node_id] = f"Time period: {node_text}"
                continue
            
            # Get resources for the node, including the skill name in the search
            # search_query = f"{data['skill']} {node_text}"
            # websites = get_website_links(search_query)
            # videos = get_video_links(search_query)
            websites = get_website_links(node_text)
            videos = get_video_links(node_text)

            
            # Format description to match NodeInfo.jsx expected format
            description = f"Learn {node_text}"
            
            # Add YouTube links if available
            if videos:
                description += f"\nyoutube links: {', '.join(videos)}"
            
            # Add website links if available
            if websites:
                description += f"\nwebsite links: {', '.join(websites)}"
            
            descriptions[node_id] = description
        
        print(f"Generated Descriptions: {len(descriptions)} descriptions created")

        # Create edges based on mermaid hierarchy
        edges = []
        lines = mermaid_content.split('\n')
        current_levels = {}
        
        for line in lines:
            if not line.strip():
                continue
            level = line.count('#')
            match = re.search(r'\[(\w+)\]', line)
            if match:
                node_id = match.group(1)
                if level > 1:
                    parent_level = level - 1
                    if parent_level in current_levels:
                        edges.append({
                            'id': f'{current_levels[parent_level]}-{node_id}',
                            'source': current_levels[parent_level],
                            'target': node_id
                        })
                current_levels[level] = node_id
        
        print(f"Created Edges: {len(edges)} edges created")

        print("\nCreating new roadmap in database...")
        new_roadmap = ComprehensiveRoadmap(
            user_id=current_user.id,
            skill=data["skill"],
            timeframe=data["timeframe"],
            current_knowledge=data["current_knowledge"],
            target_level=data["target_level"],
            content={
                'mermaid': mermaid_content,
                'descriptions': descriptions
            },
            nodes=nodes,
            edges=edges,
            node_desc=descriptions,
            marked_nodes=[],
            is_completed=False
        )
        
        db.add(new_roadmap)
        db.commit()
        db.refresh(new_roadmap)
        print(f"Roadmap created with ID: {new_roadmap.id}")
        
        response_data = {
            "success": True,
            "roadmap": {
                "id": new_roadmap.id,
                "skill": new_roadmap.skill,
                "timeframe": new_roadmap.timeframe,
                "current_knowledge": new_roadmap.current_knowledge,
                "target_level": new_roadmap.target_level,
                "content": new_roadmap.content,
                "nodes": new_roadmap.nodes,
                "edges": new_roadmap.edges,
                "node_desc": new_roadmap.node_desc,
                "marked_nodes": new_roadmap.marked_nodes,
                "is_completed": new_roadmap.is_completed
            }
        }
        print("\n=== Roadmap Creation Completed ===")
        return response_data
    except Exception as e:
        print(f"\nError creating roadmap: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ongoing")
async def get_ongoing_roadmaps(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        roadmaps = db.query(ComprehensiveRoadmap).filter(
            ComprehensiveRoadmap.user_id == current_user.id,
            ComprehensiveRoadmap.is_completed == False
        ).all()
        
        # Serialize roadmaps
        serialized_roadmaps = []
        for roadmap in roadmaps:
            serialized_roadmaps.append({
                "id": roadmap.id,
                "skill": roadmap.skill,
                "timeframe": roadmap.timeframe,
                "target_level": roadmap.target_level,
                "current_knowledge": roadmap.current_knowledge,
                "nodes": roadmap.nodes or [],
                "edges": roadmap.edges or [],
                "markmap": roadmap.content.get('mermaid', '') if roadmap.content else '',
                "descriptions": roadmap.content.get('descriptions', {}) if roadmap.content else {},
                "node_desc": roadmap.node_desc or {},
                "marked_nodes": roadmap.marked_nodes or [],
                "is_completed": roadmap.is_completed,
                "created_at": roadmap.created_at.isoformat() if roadmap.created_at else None,
                "updated_at": roadmap.updated_at.isoformat() if roadmap.updated_at else None
            })
        
        return {
            "success": True,
            "roadmaps": serialized_roadmaps
        }
    except Exception as e:
        print("Error in get_ongoing_roadmaps:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/completed")
async def get_completed_roadmaps(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        roadmaps = db.query(ComprehensiveRoadmap).filter(
            ComprehensiveRoadmap.user_id == current_user.id,
            ComprehensiveRoadmap.is_completed == True
        ).all()
        
        # Serialize roadmaps
        serialized_roadmaps = []
        for roadmap in roadmaps:
            serialized_roadmaps.append({
                "id": roadmap.id,
                "skill": roadmap.skill,
                "timeframe": roadmap.timeframe,
                "target_level": roadmap.target_level,
                "current_knowledge": roadmap.current_knowledge,
                "nodes": roadmap.nodes or [],
                "edges": roadmap.edges or [],
                "markmap": roadmap.content.get('mermaid', '') if roadmap.content else '',
                "descriptions": roadmap.content.get('descriptions', {}) if roadmap.content else {},
                "node_desc": roadmap.node_desc or {},
                "marked_nodes": roadmap.marked_nodes or [],
                "is_completed": roadmap.is_completed,
                "completed_at": roadmap.completed_at.isoformat() if roadmap.completed_at else None,
                "created_at": roadmap.created_at.isoformat() if roadmap.created_at else None,
                "updated_at": roadmap.updated_at.isoformat() if roadmap.updated_at else None
            })
        
        return {
            "success": True,
            "roadmaps": serialized_roadmaps
        }
    except Exception as e:
        print("Error in get_completed_roadmaps:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{roadmap_id}")
async def get_roadmap(
    roadmap_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        roadmap = db.query(ComprehensiveRoadmap).filter(
            ComprehensiveRoadmap.id == roadmap_id,
            ComprehensiveRoadmap.user_id == current_user.id
        ).first()
        
        if not roadmap:
            raise HTTPException(status_code=404, detail="Roadmap not found")
        
        # Get resources for each node, excluding level 2 nodes
        node_desc = {}
        for node in roadmap.nodes:
            node_id = node.get('id')
            node_text = node.get('text', '')
            
            # Skip level 2 nodes (time/days nodes)
            if node_id.startswith('a') and len(node_id) == 2:  # Level 2 nodes have IDs like 'a1', 'a2', etc.
                node_desc[node_id] = f"Time period: {node_text}"
                continue
            
            # Get resources for non-level 2 nodes, including the skill name in the search
            search_query = f"{roadmap.skill} {node_text}"
            websites = get_website_links(search_query)
            videos = get_video_links(search_query)
            
            # Format description to match NodeInfo.jsx expected format
            description = f"Learn {node_text}"
            
            # Add YouTube links if available
            if videos:
                description += f"\nyoutube links: {', '.join(videos)}"
            
            # Add website links if available
            if websites:
                description += f"\nwebsite links: {', '.join(websites)}"
            
            node_desc[node_id] = description
        
        # Serialize roadmap data
        serialized_roadmap = {
            "id": roadmap.id,
            "skill": roadmap.skill,
            "timeframe": roadmap.timeframe,
            "target_level": roadmap.target_level,
            "current_knowledge": roadmap.current_knowledge,
            "nodes": roadmap.nodes or [],
            "edges": roadmap.edges or [],
            "markmap": roadmap.content.get('mermaid', '') if roadmap.content else '',
            "descriptions": roadmap.content.get('descriptions', {}) if roadmap.content else {},
            "node_desc": node_desc,  # Use the newly generated node_desc
            "marked_nodes": roadmap.marked_nodes or [],
            "is_completed": roadmap.is_completed,
            "completed_at": roadmap.completed_at.isoformat() if roadmap.completed_at else None,
            "created_at": roadmap.created_at.isoformat() if roadmap.created_at else None,
            "updated_at": roadmap.updated_at.isoformat() if roadmap.updated_at else None
        }
        
        return {
            "success": True,
            "roadmap": serialized_roadmap
        }
    except Exception as e:
        print("Error in get_roadmap:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{roadmap_id}/mark-node")
async def mark_node(
    roadmap_id: int,
    data: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        roadmap = db.query(ComprehensiveRoadmap).filter(
            ComprehensiveRoadmap.id == roadmap_id,
            ComprehensiveRoadmap.user_id == current_user.id
        ).first()
        
        if not roadmap:
            raise HTTPException(status_code=404, detail="Roadmap not found")
        
        # Update marked nodes
        marked_nodes = list(roadmap.marked_nodes) if roadmap.marked_nodes else []
        node_id = data["node_id"]
        is_marked = data["is_marked"]
        
        if is_marked and node_id not in marked_nodes:
            marked_nodes.append(node_id)
        elif not is_marked and node_id in marked_nodes:
            marked_nodes.remove(node_id)
        
        # Update nodes completion status
        nodes = list(roadmap.nodes)
        for node in nodes:
            if node["id"] == node_id:
                node["completed"] = is_marked
        
        # Calculate completion percentage
        total_nodes = len(nodes)
        completed_nodes = len(marked_nodes)
        completion_percentage = (completed_nodes / total_nodes) * 100 if total_nodes > 0 else 0
        
        # Set completion status based on percentage
        is_completed = completion_percentage >= 100
        
        # Update roadmap
        roadmap.marked_nodes = marked_nodes
        roadmap.nodes = nodes
        roadmap.is_completed = is_completed
        if is_completed and not roadmap.completed_at:
            roadmap.completed_at = datetime.utcnow()
        roadmap.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(roadmap)
        
        return {
            "success": True,
            "data": {
                "id": roadmap.id,
                "nodes": roadmap.nodes,
                "marked_nodes": roadmap.marked_nodes,
                "is_completed": roadmap.is_completed,
                "completion_percentage": completion_percentage,
                "completed_at": roadmap.completed_at.isoformat() if roadmap.completed_at else None,
                "updated_at": roadmap.updated_at.isoformat()
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{roadmap_id}/progress")
async def update_roadmap_progress(
    roadmap_id: int,
    data: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        print(f"\n=== Updating Roadmap Progress ===")
        print(f"Roadmap ID: {roadmap_id}")
        print(f"Update Data: {data}")
        
        roadmap = db.query(ComprehensiveRoadmap).filter(
            ComprehensiveRoadmap.id == roadmap_id,
            ComprehensiveRoadmap.user_id == current_user.id
        ).first()
        
        if not roadmap:
            raise HTTPException(status_code=404, detail="Roadmap not found")

        # Update marked nodes list
        if "marked_nodes" in data:
            print(f"Updating marked nodes: {data['marked_nodes']}")
            roadmap.marked_nodes = data["marked_nodes"]
            
            # Update nodes completion status
            if roadmap.nodes:
                roadmap.nodes = [
                    {**node, "completed": node["id"] in data["marked_nodes"]}
                    for node in roadmap.nodes
                ]
        
        # Update completion status
        if "is_completed" in data:
            print(f"Updating completion status: {data['is_completed']}")
            roadmap.is_completed = data["is_completed"]
            if data["is_completed"] and not roadmap.completed_at:
                print("Setting completion timestamp")
                roadmap.completed_at = datetime.utcnow()
        
        # Always update the timestamp
        roadmap.updated_at = datetime.utcnow()
        
        print("Committing changes to database...")
        db.commit()
        db.refresh(roadmap)
        
        print("=== Update Successful ===\n")
        
        return {
            "success": True,
            "data": {
                "id": roadmap.id,
                "nodes": roadmap.nodes,
                "marked_nodes": roadmap.marked_nodes,
                "is_completed": roadmap.is_completed,
                "completed_at": roadmap.completed_at.isoformat() if roadmap.completed_at else None,
                "updated_at": roadmap.updated_at.isoformat()
            }
        }
    except Exception as e:
        print(f"Error updating roadmap: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/jobs/recommendations")
async def get_job_recommendations(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get job recommendations based on completed roadmaps.
    Fetches jobs from Naukri-like sources based on learned skills.
    """
    try:
        # Get completed roadmaps for the user
        completed_roadmaps = db.query(ComprehensiveRoadmap).filter(
            ComprehensiveRoadmap.user_id == current_user.id,
            ComprehensiveRoadmap.is_completed == True
        ).all()
        
        if not completed_roadmaps:
            return {
                "success": True,
                "jobs": [],
                "completed_skills": [],
                "message": "No completed roadmaps found. Complete a roadmap to get job recommendations."
            }
        
        # Extract skills from completed roadmaps
        skills = []
        for roadmap in completed_roadmaps:
            skills.append(roadmap.skill)
        
        # Fetch job recommendations from Naukri service
        job_response = await jobs_service.fetch_jobs_from_naukri(
            skills=skills,
            num_jobs=6
        )
        
        if not job_response["success"]:
            raise HTTPException(status_code=500, detail=job_response.get("error", "Failed to fetch jobs"))
        
        # Extract jobs from response
        jobs = job_response["data"].get("jobs", [])
        
        return {
            "success": True,
            "jobs": jobs,
            "completed_skills": skills
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_job_recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))