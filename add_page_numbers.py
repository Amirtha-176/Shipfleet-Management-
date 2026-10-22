import io
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import black

def generate_numbered_pdf(input_pdf_path, output_pdf_path):
    reader = PdfReader(input_pdf_path)
    writer = PdfWriter()

    # Map 1-based page index to label
    page_labels = {}

    # Pages 1-3: No numbers (Cover, Bonafide, Viva-Voce)
    # Pages 4-9: Roman numerals (Abstract, Acknowledgement, TOC, List of Tables, List of Figures)
    romans = ['i', 'ii', 'iii', 'iv', 'v', 'vi']
    for idx, r in enumerate(romans, start=4):
        page_labels[idx] = r

    # Pages 10-41: Arabic numbers 1 to 32 (Chapter 1 Introduction to References)
    for idx in range(10, len(reader.pages) + 1):
        page_labels[idx] = str(idx - 9)

    print(f"Total pages in input: {len(reader.pages)}")

    for i, page in enumerate(reader.pages, start=1):
        page_width = float(page.mediabox.width)
        page_height = float(page.mediabox.height)

        label = page_labels.get(i)
        if label:
            # Create overlay PDF with ReportLab
            packet = io.BytesIO()
            can = canvas.Canvas(packet, pagesize=(page_width, page_height))
            can.setFillColor(black)
            can.setFont("Times-Roman", 11)
            # Center horizontally at width / 2, 38 pt from bottom
            can.drawCentredString(page_width / 2.0, 38.0, label)
            can.save()

            packet.seek(0)
            overlay_reader = PdfReader(packet)
            overlay_page = overlay_reader.pages[0]

            # Merge overlay onto the page
            page.merge_page(overlay_page)

        writer.add_page(page)

    with open(output_pdf_path, 'wb') as f_out:
        writer.write(f_out)

    print(f"Successfully generated: {output_pdf_path}")

if __name__ == '__main__':
    input_path = r"C:\Users\AMIRTHA\Downloads\NavisFleet Enterprise Maritime Fleet Logistics & AIS Telemetry System - Project Report.pdf"
    output_path = r"C:\Users\AMIRTHA\Downloads\shipfleet (2)\SHIPFLEET_Project_Report_Numbered.pdf"
    generate_numbered_pdf(input_path, output_path)
