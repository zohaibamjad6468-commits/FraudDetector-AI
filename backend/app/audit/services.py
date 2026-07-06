from sqlalchemy import desc

from app.extensions import db
from app.audit.models import AuditLog

class AuditService:
    def get_logs(self, page: int = 1, per_page: int = 50) -> dict:
        query = AuditLog.query.order_by(desc(AuditLog.created_at))
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        results = []
        for log in pagination.items:
            results.append({
                "id": log.id,
                "actor": log.actor.email if log.actor else "System",
                "actorRole": log.actor.role if log.actor else "system",
                "action": log.action,
                "targetType": log.target_type,
                "targetId": log.target_id,
                "metadata": log.metadata_json,
                "ipAddress": log.ip_address,
                "createdAt": log.created_at.isoformat() if log.created_at else None
            })
            
        return {
            "logs": results,
            "total": pagination.total,
            "pages": pagination.pages,
            "page": pagination.page,
            "perPage": pagination.per_page
        }
