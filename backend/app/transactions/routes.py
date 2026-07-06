from flask import Blueprint, request, Response
from app.auth.decorators import staff_required
from app.common.errors import NotImplementedApiError
from app.common.responses import success_response
from app.transactions.services import TransactionService

import csv
import io
from datetime import datetime

transactions_bp = Blueprint("transactions", __name__)


@transactions_bp.get("/health")
def transactions_health():
    return success_response(
        data={"module": "transactions"},
        message="Transactions module is registered",
    )


@transactions_bp.get("/", strict_slashes=False)
@staff_required
def list_transactions():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 50, type=int)
    status = request.args.get("status")
    
    filters = {}
    if status:
        filters["status"] = status
        
    service = TransactionService()
    result = service.get_transactions(page=page, per_page=per_page, filters=filters)
    
    return success_response(
        data=result,
        message="Transactions retrieved successfully"
    )


@transactions_bp.post("/", strict_slashes=False)
@staff_required
def create_transaction():
    raise NotImplementedApiError("Transaction creation logic will be implemented in the transactions service layer")


@transactions_bp.get("/<int:transaction_id>")
@staff_required
def get_transaction(transaction_id):
    raise NotImplementedApiError(f"Transaction lookup for {transaction_id} is not implemented yet")


@transactions_bp.post("/import")
@staff_required
def import_transactions():
    raise NotImplementedApiError("Transaction import logic will be implemented in the transactions service layer")


@transactions_bp.get("/export/csv")
@staff_required
def export_csv():
    """Export all transactions as a CSV file."""
    service = TransactionService()
    result = service.get_transactions(page=1, per_page=10000)
    transactions = result["transactions"]

    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header row
    writer.writerow([
        "Transaction ID", "Merchant", "Merchant Type", "Amount ($)", 
        "Status", "Risk Level", "Fraud Probability (%)", "Transaction Time"
    ])

    # Data rows
    for tx in transactions:
        writer.writerow([
            tx["transactionRef"],
            tx["merchant"],
            tx["merchantType"],
            f'{tx["amount"]:.2f}',
            tx["status"],
            tx["riskLevel"],
            f'{tx["fraudProbability"] * 100:.1f}',
            tx["transactionTime"],
        ])

    csv_content = output.getvalue()
    output.close()

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"transactions_report_{timestamp}.csv"

    return Response(
        csv_content,
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@transactions_bp.get("/export/pdf")
@staff_required
def export_pdf():
    """Export all transactions as a simple PDF report."""
    service = TransactionService()
    result = service.get_transactions(page=1, per_page=10000)
    transactions = result["transactions"]

    # Build a styled HTML report that will be served as downloadable HTML
    # (avoids needing reportlab/weasyprint dependencies)
    timestamp = datetime.now().strftime("%B %d, %Y at %I:%M %p")
    
    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>FinGuard AI — Transaction Report</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; }}
        .header {{ text-align: center; margin-bottom: 30px; border-bottom: 2px solid #6366f1; padding-bottom: 20px; }}
        .header h1 {{ font-size: 24px; color: #6366f1; }}
        .header p {{ font-size: 12px; color: #64748b; margin-top: 4px; }}
        .stats {{ display: flex; gap: 20px; margin-bottom: 20px; }}
        .stat-card {{ flex: 1; padding: 12px; background: #f8fafc; border-radius: 8px; text-align: center; }}
        .stat-card .value {{ font-size: 24px; font-weight: bold; color: #6366f1; }}
        .stat-card .label {{ font-size: 11px; color: #64748b; text-transform: uppercase; }}
        table {{ width: 100%; border-collapse: collapse; font-size: 12px; }}
        th {{ background: #6366f1; color: white; padding: 10px 8px; text-align: left; }}
        td {{ padding: 8px; border-bottom: 1px solid #e2e8f0; }}
        tr:nth-child(even) {{ background: #f8fafc; }}
        .risk-high {{ color: #ef4444; font-weight: bold; }}
        .risk-medium {{ color: #f59e0b; font-weight: bold; }}
        .risk-low {{ color: #10b981; font-weight: bold; }}
        .footer {{ margin-top: 30px; text-align: center; font-size: 11px; color: #94a3b8; }}
        @media print {{ body {{ padding: 20px; }} }}
    </style>
</head>
<body>
    <div class="header">
        <h1>FinGuard AI — Transaction Report</h1>
        <p>Generated on {timestamp} | Total Transactions: {len(transactions)}</p>
    </div>
    <div class="stats">
        <div class="stat-card">
            <div class="value">{len(transactions)}</div>
            <div class="label">Total Transactions</div>
        </div>
        <div class="stat-card">
            <div class="value">{len([t for t in transactions if t['riskLevel'] == 'High'])}</div>
            <div class="label">High Risk</div>
        </div>
        <div class="stat-card">
            <div class="value">{len([t for t in transactions if t['riskLevel'] == 'Medium'])}</div>
            <div class="label">Medium Risk</div>
        </div>
        <div class="stat-card">
            <div class="value">{len([t for t in transactions if t['riskLevel'] == 'Low'])}</div>
            <div class="label">Low Risk</div>
        </div>
    </div>
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Merchant</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Risk</th>
                <th>Fraud %</th>
                <th>Time</th>
            </tr>
        </thead>
        <tbody>"""

    for tx in transactions:
        risk_class = f"risk-{tx['riskLevel'].lower()}" if tx['riskLevel'] in ('High', 'Medium', 'Low') else ''
        html += f"""
            <tr>
                <td>{tx['transactionRef']}</td>
                <td>{tx['merchant']}</td>
                <td>${tx['amount']:,.2f}</td>
                <td>{tx['status']}</td>
                <td class="{risk_class}">{tx['riskLevel']}</td>
                <td>{tx['fraudProbability'] * 100:.1f}%</td>
                <td>{tx['transactionTime'][:19] if tx['transactionTime'] else 'N/A'}</td>
            </tr>"""

    html += """
        </tbody>
    </table>
    <div class="footer">
        <p>FinGuard AI — Intelligent Fraud Detection System | Confidential Report</p>
    </div>
    <script>window.onload = function() { window.print(); }</script>
</body>
</html>"""

    timestamp_file = datetime.now().strftime("%Y%m%d_%H%M%S")
    return Response(
        html,
        mimetype="text/html",
        headers={"Content-Disposition": f"inline; filename=transaction_report_{timestamp_file}.html"}
    )

