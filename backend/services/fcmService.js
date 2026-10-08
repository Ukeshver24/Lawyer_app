import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, '../config/firebase-service-account.json');

let firebaseApp = null;
let messaging = null;

// Initialize Firebase Admin SDK using ES module exports
try {
  if (fs.existsSync(serviceAccountPath)) {
    const rawData = fs.readFileSync(serviceAccountPath, 'utf8');
    const serviceAccount = JSON.parse(rawData);

    if (getApps().length === 0) {
      firebaseApp = initializeApp({
        credential: cert(serviceAccount)
      });
    } else {
      firebaseApp = getApps()[0];
    }

    messaging = getMessaging(firebaseApp);
    logger.info(`🔥 Firebase Admin SDK Initialized Successfully for project: ${serviceAccount.project_id || 'law-reporter-bad36'}`);
  } else {
    logger.warn('⚠️ firebase-service-account.json not found in backend/config/. Firebase FCM notifications will be skipped.');
  }
} catch (err) {
  logger.error('❌ Failed to initialize Firebase Admin SDK:', err);
}

/**
 * Send Push Notification to all Mobile App users via FCM topic 'all_judgments'
 * @param {Object} caseDetails - Details of the newly published judgment
 */
export const notifyMobileAppNewJudgement = async (caseDetails = {}) => {
  if (!messaging) {
    logger.warn('⚠️ Firebase messaging is not initialized. Mobile notification skipped.');
    return { success: false, reason: 'Firebase not initialized' };
  }

  const {
    id,
    caseId = id,
    caseNumber = '',
    title = '',
    petitioner = '',
    respondent = '',
    court = '',
    court_name = court,
    citation = ''
  } = caseDetails;

  // Build clean display title & body
  let displayTitle = title;
  if (!displayTitle && (petitioner || respondent)) {
    displayTitle = `${petitioner || 'Petitioner'} vs ${respondent || 'Respondent'}`.trim();
  }
  if (!displayTitle) {
    displayTitle = caseNumber ? `Case ${caseNumber}` : 'New Judgment Published';
  }

  const courtDisplay = court_name || court || 'Supreme / High Court';
  const citationDisplay = citation ? ` [${citation}]` : '';
  const bodyText = `${displayTitle} - ${courtDisplay}${citationDisplay}`;

  const message = {
    notification: {
      title: '🏛️ New Judgement Published',
      body: bodyText
    },
    data: {
      caseId: String(caseId || ''),
      caseNumber: String(caseNumber || ''),
      title: String(displayTitle),
      court: String(courtDisplay),
      citation: String(citation || ''),
      type: 'NEW_JUDGEMENT',
      click_action: 'FLUTTER_NOTIFICATION_CLICK'
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'dlr_legal_updates_channel',
        priority: 'high',
        sound: 'default',
        defaultVibrateTimings: true,
        defaultSound: true
      }
    },
    apns: {
      payload: {
        aps: {
          alert: {
            title: '🏛️ New Judgement Published',
            body: bodyText
          },
          sound: 'default',
          badge: 1,
          contentAvailable: true
        }
      }
    },
    topic: 'all_judgments'
  };

  try {
    const response = await messaging.send(message);
    logger.info(`📱 Mobile Push Notification sent successfully via FCM. MessageId: ${response}`);
    return { success: true, messageId: response };
  } catch (error) {
    logger.error('❌ Failed to send FCM Mobile Push Notification:', error);
    return { success: false, error: error.message };
  }
};

export default {
  notifyMobileAppNewJudgement
};
