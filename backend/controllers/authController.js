import userRepository from '../repositories/userRepository.js';
import logger from '../utils/logger.js';
import bcrypt from 'bcrypt';

export const login = async (req, res) => {
  try {
    const { mobile, mpin } = req.body;

    if (!mobile || !mpin) {
      return res.status(400).json({
        status: 'error',
        message: 'Mobile number and 4-digit MPIN are required.'
      });
    }

    if (!/^\d{10}$/.test(String(mobile).trim())) {
      return res.status(400).json({
        status: 'error',
        message: 'Enter a valid 10-digit mobile number.'
      });
    }

    if (!/^\d{4}$/.test(String(mpin).trim())) {
      return res.status(400).json({
        status: 'error',
        message: 'MPIN must be exactly 4 digits.'
      });
    }

    const cleanMobile = String(mobile).trim();
    const cleanMpin = String(mpin).trim();

    const user = await userRepository.findByMobile(cleanMobile);

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid mobile number or MPIN.'
      });
    }

    if (!user.password_hash) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is not configured for MPIN login.'
      });
    }

    const isValidMpin = await bcrypt.compare(
      cleanMpin,
      user.password_hash
    );

    if (!isValidMpin) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid mobile number or MPIN.'
      });
    }

    const updatedUser = await userRepository.updateUserLogin(cleanMobile);

    return res.json({
      status: 'success',
      message: 'Login successful',
      user: updatedUser
    });

  } catch (error) {
    logger.error('Login error', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const signup = async (req, res) => {
  try {
    const { name, mobile, dob, mpin } = req.body;

    if (!name || !mobile || !mpin || !dob) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, Mobile number, DOB and 4-digit MPIN are required.'
      });
    }

    const cleanName = String(name).trim();
    const cleanMobile = String(mobile).trim();
    const cleanMpin = String(mpin).trim();
    const cleanDob = String(dob).trim();

    if (!cleanName) {
      return res.status(400).json({
        status: 'error',
        message: 'Name is required.'
      });
    }

    if (!/^\d{10}$/.test(cleanMobile)) {
      return res.status(400).json({
        status: 'error',
        message: 'Enter a valid 10-digit mobile number.'
      });
    }

    if (!/^\d{4}$/.test(cleanMpin)) {
      return res.status(400).json({
        status: 'error',
        message: 'MPIN must be exactly 4 digits.'
      });
    }

    let postgresDob = null;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanDob)) {
      const [day, month, year] = cleanDob.split('/');
      postgresDob = `${year}-${month}-${day}`;
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDob)) {
      postgresDob = cleanDob;
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Enter a valid date of birth (DD/MM/YYYY).'
      });
    }

    const existingUser = await userRepository.findByMobile(cleanMobile);

    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Mobile number already registered. Please Login.'
      });
    }

    const passwordHash = await bcrypt.hash(cleanMpin, 10);

    const newUser = await userRepository.createUser({
      name: cleanName,
      mobile: cleanMobile,
      email: null,
      password_hash: passwordHash,
      dob: postgresDob
    });

    return res.status(201).json({
      status: 'success',
      message: 'Registration successful',
      user: newUser
    });

  } catch (error) {
    logger.error('Signup error', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const resetMpin = async (req, res) => {
  try {
    const { mobile, dob, newMpin } = req.body;

    if (!mobile || !dob || !newMpin) {
      return res.status(400).json({
        status: 'error',
        message: 'Mobile number, Date of Birth, and new 4-digit MPIN are required.'
      });
    }

    const cleanMobile = String(mobile).trim();
    const cleanDob = String(dob).trim();
    const cleanMpin = String(newMpin).trim();

    if (!/^\d{10}$/.test(cleanMobile)) {
      return res.status(400).json({
        status: 'error',
        message: 'Enter a valid 10-digit mobile number.'
      });
    }

    if (!/^\d{4}$/.test(cleanMpin)) {
      return res.status(400).json({
        status: 'error',
        message: 'New MPIN must be exactly 4 digits.'
      });
    }

    const newPasswordHash = await bcrypt.hash(cleanMpin, 10);

    const result = await userRepository.verifyAndResetMpin(cleanMobile, cleanDob, newPasswordHash);

    if (!result.success) {
      if (result.reason === 'not_found') {
        return res.status(404).json({
          status: 'error',
          message: 'Mobile number not found. Please register first.'
        });
      }
      return res.status(400).json({
        status: 'error',
        message: 'Date of Birth does not match our records.'
      });
    }

    return res.json({
      status: 'success',
      message: 'MPIN reset successfully. You are now logged in.',
      user: result.user
    });

  } catch (error) {
    logger.error('Reset MPIN error', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};
export const getSavedCases = async (req, res) => {
  try {
    const { identifier } = req.params;
    const cases = await userRepository.getSavedCases(identifier);
    res.json({ status: 'success', data: cases });
  } catch (error) {
    logger.error('getSavedCases error', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch saved cases' });
  }
};

export const saveCases = async (req, res) => {
  try {
    const { identifier, cases } = req.body;
    if (!identifier) {
      return res.status(400).json({ status: 'error', message: 'User identifier required' });
    }
    const updated = await userRepository.saveCasesForUser(identifier, cases || []);
    res.json({ status: 'success', data: updated });
  } catch (error) {
    logger.error('saveCases error', error);
    res.status(500).json({ status: 'error', message: 'Failed to save cases' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const { identifier } = req.params;
    if (!identifier) {
      return res.status(400).json({ status: 'error', message: 'User identifier required' });
    }
    const user = await userRepository.findProfileByIdentifier(identifier);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User profile not found' });
    }
    res.json({ status: 'success', data: user });
  } catch (error) {
    logger.error('getProfile error', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch user profile' });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const { identifier } = req.params;
    if (!identifier) {
      return res.status(400).json({ status: 'error', message: 'User identifier required' });
    }

    const success = await userRepository.deleteUserAccount(identifier);
    if (!success) {
      return res.status(404).json({ status: 'error', message: 'Account not found or could not be deleted.' });
    }

    return res.json({
      status: 'success',
      message: 'Account permanently deleted from the database.'
    });
  } catch (error) {
    logger.error('deleteAccount error', error);
    if (error.message && error.message.includes('Main Admin')) {
      return res.status(403).json({ status: 'error', message: error.message });
    }
    return res.status(500).json({ status: 'error', message: 'Failed to delete account from database.' });
  }
};


