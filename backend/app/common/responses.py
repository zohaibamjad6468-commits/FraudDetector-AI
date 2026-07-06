from flask import jsonify


def success_response(data=None, message="OK", status_code=200, meta=None):
    payload = {
        "success": True,
        "message": message,
        "data": data,
    }
    if meta is not None:
        payload["meta"] = meta
    return jsonify(payload), status_code


def error_response(message="An error occurred", status_code=500, errors=None, code=None):
    payload = {
        "success": False,
        "message": message,
    }
    if code:
        payload["code"] = code
    if errors is not None:
        payload["errors"] = errors
    return jsonify(payload), status_code


def paginated_response(items, page, page_size, total, message="OK"):
    total_pages = (total + page_size - 1) // page_size if page_size else 0
    return success_response(
        data=items,
        message=message,
        meta={
            "page": page,
            "pageSize": page_size,
            "total": total,
            "totalPages": total_pages,
        },
    )
