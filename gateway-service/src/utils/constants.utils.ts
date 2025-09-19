export const tableNames = {
    user: 'User' as const
}

export const kafkaTopics = {
    'register': 'register',
    'bill': 'bill',
    'notify': 'notify'
}

export const kafkaGroupIDs = {
  'insertion': 'insertion',
  'billing': 'billing',
  'notification': 'notification'
}