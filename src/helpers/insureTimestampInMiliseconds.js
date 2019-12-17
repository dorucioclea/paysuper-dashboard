export default function insureTimestampInMiliseconds(timestamp) {
  const { length } = String(timestamp);
  if (!timestamp || (length !== 10 && length !== 10)) {
    return null;
  }

  if (length === 10) {
    return Number(timestamp) * 1000;
  }

  return Number(timestamp);
}
