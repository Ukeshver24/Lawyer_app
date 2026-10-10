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
  let serviceAccount = null;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
      serviceAccount = JSON.parse(decoded);
    } catch (e) {
      logger.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64:', e);
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      logger.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', e);
    }
  } else if (fs.existsSync(serviceAccountPath)) {
    const rawData = fs.readFileSync(serviceAccountPath, 'utf8');
    serviceAccount = JSON.parse(rawData);
  }

  if (serviceAccount) {
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
    logger.warn('⚠️ Firebase credentials not found (checked file and environment variables). Firebase FCM notifications will be skipped.');
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
