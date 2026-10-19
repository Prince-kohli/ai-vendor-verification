const TRACKED_FIELDS = [
  'companyName',
  'contactPerson',
  'email',
  'phone',
  'address',
  'registrationNumber',
  'gstNumber',
  'bankAccountNumber',
  'ifscCode',
  'status',
];

const getFieldDiffs = (oldData, newData) => {
  const changes = [];

  TRACKED_FIELDS.forEach(field => {
    const oldVal = oldData[field] !== undefined && oldData[field] !== null ? String(oldData[field]) : '';
    const newVal = newData[field] !== undefined && newData[field] !== null ? String(newData[field]) : '';

    if (oldVal !== newVal && newData[field] !== undefined) {
      changes.push({
        field,
        previousValue: oldVal,
        newValue: newVal,
      });
    }
  });

  return changes;
};

module.exports = { getFieldDiffs };