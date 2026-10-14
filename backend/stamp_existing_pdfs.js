import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './config/db.js';
import { stampJudgmentPdf } from './utils/pdfStamper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function stampAllExisting() {
  try {
    const res = await query('SELECT id, pdf_file, pdf_file_path FROM cases WHERE pdf_file IS NOT NULL OR pdf_file_path IS NOT NULL');
    console.log(`Found ${res.rows.length} cases with attached PDFs in database.`);

    for (const row of res.rows) {
      const pdfRel = (row.pdf_file_path || row.pdf_file).replace(/^uploads[\\\/]/, '').replace(/^[\\\/]+/, '');
      const possibleDirs = [
        path.join(__dirname, 'uploads'),
        path.join(__dirname, '../uploads'),
        '/www/wwwroot/law_backend/backend/uploads',
        '/www/wwwroot/law_backend/uploads',
        '/www/wwwroot/lawyer_app_new/backend/uploads'
      ];

      let stampedAny = false;
      for (const dir of possibleDirs) {
        if (fs.existsSync(dir)) {
          const fullPath = path.join(dir, pdfRel);
          if (fs.existsSync(fullPath)) {
            console.log(`Stamping Case ${row.id} at ${fullPath}...`);
            const ok = await stampJudgmentPdf(fullPath, row.id);
            console.log(`Case ${row.id} stamping result:`, ok);
            stampedAny = true;
          }
        }
      }

      if (!stampedAny) {
        console.warn(`Could not locate file on disk for Case ${row.id}: ${pdfRel}`);
      }
    }

    console.log('Done stamping existing PDFs.');
    process.exit(0);
  } catch (err) {
    console.error('Error during stamping:', err);
    process.exit(1);
  }
}

stampAllExisting();
