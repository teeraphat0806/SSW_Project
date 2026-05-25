export function getCurrentBuddhistYear() {
  return new Date().getFullYear() + 543;
}

export function withBuddhistYearPrefix(sequenceNo: number) {
  return Number(`${getCurrentBuddhistYear()}${sequenceNo}`);
}
