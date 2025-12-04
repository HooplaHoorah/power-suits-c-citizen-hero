import sys
import os

try:
    from PyPDF2 import PdfReader
except ImportError:
    print('PyPDF2 not installed')
    sys.exit(1)

if len(sys.argv) < 2:
    print('Usage: python extract_pdf.py <pdf_path>')
    sys.exit(1)

pdf_path = sys.argv[1]
if not os.path.isfile(pdf_path):
    print(f'File not found: {pdf_path}')
    sys.exit(1)

reader = PdfReader(pdf_path)
text = []
for page in reader.pages:
    try:
        text.append(page.extract_text())
    except Exception as e:
        text.append(f'Error extracting page: {e}')

print('\n'.join(text))
