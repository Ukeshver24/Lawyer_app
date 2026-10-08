import { 
  getAllCasesFromDb, getCaseByIdFromDb, createCaseInDb, updateCaseInDb, 
  deleteCaseFromDb, updateCaseStatusInDb 
} from '../repositories/caseRepository.js';
import judgmentRepository from '../repositories/judgmentRepository.js';
import logger from '../utils/logger.js';
import { notifyMobileAppNewJudgement } from '../services/fcmService.js';

// GET /api/cases
export const getCases = async (req, res) => {
  try {
    const casesList = await getAllCasesFromDb(req.query);
    res.json({ success: true, count: casesList.length, data: casesList });
  } catch (error) {
    logger.error('Failed to fetch cases:', error);
    res.status(500).json({ success: false, message: 'Server error fetching cases' });
  }
};

// GET /api/cases/:id
export const getCaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const caseItem = await getCaseByIdFromDb(id);
    if (!caseItem) {
      return res.status(404).json({ success: false, message: 'Case record not found' });
    }
    res.json({ success: true, data: caseItem });
  } catch (error) {
    logger.error(`Failed to fetch case ID ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Server error fetching case' });
  }
};

// POST /api/cases
export const createCase = async (req, res) => {
  try {
    const { caseNumber, title, petitioner, respondent, headNote, judgmentText, status } = req.body;

    const cleanCaseNo = (caseNumber || '').trim();
    const cleanTitle = (title || '').trim();
    const cleanPetitioner = (petitioner || '').trim();
    const cleanRespondent = (respondent || '').trim();
    const cleanHeadNote = (headNote || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    const cleanJudgmentText = (judgmentText || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

    // Reject completely empty case
    if (!cleanCaseNo && !cleanTitle && !cleanPetitioner && !cleanRespondent && !cleanHeadNote && !cleanJudgmentText) {
      return res.status(400).json({ success: false, message: 'Cannot save an empty case. Please provide case details.' });
    }

    // Case number is strictly required for all records (including Draft)
    if (!cleanCaseNo) {
      return res.status(400).json({ success: false, message: 'Case number is required.' });
    }

    // Require title or petitioner
    if (!cleanTitle && !cleanPetitioner) {
      return res.status(400).json({ success: false, message: 'Case title or petitioner is required.' });
    }

    // Stricter check for Published status
    if (status === 'Published') {
      if (!cleanHeadNote) {
        return res.status(400).json({ success: false, message: 'Head Note is required to publish a case.' });
      }
      if (!cleanJudgmentText) {
        return res.status(400).json({ success: false, message: 'Judgment text is required to publish a case.' });
      }
    }

    // Validate citations for duplicates against database
    const citations = Array.isArray(req.body.citations) ? req.body.citations : [];
    for (const cit of citations) {
      if (cit && cit.number) {
        const match = await judgmentRepository.checkCitationMatch(cit.number, cit.year, cit.month, cit.court);
        if (match && match.exists) {
          const cleanMo = cit.month ? `(${String(cit.month).padStart(2, '0')}) ` : '';
          return res.status(400).json({
            success: false,
            message: `Citation #${cit.number} for ${cit.year || '2026'} ${cleanMo}${(cit.court || 'SC').toUpperCase()} is already registered in case "${match.caseTitle}". Duplicate citations are not allowed.`
          });
        }
      }
    }

    const newCase = await createCaseInDb(req.body);

    // Fire FCM push notification to Mobile App if Published
    if (newCase && (newCase.status === 'Published' || req.body.status === 'Published')) {
      notifyMobileAppNewJudgement({
        id: newCase.id,
        caseNumber: newCase.case_number || req.body.caseNumber,
        title: newCase.title || req.body.title,
        petitioner: newCase.petitioner || req.body.petitioner,
        respondent: newCase.respondent || req.body.respondent,
        court: newCase.court || req.body.court,
        citation: newCase.citation || req.body.citation
      }).catch(err => logger.error('FCM notification dispatch error:', err));
    }

    res.status(201).json({ success: true, message: 'Case created successfully', data: newCase });
  } catch (error) {
    logger.error('Failed to create case:', error);
    res.status(500).json({ success: false, message: 'Server error creating case' });
  }
};

// PUT /api/cases/:id
export const updateCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { caseNumber, title, petitioner, respondent, headNote, judgmentText, status } = req.body;

    const cleanCaseNo = (caseNumber || '').trim();
    const cleanTitle = (title || '').trim();
    const cleanPetitioner = (petitioner || '').trim();
    const cleanRespondent = (respondent || '').trim();
    const cleanHeadNote = (headNote || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    const cleanJudgmentText = (judgmentText || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

    // Reject completely empty case
    if (!cleanCaseNo && !cleanTitle && !cleanPetitioner && !cleanRespondent && !cleanHeadNote && !cleanJudgmentText) {
      return res.status(400).json({ success: false, message: 'Cannot update with empty case details.' });
    }

    if (!cleanCaseNo) {
      return res.status(400).json({ success: false, message: 'Case number is required.' });
    }

    if (status === 'Published') {
      if (!cleanHeadNote) {
        return res.status(400).json({ success: false, message: 'Head Note is required to publish a case.' });
      }
      if (!cleanJudgmentText) {
        return res.status(400).json({ success: false, message: 'Judgment text is required to publish a case.' });
      }
    }

    // Validate citations for duplicates against database (excluding current case)
    const updateCitations = Array.isArray(req.body.citations) ? req.body.citations : [];
    for (const cit of updateCitations) {
      if (cit && cit.number) {
        const match = await judgmentRepository.checkCitationMatch(cit.number, cit.year, cit.month, cit.court, id);
        if (match && match.exists) {
          const cleanMo = cit.month ? `(${String(cit.month).padStart(2, '0')}) ` : '';
          return res.status(400).json({
            success: false,
            message: `Citation #${cit.number} for ${cit.year || '2026'} ${cleanMo}${(cit.court || 'SC').toUpperCase()} is already registered in case "${match.caseTitle}". Duplicate citations are not allowed.`
          });
        }
      }
    }

    const updatedCase = await updateCaseInDb(id, req.body);
    if (!updatedCase) {
      return res.status(404).json({ success: false, message: 'Case record not found' });
    }

    // Fire FCM push notification if updated to Published
    if (updatedCase && (updatedCase.status === 'Published' || status === 'Published')) {
      notifyMobileAppNewJudgement({
        id: updatedCase.id,
        caseNumber: updatedCase.case_number || req.body.caseNumber,
        title: updatedCase.title || req.body.title,
        petitioner: updatedCase.petitioner || req.body.petitioner,
        respondent: updatedCase.respondent || req.body.respondent,
        court: updatedCase.court || req.body.court,
        citation: updatedCase.citation || req.body.citation
      }).catch(err => logger.error('FCM notification dispatch error:', err));
    }

    res.json({ success: true, message: 'Case updated successfully', data: updatedCase });
  } catch (error) {
    logger.error(`Failed to update case ID ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Server error updating case' });
  }
};

// DELETE /api/cases/:id -> Permanently deletes case record
export const deleteCase = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCase = await deleteCaseFromDb(id);
    if (!deletedCase) {
      return res.status(404).json({ success: false, message: 'Case record not found' });
    }
    res.json({ success: true, message: 'Case deleted permanently successfully', data: deletedCase });
  } catch (error) {
    logger.error(`Failed to delete case ID ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Server error deleting case' });
  }
};

// PUT /api/cases/:id/status
export const toggleCaseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await updateCaseStatusInDb(id, status);

    if (updated && status === 'Published') {
      notifyMobileAppNewJudgement({
        id: updated.id,
        caseNumber: updated.case_number,
        title: updated.title,
        petitioner: updated.petitioner,
        respondent: updated.respondent,
        court: updated.court,
        citation: updated.citation
      }).catch(err => logger.error('FCM notification dispatch error:', err));
    }

    res.json({ success: true, message: `Case status updated to ${status}`, data: updated });
  } catch (error) {
    logger.error(`Failed to toggle status for case ID ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Server error updating status' });
  }
};
