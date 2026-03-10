import os
import sys
from datetime import datetime, date

_this_file = os.path.abspath(__file__)
_tasks_dir = os.path.dirname(_this_file)
_backend_dir = os.path.dirname(_tasks_dir)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from tasks.celery_config import celery_app
from app import create_app


def _html_to_pdf(html_content, pdf_path):
    try:
        from weasyprint import HTML
        HTML(string=html_content).write_pdf(pdf_path)
        print(f"[REPORT] PDF generated: {pdf_path}")
        return True
    except ImportError:
        print("[REPORT] weasyprint not installed – skipping PDF generation.")
        print("         Install with: pip install weasyprint")
        print("         System deps (Ubuntu): sudo apt install libpango-1.0-0 libcairo2")
        return False
    except Exception as e:
        print(f"[REPORT] PDF generation failed: {e}")
        return False


@celery_app.task(name='tasks.reports.generate_monthly_report')
def generate_monthly_report():
    from models import Company

    app = create_app()
    with app.app_context():
        companies = Company.query.filter_by(is_approved=True, is_blacklisted=False).all()
        reports_generated = 0

        for company in companies:
            report = generate_company_report(company)
            if report:
                reports_generated += 1

        return {
            'status': 'completed',
            'reports_generated': reports_generated,
            'month': date.today().strftime('%B %Y')
        }


@celery_app.task(name='tasks.reports.generate_company_report')
def generate_company_report_task(company_id):
    from models import Company

    app = create_app()
    with app.app_context():
        company = Company.query.get(company_id)
        if not company:
            return {'status': 'error', 'message': 'Company not found'}

        return generate_company_report(company)


def generate_company_report(company):
    from models import JobPosition, Application, Placement
    from flask import current_app

    jobs = JobPosition.query.filter_by(company_id=company.id, is_deleted=False).all()
    total_applications = 0
    total_shortlisted = 0
    total_placed = 0
    total_interviews = 0
    total_offers = 0
    job_stats = []

    for job in jobs:
        apps = Application.query.filter_by(job_id=job.id).all()
        applied = len(apps)
        shortlisted = len([a for a in apps if a.status in ('shortlisted', 'interview', 'offer', 'placed')])
        interviews = len([a for a in apps if a.status in ('interview', 'offer', 'placed')])
        offers = len([a for a in apps if a.status in ('offer', 'placed')])
        placed = len([a for a in apps if a.status == 'placed'])

        total_applications += applied
        total_shortlisted += shortlisted
        total_interviews += interviews
        total_offers += offers
        total_placed += placed

        job_stats.append({
            'title': job.title,
            'status': job.status,
            'applied': applied,
            'shortlisted': shortlisted,
            'interviews': interviews,
            'offers': offers,
            'placed': placed
        })


    def pct(numerator, denominator):
        return f"{(numerator / denominator * 100):.1f}%" if denominator else "N/A"

    shortlist_rate = pct(total_shortlisted, total_applications)
    interview_rate = pct(total_interviews, total_shortlisted)
    offer_rate = pct(total_offers, total_interviews)
    placement_rate = pct(total_placed, total_offers)
    overall_conversion = pct(total_placed, total_applications)


    report_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Placement Report - {company.name}</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: 'Inter', 'Segoe UI', sans-serif; margin: 40px; color: #1e293b;
               background: #ffffff; line-height: 1.6; }}
        h1 {{ color: #4f46e5; font-size: 28px; margin-bottom: 4px; }}
        h2 {{ color: #334155; font-size: 20px; margin-bottom: 8px; }}
        .subtitle {{ color: #64748b; font-size: 14px; margin-bottom: 30px; }}
        .stats-grid {{ display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 30px; }}
        .stat {{ flex: 1; min-width: 140px; padding: 18px 22px;
                 background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                 border-radius: 12px; border: 1px solid #e2e8f0; }}
        .stat-value {{ font-size: 28px; font-weight: 700; color: #4f46e5; }}
        .stat-label {{ font-size: 13px; color: #64748b; margin-top: 2px; }}
        .analytics {{ background: #f8fafc; border-radius: 12px; padding: 20px 24px;
                      border: 1px solid #e2e8f0; margin-bottom: 30px; }}
        .analytics h3 {{ color: #334155; font-size: 16px; margin-bottom: 12px; }}
        .funnel {{ display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }}
        .funnel-step {{ text-align: center; padding: 10px 16px; background: #eef2ff;
                       border-radius: 8px; font-size: 13px; color: #4338ca; }}
        .funnel-step .rate {{ font-size: 18px; font-weight: 700; display: block; }}
        .funnel-arrow {{ color: #94a3b8; font-size: 18px; }}
        table {{ border-collapse: collapse; width: 100%; margin-top: 20px; }}
        th, td {{ border: 1px solid #e2e8f0; padding: 10px 14px; text-align: left; font-size: 14px; }}
        th {{ background: #4f46e5; color: white; font-weight: 600; }}
        tr:nth-child(even) {{ background: #f8fafc; }}
        .footer {{ margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0;
                   font-size: 12px; color: #94a3b8; text-align: center; }}
        @media print {{ body {{ margin: 20px; }} }}
    </style>
</head>
<body>
    <h1>Placement Report</h1>
    <h2>{company.name}</h2>
    <p class="subtitle">Generated: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</p>

    <div class="stats-grid">
        <div class="stat">
            <div class="stat-value">{total_applications}</div>
            <div class="stat-label">Total Applications</div>
        </div>
        <div class="stat">
            <div class="stat-value">{total_shortlisted}</div>
            <div class="stat-label">Shortlisted</div>
        </div>
        <div class="stat">
            <div class="stat-value">{total_interviews}</div>
            <div class="stat-label">Interviews</div>
        </div>
        <div class="stat">
            <div class="stat-value">{total_offers}</div>
            <div class="stat-label">Offers</div>
        </div>
        <div class="stat">
            <div class="stat-value">{total_placed}</div>
            <div class="stat-label">Placed</div>
        </div>
    </div>

    <div class="analytics">
        <h3>Conversion Funnel</h3>
        <div class="funnel">
            <div class="funnel-step">
                <span class="rate">{shortlist_rate}</span>
                Applied → Shortlisted
            </div>
            <span class="funnel-arrow">→</span>
            <div class="funnel-step">
                <span class="rate">{interview_rate}</span>
                Shortlisted → Interview
            </div>
            <span class="funnel-arrow">→</span>
            <div class="funnel-step">
                <span class="rate">{offer_rate}</span>
                Interview → Offer
            </div>
            <span class="funnel-arrow">→</span>
            <div class="funnel-step">
                <span class="rate">{placement_rate}</span>
                Offer → Placed
            </div>
        </div>
        <p style="margin-top: 12px; font-size: 14px; color: #475569;">
            Overall conversion (Applied → Placed): <strong>{overall_conversion}</strong>
        </p>
    </div>

    <h3 style="margin-bottom: 8px;">Job-wise Breakdown</h3>
    <table>
        <tr>
            <th>Job Title</th><th>Status</th><th>Applications</th>
            <th>Shortlisted</th><th>Interviews</th><th>Offers</th><th>Placed</th>
        </tr>
"""

    for js in job_stats:
        report_html += f"""        <tr>
            <td>{js['title']}</td>
            <td>{js['status']}</td>
            <td>{js['applied']}</td>
            <td>{js['shortlisted']}</td>
            <td>{js['interviews']}</td>
            <td>{js['offers']}</td>
            <td>{js['placed']}</td>
        </tr>
"""

    report_html += """    </table>

    <div class="footer">
        <p>Auto-generated by Placement Portal Application &middot; Confidential</p>
    </div>
</body>
</html>"""


    export_folder = current_app.config.get('EXPORT_FOLDER', 'exports')
    os.makedirs(export_folder, exist_ok=True)

    month_str = date.today().strftime('%Y%m')
    html_filename = f"report_{company.id}_{month_str}.html"
    html_filepath = os.path.join(export_folder, html_filename)

    with open(html_filepath, 'w', encoding='utf-8') as f:
        f.write(report_html)

    print(f"[REPORT] HTML generated for {company.name}: {html_filepath}")


    pdf_filename = f"report_{company.id}_{month_str}.pdf"
    pdf_filepath = os.path.join(export_folder, pdf_filename)
    pdf_generated = _html_to_pdf(report_html, pdf_filepath)

    result = {
        'status': 'completed',
        'company': company.name,
        'html_file': html_filename,
        'total_applications': total_applications,
        'total_shortlisted': total_shortlisted,
        'total_interviews': total_interviews,
        'total_offers': total_offers,
        'total_placed': total_placed,
        'overall_conversion': overall_conversion
    }

    if pdf_generated:
        result['pdf_file'] = pdf_filename

    return result
