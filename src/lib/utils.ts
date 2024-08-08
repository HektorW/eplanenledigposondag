export function print24HourTime(minutes: number): string {
  const decimal = minutes / 60
  
  const formattedHours = Math.floor(decimal)
  const formattedMinutes = (decimal - formattedHours) * 60

  return `${formattedHours}:${formattedMinutes === 0 ? '00' : formattedMinutes}`
}

export function getNextSundayDate(fromDate = new Date()) {
  const nextSunday = new Date(fromDate)
  
  const sundayDayIndex = 0
  const nextSundayAtHour = 19
  if (
    fromDate.getDay() !== sundayDayIndex ||
    fromDate.getHours() >= nextSundayAtHour
  ) {
    nextSunday.setDate(fromDate.getDate() + (7 - fromDate.getDay()))
  }

  return nextSunday
}