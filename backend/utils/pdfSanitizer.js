import { PDFDocument, PDFName, PDFDict, PDFArray } from 'pdf-lib';

/**
 * Sanitizes an authentic court judgment PDF by:
 * 1. Keeping the top-left QR code and INSC code 100% intact as per user requirement.
 * 2. Removing all /Widget, /Sig, and digital signature annotations from all pages (eliminating the question mark '?' and 'Signature Not Verified' box).
 * 3. Deleting all signature / appearance indirect objects and AcroForm dictionaries.
 * 4. Preserving 100% of the authentic court typography, text layout, margins, tables, and pagination.
 */
export async function sanitizePdfBuffer(pdfBuffer) {
  if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) {
    return pdfBuffer;
  }

  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });

    // 1. Remove all signature fields from AcroForm
    try {
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      for (const field of fields) {
        try {
          form.removeField(field);
        } catch (e) {}
      }
    } catch (e) {}

    // 2. Remove AcroForm and SigFlags from catalog completely
    try {
      if (pdfDoc.catalog.has(PDFName.of('AcroForm'))) {
        pdfDoc.catalog.delete(PDFName.of('AcroForm'));
      }
      if (pdfDoc.catalog.has(PDFName.of('SigFlags'))) {
        pdfDoc.catalog.delete(PDFName.of('SigFlags'));
      }
    } catch (e) {}

    // 3. Purge all signature / widget objects from context
    try {
      pdfDoc.context.enumerateIndirectObjects().forEach(([ref, obj]) => {
        if (obj instanceof PDFDict) {
          const type = obj.lookup(PDFName.of('Type'))?.toString();
          const subtype = obj.lookup(PDFName.of('Subtype'))?.toString();
          const ft = obj.lookup(PDFName.of('FT'))?.toString();
          const t = obj.lookup(PDFName.of('T'))?.toString();
          if (
            type === '/Sig' || 
            subtype === '/Widget' || 
            subtype === '/Sig' || 
            ft === '/Sig' || 
            (t && t.toLowerCase().includes('sig'))
          ) {
            try {
              pdfDoc.context.delete(ref);
            } catch (e) {}
          }
        }
      });
    } catch (e) {}

    const pages = pdfDoc.getPages();
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];

      // Remove signature widgets and annotations from Annots array
      if (page.node.has(PDFName.of('Annots'))) {
        const annots = page.node.lookup(PDFName.of('Annots'));
        if (annots instanceof PDFArray) {
          const newAnnots = [];
          for (let a = 0; a < annots.size(); a++) {
            const annot = annots.lookup(a);
            if (annot instanceof PDFDict) {
              const subtype = annot.lookup(PDFName.of('Subtype'))?.toString();
              const ft = annot.lookup(PDFName.of('FT'))?.toString();
              const t = annot.lookup(PDFName.of('T'))?.toString();
              // Filter out Widget / Signature annotations
              if (subtype === '/Widget' || subtype === '/Sig' || ft === '/Sig' || (t && t.toLowerCase().includes('sig'))) {
                continue;
              }
            }
            newAnnots.push(annots.get(a));
          }

          if (newAnnots.length === 0) {
            page.node.delete(PDFName.of('Annots'));
          } else {
            const arr = pdfDoc.context.obj(newAnnots);
            page.node.set(PDFName.of('Annots'), arr);
          }
        }
      }
    }

    const cleanBytes = await pdfDoc.save();
    return Buffer.from(cleanBytes);
  } catch (err) {
    console.error('PDF sanitization error:', err);
    return pdfBuffer;
  }
}
