export const DEPARTMENTS = [
  'Software Engineering',
  'Information Technology Engineering',
  'Electronics and Communication Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Architecture Engineering',
  'Instrumentation and Control Engineering',
  'Geology Engineering',
  'Water Resource Engineering'
];

export const POSITIONS = {
  CHIEF_COUNCILLOR: {
    name: 'Chief councillor',
    totalSeats: 1,
    maleSeats: 1,
    femaleSeats: 1
  },
  DEPUTY_CHIEF_COUNCILLOR: {
    name: 'Deputy Chief councillor',
    totalSeats: 2,
    maleSeats: 1,
    femaleSeats: 1
  },
  BLOCK_COUNCILLOR: {
    name: 'Block councillor',
    totalSeats: 8,
    maleSeats: 4,
    femaleSeats: 4
  },
  GAMES_COUNCILLOR: {
    name: 'Games councillor',
    totalSeats: 2,
    maleSeats: 1,
    femaleSeats: 1
  },
  ACADEMIC_COUNCILLOR: {
    name: 'College Academic councillor',
    totalSeats: 2,
    maleSeats: 1,
    femaleSeats: 1
  }
};

export const VOTE_RULES = {
  SINGLE_VOTE_POSITIONS: ['Chief councillor'],
  GENDER_SPECIFIC_VOTING: true,
  DEPARTMENT_SPECIFIC_VOTING: true
};

export const EMAIL_REGEX = /^\d{8}\.cst@rub\.edu\.bt$/;
export const STUDENT_ID_REGEX = /^\d{8}$/;

export const AUTH_ERRORS = {
  INVALID_EMAIL: 'Invalid email format. Use your college email (12345678.cst@rub.edu.bt)',
  INVALID_STUDENT_ID: 'Invalid student ID format. Must be 8 digits',
  INVALID_PASSWORD: 'Password must be at least 8 characters with uppercase, number and special character',
  PASSWORDS_DONT_MATCH: 'Passwords do not match',
  USER_NOT_FOUND: 'No user found with this email',
  INCORRECT_PASSWORD: 'Invalid password',
  NOT_AUTHORIZED: 'You are not authorized to access this resource',
  SESSION_EXPIRED: 'Your session has expired. Please login again'
};

export const VOTE_ERRORS = {
  ALREADY_VOTED: 'You have already voted for this position',
  GENDER_LIMIT: 'You have reached the voting limit for this gender',
  POSITION_LIMIT: 'You have reached the voting limit for this position',
  VOTING_CLOSED: 'Voting is currently closed',
  INVALID_CANDIDATE: 'Invalid candidate selection'
};

export const SMS_TEMPLATES = {
  VOTE_CONFIRMATION: 'Thank you for voting in the CST Student Council Elections!',
  PASSWORD_RESET: 'Your CST Votes password reset code is: {code}',
  TWO_FACTOR: 'Your CST Votes verification code is: {code}'
};

export const EMAIL_TEMPLATES = {
  VOTE_CONFIRMATION: {
    subject: 'Vote Confirmation - CST Elections',
    text: 'Thank you for participating in the CST Student Council Elections!'
  },
  PASSWORD_RESET: {
    subject: 'Password Reset - CST Votes',
    text: 'Click the link below to reset your password:'
  },
  TWO_FACTOR: {
    subject: 'Login Verification - CST Votes',
    text: 'Your verification code is: {code}'
  }
};

export const AUDIT_ACTIONS = {
  USER_LOGIN: 'User Login',
  USER_REGISTER: 'User Registration',
  PASSWORD_RESET: 'Password Reset',
  VOTE_CAST: 'Vote Cast',
  CANDIDATE_ADD: 'Candidate Added',
  CANDIDATE_UPDATE: 'Candidate Updated',
  CANDIDATE_DELETE: 'Candidate Deleted',
  POSITION_UPDATE: 'Position Updated',
  SETTINGS_UPDATE: 'Settings Updated',
  ELECTION_RESET: 'Election Reset'
};