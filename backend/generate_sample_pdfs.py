"""
generate_sample_pdfs.py - Creates authentic sample PDF files in sample_reports/
for hackathon demonstration and user upload testing.
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas

os.makedirs("sample_reports", exist_ok=True)

styles = getSampleStyleSheet()
title_style = ParagraphStyle(
    "TitleStyle",
    parent=styles["Heading1"],
    fontSize=18,
    leading=22,
    textColor=colors.HexColor("#1E3A8A"),
    spaceAfter=6,
)
sub_style = ParagraphStyle(
    "SubStyle",
    parent=styles["Normal"],
    fontSize=10,
    leading=14,
    textColor=colors.HexColor("#475569"),
)
header_cell = ParagraphStyle(
    "HeaderCell",
    parent=styles["Normal"],
    fontSize=9,
    fontName="Helvetica-Bold",
    textColor=colors.HexColor("#1E293B"),
)
body_cell = ParagraphStyle(
    "BodyCell",
    parent=styles["Normal"],
    fontSize=9,
    fontName="Helvetica",
    textColor=colors.HexColor("#334155"),
)

# 1. CBC Report PDF
def generate_cbc_pdf():
    pdf_path = "sample_reports/Sample_CBC_Lab_Report.pdf"
    doc = SimpleDocTemplate(pdf_path, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    elements = []

    elements.append(Paragraph("METROPOLITAN CLINICAL LABORATORIES", title_style))
    elements.append(Paragraph("ISO 15189 Certified Diagnostic Center • Tel: (800) 555-0199", sub_style))
    elements.append(Spacer(1, 12))

    patient_data = [
        [Paragraph("<b>Patient Name:</b> Jane Doe", body_cell), Paragraph("<b>Patient ID:</b> PT-98234", body_cell)],
        [Paragraph("<b>Age / Gender:</b> 32 Yrs / Female", body_cell), Paragraph("<b>Date:</b> 15-Mar-2024", body_cell)],
        [Paragraph("<b>Referring Physician:</b> Dr. R. Sharma, MD", body_cell), Paragraph("<b>Sample:</b> Whole Blood (EDTA)", body_cell)],
    ]
    p_table = Table(patient_data, colWidths=[270, 270])
    p_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
        ("PADDING", (0, 0), (-1, -1), 6),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
    ]))
    elements.append(p_table)
    elements.append(Spacer(1, 14))

    elements.append(Paragraph("<b>DEPARTMENT OF HEMATOLOGY: COMPLETE BLOOD COUNT (CBC)</b>", ParagraphStyle("Section", parent=styles["Normal"], fontSize=11, fontName="Helvetica-Bold", textColor=colors.HexColor("#1E3A8A"))))
    elements.append(Spacer(1, 8))

    table_data = [
        [Paragraph("TEST PARAMETER", header_cell), Paragraph("OBSERVED VALUE", header_cell), Paragraph("UNIT", header_cell), Paragraph("REFERENCE RANGE", header_cell), Paragraph("STATUS", header_cell)],
        [Paragraph("Hemoglobin (Hb)", body_cell), Paragraph("10.4", body_cell), Paragraph("g/dL", body_cell), Paragraph("12.0 - 15.5", body_cell), Paragraph("<b>LOW</b>", body_cell)],
        [Paragraph("Total RBC Count", body_cell), Paragraph("3.8", body_cell), Paragraph("million/uL", body_cell), Paragraph("4.0 - 5.2", body_cell), Paragraph("<b>LOW</b>", body_cell)],
        [Paragraph("Total WBC Count", body_cell), Paragraph("6,800", body_cell), Paragraph("cells/uL", body_cell), Paragraph("4,500 - 11,000", body_cell), Paragraph("NORMAL", body_cell)],
        [Paragraph("Platelet Count", body_cell), Paragraph("245,000", body_cell), Paragraph("/uL", body_cell), Paragraph("150,000 - 450,000", body_cell), Paragraph("NORMAL", body_cell)],
        [Paragraph("Hematocrit (PCV)", body_cell), Paragraph("32.1", body_cell), Paragraph("%", body_cell), Paragraph("36.0 - 46.0", body_cell), Paragraph("<b>LOW</b>", body_cell)],
        [Paragraph("Mean Corpuscular Vol (MCV)", body_cell), Paragraph("74.2", body_cell), Paragraph("fL", body_cell), Paragraph("80.0 - 100.0", body_cell), Paragraph("<b>LOW</b>", body_cell)],
        [Paragraph("Mean Corpuscular Hb (MCH)", body_cell), Paragraph("24.5", body_cell), Paragraph("pg", body_cell), Paragraph("27.0 - 33.0", body_cell), Paragraph("<b>LOW</b>", body_cell)],
        [Paragraph("Neutrophils", body_cell), Paragraph("62", body_cell), Paragraph("%", body_cell), Paragraph("40 - 70", body_cell), Paragraph("NORMAL", body_cell)],
        [Paragraph("Lymphocytes", body_cell), Paragraph("30", body_cell), Paragraph("%", body_cell), Paragraph("20 - 40", body_cell), Paragraph("NORMAL", body_cell)],
    ]

    lab_table = Table(table_data, colWidths=[160, 100, 80, 120, 80])
    lab_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    elements.append(lab_table)
    elements.append(Spacer(1, 14))

    elements.append(Paragraph("<b>CLINICAL INTERPRETATION NOTE:</b> Microcytic hypochromic red blood cell picture observed. Recommended follow-up includes serum iron, ferritin, and TIBC evaluation.", sub_style))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph("<i>Disclaimer: Test findings should be interpreted in conjunction with complete clinical examination.</i>", sub_style))

    doc.build(elements)
    print(f"Generated {pdf_path}")

# 2. Lipid Profile PDF
def generate_lipid_pdf():
    pdf_path = "sample_reports/Sample_Lipid_Panel_Report.pdf"
    doc = SimpleDocTemplate(pdf_path, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    elements = []

    elements.append(Paragraph("APEX DIAGNOSTIC & RESEARCH CENTER", title_style))
    elements.append(Paragraph("Accredited Clinical Pathology • Tel: (800) 555-0240", sub_style))
    elements.append(Spacer(1, 12))

    patient_data = [
        [Paragraph("<b>Patient Name:</b> John Smith", body_cell), Paragraph("<b>Patient ID:</b> PT-77412", body_cell)],
        [Paragraph("<b>Age / Gender:</b> 48 Yrs / Male", body_cell), Paragraph("<b>Date:</b> 10-May-2024", body_cell)],
        [Paragraph("<b>Fasting Status:</b> 12 Hours Fasting", body_cell), Paragraph("<b>Sample:</b> Serum", body_cell)],
    ]
    p_table = Table(patient_data, colWidths=[270, 270])
    p_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
        ("PADDING", (0, 0), (-1, -1), 6),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
    ]))
    elements.append(p_table)
    elements.append(Spacer(1, 14))

    elements.append(Paragraph("<b>COMPREHENSIVE FASTING LIPID PROFILE</b>", ParagraphStyle("Section", parent=styles["Normal"], fontSize=11, fontName="Helvetica-Bold", textColor=colors.HexColor("#1E3A8A"))))
    elements.append(Spacer(1, 8))

    table_data = [
        [Paragraph("TEST PARAMETER", header_cell), Paragraph("OBSERVED VALUE", header_cell), Paragraph("UNIT", header_cell), Paragraph("DESIRABLE RANGE", header_cell), Paragraph("INTERPRETATION", header_cell)],
        [Paragraph("Total Cholesterol", body_cell), Paragraph("228", body_cell), Paragraph("mg/dL", body_cell), Paragraph("< 200", body_cell), Paragraph("<b>BORDERLINE</b>", body_cell)],
        [Paragraph("HDL ('Good') Cholesterol", body_cell), Paragraph("42", body_cell), Paragraph("mg/dL", body_cell), Paragraph("> 40 (Male)", body_cell), Paragraph("NORMAL", body_cell)],
        [Paragraph("LDL ('Bad') Cholesterol", body_cell), Paragraph("148", body_cell), Paragraph("mg/dL", body_cell), Paragraph("< 100", body_cell), Paragraph("<b>ELEVATED</b>", body_cell)],
        [Paragraph("Triglycerides", body_cell), Paragraph("190", body_cell), Paragraph("mg/dL", body_cell), Paragraph("< 150", body_cell), Paragraph("<b>BORDERLINE</b>", body_cell)],
        [Paragraph("VLDL Cholesterol", body_cell), Paragraph("38", body_cell), Paragraph("mg/dL", body_cell), Paragraph("5 - 30", body_cell), Paragraph("<b>ELEVATED</b>", body_cell)],
        [Paragraph("Total Chol / HDL Ratio", body_cell), Paragraph("5.4", body_cell), Paragraph("ratio", body_cell), Paragraph("< 5.0", body_cell), Paragraph("<b>ELEVATED</b>", body_cell)],
    ]

    lab_table = Table(table_data, colWidths=[160, 100, 80, 120, 80])
    lab_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    elements.append(lab_table)
    elements.append(Spacer(1, 14))

    elements.append(Paragraph("<b>NOTE:</b> Mild dyslipidemia noted with elevated LDL and triglycerides. Discuss with physician regarding dietary fiber, cardiovascular risk assessment, and lifestyle modifications.", sub_style))
    doc.build(elements)
    print(f"Generated {pdf_path}")

# 3. Scanned PDF Simulation (drawing graphics without text stream to test detection)
def generate_scanned_simulation_pdf():
    pdf_path = "sample_reports/Sample_Scanned_Document.pdf"
    c = canvas.Canvas(pdf_path, pagesize=letter)
    # Draw gray boxes and lines simulating a photocopied/scanned image without text
    c.setStrokeColor(colors.HexColor("#94A3B8"))
    c.setFillColor(colors.HexColor("#E2E8F0"))
    c.rect(50, 700, 500, 40, fill=1)
    c.rect(50, 600, 500, 70, fill=1)
    c.rect(50, 400, 500, 170, fill=1)
    c.save()
    print(f"Generated {pdf_path}")

if __name__ == "__main__":
    generate_cbc_pdf()
    generate_lipid_pdf()
    generate_scanned_simulation_pdf()
