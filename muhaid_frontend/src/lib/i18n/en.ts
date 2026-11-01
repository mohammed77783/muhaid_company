import type { Messages } from './ar';
import { plural } from './plural';

// Same shape as ar.ts. English is a first-class second language: complete sentences,
// no contractions in system messages, the same information as the Arabic.

export const en: Messages = {
  app: {
    tagline: 'Construction site inspections',
  },

  common: {
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    back: 'Back',
    retry: 'Retry',
    refresh: 'Refresh',
    edit: 'Edit',
    confirm: 'Confirm',
    search: 'Search',
    clear: 'Clear',
    remove: 'Remove',
    logout: 'Log out',
    loading: 'Loading',
    required: 'Required',
    optional: 'Optional',
    all: 'All',
    none: 'None',
    noEndDate: 'No end date',
    noResults: 'No results',
  },

  language: {
    label: 'Language',
    switchTo: 'العربية',
    switchToLabel: 'التبديل إلى العربية',
  },

  nav: {
    main: 'Main navigation',
    breadcrumbs: 'Breadcrumb',
  },

  pagination: {
    label: 'Pagination',
    previous: 'Previous page',
    next: 'Next page',
    perPage: 'Rows per page',
  },

  filters: {
    remove: 'Remove filter',
    clearAll: 'Clear filters',
  },

  answer: {
    groupLabel: 'Answer',
    noteLabel: 'Note on this finding',
    notePlaceholder: 'Describe what you found',
    noteRequired: 'Required for every No answer.',
    addNote: 'Add a note',
    optionalNoteLabel: 'Note (optional)',
  },

  photo: {
    alt: 'Inspection photo',
    take: 'Take a photo',
    helper: 'One photo, up to 5 MB',
    errorTitle: 'This photo cannot be used',
    errorBody: 'The maximum is 5 MB. Take the photo again.',
    remove: 'Remove photo',
    unavailable:
      'Photo unavailable. Its file could not be found on the server.',
    unreachable: 'The photo could not be loaded. Check the connection.',
    open: 'View the photo at full size',
    viewerTitle: 'Inspection photo',
    download: 'Download photo',
  },

  outboxEntry: {
    uploading: 'Uploading',
  },

  questionRow: {
    reorder: (n: number): string => `Reorder question ${n}`,
    remove: (n: number): string => `Remove question ${n}`,
    locked: 'Locked',
  },

  offline: {
    banner:
      'No connection. What you save stays on this device and is sent when there is a connection.',
  },

  login: {
    title: 'Log in',
    email: 'Email',
    password: 'Password',
    submit: 'Log in',
    submitting: 'Logging in',
    emailInvalid: 'Enter a valid email, such as name@example.com.',
    passwordRequired: 'Enter your password.',
    passwordTooLong: 'The password is longer than 200 characters.',
    invalidCredentials: 'The email or password is incorrect.',
    sessionEnded:
      'Your session has ended. Log in to continue. What you saved on this device is not lost.',
  },

  session: {
    expiring: (minutes: number): string =>
      plural('en', minutes, {
        zero: 'Your session ends in under a minute. What you saved on this device will not be lost.',
        one: 'Your session ends in 1 minute. What you saved on this device will not be lost.',
        other:
          'Your session ends in {n} minutes. What you saved on this device will not be lost.',
      }),
    loginAgain: 'Log in again',
  },

  wrongRole: {
    inspectorTitle: 'These pages are for inspectors',
    inspectorBody:
      'Your account is an admin account. Its pages are in the dashboard.',
    inspectorAction: 'Go to the dashboard',
    adminTitle: 'These pages are for admins',
    adminBody:
      'Your account is an inspector account. Its pages are in the inspection app.',
    adminAction: 'Go to the inspection app',
  },

  inspector: {
    sectionsLabel: 'Sections',
    forms: 'Forms',
    outbox: 'Outbox',
    sent: 'Sent',
    formsTitle: 'Assigned forms',
    outboxTitle: 'Outbox',
    sentTitle: 'Sent inspections',
  },

  forms: {
    emptyTitle: 'No forms are assigned to you',
    emptyBody: 'Ask your site administrator to assign you an inspection form.',
    expiredTitle: 'The forms saved on this device have expired',
    expiredBody: 'Connect to the internet to update your forms.',
    downloadFirst: 'Connect to the internet once to download your forms.',
    lastUpdated: (when: string): string => `Forms last updated ${when}`,
    refreshFailed:
      'The forms could not be updated. The saved copy is still available.',
  },

  outbox: {
    sentCount: (n: number): string =>
      plural('en', n, {
        one: '1 inspection sent',
        other: '{n} inspections sent',
      }),
    failedOne: (workOrder: string): string => `${workOrder} could not be sent`,
    failedCount: (n: number): string =>
      plural('en', n, { other: '{n} inspections could not be sent' }),
    view: 'View outbox',
    emptyTitle: 'Nothing is waiting to be sent',
    emptyBody: 'Everything saved on this device has been sent.',
    waitingCount: (n: number): string =>
      plural('en', n, {
        one: '1 inspection waiting',
        other: '{n} inspections waiting',
      }),
    sendNow: 'Send now',
    stuck: (n: number): string =>
      plural('en', n, {
        one: '1 inspection could not be sent. Check the reason below and follow the suggested step.',
        other:
          '{n} inspections could not be sent. Check the reasons below and follow the suggested steps.',
      }),
    reasonFormChanged:
      'The questions on this form changed after it was filled. Fill it again with the latest version.',
    reasonPhoto:
      'The server refused the photo. Take a new photo and send it again.',
    reasonTooLarge:
      'The photo is larger than the limit (5 MB). Take a new photo.',
    reasonValidation: (message: string): string =>
      `The server refused some of the data: ${message}`,
    reasonUnassigned:
      'This form is no longer assigned to you. Ask your site administrator to assign it, then retry.',
    reasonDuplicateId:
      'This inspection id is used by another record. Send it as a new inspection.',
    reasonCompleted:
      'A form for this work order was already sent. Discard this one.',
    reasonOutOfDates:
      'The form was not valid on the date it was filled. Check with your site administrator.',
    reasonOther: (message: string): string =>
      `It could not be sent: ${message}`,
    correct: 'Correct the data',
    takeNewPhoto: 'Take a new photo',
    refill: 'Fill it again',
    resubmitAsNew: 'Send as new',
    discard: 'Discard',
    discardTitle: 'Discard this inspection?',
    discardBody: (workOrder: string): string =>
      `Inspection ${workOrder} will not be sent, and its answers and photo cannot be recovered.`,
    discardConfirm: 'Discard inspection',
    editTitle: 'Correct the inspection',
    editSave: 'Save and send again',
    editSaved: 'The correction is saved on this device',
    entryGoneTitle: 'This inspection is no longer in the outbox',
    entryGoneBody: 'It may have been sent or discarded. Check the outbox.',
    backToOutbox: 'Back to the outbox',
    refillNotice:
      'The work order number and photo were kept from the earlier copy. Answer the questions on the latest version of the form.',
    logoutTitle: (n: number): string =>
      plural('en', n, {
        one: '1 inspection has not been sent yet. Log out anyway?',
        other: '{n} inspections have not been sent yet. Log out anyway?',
      }),
    logoutBody:
      'They stay saved on this device and will not be sent until you log in with your account again.',
  },

  fillForm: {
    loadingTitle: 'Filling the form',
    workOrder: 'Work order number',
    answered: 'Answered',
    progress: 'Progress',
    unanswered: 'Choose an answer for this question.',
    noteRequired: 'Write a note with every No answer.',
    noteTooLong: 'The note is longer than 1000 characters.',
    photoLabel: 'Inspection photo',
    photoRequiredTitle: 'A photo is required',
    photoTooLarge: (size: string): string =>
      `The maximum is 5 MB. This file is ${size}. Take the photo again.`,
    photoType:
      'This file is not a supported image. Use a JPEG, PNG or WebP photo.',
    preparingPhoto: 'Preparing the photo',
    save: 'Save inspection',
    saveHint: 'Saved on this device and sent when there is a connection.',
    fixErrors: 'Complete the marked fields before saving.',
    saved: 'Inspection saved on this device',
    saveFailed:
      'The inspection could not be saved on this device. Your answers are still in the form.',
    formChanged:
      'An administrator updated this form. Check the questions and answer any new ones before saving.',
    unavailableTitle: 'This form is no longer available to you',
    unavailableBody:
      'Ask your site administrator to check the form assignment.',
    outOfDateTitle: 'This form is outside its valid dates',
    outOfDateBody:
      'It cannot be filled today. Choose another form from the list.',
    backToForms: 'Back to forms',
    leaveTitle: 'Discard these answers?',
    leaveBody:
      'The answers on this form will not be saved. Forms already saved in the outbox are not affected.',
    leaveConfirm: 'Discard answers',
    keepFilling: 'Keep filling',
  },

  sent: {
    searchLabel: 'Search by work order number',
    searchHelp: 'Enter the full number, then press Search.',
    syncedLater: (delay: string): string => `Sent ${delay} later`,
    columnWorkOrder: 'Work order',
    columnTemplate: 'Template',
    columnProject: 'Project',
    columnFilledAt: 'Filled at',
    columnSync: 'Sync',
    onTime: 'On time',
    emptyTitle: 'No inspections have been sent yet',
    emptyBody:
      'What you send appears here. Anything not sent yet is in the outbox.',
    noMatchTitle: 'No inspection has this number',
    noMatchBody:
      'The search matches the whole work order number. Check the number or clear the search.',
    pastEndTitle: 'This page has no results',
    pastEndBody: 'There are fewer pages than the number in the link.',
    firstPage: 'Go to the first page',
    downloadFirst:
      'Connect to the internet to see this page. What you viewed earlier stays available.',
    notFoundTitle: 'This inspection was not found',
    notFoundBody:
      'The link may be wrong, or the inspection was not sent from your account.',
    backToList: 'Back to sent inspections',
  },

  record: {
    workOrder: 'Work order',
    template: 'Template',
    project: 'Project',
    inspector: 'Inspector',
    filledAt: 'Filled at',
    receivedAt: 'Received at',
    syncDelay: 'Waited before sending',
    photo: 'Photo',
    answers: 'Answers',
    note: 'Note',
    onlyFindings: 'Show findings only',
    noFindings: 'This inspection has no findings.',
    summaryCount: (label: string, n: number): string => `${label} ${n}`,
  },

  admin: {
    inspections: 'Inspections',
    projects: 'Projects',
    templates: 'Templates',
    users: 'Users',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    backTo: {
      inspections: 'Back to inspections',
      projects: 'Back to projects',
      templates: 'Back to templates',
      users: 'Back to users',
    },
    created: 'Created',
  },

  users: {
    add: 'Add user',
    addTitle: 'Add a user',
    editTitle: 'Edit user',
    name: 'Name',
    email: 'Email',
    emailReadOnly: 'The email cannot be changed.',
    password: 'Password',
    passwordHelp: '8 to 200 characters.',
    generate: 'Generate a password',
    generatedHelp:
      'Copy this password now and pass it on. It will not be shown after saving.',
    role: 'Role',
    status: 'Status',
    filterAll: 'All',
    filterActive: 'Active',
    filterInactive: 'Deactivated',
    emptyTitle: 'There are no users yet',
    emptyBody: 'Add a user to get started.',
    noMatchTitle: 'No users match these filters',
    noMatchBody: 'Try wider filters, or clear them.',
    notFoundTitle: 'This user was not found',
    notFoundBody: 'The link may be wrong. Check the list of users.',
    create: 'Create user',
    created: (name: string): string => `The account for ${name} was created`,
    updated: 'The changes are saved',
    nameRequired: 'Enter the name.',
    nameTooLong: 'The name is longer than 200 characters.',
    emailInvalid: 'Enter a valid email, such as name@example.com.',
    emailTaken: 'A user with this email already exists.',
    passwordInvalid: 'The password must be 8 to 200 characters.',
    promoteWarning:
      'Their assigned templates stay in place, but they can no longer use the inspection app once they are an admin.',
    selfRole: 'You cannot remove the admin role from your own account.',
    selfActive: 'You cannot deactivate your own account.',
    accountActive: 'Account active',
    resetPassword: 'Reset password',
    resetTitle: 'Reset the password',
    resetSave: 'Save password',
    resetDone: 'The new password is saved',
    deactivateTitle: (name: string): string => `Deactivate ${name}'s account?`,
    deactivateBody:
      'They will be signed out immediately and cannot be assigned new templates. Their sent inspections and existing assignments are kept, and anything unsent on their device stays there until the account is reactivated.',
    deactivateConfirm: 'Deactivate account',
    reactivateTitle: (name: string): string => `Reactivate ${name}'s account?`,
    reactivateBody: 'They will be able to log in again.',
    reactivateConfirm: 'Reactivate account',
    assignedTemplates: 'Assigned templates',
    noTemplatesTitle: 'This inspector has no assigned templates',
    noTemplatesBody: 'Assign inspectors from the template page.',
    columnProject: 'Project',
    columnTemplate: 'Template',
    columnValidity: 'Valid dates',
    columnAssigned: 'Assigned',
    columnStatus: 'Status',
  },

  projects: {
    add: 'New project',
    addTitle: 'New project',
    editTitle: 'Edit project',
    code: 'Project code',
    codeHelp: 'Letters, digits, - and _ only.',
    name: 'Project name',
    create: 'Create project',
    created: 'The project was created',
    updated: 'The changes are saved',
    codeRequired: 'Enter the project code.',
    codeTooLong: 'The project code is longer than 50 characters.',
    codeInvalid: 'Use letters, digits, - and _ only.',
    codeTaken: 'A project with this code already exists.',
    nameRequired: 'Enter the project name.',
    nameTooLong: 'The project name is longer than 200 characters.',
    codeChangeNote:
      'Photos already uploaded stay in the folder named after the old code. New photos use the new code.',
    emptyTitle: 'There are no projects yet',
    emptyBody: 'Create a project, then add inspection templates to it.',
    notFoundTitle: 'This project was not found',
    notFoundBody: 'The link may be wrong. Check the list of projects.',
    templates: 'Project templates',
    newTemplate: 'New template',
    viewInspections: 'View inspections',
    noTemplatesTitle: 'This project has no templates',
    noTemplatesBody: 'Create the first inspection template for this project.',
    selectLabel: 'Project',
    selectPlaceholder: 'Search by code or name',
  },

  templates: {
    add: 'New template',
    project: 'Project',
    allProjects: 'All projects',
    name: 'Template name',
    validFrom: 'Valid from',
    validTo: 'Valid to',
    noEndDate: 'No end date',
    status: 'Status',
    questions: 'Questions',
    questionLabel: (n: number): string => `Text of question ${n}`,
    addQuestion: 'Add a question',
    pasteHint:
      'Paste a list of several lines into any field to split it into questions.',
    pasteTruncated: (n: number): string =>
      `A template takes at most 50 questions, so ${n} of the pasted lines were not added.`,
    questionRequired: 'Enter the question, or remove this row.',
    questionTooLong: 'The question is longer than 500 characters.',
    nameRequired: 'Enter the template name.',
    nameTooLong: 'The template name is longer than 200 characters.',
    projectRequired: 'Choose a project.',
    validFromRequired: 'Choose the first valid date.',
    validToRequired: 'Choose an end date, or tick "No end date".',
    validToOrder: 'The end date cannot be before the start date.',
    replaceValidFrom: 'The new template must start after the old one started.',
    emptyTitle: 'There are no templates yet',
    emptyBody: 'Create an inspection template, then assign inspectors to it.',
    noMatchTitle: 'This project has no templates',
    noMatchBody:
      'Create a template for this project, or choose another project.',
    notFoundTitle: 'This template was not found',
    notFoundBody: 'The link may be wrong. Check the list of templates.',
    createTitle: 'New template',
    editTitle: 'Edit template',
    replaceTitle: 'Replace with a new version',
    create: 'Create template',
    created: 'The template was created',
    updated: 'The changes are saved',
    nextAssign:
      'Next: assign inspectors. Nobody sees this template until then.',
    lockedNote:
      'The questions are locked because inspections have been submitted.',
    lockedBanner: (n: number): string =>
      plural('en', n, {
        one: 'The questions are locked: 1 inspection uses this template. To change them, create a new version.',
        other:
          'The questions are locked: {n} inspections use this template. To change them, create a new version.',
      }),
    lockedRace:
      'An inspection arrived while you were editing, so nothing was saved and the questions are now locked. Save again without question changes, or create a new version.',
    duplicate: 'Duplicate',
    replace: 'Replace with a new version',
    replaceNote:
      'A new template is created, active inspectors are assigned to it, and the old template ends the day before the new one starts.',
    replaceSubmit: 'Create and replace',
    stepCreate: 'Create the new template',
    stepAssign: 'Assign the active inspectors',
    stepEndOld: 'End the old template',
    stepDone: 'Done',
    stepFailed: 'Not completed',
    stepWaiting: 'Not started',
    replaceFailed: 'Not every step finished. Try again to complete the rest.',
    replaceContinue: 'Complete the remaining steps',
    replaced: 'The template was replaced with the new version',
    riskTitle: 'Save these changes?',
    riskQuestions:
      'Inspectors who already opened this form will need to refresh it, and unsent forms based on the old questions will be rejected.',
    riskDates:
      'Forms filled outside the new dates will be rejected when they sync.',
    riskConfirm: 'Save changes',
    inspectionsCount: (n: number): string =>
      plural('en', n, {
        zero: 'No inspections submitted',
        one: '1 inspection submitted',
        other: '{n} inspections submitted',
      }),
    viewInspections: 'View inspections',
    assignees: 'Assigned inspectors',
    submittedAt: (date: string): string => `Submitted ${date}`,
    assign: 'Assign inspectors',
    assignTitle: 'Assign inspectors',
    assignSubmit: (n: number): string =>
      plural('en', n, {
        zero: 'Assign',
        one: 'Assign 1 inspector',
        other: 'Assign {n} inspectors',
      }),
    assignSearch: 'Filter by name or email',
    alreadyAssigned: 'Assigned',
    noCandidates: 'There are no active inspectors.',
    invalidAssignee: 'Deactivated or no longer an inspector',
    invalidAssignees:
      'Nobody was assigned: some of the people you chose are deactivated or no longer inspectors, and they have been deselected. Try again.',
    assigned: 'The assignment is saved',
    noAssigneesTitle: 'No inspectors are assigned',
    noAssigneesBody: 'Nobody sees this template until you assign inspectors.',
    removeAssignee: (name: string): string =>
      `Remove ${name} from this template`,
    removeTitle: (name: string): string => `Remove ${name} from this template?`,
    removeBody:
      'Forms they have filled but not yet sent will be rejected. Inspections they already sent are kept.',
    removeConfirm: 'Remove from template',
  },

  inspections: {
    workOrder: 'Work order',
    project: 'Project',
    template: 'Template',
    inspector: 'Inspector',
    from: 'From',
    to: 'To',
    filledAt: 'Filled at',
    receivedAt: 'Received at',
    syncDelay: 'Sync',
    onTime: 'On time',
    late: (delay: string): string => `${delay} late`,
    allFilter: 'All',
    searchPlaceholder: 'Search by name',
    workOrderHelp: 'The full number, then Enter.',
    toBeforeFrom: 'This date is before the "From" date.',
    emptyTitle: 'There are no inspections yet',
    emptyBody: 'Inspections appear here once inspectors send them.',
    noMatchTitle: 'No inspections match these filters',
    noMatchBody: 'Try wider filters, or clear them.',
    notFoundTitle: 'This inspection was not found',
    notFoundBody: 'The link may be wrong. Check the list of inspections.',
    print: 'Print',
    tagProject: (value: string): string => `Project: ${value}`,
    tagTemplate: (value: string): string => `Template: ${value}`,
    tagInspector: (value: string): string => `Inspector: ${value}`,
    tagWorkOrder: (value: string): string => `Work order: ${value}`,
  },

  status: {
    yes: 'Yes',
    no: 'No',
    na: 'N/A',
    pending: 'Pending',
    sending: 'Sending',
    sent: 'Sent',
    failed: 'Failed',
    upcoming: 'Upcoming',
    active: 'Active',
    ended: 'Ended',
    userActive: 'Active',
    deactivated: 'Deactivated',
  },

  roles: {
    admin: 'Admin',
    inspector: 'Inspector',
  },

  errors: {
    network:
      'The server cannot be reached. Check the connection and try again.',
    server:
      'The request could not be completed because of a server error. Try again shortly.',
    forbidden: 'You do not have permission for this action.',
    unexpected: 'The request could not be completed.',
    notFoundTitle: 'Page not found',
    notFoundBody:
      'The link may be wrong, or the record is no longer available to you.',
    loadFailedTitle: 'This page could not be loaded',
    goHome: 'Go to the home page',
  },

  counts: {
    results: (n: number): string =>
      plural('en', n, {
        zero: 'No results',
        one: '1 result',
        other: '{n} results',
      }),
    questions: (n: number): string =>
      plural('en', n, { one: '1 question', other: '{n} questions' }),
  },
};
