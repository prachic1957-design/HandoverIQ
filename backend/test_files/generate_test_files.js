import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outDir = path.resolve(__dirname);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. Text file
fs.writeFileSync(
  path.join(outDir, 'test_system_notes.txt'),
  `HandoverIQ Technical System Notes
Author: Sarah Jenkins
Date: 2026-03-15
Service: Core Kubernetes Cluster
The primary EKS cluster runs across 3 Availability Zones with managed node groups.
Authentication is handled via IAM roles for service accounts (IRSA).
Critical Runbook Step: Before upgrading EKS control plane to v1.31, ensure coreDNS add-on is upgraded first.`
);

// 2. CSV file
fs.writeFileSync(
  path.join(outDir, 'test_budget_ledger.csv'),
  `Account_Code,Description,Monthly_Allocation,Variance_Status
GL-1001,AWS Cloud Infrastructure,$28500,Approved
GL-1002,Datadog Observability,$4200,Pending Audit
GL-1003,GitHub Enterprise Licenses,$6500,Approved
GL-1004,Vault Enterprise Cluster,$3800,In Review`
);

// 3. Valid PDF with text
const validPdf = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
  '2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n' +
  '3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>/Contents 4 0 R>>endobj\n' +
  '4 0 obj<</Length 76>>stream\nBT\n/F1 12 Tf\n100 700 Td\n(HandoverIQ Production Architecture Milestone for VPC and EKS Deployment) Tj\nET\nendstream\nendobj\n' +
  'xref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000108 00000 n \n0000000204 00000 n \n' +
  'trailer<</Size 5/Root 1 0 R>>\nstartxref\n329\n%%EOF'
);
fs.writeFileSync(path.join(outDir, 'test_architecture.pdf'), validPdf);

// 4. Scanned empty PDF (to test needs_ocr trigger)
const scannedPdf = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
  '2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n' +
  '3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>/Contents 4 0 R>>endobj\n' +
  '4 0 obj<</Length 2>>stream\n \nendstream\nendobj\n' +
  'xref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000108 00000 n \n0000000204 00000 n \n' +
  'trailer<</Size 5/Root 1 0 R>>\nstartxref\n255\n%%EOF'
);
fs.writeFileSync(path.join(outDir, 'test_scanned_empty.pdf'), scannedPdf);

// 5. Unsupported binary file (.exe)
fs.writeFileSync(path.join(outDir, 'test_unsupported.exe'), Buffer.from('MZ...fake executable content'));

console.log('Sample test documents created successfully in:', outDir);
