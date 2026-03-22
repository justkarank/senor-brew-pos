const BUSINESS_UTC_OFFSET = '+05:30';
const BUSINESS_UTC_OFFSET_MINUTES = 330;

const shiftToBusinessTime = (date = new Date()) =>
  new Date(date.getTime() + BUSINESS_UTC_OFFSET_MINUTES * 60 * 1000);

const getBusinessDateKey = (date = new Date()) =>
  shiftToBusinessTime(date).toISOString().slice(0, 10);

const getBusinessDayRange = (date = new Date()) => {
  const dateKey = getBusinessDateKey(date);
  const start = new Date(`${dateKey}T00:00:00.000${BUSINESS_UTC_OFFSET}`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { dateKey, start, end };
};

const getBusinessDayOrderFilter = (date = new Date()) => {
  const { dateKey, start, end } = getBusinessDayRange(date);

  return {
    $or: [
      { orderDateKey: dateKey },
      {
        orderDateKey: { $exists: false },
        createdAt: { $gte: start, $lt: end }
      }
    ]
  };
};

const getBusinessHour = (date) => shiftToBusinessTime(new Date(date)).getUTCHours();

module.exports = {
  BUSINESS_UTC_OFFSET,
  getBusinessDateKey,
  getBusinessDayRange,
  getBusinessDayOrderFilter,
  getBusinessHour
};
